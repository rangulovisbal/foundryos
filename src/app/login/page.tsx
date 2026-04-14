import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; redirectTo?: string }>;
}) {
  const { email, redirectTo } = await searchParams;

  return (
    <AuthShell
      description="Log in to the authenticated FoundryOS MVP preview. Public marketing remains separate from the internal product surface."
      eyebrow="Product login"
      title="Access your workspace"
    >
      <LoginForm initialEmail={email ?? ""} redirectTo={redirectTo ?? "/app"} />
    </AuthShell>
  );
}
