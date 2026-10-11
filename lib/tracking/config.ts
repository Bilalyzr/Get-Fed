// Tracking configuration (spec §17) — env-overridable, safe defaults.

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const TRACKING_CONFIG = {
  /** metres from pickup point that counts as arrived */
  arrivalRadiusMeters: num("TRACKING_ARRIVAL_RADIUS_M", 100),
  /** fixes with accuracy worse than this never count for arrival */
  maxAccuracyMeters: num("TRACKING_MAX_ACCURACY_M", 50),
  /** consecutive qualifying fixes required for arrival */
  arrivalFixThreshold: 2,
  /** arrival state re-arms only beyond radius × this factor (hysteresis) */
  arrivalHysteresisFactor: 2.5,
  /** seconds without a fix before location is considered stale */
  staleThresholdSeconds: num("TRACKING_STALE_SECONDS", 30),
  /** minutes added on top of ETA when judging deadline risk */
  pickupBufferMinutes: num("TRACKING_PICKUP_BUFFER_MIN", 10),
  /** reject client timestamps further than this from server time */
  maxClockSkewMinutes: 10,
  /** re-allow a delay alert after this many minutes of being on-time */
  delayRearmMinutes: 10,
  /** auto-stop ACTIVE sessions with no fix for this many minutes (cron) */
  autoStopStaleMinutes: num("TRACKING_AUTO_STOP_STALE_MIN", 15),
} as const;
