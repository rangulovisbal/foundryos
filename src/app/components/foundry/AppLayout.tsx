import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  Stethoscope,
  Map,
  Zap,
  FolderOpen,
  HelpCircle,
  Users,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "../ui/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/diagnostics", label: "Diagnostics", icon: Stethoscope },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/actions", label: "Actions", icon: Zap },
  { to: "/assets", label: "Assets", icon: FolderOpen },
  { to: "/team", label: "Team", icon: Users },
  { to: "/support", label: "Support", icon: HelpCircle },
];

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentPage = nav.find((n) => location.pathname.startsWith(n.to));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card shrink-0">
        <div className="px-5 py-5 border-b border-border">
          <span className="text-lg tracking-tight">
            <span className="text-accent">Foundry</span>OS
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-xs text-accent">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">Jane Doe</p>
              <p className="text-xs text-muted-foreground truncate">jane@company.co</p>
            </div>
            <LogOut className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <span className="text-lg tracking-tight">
            <span className="text-accent">Foundry</span>OS
          </span>
          <button onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 py-4 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="text-accent">FoundryOS</span>
            {currentPage && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground">{currentPage.label}</span>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}