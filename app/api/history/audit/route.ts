import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { auditHistory } from "@/lib/history-audit";
import { getServices } from "@/lib/services";

/** Writes and reads go to Solana; give them time on serverless hosts. */
export const maxDuration = 60;

export async function GET() {
  try {
    return NextResponse.json({ audit: await auditHistory(getServices().deps) });
  } catch (e) {
    return errorResponse(e);
  }
}
