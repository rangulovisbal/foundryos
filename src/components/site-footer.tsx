export function SiteFooter() {
  return (
    <footer className="page-shell pt-0">
      <div className="surface px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
              AI Growth OS
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Built as a web-first MVP for small companies that need structured
              growth, cleaner operations and async leverage without building a
              full internal team from day one.
            </p>
          </div>
          <div className="text-sm text-muted">
            <p>Stack: Next.js, Vercel, Supabase, Stripe, PostHog, OpenAI</p>
            <p>Prepared for Barcelona Activa presentation and early validation.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
