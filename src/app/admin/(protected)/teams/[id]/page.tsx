import type { Metadata } from 'next';
import { PageHeader, Breadcrumb } from '@/components/ui/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { getAdminTeamDetail, getDuplicateParticipants } from '@/lib/services/admin-teams';
import { notFound } from 'next/navigation';
import { TeamStatusActions } from './team-status-actions';
import { PresentationViewer } from './presentation-viewer';
import { CompliancePanel } from './compliance-panel';
import { AddAdminNote } from './admin-notes';
import { EvaluationForm } from './evaluation-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TEAM_STATUS_VARIANTS, TEAM_STATUS_LABELS } from '@/lib/constants';
import { createAdminClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Edit } from 'lucide-react';

export const metadata: Metadata = { title: 'Team Details' };

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  let team, members, presentation, notes, criteria, existingEvaluations, duplicates;

  try {
    const detail = await getAdminTeamDetail(resolvedParams.id);
    team = detail.team;
    members = detail.members;
    presentation = detail.presentation;
    duplicates = await getDuplicateParticipants(resolvedParams.id);
    
    // Fetch Admin Notes
    const supabase = createAdminClient();
    const notesRes = await supabase
      .from('admin_notes')
      .select('*, author:admin_users(email)')
      .eq('team_id', resolvedParams.id)
      .order('created_at', { ascending: false });
    notes = notesRes.data;

    // Fetch Evaluation Criteria
    const criteriaRes = await supabase
      .from('evaluation_criteria')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    criteria = criteriaRes.data;

    // Fetch existing team evaluations
    const evalRes = await supabase
      .from('team_evaluations')
      .select('*')
      .eq('team_id', resolvedParams.id);
    existingEvaluations = evalRes.data;

  } catch (error) {
    console.error(error);
    notFound();
  }

  return (
    <div className="space-y-6">
        <Breadcrumb items={[
          { label: 'Teams', href: '/admin/teams' },
          { label: team.registration_code },
        ]} />

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <PageHeader 
            title={team.registration_code} 
            description={`Submitted on ${new Date(team.submitted_at || team.created_at).toLocaleString()}`} 
          />
          <div className="flex items-center gap-3">
            <Link href={`/admin/teams/${team.id}/edit`}>
              <Button variant="outline" className="gap-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]">
                <Edit className="w-4 h-4" /> Edit Registration
              </Button>
            </Link>
            <Badge variant={TEAM_STATUS_VARIANTS[team.status as keyof typeof TEAM_STATUS_VARIANTS] || 'default'} className="text-sm">
              {TEAM_STATUS_LABELS[team.status as keyof typeof TEAM_STATUS_LABELS] || team.status}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            
            <Card>
              <CardHeader title="Idea & Problem Statement" />
              <div className="p-4 pt-0 space-y-4">
                <div>
                  <h4 className="text-body-sm font-medium text-[var(--color-ink-secondary)]">Idea Title</h4>
                  <p className="text-body-md text-[var(--color-ink)] mt-1">{team.idea_title}</p>
                </div>
                <div>
                  <h4 className="text-body-sm font-medium text-[var(--color-ink-secondary)]">Problem Statement</h4>
                  <p className="text-body-sm text-[var(--color-ink)] mt-1">
                    <span className="font-semibold">{team.problem_statement_code || 'N/A'}</span>: {team.problem_statement_title || 'N/A'}
                  </p>
                  <p className="text-body-xs text-[var(--color-ink-muted)] mt-1">
                    Theme: {team.problem_statement_theme} | Org: {team.problem_statement_organization}
                  </p>
                </div>
                <div>
                  <h4 className="text-body-sm font-medium text-[var(--color-ink-secondary)]">Idea Description</h4>
                  <div className="mt-1 p-4 bg-[var(--color-surface-50)] rounded-md text-body-sm whitespace-pre-wrap text-[var(--color-ink)]">
                    {team.idea_description}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Team Members" />
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {members.map((m) => (
                  <div key={m.id} className="p-4 flex flex-col sm:flex-row gap-4 justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--color-ink)]">{m.first_name} {m.last_name}</span>
                        {m.role === 'leader' && <Badge variant="default" className="text-[10px]">Leader</Badge>}
                      </div>
                      <div className="text-body-sm text-[var(--color-ink-secondary)] mt-1">
                        {m.email} {m.phone ? `• ${m.phone}` : ''}
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-body-sm text-[var(--color-ink-muted)]">
                      <div>Dept: {m.department}</div>
                      <div>Year: {m.year_of_study}</div>
                      {m.enrollment_number && <div>Enrollment: {m.enrollment_number}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Evaluation" />
              <div className="p-4 pt-0">
                <EvaluationForm 
                  teamId={team.id} 
                  criteria={criteria || []} 
                  existingEvaluations={existingEvaluations || []} 
                />
              </div>
            </Card>

          </div>

          <div className="space-y-6 lg:col-span-1">
            
            <Card>
              <CardHeader title="Administration" />
              <div className="p-4 pt-0">
                <TeamStatusActions 
                  teamId={team.id} 
                  currentStatus={team.status} 
                  currentPPTStatus={team.ppt_review_status} 
                />
              </div>
            </Card>

            <CompliancePanel members={members} duplicates={duplicates || []} />

            <Card>
              <CardHeader title="Presentation" />
              <div className="p-4 pt-0">
                {presentation ? (
                  <PresentationViewer 
                    teamId={team.id} 
                    filePath={presentation.storage_path} 
                    fileName={presentation.file_name} 
                  />
                ) : (
                  <div className="text-body-sm text-[var(--color-ink-muted)] text-center p-4">
                    No presentation uploaded.
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Admin Notes" />
              <div className="p-4 pt-0 space-y-4">
                <div className="space-y-3">
                  {notes?.map((n) => (
                    <div key={n.id} className="p-3 bg-[var(--color-surface-50)] rounded-md text-body-sm">
                      <div className="text-[var(--color-ink)] whitespace-pre-wrap">{n.note}</div>
                      <div className="text-caption text-[var(--color-ink-muted)] mt-2 flex justify-between">
                        <span>{n.author?.email || 'Admin'}</span>
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {(!notes || notes.length === 0) && (
                    <p className="text-body-sm text-[var(--color-ink-muted)] italic">No notes yet.</p>
                  )}
                </div>
                <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                  <AddAdminNote teamId={team.id} />
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    
  );
}
