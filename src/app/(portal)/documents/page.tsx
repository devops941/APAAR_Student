"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Upload, Copy, Check } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const DOC_TYPES = ["ADMISSION_PROOF", "SEMESTER_MARKSHEET", "DEGREE_CERTIFICATE", "TRANSFER_CERTIFICATE", "BONAFIDE", "OTHER"];

interface Doc {
  _id: string;
  title: string;
  documentType: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  status: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/documents");
    const data = await res.json();
    if (data.success) setDocuments(data.data.documents || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  function copyHash(hash: string, id: string) {
    navigator.clipboard.writeText(hash);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Documents</h1>
        <p className="mt-1 text-sm text-ink-muted">Secure document vault with integrity verification</p>
      </div>

      {/* Upload zone */}
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-center">
          <Upload className="mb-3 h-8 w-8 text-ink-muted" />
          <p className="text-sm font-medium text-ink">Drop files here or click to upload</p>
          <p className="mt-1 text-xs text-ink-muted">PDF, PNG, or JPEG · Max 5MB · SHA-256 verified</p>
        </div>
      </Card>

      {/* Document list */}
      {loading ? (
        <div className="p-12 text-center text-sm text-ink-muted">Loading documents...</div>
      ) : documents.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="mb-3 h-10 w-10 text-ink-muted opacity-40" />
            <p className="text-sm text-ink-muted">No documents uploaded yet</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-canvas/50">
                <tr className="text-left text-xs font-medium uppercase text-ink-muted">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">SHA-256 Hash</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-canvas/50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-ink">{doc.title}</td>
                    <td className="px-4 py-3 text-sm text-ink-light">{doc.documentType.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-sm text-ink-light">{(doc.fileSizeBytes / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <code className="text-xs text-ink-muted">{doc.sha256Hash.substring(0, 16)}...</code>
                        <button onClick={() => copyHash(doc.sha256Hash, doc._id)} className="text-ink-muted hover:text-primary" aria-label="Copy hash">
                          {copied === doc._id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3">
                      <a href={`/api/documents/${doc._id}/download`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">View</Button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
