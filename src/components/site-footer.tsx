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
              AI-first operating system for startups and lean teams that need a
              clearer growth plan, better execution and less operational drag.
            </p>
          </div>
          <div className="text-sm text-muted">
            <p>Secure checkout handled by Stripe.</p>
            <p>No payment card data is stored by the product.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
