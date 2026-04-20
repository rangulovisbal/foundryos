"use client";

import { useRouter } from "next/navigation";

import { APP_LANGUAGE_COOKIE_NAME, formatLanguageLabel } from "@/lib/language";
import type { OutputLanguage } from "@/lib/foundation";

export function LanguagePreferencePicker({
  language,
  label
}: {
  language: OutputLanguage;
  label: string;
}) {
  const router = useRouter();

  function handleChange(nextLanguage: OutputLanguage) {
    document.cookie = `${APP_LANGUAGE_COOKIE_NAME}=${nextLanguage}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }

  return (
    <label className="flex items-center gap-3 text-sm font-medium text-muted">
      <span>{label}</span>
      <select
        className="rounded-full border border-[color:var(--border)] bg-white/90 px-3 py-2 text-sm text-ink outline-none"
        onChange={(event) => handleChange(event.target.value as OutputLanguage)}
        value={language}
      >
        <option value="en">{formatLanguageLabel("en")}</option>
        <option value="es">{formatLanguageLabel("es")}</option>
      </select>
    </label>
  );
}
