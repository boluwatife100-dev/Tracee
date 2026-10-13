import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { isAdminRole, readRole } from "@/lib/admin-role";

/**
 * Whether the signed-in Clerk user has the admin role in their public
 * metadata. Returns false when nobody is signed in.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await currentUser();
  return isAdminRole(readRole(user?.publicMetadata));
}
