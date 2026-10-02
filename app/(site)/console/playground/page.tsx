import { Playground } from "@/components/developer/playground";
import { getChainMode } from "@/lib/config";
export default function Page() {
  return <Playground simulation={getChainMode() === "memory"} />;
}
