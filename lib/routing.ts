// ---------------------------------------------------------------------------
// Role-aware post-login routing.
//
// A stale ?callbackUrl= must never send a user into another role's portal
// (e.g. an admin landing on /provider/listings after a provider signed out)
// and must never be allowed as an absolute/external URL (open redirect).
// ---------------------------------------------------------------------------

export const ROLE_HOME: Record<string, string> = {
  PROVIDER: "/provider/dashboard",
  RECIPIENT: "/recipient/dashboard",
  ADMIN: "/admin",
};

/** Pages any authenticated user may be sent to. */
const ROLE_AGNOSTIC_PREFIXES = ["/profile", "/about", "/how-it-works", "/"];

/** Only same-app relative paths are ever honored. */
function isSafeRelative(url: string | null | undefined): url is string {
  return !!url && url.startsWith("/") && !url.startsWith("//") && !url.includes("://");
}

/**
 * Return the callback URL only when the freshly-authenticated role is allowed
 * to see it; otherwise fall back to the role's home dashboard.
 */
export function sanitizeCallbackUrl(
  role: string | undefined | null,
  callbackUrl: string | null | undefined
): string {
  const home = ROLE_HOME[role ?? ""] ?? "/login";

  if (!isSafeRelative(callbackUrl)) return home;
  if (callbackUrl === "/login" || callbackUrl === "/register" || callbackUrl === "/login/redirect") {
    return home;
  }

  const allowedArea = role === "PROVIDER" ? "/provider" : role === "RECIPIENT" ? "/recipient" : "/admin";
  const roleAppropriate =
    callbackUrl.startsWith(allowedArea) ||
    ROLE_AGNOSTIC_PREFIXES.some((prefix) => callbackUrl === prefix);

  return roleAppropriate ? callbackUrl : home;
}
