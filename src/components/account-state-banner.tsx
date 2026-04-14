import { getAccountStateMeta, type WorkspaceAccountState } from "@/lib/foundation";

export function AccountStateBanner({
  accountState
}: {
  accountState: WorkspaceAccountState;
}) {
  const meta = getAccountStateMeta(accountState);

  const toneClass =
    meta.tone === "coral"
      ? "border-coral/30 bg-coral/10 text-coral"
      : meta.tone === "gold"
        ? "border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-ink"
        : meta.tone === "muted"
          ? "border-[color:var(--border)] bg-white/80 text-muted"
          : "border-teal/30 bg-teal/10 text-teal";

  return (
    <div className={`rounded-[24px] border px-5 py-4 ${toneClass}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em]">{meta.title}</p>
      <p className="mt-2 text-sm leading-7">{meta.body}</p>
    </div>
  );
}
