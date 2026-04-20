"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OutputLanguage } from "@/lib/foundation";
import { copyForLanguage } from "@/lib/language";

export function SignupForm({
  canSubmit,
  initialEmail,
  language,
  redirectTo
}: {
  canSubmit: boolean;
  initialEmail: string;
  language: OutputLanguage;
  redirectTo: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [emailDelivery, setEmailDelivery] = useState(true);
  const [loading, setLoading] = useState(false);
  const loginHref = redirectTo === "/app" ? "/login" : `/login?redirectTo=${encodeURIComponent(redirectTo)}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage(
        copyForLanguage(
          language,
          "Account creation is unavailable here until verification can be delivered.",
          "La creación de cuentas no está disponible aquí hasta que la verificación pueda entregarse."
        )
      );
      return;
    }

    setLoading(true);
    setMessage(null);
    setPreviewUrl(null);
    setEmailDelivery(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fullName, email, language, password, redirectTo })
      });

      const payload = (await response.json()) as {
        error?: string;
        verificationPreviewUrl?: string | null;
        emailDelivery?: boolean;
        deliveryMode?: "email" | "preview_link" | "unavailable";
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            copyForLanguage(language, "Signup failed.", "No se pudo crear la cuenta.")
        );
      }

      setMessage(
        copyForLanguage(
          language,
          "Account created. Verify your email before entering the workspace.",
          "Cuenta creada. Verifica tu correo antes de entrar al espacio."
        )
      );
      setPreviewUrl(payload.verificationPreviewUrl ?? null);
      setEmailDelivery(payload.emailDelivery ?? true);

      if (!payload.verificationPreviewUrl && (payload.emailDelivery ?? true)) {
        router.push(
          `/verify-email?status=sent&email=${encodeURIComponent(email)}&redirectTo=${encodeURIComponent(redirectTo)}`
        );
        return;
      }

      if (!payload.verificationPreviewUrl && !(payload.emailDelivery ?? true)) {
        setMessage(
          copyForLanguage(
            language,
            "Account created, but this environment cannot deliver the verification step yet. Use a configured environment or enable preview auth links before continuing.",
            "La cuenta se creó, pero este entorno todavía no puede completar la verificación. Usa un entorno configurado o habilita enlaces de vista previa antes de continuar."
          )
        );
        return;
      }

      if (redirectTo !== "/app") {
        setMessage(
          copyForLanguage(
            language,
            "Account created. Verify the link above and you’ll continue to the page you originally requested.",
            "Cuenta creada. Verifica el enlace de arriba y después continuarás a la página que solicitaste."
          )
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <InputField
          label={copyForLanguage(language, "Full name", "Nombre completo")}
          onChange={setFullName}
          placeholder={copyForLanguage(language, "Ricardo Angulo", "Ricardo Angulo")}
          value={fullName}
        />
        <InputField
          label="Email"
          onChange={setEmail}
          placeholder="you@company.com"
          type="email"
          value={email}
        />
        <InputField
          label={copyForLanguage(language, "Password", "Contraseña")}
          onChange={setPassword}
          placeholder={copyForLanguage(
            language,
            "Minimum 10 characters",
            "Mínimo 10 caracteres"
          )}
          type="password"
          value={password}
        />
        <button
          className="rounded-[24px] bg-ink px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-sand disabled:opacity-60"
          disabled={!canSubmit || loading}
          type="submit"
        >
          {loading
            ? copyForLanguage(language, "Creating account...", "Creando cuenta...")
            : copyForLanguage(language, "Create account", "Crear cuenta")}
        </button>
      </form>

      {message ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          <p>{message}</p>
          {previewUrl ? (
            <div className="mt-3 space-y-3">
              <p>
                {copyForLanguage(
                  language,
                  "This environment is using a preview verification link instead of live email. Use it now to confirm your account.",
                  "Este entorno usa un enlace de verificación de vista previa en lugar de correo real. Úsalo ahora para confirmar tu cuenta."
                )}
              </p>
              <a
                className="inline-flex rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-sand"
                href={previewUrl}
              >
                {copyForLanguage(language, "Verify email now", "Verificar correo ahora")}
              </a>
            </div>
          ) : !emailDelivery ? (
            <p className="mt-2">
              {copyForLanguage(
                language,
                "Verification delivery is unavailable in this environment. Signup should be completed from a configured environment instead of assuming email is working.",
                "La entrega de verificación no está disponible en este entorno. El registro debe completarse desde un entorno configurado en lugar de asumir que el correo funciona."
              )}
            </p>
          ) : null}
        </div>
      ) : null}

      {!canSubmit ? (
        <div className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {copyForLanguage(
            language,
            "This environment cannot complete account verification yet, so signup is disabled here.",
            "Este entorno todavía no puede completar la verificación de cuentas, por lo que el registro está deshabilitado aquí."
          )}
        </div>
      ) : null}

      <p className="text-sm text-muted">
        {copyForLanguage(language, "Already have an account?", "¿Ya tienes una cuenta?")}{" "}
        <Link className="font-semibold text-ink underline" href={loginHref}>
          {copyForLanguage(language, "Log in", "Iniciar sesión")}
        </Link>
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 outline-none"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}
