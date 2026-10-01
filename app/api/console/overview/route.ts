import { NextResponse } from "next/server";
import { MONTHLY_LIMIT, monthStart } from "@/lib/access";
import { errorResponse } from "@/lib/api";
import { requireUser } from "@/lib/console-auth";
import { getServices } from "@/lib/services";

/** Everything the console's overview, usage and certificates screens show, for the signed-in account. */
export async function GET() {
  try {
    const user = await requireUser();
    const { access, accounts, repo } = getServices();
    const now = new Date();
    const since = monthStart(now);
    const uploads = await access.userUploads(user.id, since, 5000);
    const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
    const perDay = Array.from({ length: daysInMonth }, () => 0);
    for (const u of uploads) perDay[u.createdAt.getUTCDate() - 1] += 1;

    const keys = await accounts.listKeys(user.id);
    const keyNames = new Map(keys.map((k) => [k.id, k.name]));
    const recent = await access.userUploads(user.id, new Date(0), 50);
    const certificates = [];
    for (const u of recent) {
      const row = await repo.get(u.proofId);
      if (!row) continue;
      certificates.push({
        id: row.id,
        sequence: row.sequence,
        label: row.inputFileName ?? "Hash-only record",
        status: row.status,
        changed: row.tamperedBackupJson !== null,
        key: u.apiKeyId ? (keyNames.get(u.apiKeyId) ?? "deleted key") : "console",
        createdAt: row.createdAt.toISOString(),
      });
    }

    return NextResponse.json({
      user: { name: user.name, login: user.login, image: user.image },
      usage: { month: uploads.length, limit: MONTHLY_LIMIT, today: perDay[now.getUTCDate() - 1], perDay, monthStart: since.toISOString() },
      activeKeys: keys.filter((k) => !k.revokedAt).length,
      certificates,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
