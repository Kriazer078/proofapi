import Image from "next/image";
/** Linked records in the reference blue/green palette. */
export function Logo({ className = "size-6" }: { className?: string }) {
  return (
    <Image
      src="/brand/proofapi-mark.svg"
      width={24}
      height={24}
      className={className}
      alt=""
      aria-hidden="true"
    />
  );
}
