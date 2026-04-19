import Link from "next/link";
import type { ReactNode } from "react";

import { legalLastUpdated, publicLegalLinks } from "@/lib/legal";

export function LegalPageShell({
  currentPath,
  eyebrow,
  intro,
  title,
  children
}: {
  currentPath: string;
  eyebrow: string;
  intro: string;
  title: string;
  children: ReactNode;
}) {
  const relatedLinks = publicLegalLinks.filter((link) => link.href !== currentPath);

  return (
    <div className="page-shell space-y-8 pt-0">
      <section className="surface p-6 md:p-8">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">{title}</h1>
        <p className="mt-4 max-w-3xl body-lg">{intro}</p>
        <p className="mt-5 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          Last updated {legalLastUpdated}. This is the current pilot-facing policy
          surface and should receive counsel review before broad commercial launch.
        </p>
      </section>

      {children}

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Related policies</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5 transition hover:bg-white"
              href={link.href}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                {link.label}
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
