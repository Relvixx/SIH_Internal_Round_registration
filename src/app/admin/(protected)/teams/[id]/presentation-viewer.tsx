'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getPresentationSignedUrl } from '@/app/actions/admin';
import { FileDown, ExternalLink } from 'lucide-react';

export function PresentationViewer({ teamId, filePath, fileName }: { teamId: string, filePath: string, fileName: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUrl = async () => {
    setIsLoading(true);
    setError('');
    const res = await getPresentationSignedUrl(teamId, filePath);
    if (res.success && res.url) {
      setUrl(res.url);
    } else {
      setError(res.error || 'Failed to load presentation');
    }
    setIsLoading(false);
  };

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--color-border)] rounded-md bg-[var(--color-surface-50)]">
        <FileDown className="w-8 h-8 text-[var(--color-ink-muted)] mb-2" />
        <p className="text-body-sm text-[var(--color-ink-secondary)] mb-4 text-center">
          Presentation: {fileName}
        </p>
        <Button onClick={loadUrl} loading={isLoading}>
          Generate Secure Link
        </Button>
        {error && <p className="text-body-xs text-[var(--color-danger-600)] mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-[var(--color-border)] rounded-md bg-[var(--color-surface-50)] space-y-4">
      <FileDown className="w-8 h-8 text-[var(--color-primary-500)]" />
      <p className="text-body-sm font-medium">{fileName}</p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.open(url, '_blank')}>
          View / Download
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>
      <p className="text-body-xs text-[var(--color-ink-muted)]">Link expires in 1 hour.</p>
    </div>
  );
}
