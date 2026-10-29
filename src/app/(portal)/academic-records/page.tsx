"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface AcademicRecord {
  _id: string;
  academicYear: string;
  semester: number;
  sgpa: number;
  totalCredits: number;
  status: string;
  version: number;
  subjects: { subjectCode: string; subjectName: string; credits: number; marksObtained: number; grade: string; result: string }[];
}

export default function AcademicRecordsPage() {
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/academic-records");
    const data = await res.json();
    if (data.success) setRecords(data.data.records || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Academic Records</h1>
          <p className="mt-1 text-sm text-ink-muted">Semester marksheets and grade management</p>
        </div>
        <Button><Plus className="h-4 w-4" /> New Marksheet</Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-ink-muted">Loading records...</div>
      ) : records.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <ClipboardList className="mb-3 h-10 w-10 text-ink-muted opacity-40" />
            <p className="text-sm text-ink-muted">No academic records found</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {records.map((rec) => (
            <Card key={rec._id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">Semester {rec.semester}</p>
                  <p className="text-xs text-ink-muted">{rec.academicYear} · v{rec.version}</p>
                </div>
                <StatusBadge status={rec.status} />
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-ink-muted">SGPA: </span><span className="font-bold text-primary">{rec.sgpa}</span></div>
                <div><span className="text-ink-muted">Credits: </span><span className="font-medium text-ink">{rec.totalCredits}</span></div>
              </div>
              <div className="space-y-1">
                {rec.subjects.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-ink-light">{s.subjectCode} · {s.subjectName}</span>
                    <span className="font-medium text-ink">{s.grade}</span>
                  </div>
                ))}
                {rec.subjects.length > 3 && (
                  <p className="text-xs text-ink-muted">+ {rec.subjects.length - 3} more subjects</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
