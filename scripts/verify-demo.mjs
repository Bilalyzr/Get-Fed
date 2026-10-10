/* eslint-disable no-console */
// ---------------------------------------------------------------------------
// Live HTTP verification of the PRD §54 demo scenario + key edge cases.
// Run with the server up:  node scripts/verify-demo.mjs
// ---------------------------------------------------------------------------
const BASE = process.env.BASE_URL ?? "http://localhost:3100";

async function api(path, { method = "GET", body, token, cookies, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookies ? { Cookie: cookies } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, headers: res.headers };
}

// --- Auth.js credentials sign-in via the session endpoints -----------------
async function login(email, password) {
  // Fetch csrf token + cookie jar
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfCookie = csrfRes.headers.get("set-cookie")?.split(";")[0] ?? "";
  const { csrfToken } = await csrfRes.json();

  const callbackRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie,
    },
    body: new URLSearchParams({ email, password, csrfToken }),
    redirect: "manual",
  });
  const sessionCookie =
    callbackRes.headers.get("set-cookie")?.match(/next-auth\.session-token=[^;]+/)?.[0] ?? "";
  return sessionCookie;
}

function assert(cond, label) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ FAILED: ${label}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log("Live demo scenario verification (PRD §54/§75)\n");

  // 1. Provider logs in
  const providerCookie = await login("events@college.edu", "Password123!");
  assert(providerCookie.length > 0, "Provider login (events@college.edu)");

  const sessionRes = await api("/api/auth/session", { cookies: providerCookie });
  assert(sessionRes.json?.user?.role === "PROVIDER", "Session reports PROVIDER role");

  // 2. Creates 60-meal listing (demo scenario)
  const createRes = await api("/api/listings", {
    method: "POST",
    cookies: providerCookie,
    body: {
      foodName: "Vegetable Biryani",
      description: "Symposium buffet surplus — fresh and packed.",
      category: "COOKED_MEALS",
      totalQuantity: 60,
      unit: "PORTIONS",
      preparedAt: new Date(Date.now() - 60 * 60_000).toISOString(),
      availableFrom: new Date().toISOString(),
      pickupDeadline: new Date(Date.now() + 90 * 60_000).toISOString(),
      pickupAddress: "Alumni Hall, University Campus",
      latitude: 12.9716,
      longitude: 77.5946,
      notes: "Ask for the events desk.",
    },
  });
  assert(createRes.json?.success === true, "Listing created (HTTP 201)");
  const listingId = createRes.json.data.listing.id;
  assert(createRes.json.data.listing.status === "AVAILABLE", "Listing is AVAILABLE");
  assert(createRes.json.data.listing.availableQuantity === 60, "60 meals available");

  // 3. Verified recipient discovers it
  const recipientCookie = await login("hope@kitchen.org", "Password123!");
  assert(recipientCookie.length > 0, "Recipient login (hope@kitchen.org)");

  const discoverRes = await api(
    `/api/listings?latitude=12.97&longitude=77.59&sort=distance`,
    { cookies: recipientCookie }
  );
  const found = discoverRes.json?.data?.items?.find((i) => i.id === listingId);
  assert(!!found, "Recipient discovery shows the new listing");
  assert(found?.availableQuantity === 60, "Discovery reports 60 available");
  assert(found?.distanceKm != null && found.distanceKm < 1, `Distance computed (${found?.distanceKm} km)`);

  // 4. Recipient claims 40 (partial claim)
  const claimRes = await api(`/api/listings/${listingId}/claims`, {
    method: "POST",
    cookies: recipientCookie,
    body: { quantity: 40 },
  });
  assert(claimRes.json?.success === true, "Partial claim of 40 accepted");
  assert(claimRes.json.data.availableQuantity === 20, "20 remain available");
  assert(claimRes.json.data.listingStatus === "PARTIALLY_RESERVED", "Listing PARTIALLY_RESERVED");
  const claimId = claimRes.json.data.claimId;

  // 5. QR generation
  const qrRes = await api(`/api/claims/${claimId}/qr`, { cookies: recipientCookie });
  assert(qrRes.json?.success === true, "QR endpoint returns signed payload");
  const signedPayload = qrRes.json.data.signedPayload;
  assert(signedPayload.length > 60, "Signed QR payload is substantial");

  // 6. Provider scans QR → backend verifies
  const scanRes = await api("/api/claims/scan/verify", {
    method: "POST",
    cookies: providerCookie,
    body: { payload: signedPayload },
  });
  assert(scanRes.json?.success === true, "QR scan verified & COLLECTED");
  assert(scanRes.json.data.quantity === 40, "40 meals recorded collected");

  // 7. Double scan rejected
  const doubleScanRes = await api("/api/claims/scan/verify", {
    method: "POST",
    cookies: providerCookie,
    body: { payload: signedPayload },
  });
  assert(doubleScanRes.json?.code === "ALREADY_COLLECTED", "Double scan → ALREADY_COLLECTED");

  // 8. Tampered QR rejected
  const tampered = `x${signedPayload.slice(1)}`;
  const tamperRes = await api("/api/claims/scan/verify", {
    method: "POST",
    cookies: providerCookie,
    body: { payload: tampered },
  });
  assert(tamperRes.json?.code === "INVALID_TOKEN", "Tampered QR → INVALID_TOKEN");

  // 9. Provider dashboard reflects recovery
  const dashRes = await api("/api/dashboard/provider", { cookies: providerCookie });
  assert(
    (dashRes.json?.data?.metrics?.mealsRecovered ?? 0) >= 40,
    "Provider dashboard: meals recovered ≥ 40"
  );

  // 10. Analytics flow
  const analyticsRes = await api("/api/provider/analytics", { cookies: providerCookie });
  assert(analyticsRes.json?.data?.successfulCollections >= 1, "Provider analytics show collection");

  // --- Edge cases over HTTP ---------------------------------------------
  console.log("\nEdge cases over HTTP");

  // Unverified recipient cannot claim
  const pendingCookie = await login("new@ngo.org", "Password123!");
  const pendingClaimRes = await api(`/api/listings/${listingId}/claims`, {
    method: "POST",
    cookies: pendingCookie,
    body: { quantity: 5 },
  });
  assert(
    pendingClaimRes.json?.code === "RECIPIENT_NOT_VERIFIED",
    "Unverified recipient → RECIPIENT_NOT_VERIFIED"
  );

  // Provider cannot claim own listing (role gate rejects before the engine's
  // SELF_CLAIM check — any rejection satisfies PRD test 8).
  const selfClaimRes = await api(`/api/listings/${listingId}/claims`, {
    method: "POST",
    cookies: providerCookie,
    body: { quantity: 5 },
  });
  assert(
    selfClaimRes.json?.success === false &&
      ["SELF_CLAIM", "FORBIDDEN", "RECIPIENT_NOT_VERIFIED"].includes(selfClaimRes.json?.code),
    `Provider own-claim rejected (${selfClaimRes.json?.code})`
  );

  // Recipient cannot modify provider listing
  const patchRes = await api(`/api/listings/${listingId}`, {
    method: "PATCH",
    cookies: recipientCookie,
    body: { foodName: "Hacked" },
  });
  assert(patchRes.json?.code === "FORBIDDEN", "Recipient PATCH listing → FORBIDDEN");

  // Concurrent claims: 10 remain mathematically impossible on COLLECTED —
  // create a fresh listing and race two claims of 15 against 20.
  const raceListing = await api("/api/listings", {
    method: "POST",
    cookies: providerCookie,
    body: {
      foodName: "Race Test Meal",
      description: "Concurrency verification listing",
      category: "COOKED_MEALS",
      totalQuantity: 20,
      unit: "PORTIONS",
      preparedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
      availableFrom: new Date().toISOString(),
      pickupDeadline: new Date(Date.now() + 60 * 60_000).toISOString(),
      pickupAddress: "Test Point",
      latitude: 12.9716,
      longitude: 77.5946,
    },
  });
  const raceId = raceListing.json.data.listing.id;
  const secondRecipient = await login("contact@greenplate.org", "Password123!");
  const [r1, r2] = await Promise.all([
    api(`/api/listings/${raceId}/claims`, { method: "POST", cookies: recipientCookie, body: { quantity: 15 } }),
    api(`/api/listings/${raceId}/claims`, { method: "POST", cookies: secondRecipient, body: { quantity: 15 } }),
  ]);
  const successes = [r1, r2].filter((r) => r.json?.success).length;
  const rejections = [r1, r2].filter((r) => r.json?.code === "INSUFFICIENT_QUANTITY").length;
  assert(successes === 1 && rejections === 1, "Concurrent 15+15 vs 20 → exactly one succeeds");

  // Cancellation before deadline restores quantity
  const okClaim = [r1, r2].find((r) => r.json?.success);
  const cancelRes = await api(`/api/claims/${okClaim.json.data.claimId}/cancel`, {
    method: "POST",
    cookies: okClaim === r1 ? recipientCookie : secondRecipient,
  });
  assert(cancelRes.json?.data?.restored === true, "Cancellation before deadline restores quantity");

  const afterCancel = await api(`/api/listings/${raceId}`, { cookies: providerCookie });
  assert(afterCancel.json?.data?.listing?.availableQuantity === 20, "Quantity back to 20 after cancel");
  assert(afterCancel.json?.data?.listing?.status === "AVAILABLE", "Listing back to AVAILABLE");

  // Admin verification flow
  const adminCookie = await login("admin@foodworthsaving.dev", "Password123!");
  const pendingUsers = await api("/api/admin/users?status=PENDING", { cookies: adminCookie });
  const pendingUser = pendingUsers.json?.data?.find(
    (u) => u.role === "RECIPIENT" && u.email === "new@ngo.org"
  );
  assert(!!pendingUser, "Admin sees PENDING recipient (new@ngo.org)");
  const verifyRes = await api(`/api/admin/users/${pendingUser.id}/verify`, {
    method: "POST",
    cookies: adminCookie,
    body: { status: "VERIFIED" },
  });
  assert(verifyRes.json?.success === true, "Admin verifies recipient");

  // Now the recipient can claim
  const postVerify = await api(`/api/listings/${raceId}/claims`, {
    method: "POST",
    cookies: pendingCookie,
    body: { quantity: 5 },
  });
  assert(postVerify.json?.success === true, "Newly-verified recipient can now claim");

  // Cron endpoint works (secured with CRON_SECRET when configured)
  const cronSecret = process.env.CRON_SECRET ?? "dev-cron-secret";
  const cronRes = await api("/api/cron/expiry", {
    headers: { Authorization: `Bearer ${cronSecret}` },
  });
  assert(cronRes.json?.success === true, "Cron expiry endpoint runs (with secret)");
  const cronNoAuth = await api("/api/cron/expiry");
  assert(cronNoAuth.status === 401, "Cron endpoint rejects missing secret");

  console.log(process.exitCode ? "\nSOME CHECKS FAILED" : "\nAll live checks passed ✔");
}

main().catch((error) => {
  console.error("Verification crashed:", error);
  process.exit(1);
});
