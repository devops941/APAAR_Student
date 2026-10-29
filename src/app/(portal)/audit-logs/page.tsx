"use client";

import { useEffect, useState, useCallback } from "react";
import { ScrollText, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const AUDIT_ACTIONS = [
  "All", "USER_LOGIN", "USER_LOGOUT", "INSTITUTION_CREATED", "INSTITUTION_VERIFIED",
  "INSTITUTION_REJECTED", "STUDENT_CREATED", "STUDENT_IMPORTED", "APAAR_REVEALED",
  "ACADEMIC_RECORD_SUBMITTED", "ACADEMIC_RECORD_VERIFIED", "DOCUMENT_UPLOADED", "DOCUMENT_DOWNLOADED",
];

interface AuditLogEntry {
  _id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  safeChangesSummary?: string;
  ipAddress?: string;
  occurredAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (actionFilter !== "All") params.set("action", actionFilter);

    const res = await fetch(`/api/audit-logs?${params}`);
    const data = await res.json();
    if (data.success) {
      setLogs(data.data.logs || []);
      setTotal(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 1);
    }
    setLoading(false);
  }, [actionFilter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function exportCsv() {
    const headers = ["Timestamp", "Actor Email", "Role", "Action", "Entity", "Summary", "IP"];
    const rows = logs.map((l) => [
      new Date(l.occurredAt).toISOString(),
      l.actorEmail,
      l.actorRole,
      l.action,
      l.entityType,
      l.safeChangesSummary || "",
      l.ipAddress || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Audit Logs</h1>
          <p className="mt-1 text-sm text-ink-muted">Compliance audit trail — all sensitive mutations are logged</p>
        </div>
        <Button variant="secondary" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Action filter */}
      <div className="flex flex-wrap gap-2">
        {AUDIT_ACTIONS.map((a) => (
          <button
            key={a}
            onClick={() => { setActionFilter(a); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              actionFilter === a ? "bg-primary text-white" : "border border-border bg-surface text-ink-muted hover:bg-canvas"
            }`}
          >
            {a === "All" ? "All Actions" : a.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Log table */}
      <Card>
        {loading ? (
          <div className="p-12 text-center text-sm text-ink-muted">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ScrollText className="mb-3 h-10 w-10 text-ink-muted opacity-40" />
            <p className="text-sm text-ink-muted">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-canvas/50">
                <tr className="text-left text-xs font-medium uppercase text-ink-muted">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-canvas/50 transition">
                    <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">
                      {new Date(log.occurredAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-ink">{log.actorEmail}</p>
                      <p className="text-xs text-ink-muted">{log.actorRole.replace(/_/g, " ")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-light">{log.entityType}</td>
                    <td className="px-4 py-3 text-sm text-ink-muted max-w-md truncate">{log.safeChangesSummary || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-muted">{total} logs total</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="flex items-center px-3 text-sm text-ink-muted">{page} / {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
