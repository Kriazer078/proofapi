import { notFound } from "next/navigation";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";
import { ProofView } from "./proof-view";

export const dynamic = "force-dynamic";

export default async function ProofPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { repo, chain } = getServices();
  const row = await repo.get(id);
  if (!row) notFound();
  return (
    <ProofView
      initial={toPublicProof(row, chain)}
      liveChain={chain.mode === "anchor"}
      issuerName={process.env.ISSUER_NAME ?? "ProofAPI Demo"}
    />
  );
}
