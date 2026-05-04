import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { getCurrentUserSession } from "@/lib/auth";

export default async function AdminLoginPage() {
  const current = await getCurrentUserSession();

  if (current?.user.globalRole === "internal_admin") {
    redirect("/admin");
  }

  return <AdminLoginForm hasNonAdminSession={Boolean(current)} />;
}
