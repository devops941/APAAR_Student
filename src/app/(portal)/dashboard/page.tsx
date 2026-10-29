"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, AreaChart, Area, CartesianGrid,
} from "recharts";
import { GraduationCap, Building2, ShieldCheck, CheckCircle, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface DashboardData {
  kpis: {
    totalStudents: number;
    apaarRecorded: number;
    apaarCoveragePct: number;
    pendingReviews: number;
    verifiedRecords: number;
    totalInstitutions: number;
    rejectedRecords: number;
  };
  charts: {
    verificationBreakdown: { name: string; value: number; color: string }[];
    departmentStats: { name: string; total: number; withApaar: number }[];
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-ink-muted">Loading dashboard...</div>;

  if (!data) return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
      <Card className="p-6 text-center">
        <p className="text-sm text-ink-muted">Connect to MongoDB and run the seed script to see live metrics.</p>
      </Card>
    </div>
  );

  const kpis = data.kpis;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">Overview of platform activity and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Students" value={kpis.totalStudents} icon={GraduationCap} color="text-primary" />
        <KpiCard label="APAAR ID Recorded" value={`${kpis.apaarCoveragePct}%`} sub={`${kpis.apaarRecorded} of ${kpis.totalStudents}`} icon={TrendingUp} color="text-info" />
        <KpiCard label="Pending Reviews" value={kpis.pendingReviews} icon={ShieldCheck} color="text-warning" />
        <KpiCard label="Verified Records" value={kpis.verifiedRecords} icon={CheckCircle} color="text-success" />
      </div>

      {kpis.totalInstitutions > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Institutions" value={kpis.totalInstitutions} icon={Building2} color="text-info" />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Verification Status Donut */}
        {data.charts.verificationBreakdown.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4 text-base font-semibold text-ink">Verification Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.charts.verificationBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {data.charts.verificationBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Department-wise APAAR Adoption */}
        {data.charts.departmentStats.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-4 text-base font-semibold text-ink">Department-wise APAAR Adoption</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.charts.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total Students" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withApaar" name="With APAAR ID" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* APAAR Coverage Progress */}
      <Card className="p-6">
        <h3 className="mb-3 text-base font-semibold text-ink">APAAR ID Coverage</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${kpis.apaarCoveragePct}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-bold text-primary">{kpis.apaarCoveragePct}%</span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Labeled as "APAAR ID Recorded" — not "Officially Authenticated"
        </p>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
    </Card>
  );
}
