import { ConfigurationRequiredPanel } from "@/components/configuration-required-panel";
import { requireAuthenticatedUser } from "@/lib/auth";
import { isConfigurationError } from "@/lib/errors";

export default async function ProductLayout({
  children
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAuthenticatedUser("/app");
    return children;
  } catch (error) {
    if (isConfigurationError(error)) {
      return (
        <div className="page-shell pt-0">
          <ConfigurationRequiredPanel
            body="FoundryOS auth and workspace persistence are now database-backed. Configure DATABASE_URL before using /app."
            title="Authenticated product access is unavailable"
          />
        </div>
      );
    }

    throw error;
  }
}
