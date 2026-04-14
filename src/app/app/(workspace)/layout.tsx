import { AppShell } from "@/components/app-shell";
import { requireWorkspaceContext } from "@/lib/auth";

export default async function WorkspaceLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const context = await requireWorkspaceContext("/app");

  return <AppShell context={context}>{children}</AppShell>;
}
