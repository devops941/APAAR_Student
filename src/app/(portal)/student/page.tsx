"use client";

import { useEffect, useState } from "react";
import { Lock, Eye, EyeOff, FileText, Shield, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { maskApaarId, formatApaarId } from "@/lib/utils/apaar";

interface StudentProfile {
  fullName: string;
  registerNumber: string;
  apaarId?: string;
  admissionYear: number;
  currentSemester: number;
  gender: string;
  institutionId?: { name: string; code: string };
  departmentId?: { name: string; code: string };
}

interface AcademicRecord {
  _id: string;
  semester: number;
  academicYear: string;
  sgpa: number;
  totalCredits: number;
  status: string;
  subjects: { subjectCode: string; subjectName: string; credits: number; grade: string; result: string }[];
}

interface Consent {
  _id: string;
  requesterName: string;
  purpose: string;
  requestedFields: string[];
  state: string;
  expiresAt: string;
  createdAt: string;
}

export default function StudentPortalPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [revealedApaar, setRevealedApaar] = useState<string | null>(null);
  const [revealCountdown, setRevealCountdown] = useState(0);

  useEffect(() => {
    fetch("/api/student/profile").then((r) => r.json()).then((d) => d.success && setProfile(d.data));
    fetch("/api/student/academic-records").then((r) => r.json()).then((d) => d.success && setRecords(d.data.records || []));
    fetch("/api/student/consents").then((r) => r.json()).then((d) => d.success && setConsents(d.data.consents || []));
  }, []);

  async function handleReveal() {
    if (revealed) {
      setRevealed(false);
      setRevealedApaar(null);
      return;
    }
    const res = await fetch("/api/student/reveal-apaar", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setRevealed(true);
      setRevealedApaar(data.data.apaarId);
      setRevealCountdown(10);
    }
  }

  // Countdown timer for auto-mask
  useEffect(() => {
    if (revealCountdown > 0) {
      const timer = setTimeout(() => setRevealCountdown(revealCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (revealed && revealCountdown === 0) {
      setRevealed(false);
      setRevealedApaar(null);
    }
  }, [revealCountdown, revealed]);

  const cgpa = records.length > 0
    ? (records.reduce((sum, r) => sum + r.sgpa * r.totalCredits, 0) / records.reduce((sum, r) => sum + r.totalCredits, 0)).toFixed(2)
    : "—";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">My Portal</h1>

      {/* Student Identity Card */}
      <div className="overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-hover p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/70">APAAR Student Identity Card</p>
            <h2 className="mt-2 text-xl font-bold">{profile?.fullName || "Loading..."}</h2>
            <p className="mt-1 text-sm text-white/80">
              {profile?.registerNumber} · {profile?.departmentId?.name || "—"}
            </p>
            <p className="text-sm text-white/80">
              {profile?.institutionId?.name || "—"} · Admitted {profile?.admissionYear}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Shield className="h-6 w-6" />
          </div>
        </div>

        {/* APAAR ID Section */}
        <div className="mt-6 rounded-lg bg-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70">APAAR ID</p>
              <p className="mt-1 font-mono text-lg tracking-wider">
                {revealed && revealedApaar
                  ? formatApaarId(revealedApaar)
                  : maskApaarId(profile?.apaarId)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleReveal}
                className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium transition hover:bg-white/30"
              >
                {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {revealed ? "Hide" : "Reveal"}
              </button>
              {revealCountdown > 0 && (
                <span className="text-xs text-white/70">Auto-hide in {revealCountdown}s</span>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-white/50">
            Your APAAR ID is masked for privacy. Reveal is logged in the audit trail.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-ink-muted">Current Semester</p>
          <p className="mt-1 text-2xl font-bold text-ink">{profile?.currentSemester || "—"}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-muted">Cumulative GPA</p>
          <p className="mt-1 text-2xl font-bold text-primary">{cgpa}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-muted">Semesters Completed</p>
          <p className="mt-1 text-2xl font-bold text-ink">{records.length}</p>
        </Card>
      </div>

      {/* Academic Timeline */}
      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold text-ink">Academic Timeline</h3>
        {records.length === 0 ? (
          <p className="text-sm text-ink-muted">No academic records available yet.</p>
        ) : (
          <div className="space-y-3">
            {records.map((rec) => (
              <div key={rec._id} className="flex items-start gap-4 rounded-lg border border-border p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                  <span className="text-sm font-bold">{rec.semester}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">Semester {rec.semester} · {rec.academicYear}</p>
                    <StatusBadge status={rec.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">SGPA: <span className="font-bold text-primary">{rec.sgpa}</span> · Credits: {rec.totalCredits}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rec.subjects.map((s, i) => (
                      <span key={i} className="rounded-md bg-canvas px-2 py-0.5 text-xs text-ink-light">
                        {s.subjectCode}: {s.grade}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Document Vault */}
      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold text-ink flex items-center gap-2">
          <FileText className="h-4 w-4" /> Document Vault
        </h3>
        <p className="text-sm text-ink-muted">Access your verified certificates and marksheets.</p>
        <a href="/documents" className="mt-3 inline-block">
          <Button variant="secondary" size="sm">Go to Documents</Button>
        </a>
      </Card>

      {/* Consent History */}
      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold text-ink flex items-center gap-2">
          <Clock className="h-4 w-4" /> Third-Party Consent History
        </h3>
        {consents.length === 0 ? (
          <p className="text-sm text-ink-muted">No consent records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-xs font-medium uppercase text-ink-muted">
                  <th className="px-3 py-2">Requester</th>
                  <th className="px-3 py-2">Purpose</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {consents.map((c) => (
                  <tr key={c._id}>
                    <td className="px-3 py-2 text-sm text-ink">{c.requesterName}</td>
                    <td className="px-3 py-2 text-sm text-ink-light">{c.purpose}</td>
                    <td className="px-3 py-2 text-sm text-ink-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2"><StatusBadge status={c.state} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
