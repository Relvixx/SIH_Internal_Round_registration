'use client';

import { Card, CardHeader } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import type { AdminTeamMember } from '@/lib/services/admin-teams';

interface DuplicateParticipant {
  duplicate_registration_code: string;
  email: string;
}

export function CompliancePanel({ 
  members, 
  duplicates 
}: { 
  members: AdminTeamMember[]; 
  duplicates: DuplicateParticipant[];
}) {
  const leader = members.find(m => m.role === 'leader');
  const size = members.length;
  const femaleCount = members.filter(m => m.gender === 'female').length;

  const isSizeOk = size >= 1 && size <= 6; // Based on settings typically, but hardcoding fallback for UI
  const isFemaleOk = femaleCount >= 1; // Assuming 1 female required

  return (
    <Card>
      <CardHeader title="Compliance Checks" />
      <div className="p-4 pt-0 space-y-4">
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-body-sm">
            {isSizeOk ? <ShieldCheck className="w-4 h-4 text-[var(--color-success-600)]" /> : <AlertTriangle className="w-4 h-4 text-[var(--color-danger-600)]" />}
            <span className="text-[var(--color-ink)]">Team Size: {size} members</span>
          </div>
          <div className="flex items-center gap-2 text-body-sm">
            {isFemaleOk ? <ShieldCheck className="w-4 h-4 text-[var(--color-success-600)]" /> : <AlertTriangle className="w-4 h-4 text-[var(--color-danger-600)]" />}
            <span className="text-[var(--color-ink)]">Female Members: {femaleCount}</span>
          </div>
          <div className="flex items-center gap-2 text-body-sm">
            {leader ? <ShieldCheck className="w-4 h-4 text-[var(--color-success-600)]" /> : <AlertTriangle className="w-4 h-4 text-[var(--color-danger-600)]" />}
            <span className="text-[var(--color-ink)]">Team Leader assigned</span>
          </div>
        </div>

        {duplicates.length > 0 && (
          <Alert variant="warning">
            <h4 className="font-medium text-[var(--color-warning-800)] mb-1">Potential Duplicates Detected</h4>
            <ul className="list-disc list-inside text-body-xs text-[var(--color-warning-700)] space-y-1">
              {duplicates.map((dup, i) => (
                <li key={i}>
                  Member matches existing team {dup.duplicate_registration_code} 
                  (Email: {dup.email})
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </div>
    </Card>
  );
}
