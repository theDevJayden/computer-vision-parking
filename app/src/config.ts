// All runtime config comes from EXPO_PUBLIC_* env vars (inlined at build time by Expo).
// Expo only inlines literal `process.env.EXPO_PUBLIC_X` accesses, so keep them literal.

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  /** Mock service is the default until the real endpoint is confirmed. Set to "false" to use HTTP. */
  useMock: process.env.EXPO_PUBLIC_USE_MOCK !== 'false',
  /** Base URL of the model server; POST {apiBaseUrl}/detect. */
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  /** Wait between the end of one detection and the start of the next. */
  frameIntervalMs: num(process.env.EXPO_PUBLIC_FRAME_INTERVAL_MS, 1000),
  /** No fresh data for this long => show "Stale data". */
  staleTimeoutMs: num(process.env.EXPO_PUBLIC_STALE_TIMEOUT_MS, 10000),
  /** Retry backoff: base * 2^(failures-1), capped. */
  backoffBaseMs: 1000,
  backoffMaxMs: 15000,
  /** Consecutive failures before the status flips from Reconnecting to Offline. */
  offlineAfterFailures: 3,
} as const;
