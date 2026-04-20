import { redirect } from "next/navigation";

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
    redirect(await getPostAuthRedirectPath(current.user.id, safeRedirectTo));
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
