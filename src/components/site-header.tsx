import Link from "next/link";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

const links = [
  { href: "/pricing", key: "pricing" },
  { href: "/security", key: "security" },
  { href: "/dashboard", key: "sample-output" }
];

export function SiteHeader({ language }: { language: OutputLanguage }) {
  return (
    <header className="page-shell">
      <div className="surface flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
        <Link className="flex items-center gap-3" href="/">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-sm font-semibold text-sand">
            FO
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
              FoundryOS
            </p>
            <p className="text-sm text-muted">
              {copyForLanguage(
                language,
                "Marketing diagnosis + planning for early-stage teams",
                "Diagnóstico y planificación de marketing para equipos en etapa inicial"
              )}
            </p>
          </div>
        </Link>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted">
            {links.map((link) => (
              <Link
                key={link.href}
                className="rounded-full px-3 py-2 transition hover:bg-white/90 hover:text-ink"
                href={link.href}
              >
                {link.key === "pricing"
                  ? copyForLanguage(language, "Pricing", "Precios")
                  : link.key === "security"
                    ? copyForLanguage(language, "Security", "Seguridad")
                    : copyForLanguage(language, "Sample output", "Salida de ejemplo")}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="rounded-full border border-[color:var(--border)] bg-white/85 px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white"
              href="/login"
            >
              {copyForLanguage(language, "Log in", "Iniciar sesión")}
            </Link>
            <Link
              className="rounded-full bg-[#051A24] px-4 py-2 text-sm font-semibold text-[#FBFAF7] shadow-[0_1px_2px_rgba(5,26,36,0.08),0_8px_20px_-8px_rgba(5,26,36,0.25),inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:-translate-y-0.5 hover:bg-[#0D212C]"
              href="/#snapshot-request"
            >
              {copyForLanguage(language, "Request access", "Solicitar acceso")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
