import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { Alert } from '@/components/ui/alert';
import { getEventSettings } from '@/features/event-settings/actions';
import { SettingsForm, TemplateUpload } from '@/features/event-settings/settings-form';
import { createAdminClient } from '@/lib/supabase/server';
import { EvaluationCriteriaSettings } from './evaluation-criteria-settings';

export const metadata: Metadata = { title: 'Settings' };

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const [settings, { data: criteria }] = await Promise.all([
    getEventSettings(),
    supabase.from('evaluation_criteria').select('*').order('sort_order', { ascending: true })
  ]);

  if (!settings) {
    return (
      <>
        <PageHeader title="Settings" />
        <Alert variant="danger">
          Unable to load event settings. Please ensure the database has been seeded with initial configuration.
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage event configuration, registration rules, and presentation template."
      />

      <div className="space-y-8 max-w-3xl">
        <SettingsForm settings={settings} />
        <TemplateUpload settings={settings} />
        <EvaluationCriteriaSettings criteria={criteria || []} />
      </div>
    </>
  );
}
