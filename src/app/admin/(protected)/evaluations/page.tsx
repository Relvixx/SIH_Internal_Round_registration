import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';
import { getAdminTeams } from '@/lib/services/admin-teams';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Evaluations' };

export default async function AdminEvaluationsPage() {
  // Fetch teams that are in submitted or under_review status, or all teams
  // We'll just fetch all teams for now and sort by score, but you could filter specifically.
  const { data: teams } = await getAdminTeams({
    page: 1,
    pageSize: 100, // For a real app, you'd add pagination here too
    sortBy: 'score_high'
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <PageHeader
          title="Evaluations"
          description="Evaluate and score team submissions."
        />
        <div className="flex gap-2">
          <Link href="/admin/selection" className="inline-flex items-center justify-center rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50 border border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] hover:border-[var(--color-primary-700)] h-10 px-4 py-2">
            Go to Selection Workflow →
          </Link>
        </div>
      </div>

      {teams.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardCheck className="h-6 w-6 text-[var(--color-ink-muted)]" />}
            title="No evaluations yet"
            description="Once teams submit their registrations, you can evaluate them against the configured criteria here."
          />
        </Card>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Code</TableHead>
                <TableHead>Idea</TableHead>
                <TableHead>Evaluation Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium text-[var(--color-ink)]">
                    <Link href={`/admin/teams/${team.id}`} className="hover:underline">
                      {team.registration_code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="truncate max-w-[200px] text-body-sm" title={team.idea_title}>
                      {team.idea_title}
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.evaluation_complete ? (
                      <Badge variant="success">Completed</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {team.total_score > 0 ? (
                      <span className="font-semibold text-[var(--color-ink)]">{team.total_score}</span>
                    ) : (
                      <span className="text-[var(--color-ink-muted)]">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/teams/${team.id}`} className="text-body-sm font-medium text-[var(--color-primary-600)] hover:underline">
                      {team.evaluation_complete ? 'Edit Score' : 'Evaluate'}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
