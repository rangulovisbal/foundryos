import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function createCsp(nonce: string) {
  // React Fast Refresh / HMR in `next dev` evaluates strings as JavaScript, which
  // requires 'unsafe-eval'. It is dev-only and never shipped in a production build,
  // so allow it only in development to keep the production policy strict.
  const devEval = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${devEval} https://js.stripe.com https://challenges.cloudflare.com`,
    // Styles use 'unsafe-inline' (not a nonce) on purpose: React renders dynamic
    // inline style attributes (e.g. progress-bar widths, score rings) that cannot
    // carry a nonce, and adding a nonce here would make the browser ignore
    // 'unsafe-inline' and break them. Scripts stay strict via the nonce above.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://challenges.cloudflare.com https://eu.i.posthog.com https://app.posthog.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com"
  ].join("; ");
}

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = createCsp(nonce);

  // Set the nonce AND the CSP on the request headers so Next.js detects the
  // nonce and applies it to its framework scripts. Without the CSP on the
  // request, Next does not nonce its inline scripts and an active policy would
  // block them.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  if (request.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
