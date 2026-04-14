import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { WorkspaceSetupForm } from "@/components/workspace-setup-form";
import { getCurrentWorkspaceContext } from "@/lib/auth";

export default async function WorkspaceSetupPage() {
  const context = await getCurrentWorkspaceContext();

  if (context) {
    redirect("/app/dashboard");
  }

  return (
    <AuthShell
      description="Create the first workspace for your authenticated preview account. This provisions one Growth OS trial workspace and seeds entitlement placeholders."
      eyebrow="Workspace setup"
      title="Create your first workspace"
    >
      <WorkspaceSetupForm />
    </AuthShell>
  );
}
