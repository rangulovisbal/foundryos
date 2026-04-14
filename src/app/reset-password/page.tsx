import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      description="Set a new password for your preview account."
      eyebrow="Password recovery"
      title="Choose a new password"
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          This reset link is missing a token.
        </div>
      )}
    </AuthShell>
  );
}
