import { Octokit } from '@octokit/rest';

interface SyncOptions {
  repoName?: string;
  commitMessage?: string;
  branch?: string;
  isPrivate?: boolean;
}

export async function syncToGitHub(
  accessToken: string,
  projectName: string,
  files: Record<string, string>,
  options: SyncOptions = {}
) {
  const octokit = new Octokit({ auth: accessToken });
  
  const {
    repoName = slugify(projectName),
    commitMessage = 'Update from Rork',
    branch = 'main',
    isPrivate = true,
  } = options;
  
  // Get authenticated user
  const { data: user } = await octokit.users.getAuthenticated();
  
  // Check if repo exists
  let repoExists = false;
  try {
    await octokit.repos.get({
      owner: user.login,
      repo: repoName,
    });
    repoExists = true;
  } catch {
    repoExists = false;
  }
  
  // Create repo if it doesn't exist
  if (!repoExists) {
    await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      private: isPrivate,
      auto_init: true,
      description: `Mobile app built with Rork AI`,
    });
    
    // Wait a moment for repo to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Get current commit SHA
  const { data: ref } = await octokit.git.getRef({
    owner: user.login,
    repo: repoName,
    ref: `heads/${branch}`,
  });
  
  const currentCommitSha = ref.object.sha;
  
  // Get current tree
  const { data: commit } = await octokit.git.getCommit({
    owner: user.login,
    repo: repoName,
    commit_sha: currentCommitSha,
  });
  
  // Create blobs for all files
  const blobs = await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      const { data: blob } = await octokit.git.createBlob({
        owner: user.login,
        repo: repoName,
        content: Buffer.from(content).toString('base64'),
        encoding: 'base64',
      });
      return { path, sha: blob.sha };
    })
  );
  
  // Create new tree
  const { data: tree } = await octokit.git.createTree({
    owner: user.login,
    repo: repoName,
    base_tree: commit.tree.sha,
    tree: blobs.map(({ path, sha }) => ({
      path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha,
    })),
  });
  
  // Create new commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner: user.login,
    repo: repoName,
    message: commitMessage,
    tree: tree.sha,
    parents: [currentCommitSha],
  });
  
  // Update ref
  await octokit.git.updateRef({
    owner: user.login,
    repo: repoName,
    ref: `heads/${branch}`,
    sha: newCommit.sha,
  });
  
  return {
    repoUrl: `https://github.com/${user.login}/${repoName}`,
    commitSha: newCommit.sha,
    commitUrl: `https://github.com/${user.login}/${repoName}/commit/${newCommit.sha}`,
  };
}

export async function importFromGitHub(
  accessToken: string,
  owner: string,
  repo: string,
  branch = 'main'
): Promise<Record<string, string>> {
  const octokit = new Octokit({ auth: accessToken });
  
  // Get tree
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  
  const { data: commit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: ref.object.sha,
  });
  
  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: commit.tree.sha,
    recursive: 'true',
  });
  
  // Fetch all file contents
  const files: Record<string, string> = {};
  
  const relevantFiles = tree.tree.filter(
    item => item.type === 'blob' && 
    !item.path?.startsWith('.git') &&
    !item.path?.includes('node_modules')
  );
  
  await Promise.all(
    relevantFiles.map(async (item) => {
      if (!item.sha || !item.path) return;
      
      try {
        const { data: blob } = await octokit.git.getBlob({
          owner,
          repo,
          file_sha: item.sha,
        });
        
        // Decode base64 content
        const content = Buffer.from(blob.content, 'base64').toString('utf-8');
        files[item.path] = content;
      } catch (error) {
        console.error(`Failed to fetch ${item.path}:`, error);
      }
    })
  );
  
  return files;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
