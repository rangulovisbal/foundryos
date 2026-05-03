import { ZodError } from "zod";

import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  getBusinessProfile,
  updateUser,
  updateWorkspace,
  upsertBusinessProfile
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import {
  businessProfileSchema,
  canAccessWorkspace,
  canEditBusinessProfile,
  type OutputLanguage
} from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { copyForLanguage } from "@/lib/language";
import { setLanguageCookie } from "@/lib/language-server";

function resolveRequestedLanguage(value: unknown): OutputLanguage {
  if (
    value &&
    typeof value === "object" &&
    "outputLanguage" in value &&
    value.outputLanguage === "es"
  ) {
    return "es";
  }

  return "en";
}

function formatBusinessProfileValidationError(
  error: ZodError,
  language: OutputLanguage
) {
  const issue = error.issues[0];
  const field = String(issue?.path[0] ?? "");
  const fieldLabel = {
    companyName: copyForLanguage(language, "Company name", "Nombre de la empresa"),
    website: copyForLanguage(language, "Website", "Sitio web"),
    channelUrls: copyForLanguage(
      language,
      "Main social / channel URLs",
      "URLs principales de canales"
    )
  }[field] ?? field;

  if (field === "website") {
    return {
      error: copyForLanguage(
        language,
        "Website: leave it blank if you do not have one yet, or enter a valid full URL starting with http:// or https://.",
        "Sitio web: déjalo en blanco si aún no existe, o introduce una URL válida completa que empiece por http:// o https://."
      ),
      field
    };
  }

  if (field === "channelUrls") {
    const index = typeof issue?.path[1] === "number" ? issue.path[1] + 1 : null;

    return {
      error: copyForLanguage(
        language,
        index
          ? `Main social / channel URLs entry ${index}: leave it blank if not available, or enter a valid full URL starting with http:// or https://.`
          : "Main social / channel URLs: leave them blank if not available, or enter valid full URLs starting with http:// or https://.",
        index
          ? `Entrada ${index} de URLs principales de canales: déjala en blanco si no existe, o introduce una URL válida completa que empiece por http:// o https://.`
          : "URLs principales de canales: déjalas en blanco si no existen, o introduce URLs válidas completas que empiecen por http:// o https://."
      ),
      field
    };
  }

  return {
    error: `${fieldLabel}: ${issue?.message ?? copyForLanguage(language, "Invalid value.", "Valor no válido.")}`,
    field
  };
}

export async function GET() {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context || !canAccessWorkspace(context.workspace.accountState)) {
      return noStoreJson({ error: "Authentication required." }, { status: 401 });
    }

    const profile = await getBusinessProfile(context.workspace.id);
    return noStoreJson({ ok: true, profile });
  } catch (error) {
    return publicErrorJson(error, "Business profile could not be loaded.");
  }
}

export async function POST(request: Request) {
  let requestedLanguage: OutputLanguage = "en";

  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return noStoreJson({ error: "Authentication required." }, { status: 401 });
    }

    if (!canAccessWorkspace(context.workspace.accountState)) {
      return noStoreJson(
        { error: "This workspace cannot access the app while it is in lead state." },
        { status: 403 }
      );
    }

    if (
      !canEditBusinessProfile(
        context.membership.role,
        context.workspace.accountState
      )
    ) {
      return noStoreJson(
        { error: "You do not have permission to update this business profile." },
        { status: 403 }
      );
    }

    const rawPayload = await request.json();
    requestedLanguage = resolveRequestedLanguage(rawPayload);
    const payload = businessProfileSchema.parse(rawPayload);
    await updateWorkspace(context.workspace.id, {
      outputLanguage: payload.outputLanguage
    });
    await updateUser(context.user.id, {
      preferredLanguage: payload.outputLanguage
    });
    const savedProfile = await upsertBusinessProfile(context.workspace.id, payload);

    if (!savedProfile) {
      throw new Error("Business profile could not be saved.");
    }

    await captureAnalyticsEvent({
      event: "profile_saved",
      distinctId: context.user.id,
      properties: {
        user_id: context.user.id,
        workspace_id: context.workspace.id,
        workspace_plan: context.workspace.plan,
        account_state: context.workspace.accountState,
        output_language: payload.outputLanguage,
        has_website: Boolean(savedProfile.website && savedProfile.website.length > 0),
        has_positioning_statement: Boolean(
          savedProfile.positioningStatement &&
            savedProfile.positioningStatement.length > 0
        ),
        channel_urls_count: savedProfile.channelUrls.length,
        has_conversion_action: Boolean(
          savedProfile.conversionAction && savedProfile.conversionAction.length > 0
        ),
        has_pricing_model: Boolean(
          savedProfile.pricingModel && savedProfile.pricingModel.length > 0
        ),
        has_sales_process: Boolean(
          savedProfile.salesProcess && savedProfile.salesProcess.length > 0
        ),
        current_channels_count: savedProfile.currentChannels.length,
        current_tools_count: savedProfile.currentTools.length,
        primary_goals_count: savedProfile.primaryGoals.length,
        biggest_bottlenecks_count: savedProfile.biggestBottlenecks.length
      }
    });

    const response = noStoreJson({ ok: true, profile: savedProfile });
    setLanguageCookie(response, payload.outputLanguage);
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      const formatted = formatBusinessProfileValidationError(error, requestedLanguage);
      return noStoreJson(formatted, { status: 400 });
    }

    return publicErrorJson(error, "Business profile could not be saved.");
  }
}
