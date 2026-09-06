import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Users, FileText, AlertTriangle, Inbox, Clock } from 'lucide-react';
import { TEAM_STATUS_LABELS, type TeamStatus } from '@/lib/constants';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { TEAM_STATUS_VARIANTS } from '@/lib/constants';

export const metadata: Metadata = { title: 'Dashboard' };

async function getDashboardStats() {
  const supabase = createAdminClient();

  const [teamsResult, psResult, settingsResult] = await Promise.all([
    supabase.from('admin_teams_view').select('id, status, registration_code, idea_title, submitted_at', { count: 'exact' }).order('submitted_at', { ascending: false }),
    supabase.from('problem_statements').select('id', { count: 'exact' }).eq('is_active', true),
    supabase.from('event_settings').select('*').limit(1).single(),
  ]);

  const teams = teamsResult.data || [];
  const teamCount = teamsResult.count || 0;
  const psCount = psResult.count || 0;
  const settings = settingsResult.data;

  // Count members from teams
  let memberCount = 0;
  if (teamCount > 0) {
    const { count } = await supabase.from('team_members').select('id', { count: 'exact' });
    memberCount = count || 0;
  }

  // Status breakdown
  const statusCounts: Partial<Record<TeamStatus, number>> = {};
  for (const team of teams) {
    const s = team.status as TeamStatus;
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  const needsAttention = (statusCounts.needs_correction || 0) + (statusCounts.submitted || 0);
  
  // Recent 5 registrations
  const recentTeams = teams.slice(0, 5);

  return { teamCount, memberCount, psCount, needsAttention, statusCounts, settings, recentTeams };
}

export default async function AdminDashboardPage() {
  const { teamCount, memberCount, psCount, needsAttention, statusCounts, settings, recentTeams } = await getDashboardStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of the SIH Internal Hackathon Operations."
      />

      {/* Registration status banner */}
      {settings && (
        <Alert
          variant={settings.registration_open ? 'success' : 'warning'}
        >
          Registration is currently <strong>{settings.registration_open ? 'open' : 'closed'}</strong>.
          {settings.registration_deadline && (
            <> Deadline: {new Date(settings.registration_deadline).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}.</>
          )}
        </Alert>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Teams" value={teamCount} icon={Users} variant="primary" />
        <StatCard label="Participants" value={memberCount} icon={Users} variant="default" />
        <StatCard label="Problem Statements" value={psCount} icon={FileText} variant="success" />
        <StatCard label="Need Attention" value={needsAttention} icon={AlertTriangle} variant={needsAttention > 0 ? 'warning' : 'default'} />
      </div>

      {/* Content */}
      {teamCount === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox className="h-6 w-6 text-[var(--color-ink-muted)]" />}
            title="No teams registered yet"
            description="Teams will appear here once students begin registering. Make sure registration is open and problem statements are available."
          />
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader title="Recent Registrations" description="The latest teams that have submitted their ideas." />
              <div className="divide-y divide-[var(--color-surface-200)]">
                {recentTeams.map((team) => (
                  <div key={team.id} className="p-4 flex items-center justify-between hover:bg-[var(--color-surface-50)] transition-colors">
                    <div>
                      <Link href={`/admin/teams/${team.id}`} className="font-medium text-[var(--color-primary-600)] hover:underline">
                        {team.registration_code}
                      </Link>
                      <p className="text-body-sm text-[var(--color-ink-secondary)] truncate max-w-sm">
                        {team.idea_title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-body-xs text-[var(--color-ink-muted)] hidden sm:block">
                        {new Date(team.submitted_at).toLocaleDateString()}
                      </span>
                      <Badge variant={TEAM_STATUS_VARIANTS[team.status as TeamStatus]}>
                        {TEAM_STATUS_LABELS[team.status as TeamStatus]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[var(--color-surface-200)] bg-[var(--color-surface-50)] text-center">
                <Link href="/admin/teams" className="text-body-sm font-medium text-[var(--color-primary-600)] hover:underline">
                  View all teams →
                </Link>
              </div>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader title="Status Breakdown" description="Teams by current status" />
              <div className="p-4 pt-0 space-y-3">
                {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-body-sm text-[var(--color-ink-secondary)] flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'eligible' || status === 'shortlisted' ? 'bg-[var(--color-success-500)]' :
                        status === 'needs_correction' || status === 'waitlisted' ? 'bg-[var(--color-warning-500)]' :
                        status === 'rejected' ? 'bg-[var(--color-danger-500)]' : 'bg-[var(--color-primary-500)]'
                      }`} />
                      {TEAM_STATUS_LABELS[status as TeamStatus]}
                    </span>
                    <span className="text-body-sm font-medium text-[var(--color-ink)]">{count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Action Needed" />
              <div className="p-4 pt-0 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-md bg-[var(--color-warning-100)] text-[var(--color-warning-700)]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-body-sm font-medium text-[var(--color-ink)]">{statusCounts.submitted || 0} teams</h4>
                    <p className="text-body-xs text-[var(--color-ink-secondary)]">Awaiting initial review</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-md bg-[var(--color-danger-100)] text-[var(--color-danger-700)]">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-body-sm font-medium text-[var(--color-ink)]">{statusCounts.needs_correction || 0} teams</h4>
                    <p className="text-body-xs text-[var(--color-ink-secondary)]">Need correction</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
