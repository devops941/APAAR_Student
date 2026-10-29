"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const CATEGORIES = ["ENGINEERING", "POLYTECHNIC", "MANAGEMENT", "PHARMACY", "ARTS_SCIENCE"];

export default function NewInstitutionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", code: "", category: "ENGINEERING",
    address: { street: "", city: "", district: "", state: "", pincode: "" },
    contactEmail: "", contactPhone: "", principalName: "", approvalReference: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function updateAddress(key: string, value: string) {
    setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code: form.code.toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/institutions/${data.data._id}`);
      } else {
        setError(data?.error?.message || "Failed to create institution");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/institutions")}
        className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to institutions
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-ink">Add New Institution</h1>
        <p className="mt-1 text-sm text-ink-muted">Create a new institution profile in DRAFT status</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Basic Information</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Institution Name" required>
                <input value={form.name} onChange={(e) => update("name", e.target.value)} required className={inputCls} />
              </Field>
              <Field label="Institution Code" required>
                <input value={form.code} onChange={(e) => update("code", e.target.value.toUpperCase())} required placeholder="AICTE-TN-042" className={inputCls} />
              </Field>
              <Field label="Category" required>
                <select value={form.category} onChange={(e) => update("category", e.target.value)} className={inputCls}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                </select>
              </Field>
              <Field label="AICTE Approval Reference" required>
                <input value={form.approvalReference} onChange={(e) => update("approvalReference", e.target.value)} required className={inputCls} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Address</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Street" required><input value={form.address.street} onChange={(e) => updateAddress("street", e.target.value)} required className={inputCls} /></Field>
              <Field label="City" required><input value={form.address.city} onChange={(e) => updateAddress("city", e.target.value)} required className={inputCls} /></Field>
              <Field label="District" required><input value={form.address.district} onChange={(e) => updateAddress("district", e.target.value)} required className={inputCls} /></Field>
              <Field label="State" required><input value={form.address.state} onChange={(e) => updateAddress("state", e.target.value)} required className={inputCls} /></Field>
              <Field label="Pincode" required><input value={form.address.pincode} onChange={(e) => updateAddress("pincode", e.target.value)} required className={inputCls} /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contact & Principal</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact Email" required><input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} required className={inputCls} /></Field>
              <Field label="Contact Phone" required><input value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} required className={inputCls} /></Field>
              <Field label="Principal Name" required><input value={form.principalName} onChange={(e) => update("principalName", e.target.value)} required className={inputCls} /></Field>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Institution"}</Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/institutions")}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}{required && <span className="text-danger"> *</span>}</label>
      {children}
    </div>
  );
}
