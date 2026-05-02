"use client";

import { useEffect, useState, type ReactNode } from "react";

const adminTabs = [
  { key: "overview", label: "Overview" },
  { key: "needs-attention", label: "Needs attention" },
  { key: "workspaces", label: "Workspaces" },
  { key: "jobs", label: "Jobs" },
  { key: "users-access", label: "Users & access" },
  { key: "logs", label: "Logs" }
] as const;

type AdminTabKey = (typeof adminTabs)[number]["key"];

function resolveTabFromHash(hash: string): AdminTabKey | null {
  const value = hash.replace(/^#/, "");
  return adminTabs.some((tab) => tab.key === value) ? (value as AdminTabKey) : null;
}

export function AdminTabsShell({
  overview,
  needsAttention,
  workspaces,
  jobs,
  usersAccess,
  logs,
  tabCounts
}: {
  overview: ReactNode;
  needsAttention: ReactNode;
  workspaces: ReactNode;
  jobs: ReactNode;
  usersAccess: ReactNode;
  logs: ReactNode;
  tabCounts?: Partial<Record<AdminTabKey, number>>;
}) {
  const [activeTab, setActiveTab] = useState<AdminTabKey>("overview");

  useEffect(() => {
    const syncFromHash = () => {
      const nextTab = resolveTabFromHash(window.location.hash);
      if (nextTab) {
        setActiveTab(nextTab);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  function activateTab(tab: AdminTabKey) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tab}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const panels: Record<AdminTabKey, ReactNode> = {
    overview,
    "needs-attention": needsAttention,
    workspaces,
    jobs,
    "users-access": usersAccess,
    logs
  };

  return (
    <div className="space-y-6">
      <section className="surface p-3 md:p-4">
        <div
          aria-label="Admin sections"
          className="flex flex-wrap items-center gap-2"
          role="tablist"
        >
          {adminTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tabCounts?.[tab.key];

            return (
              <button
                aria-selected={isActive}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-[#051A24] bg-[#051A24] text-[#FBFAF7]"
                    : "border-[color:var(--border)] bg-white/85 text-ink hover:bg-white"
                }`}
                key={tab.key}
                onClick={() => activateTab(tab.key)}
                role="tab"
                type="button"
              >
                <span>{tab.label}</span>
                {typeof count === "number" ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive ? "bg-white/12 text-[#FBFAF7]" : "bg-[#F4F2EC] text-muted"
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <div role="tabpanel">{panels[activeTab]}</div>
    </div>
  );
}
