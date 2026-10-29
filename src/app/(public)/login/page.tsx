"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, GraduationCap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.error?.message || "Login failed. Please try again.");
        return;
      }

      // Redirect based on role
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left side — brand canvas */}
      <div className="flex flex-col justify-center bg-primary px-8 py-12 text-white lg:w-[45%] lg:px-16">
        <div className="mx-auto max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">APAAR Platform</h1>
              <p className="text-sm text-white/70">
                Student Data Management & Verification
              </p>
            </div>
          </div>

          <blockquote className="mb-6 border-l-2 border-white/30 pl-4">
            <p className="text-lg font-medium leading-relaxed">
              &ldquo;An APAAR ID-Based Student Data Management and Verification
              Platform for AICTE-Approved Institutions.&rdquo;
            </p>
          </blockquote>

          <p className="text-sm text-white/70">
            Securely manage student academic records, verify credentials, and
            maintain compliance with AICTE standards through a unified digital
            platform.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {["RBAC Security", "APAAR Masking", "Audit Trail", "Verification Workflow"].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex flex-1 items-center justify-center bg-canvas px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink">Welcome back</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Sign in to your institution account to continue
            </p>
          </div>

          {error && (
            <div
              className="mb-4 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Institutional Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="you@institution.edu.in"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!error}
                  className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 pr-11 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            APAAR ID-Based Student Data Management Platform
            <br />
            AICTE Demonstration Build — © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
