import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get project
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Get project files
    const { data: files } = await supabase
      .from('project_files')
      .select('path, content')
      .eq('project_id', id);
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files to export' }, { status: 400 });
    }
    
    // Create ZIP
    const zip = new JSZip();
    
    // Add all project files
    files.forEach(file => {
      zip.file(file.path, file.content);
    });
    
    // Add README
    const readme = `# ${project.name}

Exported from Rork AI Mobile App Builder

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npx expo start
   \`\`\`

3. Scan the QR code with Expo Go on your device

## Build for Production

\`\`\`bash
npx expo build:android
npx expo build:ios
\`\`\`

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
`;
    zip.file('README.md', readme);
    
    // Generate ZIP buffer
    const content = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });
    
    // Return ZIP file (convert Buffer to Uint8Array for Response compatibility)
    return new NextResponse(new Uint8Array(content), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.zip"`,
      },
    });
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
