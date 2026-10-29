"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, GraduationCap, Upload, Plus } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { maskApaarId } from "@/lib/utils/apaar";

interface Student {
  _id: string;
  registerNumber: string;
  fullName: string;
  gender: string;
  admissionYear: number;
  currentSemester: number;
  academicStatus: string;
  apaarId?: string;
  departmentId?: { name: string; code: string } | null;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showImport, setShowImport] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "20" });
    if (search) params.set("search", search);

    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    if (data.success) {
      setStudents(data.data.students || []);
      setTotal(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 1);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Students</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage student records and APAAR IDs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(!showImport)}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button><Plus className="h-4 w-4" /> Add Student</Button>
        </div>
      </div>

      {showImport && (
        <Card className="p-6">
          <h3 className="mb-2 text-sm font-semibold text-ink">CSV Import</h3>
          <p className="mb-3 text-xs text-ink-muted">
            Upload a CSV with columns: registerNumber, fullName, email, departmentCode, admissionYear, currentSemester, gender, dateOfBirth, apaarId
          </p>
          <textarea
            placeholder="Paste CSV content here..."
            rows={5}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs"
            onBlur={async (e) => {
              if (e.target.value) {
                const res = await fetch("/api/students/import/preview", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ csvContent: e.target.value, institutionId: "" }),
                });
                const data = await res.json();
                if (data.success) {
                  alert(`Valid: ${data.data.validRowCount}, Invalid: ${data.data.invalidRowCount}`);
                }
              }
            }}
          />
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <input
          type="text"
          placeholder="Search by name or register number..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full rounded-lg border border-border bg-surface pl-10 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-12 text-center text-sm text-ink-muted">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <GraduationCap className="mb-3 h-10 w-10 text-ink-muted opacity-40" />
            <p className="text-sm text-ink-muted">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-canvas/50">
                <tr className="text-left text-xs font-medium uppercase text-ink-muted">
                  <th className="px-4 py-3">Register No</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Sem</th>
                  <th className="px-4 py-3">APAAR ID</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-canvas/50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-ink">{s.registerNumber}</td>
                    <td className="px-4 py-3 text-sm text-ink">{s.fullName}</td>
                    <td className="px-4 py-3 text-sm text-ink-light">{s.departmentId?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-ink-light">{s.currentSemester}</td>
                    <td className="px-4 py-3 text-sm font-mono text-ink-muted">{maskApaarId(s.apaarId)}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.academicStatus} /></td>
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
          <p className="text-sm text-ink-muted">{total} students total</p>
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
