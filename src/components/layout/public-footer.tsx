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

        <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-[var(--font-size-xs)] text-[var(--color-ink-secondary)]">
              Facing issues with the registration form? Need help?
            </p>
            <p className="text-[var(--font-size-xs)] font-medium text-[var(--color-ink)] mt-1 flex items-center justify-center md:justify-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
              Contact Rahul Choudhary: <a href="tel:8983707673" className="hover:text-[var(--color-primary)] transition-colors">8983707673</a> | <a href="mailto:relvixx89@gmail.com" className="hover:text-[var(--color-primary)] transition-colors">relvixx89@gmail.com</a>
            </p>
          </div>
          <p className="text-caption text-[var(--color-ink-tertiary)] text-center md:text-right">
            © {currentYear} MET BKC – Institute of Technology Polytechnic. Internal use only.
          </p>
        </div>
      </div>
    </footer>
  );
}
