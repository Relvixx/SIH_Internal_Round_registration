import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function escapeCSVField(field: unknown): string {
  if (field === null || field === undefined) return '';
  let str = String(field);
  
  // Formula injection prevention
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    str = "'" + str; // Prefix with a single quote to prevent spreadsheet software from evaluating it
  }

  // Quote fields containing commas, quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get('filter'); // e.g., 'all', 'eligible', 'shortlisted'

  // Auth check: use cookie-based client to verify the admin session
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Use service-role client for data fetching (bypasses RLS)
  const supabase = createAdminClient();

  // Fetch ALL teams using pagination to bypass the 1000-row Supabase limit
  interface TeamRecord {
    id: string;
    registration_code: string;
    status: string;
    submitted_at: string | null;
    last_edited_at: string | null;
    idea_title: string;
    idea_description: string;
    total_score: number;
    ppt_review_status: string;
    problem_statement_code: string;
    problem_statement_title: string;
    problem_statement_theme: string;
    problem_statement_organization: string;
    [key: string]: unknown;
  }

  const PAGE_SIZE = 1000;
  let allTeams: TeamRecord[] = [];
  let page = 0;

  while (true) {
    let query = supabase
      .from('admin_teams_view')
      .select('*')
      .order('total_score', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filter && filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Export fetch error:', error);
      return new NextResponse(`Error fetching data: ${error.message}`, { status: 500 });
    }

    if (!data || data.length === 0) break;

    allTeams = allTeams.concat(data as TeamRecord[]);

    // If we got fewer rows than PAGE_SIZE, we've reached the end
    if (data.length < PAGE_SIZE) break;

    page++;
  }

  if (allTeams.length === 0) {
    return new NextResponse('No data found for the given filter', { status: 404 });
  }

  // Audit
  await supabase.from('audit_logs').insert({
    action: 'export_generated',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'teams',
    metadata: { filter: filter || 'all', count: allTeams.length }
  });

  // Get all members & files for these teams (also paginated)
  const teamIds = allTeams.map(t => t.id);
  interface MemberRecord {
    id: string;
    team_id: string;
    role: string;
    first_name: string;
    last_name: string;
    gender: string;
    enrollment_number: string;
    department: string;
    year_of_study: string;
    email: string;
    phone: string;
  }
  interface FileRecord {
    team_id: string;
    file_name: string;
  }

  let members: MemberRecord[] = [];
  let files: FileRecord[] = [];
  
  if (teamIds.length > 0) {
    // Fetch members in chunks (Supabase .in() has a practical limit)
    const CHUNK_SIZE = 300; // safe chunk size for .in() filter
    for (let i = 0; i < teamIds.length; i += CHUNK_SIZE) {
      const chunk = teamIds.slice(i, i + CHUNK_SIZE);
      
      const [mDataRes, fDataRes] = await Promise.all([
        supabase
          .from('team_members')
          .select('*')
          .in('team_id', chunk)
          .order('role', { ascending: false })
          .order('id', { ascending: true })
          .limit(CHUNK_SIZE * 6), // max 6 members per team
        supabase
          .from('submission_files')
          .select('team_id, file_name')
          .in('team_id', chunk)
          .eq('file_type', 'presentation')
          .limit(CHUNK_SIZE)
      ]);
        
      if (mDataRes.data) members = members.concat(mDataRes.data as MemberRecord[]);
      if (fDataRes.data) files = files.concat(fDataRes.data as FileRecord[]);
    }
  }

  // Group members by team
  const membersByTeam: Record<string, MemberRecord[]> = {};
  members.forEach(m => {
    if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
    membersByTeam[m.team_id].push(m);
  });

  const filesByTeam: Record<string, string> = {};
  files.forEach(f => {
    filesByTeam[f.team_id] = f.file_name;
  });

  // Prepare CSV Rows
  const baseHeaders = [
    'Registration Code',
    'Status',
    'Submitted At',
    'Last Edited At',
    'PS ID',
    'PS Title',
    'Theme',
    'Organization',
    'Idea Title',
    'Solution Summary',
    'Key Innovation',
    'Proposed Technology',
    'Evaluation Score',
    'Evaluation Complete',
    'PPT Filename',
    'PPT Review Status'
  ];

  const memberHeaders = [];
  for (let i = 1; i <= 6; i++) {
    const prefix = i === 1 ? 'Leader' : `Member ${i}`;
    memberHeaders.push(
      `${prefix} Name`,
      `${prefix} Gender`,
      `${prefix} Enrollment`,
      `${prefix} Branch`,
      `${prefix} Year`,
      `${prefix} Email`,
      `${prefix} Phone`
    );
  }

  const headers = [...baseHeaders, ...memberHeaders];

  const rows = allTeams.map(t => {
    const teamMembers = membersByTeam[t.id] || [];

    const baseData = [
      t.registration_code,
      t.status,
      t.submitted_at ? new Date(t.submitted_at).toISOString() : '',
      t.last_edited_at ? new Date(t.last_edited_at).toISOString() : '',
      t.problem_statement_code,
      t.problem_statement_title,
      t.problem_statement_theme,
      t.problem_statement_organization,
      t.idea_title,
      t.idea_description, // Unified solution summary
      '', // Key Innovation (Not collected in Phase 1)
      '', // Proposed Technology (Not collected in Phase 1)
      t.total_score ?? 0,
      t.is_evaluation_complete ? 'Yes' : 'No',
      filesByTeam[t.id] || '',
      t.ppt_review_status || 'not_reviewed'
    ];

    const memberData: string[] = [];
    for (let i = 0; i < 6; i++) {
      const m = teamMembers[i];
      if (m) {
        memberData.push(
          `${m.first_name || ''} ${m.last_name || ''}`.trim(),
          m.gender || '',
          m.enrollment_number || '',
          m.department || '',
          m.year_of_study || '',
          m.email || '',
          m.phone || ''
        );
      } else {
        memberData.push('', '', '', '', '', '', '');
      }
    }

    return [...baseData, ...memberData].map(escapeCSVField).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  // Add UTF-8 BOM so Excel opens the CSV with correct encoding
  const bom = '\uFEFF';

  return new NextResponse(bom + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sih_teams_export_${filter || 'all'}_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
