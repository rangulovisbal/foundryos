import { z } from "zod";

import { getLatestAgenticDiagnosis, setPlanTaskDone } from "@/db/foundation";
import { getCurrentWorkspaceContext } from "@/lib/auth";
import { canAccessWorkspace } from "@/lib/foundation";
import { noStoreJson, publicErrorJson } from "@/lib/http";

const taskDoneSchema = z.object({
  diagnosis_id: z.string().uuid(),
  week: z.number().int().min(1).max(4),
  task_title: z.string().trim().min(1).max(500),
  done: z.boolean()
});

export async function POST(request: Request) {
  try {
    const context = await getCurrentWorkspaceContext();

    if (!context || !canAccessWorkspace(context.workspace.accountState)) {
      return noStoreJson({ error: "Authentication required." }, { status: 401 });
    }

    const payload = taskDoneSchema.parse(await request.json());

    const latest = await getLatestAgenticDiagnosis(context.workspace.id);
    if (!latest || latest.id !== payload.diagnosis_id) {
      return noStoreJson(
        { error: "Task progress can only be saved for the latest diagnosis of this workspace." },
        { status: 403 }
      );
    }

    await setPlanTaskDone({
      workspaceId: context.workspace.id,
      agenticDiagnosisId: payload.diagnosis_id,
      week: payload.week,
      taskTitle: payload.task_title,
      done: payload.done,
      updatedByUserId: context.user.id
    });

    return noStoreJson({ ok: true });
  } catch (error) {
    return publicErrorJson(error, "Failed to save task progress.");
  }
}
