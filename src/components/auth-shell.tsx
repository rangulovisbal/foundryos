import Link from "next/link";

import { env } from "@/lib/env";
import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";
import { LanguagePreferencePicker } from "@/components/language-preference-picker";

function authDeliveryMeta(language: OutputLanguage) {
  if (env.hasResend) {
    return {
      tone: "border-teal/30 bg-teal/10 text-teal",
      body: copyForLanguage(
        language,
        "Verification and reset emails are sent to the inbox configured for the user.",
        "Los correos de verificación y restablecimiento se envían a la bandeja de entrada del usuario."
      )
    };
  }

  if (env.allowAuthPreviewLinks) {
    return {
      tone: "border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-ink",
      body: copyForLanguage(
        language,
        "This environment is using preview auth links instead of live email delivery. Verification and reset links will appear directly in the product UX.",
        "Este entorno usa enlaces de vista previa en lugar de correo real. Los enlaces de verificación y restablecimiento aparecerán directamente en la interfaz."
      )
    };
  }

  return {
    tone: "border-coral/30 bg-coral/10 text-coral",
    body: copyForLanguage(
      language,
      "This environment cannot deliver verification or reset links yet. Signup and password recovery should fail transparently until email delivery is configured.",
      "Este entorno todavía no puede entregar enlaces de verificación o restablecimiento. El registro y la recuperación de contraseña deben fallar de forma transparente hasta que se configure el correo."
    )
  };
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  language
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  language: OutputLanguage;
}) {
  const deliveryMeta = authDeliveryMeta(language);

  return (
    <div className="page-shell pt-0">
      <section className="surface mx-auto max-w-2xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <span className="eyebrow">{eyebrow}</span>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <LanguagePreferencePicker
              label={copyForLanguage(language, "Language", "Idioma")}
              language={language}
            />
            <Link className="text-sm font-semibold text-muted hover:text-ink" href="/">
              {copyForLanguage(language, "Back to preview", "Volver a la vista previa")}
            </Link>
          </div>
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">{title}</h1>
        <p className="mt-4 body-lg">{description}</p>
        {!env.hasFoundationDb ? (
          <div className="mt-6 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
            {copyForLanguage(
              language,
              "Database-backed auth is unavailable until DATABASE_URL is configured. The public preview can stay online, but account actions are disabled in this environment.",
              "La autenticación con base de datos no está disponible hasta configurar DATABASE_URL. La vista pública puede seguir activa, pero las acciones de cuenta están deshabilitadas en este entorno."
            )}
          </div>
        ) : null}
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${deliveryMeta.tone}`}
        >
          {deliveryMeta.body}
        </div>
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-6 text-sm text-muted">{footer}</div> : null}
      </section>
    </div>
  );
}
