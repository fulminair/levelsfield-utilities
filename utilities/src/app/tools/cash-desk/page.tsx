import Link from "next/link";

export default function CashDeskPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-8 py-10 shadow-card backdrop-blur">
        <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">
          Cash Desk (to be added)
        </h1>
        <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
          This workspace is being prepared.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full border border-[color:var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-strong)]"
      >
        Back to Utilities
      </Link>
    </main>
  );
}
