/**
 * Production backoff after a failed sync attempt:
 * `delayMs = min(cap, baseDelayMs * 2^exponent) + jitter`
 *
 * `exponent` is the zero-based failure index **before** incrementing the stored
 * `attempts` counter (i.e. use `row.attempts` at claim time: first failure → 0 → delay ≈ base).
 * Jitter reduces synchronized retries (thundering herd).
 */
export function computeNextAttemptDelayMs(params: {
  exponent: number;
  baseDelayMs: number;
  maxBackoffMs: number;
  maxJitterMs: number;
}): number {
  const { exponent, baseDelayMs, maxBackoffMs, maxJitterMs } = params;
  const exp = Math.max(0, exponent);
  const exponential = baseDelayMs * 2 ** exp;
  const capped = Math.min(maxBackoffMs, exponential);
  const jitter = Math.floor(Math.random() * (maxJitterMs + 1));
  return capped + jitter;
}
