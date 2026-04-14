import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Request a password reset link. In preview mode, reset links are surfaced directly in the UI if transactional email is not configured yet."
      eyebrow="Reset password"
      title="Recover your account"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
