import { AlreadySignedInPanel } from "@/components/already-signed-in-panel";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";
import {
  getAuthDeliveryMode,
  getCurrentUserSession,
  getPostAuthRedirectPath,
  sanitizeRedirectPath
} from "@/lib/auth";
import { getAccessMode } from "@/lib/access";
import { env } from "@/lib/env";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ accessToken?: string; email?: string; redirectTo?: string }>;
}) {
  const { accessToken, email, redirectTo } = await searchParams;
  const language = await getCookieLanguage();
  const current = await getCurrentUserSession();
  const safeRedirectTo = sanitizeRedirectPath(redirectTo);
  const deliveryMode = getAuthDeliveryMode();
  const accessMode = getAccessMode();

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
          "You already have an active session in this browser. Continue to your workspace or log out first if you need to create a different account.",
          "Ya tienes una sesión activa en este navegador. Continúa a tu espacio o cierra sesión primero si necesitas crear otra cuenta."
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
        accessMode === "self_serve"
          ? "Create a FoundryOS account to start the guided marketing intake. Email verification is part of the flow, and the product will clearly tell you whether this environment is using live email, preview links, or no delivery path yet."
          : "Create a FoundryOS account using the access token supplied by the team. Email verification is part of the flow, and the product will clearly tell you whether this environment is using live email, preview links, or no delivery path yet.",
        accessMode === "self_serve"
          ? "Crea una cuenta de FoundryOS para empezar el intake guiado de marketing. La verificación por correo forma parte del flujo y el producto te dirá claramente si este entorno usa correo real, enlaces de vista previa o si todavía no tiene entrega configurada."
          : "Crea una cuenta de FoundryOS usando el token de acceso proporcionado por el equipo. La verificación por correo forma parte del flujo y el producto te dirá claramente si este entorno usa correo real, enlaces de vista previa o si todavía no tiene entrega configurada."
      )}
      eyebrow={copyForLanguage(language, "Create account", "Crear cuenta")}
      language={language}
      title={copyForLanguage(language, "Start with FoundryOS", "Empieza con FoundryOS")}
    >
      <SignupForm
        accessToken={accessToken ?? ""}
        canSubmit={env.hasFoundationDb && deliveryMode !== "unavailable"}
        initialEmail={email ?? ""}
        language={language}
        redirectTo={safeRedirectTo}
      />
    </AuthShell>
  );
}
