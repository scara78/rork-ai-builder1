import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    // Return defaults if no settings exist
    if (error || !settings) {
      return NextResponse.json({
        settings: {
          user_id: user.id,
          preferred_model: 'claude',
          theme: 'dark',
          github_connected: false,
          expo_connected: false,
        }
      });
    }
    
    return NextResponse.json({
      settings: {
        ...settings,
        // Don't expose actual tokens, just whether they're set
        github_connected: !!settings.github_token,
        expo_connected: !!settings.expo_token,
        github_token: undefined,
        expo_token: undefined,
      }
    });
    
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { preferred_model, theme, github_token, expo_token } = body;
    
    // Build update object with ONLY the fields the caller provided
    const updateData: Record<string, string> = {};
    if (preferred_model !== undefined) updateData.preferred_model = preferred_model;
    if (theme !== undefined) updateData.theme = theme;
    if (github_token !== undefined) updateData.github_token = github_token;
    if (expo_token !== undefined) updateData.expo_token = expo_token;

    // Try to update the existing row first
    const { data: existing } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    let settingsQuery;
    if (existing) {
      // Row exists — update only the provided fields
      settingsQuery = supabase
        .from('user_settings')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      // New user — insert with defaults for any missing fields
      settingsQuery = supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          preferred_model: updateData.preferred_model ?? 'claude',
          theme: updateData.theme ?? 'dark',
          github_token: updateData.github_token ?? null,
          expo_token: updateData.expo_token ?? null,
        })
        .select()
        .single();
    }

    const { data: settings, error } = await settingsQuery;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      settings: {
        ...settings,
        github_connected: !!settings.github_token,
        expo_connected: !!settings.expo_token,
        github_token: undefined,
        expo_token: undefined,
      }
    });
    
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Disconnect integrations
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const integration = searchParams.get('integration');
    
    if (!integration || !['github', 'expo'].includes(integration)) {
      return NextResponse.json({ error: 'Invalid integration' }, { status: 400 });
    }
    
    const tokenField = integration === 'github' ? 'github_token' : 'expo_token';
    
    const { error } = await supabase
      .from('user_settings')
      .update({ [tokenField]: null })
      .eq('user_id', user.id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Disconnect integration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
