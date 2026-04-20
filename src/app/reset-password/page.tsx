import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { env } from "@/lib/env";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const language = await getCookieLanguage();

  return (
    <AuthShell
      description={copyForLanguage(
        language,
        "Choose a new password for your FoundryOS account.",
        "Elige una nueva contraseña para tu cuenta de FoundryOS."
      )}
      eyebrow={copyForLanguage(language, "Password recovery", "Recuperación de contraseña")}
      language={language}
      title={copyForLanguage(language, "Choose a new password", "Elige una nueva contraseña")}
    >
      {token ? (
        <ResetPasswordForm
          canSubmit={env.hasFoundationDb}
          language={language}
          token={token}
        />
      ) : (
        <div className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {copyForLanguage(
            language,
            "This reset link is missing a token.",
            "A este enlace de restablecimiento le falta el token."
          )}
        </div>
      )}
    </AuthShell>
  );
}
