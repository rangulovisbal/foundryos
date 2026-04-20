import type { OutputLanguage } from "@/lib/foundation";

export const APP_LANGUAGE_COOKIE_NAME = "foundryos_lang";
export const DEFAULT_LANGUAGE: OutputLanguage = "en";

export function normalizeLanguage(value: string | null | undefined): OutputLanguage {
  return value === "es" ? "es" : "en";
}

export function copyForLanguage(
  language: OutputLanguage,
  english: string,
  spanish: string
) {
  return language === "es" ? spanish : english;
}

export function formatLanguageLabel(language: OutputLanguage) {
  return copyForLanguage(language, "English", "Español");
}

export function formatLanguageLongLabel(language: OutputLanguage) {
  return copyForLanguage(language, "English (EN)", "Español (ES)");
}

export function getHtmlLanguage(language: OutputLanguage) {
  return language === "es" ? "es" : "en";
}

export function getLanguageLocale(language: OutputLanguage) {
  return language === "es" ? "es-ES" : "en-US";
}

export function formatDateTimeForLanguage(
  language: OutputLanguage,
  value: string | number | Date
) {
  return new Date(value).toLocaleString(getLanguageLocale(language));
}

export function formatDateForLanguage(
  language: OutputLanguage,
  value: string | number | Date
) {
  return new Date(value).toLocaleDateString(getLanguageLocale(language));
}
