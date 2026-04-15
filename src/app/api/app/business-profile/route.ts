import { NextResponse } from "next/server";

import {
  getBusinessProfile,
  updateWorkspace,
  upsertBusinessProfile
} from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { getErrorMessage, getErrorStatus } from "@/lib/errors";
import {
  businessProfileSchema,
  canAccessWorkspace,
  canEditBusinessProfile
} from "@/lib/foundation";

export async function GET() {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context || !canAccessWorkspace(context.workspace.accountState)) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const profile = await getBusinessProfile(context.workspace.id);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Business profile could not be loaded.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canAccessWorkspace(context.workspace.accountState)) {
      return NextResponse.json(
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
      return NextResponse.json(
        { error: "You do not have permission to update this business profile." },
        { status: 403 }
      );
    }

    const payload = businessProfileSchema.parse(await request.json());
    await updateWorkspace(context.workspace.id, {
      outputLanguage: payload.outputLanguage
    });
    const profile = await upsertBusinessProfile(context.workspace.id, payload);

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Business profile could not be saved.")
      },
      { status: getErrorStatus(error, 400) }
    );
  }
}
