import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button as UIButton, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const variants = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
  danger: "destructive",
} as const;

/** Compatibility adapter: all behavior and styling come from the shadcn foundation. */
export function Button({
  variant = "secondary",
  ...props
}: Omit<ComponentProps<typeof UIButton>, "variant"> & { variant?: Variant }) {
  return <UIButton variant={variants[variant]} {...props} />;
}
export function LinkButton({
  variant = "secondary",
  className,
  href,
  external,
  children,
}: {
  variant?: Variant;
  className?: string;
  href: string;
  external?: boolean;
  children: ReactNode;
}) {
  const cls = cn(buttonVariants({ variant: variants[variant] }), className);
  if (external)
    return (
      <a
        data-slot="button"
        className={cls}
        href={href}
        target={href.startsWith("mailto:") ? undefined : "_blank"}
        rel="noreferrer"
      >
        {children}
      </a>
    );
  return (
    <Link data-slot="button" className={cls} href={href}>
      {children}
    </Link>
  );
}
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("surface", className)} {...props} />;
}
export function Hash({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[13px] text-text-secondary break-all",
        className,
      )}
    >
      {value}
    </span>
  );
}
const tones = {
  ok: "bg-success-soft text-success",
  bad: "bg-danger-soft text-danger",
  warn: "bg-warning-soft text-warning",
  neutral: "bg-surface-muted text-text-secondary",
  sol: "bg-surface-muted text-text-secondary",
};
export function Pill({
  tone = "neutral",
  dot,
  children,
}: {
  tone?: keyof typeof tones;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <Badge variant="secondary" className={cn("h-auto py-1", tones[tone])}>
      {dot && (
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {children}
    </Badge>
  );
}
const icons = {
  check: Check,
  x: X,
  upload: Upload,
  file: FileText,
  external: ExternalLink,
  copy: Copy,
  download: Download,
  link: LinkIcon,
  arrow: ArrowRight,
  shield: ShieldCheck,
  refresh: RefreshCw,
  trash: Trash2,
  edit: Pencil,
  spark: Sparkles,
};
export function Icon({
  name,
  className = "size-4",
}: {
  name: keyof typeof icons;
  className?: string;
}) {
  const Component = icons[name];
  return (
    <Component className={className} strokeWidth={1.75} aria-hidden="true" />
  );
}
