/**
 * Admin role helpers shared by server and client code.
 *
 * A user is an admin when their Clerk `publicMetadata.role` is set to
 * "admin". Set it in the Clerk dashboard (Users → select user → Metadata →
 * Public) or via the Backend API: `{ "role": "admin" }`.
 */
export function isAdminRole(role: unknown): boolean {
  return typeof role === "string" && role.trim().toLowerCase() === "admin";
}

export function readRole(source: unknown): unknown {
  if (typeof source !== "object" || source === null) return undefined;
  return (source as Record<string, unknown>).role;
}
