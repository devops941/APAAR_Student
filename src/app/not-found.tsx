export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <h1 className="mb-2 text-6xl font-bold text-primary">404</h1>
      <p className="mb-6 text-lg text-ink-muted">Page not found</p>
      <a
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
      >
        Back to home
      </a>
    </div>
  );
}
