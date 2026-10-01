import { NewProofForm } from "@/components/new-proof-form";
import { getAIProviderName } from "@/lib/config";

export default function NewProofPage() {
  return <NewProofForm aiProvider={getAIProviderName()} />;
}
