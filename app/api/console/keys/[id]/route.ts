import { NextResponse } from "next/server";
import { type IdContext, errorResponse } from "@/lib/api";
import { requireUser } from "@/lib/console-auth";
import { NotFoundError } from "@/lib/errors";
import { getAccounts } from "@/lib/services";

/** Revokes a key for good. Requests made with it fail from now on. */
export async function DELETE(_req: Request, { params }: IdContext) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!(await getAccounts().revokeKey(user.id, id))) throw new NotFoundError("Key not found or already revoked");
    return NextResponse.json({ revoked: true });
  } catch (e) {
    return errorResponse(e);
  }
}
