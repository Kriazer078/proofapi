import { redirect } from "next/navigation";
import { currentUser, githubConfigured, devLoginEnabled } from "@/lib/auth";
import { getMessages } from "@/lib/i18n/server";
import { DEV } from "@/lib/i18n/developer";
import { DeveloperSignIn } from "@/components/developer/sign-in";
import { LinkButton } from "@/components/primitives";
export default async function SigninPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const target =
    callbackUrl && /^\/console(?:\/|$)/.test(callbackUrl)
      ? callbackUrl
      : "/console";
  if (await currentUser()) redirect(target);
  const { locale } = await getMessages();
  const d = DEV[locale];
  return (
    <div className="mx-auto max-w-lg page-space">
      <h1 className="page-title">{d.signin}</h1>
      <p className="page-intro">{d.signinLead}</p>
      <DeveloperSignIn
        github={githubConfigured()}
        local={devLoginEnabled()}
        callbackUrl={target}
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <LinkButton href="/developers">{d.quickstart}</LinkButton>
        <LinkButton href="/playground">{d.demo}</LinkButton>
      </div>
    </div>
  );
}
