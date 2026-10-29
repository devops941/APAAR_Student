"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Building2, Plus } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Institution {
  _id: string;
  name: string;
  code: string;
  category: string;
  address: { state: string; district: string; city: string };
  status: string;
}

const STATUS_FILTERS = ["All", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED", "CORRECTION_REQUIRED"];

export default function InstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchInstitutions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "All") params.set("status", statusFilter);

    const res = await fetch(`/api/institutions?${params}`);
    const data = await res.json();
    if (data.success) setInstitutions(data.data.institutions || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchInstitutions, 300);
    return () => clearTimeout(timer);
  }, [fetchInstitutions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Institutions</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage and review AICTE-approved institutions</p>
        </div>
        <Link href="/institutions/new">
          <Button>
            <Plus className="h-4 w-4" /> Add Institution
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface pl-10 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === s
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-ink-muted hover:bg-canvas"
              }`}
            >
              {s === "All" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="p-12 text-center text-sm text-ink-muted">Loading institutions...</div>
        ) : institutions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Building2 className="mb-3 h-10 w-10 text-ink-muted opacity-40" />
            <p className="text-sm text-ink-muted">No institutions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-canvas/50">
                <tr className="text-left text-xs font-medium uppercase text-ink-muted">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">District</th>
                  <th className="px-6 py-3">State</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {institutions.map((inst) => (
                  <tr key={inst._id} className="hover:bg-canvas/50 transition">
                    <td className="px-6 py-4">
                      <Link href={`/institutions/${inst._id}`} className="font-medium text-primary hover:underline">
                        {inst.code}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink">{inst.name}</td>
                    <td className="px-6 py-4 text-sm text-ink-light">{inst.address?.district}</td>
                    <td className="px-6 py-4 text-sm text-ink-light">{inst.address?.state}</td>
                    <td className="px-6 py-4 text-sm text-ink-light">{inst.category?.replace(/_/g, " ")}</td>
                    <td className="px-6 py-4"><StatusBadge status={inst.status} /></td>
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
