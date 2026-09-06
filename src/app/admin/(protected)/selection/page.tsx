import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { getAdminTeams } from '@/lib/services/admin-teams';
import { SelectionClient } from './selection-client';

export const metadata: Metadata = { title: 'Selection & Ranking' };

export default async function AdminSelectionPage() {
  const { data: teams } = await getAdminTeams({
    page: 1,
    pageSize: 500, // For a real app with many teams, use proper server-side pagination/filtering for bulk updates
    sortBy: 'score_high'
  });
  
  // Only show teams that have completed evaluations
  const evaluatedTeams = teams.filter(t => t.evaluation_complete);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Selection & Ranking"
        description="Review evaluated teams ranked by score and perform bulk status updates."
      />

      {evaluatedTeams.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Trophy className="h-6 w-6 text-[var(--color-ink-muted)]" />}
            title="No evaluated teams yet"
            description="Evaluate teams first in the Evaluations section. Once scored, they will appear here ranked for final selection."
          />
        </Card>
      ) : (
        <SelectionClient teams={evaluatedTeams} />
      )}
    </div>
  );
}
