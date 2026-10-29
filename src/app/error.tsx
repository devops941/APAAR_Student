"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="max-w-md rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <h2 className="mb-2 text-xl font-semibold text-ink">Something went wrong</h2>
        <p className="mb-6 text-sm text-ink-muted">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
