import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { auditHistory } from "@/lib/history-audit";
import { getServices } from "@/lib/services";

export async function GET() {
  try {
    return NextResponse.json({ audit: await auditHistory(getServices().deps) });
  } catch (e) {
    return errorResponse(e);
  }
}
