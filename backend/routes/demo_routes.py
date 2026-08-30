"""
demo_routes.py — Blackout demonstration endpoints for KrishiMitra.

These endpoints exist ONLY for the hackathon judge demonstration.
They reuse the existing write_operations table and idempotency service.
They do NOT touch real farmer data.

Endpoints
─────────
GET  /api/demo/operations                        — list all OP-DEMO-* operations
GET  /api/demo/operations/{operation_id}         — single operation detail
POST /api/demo/operations/{operation_id}/process — simulate a DB write (may fail)
POST /api/demo/operations/{operation_id}/retry   — idempotent retry

All demo operations are pre-seeded in-memory and stored in write_operations
when first processed.  They are clearly tagged with user_id = 'DEMO' so
they are distinguishable from real farmer data.

Logging
───────
Every step prints clearly labelled log lines so judges can follow
the operation through the system on the server console.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.resilience.idempotency import (
    check_or_create,
    mark_completed,
    mark_failed,
    get_recent_operations,
)

logger = logging.getLogger("krishimitra.demo")
router = APIRouter(tags=["Blackout Demo"])

# ── Pre-defined demo operations ───────────────────────────────────────────
# These are the 3 operations we show to judges.
# They live in memory; their state is persisted in write_operations.

DEMO_OPERATIONS: Dict[str, Dict[str, Any]] = {
    "OP-DEMO-001": {
        "operation_id":   "OP-DEMO-001",
        "operation_type": "produce_listing",
        "description":    "Farmer lists Onion for sale",
        "payload": {
            "farmer_id":      "DEMO-FARMER",
            "product":        "Onion",
            "quantity":       500,
            "unit":           "kg",
            "expected_price": 28,
            "available_from": "2026-09-01",
            "state":          "Maharashtra",
            "district":       "Ahmednagar",
            "note":           "DEMO — not real farmer data",
        },
    },
    "OP-DEMO-002": {
        "operation_id":   "OP-DEMO-002",
        "operation_type": "produce_listing",
        "description":    "Farmer lists Tomato for sale",
        "payload": {
            "farmer_id":      "DEMO-FARMER",
            "product":        "Tomato",
            "quantity":       300,
            "unit":           "kg",
            "expected_price": 22,
            "available_from": "2026-09-01",
            "state":          "Maharashtra",
            "district":       "Nashik",
            "note":           "DEMO — not real farmer data",
        },
    },
    "OP-DEMO-003": {
        "operation_id":   "OP-DEMO-003",
        "operation_type": "produce_listing",
        "description":    "Farmer lists Wheat for sale",
        "payload": {
            "farmer_id":      "DEMO-FARMER",
            "product":        "Wheat",
            "quantity":       200,
            "unit":           "kg",
            "expected_price": 30,
            "available_from": "2026-09-01",
            "state":          "Maharashtra",
            "district":       "Pune",
            "note":           "DEMO — not real farmer data",
        },
    },
}

# ── In-memory status overlay ──────────────────────────────────────────────
# Tracks status locally for fast reads without hammering Supabase.
# Keys are operation_ids; values are status strings.
_demo_status: Dict[str, str] = {
    "OP-DEMO-001": "PENDING",
    "OP-DEMO-002": "PENDING",
    "OP-DEMO-003": "PENDING",
}

# ── Helper ─────────────────────────────────────────────────────────────────

def _supabase_configured() -> bool:
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY"))


def _log_step(operation_id: str, step: str, detail: str = "") -> None:
    """Emit a clearly labelled log line for judge demonstration."""
    line = f"[{step}] {operation_id}"
    if detail:
        line += f"  →  {detail}"
    logger.info(line)
    # Also print directly so it appears even if log level filters INFO
    print(f"\n  {line}", flush=True)


# ── GET /api/demo/operations ──────────────────────────────────────────────

@router.get("/api/demo/operations")
async def list_demo_operations():
    """
    List all three demo operations with their current status.

    This is the entry point judges use to see the operation pipeline.
    """
    result = []
    for op_id, op in DEMO_OPERATIONS.items():
        status = _demo_status.get(op_id, "PENDING")

        # Also check the DB if Supabase is configured
        db_status = None
        if _supabase_configured():
            try:
                from supabase import create_client
                sb = create_client(
                    os.environ["SUPABASE_URL"],
                    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
                )
                resp = (
                    sb.table("write_operations")
                    .select("status, completed_at, retry_count, error_message")
                    .eq("operation_id", op_id)
                    .maybe_single()
                    .execute()
                )
                if resp.data:
                    db_status = resp.data
            except Exception:
                pass   # table may not exist yet — migration pending

        result.append({
            "operation_id":   op_id,
            "operation_type": op["operation_type"].upper(),
            "description":    op["description"],
            "local_status":   status,
            "db_record":      db_status,
            "payload_preview": {
                k: v for k, v in op["payload"].items()
                if k in ("product", "quantity", "unit", "expected_price")
            },
        })

    return {
        "demo_operations": result,
        "note": "These are DEMO operations — not real farmer data",
        "total": len(result),
    }


# ── GET /api/demo/operations/{operation_id} ───────────────────────────────

@router.get("/api/demo/operations/{operation_id}")
async def get_demo_operation(operation_id: str):
    """Return full detail for one demo operation."""
    if operation_id not in DEMO_OPERATIONS:
        raise HTTPException(
            status_code=404,
            detail=f"{operation_id} is not a recognised demo operation. "
                   f"Valid IDs: {list(DEMO_OPERATIONS.keys())}",
        )

    op = DEMO_OPERATIONS[operation_id]
    status = _demo_status.get(operation_id, "PENDING")

    db_record = None
    if _supabase_configured():
        try:
            from supabase import create_client
            sb = create_client(
                os.environ["SUPABASE_URL"],
                os.environ["SUPABASE_SERVICE_ROLE_KEY"],
            )
            resp = (
                sb.table("write_operations")
                .select("*")
                .eq("operation_id", operation_id)
                .maybe_single()
                .execute()
            )
            if resp.data:
                db_record = resp.data
        except Exception as exc:
            db_record = {"error": str(exc)}

    return {
        **op,
        "local_status": status,
        "db_record":    db_record,
    }


# ── POST /api/demo/operations/{operation_id}/process ─────────────────────

class ProcessRequest(BaseModel):
    simulate_db_failure: bool = False   # set True to demonstrate the failure path


@router.post("/api/demo/operations/{operation_id}/process")
async def process_demo_operation(operation_id: str, req: ProcessRequest = ProcessRequest()):
    """
    Process a demo operation through the full resilience stack.

    Steps logged:
      [OPERATION]   OP-DEMO-XXX
      [TYPE]        produce_listing
      [STATUS]      PROCESSING
      [IDEMPOTENCY] CHECK
      [DATABASE]    WRITE ATTEMPT
      [DATABASE]    SUCCESS | UNAVAILABLE
      [OPERATION]   OP-DEMO-XXX COMPLETED | PRESERVED

    Pass simulate_db_failure=true to demonstrate the failure+retry path.
    """
    if operation_id not in DEMO_OPERATIONS:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown demo operation: {operation_id}",
        )

    op = DEMO_OPERATIONS[operation_id]
    payload = op["payload"]

    # ── Log: start ────────────────────────────────────────────────────────
    print("\n" + "─" * 60, flush=True)
    _log_step(operation_id, "OPERATION", op["description"])
    _log_step(operation_id, "TYPE",      op["operation_type"].upper())
    _log_step(operation_id, "STATUS",    "PROCESSING")
    _demo_status[operation_id] = "PROCESSING"

    # ── Idempotency check ─────────────────────────────────────────────────
    _log_step(operation_id, "IDEMPOTENCY", "CHECK — inspecting write_operations table")

    if _supabase_configured():
        try:
            idem = check_or_create(
                operation_id=operation_id,
                user_id=None,           # demo ops have no real auth user
                operation_type=op["operation_type"],
                payload=payload,
            )

            if idem.already_done:
                _log_step(operation_id, "IDEMPOTENCY",
                          f"ALREADY COMPLETED — result_reference={idem.previous_result}")
                _log_step(operation_id, "IDEMPOTENCY",
                          "NO DUPLICATE CREATED — returning previous result")
                _demo_status[operation_id] = "COMPLETED"
                return {
                    "operation_id":    operation_id,
                    "status":          "COMPLETED",
                    "replayed":        True,
                    "result_reference": idem.previous_result,
                    "message":         "Idempotency: operation already completed — no duplicate created",
                }

            _log_step(operation_id, "IDEMPOTENCY", "NEW — registered as pending in write_operations")

        except Exception as exc:
            _log_step(operation_id, "IDEMPOTENCY", f"CHECK FAILED: {exc}")
            _demo_status[operation_id] = "PENDING"
            raise HTTPException(status_code=503, detail=f"Idempotency check failed: {exc}")
    else:
        _log_step(operation_id, "IDEMPOTENCY",
                  "Supabase not configured — running in-memory demo mode")

    # ── Simulate DB failure if requested ──────────────────────────────────
    if req.simulate_db_failure:
        _log_step(operation_id, "DATABASE", "WRITE ATTEMPT")
        _log_step(operation_id, "DATABASE", "UNAVAILABLE — simulated failure")
        _log_step(operation_id, "OPERATION",
                  f"{operation_id} PRESERVED — retained for retry")
        _demo_status[operation_id] = "DATABASE_UNAVAILABLE"

        if _supabase_configured():
            mark_failed(operation_id, "Simulated database failure for demonstration")

        print("─" * 60 + "\n", flush=True)
        return {
            "operation_id": operation_id,
            "status":       "DATABASE_UNAVAILABLE",
            "message":      "Database write failed (simulated). "
                            "Operation preserved — call /retry to recover.",
        }

    # ── Actual write ──────────────────────────────────────────────────────
    _log_step(operation_id, "DATABASE", "WRITE ATTEMPT")

    result_ref = f"demo-record-{operation_id.lower()}"   # unique reference for this demo op

    if _supabase_configured():
        try:
            # Demo operations write ONLY to write_operations — not to produce_listings.
            # This keeps demo data fully isolated from real farmer records.
            # The write_operations record was already created by check_or_create().
            # We just mark it completed with a demo reference.
            _log_step(operation_id, "DATABASE",
                      "Writing to write_operations (demo isolation — no real farmer record created)")
            mark_completed(operation_id, result_ref)
            _log_step(operation_id, "DATABASE", f"WRITE SUCCESS — result_reference={result_ref}")

        except Exception as exc:
            err = str(exc)
            _log_step(operation_id, "DATABASE", f"WRITE FAILED — {err}")
            _log_step(operation_id, "OPERATION",
                      f"{operation_id} PRESERVED — operation retained for retry")
            _demo_status[operation_id] = "DATABASE_UNAVAILABLE"
            mark_failed(operation_id, err)
            print("─" * 60 + "\n", flush=True)
            raise HTTPException(
                status_code=503,
                detail=f"Database write failed — {err}",
            )
    else:
        # No DB configured — demo mode only
        _log_step(operation_id, "DATABASE",
                  "WRITE SUCCESS (in-memory demo — no real DB configured)")

    _log_step(operation_id, "OPERATION", f"{operation_id} COMPLETED")
    _demo_status[operation_id] = "COMPLETED"
    print("─" * 60 + "\n", flush=True)

    return {
        "operation_id":    operation_id,
        "status":          "COMPLETED",
        "result_reference": result_ref,
        "replayed":        False,
        "message":         "Write succeeded and operation marked completed",
    }


# ── POST /api/demo/operations/{operation_id}/retry ────────────────────────

@router.post("/api/demo/operations/{operation_id}/retry")
async def retry_demo_operation(operation_id: str):
    """
    Idempotent retry for a demo operation.

    Demonstrates:
    1. Operation exists → check idempotency
    2. If already COMPLETED → return previous result, no duplicate
    3. If still PENDING / FAILED → attempt the write again
    4. Same operation_id is always reused — never generates a new one
    """
    if operation_id not in DEMO_OPERATIONS:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown demo operation: {operation_id}",
        )

    print("\n" + "═" * 60, flush=True)
    _log_step(operation_id, "RECOVERY",  f"RETRYING {operation_id}")
    _log_step(operation_id, "OPERATION ID", "SAME ID REUSED — not regenerated")
    _log_step(operation_id, "IDEMPOTENCY", "CHECK — will not duplicate if already done")
    print("═" * 60 + "\n", flush=True)

    # Delegate to the process endpoint (which already handles idempotency)
    return await process_demo_operation(operation_id, ProcessRequest(simulate_db_failure=False))


# ── POST /api/demo/reset ──────────────────────────────────────────────────

@router.post("/api/demo/reset")
async def reset_demo_operations():
    """
    Reset all demo operation statuses back to PENDING (in-memory only).
    Does NOT delete DB records — those are retained for audit.
    Useful for re-running the demonstration without restarting the server.
    """
    for op_id in _demo_status:
        _demo_status[op_id] = "PENDING"

    return {
        "message": "Demo statuses reset to PENDING (DB records retained)",
        "operations": dict(_demo_status),
    }
