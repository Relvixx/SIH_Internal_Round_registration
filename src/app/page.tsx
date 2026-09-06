import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'MET BKC SIH Internal Hackathon',
  description: 'Internal Hackathon Portal for MET BKC Institute of Technology Polytechnic',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)] flex flex-col selection:bg-[var(--color-primary-subtle)] selection:text-[var(--color-primary)]">
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 backdrop-blur-md">
        <div className="container-page h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--color-primary)] flex items-center justify-center shadow-[var(--shadow-sm)]">
              <span className="text-[var(--color-ink-inverse)] font-bold text-sm tracking-wider">SIH</span>
            </div>
            <span className="font-semibold text-[var(--color-primary)] text-body">MET BKC</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/admin/login" className="text-body-sm font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-primary)] transition-colors">
              Admin Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-primary-subtle)] via-[var(--color-canvas)] to-[var(--color-canvas)] -z-10" />
          
          <div className="container-page flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-body-sm font-medium text-[var(--color-primary)] mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-[var(--color-success)]"></span>
              Registrations are now open
            </div>
            
            <h1 className="text-display max-w-4xl tracking-tight text-[var(--color-primary)]">
              Smart India Hackathon <br className="hidden sm:block" />
              <span className="text-[var(--color-accent-saffron)]">Internal Selection</span>
            </h1>
            
            <p className="mt-6 text-body-lg max-w-2xl text-[var(--color-ink-secondary)] leading-relaxed">
              Welcome to the official internal hackathon portal for <strong>MET BKC Institute of Technology Polytechnic</strong>. Form your teams, submit your ideas, and compete to represent our institute at SIH.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link 
                href="/register" 
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-8 text-body-md font-medium text-white transition-all hover:bg-[var(--color-primary-hover)] hover:scale-[1.02] active:scale-[0.98] shadow-md w-full sm:w-auto"
              >
                Register Your Team
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/edit" 
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-8 text-body-md font-medium text-[var(--color-ink)] transition-all hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-active)] w-full sm:w-auto"
              >
                Edit Submission
              </Link>
            </div>
          </div>
        </section>

        {/* Info Cards Section */}
        <section className="py-20 bg-[var(--color-surface)] border-t border-[var(--color-border-subtle)]">
          <div className="container-page">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              <div className="p-8 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] border border-[var(--color-border-subtle)] group hover:border-[var(--color-primary-muted)] transition-colors">
                <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-primary-subtle)] flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-section-title text-[var(--color-ink)] mb-3">Submission Guidelines</h3>
                <p className="text-body text-[var(--color-ink-secondary)] mb-6">
                  Prepare your problem statement and idea title carefully. You will need to upload your presentation in PDF or PPTX format (Max 50MB) before finalizing the submission.
                </p>
                <div className="flex items-center text-body-sm font-medium text-[var(--color-primary)]">
                  Ensure strict compliance with SIH rules
                </div>
              </div>

              <div className="p-8 rounded-[var(--radius-xl)] bg-[var(--color-canvas)] border border-[var(--color-border-subtle)] group hover:border-[var(--color-primary-muted)] transition-colors">
                <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-success-subtle)] flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6 text-[var(--color-success)]" />
                </div>
                <h3 className="text-section-title text-[var(--color-ink)] mb-3">Evaluation Process</h3>
                <p className="text-body text-[var(--color-ink-secondary)] mb-6">
                  All submitted ideas will be reviewed by the internal selection committee. Shortlisted teams will be notified and advanced to the final SIH portal.
                </p>
                <div className="flex items-center text-body-sm font-medium text-[var(--color-primary)]">
                  Track your status via the Edit link
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-canvas)] py-8">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-body-sm text-[var(--color-ink-muted)]">
            © {new Date().getFullYear()} MET BKC Institute of Technology Polytechnic. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-body-sm text-[var(--color-ink-tertiary)]">Internal SIH Portal v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
