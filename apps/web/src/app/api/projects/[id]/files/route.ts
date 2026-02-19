import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getLanguageFromPath } from '@/lib/language';

interface FileUpdate {
  path: string;
  content: string;
  language?: string;
}

// Save/update multiple files
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { files } = body as { files: FileUpdate[] };
    
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Files array required' }, { status: 400 });
    }
    
    // Upsert files (insert or update on conflict)
    const upsertData = files.map(file => ({
      project_id: projectId,
      path: file.path,
      content: file.content,
      language: file.language || getLanguageFromPath(file.path),
    }));
    
    const { error: upsertError } = await supabase
      .from('project_files')
      .upsert(upsertData, {
        onConflict: 'project_id,path',
      });
    
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
    
    // Update project's updated_at timestamp
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId);
    
    return NextResponse.json({ 
      success: true, 
      savedCount: files.length 
    });
    
  } catch (error) {
    console.error('Save files error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const body = await request.json();
    const { path, content = '', language } = body;
    
    if (!path) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }
    
    // Check if file already exists
    const { data: existingFile } = await supabase
      .from('project_files')
      .select('id')
      .eq('project_id', projectId)
      .eq('path', path)
      .single();
    
    if (existingFile) {
      return NextResponse.json({ error: 'File already exists' }, { status: 409 });
    }
    
    // Create new file
    const { data: file, error: createError } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        path,
        content,
        language: language || getLanguageFromPath(path),
      })
      .select()
      .single();
    
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    
    return NextResponse.json({ file }, { status: 201 });
    
  } catch (error) {
    console.error('Create file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }
    
    // Delete the file
    const { error: deleteError } = await supabase
      .from('project_files')
      .delete()
      .eq('project_id', projectId)
      .eq('path', path);
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


