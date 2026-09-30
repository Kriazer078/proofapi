import { NotFoundError } from "./errors";
import type { ProofPatch, ProofRepo, ProofRow } from "./proof-repo";

export class MemoryProofRepo implements ProofRepo {
  private rows = new Map<string, ProofRow>();

  async create(row: ProofRow): Promise<void> {
    if (this.rows.has(row.id)) throw new Error(`Proof ${row.id} already exists`);
    this.rows.set(row.id, { ...row });
  }

  async get(id: string): Promise<ProofRow | null> {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async update(id: string, patch: ProofPatch): Promise<void> {
    const row = this.rows.get(id);
    if (!row) throw new NotFoundError(`Proof ${id} not found`);
    this.rows.set(id, { ...row, ...patch });
  }

  async delete(id: string): Promise<void> {
    if (!this.rows.delete(id)) throw new NotFoundError(`Proof ${id} not found`);
  }

  async list(): Promise<ProofRow[]> {
    return [...this.rows.values()].map((r) => ({ ...r })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
