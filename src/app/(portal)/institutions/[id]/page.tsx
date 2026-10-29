"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface Institution {
  _id: string;
  name: string;
  code: string;
  category: string;
  address: { street: string; city: string; district: string; state: string; pincode: string };
  contactEmail: string;
  contactPhone: string;
  principalName: string;
  approvalReference: string;
  status: string;
  reviewRemarks?: string;
  reviewedAt?: string;
}

export default function InstitutionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/institutions/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setInstitution(data.data.institution);
        setLoading(false);
      });
  }, [params.id]);

  async function handleReview(decision: "VERIFIED" | "REJECTED" | "CORRECTION_REQUIRED") {
    if (remarks.length < 5) {
      setError("Please provide remarks (at least 5 characters)");
      return;
    }
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/institutions/${params.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision, remarks }),
      });
      const data = await res.json();
      if (data.success) {
        setInstitution(data.data.institution);
        setRemarks("");
      } else {
        setError(data?.error?.message || "Review failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setActing(false);
    }
  }

  async function handleSubmit() {
    setActing(true);
    try {
      const res = await fetch(`/api/institutions/${params.id}/submit`, { method: "POST" });
      const data = await res.json();
      if (data.success) setInstitution(data.data.institution);
    } finally {
      setActing(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-ink-muted">Loading institution...</div>;
  if (!institution) return <div className="p-6 text-sm text-ink-muted">Institution not found</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/institutions")}
        className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to institutions
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{institution.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {institution.code} · {institution.category?.replace(/_/g, " ")}
          </p>
        </div>
        <StatusBadge status={institution.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Institution details */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Institution Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-ink-muted">Principal</dt><dd className="font-medium text-ink">{institution.principalName}</dd></div>
                <div><dt className="text-ink-muted">Approval Ref</dt><dd className="font-medium text-ink">{institution.approvalReference}</dd></div>
                <div><dt className="text-ink-muted">Contact Email</dt><dd className="font-medium text-ink">{institution.contactEmail}</dd></div>
                <div><dt className="text-ink-muted">Contact Phone</dt><dd className="font-medium text-ink">{institution.contactPhone}</dd></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Address</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-ink-light">
                {institution.address.street}<br />
                {institution.address.city}, {institution.address.district}<br />
                {institution.address.state} - {institution.address.pincode}
              </p>
            </CardContent>
          </Card>

          {institution.reviewRemarks && (
            <Card>
              <CardHeader><CardTitle>Review Remarks</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-ink-light">{institution.reviewRemarks}</p>
                {institution.reviewedAt && (
                  <p className="mt-2 text-xs text-ink-muted">
                    Reviewed on {new Date(institution.reviewedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action panel */}
        <div className="space-y-4">
          {institution.status === "DRAFT" && (
            <Card>
              <CardHeader><CardTitle>Submit for Review</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-ink-muted">
                  Submit this institution profile for Super Admin review and verification.
                </p>
                <Button onClick={handleSubmit} disabled={acting} className="w-full">
                  <Send className="h-4 w-4" /> Submit for Review
                </Button>
              </CardContent>
            </Card>
          )}

          {institution.status === "UNDER_REVIEW" && (
            <Card>
              <CardHeader><CardTitle>Review Decision</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  placeholder="Enter review remarks (min 5 characters)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {error && <p className="text-xs text-danger">{error}</p>}
                <Button variant="success" onClick={() => handleReview("VERIFIED")} disabled={acting} className="w-full">
                  <CheckCircle className="h-4 w-4" /> Verify & Approve
                </Button>
                <Button variant="warning" onClick={() => handleReview("CORRECTION_REQUIRED")} disabled={acting} className="w-full">
                  <AlertCircle className="h-4 w-4" /> Request Correction
                </Button>
                <Button variant="danger" onClick={() => handleReview("REJECTED")} disabled={acting} className="w-full">
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-muted">Status</span><StatusBadge status={institution.status} /></div>
                <div className="flex justify-between"><span className="text-ink-muted">Code</span><span className="font-medium text-ink">{institution.code}</span></div>
                <div className="flex justify-between"><span className="text-ink-muted">Category</span><span className="font-medium text-ink">{institution.category?.replace(/_/g, " ")}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
