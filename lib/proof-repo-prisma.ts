import type { Prisma, PrismaClient, Proof } from "@prisma/client";
import type { ProofMode, ProofPatch, ProofRepo, ProofRow, ProofStatus } from "./proof-repo";

function toRow(p: Proof): ProofRow {
  return {
    ...p,
    mode: p.mode as ProofMode,
    status: p.status as ProofStatus,
    inputBlob: p.inputBlob ? Buffer.from(p.inputBlob) : null,
  };
}

function toData(patch: ProofPatch) {
  const { inputBlob, ...rest } = patch;
  if (inputBlob === undefined) return rest;
  return { ...rest, inputBlob: inputBlob === null ? null : new Uint8Array(inputBlob) };
}

export class PrismaProofRepo implements ProofRepo {
  constructor(private readonly db: PrismaClient) {}

  async create(row: ProofRow): Promise<void> {
    const data = { ...toData(row), id: row.id, createdAt: row.createdAt } as Prisma.ProofUncheckedCreateInput;
    await this.db.proof.create({ data });
  }

  async get(id: string): Promise<ProofRow | null> {
    const p = await this.db.proof.findUnique({ where: { id } });
    return p ? toRow(p) : null;
  }

  async update(id: string, patch: ProofPatch): Promise<void> {
    await this.db.proof.update({ where: { id }, data: toData(patch) as Prisma.ProofUncheckedUpdateInput });
  }

  async delete(id: string): Promise<void> {
    await this.db.proof.delete({ where: { id } });
  }

  async list(): Promise<ProofRow[]> {
    const rows = await this.db.proof.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toRow);
  }
}
