import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";
import { ResendVerificationForm } from "@/components/resend-verification-form";
import { getAuthDeliveryMode, sanitizeRedirectPath } from "@/lib/auth";
import { env } from "@/lib/env";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; email?: string; redirectTo?: string }>;
}) {
  const { email, redirectTo, status } = await searchParams;
  const language = await getCookieLanguage();
  const safeRedirectTo = sanitizeRedirectPath(redirectTo);
  const canSubmit = env.hasFoundationDb && getAuthDeliveryMode() !== "unavailable";

  const copy =
    status === "invalid"
      ? copyForLanguage(
          language,
          "This verification link is invalid or expired. Request a new one below or return to login.",
          "Este enlace de verificación no es válido o ha caducado. Solicita uno nuevo abajo o vuelve al acceso."
        )
      : status === "unavailable"
        ? copyForLanguage(
            language,
            "Verification is unavailable in this environment until auth persistence and delivery are configured.",
            "La verificación no está disponible en este entorno hasta que se configuren la persistencia y la entrega."
          )
      : status === "sent"
        ? copyForLanguage(
            language,
            "Check your inbox for the verification email, or use the preview link if this environment is configured for preview auth links.",
            "Revisa tu bandeja de entrada para ver el correo de verificación o usa el enlace de vista previa si este entorno está configurado para ello."
          )
        : copyForLanguage(
            language,
            "Check your inbox or use the preview verification link returned by signup. Once verified, you’ll be sent into the workspace flow.",
            "Revisa tu bandeja de entrada o usa el enlace de verificación de vista previa devuelto por el registro. Una vez verificada, entrarás al flujo del espacio."
          );

  return (
    <AuthShell
      description={copy}
      eyebrow={copyForLanguage(language, "Verify email", "Verificar correo")}
      language={language}
      title={copyForLanguage(language, "Confirm your account", "Confirma tu cuenta")}
      footer={
        <>
          <Link className="font-semibold text-ink underline" href="/login">
            {copyForLanguage(language, "Go to login", "Ir al acceso")}
          </Link>
          {" · "}
          <Link className="font-semibold text-ink underline" href="/signup">
            {copyForLanguage(language, "Create another account", "Crear otra cuenta")}
          </Link>
        </>
      }
    >
      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
        {copyForLanguage(
          language,
          "Verification follows the same delivery-aware pattern as signup and login. The product will not pretend email is working if this environment is still relying on preview links or has no delivery path.",
          "La verificación sigue el mismo patrón consciente del modo de entrega que el registro y el acceso. El producto no fingirá que el correo funciona si este entorno sigue usando enlaces de vista previa o no tiene ruta de entrega."
        )}
      </div>
      <div className="mt-4">
        <ResendVerificationForm
          canSubmit={canSubmit}
          email={email ?? ""}
          language={language}
          redirectTo={safeRedirectTo}
        />
      </div>
    </AuthShell>
  );
}
