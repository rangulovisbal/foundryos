import "server-only";

import { env } from "@/lib/env";

export type PilotAnalyticsEventName =
  | "signup_completed"
  | "workspace_created"
  | "profile_saved"
  | "diagnostic_generated"
  | "roadmap_generated"
  | "actions_generated"
  | "assets_generated"
  | "sops_generated"
  | "support_request_submitted"
  | "deletion_request_submitted"
  | "checkout_started"
  | "admin_request_status_updated";

type AnalyticsValue = string | number | boolean | null;

type AnalyticsProperties = Record<string, AnalyticsValue | undefined>;

function getPostHogConfig() {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "");

  if (!apiKey || !host) {
    return null;
  }

  return { apiKey, host };
}

function compactProperties(properties: AnalyticsProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  );
}

export async function captureAnalyticsEvent(input: {
  event: PilotAnalyticsEventName;
  distinctId: string;
  properties?: AnalyticsProperties;
}) {
  const config = getPostHogConfig();

  if (!config) {
    return { delivered: false as const, reason: "posthog-not-configured" as const };
  }

  try {
    const response = await fetch(`${config.host}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store",
      body: JSON.stringify({
        api_key: config.apiKey,
        event: input.event,
        distinct_id: input.distinctId,
        properties: compactProperties({
          ...input.properties,
          environment: env.vercelEnv,
          app_name: "foundryos",
          analytics_mode: "pilot",
          source: "server"
        }),
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      return {
        delivered: false as const,
        reason: `posthog-http-${response.status}` as const
      };
    }

    return { delivered: true as const };
  } catch {
    return { delivered: false as const, reason: "posthog-capture-failed" as const };
  }
}
