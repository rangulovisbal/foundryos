import { AlreadySignedInPanel } from "@/components/already-signed-in-panel";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import {
  getCurrentUserSession,
  getPostAuthRedirectPath,
  sanitizeRedirectPath
} from "@/lib/auth";
import { env } from "@/lib/env";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{
    email?: string;
    redirectTo?: string;
    loggedOut?: string;
    reset?: string;
  }>;
}) {
  const { email, redirectTo, loggedOut, reset } = await searchParams;
  const language = await getCookieLanguage();
  const safeRedirectTo = sanitizeRedirectPath(redirectTo);
  const current = await getCurrentUserSession();

  if (current) {
    const continueHref = await getPostAuthRedirectPath(current.user.id, safeRedirectTo);
    const logoutNextHref =
      safeRedirectTo === "/app"
        ? "/login"
        : `/login?redirectTo=${encodeURIComponent(safeRedirectTo)}`;

    return (
      <AuthShell
        description={copyForLanguage(
          language,
          "You already have an active session in this browser. Log out first if you want to switch accounts cleanly.",
          "Ya tienes una sesión activa en este navegador. Cierra sesión primero si quieres cambiar de cuenta limpiamente."
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
          intent="login"
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
        "Log in to your FoundryOS workspace. Session redirects, verification, and password recovery now share the same delivery-aware auth flow.",
        "Inicia sesión en tu espacio de FoundryOS. Los redireccionamientos de sesión, la verificación y la recuperación de contraseña comparten ahora el mismo flujo consciente del modo de entrega."
      )}
      eyebrow={copyForLanguage(language, "Product login", "Acceso al producto")}
      language={language}
      title={copyForLanguage(language, "Access your workspace", "Accede a tu espacio")}
    >
      <LoginForm
        canSubmit={env.hasFoundationDb}
        initialEmail={email ?? ""}
        initialMessage={
          loggedOut
            ? copyForLanguage(
                language,
                "You’ve been logged out successfully.",
                "Has cerrado sesión correctamente."
              )
            : reset
              ? copyForLanguage(
                  language,
                  "Password updated. You can log in with your new password now.",
                  "Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña."
                )
              : null
        }
        language={language}
        redirectTo={safeRedirectTo}
      />
    </AuthShell>
  );
}
