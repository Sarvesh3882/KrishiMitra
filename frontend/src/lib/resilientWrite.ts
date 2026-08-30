/**
 * resilientWrite.ts
 * Orchestrates the full resilient-write flow for KrishiMitra.
 *
 * Flow for every important farmer action
 * ──────────────────────────────────────
 * 1. Caller provides operation_id + operation_type + payload.
 * 2. We enqueue the operation in IndexedDB as "pending".
 * 3. We POST to /api/v1/writes/{type} with the operation_id.
 * 4a. Success  → dequeue from IndexedDB → return result.
 * 4b. Failure  → recordFailure in IndexedDB → throw so the
 *               caller knows persistence is unavailable.
 *
 * Retry behaviour (for the automatic background loop)
 * ────────────────────────────────────────────────────
 * retryAllPending() walks every pending/failed operation and retries
 * each one with exponential back-off between attempts.
 * The same operation_id is always reused — never regenerated.
 *
 * The app should call retryAllPending() when:
 *  - The user comes back online (window "online" event)
 *  - On app focus (visibilitychange)
 *  - On a periodic interval (e.g. every 60 s)
 */

import { generateOperationId, isValidOperationId } from "./operationId";
import {
  enqueue,
  dequeue,
  recordFailure,
  markRetrying,
  getAllPending,
  type OperationType,
} from "./offlineQueue";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// ── Types ─────────────────────────────────────────────────────────────────

export interface WriteResult {
  status:           "completed";
  operation_id:     string;
  result_reference: string | null;
  replayed:         boolean;
}

export interface WriteOptions {
  /** Pre-generated ID.  If omitted, one is generated for you. */
  operation_id?:    string;
  user_id?:         string | null;
  operation_type:   OperationType;
  payload:          Record<string, unknown>;
  /** Skip the IndexedDB queue (e.g. for non-critical background writes). */
  skipQueue?:       boolean;
}

// ── Core write ────────────────────────────────────────────────────────────

/**
 * Perform a resilient write.
 *
 * Always call this instead of raw `fetch` for important farmer actions.
 *
 * @throws {Error} if the backend is unreachable AND queueing fails.
 *                 The error message tells the UI to show a "will retry" notice
 *                 rather than claiming the data was saved.
 */
export async function resilientWrite(opts: WriteOptions): Promise<WriteResult> {
  const operation_id = opts.operation_id ?? generateOperationId();

  if (!isValidOperationId(operation_id)) {
    throw new Error(`Invalid operation_id format: ${operation_id}`);
  }

  // ── 1. Enqueue locally before any network attempt ─────────────────────
  if (!opts.skipQueue) {
    await enqueue({
      operation_id,
      operation_type: opts.operation_type,
      payload:        opts.payload,
      user_id:        opts.user_id ?? null,
    });
  }

  // ── 2. Send to backend ────────────────────────────────────────────────
  try {
    const resp = await fetch(
      `${API_BASE}/api/v1/writes/${opts.operation_type}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          operation_id,
          user_id: opts.user_id ?? null,
          payload: opts.payload,
        }),
      }
    );

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      const msg  = body?.detail ?? `HTTP ${resp.status}`;
      await recordFailure(operation_id, msg);
      throw new Error(
        `Write failed (${resp.status}) — operation ${operation_id} retained for retry. ${msg}`
      );
    }

    const result: WriteResult = await resp.json();

    // ── 3. Success — remove from queue ───────────────────────────────────
    if (!opts.skipQueue) {
      await dequeue(operation_id);
    }

    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // Only record failure if it wasn't already recorded above
    if (!msg.includes("retained for retry")) {
      await recordFailure(operation_id, msg);
    }

    throw new Error(
      `Persistence unavailable — ${opts.operation_type} queued for retry (${operation_id}): ${msg}`
    );
  }
}

// ── Retry loop ────────────────────────────────────────────────────────────

/**
 * Retry all pending / failed operations from the IndexedDB queue.
 * Uses simple exponential back-off between each attempt.
 *
 * Safe to call multiple times — duplicate operation_ids are handled by the
 * backend's idempotency layer.
 *
 * @param onProgress  Optional callback called after each operation attempt.
 *                    Receives the operation_id, whether it succeeded, and
 *                    the current queue length.
 */
export async function retryAllPending(
  onProgress?: (opId: string, succeeded: boolean, remaining: number) => void
): Promise<{ succeeded: number; failed: number }> {
  const pending = await getAllPending();
  if (pending.length === 0) return { succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed    = 0;

  for (let i = 0; i < pending.length; i++) {
    const op = pending[i];

    // Skip operations that have already been retried too many times
    if (op.retry_count >= MAX_RETRIES) {
      failed++;
      onProgress?.(op.operation_id, false, pending.length - i - 1);
      continue;
    }

    await markRetrying(op.operation_id);

    // Exponential back-off: 0s, 2s, 4s, 8s …
    if (op.retry_count > 0) {
      await delay(Math.min(2 ** (op.retry_count - 1) * 1000, 30_000));
    }

    try {
      const resp = await fetch(
        `${API_BASE}/api/v1/writes/${op.operation_type}`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            operation_id: op.operation_id,
            user_id:      op.user_id,
            payload:      op.payload,
          }),
        }
      );

      if (resp.ok) {
        await dequeue(op.operation_id);
        succeeded++;
        onProgress?.(op.operation_id, true, pending.length - i - 1);
      } else {
        const body = await resp.json().catch(() => ({}));
        await recordFailure(op.operation_id, body?.detail ?? `HTTP ${resp.status}`);
        failed++;
        onProgress?.(op.operation_id, false, pending.length - i - 1);
      }
    } catch (err) {
      await recordFailure(op.operation_id, String(err));
      failed++;
      onProgress?.(op.operation_id, false, pending.length - i - 1);
    }
  }

  return { succeeded, failed };
}

// ── Constants ─────────────────────────────────────────────────────────────

/** After this many retries the operation is left as "failed" and not retried automatically. */
export const MAX_RETRIES = 5;

// ── Helper ─────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Convenience wrappers (used by real pages) ─────────────────────────────

export async function writeProduceListing(
  payload: Record<string, unknown>,
  userId?: string
): Promise<WriteResult> {
  return resilientWrite({ operation_type: "produce_listing", payload, user_id: userId });
}

export async function writeLocalNeed(
  payload: Record<string, unknown>,
  userId?: string
): Promise<WriteResult> {
  return resilientWrite({ operation_type: "local_need", payload, user_id: userId });
}

export async function writeFarmerProfile(
  payload: Record<string, unknown>,
  userId?: string
): Promise<WriteResult> {
  return resilientWrite({ operation_type: "farmer_profile", payload, user_id: userId });
}

export async function writeChatHistory(
  payload: Record<string, unknown>,
  userId?: string
): Promise<WriteResult> {
  return resilientWrite({ operation_type: "chat_history", payload, user_id: userId });
}
