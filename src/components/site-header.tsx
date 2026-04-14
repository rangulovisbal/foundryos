import Link from "next/link";

const links = [
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/dashboard", label: "Sample output" },
  { href: "/pricing#plans", label: "Get Snapshot" }
];

export function SiteHeader() {
  return (
    <header className="page-shell">
      <div className="surface flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
        <Link className="flex items-center gap-3" href="/">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-sm font-semibold text-sand">
            AG
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
              AI Growth OS
            </p>
            <p className="text-sm text-muted">
              Growth + operations for lean teams
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted">
          {links.map((link) => (
            <Link
              key={link.href}
              className="rounded-full px-3 py-2 transition hover:bg-white/90 hover:text-ink"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
