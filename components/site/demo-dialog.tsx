"use client";
import { Check } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEMO } from "@/lib/i18n/demo";
import { cn } from "@/lib/utils";

type Field = "name" | "email";

/** "Book a demo" button that opens a short form. Requests are stored for the team to answer by email. */
export function DemoDialog({ label, className }: { label: string; className?: string }) {
  const { locale } = useI18n();
  const c = DEMO[locale];
  const id = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Field | null>(null);

  function reset(next: boolean) {
    setOpen(next);
    if (!next) {
      setSentTo(null);
      setError(null);
      setFieldError(null);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    setBusy(true);
    setError(null);
    setFieldError(null);
    try {
      const res = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, locale }),
      });
      if (res.ok) {
        setSentTo(String(body.email ?? "").trim());
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { code?: string };
      const code = data.code as keyof typeof c.errors | undefined;
      if (code === "demo_name") setFieldError("name");
      if (code === "demo_email") setFieldError("email");
      setError(code && code in c.errors ? c.errors[code] : c.errors.generic);
    } catch {
      setError(c.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger render={<Button variant="outline" className={className} />}>
        {label}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-[460px]">
        {sentTo ? (
          <div className="grid justify-items-center gap-3 py-4 text-center" role="status">
            <span className="pop-in grid size-12 place-items-center rounded-full bg-success-soft text-success">
              <Check className="size-6" strokeWidth={2.5} />
            </span>
            <DialogTitle className="text-lg font-semibold">{c.doneTitle}</DialogTitle>
            <DialogDescription className="text-sm text-text-secondary">
              {c.doneText.replace("{email}", sentTo)}
            </DialogDescription>
            <Button className="mt-2 rounded-full" onClick={() => reset(false)}>
              {c.close}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-semibold">{c.title}</DialogTitle>
              <DialogDescription className="text-sm text-text-secondary">{c.lead}</DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} noValidate className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-name`}>{c.name}</Label>
                <Input
                  id={`${id}-name`}
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  aria-invalid={fieldError === "name" || undefined}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-email`}>{c.email}</Label>
                <Input
                  id={`${id}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                  aria-invalid={fieldError === "email" || undefined}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-company`}>
                  {c.company} <span className="font-normal text-text-muted">· {c.optional}</span>
                </Label>
                <Input id={`${id}-company`} name="company" autoComplete="organization" maxLength={150} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${id}-message`}>
                  {c.message} <span className="font-normal text-text-muted">· {c.optional}</span>
                </Label>
                <Textarea
                  id={`${id}-message`}
                  name="message"
                  rows={3}
                  maxLength={2000}
                  placeholder={c.messagePlaceholder}
                />
              </div>
              {/* Hidden from people; bots tend to fill it. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              {error && (
                <p role="alert" className="inline-error">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-text-muted">
                  {c.privacy}{" "}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                    {c.privacyLink}
                  </Link>
                </p>
                <Button type="submit" disabled={busy} className={cn("rounded-full px-5")}>
                  {busy ? c.sending : c.submit}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
