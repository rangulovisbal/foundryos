import { redirect } from "next/navigation";

import { getCurrentWorkspaceContext } from "@/lib/auth";

export default async function AppEntryPage() {
  const context = await getCurrentWorkspaceContext();

  if (!context) {
    redirect("/app/setup");
  }

  redirect("/app/dashboard");
}
