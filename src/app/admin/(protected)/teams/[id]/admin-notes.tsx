'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addAdminNote } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

export function AddAdminNote({ teamId }: { teamId: string }) {
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setIsLoading(true);
    const res = await addAdminNote(teamId, note);
    if (res.success) {
      setNote('');
      router.refresh();
    } else {
      alert(res.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Add an internal note about this team..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-[80px]"
      />
      <div className="flex justify-end">
        <Button onClick={handleAddNote} disabled={!note.trim()} loading={isLoading}>
          Add Note
        </Button>
      </div>
    </div>
  );
}
