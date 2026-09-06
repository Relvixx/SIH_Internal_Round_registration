import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { getAdminTeams } from '@/lib/services/admin-teams';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TEAM_STATUS_LABELS, TEAM_STATUS_VARIANTS, type TeamStatus } from '@/lib/constants';
import Link from 'next/link';
import { TeamsFilter } from './teams-filter';
import { TeamsPagination } from './teams-pagination';

export const metadata: Metadata = { title: 'Teams' };

interface TeamsPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    theme?: string;
    search?: string;
    sortBy?: 'newest' | 'oldest' | 'score_high' | 'score_low';
  }>;
}

export default async function AdminTeamsPage({ searchParams }: TeamsPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const status = resolvedSearchParams.status || undefined;
  const theme = resolvedSearchParams.theme || undefined;
  const search = resolvedSearchParams.search || undefined;
  const sortBy = resolvedSearchParams.sortBy || 'newest';

  const { data: teams, totalPages } = await getAdminTeams({
    page,
    pageSize: 30,
    status,
    theme,
    search,
    sortBy,
  });

  return (
    <>
      <PageHeader
        title="Teams Management"
        description="View, filter, and manage all registered teams."
      />

      <TeamsFilter />

      {teams.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-6 w-6 text-[var(--color-ink-muted)]" />}
            title="No teams found"
            description="Try adjusting your filters or wait for new registrations."
          />
        </Card>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Idea & Problem</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>PPT Status</TableHead>
                <TableHead>Registration Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <Link href={`/admin/teams/${team.id}`} className="font-medium text-[var(--color-primary-600)] hover:underline">
                      {team.registration_code}
                    </Link>
                    <div className="text-body-xs text-[var(--color-ink-muted)] mt-1">
                      {new Date(team.submitted_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium truncate max-w-[200px] sm:max-w-xs">{team.idea_title}</div>
                    <div className="text-body-xs text-[var(--color-ink-secondary)] mt-1">
                      PS: {team.problem_statement_code || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.total_score > 0 ? (
                      <span className="font-semibold text-[var(--color-ink)]">{team.total_score}</span>
                    ) : (
                      <span className="text-[var(--color-ink-muted)]">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {team.ppt_review_status === 'not_reviewed' && <Badge variant="default">Not Reviewed</Badge>}
                    {team.ppt_review_status === 'verified' && <Badge variant="success">Verified</Badge>}
                    {team.ppt_review_status === 'needs_correction' && <Badge variant="warning">Needs Correction</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TEAM_STATUS_VARIANTS[team.status as TeamStatus] || 'default'}>
                      {TEAM_STATUS_LABELS[team.status as TeamStatus] || team.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TeamsPagination totalPages={totalPages} />
        </div>
      )}
    </>
  );
}
