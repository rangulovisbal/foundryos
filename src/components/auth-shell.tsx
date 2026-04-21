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
    <div className="auth-app-root min-h-screen bg-[#FBFAF7] px-4 py-4 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-32px)] w-full max-w-7xl overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-white/80 shadow-soft lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.85fr)]">
        <div className="flex min-w-0 flex-col px-5 py-6 md:px-10 md:py-10">
          <div className="flex items-center justify-between gap-4">
            <Link className="flex items-center gap-3" href="/">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#051A24] text-sm font-semibold text-[#FBFAF7]">
                F
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
                  FoundryOS
                </p>
                <p className="text-xs text-muted">
                  {copyForLanguage(language, "Secure workspace access", "Acceso seguro al espacio")}
                </p>
              </div>
            </Link>
            <Link className="text-sm font-semibold text-muted hover:text-ink" href="/">
              {copyForLanguage(language, "Back", "Volver")}
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="eyebrow">{eyebrow}</span>
              <LanguagePreferencePicker
                label={copyForLanguage(language, "Language", "Idioma")}
                language={language}
              />
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-[0.98] tracking-[-0.055em] md:text-5xl">
              {title}
            </h1>
            <p className="mt-5 text-base leading-8 text-muted">{description}</p>
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
          </div>
        </div>

        <aside className="foundry-dark-panel m-4 hidden rounded-[28px] p-8 text-[#E0EBF0] lg:flex lg:flex-col lg:justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
            FoundryOS · operating system
          </div>
          <div>
            <p className="font-serif-display text-5xl leading-[0.98] text-white">
              {copyForLanguage(
                language,
                "Structure before scale.",
                "Estructura antes de escalar."
              )}
            </p>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/68">
              {copyForLanguage(
                language,
                "Auth, email delivery mode, session redirects, and workspace language stay explicit so the product does not overpromise what the environment cannot deliver.",
                "La autenticación, el modo de entrega de correo, las redirecciones de sesión y el idioma del espacio se mantienen explícitos para no prometer más de lo que el entorno puede entregar."
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              copyForLanguage(language, "Verify email", "Verificar correo"),
              copyForLanguage(language, "Reset password", "Restablecer contraseña"),
              copyForLanguage(language, "Session redirects", "Redirecciones de sesión"),
              copyForLanguage(language, "Language sync", "Sincronización de idioma")
            ].map((item) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/70"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
