"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  Building2,
  CheckSquare,
  CreditCard,
  FolderOpen,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Map,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Shield,
  Stethoscope,
  UserRound,
  Users,
  X,
  type LucideIcon
} from "lucide-react";

type NavIcon =
  | "dashboard"
  | "profile"
  | "diagnostics"
  | "roadmap"
  | "actions"
  | "assets"
  | "sops"
  | "support"
  | "team"
  | "billing"
  | "admin";

export type WorkspaceShellNavItem = {
  groupLabel?: string;
  href: string;
  icon: NavIcon;
  label: string;
};

export type WorkspaceShellMetaItem = {
  label: string;
  value: string;
  detail?: string;
  icon: "plan" | "role" | "state" | "language";
};

const iconMap: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  profile: UserRound,
  diagnostics: Stethoscope,
  roadmap: Map,
  actions: CheckSquare,
  assets: FolderOpen,
  sops: ScrollText,
  support: LifeBuoy,
  team: Users,
  billing: CreditCard,
  admin: Shield
};

const metaIconMap: Record<WorkspaceShellMetaItem["icon"], LucideIcon> = {
  plan: Building2,
  role: Users,
  state: Shield,
  language: Languages
};

const collapsedStorageKey = "foundryos.workspaceShell.collapsed";

export function WorkspaceShellFrame({
  adminLabel,
  children,
  collapseLabel,
  expandLabel,
  logoutLabel,
  metaItems,
  mobileMenuLabel,
  navItems,
  workspaceDescription,
  workspaceEyebrow,
  workspaceName
}: {
  adminLabel?: string;
  children: React.ReactNode;
  collapseLabel: string;
  expandLabel: string;
  logoutLabel: string;
  metaItems: WorkspaceShellMetaItem[];
  mobileMenuLabel: string;
  navItems: WorkspaceShellNavItem[];
  workspaceDescription: string;
  workspaceEyebrow: string;
  workspaceName: string;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsCollapsed(localStorage.getItem(collapsedStorageKey) === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem(collapsedStorageKey, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const allNavItems = adminLabel
    ? navItems.concat({ href: "/admin", icon: "admin" as const, label: adminLabel })
    : navItems;

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-5">
        <div className="surface flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
          <button
            aria-label={mobileMenuLabel}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--border)] bg-white/85 text-ink"
            onClick={() => setIsMobileOpen(true)}
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              FoundryOS
            </p>
            <p className="truncate text-lg font-semibold tracking-[-0.03em]">
              {workspaceName}
            </p>
          </div>
        </div>

        {isMobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close navigation overlay"
              className="absolute inset-0 bg-ink/30"
              onClick={() => setIsMobileOpen(false)}
              type="button"
            />
            <aside className="surface absolute bottom-4 left-4 top-4 flex w-[min(340px,calc(100vw-32px))] flex-col overflow-hidden p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted">
                    FoundryOS
                  </p>
                  <p className="mt-1 text-lg font-semibold">{workspaceName}</p>
                </div>
                <button
                  aria-label="Close navigation"
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--border)] bg-white/85"
                  onClick={() => setIsMobileOpen(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ShellNav
                isCollapsed={false}
                items={allNavItems}
                logoutLabel={logoutLabel}
                pathname={pathname}
              />
            </aside>
          </div>
        ) : null}

        <div
          className={clsx(
            "grid min-w-0 gap-5 lg:items-start",
            isCollapsed
              ? "lg:grid-cols-[88px_minmax(0,1fr)]"
              : "lg:grid-cols-[280px_minmax(0,1fr)]"
          )}
        >
          <aside className="surface sticky top-4 hidden max-h-[calc(100vh-32px)] min-w-0 overflow-y-auto p-4 lg:block">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className={clsx("min-w-0", isCollapsed && "sr-only")}>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
                  FoundryOS
                </p>
                <p className="mt-2 truncate text-xl font-semibold tracking-[-0.03em]">
                  {workspaceName}
                </p>
              </div>
              <button
                aria-label={isCollapsed ? expandLabel : collapseLabel}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[color:var(--border)] bg-white/85 text-ink transition hover:bg-white"
                onClick={() => setIsCollapsed((value) => !value)}
                type="button"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            </div>
            <ShellNav
              isCollapsed={isCollapsed}
              items={allNavItems}
              logoutLabel={logoutLabel}
              pathname={pathname}
            />
          </aside>

          <main className="min-w-0 space-y-5">
            <section className="surface px-5 py-5 md:px-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <span className="eyebrow">{workspaceEyebrow}</span>
                  <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                    {workspaceName}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted md:text-base">
                    {workspaceDescription}
                  </p>
                </div>
                <div className="foundry-card-grid w-full xl:max-w-[640px]">
                  {metaItems.map((item) => {
                    const Icon = metaIconMap[item.icon];

                    return (
                      <article
                        className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3"
                        key={item.label}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                              {item.label}
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-ink">
                              {item.value}
                            </p>
                            {item.detail ? (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                                {item.detail}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function ShellNav({
  isCollapsed,
  items,
  logoutLabel,
  pathname
}: {
  isCollapsed: boolean;
  items: WorkspaceShellNavItem[];
  logoutLabel: string;
  pathname: string;
}) {
  const groupedItems = items.reduce<Array<{ label: string | null; items: WorkspaceShellNavItem[] }>>(
    (groups, item) => {
      const label = item.groupLabel ?? null;
      const latestGroup = groups.at(-1);

      if (latestGroup?.label === label) {
        latestGroup.items.push(item);
        return groups;
      }

      groups.push({ label, items: [item] });
      return groups;
    },
    []
  );

  return (
    <nav className="grid gap-4">
      {groupedItems.map((group, groupIndex) => (
        <div className="grid gap-1.5" key={`${group.label ?? "nav"}-${groupIndex}`}>
          {group.label ? (
            <p
              className={clsx(
                "px-3 pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/75",
                isCollapsed && "sr-only"
              )}
            >
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                className={clsx(
                  "group flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                  isActive
                    ? "bg-ink text-sand shadow-soft"
                    : "text-muted hover:bg-white/90 hover:text-ink",
                  isCollapsed && "justify-center"
                )}
                href={item.href}
                key={item.href}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={clsx("truncate", isCollapsed && "sr-only")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
      <form action="/api/auth/logout" method="post">
        <button
          className={clsx(
            "mt-3 flex w-full min-w-0 items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/80 px-3 py-3 text-left text-sm font-semibold text-muted transition hover:text-ink",
            isCollapsed && "justify-center"
          )}
          title={logoutLabel}
          type="submit"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={clsx("truncate", isCollapsed && "sr-only")}>
            {logoutLabel}
          </span>
        </button>
      </form>
    </nav>
  );
}
