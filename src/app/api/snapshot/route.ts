import { NextResponse } from "next/server";

import { generateSnapshotReportWithAI } from "@/lib/snapshot-ai";
import { businessIntakeSchema } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const intake = businessIntakeSchema.parse(json);
    const report = await generateSnapshotReportWithAI(intake);

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Snapshot request could not be processed."
      },
      { status: 400 }
    );
  }
}
