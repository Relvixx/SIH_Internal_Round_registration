import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function escapeCSVField(field: any): string {
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

  const supabase = createAdminClient();
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Query teams
  let query = supabase.from('admin_teams_view').select('*');
  
  if (filter && filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: teams, error: teamsError } = await query.order('total_score', { ascending: false });

  if (teamsError || !teams) {
    return new NextResponse('Error fetching data', { status: 500 });
  }

  // Audit
  await supabase.from('audit_logs').insert({
    action: 'export_generated',
    actor_type: 'admin',
    actor_id: user.id,
    entity_type: 'teams',
    metadata: { filter: filter || 'all', count: teams.length }
  });

  // Get all members for these teams
  const teamIds = teams.map(t => t.id);
  let members: any[] = [];
  let files: any[] = [];
  
  if (teamIds.length > 0) {
    const [mDataRes, fDataRes] = await Promise.all([
      supabase
        .from('team_members')
        .select('*')
        .in('team_id', teamIds)
        .order('role', { ascending: false })
        .order('id', { ascending: true }),
      supabase
        .from('submission_files')
        .select('team_id, file_name')
        .in('team_id', teamIds)
        .eq('file_type', 'presentation')
    ]);
      
    if (mDataRes.data) members = mDataRes.data;
    if (fDataRes.data) files = fDataRes.data;
  }

  // Group members by team
  const membersByTeam: Record<string, any[]> = {};
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

  const rows = teams.map(t => {
    const teamMembers = membersByTeam[t.id] || [];

    const baseData = [
      t.registration_code,
      t.status,
      new Date(t.submitted_at).toISOString(),
      t.last_edited_at ? new Date(t.last_edited_at).toISOString() : '',
      t.problem_statement_code,
      t.problem_statement_title,
      t.problem_statement_theme,
      t.problem_statement_organization,
      t.idea_title,
      t.idea_description, // Unified solution summary
      '', // Key Innovation (Not collected in Phase 1)
      '', // Proposed Technology (Not collected in Phase 1)
      t.total_score,
      filesByTeam[t.id] || '',
      t.ppt_review_status || 'not_reviewed'
    ];

    const memberData: any[] = [];
    for (let i = 0; i < 6; i++) {
      const m = teamMembers[i];
      if (m) {
        memberData.push(
          `${m.first_name || ''} ${m.last_name || ''}`.trim(),
          m.gender,
          m.enrollment_number,
          m.department,
          m.year_of_study,
          m.email,
          m.phone
        );
      } else {
        memberData.push('', '', '', '', '', '', '');
      }
    }

    return [...baseData, ...memberData].map(escapeCSVField).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sih_teams_export_${filter || 'all'}_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
