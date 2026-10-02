import { NewProofForm } from "@/components/new-proof-form";
import { getAIProviderName, getChainMode } from "@/lib/config";

export default function NewProofPage() {
  return (
    <NewProofForm
      aiProvider={getAIProviderName()}
      liveChain={getChainMode() === "anchor"}
    />
  );
}
