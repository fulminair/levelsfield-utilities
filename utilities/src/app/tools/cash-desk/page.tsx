import Link from "next/link";

export default function CashDeskPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="rounded-2xl border border-white/60 bg-white/80 px-8 py-10 shadow-card backdrop-blur">
        <h1 className="text-2xl font-semibold text-[#18212b]">
          Cash Desk (to be added)
        </h1>
        <p className="mt-3 text-sm text-[#5f6b7a]">
          This workspace is being prepared.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full border border-[#1e5a6a]/30 px-4 py-2 text-sm font-semibold text-[#0f3a45]"
      >
        Back to Utilities
      </Link>
    </main>
  );
}
