import { noStoreJson, publicErrorJson, getClientIp } from "@/lib/http";
import { consumeRateLimit } from "@/lib/rate-limit";
import { generateSnapshotReport } from "@/lib/snapshot";
import { businessIntakeSchema } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = consumeRateLimit(`snapshot:${ip}`, {
      max: 4,
      windowMs: 60_000
    });

    if (!rateLimit.success) {
      return noStoreJson(
        { error: "Too many snapshot requests. Try again shortly." },
        { status: 429 }
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
          "This is an initial draft preview, not a final reviewed FoundryOS pilot output."
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
