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
  canEditBusinessProfile
} from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";
import { setLanguageCookie } from "@/lib/language-server";

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

    const payload = businessProfileSchema.parse(await request.json());
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
    return publicErrorJson(error, "Business profile could not be saved.");
  }
}
