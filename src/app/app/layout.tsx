import { ConfigurationRequiredPanel } from "@/components/configuration-required-panel";
import { requireAuthenticatedUser } from "@/lib/auth";
import { isConfigurationError } from "@/lib/errors";
import { copyForLanguage } from "@/lib/language";
import { getCookieLanguage } from "@/lib/language-server";

export default async function ProductLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const language = await getCookieLanguage();

  try {
    await requireAuthenticatedUser("/app");
    return children;
  } catch (error) {
    if (isConfigurationError(error)) {
      return (
        <div className="page-shell pt-0">
          <ConfigurationRequiredPanel
            body={copyForLanguage(
              language,
              "FoundryOS auth and workspace persistence are now database-backed. Configure DATABASE_URL before using /app.",
              "La autenticación y la persistencia del espacio en FoundryOS ahora dependen de base de datos. Configura DATABASE_URL antes de usar /app."
            )}
            title={copyForLanguage(
              language,
              "Authenticated product access is unavailable",
              "El acceso autenticado al producto no está disponible"
            )}
          />
        </div>
      );
    }

    throw error;
  }
}
