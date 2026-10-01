import { notFound } from "next/navigation";
import { toPublicProof } from "@/lib/public-proof";
import { getServices } from "@/lib/services";
import { ProofView } from "./proof-view";

export const dynamic = "force-dynamic";

export default async function ProofPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const demo = "demo" in (await searchParams);
  const { repo, chain } = getServices();
  const row = await repo.get(id);
  if (!row) notFound();
  return (
    <ProofView
      initial={toPublicProof(row, chain)}
      liveChain={chain.mode === "anchor"}
      issuerName={process.env.ISSUER_NAME ?? "ProofAPI Demo"}
      demo={demo}
    />
  );
}
