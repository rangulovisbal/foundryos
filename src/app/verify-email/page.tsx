import Link from "next/link";

import { AuthShell } from "@/components/auth-shell";

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const copy =
    status === "invalid"
      ? "This verification link is invalid or expired. Sign up again or request a new link by logging in."
      : "Check your inbox or use the preview verification link returned by signup. Once verified, you will be redirected into /app.";

  return (
    <AuthShell
      description={copy}
      eyebrow="Verify email"
      title="Confirm your account"
      footer={
        <>
          <Link className="font-semibold text-ink underline" href="/login">
            Go to login
          </Link>
          {" · "}
          <Link className="font-semibold text-ink underline" href="/signup">
            Create another account
          </Link>
        </>
      }
    >
      <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
        Verification emails are preview-aware. If outbound email is not
        configured yet, the verification URL is shown directly in the signup
        response.
      </div>
    </AuthShell>
  );
}
