/* eslint-disable no-console */
// Comprehensive API ↔ backend verification. Run with the prod server up:
//   node scripts/verify-all-apis.mjs
const BASE = process.env.BASE_URL ?? "http://localhost:7777";

async function login(email) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const cookies = (csrfRes.headers.getSetCookie() || []).map((c) => c.split(";")[0]).join("; ");
  const { csrfToken } = await csrfRes.json();
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookies },
    body: new URLSearchParams({ email, password: "Password123!", csrfToken }),
    redirect: "manual",
  });
  return (res.headers.getSetCookie() || []).map((c) => c.split(";")[0]).join("; ");
}

async function api(cookie, path, opts = {}) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Cookie: cookie, ...(opts.headers || {}) },
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, ms: Math.round(performance.now() - t0) };
}

const pass = [];
const fail = [];
const check = (name, ok, detail = "") => (ok ? pass : fail).push(`${name}${ok ? "" : ` [${detail}]`}`);

async function main() {
  const provider = await login("events@college.edu");
  const recipient = await login("hope@kitchen.org");
  const admin = await login("admin@getfed.dev");
  check("auth: 3 role logins", !!provider && !!recipient && !!admin);

  // --- LISTINGS FLOW ---
  const created = await api(provider, "/api/listings", {
    method: "POST",
    body: JSON.stringify({
      foodName: "API Sweep Curry",
      description: "Full API verification listing",
      category: "COOKED_MEALS",
      totalQuantity: 25,
      unit: "PORTIONS",
      preparedAt: new Date(Date.now() - 20 * 60000).toISOString(),
      availableFrom: new Date().toISOString(),
      pickupDeadline: new Date(Date.now() + 100 * 60000).toISOString(),
      pickupAddress: "Sweep Counter, Main Hall",
      latitude: 12.9716,
      longitude: 77.5946,
      notes: "",
      allergenNotes: "",
      packagingType: "",
    }),
  });
  check("POST /listings (create)", created.json?.success, created.status);
  const LID = created.json?.data?.listing?.id;

  const discover = await api(recipient, "/api/listings?latitude=12.97&longitude=77.59&sort=distance");
  check("GET /listings (discover+filters)", discover.json?.success && discover.json.data.items.some((i) => i.id === LID), discover.status);

  const detail = await api(recipient, `/api/listings/${LID}`);
  check("GET /listings/:id", detail.json?.success && detail.json.data.listing.foodName === "API Sweep Curry", detail.status);

  const matches = await api(provider, `/api/listings/${LID}/matches`);
  check("GET /listings/:id/matches", matches.json?.success && Array.isArray(matches.json.data), matches.status);

  const patch = await api(provider, `/api/listings/${LID}`, { method: "PATCH", body: JSON.stringify({ notes: "updated by sweep" }) });
  check("PATCH /listings/:id (owner)", patch.json?.success, patch.status);

  const patchForeign = await api(recipient, `/api/listings/${LID}`, { method: "PATCH", body: JSON.stringify({ notes: "hack" }) });
  check("PATCH /listings/:id rejects recipient", patchForeign.status === 403, patchForeign.status);

  // --- CLAIMS FLOW ---
  const claim = await api(recipient, `/api/listings/${LID}/claims`, { method: "POST", body: JSON.stringify({ quantity: 10 }) });
  check("POST /listings/:id/claims (partial 10/25)", claim.json?.success && claim.json.data.availableQuantity === 15, claim.status);
  const CID = claim.json?.data?.claimId;

  const myClaims = await api(recipient, "/api/claims/me");
  check("GET /claims/me", myClaims.json?.success && myClaims.json.data.some((c) => c.id === CID), myClaims.status);

  const pickup = await api(recipient, `/api/claims/${CID}/pickup`, { method: "POST" });
  check("POST /claims/:id/pickup", pickup.json?.success, pickup.status);

  // --- TRACKING FLOW ---
  const tStart = await api(recipient, `/api/claims/${CID}/tracking/start`, { method: "POST" });
  check("POST tracking/start", tStart.json?.success && tStart.json.data.tracking?.status === "ACTIVE", tStart.status);

  const tLoc = await api(recipient, `/api/claims/${CID}/tracking/location`, {
    method: "POST",
    body: JSON.stringify({
      latitude: 12.97,
      longitude: 77.592,
      accuracyMeters: 10,
      headingDegrees: null,
      speedMps: null,
      clientTimestamp: new Date().toISOString(),
    }),
  });
  check("POST tracking/location (routed)", tLoc.json?.success, tLoc.status);

  const tReadProv = await api(provider, `/api/claims/${CID}/tracking`);
  check("GET tracking (provider view)", tReadProv.json?.success && tReadProv.json.data.viewerRole === "PROVIDER", tReadProv.status);

  const tBad = await api(recipient, `/api/claims/${CID}/tracking/location`, {
    method: "POST",
    body: JSON.stringify({ latitude: 999, longitude: 0, accuracyMeters: 5, clientTimestamp: new Date().toISOString() }),
  });
  check("tracking/location rejects bad coords", tBad.json?.code === "VALIDATION_ERROR", tBad.status);

  // --- QR COLLECTION ---
  const qr = await api(recipient, `/api/claims/${CID}/qr`);
  check("GET /claims/:id/qr", qr.json?.success && qr.json.data.signedPayload?.length > 50, qr.status);

  const scan = await api(provider, "/api/claims/scan/verify", { method: "POST", body: JSON.stringify({ payload: qr.json.data.signedPayload }) });
  check("POST /claims/scan/verify (collect 10)", scan.json?.success && scan.json.data.quantity === 10, scan.status);

  const doubleScan = await api(provider, "/api/claims/scan/verify", { method: "POST", body: JSON.stringify({ payload: qr.json.data.signedPayload }) });
  check("double scan rejected", doubleScan.json?.code === "ALREADY_COLLECTED", doubleScan.status);

  const tAfter = await api(recipient, `/api/claims/${CID}/tracking`);
  check(
    "tracking COMPLETED + location cleared after collect",
    tAfter.json?.data?.tracking?.status === "COMPLETED" && tAfter.json.data.tracking.recipientLocation === null,
    tAfter.status
  );

  // --- CANCEL FLOW (fresh listing — the first flips to COLLECTED after its
  // only claim is collected, which is correct behaviour) ---
  const listing2 = await api(provider, "/api/listings", {
    method: "POST",
    body: JSON.stringify({
      foodName: "API Sweep Cancel Test",
      description: "Cancellation flow verification",
      category: "PACKAGED",
      totalQuantity: 20,
      unit: "PORTIONS",
      preparedAt: new Date(Date.now() - 10 * 60000).toISOString(),
      availableFrom: new Date().toISOString(),
      pickupDeadline: new Date(Date.now() + 90 * 60000).toISOString(),
      pickupAddress: "Sweep Counter 2",
      latitude: 12.9716,
      longitude: 77.5946,
      notes: "",
      allergenNotes: "",
      packagingType: "",
    }),
  });
  const LID2 = listing2.json?.data?.listing?.id;
  const c2 = await api(recipient, `/api/listings/${LID2}/claims`, { method: "POST", body: JSON.stringify({ quantity: 5 }) });
  check("claim on fresh listing", c2.json?.success, c2.status);
  const cancel = await api(recipient, `/api/claims/${c2.json.data.claimId}/cancel`, { method: "POST" });
  check("POST /claims/:id/cancel restores quantity", cancel.json?.success && cancel.json.data.restored === true, cancel.status);

  const listCancel = await api(provider, `/api/listings/${LID2}/cancel`, { method: "POST" });
  check("POST /listings/:id/cancel", listCancel.json?.success, listCancel.status);

  // --- DASHBOARDS + NOTIFICATIONS + ACCOUNT + ADMIN ---
  for (const [name, cookie, path] of [
    ["GET /dashboard/provider", provider, "/api/dashboard/provider"],
    ["GET /dashboard/recipient", recipient, "/api/dashboard/recipient"],
    ["GET /dashboard/admin", admin, "/api/dashboard/admin"],
    ["GET /provider/analytics", provider, "/api/provider/analytics"],
    ["GET /notifications", recipient, "/api/notifications"],
    ["GET /account/me", admin, "/api/account/me"],
    ["GET /admin/users", admin, "/api/admin/users"],
    ["GET /admin/listings", admin, "/api/admin/listings"],
    ["GET /admin/claims", admin, "/api/admin/claims"],
    ["GET /admin/analytics", admin, "/api/admin/analytics"],
    ["GET /recipient/profile", recipient, "/api/recipient/profile"],
  ]) {
    const r = await api(cookie, path);
    check(name, r.status === 200 && r.json?.success !== false, r.status);
  }

  const markRead = await api(recipient, "/api/notifications", { method: "PATCH", body: JSON.stringify({}) });
  check("PATCH /notifications (mark read)", markRead.json?.success, markRead.status);

  // --- AUTH GUARDS ---
  const g1 = await api(recipient, "/api/dashboard/admin");
  check("recipient blocked from admin API (403)", g1.status === 403, g1.status);
  const g2 = await fetch(`${BASE}/api/dashboard/provider`);
  check("anonymous blocked (401)", g2.status === 401, g2.status);

  // --- CRON ---
  const cronOk = await api(null, "/api/cron/expiry", { headers: { Authorization: "Bearer dev-cron-secret" } });
  check("cron/expiry with secret", cronOk.json?.success, cronOk.status);
  const cronNo = await fetch(`${BASE}/api/cron/expiry`);
  check("cron/expiry rejects missing secret", cronNo.status === 401, cronNo.status);

  console.log(`=== API VERIFICATION: ${pass.length} passed, ${fail.length} failed ===`);
  fail.forEach((f) => console.log(`  FAIL: ${f}`));
  if (!fail.length) console.log(`ALL ${pass.length} API CHECKS PASSED ✔`);
  process.exitCode = fail.length ? 1 : 0;
}

main().catch((e) => {
  console.error("CRASHED:", e.message);
  process.exit(1);
});
