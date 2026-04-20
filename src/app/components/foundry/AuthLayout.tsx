export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel - desktop only */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary text-primary-foreground flex-col justify-between p-12">
        <div>
          <span className="text-xl tracking-tight">
            <span className="text-indigo-400">Foundry</span>OS
          </span>
        </div>
        <div>
          <h2 className="text-3xl leading-tight mb-4 text-white/95">
            Build your business
            <br />
            on solid foundations.
          </h2>
          <p className="text-white/60 text-sm max-w-md">
            FoundryOS helps lean teams diagnose, plan, and execute what matters most —
            with clarity, not complexity.
          </p>
        </div>
        <p className="text-white/30 text-xs">© 2026 FoundryOS. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <span className="text-lg tracking-tight">
              <span className="text-accent">Foundry</span>OS
            </span>
          </div>
          <h1 className="mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}