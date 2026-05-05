import { AccountStateBanner } from "@/components/account-state-banner";
import {
  WorkspaceShellFrame,
  type WorkspaceShellNavItem,
  type WorkspaceShellMetaItem
} from "@/components/workspace-shell-frame";
import type { WorkspaceContext } from "@/lib/foundation";
import {
  formatAccountStateLabel,
  formatPlanDescription,
  formatRoleLabel,
  getPlanDefinition
} from "@/lib/foundation";
import { copyForLanguage, formatLanguageLongLabel } from "@/lib/language";

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
  const navItems: WorkspaceShellNavItem[] = [
    { href: "/app/dashboard", icon: "dashboard", label: copyForLanguage(language, "Dashboard", "Panel") },
    { href: "/app/profile", icon: "profile", label: copyForLanguage(language, "Marketing profile", "Perfil de marketing") },
    { href: "/app/diagnostics", icon: "diagnostics", label: copyForLanguage(language, "Marketing diagnosis", "Diagnóstico de marketing") },
    { href: "/app/roadmap", icon: "roadmap", label: copyForLanguage(language, "Marketing priorities", "Prioridades de marketing") },
    { href: "/app/actions", icon: "actions", label: copyForLanguage(language, "30-day plan", "Plan 30 días") },
    { href: "/app/assets", icon: "assets", label: copyForLanguage(language, "Marketing assets", "Activos de marketing") },
    { href: "/app/sops", icon: "sops", label: copyForLanguage(language, "Marketing workflows", "Flujos de marketing") },
    { href: "/app/support", icon: "support", label: copyForLanguage(language, "Support", "Soporte") },
    { href: "/app/team", icon: "team", label: copyForLanguage(language, "Team", "Equipo") },
    { href: "/app/billing", icon: "billing", label: copyForLanguage(language, "Billing", "Facturación") }
  ];
  const metaItems: WorkspaceShellMetaItem[] = [
    {
      icon: "plan",
      label: copyForLanguage(language, "Plan", "Plan"),
      value: plan.label,
      detail: formatPlanDescription(context.workspace.plan, language)
    },
    {
      icon: "role",
      label: copyForLanguage(language, "Role", "Rol"),
      value: formatRoleLabel(context.membership.role, language)
    },
    {
      icon: "state",
      label: copyForLanguage(language, "State", "Estado"),
      value: formatAccountStateLabel(context.workspace.accountState, language)
    },
    {
      icon: "language",
      label: copyForLanguage(language, "Language", "Idioma"),
      value: formatLanguageLongLabel(context.workspace.outputLanguage),
      detail: copyForLanguage(
        language,
        "Experience and outputs follow this language.",
        "La experiencia y los resultados usan este idioma."
      )
    }
  ];

  return (
    <WorkspaceShellFrame
      adminLabel={isInternalAdmin ? copyForLanguage(language, "Admin", "Admin") : undefined}
      collapseLabel={copyForLanguage(language, "Collapse sidebar", "Contraer barra lateral")}
      expandLabel={copyForLanguage(language, "Expand sidebar", "Expandir barra lateral")}
      logoutLabel={copyForLanguage(language, "Log out", "Cerrar sesión")}
      metaItems={metaItems}
      mobileMenuLabel={copyForLanguage(language, "Open workspace navigation", "Abrir navegación del espacio")}
      navItems={navItems}
      workspaceDescription={copyForLanguage(
        language,
        "Pilot workspace for marketing diagnosis, priorities, reusable assets, support, and role-aware execution.",
        "Espacio piloto para diagnóstico de marketing, prioridades, activos reutilizables, soporte y ejecución con control por rol."
      )}
      workspaceEyebrow={copyForLanguage(language, "Workspace", "Espacio")}
      workspaceName={context.workspace.name}
    >
      <AccountStateBanner
        accountState={context.workspace.accountState}
        language={language}
      />
      <div className="min-w-0 space-y-5">{children}</div>
    </WorkspaceShellFrame>
  );
}
