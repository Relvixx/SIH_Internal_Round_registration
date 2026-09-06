'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Card, CardHeader } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { SectionHeading } from '@/components/ui/page-header';
import {
  Save,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Settings,
  Users,
  Presentation,
} from 'lucide-react';
import { updateEventSettings, uploadTemplate } from '@/features/event-settings/actions';
import type { EventSettings } from '@/types';
import { formatDateTime, formatFileSize } from '@/lib/utils';

interface SettingsFormProps {
  settings: EventSettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);

    // Handle checkbox values
    if (!formData.has('registration_open')) formData.set('registration_open', 'false');
    if (!formData.has('editing_enabled')) formData.set('editing_enabled', 'false');

    // Convert formats array
    const formatsEl = e.currentTarget.querySelectorAll<HTMLInputElement>('[name="format_option"]');
    const formats: string[] = [];
    formatsEl.forEach((el) => { if (el.checked) formats.push(el.value); });
    formData.set('allowed_presentation_formats', JSON.stringify(formats));

    const result = await updateEventSettings(formData);

    setFeedback({
      type: result.success ? 'success' : 'danger',
      message: result.message,
    });
    setSaving(false);

    if (result.success) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {feedback && (
        <Alert
          variant={feedback.type === 'success' ? 'success' : 'danger'}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Event Information */}
      <section>
        <SectionHeading
          title="Event Information"
          description="Basic details about the hackathon event."
        />
        <Card>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField label="Event Name" htmlFor="event_name" required>
              <Input id="event_name" name="event_name" defaultValue={settings.event_name} />
            </FormField>
            <FormField label="Event Year" htmlFor="event_year" required>
              <Input id="event_year" name="event_year" type="number" defaultValue={settings.event_year} />
            </FormField>
            <FormField label="Institute Name" htmlFor="institute_name" required className="md:col-span-2">
              <Input id="institute_name" name="institute_name" defaultValue={settings.institute_name} />
            </FormField>
          </div>
        </Card>
      </section>

      {/* Registration Rules */}
      <section>
        <SectionHeading
          title="Registration Rules"
          description="Controls for registration and team requirements."
        />
        <Card>
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <Checkbox
                name="registration_open"
                value="true"
                defaultChecked={settings.registration_open}
                label="Registration is open"
              />
              <Checkbox
                name="editing_enabled"
                value="true"
                defaultChecked={settings.editing_enabled}
                label="Editing enabled"
              />
            </div>

            <FormField label="Registration Deadline" htmlFor="registration_deadline">
              <Input
                id="registration_deadline"
                name="registration_deadline"
                type="datetime-local"
                defaultValue={settings.registration_deadline?.slice(0, 16) || ''}
              />
            </FormField>

            <div className="grid grid-cols-3 gap-4">
              <FormField label="Min Team Size" htmlFor="minimum_team_size" required>
                <Input
                  id="minimum_team_size"
                  name="minimum_team_size"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={settings.minimum_team_size}
                />
              </FormField>
              <FormField label="Max Team Size" htmlFor="maximum_team_size" required>
                <Input
                  id="maximum_team_size"
                  name="maximum_team_size"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={settings.maximum_team_size}
                />
              </FormField>
              <FormField label="Min Female Members" htmlFor="minimum_female_members" required>
                <Input
                  id="minimum_female_members"
                  name="minimum_female_members"
                  type="number"
                  min={0}
                  max={20}
                  defaultValue={settings.minimum_female_members}
                />
              </FormField>
            </div>

            <Alert variant="warning" title="Impact Notice">
              Changing team size or female member requirements may affect the compliance status of existing registrations.
            </Alert>
          </div>
        </Card>
      </section>

      {/* Presentation Settings */}
      <section>
        <SectionHeading
          title="Presentation Settings"
          description="File upload constraints and accepted formats."
        />
        <Card>
          <div className="space-y-4">
            <FormField label="Max File Size (MB)" htmlFor="presentation_max_size_mb" required>
              <Input
                id="presentation_max_size_mb"
                name="presentation_max_size_mb"
                type="number"
                min={1}
                max={100}
                defaultValue={settings.presentation_max_size_mb}
              />
            </FormField>

            <div>
              <p className="text-label text-[var(--color-ink)] mb-2">Allowed Formats</p>
              <div className="flex flex-wrap gap-4">
                {['.pdf', '.pptx', '.ppt'].map((fmt) => (
                  <Checkbox
                    key={fmt}
                    name="format_option"
                    value={fmt}
                    defaultChecked={settings.allowed_presentation_formats.includes(fmt)}
                    label={fmt.toUpperCase()}
                  />
                ))}
              </div>
            </div>

            <FormField label="Template Instructions" htmlFor="template_instructions" hint="Shown to students when downloading the template.">
              <Textarea
                id="template_instructions"
                name="template_instructions"
                rows={3}
                defaultValue={settings.template_instructions || ''}
              />
            </FormField>
          </div>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </form>
  );
}

// ── Template Upload Component ──
interface TemplateUploadProps {
  settings: EventSettings;
}

export function TemplateUpload({ settings }: TemplateUploadProps) {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const result = await uploadTemplate(formData);

    setFeedback({
      type: result.success ? 'success' : 'danger',
      message: result.message,
    });
    setUploading(false);

    if (result.success && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <section>
      <SectionHeading
        title="Official PPT Template"
        description="Upload or replace the official SIH presentation template."
      />
      <Card>
        {feedback && (
          <Alert
            variant={feedback.type === 'success' ? 'success' : 'danger'}
            onDismiss={() => setFeedback(null)}
            className="mb-4"
          >
            {feedback.message}
          </Alert>
        )}

        {/* Current template info */}
        {settings.template_storage_path ? (
          <div className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--color-canvas-subtle)] mb-4">
            <FileText className="h-5 w-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-[var(--color-ink)]">
                {settings.template_title || 'SIH Template'}
              </p>
              <p className="text-caption">
                Version {settings.template_version} • Updated {formatDateTime(settings.updated_at)}
              </p>
            </div>
            <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]/15 mb-4">
            <AlertTriangle className="h-5 w-5 text-[var(--color-warning)] shrink-0" />
            <p className="text-body-sm text-[var(--color-ink-secondary)]">
              No template has been uploaded yet. Students will see a notice on the public site.
            </p>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <FormField label="Template Title" htmlFor="template_title">
            <Input
              id="template_title"
              name="template_title"
              placeholder="e.g., SIH 2026 Official PPT Template"
              defaultValue={settings.template_title || ''}
            />
          </FormField>

          <FormField label="Template File" htmlFor="template_file" required hint="Accepts .pdf and .pptx files up to 50 MB.">
            <input
              ref={fileInputRef}
              id="template_file"
              name="file"
              type="file"
              accept=".pdf,.pptx,.ppt"
              required
              className="w-full text-[var(--font-size-sm)] text-[var(--color-ink-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-[var(--radius-md)] file:border-0 file:text-[var(--font-size-sm)] file:font-medium file:bg-[var(--color-primary-subtle)] file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary-muted)] file:cursor-pointer file:transition-colors"
            />
          </FormField>

          <div className="flex justify-end">
            <Button type="submit" loading={uploading} icon={<Upload className="h-4 w-4" />}>
              {uploading ? 'Uploading…' : settings.template_storage_path ? 'Replace Template' : 'Upload Template'}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
