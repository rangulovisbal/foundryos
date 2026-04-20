import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getAuthDeliveryMode } from "@/lib/auth";
import { env } from "@/lib/env";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export default async function ForgotPasswordPage() {
  const language = await getCookieLanguage();
  const deliveryMode = getAuthDeliveryMode();

  return (
    <AuthShell
      description={copyForLanguage(
        language,
        "Request a password reset link. The product will clearly tell you whether this environment is sending live email, showing preview links, or unable to deliver reset links yet.",
        "Solicita un enlace para restablecer tu contraseña. El producto te indicará claramente si este entorno envía correo real, muestra enlaces de vista previa o todavía no puede entregar enlaces de restablecimiento."
      )}
      eyebrow={copyForLanguage(language, "Reset password", "Restablecer contraseña")}
      language={language}
      title={copyForLanguage(language, "Recover your account", "Recupera tu cuenta")}
    >
      <ForgotPasswordForm
        canSubmit={env.hasFoundationDb && deliveryMode !== "unavailable"}
        language={language}
      />
    </AuthShell>
  );
}
