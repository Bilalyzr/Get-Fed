"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// usePickupTracking (spec §8) — wraps navigator.geolocation.watchPosition
// with explicit consent, 5s submission throttling, stale/permission/error
// states, duplicate-submission prevention, retry, and full cleanup.
// ---------------------------------------------------------------------------

export type TrackingUiState = {
  sharing: boolean;
  permission: "unknown" | "granted" | "denied" | "unavailable";
  lastError: string | null;
  lastSubmittedAt: number | null;
  fixCount: number;
};

const SUBMIT_INTERVAL_MS = 5000;

export function usePickupTracking(claimId: string | null) {
  const [state, setState] = useState<TrackingUiState>({
    sharing: false,
    permission: "unknown",
    lastError: null,
    lastSubmittedAt: null,
    fixCount: 0,
  });

  const watcherRef = useRef<number | null>(null);
  const latestFixRef = useRef<GeolocationPosition | null>(null);
  const submittingRef = useRef(false);
  const lastSentAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const claimRef = useRef(claimId);
  claimRef.current = claimId;

  const submitFix = useCallback(async (pos: GeolocationPosition) => {
    if (submittingRef.current || !claimRef.current) return; // no duplicates
    submittingRef.current = true;
    try {
      const res = await fetch(`/api/claims/${claimRef.current}/tracking/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy ?? 50,
          headingDegrees: pos.coords.heading ?? null,
          speedMps: pos.coords.speed ?? null,
          clientTimestamp: new Date(pos.timestamp).toISOString(),
        }),
      });
      if (res.status === 409 || res.status === 404) {
        // session no longer eligible — stop locally
        stopWatching();
        return;
      }
      if (!res.ok && res.status !== 429) {
        setState((s) => ({ ...s, lastError: "Could not send location — retrying." }));
      } else {
        lastSentAtRef.current = Date.now();
        setState((s) => ({
          ...s,
          lastError: null,
          lastSubmittedAt: lastSentAtRef.current,
          fixCount: s.fixCount + 1,
        }));
      }
    } catch {
      setState((s) => ({ ...s, lastError: "Network issue — will retry with the next fix." }));
    } finally {
      submittingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopWatching = useCallback(() => {
    if (watcherRef.current != null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watcherRef.current);
    }
    watcherRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState((s) => ({ ...s, sharing: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    if (!claimId) return false;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, permission: "unavailable" }));
      return false;
    }

    // Explicit consent + session creation first (spec §4 step 3–4).
    const startRes = await fetch(`/api/claims/${claimId}/tracking/start`, { method: "POST" });
    if (!startRes.ok) return false;

    navigator.geolocation.getCurrentPosition(
      () => setState((s) => ({ ...s, permission: "granted" })),
      (err) =>
        setState((s) => ({
          ...s,
          permission: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
        })),
      { enableHighAccuracy: true, timeout: 10_000 }
    );

    watcherRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        latestFixRef.current = pos;
        setState((s) => (s.permission === "granted" ? s : { ...s, permission: "granted" }));
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState((s) => ({ ...s, permission: "denied", sharing: false }));
          stopWatching();
        } else {
          setState((s) => ({ ...s, lastError: "GPS signal lost — retrying." }));
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15_000 }
    );

    // Throttled submission loop: newest fix, at most one in flight.
    timerRef.current = setInterval(() => {
      const fix = latestFixRef.current;
      const now = Date.now();
      if (!fix) return;
      if (now - fix.timestamp > 60_000) return; // stale device fix — skip
      if (now - lastSentAtRef.current < SUBMIT_INTERVAL_MS) return;
      void submitFix(fix);
    }, 1500);

    setState((s) => ({ ...s, sharing: true, lastError: null }));
    return true;
  }, [claimId, submitFix, stopWatching]);

  const stop = useCallback(async () => {
    stopWatching();
    latestFixRef.current = null;
    if (claimRef.current) {
      await fetch(`/api/claims/${claimRef.current}/tracking/stop`, { method: "POST" }).catch(
        () => undefined
      );
    }
  }, [stopWatching]);

  // Cleanup watchers and timers on unmount (spec §18).
  useEffect(() => {
    return () => {
      if (watcherRef.current != null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watcherRef.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { state, start, stop };
}
