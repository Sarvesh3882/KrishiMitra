"""
Idempotency service for KrishiMitra resilient writes.

Every important farmer action is registered in `write_operations` before
the actual database write.  The operation_id UNIQUE constraint guarantees
that the same client operation can be retried safely — the backend will
detect the duplicate and return the previous result instead of writing again.

Conceptual flow
───────────────
1. Client generates operation_id (OP-…) and sends it with the request.
2. check_or_create() either:
   a. Returns the existing completed result  →  idempotent replay
   b. Registers a new 'pending' record       →  proceed with write
3. The caller performs the actual DB write inside a try/except.
4. mark_completed() sets status='completed' and stores result_reference.
5. mark_failed()    sets status='failed'    and stores error_message.

The operation record and the data write are kept as close as possible to
atomic — both use the same Supabase service-role client so that failures
in either step surface clearly.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from supabase import create_client, Client

logger = logging.getLogger(__name__)

# ── Supabase service-role client (server-side only) ───────────────────────
def _get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured. "
            "Resilient writes require the service-role key."
        )
    return create_client(url, key)


# ── Public API ────────────────────────────────────────────────────────────

class IdempotencyResult:
    """
    Returned by check_or_create().

    already_done = True  →  operation was previously completed; caller should
                             return previous_result without writing again.
    already_done = False →  operation is newly registered as 'pending';
                             caller should proceed with the write.
    """
    __slots__ = ("already_done", "previous_result", "record_id")

    def __init__(
        self,
        already_done: bool,
        previous_result: Optional[str] = None,
        record_id: Optional[str] = None,
    ):
        self.already_done    = already_done
        self.previous_result = previous_result
        self.record_id       = record_id


def check_or_create(
    operation_id: str,
    user_id: Optional[str],
    operation_type: str,
    payload: Optional[Dict[str, Any]] = None,
) -> IdempotencyResult:
    """
    Look up operation_id in write_operations.

    - If found and completed  → return already_done=True + result_reference
    - If found and pending    → return already_done=False (let caller retry)
    - If not found            → insert a new 'pending' record
    - On any DB error         → raise so the caller can surface a 503

    Args:
        operation_id:    Client-generated unique ID, e.g. "OP-01JABC123XYZ".
        user_id:         Supabase auth.users.id of the requesting farmer.
        operation_type:  One of the allowed check constraint values.
        payload:         Full request payload stored for audit.
    """
    sb = _get_supabase()

    # ── 1. Check for existing record ─────────────────────────────────────
    try:
        resp = (
            sb.table("write_operations")
            .select("id, status, result_reference")
            .eq("operation_id", operation_id)
            .maybe_single()
            .execute()
        )
    except Exception as exc:
        logger.error("idempotency check failed: %s", exc)
        raise

    existing = resp.data if resp else None

    if existing:
        if existing["status"] == "completed":
            logger.info(
                "idempotent replay: %s already completed → %s",
                operation_id,
                existing.get("result_reference"),
            )
            return IdempotencyResult(
                already_done=True,
                previous_result=existing.get("result_reference"),
                record_id=existing["id"],
            )
        # pending or failed — let the caller try the write again
        logger.info("idempotency: %s exists with status=%s", operation_id, existing["status"])
        return IdempotencyResult(already_done=False, record_id=existing["id"])

    # ── 2. Register new pending operation ─────────────────────────────────
    try:
        insert_resp = (
            sb.table("write_operations")
            .insert({
                "operation_id":   operation_id,
                "user_id":        user_id,
                "operation_type": operation_type,
                "status":         "pending",
                "payload":        payload,
                "created_at":     datetime.now(timezone.utc).isoformat(),
            })
            .execute()
        )
    except Exception as exc:
        # Unique-constraint violation means a concurrent request raced us —
        # treat it the same as "found pending" and let the caller proceed.
        err_str = str(exc)
        if "unique" in err_str.lower() or "duplicate" in err_str.lower():
            logger.warning("idempotency race on %s — treating as pending", operation_id)
            return IdempotencyResult(already_done=False)
        logger.error("idempotency insert failed: %s", exc)
        raise

    record_id = insert_resp.data[0]["id"] if insert_resp.data else None
    logger.info("idempotency: registered %s as pending (db id=%s)", operation_id, record_id)
    return IdempotencyResult(already_done=False, record_id=record_id)


def mark_completed(
    operation_id: str,
    result_reference: Optional[str] = None,
) -> None:
    """Mark an operation as successfully completed."""
    sb = _get_supabase()
    try:
        sb.table("write_operations").update({
            "status":           "completed",
            "result_reference": result_reference,
            "completed_at":     datetime.now(timezone.utc).isoformat(),
        }).eq("operation_id", operation_id).execute()
        logger.info("idempotency: %s → completed (ref=%s)", operation_id, result_reference)
    except Exception as exc:
        # Non-fatal: the actual write already succeeded.  Log and continue.
        logger.error("mark_completed failed for %s: %s", operation_id, exc)


def mark_failed(
    operation_id: str,
    error_message: str,
) -> None:
    """Mark an operation as failed and increment retry_count."""
    sb = _get_supabase()
    try:
        # Increment retry_count via RPC is safest; fall back to fetch+update
        resp = (
            sb.table("write_operations")
            .select("retry_count")
            .eq("operation_id", operation_id)
            .maybe_single()
            .execute()
        )
        current_retry = (resp.data or {}).get("retry_count", 0)
        sb.table("write_operations").update({
            "status":        "failed",
            "error_message": error_message[:500],   # truncate long traces
            "retry_count":   current_retry + 1,
        }).eq("operation_id", operation_id).execute()
        logger.warning("idempotency: %s → failed (retry=%d)", operation_id, current_retry + 1)
    except Exception as exc:
        logger.error("mark_failed failed for %s: %s", operation_id, exc)


def get_recent_operations(limit: int = 50) -> list:
    """
    Return recent write_operations for the resilience dashboard.
    Uses service-role so it bypasses RLS (admin view).
    """
    sb = _get_supabase()
    try:
        resp = (
            sb.table("write_operations")
            .select("operation_id, operation_type, status, created_at, completed_at, retry_count, result_reference, error_message")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return resp.data or []
    except Exception as exc:
        logger.error("get_recent_operations failed: %s", exc)
        return []


def check_db_connectivity() -> bool:
    """Ping the DB by fetching a single row count.  Returns True if reachable."""
    try:
        sb = _get_supabase()
        sb.table("write_operations").select("id").limit(1).execute()
        return True
    except Exception as exc:
        logger.warning("DB connectivity check failed: %s", exc)
        return False
