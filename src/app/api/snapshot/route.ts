import { noStoreJson, publicErrorJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { generateSnapshotReport } from "@/lib/snapshot";
import { businessIntakeSchema } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(`snapshot:${clientIp(request)}`, 4, 60);

    if (!limit.ok) {
      return noStoreJson(
        { error: "Too many snapshot requests. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSec) }
        }
      );
    }

    const json = await request.json();
    const intake = businessIntakeSchema.parse(json);
    const report = generateSnapshotReport(intake);

    return noStoreJson(
      {
        ...report,
        outputStatus: "draft_preview",
        reviewNotice:
          "This is an initial draft preview generated from the submitted intake. Review the context before acting on it."
      },
      {
        headers: {
          "X-FoundryOS-Output-Status": "draft-preview"
        }
      }
    );
  } catch (error) {
    return publicErrorJson(error, "Snapshot request could not be processed.");
  }
}
