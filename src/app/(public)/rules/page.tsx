import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import {
  Users,
  UserCheck,
  Target,
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rules & Guidelines',
  description:
    'Official rules and guidelines for the SIH Internal Hackathon at MET BKC Polytechnic.',
};

export default function RulesPage() {
  return (
    <div className="container-page py-8 md:py-12">
      <PageHeader
        title="Rules & Guidelines"
        description="Read carefully before registering your team for the SIH Internal Hackathon."
      />

      <div className="max-w-3xl space-y-6">
        {/* Team Composition */}
        <section>
          <h2 className="text-section-title text-[var(--color-ink)] mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--color-primary)]" />
            Team Composition
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <RuleCard
              icon={<Users className="h-5 w-5" />}
              title="Exactly 6 Members"
              description="Every team must consist of exactly 6 members — no more, no less."
              variant="primary"
            />
            <RuleCard
              icon={<UserCheck className="h-5 w-5" />}
              title="Minimum 2 Female Members"
              description="At least 2 team members must be female. This is a mandatory requirement."
              variant="success"
            />
            <RuleCard
              icon={<Target className="h-5 w-5" />}
              title="1 Team Leader"
              description="One member must be nominated as Team Leader. They will handle the registration."
              variant="warning"
            />
            <RuleCard
              icon={<AlertCircle className="h-5 w-5" />}
              title="All from MET BKC"
              description="All team members must be students of MET BKC – Institute of Technology Polytechnic."
              variant="info"
            />
          </div>
        </section>

        {/* Submission Requirements */}
        <section>
          <h2 className="text-section-title text-[var(--color-ink)] mb-4 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-[var(--color-primary)]" />
            Submission Requirements
          </h2>
          <Card padding="md">
            <ul className="space-y-3">
              <RuleListItem positive>
                Teams must use the <strong>official SIH PPT template</strong> provided on this portal.
              </RuleListItem>
              <RuleListItem positive>
                Upload your presentation in <strong>PDF or PPTX format</strong>.
              </RuleListItem>
              <RuleListItem positive>
                Provide a clear <strong>idea title</strong> and <strong>solution summary</strong>.
              </RuleListItem>
              <RuleListItem positive>
                Select one <strong>SIH Problem Statement</strong> from the available list.
              </RuleListItem>
              <RuleListItem negative>
                Do not submit without all 6 members filled in completely.
              </RuleListItem>
              <RuleListItem negative>
                Do not use an unofficial or modified template format.
              </RuleListItem>
            </ul>
          </Card>
        </section>

        {/* Process */}
        <section>
          <h2 className="text-section-title text-[var(--color-ink)] mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[var(--color-primary)]" />
            Process
          </h2>
          <Card padding="md">
            <ol className="space-y-4">
              {[
                'Form a team of exactly 6 members meeting all composition requirements.',
                'The Team Leader registers the team through this portal.',
                'Select a Problem Statement and fill in idea details.',
                'Prepare and upload your presentation using the official SIH template.',
                'Review all details carefully and submit your registration.',
                'You will receive a registration ID upon successful submission.',
                'Teams may edit their submission while editing is enabled.',
                'The organizing committee will review and evaluate submissions.',
                'Shortlisted teams will be announced for the next round.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-body-sm text-[var(--color-ink-secondary)]">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-[var(--font-size-xs)] font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>

        {/* Important Notes */}
        <section>
          <Card padding="md" className="bg-[var(--color-warning-subtle)] border-[var(--color-warning)]/15">
            <h3 className="text-card-title text-[var(--color-ink)] mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[var(--color-warning)]" />
              Important Notes
            </h3>
            <ul className="space-y-2 text-body-sm text-[var(--color-ink-secondary)]">
              <li>• Registration deadlines are strict. Late submissions will not be accepted.</li>
              <li>• Incomplete registrations (missing members, missing PPT) cannot be submitted.</li>
              <li>• The organizing committee reserves the right to disqualify non-compliant teams.</li>
              <li>• For queries, contact the SIH Internal Hackathon organizing committee.</li>
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}

function RuleCard({
  icon,
  title,
  description,
  variant,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: 'primary' | 'success' | 'warning' | 'info';
}) {
  const colors = {
    primary: { bg: 'var(--color-primary-subtle)', fg: 'var(--color-primary)' },
    success: { bg: 'var(--color-success-subtle)', fg: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-subtle)', fg: 'var(--color-warning)' },
    info: { bg: 'var(--color-info-subtle)', fg: 'var(--color-info)' },
  };
  const c = colors[variant];

  return (
    <Card padding="md" className="flex gap-3">
      <div
        className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
        style={{ backgroundColor: c.bg, color: c.fg }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-card-title text-[var(--color-ink)]">{title}</h3>
        <p className="text-body-sm text-[var(--color-ink-secondary)] mt-0.5">{description}</p>
      </div>
    </Card>
  );
}

function RuleListItem({ positive, negative, children }: { positive?: boolean; negative?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-body-sm text-[var(--color-ink-secondary)]">
      {positive && <CheckCircle2 className="h-4 w-4 text-[var(--color-success)] shrink-0 mt-0.5" />}
      {negative && <XCircle className="h-4 w-4 text-[var(--color-danger)] shrink-0 mt-0.5" />}
      <span>{children}</span>
    </li>
  );
}
