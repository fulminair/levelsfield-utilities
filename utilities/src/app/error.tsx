"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Something went wrong</h1>
      <p className="text-sm text-[color:var(--text-secondary)]">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center rounded-full border border-[color:var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-strong)]"
      >
        Try again
      </button>
    </main>
  );
}
