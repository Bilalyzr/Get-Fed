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

/** Only same-app paths are ever honored. Absolute URLs are accepted only
 *  when they are same-origin (withAuth builds absolute callbackUrls), and are
 *  reduced to their pathname — anything else is rejected outright. */
function toSafeRelative(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("://")) return url;
  if (
    typeof window !== "undefined" &&
    window.location.origin &&
    url.startsWith(window.location.origin + "/")
  ) {
    return url.slice(window.location.origin.length) || "/";
  }
  return null;
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

  const relative = toSafeRelative(callbackUrl);
  if (!relative) return home;
  if (relative === "/login" || relative === "/register" || relative === "/login/redirect") {
    return home;
  }

  const allowedArea = role === "PROVIDER" ? "/provider" : role === "RECIPIENT" ? "/recipient" : "/admin";
  const roleAppropriate =
    relative.startsWith(allowedArea) ||
    ROLE_AGNOSTIC_PREFIXES.some((prefix) => relative === prefix);

  return roleAppropriate ? relative : home;
}
