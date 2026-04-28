import { desc, eq } from "drizzle-orm";

import { requireDb } from "@/db/client";
import * as schema from "@/db/schema";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { canAccessWorkspace } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";

const VALID_MODULE_TYPES = ["diagnostic", "roadmap", "plan_30d", "assets", "sops"] as const;
const VALID_LABELS = ["useful", "partial", "generic"] as const;

type ModuleType = (typeof VALID_MODULE_TYPES)[number];
type FeedbackLabel = (typeof VALID_LABELS)[number];

function isValidModuleType(value: unknown): value is ModuleType {
  return typeof value === "string" && (VALID_MODULE_TYPES as readonly string[]).includes(value);
}

function isValidLabel(value: unknown): value is FeedbackLabel {
  return typeof value === "string" && (VALID_LABELS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context || !canAccessWorkspace(context.workspace.accountState)) {
      return noStoreJson({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, module_type, output_id, label, note } = body;

    if (workspace_id !== context.workspace.id) {
      return noStoreJson({ error: "Workspace mismatch." }, { status: 403 });
    }

    if (!isValidModuleType(module_type)) {
      return noStoreJson(
        { error: `Invalid module_type. Must be one of: ${VALID_MODULE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!isValidLabel(label)) {
      return noStoreJson(
        { error: `Invalid label. Must be one of: ${VALID_LABELS.join(", ")}` },
        { status: 400 }
      );
    }

    if (note !== undefined && note !== null && typeof note !== "string") {
      return noStoreJson({ error: "Note must be a string or null." }, { status: 400 });
    }

    if (output_id !== undefined && output_id !== null && typeof output_id !== "string") {
      return noStoreJson({ error: "output_id must be a UUID string or null." }, { status: 400 });
    }

    const db = await requireDb("output feedback");

    await db
      .insert(schema.outputFeedback)
      .values({
        workspaceId: workspace_id,
        moduleType: module_type,
        outputId: output_id ?? null,
        label,
        note: note ?? null,
        submittedByUserId: context.user.id
      });

    return noStoreJson({ ok: true }, { status: 201 });
  } catch (error) {
    return publicErrorJson(error, "Failed to save feedback.");
  }
}

export async function GET(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context || !canAccessWorkspace(context.workspace.accountState)) {
      return noStoreJson({ error: "Authentication required." }, { status: 401 });
    }

    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspace_id");

    if (!workspaceId || workspaceId !== context.workspace.id) {
      return noStoreJson({ error: "Workspace mismatch or missing." }, { status: 403 });
    }

    const db = await requireDb("output feedback");

    const rows = await db
      .select()
      .from(schema.outputFeedback)
      .where(eq(schema.outputFeedback.workspaceId, workspaceId))
      .orderBy(desc(schema.outputFeedback.submittedAt))
      .limit(100);

    return noStoreJson({ ok: true, feedback: rows });
  } catch (error) {
    return publicErrorJson(error, "Failed to load feedback.");
  }
}
