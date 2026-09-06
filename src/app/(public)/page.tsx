import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  BookOpen,
  Users,
  UserCheck,
  FileCheck,
  Lightbulb,
  Target,
  Presentation,
  Send,
  Download,
  FileWarning,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'SIH Internal Hackathon 2026 — MET BKC Polytechnic',
  description:
    'Register your team for the Smart India Hackathon Internal Round at MET BKC Institute of Technology Polytechnic. Build meaningful solutions to real-world problems.',
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <RulesStrip />
      <ProcessSection />
      <TemplateSection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-primary)]">
      {/* Subtle geometric pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="container-page relative">
        <div className="py-16 md:py-24 lg:py-28 max-w-2xl">
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center px-3 py-1 rounded-[var(--radius-full)] bg-white/10 text-[var(--font-size-xs)] font-medium text-white/80 backdrop-blur-sm border border-white/10">
              Smart India Hackathon 2026
            </span>
          </div>

          <h1 className="text-display text-white mb-4 md:mb-5">
            Build solutions that{' '}
            <span className="text-[var(--color-accent-saffron)]">matter</span>
          </h1>

          <p className="text-[var(--font-size-lg)] text-white/70 leading-relaxed mb-8 max-w-lg">
            MET BKC – Institute of Technology Polytechnic invites you to the
            Internal Hackathon. Form your team, choose a problem, and present
            your innovation.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-[var(--color-primary)] hover:bg-white/90 active:bg-white/80 shadow-[var(--shadow-md)]"
                icon={<ArrowRight className="h-5 w-5" />}
              >
                Register Your Team
              </Button>
            </Link>
            <Link href="/rules">
              <Button
                size="lg"
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
                icon={<BookOpen className="h-5 w-5" />}
              >
                View Rules
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--color-canvas)] to-transparent" />
    </section>
  );
}

function RulesStrip() {
  const rules = [
    {
      value: '6',
      label: 'Team Members',
      detail: 'Exactly 6 per team',
      icon: Users,
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-subtle)',
    },
    {
      value: '2+',
      label: 'Female Members',
      detail: 'Minimum required',
      icon: UserCheck,
      color: 'var(--color-accent-green)',
      bg: 'var(--color-accent-green-subtle)',
    },
    {
      value: '1',
      label: 'Team Leader',
      detail: 'From the 6 members',
      icon: Target,
      color: 'var(--color-accent-saffron)',
      bg: 'var(--color-accent-saffron-subtle)',
    },
    {
      value: 'SIH',
      label: 'Official PPT Format',
      detail: 'Template required',
      icon: FileCheck,
      color: 'var(--color-accent-cyan)',
      bg: 'var(--color-accent-cyan-subtle)',
    },
  ];

  return (
    <section className="relative -mt-8 z-10">
      <div className="container-page">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {rules.map((rule) => (
            <div
              key={rule.label}
              className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] p-4 md:p-5 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
            >
              <div
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-3"
                style={{ backgroundColor: rule.bg }}
              >
                <rule.icon className="h-5 w-5" style={{ color: rule.color }} />
              </div>
              <p className="text-[1.75rem] md:text-[2rem] font-bold leading-none" style={{ color: rule.color }}>
                {rule.value}
              </p>
              <p className="text-[var(--font-size-sm)] font-medium text-[var(--color-ink)] mt-1">
                {rule.label}
              </p>
              <p className="text-[var(--font-size-xs)] text-[var(--color-ink-tertiary)] mt-0.5">
                {rule.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    {
      number: '01',
      title: 'Build Your Team',
      description: 'Form a team of exactly 6 members. Nominate a Team Leader and ensure at least 2 female members.',
      icon: Users,
    },
    {
      number: '02',
      title: 'Choose Problem Statement',
      description: 'Browse and select an official SIH Problem Statement that your team wants to solve.',
      icon: Lightbulb,
    },
    {
      number: '03',
      title: 'Prepare SIH PPT',
      description: 'Download the official template and prepare your presentation following the required format.',
      icon: Presentation,
    },
    {
      number: '04',
      title: 'Submit Registration',
      description: 'Fill in team details, upload your PPT, review everything, and submit your registration.',
      icon: Send,
    },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="container-page">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-metadata text-[var(--color-accent-saffron)] mb-2">HOW IT WORKS</p>
          <h2 className="text-page-title text-[var(--color-ink)]">Registration Process</h2>
          <p className="text-body text-[var(--color-ink-secondary)] mt-2 max-w-md mx-auto">
            Follow these four steps to register your team for the internal hackathon round.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {steps.map((step) => (
            <Card key={step.number} padding="md" hover className="relative">
              <span className="text-[3rem] font-bold text-[var(--color-canvas-muted)] leading-none absolute top-4 right-4 select-none">
                {step.number}
              </span>
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] flex items-center justify-center mb-4">
                <step.icon className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-card-title text-[var(--color-ink)] mb-1.5">{step.title}</h3>
              <p className="text-body-sm text-[var(--color-ink-secondary)]">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function TemplateSection() {
  // In production this would read from event_settings via a server component query.
  // For Phase 1, we show a graceful "no template" state.
  const templateAvailable = false;

  return (
    <section className="py-12 md:py-16 bg-[var(--color-canvas-subtle)]">
      <div className="container-page">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--color-primary-subtle)] flex items-center justify-center mx-auto mb-4">
            <Download className="h-6 w-6 text-[var(--color-primary)]" />
          </div>
          <h2 className="text-section-title text-[var(--color-ink)] mb-2">
            Official SIH PPT Template
          </h2>
          <p className="text-body text-[var(--color-ink-secondary)] mb-6">
            All teams must use the official Smart India Hackathon presentation template.
            Download it here and prepare your submission.
          </p>

          {templateAvailable ? (
            <Button size="lg" icon={<Download className="h-5 w-5" />}>
              Download Template
            </Button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-warning-subtle)] border border-[var(--color-warning)]/15">
              <FileWarning className="h-5 w-5 text-[var(--color-warning)] shrink-0" />
              <p className="text-[var(--font-size-sm)] text-[var(--color-ink-secondary)]">
                The official template has not been uploaded yet. Please check back later.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
