import Link from "next/link";

import type { WorkspaceContext } from "@/lib/foundation";
import { formatRoleLabel, getPlanDefinition } from "@/lib/foundation";
import { AccountStateBanner } from "@/components/account-state-banner";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/profile", label: "Profile" },
  { href: "/app/diagnostics", label: "Diagnostics" },
  { href: "/app/roadmap", label: "Roadmap" },
  { href: "/app/actions", label: "Actions" },
  { href: "/app/assets", label: "Assets" },
  { href: "/app/sops", label: "SOPs" },
  { href: "/app/team", label: "Team" },
  { href: "/app/billing", label: "Billing" }
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

  return (
    <div className="page-shell space-y-6 pt-0">
      <section className="surface px-6 py-5 md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Authenticated preview</span>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
              {context.workspace.name}
            </h1>
            <p className="mt-3 body-lg">
              Internal MVP preview for workspace context, diagnostics, account
              state, and role-aware operations.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-muted md:grid-cols-3">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
              <p className="font-semibold text-ink">Plan</p>
              <p className="mt-1">{plan.label}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
              <p className="font-semibold text-ink">Workspace role</p>
              <p className="mt-1 capitalize">{formatRoleLabel(context.membership.role)}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3">
              <p className="font-semibold text-ink">Account state</p>
              <p className="mt-1 capitalize">
                {context.workspace.accountState.replaceAll("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AccountStateBanner accountState={context.workspace.accountState} />

      <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
        <aside className="surface p-4">
          <nav className="grid gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-white/90 hover:text-ink"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
            {isInternalAdmin ? (
              <Link
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-white/90 hover:text-ink"
                href="/admin"
              >
                Admin
              </Link>
            ) : null}
            <form action="/api/auth/logout" method="post">
              <button
                className="mt-2 w-full rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-left text-sm font-semibold text-muted transition hover:text-ink"
                type="submit"
              >
                Log out
              </button>
            </form>
          </nav>
        </aside>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
