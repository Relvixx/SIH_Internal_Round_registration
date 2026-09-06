import Link from 'next/link';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] mt-auto">
      <div className="container-page py-8 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[var(--font-size-sm)] font-medium text-[var(--color-ink)]">
              Smart India Hackathon — Internal Round
            </p>
            <p className="text-[var(--font-size-xs)] text-[var(--color-ink-tertiary)] mt-0.5">
              MET BKC – Institute of Technology Polytechnic
            </p>
          </div>

          <nav className="flex items-center gap-4 md:gap-6" aria-label="Footer navigation">
            <Link
              href="/rules"
              className="text-[var(--font-size-sm)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"
            >
              Rules
            </Link>
            <Link
              href="/register"
              className="text-[var(--font-size-sm)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"
            >
              Register
            </Link>
          </nav>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
          <p className="text-caption text-center">
            © {currentYear} MET BKC – Institute of Technology Polytechnic. Internal use only.
          </p>
        </div>
      </div>
    </footer>
  );
}
