import type { OutputLanguage, WorkspaceAccountState } from "@/lib/foundation";
import { getAccountStateMeta } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function LockedStatePanel({
  accountState,
  language = "en"
}: {
  accountState: WorkspaceAccountState;
  language?: OutputLanguage;
}) {
  const meta = getAccountStateMeta(accountState, language);

  return (
    <section className="surface p-6 md:p-8">
      <span className="eyebrow">
        {copyForLanguage(language, "Workspace access limited", "Acceso limitado")}
      </span>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
        {meta.title}
      </h2>
      <p className="mt-4 body-lg">{meta.body}</p>
      <p className="mt-4 text-sm text-muted">
        {copyForLanguage(
          language,
          "Billing automation is not live in this MVP, so state changes are handled manually by internal admin for testing and preview access.",
          "La automatización de facturación no está activa en este MVP, así que los cambios de estado siguen siendo manuales por parte del admin interno para pruebas y acceso piloto."
        )}
      </p>
    </section>
  );
}
