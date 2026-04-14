import Link from "next/link";

import { AcceptInviteButton } from "@/components/accept-invite-button";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUserSession } from "@/lib/auth";

export default async function InvitePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const current = await getCurrentUserSession();

  return (
    <AuthShell
      description="Use this invitation to join an existing FoundryOS workspace in the internal MVP preview."
      eyebrow="Workspace invite"
      title="Join workspace"
    >
      {current ? (
        <AcceptInviteButton token={token} />
      ) : (
        <div className="space-y-4 text-sm text-muted">
          <p>You need an authenticated account before you can accept this invite.</p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-[24px] bg-ink px-5 py-4 font-semibold uppercase tracking-[0.18em] text-sand"
              href={`/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`}
            >
              Log in
            </Link>
            <Link
              className="rounded-[24px] border border-[color:var(--border)] bg-white/80 px-5 py-4 font-semibold uppercase tracking-[0.18em]"
              href={`/signup?redirectTo=${encodeURIComponent(`/invite/${token}`)}`}
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
