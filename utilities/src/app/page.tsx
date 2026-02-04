import Link from "next/link";

const tools = [
  {
    title: "Tax Calculator",
    description: "Run quick tax calculations and check liability estimates.",
    badge: "Internal",
    href: "/tools/tax",
    external: false
  },
  {
    title: "Cash Desk",
    description: "Track drawer activity and reconcile daily cash flow.",
    badge: "Internal",
    href: "/tools/cash-desk",
    external: false
  },
  {
    title: "Ledgerly",
    description: "Open the Ledgerly workspace for reporting and audit trails.",
    badge: "External",
    href: "https://ledgerly.levelsfield.com",
    external: true
  }
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-12 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold text-[#18212b] md:text-5xl">
            Utilities
          </h1>
          <p className="max-w-2xl text-base text-[#5f6b7a] md:text-lg">
            Practical tools for cash, tax, invoices, and daily operations.
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => {
            const CardContent = (
              <div className="flex h-full flex-col justify-between rounded-2xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="flex flex-col gap-4">
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      tool.badge === "External"
                        ? "bg-[#f2e6dc] text-[#9b4f1f]"
                        : "bg-[#e1eef0] text-[#1e5a6a]"
                    }`}
                  >
                    {tool.badge}
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-[#18212b]">
                      {tool.title}
                    </h2>
                    <p className="mt-2 text-sm text-[#5f6b7a]">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#1e5a6a]/30 px-4 py-2 text-sm font-semibold text-[#0f3a45]">
                    Open
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </div>
            );

            if (tool.external) {
              return (
                <a
                  key={tool.title}
                  href={tool.href}
                  target="_blank"
                  rel="noreferrer"
                  className="h-full"
                >
                  {CardContent}
                </a>
              );
            }

            return (
              <Link key={tool.title} href={tool.href} className="h-full">
                {CardContent}
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
