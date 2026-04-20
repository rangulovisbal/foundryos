import Link from "next/link";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";
import { publicLegalLinks } from "@/lib/legal";

export function SiteFooter({ language }: { language: OutputLanguage }) {
  const hasLiveCheckout = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <footer className="page-shell pt-0">
      <div className="surface px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
              FoundryOS
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              {copyForLanguage(
                language,
                "AI-first operating system for startups and lean teams that need a clearer growth plan, better execution and less operational drag.",
                "Sistema operativo AI-first para startups y equipos pequeños que necesitan un plan de crecimiento más claro, mejor ejecución y menos fricción operativa."
              )}
            </p>
          </div>
          <div className="text-sm text-muted">
            {hasLiveCheckout ? (
              <>
                <p>
                  {copyForLanguage(
                    language,
                    "Secure checkout handled by Stripe.",
                    "El pago seguro lo gestiona Stripe."
                  )}
                </p>
                <p>
                  {copyForLanguage(
                    language,
                    "No payment card data is stored by the product.",
                    "El producto no almacena datos de tarjetas."
                  )}
                </p>
              </>
            ) : (
              <>
                <p>
                  {copyForLanguage(
                    language,
                    "Checkout is being enabled for this deployment.",
                    "El checkout se está habilitando para este despliegue."
                  )}
                </p>
                <p>
                  {copyForLanguage(
                    language,
                    "Use the request form if you want access before billing is live.",
                    "Usa el formulario de solicitud si quieres acceso antes de que la facturación esté activa."
                  )}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[color:var(--border)] pt-4 text-sm text-muted">
          <Link className="transition hover:text-ink" href="/security">
            {copyForLanguage(language, "Security", "Seguridad")}
          </Link>
          {publicLegalLinks.map((link) => (
            <Link
              key={link.href}
              className="transition hover:text-ink"
              href={link.href}
            >
              {link.href === "/terms"
                ? copyForLanguage(language, "Terms", "Términos")
                : link.href === "/privacy"
                  ? copyForLanguage(language, "Privacy", "Privacidad")
                  : link.href === "/cookie"
                    ? copyForLanguage(language, "Cookie", "Cookies")
                    : copyForLanguage(language, "Subprocessors", "Subencargados")}
            </Link>
          ))}
          <Link className="transition hover:text-ink" href="/login">
            {copyForLanguage(language, "Customer login", "Acceso de clientes")}
          </Link>
          <Link className="transition hover:text-ink" href="/signup">
            {copyForLanguage(language, "Create account", "Crear cuenta")}
          </Link>
          <Link className="transition hover:text-ink" href="/admin/login">
            {copyForLanguage(language, "Internal admin", "Admin interno")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
