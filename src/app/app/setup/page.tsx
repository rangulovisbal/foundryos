import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { WorkspaceSetupForm } from "@/components/workspace-setup-form";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { env } from "@/lib/env";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export default async function WorkspaceSetupPage() {
  const context = await getCurrentWorkspaceContext();
  const language = await getCookieLanguage();

  if (context) {
    redirect("/app/dashboard");
  }

  return (
    <AuthShell
      description={copyForLanguage(
        language,
        "Create the first workspace for your account. The selected language becomes the primary workspace language and will also drive generated outputs.",
        "Crea el primer espacio para tu cuenta. El idioma seleccionado se convierte en el idioma principal del espacio y también define los resultados generados."
      )}
      eyebrow={copyForLanguage(language, "Workspace setup", "Configuración del espacio")}
      language={language}
      title={copyForLanguage(language, "Create your first workspace", "Crea tu primer espacio")}
    >
      <WorkspaceSetupForm canSubmit={env.hasFoundationDb} language={language} />
    </AuthShell>
  );
}
