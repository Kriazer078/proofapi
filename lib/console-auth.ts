import { type SignedInUser, currentUser } from "./auth";
import { UnauthorizedError } from "./errors";

/** Console routes need a signed-in account; API keys are not accepted here. */
export async function requireUser(): Promise<SignedInUser> {
  const user = await currentUser();
  if (!user) throw new UnauthorizedError("Sign in to use the console.", "signed_out");
  return user;
}
