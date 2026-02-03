import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;
const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(process.cwd(), 'projects');
const TEMPLATE_DIR = process.env.TEMPLATE_DIR || path.join(process.cwd(), '..', '..', 'packages', 'expo-template');

// Active Expo processes
const expoProcesses = new Map<string, ChildProcess>();
const projectUrls = new Map<string, { webUrl: string; expoUrl: string }>();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', projects: expoProcesses.size });
});

// Create/Update project files
app.post('/api/projects/:projectId/files', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { files } = req.body;

    if (!files || typeof files !== 'object') {
      return res.status(400).json({ error: 'Files object required' });
    }

    const projectDir = path.join(PROJECTS_DIR, projectId);

    // Initialize project from template if new
    if (!await fs.pathExists(projectDir)) {
      console.log(`Initializing project ${projectId} from template...`);
      
      if (await fs.pathExists(TEMPLATE_DIR)) {
        await fs.copy(TEMPLATE_DIR, projectDir);
      } else {
        // Create minimal structure if template doesn't exist
        await fs.ensureDir(projectDir);
      }
    }

    // Write files
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(projectDir, filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content as string);
    }

    // Notify WebSocket clients
    io.to(projectId).emit('files-updated', { files: Object.keys(files) });

    console.log(`Updated ${Object.keys(files).length} files for project ${projectId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('File update error:', error);
    res.status(500).json({ error: 'Failed to update files' });
  }
});

// Start Expo dev server for a project
app.post('/api/projects/:projectId/start', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(PROJECTS_DIR, projectId);

    if (!await fs.pathExists(projectDir)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Kill existing process if any
    if (expoProcesses.has(projectId)) {
      console.log(`Stopping existing Expo server for ${projectId}`);
      const existingProcess = expoProcesses.get(projectId);
      existingProcess?.kill();
      expoProcesses.delete(projectId);
    }

    // Install dependencies if needed
    const nodeModulesPath = path.join(projectDir, 'node_modules');
    if (!await fs.pathExists(nodeModulesPath)) {
      console.log(`Installing dependencies for ${projectId}...`);
      await new Promise<void>((resolve, reject) => {
        const install = spawn('npm', ['install'], { cwd: projectDir });
        install.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`npm install failed with code ${code}`));
        });
      });
    }

    // Start Expo
    console.log(`Starting Expo server for ${projectId}...`);
    const expo = spawn('npx', ['expo', 'start', '--web', '--port', '0'], {
      cwd: projectDir,
      env: { ...process.env, CI: '1' },
    });

    expoProcesses.set(projectId, expo);

    let webUrl = '';
    let expoUrl = '';

    expo.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log(`[${projectId}] ${output}`);

      // Extract URLs
      const webMatch = output.match(/http:\/\/localhost:\d+/);
      if (webMatch && !webUrl) {
        webUrl = webMatch[0];
        projectUrls.set(projectId, { webUrl, expoUrl });
        io.to(projectId).emit('preview-ready', { webUrl, expoUrl });
      }

      const expoMatch = output.match(/exp:\/\/[\w.-]+:\d+/);
      if (expoMatch && !expoUrl) {
        expoUrl = expoMatch[0];
        projectUrls.set(projectId, { webUrl, expoUrl });
        io.to(projectId).emit('preview-ready', { webUrl, expoUrl });
      }
    });

    expo.stderr?.on('data', (data) => {
      console.error(`[${projectId}] ${data}`);
      io.to(projectId).emit('error', { message: data.toString() });
    });

    expo.on('close', (code) => {
      console.log(`Expo server for ${projectId} exited with code ${code}`);
      expoProcesses.delete(projectId);
      projectUrls.delete(projectId);
    });

    res.json({ success: true, message: 'Expo server starting...' });
  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({ error: 'Failed to start Expo server' });
  }
});

// Stop Expo server
app.post('/api/projects/:projectId/stop', (req, res) => {
  const { projectId } = req.params;

  if (expoProcesses.has(projectId)) {
    expoProcesses.get(projectId)?.kill();
    expoProcesses.delete(projectId);
    projectUrls.delete(projectId);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'No running server found' });
  }
});

// Get preview URLs
app.get('/api/projects/:projectId/preview', (req, res) => {
  const { projectId } = req.params;
  const urls = projectUrls.get(projectId);

  res.json({
    webUrl: urls?.webUrl || null,
    expoUrl: urls?.expoUrl || null,
    status: expoProcesses.has(projectId) ? 'running' : 'stopped',
  });
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-project', (projectId: string) => {
    socket.join(projectId);
    console.log(`Client ${socket.id} joined project ${projectId}`);

    // Send current status
    const urls = projectUrls.get(projectId);
    if (urls) {
      socket.emit('preview-ready', urls);
    }
  });

  socket.on('leave-project', (projectId: string) => {
    socket.leave(projectId);
    console.log(`Client ${socket.id} left project ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Cleanup on shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down preview server...');
  expoProcesses.forEach((process, projectId) => {
    console.log(`Stopping Expo server for ${projectId}`);
    process.kill();
  });
  server.close();
  process.exit(0);
});

// Ensure projects directory exists
fs.ensureDirSync(PROJECTS_DIR);

server.listen(PORT, () => {
  console.log(`Preview server running on port ${PORT}`);
  console.log(`Projects directory: ${PROJECTS_DIR}`);
});
