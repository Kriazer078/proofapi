import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ConsoleNav } from "@/components/developer/console-nav";
import { isAdminLogin } from "@/lib/demo-requests";
export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/console");
  return (
    <div className="page-space grid items-start gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <ConsoleNav
        name={user.login ?? user.name ?? "Developer"}
        admin={isAdminLogin(user.login)}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
