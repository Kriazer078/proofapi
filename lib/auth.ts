import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { getAccounts } from "./services";

/** GitHub sign-in is configured when both OAuth values are present. */
export function githubConfigured(): boolean {
  return Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
}

/** Local-only shortcut for trying the console without a GitHub app. Never available in production. */
export function devLoginEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN === "1";
}

const providers: NextAuthOptions["providers"] = [];
if (githubConfigured()) {
  providers.push(GitHubProvider({ clientId: process.env.AUTH_GITHUB_ID!, clientSecret: process.env.AUTH_GITHUB_SECRET! }));
}
if (devLoginEnabled()) {
  providers.push(
    CredentialsProvider({
      id: "dev",
      name: "Development account",
      credentials: {},
      async authorize() {
        const user = await getAccounts().upsertGithubUser({ githubId: "dev-local", login: "developer", name: "Local developer", avatarUrl: null });
        return { id: user.id, name: user.name, image: null };
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // First sign-in: map the GitHub profile to our own user record.
      if (account?.provider === "github" && profile) {
        const gh = profile as { id: number | string; login?: string; name?: string | null; avatar_url?: string };
        const record = await getAccounts().upsertGithubUser({
          githubId: String(gh.id),
          login: gh.login ?? "github-user",
          name: gh.name ?? null,
          avatarUrl: gh.avatar_url ?? null,
        });
        token.uid = record.id;
        token.login = record.login;
      } else if (account?.provider === "dev" && user) {
        token.uid = user.id;
        token.login = "developer";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.uid === "string") {
        (session.user as { id?: string; login?: string }).id = token.uid;
        (session.user as { id?: string; login?: string }).login = typeof token.login === "string" ? token.login : undefined;
      }
      return session;
    },
  },
};

export interface SignedInUser {
  id: string;
  name: string | null;
  login: string | null;
  image: string | null;
}

/** The signed-in user for server components and route handlers, or null. */
export async function currentUser(): Promise<SignedInUser | null> {
  // Without a secret nobody can be signed in, and NextAuth refuses to read sessions in production.
  // Treat every caller as signed out so certificates and the public API keep working.
  if (!authOptions.secret && process.env.NODE_ENV === "production") return null;
  const session = await getServerSession(authOptions);
  const u = session?.user as { id?: string; name?: string | null; login?: string; image?: string | null } | undefined;
  if (!u?.id) return null;
  return { id: u.id, name: u.name ?? null, login: u.login ?? null, image: u.image ?? null };
}
