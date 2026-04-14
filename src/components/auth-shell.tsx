import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="page-shell pt-0">
      <section className="surface mx-auto max-w-2xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <span className="eyebrow">{eyebrow}</span>
          <Link className="text-sm font-semibold text-muted hover:text-ink" href="/">
            Back to preview
          </Link>
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">{title}</h1>
        <p className="mt-4 body-lg">{description}</p>
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-6 text-sm text-muted">{footer}</div> : null}
      </section>
    </div>
  );
}
