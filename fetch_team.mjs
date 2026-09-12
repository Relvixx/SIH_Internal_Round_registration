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

const url = `${envVars.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teams?select=id&limit=1`;

async function fetchTeam() {
  const res = await fetch(url, {
    headers: {
      'apikey': envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${envVars.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const data = await res.json();
  console.log('TEAM ID:', data[0]?.id);
}

fetchTeam();
