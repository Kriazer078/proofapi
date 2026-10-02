"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n";
import { DEV } from "@/lib/i18n/developer";
export function DeveloperSignIn({
  github,
  local,
  callbackUrl,
}: {
  github: boolean;
  local: boolean;
  callbackUrl: string;
}) {
  const { locale } = useI18n();
  const d = DEV[locale];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function login(provider: string) {
    setBusy(true);
    setError(false);
    try {
      if (provider === "dev") {
        const result = await signIn("dev", { callbackUrl, redirect: false });
        if (!result?.ok) throw new Error("login");
        window.location.assign(callbackUrl);
      } else await signIn(provider, { callbackUrl });
    } catch {
      setError(true);
      setBusy(false);
    }
  }
  return (
    <div className="mt-6 space-y-3">
      {github && (
        <Button
          className="w-full"
          disabled={busy}
          onClick={() => login("github")}
        >
          {busy ? d.loading : d.github}
        </Button>
      )}
      {local && (
        <>
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => login("dev")}
          >
            {busy ? d.loading : d.local}
          </Button>
          <p className="text-xs text-text-muted">{d.localNote}</p>
        </>
      )}
      {!github && !local && (
        <p className="rounded-md border p-4 text-sm text-text-secondary">
          {d.authUnavailable}
        </p>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {d.error}
        </p>
      )}
    </div>
  );
}
