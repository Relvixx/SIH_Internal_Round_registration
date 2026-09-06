import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/server';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CSVImport } from './csv-import';

export const metadata: Metadata = { title: 'Problem Statements' };

interface RawProblemStatement {
  id: string;
  ps_id: string;
  title: string;
  organization: string;
  theme: string;
  category: string;
  problem_type: string;
  is_active: boolean;
  teams?: { id: string }[];
}

async function getProblemStatements() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('problem_statements')
    .select('*, teams(id)')
    .order('created_at', { ascending: false });

  if (error || !data) {
    if (error) console.error('Error fetching problem statements:', error);
    return [];
  }
  
  return data.map((ps: RawProblemStatement) => ({
    ...ps,
    selected_by_count: ps.teams ? ps.teams.length : 0
  }));
}

export default async function AdminProblemStatementsPage() {
  const statements = await getProblemStatements();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <PageHeader
          title="Problem Statements"
          description="Manage SIH Problem Statements available for team selection."
        />
        <CSVImport />
      </div>

      {statements.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="h-6 w-6 text-[var(--color-ink-muted)]" />}
            title="No problem statements added yet"
            description="Add SIH Problem Statements here using the CSV Import tool. Teams will select from active problem statements during registration."
          />
        </Card>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PS ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Theme / Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Selected By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statements.map((ps) => (
                <TableRow key={ps.id}>
                  <TableCell className="font-medium text-[var(--color-ink)]">
                    {ps.ps_id}
                  </TableCell>
                  <TableCell>
                    <div className="truncate max-w-[200px] sm:max-w-xs text-body-sm" title={ps.title}>
                      {ps.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-body-sm text-[var(--color-ink-secondary)] truncate max-w-[150px]">
                    {ps.organization}
                  </TableCell>
                  <TableCell className="text-body-xs text-[var(--color-ink-secondary)]">
                    <div>{ps.theme}</div>
                    <div className="text-[var(--color-ink-muted)]">{ps.category}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ps.problem_type === 'software' ? 'info' : 'warning'} className="capitalize">
                      {ps.problem_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {ps.selected_by_count}
                  </TableCell>
                  <TableCell>
                    {ps.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="default">Inactive</Badge>
                    )}
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
