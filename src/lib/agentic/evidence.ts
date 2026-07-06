export async function fetchEvidenceFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "user-agent": "FoundryOS-DiagnosisBot/1.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 3000) || null;
  } catch {
    return null;
  }
}
