import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// SSRF guard: these URLs come straight from the founder's business profile,
// so the server must never be coaxed into reading localhost, private ranges,
// or cloud metadata endpoints (169.254.169.254) on their behalf.
const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 262_144; // 256 KB of markup is plenty for evidence.
const FETCH_TIMEOUT_MS = 5000;

export function isPrivateIp(address: string): boolean {
  const ip = address.trim().toLowerCase();

  // IPv4-mapped IPv6 (::ffff:10.0.0.1) hides an IPv4 target.
  if (ip.startsWith("::ffff:")) {
    return isPrivateIp(ip.slice(7));
  }

  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || // "this network"
      a === 10 || // private
      a === 127 || // loopback
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) || // link-local + cloud metadata
      (a === 172 && b >= 16 && b <= 31) || // private
      (a === 192 && b === 168) || // private
      (a === 192 && b === 0) || // IETF reserved (192.0.0.0/24, 192.0.2.0/24)
      (a === 198 && (b === 18 || b === 19)) || // benchmarking
      a >= 224 // multicast + reserved
    );
  }

  if (isIP(ip) === 6) {
    return (
      ip === "::" ||
      ip === "::1" || // loopback
      ip.startsWith("fe8") || // link-local fe80::/10
      ip.startsWith("fe9") ||
      ip.startsWith("fea") ||
      ip.startsWith("feb") ||
      ip.startsWith("fc") || // unique-local fc00::/7
      ip.startsWith("fd")
    );
  }

  // Not an IP literal at all: caller should resolve it first.
  return true;
}

async function resolvesToPublicAddress(hostname: string): Promise<boolean> {
  // URL hostnames may wrap IPv6 literals in brackets.
  const bare = hostname.replace(/^\[|\]$/g, "");

  if (isIP(bare)) {
    return !isPrivateIp(bare);
  }

  try {
    const results = await lookup(bare, { all: true, verbatim: true });
    return results.length > 0 && results.every((entry) => !isPrivateIp(entry.address));
  } catch {
    return false;
  }
}

async function readBodyWithLimit(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();

  if (!reader) {
    return (await response.text()).slice(0, maxBytes);
  }

  const decoder = new TextDecoder();
  let text = "";
  let received = 0;

  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    received += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }

  await reader.cancel().catch(() => undefined);
  return text;
}

export async function fetchEvidenceFromUrl(url: string): Promise<string | null> {
  try {
    let current = new URL(url);
    const timeout = AbortSignal.timeout(FETCH_TIMEOUT_MS);

    // Redirects are followed manually so every hop is re-validated: a benign
    // public page must not be able to bounce the fetch into a private host.
    // Note: validating the resolved addresses before fetch still leaves a
    // narrow DNS-rebinding window; acceptable here because the fetch runs on
    // stateless serverless infra with nothing else listening.
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      if (current.protocol !== "http:" && current.protocol !== "https:") {
        return null;
      }

      if (!(await resolvesToPublicAddress(current.hostname))) {
        return null;
      }

      const res = await fetch(current, {
        signal: timeout,
        redirect: "manual",
        headers: { "user-agent": "FoundryOS-DiagnosisBot/1.0" }
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          return null;
        }
        current = new URL(location, current);
        continue;
      }

      if (!res.ok) {
        return null;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType && !/text\/|html|xml/i.test(contentType)) {
        return null;
      }

      const html = await readBodyWithLimit(res, MAX_BODY_BYTES);
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return text.slice(0, 3000) || null;
    }

    return null;
  } catch {
    return null;
  }
}
