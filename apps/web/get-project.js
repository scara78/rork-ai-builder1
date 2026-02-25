import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wpfufmolfgcjnkxjgpqt.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const projectId = 'b31f37b4-9c9d-4308-a9d8-9dca66d4d1f4';
  const { data: files, error } = await supabase.from('project_files').select('path, content').eq('project_id', projectId);
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Found ${files.length} files`);
  const pkg = files.find(f => f.path === 'package.json');
  if (pkg) {
    console.log("\n--- package.json ---");
    console.log(pkg.content);
  }
  
  const babel = files.find(f => f.path === 'babel.config.js');
  if (babel) {
    console.log("\n--- babel.config.js ---");
    console.log(babel.content);
  }
}
run();
