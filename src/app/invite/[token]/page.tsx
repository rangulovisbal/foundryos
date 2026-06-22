import Link from "next/link";

import { AcceptInviteButton } from "@/components/accept-invite-button";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUserSession } from "@/lib/auth";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export default async function InvitePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const current = await getCurrentUserSession();
  const language = await getCookieLanguage();

  return (
    <AuthShell
      description={copyForLanguage(
        language,
        "Use this invitation to join an existing FoundryOS workspace.",
        "Usa esta invitación para unirte a un espacio existente de FoundryOS."
      )}
      eyebrow={copyForLanguage(language, "Workspace invite", "Invitación al espacio")}
      language={language}
      title={copyForLanguage(language, "Join workspace", "Unirse al espacio")}
    >
      {current ? (
        <AcceptInviteButton language={language} token={token} />
      ) : (
        <div className="space-y-4 text-sm text-muted">
          <p>
            {copyForLanguage(
              language,
              "You need an authenticated account before you can accept this invite.",
              "Necesitas una cuenta autenticada antes de poder aceptar esta invitación."
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-[24px] bg-ink px-5 py-4 font-semibold uppercase tracking-[0.18em] text-sand"
              href={`/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`}
            >
              {copyForLanguage(language, "Log in", "Iniciar sesión")}
            </Link>
            <Link
              className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-5 py-4 font-semibold uppercase tracking-[0.18em]"
              href={`/signup?redirectTo=${encodeURIComponent(`/invite/${token}`)}`}
            >
              {copyForLanguage(language, "Create account", "Crear cuenta")}
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
