import type { WorkspaceAccountState } from "@/lib/foundation";
import { getAccountStateMeta } from "@/lib/foundation";

export function LockedStatePanel({
  accountState
}: {
  accountState: WorkspaceAccountState;
}) {
  const meta = getAccountStateMeta(accountState);

  return (
    <section className="surface p-6 md:p-8">
      <span className="eyebrow">Workspace access limited</span>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
        {meta.title}
      </h2>
      <p className="mt-4 body-lg">{meta.body}</p>
      <p className="mt-4 text-sm text-muted">
        Billing automation is not live in this MVP, so state changes are handled
        manually by internal admin for testing and preview access.
      </p>
    </section>
  );
}
