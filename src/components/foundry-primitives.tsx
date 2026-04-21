import { clsx } from "clsx";
import {
  TrendingDown,
  TrendingUp,
  type LucideIcon
} from "lucide-react";

export type FoundryStatusTone =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral";

const statusToneClasses: Record<FoundryStatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  neutral: "border-[color:var(--border)] bg-white/75 text-[color:var(--muted)]"
};

const progressToneClasses: Record<FoundryStatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-rose-500",
  info: "bg-[color:var(--teal)]",
  neutral: "bg-[color:var(--muted)]/55"
};

export function FoundryPageHeader({
  title,
  description,
  eyebrow,
  actions
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] md:text-3xl">
          {title}
        </h2>
        {description ? <p className="mt-4 max-w-3xl body-lg">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function FoundryStatusChip({
  tone,
  children,
  className
}: {
  tone: FoundryStatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
        statusToneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function FoundryMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  change,
  trend = "neutral",
  tone = "neutral",
  children
}: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  change?: string;
  trend?: "up" | "down" | "neutral";
  tone?: FoundryStatusTone;
  children?: React.ReactNode;
}) {
  return (
    <article className="metric-card flex h-full min-w-0 flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-sm uppercase tracking-[0.18em] text-muted">{label}</p>
        <div
          className={clsx(
            "rounded-2xl border p-2.5",
            tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
            tone === "error" && "border-rose-200 bg-rose-50 text-rose-700",
            tone === "info" && "border-sky-200 bg-sky-50 text-sky-700",
            tone === "neutral" && "border-[color:var(--border)] bg-white text-[color:var(--muted)]"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="min-w-0 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
        {change ? (
          <span
            className={clsx(
              "mb-1 inline-flex items-center gap-1 text-xs font-semibold",
              trend === "up" && "text-emerald-700",
              trend === "down" && "text-rose-700",
              trend === "neutral" && "text-muted"
            )}
          >
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : null}
            {trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
            {change}
          </span>
        ) : null}
      </div>
      {detail ? <p className="text-sm leading-6 text-muted">{detail}</p> : null}
      {children}
    </article>
  );
}

export function FoundrySectionCard({
  title,
  description,
  actions,
  className,
  children
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={clsx("surface min-w-0 p-5 md:p-7", className)}>
      {title || actions ? (
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-xl font-semibold tracking-[-0.03em]">{title}</h3>
            ) : null}
            {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={title || actions ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

export function FoundryProgressBar({
  value,
  tone = "info"
}: {
  value: number;
  tone?: FoundryStatusTone;
}) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white">
      <div
        className={clsx("h-full rounded-full transition-all", progressToneClasses[tone])}
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  );
}

export function FoundryScoreRing({
  score,
  label
}: {
  score: number;
  label?: string;
}) {
  const boundedScore = Math.max(0, Math.min(100, score));
  const circumference = 264;
  const dash = (boundedScore / 100) * circumference;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(16, 32, 45, 0.12)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--teal)"
          strokeWidth="8"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-[-0.04em]">{boundedScore}</span>
        {label ? <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted">{label}</span> : null}
      </div>
    </div>
  );
}
