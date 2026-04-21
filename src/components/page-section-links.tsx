type PageSectionLink = {
  href: string;
  label: string;
};

export function PageSectionLinks({
  label = "Jump to",
  links
}: {
  label?: string;
  links: PageSectionLink[];
}) {
  return (
    <nav
      aria-label={label}
      className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1"
    >
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      {links.map((link) => (
        <a
          className="shrink-0 rounded-full border border-[color:var(--border)] bg-white/85 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-white"
          href={link.href}
          key={link.href}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
