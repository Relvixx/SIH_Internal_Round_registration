import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader } from '@/components/ui/card';
import { Download, FileSpreadsheet } from 'lucide-react';

export const metadata: Metadata = { title: 'Exports' };

export default function AdminExportsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Exports"
        description="Download registration data and reports in CSV format."
      />
      
      <div className="grid sm:grid-cols-2 gap-6">
        
        <Card>
          <CardHeader title="Complete Master Data" description="Export all registered teams regardless of their status." />
          <div className="p-4 pt-0">
            <a 
              href="/api/admin/export?filter=all" 
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] h-10 px-4 py-2 w-full"
            >
              <Download className="w-4 h-4" />
              Download All Teams (CSV)
            </a>
          </div>
        </Card>

        <Card>
          <CardHeader title="Shortlisted Teams" description="Export only the teams marked as Shortlisted." />
          <div className="p-4 pt-0">
            <a 
              href="/api/admin/export?filter=shortlisted" 
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-ink)] h-10 px-4 py-2 w-full"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Shortlisted (CSV)
            </a>
          </div>
        </Card>

        <Card>
          <CardHeader title="Waitlisted Teams" description="Export only the teams marked as Waitlisted." />
          <div className="p-4 pt-0">
            <a 
              href="/api/admin/export?filter=waitlisted" 
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-ink)] h-10 px-4 py-2 w-full"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Waitlisted (CSV)
            </a>
          </div>
        </Card>

        <Card>
          <CardHeader title="Eligible Teams" description="Export teams marked as Eligible but not yet selected." />
          <div className="p-4 pt-0">
            <a 
              href="/api/admin/export?filter=eligible" 
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-ink)] h-10 px-4 py-2 w-full"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Eligible (CSV)
            </a>
          </div>
        </Card>

      </div>
    </div>
  );
}
