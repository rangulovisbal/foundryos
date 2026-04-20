import Link from "next/link";

import { AccountStateBanner } from "@/components/account-state-banner";
import type { WorkspaceContext } from "@/lib/foundation";
import {
  formatAccountStateLabel,
  formatRoleLabel,
  getPlanDefinition
} from "@/lib/foundation";
import { copyForLanguage, formatLanguageLongLabel } from "@/lib/language";

const navItems = [
  { href: "/app/dashboard", key: "dashboard" },
  { href: "/app/profile", key: "profile" },
  { href: "/app/diagnostics", key: "diagnostics" },
  { href: "/app/roadmap", key: "roadmap" },
  { href: "/app/actions", key: "actions" },
  { href: "/app/assets", key: "assets" },
  { href: "/app/sops", key: "sops" },
  { href: "/app/support", key: "support" },
  { href: "/app/team", key: "team" },
  { href: "/app/billing", key: "billing" }
];

export function AppShell({
  context,
  children
}: {
  context: WorkspaceContext;
  children: React.ReactNode;
}) {
  const plan = getPlanDefinition(context.workspace.plan);
  const isInternalAdmin = context.user.globalRole === "internal_admin";
  const language = context.workspace.outputLanguage;

  return (
    <div className="page-shell space-y-6 pt-0">
      <section className="surface px-6 py-5 md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">
              {copyForLanguage(language, "Authenticated preview", "Vista autenticada")}
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
              {context.workspace.name}
            </h1>
            <p className="mt-3 body-lg">
              {copyForLanguage(
                language,
                "Pilot workspace for diagnostics, planning, assets, support, and role-aware operations.",
                "Espacio piloto para diagnóstico, planificación, activos, soporte y operaciones con control por rol."
              )}
            </p>
          </div>

          <div className="grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
              <p className="font-semibold text-ink">
                {copyForLanguage(language, "Plan", "Plan")}
              </p>
              <p className="mt-1">{plan.label}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
              <p className="font-semibold text-ink">
                {copyForLanguage(language, "Workspace role", "Rol en el espacio")}
              </p>
              <p className="mt-1 capitalize">
                {formatRoleLabel(context.membership.role, language)}
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
              <p className="font-semibold text-ink">
                {copyForLanguage(language, "Account state", "Estado de la cuenta")}
              </p>
              <p className="mt-1 capitalize">{formatAccountStateLabel(context.workspace.accountState, language)}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
              <p className="font-semibold text-ink">
                {copyForLanguage(language, "Primary language", "Idioma principal")}
              </p>
              <p className="mt-1">{formatLanguageLongLabel(context.workspace.outputLanguage)}</p>
              <p className="mt-1 text-xs text-muted">
                {copyForLanguage(
                  language,
                  "The workspace experience and generated outputs follow this language.",
                  "La experiencia del espacio y los resultados generados siguen este idioma."
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AccountStateBanner
        accountState={context.workspace.accountState}
        language={language}
      />

      <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
        <aside className="surface p-4">
          <nav className="grid gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-white/90 hover:text-ink"
                href={item.href}
              >
                {item.key === "dashboard"
                  ? copyForLanguage(language, "Dashboard", "Panel")
                  : item.key === "profile"
                    ? copyForLanguage(language, "Profile", "Perfil")
                    : item.key === "diagnostics"
                      ? copyForLanguage(language, "Diagnostics", "Diagnóstico")
                      : item.key === "roadmap"
                        ? copyForLanguage(language, "Roadmap", "Hoja de ruta")
                        : item.key === "actions"
                          ? copyForLanguage(language, "Actions", "Acciones")
                          : item.key === "assets"
                            ? copyForLanguage(language, "Assets", "Activos")
                            : item.key === "sops"
                              ? "SOPs"
                              : item.key === "support"
                                ? copyForLanguage(language, "Support", "Soporte")
                                : item.key === "team"
                                  ? copyForLanguage(language, "Team", "Equipo")
                                  : copyForLanguage(language, "Billing", "Facturación")}
              </Link>
            ))}
            {isInternalAdmin ? (
              <Link
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-white/90 hover:text-ink"
                href="/admin"
              >
                {copyForLanguage(language, "Admin", "Admin")}
              </Link>
            ) : null}
            <form action="/api/auth/logout" method="post">
              <button
                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-left text-sm font-semibold text-muted transition hover:text-ink"
                type="submit"
              >
                {copyForLanguage(language, "Log out", "Cerrar sesión")}
              </button>
            </form>
          </nav>
        </aside>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
