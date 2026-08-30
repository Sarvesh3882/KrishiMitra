/**
 * operationId.ts
 * Generates unique, sortable operation IDs for resilient writes.
 *
 * Format:  OP-<timestamp_base36><random_base36>
 * Example: OP-M0JX2K4F-A3Z9
 *
 * Properties:
 *  - Monotonically increasing (timestamp prefix) → sortable
 *  - Random suffix  → collision-safe across devices
 *  - No external dependency (no uuid/ulid package needed)
 *  - Stays under 32 chars → safe for the DB text column
 *
 * Rule: generate ONCE before sending.  On retry, REUSE the same ID.
 * Never generate a new ID for a retry — that defeats idempotency.
 */

/**
 * Generate a new operation ID.
 *
 * @example
 * const opId = generateOperationId();
 * // "OP-M0JX2K4F-A3Z9Q1"
 */
export function generateOperationId(): string {
  const ts   = Date.now().toString(36).toUpperCase();          // e.g. "M0JX2K4F"
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase(); // e.g. "A3Z9Q1"
  return `OP-${ts}-${rand}`;
}

/**
 * Validate that a string looks like one of our operation IDs.
 * Useful for guarding retry paths.
 */
export function isValidOperationId(id: string): boolean {
  return /^OP-[0-9A-Z]+-[0-9A-Z]+$/.test(id);
}
