import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { requireUser } from "@/lib/console-auth";
import { getAccounts } from "@/lib/services";

const view = (k: { id: string; name: string; last4: string; createdAt: Date; lastUsedAt: Date | null; revokedAt: Date | null }) => ({
  id: k.id,
  name: k.name,
  masked: `pk_live_…${k.last4}`,
  createdAt: k.createdAt.toISOString(),
  lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
  revoked: k.revokedAt !== null,
});

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ keys: (await getAccounts().listKeys(user.id)).map(view) });
  } catch (e) {
    return errorResponse(e);
  }
}

/** Creates a key. The full value is in this response only; afterwards only its last four characters are known. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as { name?: unknown };
    const { full, record } = await getAccounts().createKey(user.id, typeof body.name === "string" ? body.name : "");
    return NextResponse.json({ key: full, record: view(record) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
