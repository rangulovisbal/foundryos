import Link from "next/link";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function AlreadySignedInPanel({
  continueHref,
  intent,
  language,
  logoutNextHref
}: {
  continueHref: string;
  intent: "login" | "signup";
  language: OutputLanguage;
  logoutNextHref: string;
}) {
  const isSignup = intent === "signup";

  return (
    <div className="rounded-[28px] border border-[color:var(--border)] bg-white/90 p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {copyForLanguage(language, "Active session", "Sesión activa")}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink">
        {copyForLanguage(
          language,
          "You are already signed in.",
          "Ya has iniciado sesión."
        )}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        {isSignup
          ? copyForLanguage(
              language,
              "Continue with this account, or log out first if you want to create a fresh test account.",
              "Continúa con esta cuenta o cierra sesión primero si quieres crear una cuenta de prueba nueva."
            )
          : copyForLanguage(
              language,
              "Continue with this account, or log out first if you want to sign in with another account.",
              "Continúa con esta cuenta o cierra sesión primero si quieres entrar con otra cuenta."
            )}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          className="inline-flex items-center justify-center rounded-[22px] bg-ink px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-sand transition hover:-translate-y-0.5"
          href={continueHref}
        >
          {copyForLanguage(language, "Continue to app", "Continuar al app")}
        </Link>
        <form action="/api/auth/logout" method="post">
          <input name="next" type="hidden" value={logoutNextHref} />
          <button
            className="inline-flex h-full w-full items-center justify-center rounded-[22px] border border-[color:var(--border)] bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-[#FBFAF7]"
            type="submit"
          >
            {isSignup
              ? copyForLanguage(
                  language,
                  "Log out and create a new account",
                  "Cerrar sesión y crear una cuenta nueva"
                )
              : copyForLanguage(
                  language,
                  "Log out and sign in with another account",
                  "Cerrar sesión y entrar con otra cuenta"
                )}
          </button>
        </form>
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        {copyForLanguage(
          language,
          "Logging out clears this browser session before showing the auth form again.",
          "Cerrar sesión limpia esta sesión del navegador antes de mostrar el formulario de acceso otra vez."
        )}
      </p>
    </div>
  );
}
