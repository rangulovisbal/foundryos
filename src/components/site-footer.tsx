export function SiteFooter() {
  const hasLiveCheckout = Boolean(process.env.STRIPE_SECRET_KEY);

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
            {hasLiveCheckout ? (
              <>
                <p>Secure checkout handled by Stripe.</p>
                <p>No payment card data is stored by the product.</p>
              </>
            ) : (
              <>
                <p>Checkout is being enabled for this deployment.</p>
                <p>Use the request form if you want access before billing is live.</p>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[color:var(--border)] pt-4 text-sm text-muted">
          <a className="transition hover:text-ink" href="/login">
            Customer login
          </a>
          <a className="transition hover:text-ink" href="/signup">
            Create account
          </a>
          <a className="transition hover:text-ink" href="/admin/login">
            Internal admin
          </a>
        </div>
      </div>
    </footer>
  );
}
