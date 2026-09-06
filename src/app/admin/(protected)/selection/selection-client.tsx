'use client';

import { useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { TEAM_STATUS_LABELS, TEAM_STATUS_VARIANTS, type TeamStatus } from '@/lib/constants';
import { updateTeamStatus } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

export function SelectionClient({ teams }: { teams: any[] }) {
  const router = useRouter();
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<TeamStatus>('shortlisted');
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleAll = () => {
    if (selectedTeams.size === teams.length) {
      setSelectedTeams(new Set());
    } else {
      setSelectedTeams(new Set(teams.map(t => t.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedTeams);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTeams(next);
  };

  const handleBulkUpdate = async () => {
    if (selectedTeams.size === 0) return;
    
    const confirmUpdate = window.confirm(`You are about to mark ${selectedTeams.size} teams as ${TEAM_STATUS_LABELS[bulkStatus]}. Are you sure?`);
    if (!confirmUpdate) return;

    setIsUpdating(true);
    let successCount = 0;
    
    for (const teamId of selectedTeams) {
      const res = await updateTeamStatus({ team_id: teamId, status: bulkStatus as any });
      if (res.success) successCount++;
    }

    alert(`Successfully updated ${successCount} teams.`);
    setSelectedTeams(new Set());
    setIsUpdating(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-[var(--color-surface-50)] border border-[var(--color-border)] rounded-md">
        <span className="text-body-sm font-medium text-[var(--color-ink)]">Bulk Actions:</span>
        <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as any)} className="w-48">
          <option value="eligible">Mark Eligible</option>
          <option value="shortlisted">Mark Shortlisted</option>
          <option value="waitlisted">Mark Waitlisted</option>
          <option value="rejected">Mark Rejected</option>
          <option value="needs_correction">Needs Correction</option>
        </Select>
        <Button onClick={handleBulkUpdate} disabled={selectedTeams.size === 0 || isUpdating} loading={isUpdating}>
          Apply to {selectedTeams.size} teams
        </Button>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedTeams.size === teams.length && teams.length > 0} 
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Team Code</TableHead>
              <TableHead>Idea</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              let currentRank = 1;
              let previousScore: number | null = null;
              
              return teams.map((team, index) => {
                if (previousScore !== null && team.total_score < previousScore) {
                  currentRank = index + 1;
                }
                previousScore = team.total_score;
                
                return (
                  <TableRow key={team.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedTeams.has(team.id)} 
                        onChange={() => toggleOne(team.id)}
                        aria-label={`Select team ${team.registration_code}`}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-[var(--color-ink-secondary)]">#{currentRank}</span>
                    </TableCell>
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
                  <span className="font-semibold text-[var(--color-ink)]">{team.total_score}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={TEAM_STATUS_VARIANTS[team.status as TeamStatus] || 'default'}>
                    {TEAM_STATUS_LABELS[team.status as TeamStatus] || team.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/teams/${team.id}`} className="text-body-sm font-medium text-[var(--color-primary-600)] hover:underline">
                    View
                  </Link>
                </TableCell>
                  </TableRow>
                );
              });
            })()}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
