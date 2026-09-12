import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const teamId = '7b8b33d2-d507-4bf3-8e8b-375d540aa5b5';
  const [teamResult, membersResult, filesResult] = await Promise.all([
    supabase.from('admin_teams_view').select('*').eq('id', teamId).single(),
    supabase.from('team_members').select('*').eq('team_id', teamId).order('role', { ascending: false }),
    supabase.from('submission_files').select('*').eq('team_id', teamId).eq('file_type', 'presentation').single()
  ]);

  console.log('teamResult error:', teamResult.error);
  console.log('membersResult error:', membersResult.error);
  console.log('filesResult error:', filesResult.error);
}

testQuery();
