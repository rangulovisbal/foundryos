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
          "You already have an active session in this browser. Log out first if you were invited to set up a different pilot account.",
          "Ya tienes una sesión activa en este navegador. Cierra sesión primero si te invitaron a configurar otra cuenta de piloto."
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
        "Use this page only if you were invited into a FoundryOS pilot or asked to create an account for manual access. Email verification is part of the flow, and the product will clearly tell you whether this environment is using live email, preview links, or no delivery path yet.",
        "Usa esta página solo si te invitaron a un piloto de FoundryOS o te pidieron crear una cuenta para acceso manual. La verificación por correo forma parte del flujo y el producto te dirá claramente si este entorno usa correo real, enlaces de vista previa o si todavía no tiene entrega configurada."
      )}
      eyebrow={copyForLanguage(language, "Invited pilot signup", "Registro de piloto invitado")}
      language={language}
      title={copyForLanguage(language, "Set up invited FoundryOS access", "Configura tu acceso invitado a FoundryOS")}
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
