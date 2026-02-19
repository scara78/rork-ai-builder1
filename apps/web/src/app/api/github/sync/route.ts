import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncToGitHub, importFromGitHub } from '@/lib/github';
import { getLanguageFromPath } from '@/lib/language';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { projectName, files, repoName, commitMessage, isPrivate = true } = body;
    
    if (!projectName || !files || Object.keys(files).length === 0) {
      return NextResponse.json(
        { error: 'Project name and files are required' },
        { status: 400 }
      );
    }
    
    // Get user's GitHub token from settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('github_token')
      .eq('user_id', user.id)
      .single();
    
    const githubToken = settings?.github_token;
    
    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured. Go to Settings to add your GitHub token.' },
        { status: 400 }
      );
    }
    
    // Sync to GitHub
    const result = await syncToGitHub(githubToken, projectName, files, {
      repoName,
      commitMessage,
      isPrivate,
    });
    
    return NextResponse.json({
      success: true,
      ...result,
    });
    
  } catch (error) {
    console.error('GitHub sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync to GitHub' },
      { status: 500 }
    );
  }
}

// Import from GitHub
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { owner, repo, branch = 'main', projectId } = body;
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Owner and repo are required' },
        { status: 400 }
      );
    }
    
    // Get user's GitHub token from settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('github_token')
      .eq('user_id', user.id)
      .single();
    
    const githubToken = settings?.github_token;
    
    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured. Go to Settings to add your GitHub token.' },
        { status: 400 }
      );
    }
    
    // Import from GitHub
    const files = await importFromGitHub(githubToken, owner, repo, branch);
    
    // If a projectId was supplied, persist the imported files to the DB
    if (projectId) {
      // Verify the project belongs to this user
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();
      
      if (project) {
        const upsertData = Object.entries(files).map(([path, content]) => ({
          project_id: projectId,
          path,
          content,
          language: getLanguageFromPath(path),
        }));
        
        if (upsertData.length > 0) {
          await supabase
            .from('project_files')
            .upsert(upsertData, { onConflict: 'project_id,path' });
          
          await supabase
            .from('projects')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', projectId);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      files,
      fileCount: Object.keys(files).length,
    });
    
  } catch (error) {
    console.error('GitHub import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import from GitHub' },
      { status: 500 }
    );
  }
}


