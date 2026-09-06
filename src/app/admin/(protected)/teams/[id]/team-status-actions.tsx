'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { updateTeamStatus, updatePPTReviewStatus } from '@/app/actions/admin';
import { TEAM_STATUS_LABELS, type TeamStatus } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export function TeamStatusActions({ 
  teamId, 
  currentStatus, 
  currentPPTStatus 
}: { 
  teamId: string, 
  currentStatus: TeamStatus,
  currentPPTStatus: 'not_reviewed' | 'verified' | 'needs_correction'
}) {
  const router = useRouter();
  
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TeamStatus>(currentStatus);
  const [correctionNote, setCorrectionNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const [pptStatus, setPptStatus] = useState(currentPPTStatus);
  const [pptNote, setPptNote] = useState('');
  const [isPPTUpdating, setIsPPTUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    setError('');
    
    if (newStatus === 'needs_correction' && !correctionNote.trim()) {
      setError('Please provide a correction note.');
      setIsUpdating(false);
      return;
    }

    const res = await updateTeamStatus({ 
      team_id: teamId, 
      status: newStatus as Exclude<TeamStatus, 'draft'>,
      correction_note: newStatus === 'needs_correction' ? correctionNote : undefined
    });

    if (res.success) {
      setIsStatusModalOpen(false);
      router.refresh();
    } else {
      setError(res.error || 'Failed to update status');
    }
    setIsUpdating(false);
  };

  const handlePPTUpdate = async () => {
    setIsPPTUpdating(true);
    const res = await updatePPTReviewStatus({ 
      team_id: teamId, 
      ppt_review_status: pptStatus,
      ppt_review_note: pptStatus === 'needs_correction' ? pptNote : undefined 
    });
    if (!res.success) {
      alert(res.error);
      setPptStatus(currentPPTStatus);
    } else {
      alert('PPT Review Status updated successfully.');
    }
    setIsPPTUpdating(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1">
          <label className="text-body-sm font-medium mb-1 block text-[var(--color-ink)]">
            Registration Status
          </label>
          <div className="flex gap-2">
            <div className="flex-1 p-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-100)] text-body-sm">
              {TEAM_STATUS_LABELS[currentStatus]}
            </div>
            <Button onClick={() => setIsStatusModalOpen(true)} variant="outline">
              Change
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <label className="text-body-sm font-medium mb-1 block text-[var(--color-ink)]">
              PPT Review Status
            </label>
            <div className="flex gap-2">
              <Select 
                value={pptStatus} 
                onChange={(e) => setPptStatus(e.target.value as 'not_reviewed' | 'verified' | 'needs_correction')}
                disabled={isPPTUpdating}
                className="flex-1"
              >
                <option value="not_reviewed">Not Reviewed</option>
                <option value="verified">Verified</option>
                <option value="needs_correction">Needs Correction</option>
              </Select>
              <Button onClick={handlePPTUpdate} loading={isPPTUpdating} variant="outline">
                Save
              </Button>
            </div>
          </div>
          {pptStatus === 'needs_correction' && (
            <div>
              <label className="text-body-sm font-medium mb-1 block text-[var(--color-ink)]">PPT Correction Note (Internal)</label>
              <Textarea 
                value={pptNote}
                onChange={(e) => setPptNote(e.target.value)}
                placeholder="Why does the presentation need correction?"
                className="w-full text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Change Team Status"
        description="Update the registration lifecycle status."
      >
        <div className="space-y-4">
          <div>
            <label className="text-body-sm font-medium mb-1 block">New Status</label>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value as TeamStatus)}>
              {Object.entries(TEAM_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>

          {newStatus === 'needs_correction' && (
            <div>
              <label className="text-body-sm font-medium mb-1 block">Correction Note</label>
              <Textarea 
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="Explain what the team needs to fix..."
                className="w-full"
              />
            </div>
          )}

          {error && <p className="text-body-sm text-[var(--color-danger-600)]">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} loading={isUpdating}>Save Changes</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
