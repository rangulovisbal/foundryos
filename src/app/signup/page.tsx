import { AlreadySignedInPanel } from "@/components/already-signed-in-panel";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";
import {
  getAuthDeliveryMode,
  getCurrentUserSession,
  getPostAuthRedirectPath,
  sanitizeRedirectPath
} from "@/lib/auth";
import { env } from "@/lib/env";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; redirectTo?: string }>;
}) {
  const { email, redirectTo } = await searchParams;
  const language = await getCookieLanguage();
  const current = await getCurrentUserSession();
  const safeRedirectTo = sanitizeRedirectPath(redirectTo);
  const deliveryMode = getAuthDeliveryMode();

  if (current) {
    const continueHref = await getPostAuthRedirectPath(current.user.id, safeRedirectTo);
    const logoutNextHref =
      safeRedirectTo === "/app"
        ? "/signup"
        : `/signup?redirectTo=${encodeURIComponent(safeRedirectTo)}`;

    return (
      <AuthShell
        description={copyForLanguage(
          language,
          "You already have an active session in this browser. Log out first if you want to test a new account from a clean signup state.",
          "Ya tienes una sesión activa en este navegador. Cierra sesión primero si quieres probar una cuenta nueva desde un registro limpio."
        )}
        eyebrow={copyForLanguage(language, "Active session", "Sesión activa")}
        language={language}
        title={copyForLanguage(
          language,
          "You are already signed in.",
          "Ya has iniciado sesión."
        )}
      >
        <AlreadySignedInPanel
          continueHref={continueHref}
          intent="signup"
          language={language}
          logoutNextHref={logoutNextHref}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      description={copyForLanguage(
        language,
        "Create your FoundryOS account. Email verification is part of the flow, and the product will clearly tell you whether this environment is using live email, preview links, or no delivery path yet.",
        "Crea tu cuenta de FoundryOS. La verificación por correo forma parte del flujo y el producto te dirá claramente si este entorno usa correo real, enlaces de vista previa o si todavía no tiene entrega configurada."
      )}
      eyebrow={copyForLanguage(language, "Create account", "Crear cuenta")}
      language={language}
      title={copyForLanguage(language, "Set up your FoundryOS login", "Configura tu acceso a FoundryOS")}
    >
      <SignupForm
        canSubmit={env.hasFoundationDb && deliveryMode !== "unavailable"}
        initialEmail={email ?? ""}
        language={language}
        redirectTo={safeRedirectTo}
      />
    </AuthShell>
  );
}
