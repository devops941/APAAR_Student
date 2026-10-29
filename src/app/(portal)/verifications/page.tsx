"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const STATUS_TABS = ["All", "PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "CORRECTION_REQUIRED"];

interface VerificationRequest {
  _id: string;
  requestId: string;
  studentId: { fullName: string; registerNumber: string; apaarId?: string } | null;
  targetType: string;
  status: string;
  createdAt: string;
  decidedAt?: string;
  decisionRemarks?: string;
}

export default function VerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<VerificationRequest | null>(null);
  const [remarks, setRemarks] = useState("");
  const [acting, setActing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "All") params.set("status", statusFilter);

    const res = await fetch(`/api/verifications?${params}`);
    const data = await res.json();
    if (data.success) setRequests(data.data.requests || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleDecision(decision: "VERIFIED" | "REJECTED" | "CORRECTION_REQUIRED") {
    if (!selected || remarks.length < 8) return;
    setActing(true);
    try {
      const res = await fetch(`/api/verifications/${selected.requestId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, remarks }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(null);
        setRemarks("");
        fetchRequests();
      } else {
        alert(data?.error?.message || "Decision failed");
      }
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Verification Queue</h1>
        <p className="mt-1 text-sm text-ink-muted">Review and verify submitted academic records and documents</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              statusFilter === s ? "bg-primary text-white" : "border border-border bg-surface text-ink-muted hover:bg-canvas"
            }`}
          >
            {s === "All" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Queue table */}
      <Card>
        {loading ? (
          <div className="p-12 text-center text-sm text-ink-muted">Loading queue...</div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ShieldCheck className="mb-3 h-10 w-10 text-ink-muted opacity-40" />
            <p className="text-sm text-ink-muted">No verification requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-canvas/50">
                <tr className="text-left text-xs font-medium uppercase text-ink-muted">
                  <th className="px-4 py-3">Request ID</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Register No</th>
                  <th className="px-4 py-3">APAAR ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-canvas/50 transition">
                    <td className="px-4 py-3 text-sm font-mono text-primary">{req.requestId}</td>
                    <td className="px-4 py-3 text-sm text-ink">{req.studentId?.fullName || "—"}</td>
                    <td className="px-4 py-3 text-sm text-ink-light">{req.studentId?.registerNumber || "—"}</td>
                    <td className="px-4 py-3 text-sm font-mono text-ink-muted">{req.studentId?.apaarId || "—"}</td>
                    <td className="px-4 py-3 text-sm text-ink-light">{req.targetType.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(req)}>Inspect</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Decision modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-lg p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink">
              Review {selected.requestId} — {selected.studentId?.fullName}
            </h2>
            <p className="mb-4 text-sm text-ink-muted">
              Target: {selected.targetType.replace(/_/g, " ")} · Status: <StatusBadge status={selected.status} />
            </p>
            <textarea
              placeholder="Enter decision remarks (min 8 characters)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className="mb-4 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-2">
              <Button variant="success" disabled={acting || remarks.length < 8} onClick={() => handleDecision("VERIFIED")}>
                <CheckCircle className="h-4 w-4" /> Verify & Seal
              </Button>
              <Button variant="warning" disabled={acting || remarks.length < 8} onClick={() => handleDecision("CORRECTION_REQUIRED")}>
                <AlertCircle className="h-4 w-4" /> Request Correction
              </Button>
              <Button variant="danger" disabled={acting || remarks.length < 8} onClick={() => handleDecision("REJECTED")}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
