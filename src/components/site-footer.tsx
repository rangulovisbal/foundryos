import Link from "next/link";

import { env } from "@/lib/env";
import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";
import { publicLegalLinks } from "@/lib/legal";

export function SiteFooter({ language }: { language: OutputLanguage }) {
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
                "Marketing diagnosis and 30-day planning for early-stage businesses that need a clearer offer, message, channel focus, and next step.",
                "Diagnóstico de marketing y planificación a 30 días para negocios en fase inicial que necesitan una oferta más clara, mejor mensaje, foco de canal y un siguiente paso concreto."
              )}
            </p>
          </div>
          <div className="text-sm text-muted">
            {env.stripeCheckoutEnabled ? (
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
                    "The first pilot is assisted and request-access only.",
                    "El primer piloto es asistido y solo por solicitud."
                  )}
                </p>
                <p>
                  {copyForLanguage(
                    language,
                    "Stripe checkout stays disabled until paid provisioning is verified.",
                    "Stripe permanece desactivado hasta verificar el alta de clientes de pago."
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
