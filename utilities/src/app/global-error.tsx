"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-4 px-6 py-12">
          <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Application error</h1>
          <p className="text-sm text-[color:var(--text-secondary)]">
            {error.message || "A fatal error occurred while rendering the app."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-strong)]"
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
