import Link from "next/link";

type Tool = {
  title: string;
  description: string;
  tag: string;
  href: string;
  external: boolean;
  code: string;
  accent: string;
};

const tools: Tool[] = [
  {
    title: "Tax Calculator",
    description: "Run tax and levy calculations with quick breakdowns and share-ready snapshots.",
    tag: "Internal",
    href: "/tools/tax",
    external: false,
    code: "TX",
    accent: "#e96f4a"
  },
  {
    title: "Cash Desk",
    description: "Count notes and coins, track differences, and save drawer history by shift.",
    tag: "Internal",
    href: "/tools/cash-desk",
    external: false,
    code: "CD",
    accent: "#2f7e89"
  },
  {
    title: "Salary Calculator",
    description: "Calculate gross pay, PAYE, SSNIT, and net pay with exportable payroll reports.",
    tag: "Internal",
    href: "/tools/salary",
    external: false,
    code: "PY",
    accent: "#2d8f60"
  },
  {
    title: "GB Calculator",
    description: "Use your payroll-slip structure with provident bands, PAYE, and loan tracking.",
    tag: "Internal",
    href: "/tools/gb-calculator",
    external: false,
    code: "PS",
    accent: "#b05f2d"
  },
  {
    title: "Ledgerly",
    description: "Open the Ledgerly workspace for accounting workflows and audit tracing.",
    tag: "External",
    href: "https://ledgerly.levelsfield.com",
    external: true,
    code: "LG",
    accent: "#855ad8"
  }
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-14 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="relative overflow-hidden rounded-3xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-6 py-8 shadow-card backdrop-blur md:px-10 md:py-10">
          <div className="pointer-events-none absolute inset-0 border border-[color:var(--border-subtle)]/60" />

          <div className="relative flex flex-col gap-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
                Levelsfield Workspace
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[color:var(--text-primary)] md:text-5xl">
                Practical finance utilities with one shared interface.
              </h1>
              <p className="max-w-3xl text-base text-[color:var(--text-secondary)] md:text-lg">
                Launch tax, salary, and cash-desk workflows from one place. Theme and visual style now stay
                consistent across all utilities.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">
                  Tools
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">
                  {tools.length} Active
                </p>
              </article>
              <article className="rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">
                  Theme
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">Universal</p>
              </article>
              <article className="rounded-2xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--text-secondary)]">
                  Reports
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)]">PDF / CSV / JSON</p>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => {
            const card = (
              <article className="group flex h-full flex-col justify-between rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-5 shadow-card backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold"
                      style={{
                        backgroundColor: `${tool.accent}1f`,
                        color: tool.accent
                      }}
                    >
                      {tool.code}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                        tool.tag === "External"
                          ? "bg-[color:var(--badge-external-bg)] text-[color:var(--badge-external-text)]"
                          : "bg-[color:var(--badge-internal-bg)] text-[color:var(--badge-internal-text)]"
                      }`}
                    >
                      {tool.tag}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">{tool.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{tool.description}</p>
                  </div>
                </div>

                <div className="mt-8">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-strong)]">
                    Open Tool
                    <span className="transition group-hover:translate-x-1" aria-hidden="true">
                      {"->"}
                    </span>
                  </span>
                </div>
              </article>
            );

            if (tool.external) {
              return (
                <a key={tool.title} href={tool.href} target="_blank" rel="noreferrer" className="h-full">
                  {card}
                </a>
              );
            }

            return (
              <Link key={tool.title} href={tool.href} className="h-full">
                {card}
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
