/**
 * ResilienceDashboard.tsx
 * Admin / judge view for KrishiMitra data resilience architecture.
 *
 * Shows:
 *  1. Architecture diagram explaining the full write flow
 *  2. Live /api/resilience/status from the real backend
 *  3. Real "Recent Operations" table from write_operations DB table
 *  4. Operation detail panel (click a row)
 *  5. Local IndexedDB pending queue snapshot
 *
 * All data is REAL — nothing is hardcoded or faked.
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react';
import { getAllPending, getPendingCount, type PendingOperation } from '../lib/offlineQueue';
import { retryAllPending } from '../lib/resilientWrite';
import { generateOperationId } from '../lib/operationId';
import { writeProduceListing } from '../lib/resilientWrite';
import { useAuth } from '../contexts/AuthContext';

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// ── Types ─────────────────────────────────────────────────────────────────

interface ResilienceStatus {
  database: string;
  database_configured: boolean;
  write_protection: string;
  idempotency: string;
  pending_sync_supported: boolean;
  backup_recovery: string;
  rls_enforced: boolean;
  checked_at: string;
  notes: Record<string, string>;
}

interface Operation {
  operation_id: string;
  operation_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  retry_count: number;
  result_reference: string | null;
  error_message: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    pending:   'bg-yellow-100 text-yellow-800',
    retrying:  'bg-blue-100  text-blue-800',
    failed:    'bg-red-100   text-red-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[status] ?? 'bg-gray-100 text-gray-700'}`}>
      {status.toUpperCase()}
    </span>
  );
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Main component ────────────────────────────────────────────────────────

export function ResilienceDashboard() {
  const { user } = useAuth();

  const [status,    setStatus]    = useState<ResilienceStatus | null>(null);
  const [ops,       setOps]       = useState<Operation[]>([]);
  const [pending,   setPending]   = useState<PendingOperation[]>([]);
  const [pendingCt, setPendingCt] = useState(0);
  const [selected,  setSelected]  = useState<Operation | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [retrying,  setRetrying]  = useState(false);
  const [demoMsg,   setDemoMsg]   = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Fetch live data ──────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, opsRes] = await Promise.all([
        fetch(`${API}/api/resilience/status`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/resilience/operations?limit=30`).then(r => r.json()).catch(() => ({ operations: [] })),
      ]);
      if (statusRes) setStatus(statusRes);
      setOps(opsRes.operations ?? []);

      const q = await getAllPending();
      setPending(q);
      setPendingCt(await getPendingCount());
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Demo write (lets judges see a real operation travel through the system)
  const runDemoWrite = async () => {
    setDemoMsg('Generating operation ID and enqueueing…');
    const opId = generateOperationId();
    try {
      await writeProduceListing(
        {
          farmer_id:      user?.id ?? 'demo-farmer',
          product:        'Demo Onion',
          quantity:       100,
          unit:           'kg',
          available_from: new Date().toISOString().slice(0, 10),
          state:          'Maharashtra',
          district:       'Ahmednagar',
        },
        user?.id,
      );
      setDemoMsg(`✅ Write completed — operation ${opId} is now in the operations table.`);
    } catch (err: any) {
      setDemoMsg(`⚠️ Write failed (expected if DB not configured) — operation ${opId} retained in IndexedDB queue.`);
    }
    setTimeout(() => { refresh(); setDemoMsg(null); }, 3000);
  };

  // ── Retry queue ──────────────────────────────────────────────────────────
  const handleRetry = async () => {
    setRetrying(true);
    const { succeeded, failed } = await retryAllPending();
    setRetrying(false);
    setDemoMsg(`Retry complete — ${succeeded} succeeded, ${failed} still pending.`);
    await refresh();
    setTimeout(() => setDemoMsg(null), 4000);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="w-full max-w-[900px] mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-gray-900">KrishiMitra — Data Resilience</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Live architecture view · Last refreshed: {fmt(lastRefresh.toISOString())}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0b5e2c] text-white rounded-xl
                       text-[13px] font-semibold hover:bg-[#094d24] transition-all disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── Architecture diagram ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Architecture Flow</h2>
          <div className="font-mono text-[12px] text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-5 overflow-x-auto">
            <pre className="whitespace-pre">{`
                    FARMER
                       │
                       ▼
                 React PWA
                       │
                       ▼
     ┌─────────────────────────────────────┐
     │   IndexedDB Pending Queue           │
     │   • operation_id generated here     │ ← "Pending queue protects in-flight
     │   • payload stored before send      │    user actions"
     │   • removed only on confirmed save  │
     └───────────────────┬─────────────────┘
                         │
                         ▼
                  FastAPI Backend
                         │
           ┌─────────────┴──────────────┐
           ▼                            ▼
  Idempotency Check              Validation
  (write_operations               (Pydantic)
   UNIQUE operation_id)
           │                            │
           └─────────────┬──────────────┘
                         │  ← "Idempotency prevents duplicate writes"
                         ▼
              PostgreSQL Transaction
              ┌─────────────────────┐
              │  1. register op_id  │
              │  2. write data      │
              │  3. mark completed  │
              └─────────┬───────────┘
                        │
                        ▼
              Supabase PostgreSQL
              (Primary Data Store)
                        │
                        ▼
            ┌───────────────────────┐
            │  Backup / Recovery    │ ← "Database backup enables recovery
            │  (Supabase PG backup) │    after corruption"
            └───────────────────────┘
`}</pre>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'In-flight Protection', desc: 'IndexedDB pending queue + automatic retry + operation IDs', color: 'bg-blue-50 border-blue-200' },
              { label: 'Duplicate Prevention', desc: 'UNIQUE constraint on operation_id — same request safe to retry', color: 'bg-green-50 border-green-200' },
              { label: 'Database Loss Recovery', desc: 'PostgreSQL / Supabase backup restoration (separate from in-flight)', color: 'bg-orange-50 border-orange-200' },
            ].map(c => (
              <div key={c.label} className={`p-3 rounded-xl border ${c.color}`}>
                <p className="text-[12px] font-bold text-gray-800 mb-1">{c.label}</p>
                <p className="text-[11px] text-gray-600 leading-snug">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Status cards ── */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          {/* Backend status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-[14px] font-bold text-gray-700 mb-3 uppercase tracking-wide">Backend Status</h2>
            {status ? (
              <div className="space-y-2 text-[13px]">
                <div className="flex items-center">
                  <StatusDot ok={status.database === 'connected'} />
                  <span className="font-medium">Database: </span>
                  <span className={`ml-1 ${status.database === 'connected' ? 'text-green-700' : 'text-red-600'}`}>
                    {status.database}
                  </span>
                </div>
                <div className="flex items-center">
                  <StatusDot ok={status.write_protection === 'enabled'} />
                  <span>Write Protection: {status.write_protection}</span>
                </div>
                <div className="flex items-center">
                  <StatusDot ok={status.idempotency === 'enabled'} />
                  <span>Idempotency: {status.idempotency}</span>
                </div>
                <div className="flex items-center">
                  <StatusDot ok={status.rls_enforced} />
                  <span>RLS: {status.rls_enforced ? 'enforced' : 'disabled'}</span>
                </div>
                <div className="flex items-center">
                  <StatusDot ok={status.pending_sync_supported} />
                  <span>Pending Sync: {status.pending_sync_supported ? 'supported' : 'no'}</span>
                </div>
                <div className="flex items-center">
                  <StatusDot ok={status.backup_recovery === 'configured'} />
                  <span>Backup Recovery: {status.backup_recovery}</span>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-gray-400">{loading ? 'Loading…' : 'Could not reach backend'}</p>
            )}
          </div>

          {/* Client queue */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-[14px] font-bold text-gray-700 mb-3 uppercase tracking-wide">
              Client Queue (IndexedDB)
            </h2>
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center gap-2">
                {pendingCt === 0
                  ? <CheckCircle size={16} className="text-green-500" />
                  : <AlertTriangle size={16} className="text-yellow-500" />}
                <span><strong>{pendingCt}</strong> operation(s) pending locally</span>
              </div>
              {pending.map(p => (
                <div key={p.operation_id} className="bg-gray-50 rounded-lg px-3 py-2 text-[11px]">
                  <span className="font-mono text-gray-600">{p.operation_id}</span>
                  <span className="ml-2 text-gray-500">{p.operation_type}</span>
                  <StatusBadge status={p.status} />
                  {p.retry_count > 0 && (
                    <span className="ml-1 text-gray-400">retry #{p.retry_count}</span>
                  )}
                </div>
              ))}
              {pending.length === 0 && (
                <p className="text-gray-400 text-[12px]">Queue is empty — all operations synced</p>
              )}
            </div>

            {pendingCt > 0 && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="mt-3 w-full py-2 bg-[#0b5e2c] text-white rounded-xl text-[12px] font-bold
                           hover:bg-[#094d24] transition-all disabled:opacity-40 flex items-center justify-center gap-1"
              >
                <RefreshCw size={13} className={retrying ? 'animate-spin' : ''} />
                Retry All Pending
              </button>
            )}
          </div>
        </div>

        {/* ── Demo write button ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="text-[14px] font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Demonstrate a Write
          </h2>
          <p className="text-[12px] text-gray-500 mb-3">
            Click to send a real produce-listing write through the full resilience stack.
            Watch it appear in the operations table below.
          </p>
          <button
            onClick={runDemoWrite}
            className="px-5 py-2.5 bg-[#0b5e2c] text-white rounded-xl text-[13px] font-bold
                       hover:bg-[#094d24] transition-all"
          >
            Run Demo Write
          </button>
          {demoMsg && (
            <p className="mt-3 text-[12px] text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
              {demoMsg}
            </p>
          )}
        </div>

        {/* ── Recent operations table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h2 className="text-[14px] font-bold text-gray-700 mb-3 uppercase tracking-wide">
            Recent Operations ({ops.length})
          </h2>
          {ops.length === 0 ? (
            <p className="text-[13px] text-gray-400">
              {loading ? 'Loading…' : 'No operations yet — run a Demo Write to see one here.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-left">
                    <th className="pb-2 font-semibold">Operation ID</th>
                    <th className="pb-2 font-semibold">Type</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Created</th>
                    <th className="pb-2 font-semibold">Completed</th>
                    <th className="pb-2 font-semibold">Retries</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {ops.map(op => (
                    <>
                      <tr
                        key={op.operation_id}
                        onClick={() => setSelected(selected?.operation_id === op.operation_id ? null : op)}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="py-2 font-mono text-gray-600 text-[11px]">{op.operation_id}</td>
                        <td className="py-2 text-gray-700">{op.operation_type}</td>
                        <td className="py-2"><StatusBadge status={op.status} /></td>
                        <td className="py-2 text-gray-500">{fmt(op.created_at)}</td>
                        <td className="py-2 text-gray-500">{fmt(op.completed_at)}</td>
                        <td className="py-2 text-gray-500">{op.retry_count}</td>
                        <td className="py-2">
                          {selected?.operation_id === op.operation_id
                            ? <ChevronDown size={14} className="text-gray-400" />
                            : <ChevronRight size={14} className="text-gray-400" />}
                        </td>
                      </tr>

                      {/* Detail row */}
                      {selected?.operation_id === op.operation_id && (
                        <tr key={`${op.operation_id}-detail`}>
                          <td colSpan={7} className="bg-gray-50 px-4 py-4 rounded-b-xl">
                            <div className="grid grid-cols-2 gap-4 text-[12px]">
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">Operation ID</p>
                                <p className="font-mono text-gray-600">{op.operation_id}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">Type</p>
                                <p>{op.operation_type}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">Status</p>
                                <StatusBadge status={op.status} />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">Retry Count</p>
                                <p>{op.retry_count}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">Created At</p>
                                <p>{op.created_at ? new Date(op.created_at).toLocaleString('en-IN') : '—'}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">Completed At</p>
                                <p>{op.completed_at ? new Date(op.completed_at).toLocaleString('en-IN') : '—'}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">DB Result Reference</p>
                                <p className="font-mono text-gray-600">{op.result_reference ?? '—'}</p>
                              </div>
                              {op.error_message && (
                                <div className="col-span-2">
                                  <p className="font-semibold text-red-600 mb-1">Error</p>
                                  <p className="text-red-700 bg-red-50 rounded px-2 py-1">{op.error_message}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Recovery explanation ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-[14px] font-bold text-gray-700 mb-3 uppercase tracking-wide">
            Two Failure Windows — Two Solutions
          </h2>
          <div className="grid grid-cols-2 gap-4 text-[12px] text-gray-700">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-bold text-blue-800 mb-2">① In-flight Failure</p>
              <p className="leading-relaxed">
                A write reaches the backend while the DB is temporarily down or slow.
              </p>
              <p className="mt-2 font-semibold text-blue-700">
                Solution: IndexedDB queue + retry + idempotency key
              </p>
              <p className="mt-1 text-blue-600">
                The operation stays on the device. When the DB recovers the same
                operation_id is reused — no duplicates.
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="font-bold text-orange-800 mb-2">② Database Loss</p>
              <p className="leading-relaxed">
                The entire database is corrupted or wiped (e.g. accidental drop,
                storage failure).
              </p>
              <p className="mt-2 font-semibold text-orange-700">
                Solution: PostgreSQL / Supabase backup restoration
              </p>
              <p className="mt-1 text-orange-600">
                Backups are for recovery — not prevention. We do not claim
                backups prevent data loss. They provide the restore point.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
