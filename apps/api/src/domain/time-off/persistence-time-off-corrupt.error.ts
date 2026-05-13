/**
 * Persisted row violates domain date invariants (should never happen if writes are correct).
 * Not a {@link DomainError} — surfaces as HTTP 500 via Nest default handling.
 */
export class PersistenceTimeOffCorruptError extends Error {
  constructor(
    public readonly rowId: string,
    cause?: unknown,
  ) {
    super(
      `Persisted time-off ${rowId} failed UTC inclusive date invariant` +
        (cause instanceof Error ? `: ${cause.message}` : ""),
    );
    this.name = "PersistenceTimeOffCorruptError";
  }
}
