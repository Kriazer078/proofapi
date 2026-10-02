import { Playground } from "@/components/developer/playground";
import { getChainMode } from "@/lib/config";
export default function Page() {
  return (
    <div className="page-space">
      <Playground simulation={getChainMode() === "memory"} />
    </div>
  );
}
