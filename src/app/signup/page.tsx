import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";

export default async function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; redirectTo?: string }>;
}) {
  const { email, redirectTo } = await searchParams;

  return (
    <AuthShell
      description="Create a product account for the internal FoundryOS MVP preview. Email verification is part of the flow, and preview links are surfaced when delivery integrations are not live."
      eyebrow="Create account"
      title="Set up your FoundryOS login"
    >
      <SignupForm initialEmail={email ?? ""} redirectTo={redirectTo ?? "/app"} />
    </AuthShell>
  );
}
