/**
 * offlineQueue.ts
 * IndexedDB-backed pending operation queue for KrishiMitra.
 *
 * Purpose
 * ───────
 * Before an important farmer action is sent to the backend, it is written
 * here as "pending".  When the backend confirms success, the entry is
 * removed.  If the request fails or the device goes offline, the entry
 * stays and can be retried later — the user's action is never silently lost.
 *
 * Uses the browser's native IndexedDB (not localStorage) so that payloads
 * of arbitrary size survive page reloads without hitting storage limits.
 *
 * Schema (object store "pending_operations")
 * ──────────────────────────────────────────
 *   operation_id   string   keyPath — must match the backend idempotency key
 *   operation_type string   e.g. "produce_listing"
 *   payload        object   full request payload
 *   created_at     string   ISO timestamp
 *   status         string   "pending" | "retrying" | "failed"
 *   retry_count    number
 *   last_error     string | null
 */

const DB_NAME    = "krishimitra_resilience";
const DB_VERSION = 1;
const STORE_NAME = "pending_operations";

// ── Types ─────────────────────────────────────────────────────────────────

export type OperationType =
  | "produce_listing"
  | "local_need"
  | "farmer_profile"
  | "chat_history";

export interface PendingOperation {
  operation_id:   string;
  operation_type: OperationType;
  payload:        Record<string, unknown>;
  user_id:        string | null;
  created_at:     string;
  status:         "pending" | "retrying" | "failed";
  retry_count:    number;
  last_error:     string | null;
}

// ── DB bootstrap ──────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "operation_id" });
        store.createIndex("by_status",   "status",         { unique: false });
        store.createIndex("by_created",  "created_at",     { unique: false });
        store.createIndex("by_type",     "operation_type", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Enqueue an operation as "pending".
 * Call this BEFORE sending the API request.
 */
export async function enqueue(op: Omit<PendingOperation, "created_at" | "status" | "retry_count" | "last_error">): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const entry: PendingOperation = {
      ...op,
      created_at:  new Date().toISOString(),
      status:      "pending",
      retry_count: 0,
      last_error:  null,
    };
    const req = store.put(entry);          // put = insert or overwrite
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Remove an operation after the backend confirms success.
 */
export async function dequeue(operationId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.delete(operationId);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Record a failed attempt.  Increments retry_count and stores the error.
 * The entry stays in the queue so it can be retried.
 */
export async function recordFailure(operationId: string, error: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const getReq = store.get(operationId);
    getReq.onsuccess = () => {
      const entry: PendingOperation | undefined = getReq.result;
      if (!entry) { resolve(); return; }

      const updated: PendingOperation = {
        ...entry,
        status:      "failed",
        retry_count: entry.retry_count + 1,
        last_error:  error.slice(0, 500),
      };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror   = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Return all pending / failed operations.
 * Used by the retry loop and the resilience dashboard.
 */
export async function getAllPending(): Promise<PendingOperation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.getAll();
    req.onsuccess = () => resolve(req.result as PendingOperation[]);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Return the count of pending operations.
 * Cheap check for the UI badge / status indicator.
 */
export async function getPendingCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req   = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Mark an entry as "retrying" so the UI can show a spinner.
 */
export async function markRetrying(operationId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(operationId);
    getReq.onsuccess = () => {
      const entry = getReq.result;
      if (!entry) { resolve(); return; }
      const putReq = store.put({ ...entry, status: "retrying" });
      putReq.onsuccess = () => resolve();
      putReq.onerror   = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}
