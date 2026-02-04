"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

const currencyFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const EMPLOYEE_SSNIT_RATE = 0.055;
const EMPLOYER_TIER1_RATE = 0.05;
const EMPLOYER_TIER2_RATE = 0.08;
const EMPLOYER_SSNIT_RATE = EMPLOYER_TIER1_RATE + EMPLOYER_TIER2_RATE;
const TIER2_TOTAL_RATE = EMPLOYEE_SSNIT_RATE + EMPLOYER_TIER2_RATE;

const toNumber = (value: string) => {
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundMoney = (value: number) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const formatMoney = (value: number) => currencyFormatter.format(value || 0);

const calculatePaye = (chargeable: number) => {
  const income = Math.max(0, chargeable);
  if (income <= 490) return 0;
  if (income <= 600) return (income - 490) * 0.05;
  if (income <= 730) return 5.5 + (income - 600) * 0.1;
  if (income <= 3896.67) return 18.5 + (income - 730) * 0.175;
  if (income <= 19896.67) return 572.67 + (income - 3896.67) * 0.25;
  if (income <= 50416.67) return 4572.67 + (income - 19896.67) * 0.3;
  return 13728.67 + (income - 50416.67) * 0.35;
};

type Html2Canvas = (
  element: HTMLElement,
  options?: {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
    backgroundColor?: string;
  }
) => Promise<HTMLCanvasElement>;

type SalaryForm = {
  name: string;
  basic: string;
  food: string;
  transportation: string;
  utilities: string;
  rent: string;
  others: string;
  loan: string;
};

type SalaryEntry = {
  id: string;
  name: string;
  basic: number;
  allowances: number;
  gross: number;
  employeeSsnit: number;
  chargeable: number;
  paye: number;
  loan: number;
  totalDeductions: number;
  netPay: number;
  employerSsnit: number;
};

type ReportType = "payroll" | "paye" | "ssnit";
type ReportFormat = "pdf" | "csv" | "json";

type PayeBracket = {
  lower: number;
  upper: number | null;
  rate: number;
  baseTax: number;
};

const PAYE_BRACKETS: PayeBracket[] = [
  { lower: 0, upper: 490, rate: 0, baseTax: 0 },
  { lower: 490, upper: 600, rate: 0.05, baseTax: 0 },
  { lower: 600, upper: 730, rate: 0.1, baseTax: 5.5 },
  { lower: 730, upper: 3896.67, rate: 0.175, baseTax: 18.5 },
  { lower: 3896.67, upper: 19896.67, rate: 0.25, baseTax: 572.67 },
  { lower: 19896.67, upper: 50416.67, rate: 0.3, baseTax: 4572.67 },
  { lower: 50416.67, upper: null, rate: 0.35, baseTax: 13728.67 }
];

const calculateChargeableFromNet = (netPay: number) => {
  const net = Math.max(0, netPay);
  if (net === 0) return 0;
  for (const bracket of PAYE_BRACKETS) {
    const denominator = 1 - bracket.rate;
    if (denominator <= 0) continue;
    const candidate =
      (net + bracket.baseTax - bracket.lower * bracket.rate) / denominator;
    const withinLower = candidate >= bracket.lower - 0.0001;
    const withinUpper = bracket.upper === null ? true : candidate <= bracket.upper + 0.0001;
    if (withinLower && withinUpper) return candidate;
  }
  return net;
};

const initialForm: SalaryForm = {
  name: "",
  basic: "",
  food: "",
  transportation: "",
  utilities: "",
  rent: "",
  others: "",
  loan: ""
};

export default function SalaryCalculatorPage() {
  const [form, setForm] = useState<SalaryForm>(initialForm);
  const [entries, setEntries] = useState<SalaryEntry[]>([]);
  const [reportType, setReportType] = useState<ReportType>("payroll");
  const [reportFormat, setReportFormat] = useState<ReportFormat>("pdf");
  const [reverseNetPay, setReverseNetPay] = useState<string>("");
  const summaryRef = useRef<HTMLDivElement | null>(null);

  const calculations = useMemo(() => {
    const basic = toNumber(form.basic);
    const allowances =
      toNumber(form.food) +
      toNumber(form.transportation) +
      toNumber(form.utilities) +
      toNumber(form.rent) +
      toNumber(form.others);
    const gross = basic + allowances;
    const employeeSsnit = basic * EMPLOYEE_SSNIT_RATE;
    const chargeable = Math.max(0, gross - employeeSsnit);
    const paye = calculatePaye(chargeable);
    const loan = toNumber(form.loan);
    const totalDeductions = employeeSsnit + paye + loan;
    const netPay = gross - totalDeductions;
    const employerSsnit = basic * EMPLOYER_SSNIT_RATE;

    return {
      basic: roundMoney(basic),
      allowances: roundMoney(allowances),
      gross: roundMoney(gross),
      employeeSsnit: roundMoney(employeeSsnit),
      chargeable: roundMoney(chargeable),
      paye: roundMoney(paye),
      loan: roundMoney(loan),
      totalDeductions: roundMoney(totalDeductions),
      netPay: roundMoney(netPay),
      employerSsnit: roundMoney(employerSsnit)
    };
  }, [form]);

  const reverseCalculations = useMemo(() => {
    const net = toNumber(reverseNetPay);
    if (!net) {
      return {
        basic: 0,
        gross: 0,
        chargeable: 0,
        paye: 0,
        employeeSsnit: 0,
        employerSsnit: 0,
        netPay: 0
      };
    }

    const chargeable = calculateChargeableFromNet(net);
    const gross = chargeable / (1 - EMPLOYEE_SSNIT_RATE);
    const basic = gross;
    const employeeSsnit = basic * EMPLOYEE_SSNIT_RATE;
    const paye = calculatePaye(chargeable);
    const employerSsnit = basic * EMPLOYER_SSNIT_RATE;

    return {
      basic: roundMoney(basic),
      gross: roundMoney(gross),
      chargeable: roundMoney(chargeable),
      paye: roundMoney(paye),
      employeeSsnit: roundMoney(employeeSsnit),
      employerSsnit: roundMoney(employerSsnit),
      netPay: roundMoney(net)
    };
  }, [reverseNetPay]);

  const updateField = (field: keyof SalaryForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddEmployee = () => {
    const name = form.name.trim();
    if (!name) {
      alert("Please enter an employee name.");
      return;
    }

    const entry: SalaryEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      basic: calculations.basic,
      allowances: calculations.allowances,
      gross: calculations.gross,
      employeeSsnit: calculations.employeeSsnit,
      chargeable: calculations.chargeable,
      paye: calculations.paye,
      loan: calculations.loan,
      totalDeductions: calculations.totalDeductions,
      netPay: calculations.netPay,
      employerSsnit: calculations.employerSsnit
    };

    setEntries((prev) => [entry, ...prev]);
    setForm(initialForm);
  };

  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const buildSummaryText = () => {
    const title = form.name.trim()
      ? `Salary Summary - ${form.name.trim()}`
      : "Salary Summary";
    const lines = [
      title,
      `Basic salary: ${formatMoney(calculations.basic)}`,
      `Food allowance: ${formatMoney(toNumber(form.food))}`,
      `Transport allowance: ${formatMoney(toNumber(form.transportation))}`,
      `Utilities allowance: ${formatMoney(toNumber(form.utilities))}`,
      `Rent allowance: ${formatMoney(toNumber(form.rent))}`,
      `Other allowance: ${formatMoney(toNumber(form.others))}`,
      `Allowances total: ${formatMoney(calculations.allowances)}`,
      `Gross pay: ${formatMoney(calculations.gross)}`,
      `Employee SSNIT (5.5%): ${formatMoney(calculations.employeeSsnit)}`,
      `Chargeable income: ${formatMoney(calculations.chargeable)}`,
      `PAYE: ${formatMoney(calculations.paye)}`,
      `Loan deductions: ${formatMoney(calculations.loan)}`,
      `Total deductions: ${formatMoney(calculations.totalDeductions)}`,
      `Net pay: ${formatMoney(calculations.netPay)}`,
      `Employer SSNIT (13%): ${formatMoney(calculations.employerSsnit)}`
    ];
    return lines.join("\n");
  };

  const handleCopySummaryText = async () => {
    const text = buildSummaryText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("Summary copied to clipboard.");
    } catch {
      prompt("Copy summary text:", text);
    }
  };

  const ensureHtml2Canvas = () => {
    const w = window as Window & { html2canvas?: Html2Canvas };
    if (w.html2canvas) return Promise.resolve(w.html2canvas);

    const existing = document.getElementById("html2canvas-cdn");
    if (existing) {
      return new Promise<Html2Canvas>((resolve, reject) => {
        existing.addEventListener("load", () => resolve(w.html2canvas as Html2Canvas), {
          once: true
        });
        existing.addEventListener(
          "error",
          () => reject(new Error("Failed to load html2canvas")),
          { once: true }
        );
      });
    }

    return new Promise<Html2Canvas>((resolve, reject) => {
      const script = document.createElement("script");
      script.id = "html2canvas-cdn";
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = () => resolve(w.html2canvas as Html2Canvas);
      script.onerror = () => reject(new Error("Failed to load html2canvas"));
      document.head.appendChild(script);
    });
  };

  const handleCopySummarySnapshot = async () => {
    if (!summaryRef.current) {
      alert("Summary is not ready yet.");
      return;
    }
    try {
      const html2canvas = await ensureHtml2Canvas();
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Snapshot failed"))), "image/png");
      });

      const canClipboardWrite =
        navigator.clipboard &&
        typeof navigator.clipboard.write === "function" &&
        "ClipboardItem" in window;

      if (canClipboardWrite) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ "image/png": blob })
        ]);
        alert("Summary snapshot copied to clipboard.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "salary-summary.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert("Snapshot downloaded (clipboard not available).");
    } catch (error) {
      console.error(error);
      alert("Unable to copy snapshot. Please try again.");
    }
  };

  const buildReport = (type: ReportType) => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStamp = `${y}-${m}-${d}`;

    if (type === "paye") {
      return {
        title: "PAYE Report",
        filename: `paye-report-${dateStamp}`,
        headers: ["Employee", "Chargeable Income", "PAYE"],
        rows: entries.map((entry) => [
          entry.name,
          roundMoney(entry.chargeable),
          roundMoney(entry.paye)
        ]),
        json: entries.map((entry) => ({
          employee: entry.name,
          chargeable_income: roundMoney(entry.chargeable),
          paye: roundMoney(entry.paye)
        }))
      };
    }

    if (type === "ssnit") {
      return {
        title: "SSNIT Report",
        filename: `ssnit-report-${dateStamp}`,
        headers: [
          "Employee",
          "Basic Salary",
          "Tier 1 Employer (5%)",
          "Tier 2 Employee (5.5%)",
          "Tier 2 Employer (8%)",
          "Tier 2 Total (13.5%)"
        ],
        rows: entries.map((entry) => {
          const tier1 = roundMoney(entry.basic * EMPLOYER_TIER1_RATE);
          const tier2Employee = roundMoney(entry.basic * EMPLOYEE_SSNIT_RATE);
          const tier2Employer = roundMoney(entry.basic * EMPLOYER_TIER2_RATE);
          const tier2Total = roundMoney(entry.basic * TIER2_TOTAL_RATE);
          return [
            entry.name,
            roundMoney(entry.basic),
            tier1,
            tier2Employee,
            tier2Employer,
            tier2Total
          ];
        }),
        json: entries.map((entry) => ({
          employee: entry.name,
          basic_salary: roundMoney(entry.basic),
          tier_1_employer: roundMoney(entry.basic * EMPLOYER_TIER1_RATE),
          tier_2_employee: roundMoney(entry.basic * EMPLOYEE_SSNIT_RATE),
          tier_2_employer: roundMoney(entry.basic * EMPLOYER_TIER2_RATE),
          tier_2_total: roundMoney(entry.basic * TIER2_TOTAL_RATE)
        }))
      };
    }

    return {
      title: "Payroll Report",
      filename: `payroll-report-${dateStamp}`,
      headers: [
        "Employee",
        "Basic Salary",
        "Allowances",
        "Gross Pay",
        "SSNIT Employee (5.5%)",
        "PAYE",
        "Loan",
        "Total Deductions",
        "Net Pay",
        "SSNIT Employer (13%)"
      ],
      rows: entries.map((entry) => [
        entry.name,
        roundMoney(entry.basic),
        roundMoney(entry.allowances),
        roundMoney(entry.gross),
        roundMoney(entry.employeeSsnit),
        roundMoney(entry.paye),
        roundMoney(entry.loan),
        roundMoney(entry.totalDeductions),
        roundMoney(entry.netPay),
        roundMoney(entry.employerSsnit)
      ]),
      json: entries.map((entry) => ({
        employee: entry.name,
        basic_salary: roundMoney(entry.basic),
        allowances: roundMoney(entry.allowances),
        gross_pay: roundMoney(entry.gross),
        ssnit_employee: roundMoney(entry.employeeSsnit),
        paye: roundMoney(entry.paye),
        loan: roundMoney(entry.loan),
        total_deductions: roundMoney(entry.totalDeductions),
        net_pay: roundMoney(entry.netPay),
        ssnit_employer: roundMoney(entry.employerSsnit)
      }))
    };
  };

  const downloadFile = (content: BlobPart, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCsv = (headers: string[], rows: Array<Array<string | number>>) => {
    const escape = (value: string | number) => {
      const str = String(value ?? "");
      return `"${str.replace(/\"/g, "\"\"")}"`;
    };
    const lines = [headers.map(escape).join(",")];
    rows.forEach((row) => {
      lines.push(row.map(escape).join(","));
    });
    return lines.join("\n");
  };

  const exportPdf = async (title: string, headers: string[], rows: Array<Array<string | number>>, filename: string) => {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable")
    ]);
    const autoTable = autoTableModule.default;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated ${new Date().toLocaleString()}`, 40, 60);

    autoTable(doc, {
      startY: 80,
      head: [headers],
      body: rows.map((row) =>
        row.map((cell) => (typeof cell === "number" ? formatMoney(cell) : String(cell)))
      ),
      styles: { fontSize: 8, cellPadding: 6 },
      headStyles: { fillColor: [30, 90, 106], textColor: 255 }
    });

    doc.save(`${filename}.pdf`);
  };

  const handleExport = async () => {
    if (!entries.length) {
      alert("Add at least one employee to generate a report.");
      return;
    }
    const report = buildReport(reportType);

    if (reportFormat === "json") {
      downloadFile(JSON.stringify(report.json, null, 2), `${report.filename}.json`, "application/json");
      return;
    }

    if (reportFormat === "csv") {
      const csv = exportCsv(report.headers, report.rows);
      downloadFile(csv, `${report.filename}.csv`, "text/csv");
      return;
    }

    await exportPdf(report.title, report.headers, report.rows, report.filename);
  };

  const previewReport = buildReport(reportType);

  return (
    <main className="min-h-screen px-6 py-12 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link href="/" className="text-sm font-semibold text-[#1e5a6a]">
            ← Back to Utilities
          </Link>
          <h1 className="text-3xl font-semibold text-[#18212b] md:text-4xl">
            Salary Calculator
          </h1>
          <p className="max-w-3xl text-sm text-[#5f6b7a] md:text-base">
            Ghana PAYE (2024) with SSNIT 5.5% employee deductions and 13% employer
            contribution. Enter pay details below and add each
            employee to the table.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e5a6a]">
                  Inputs
                </p>
                <h2 className="text-xl font-semibold text-[#18212b]">
                  Employee Pay Details
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddEmployee}
                className="inline-flex items-center justify-center rounded-full border border-[#1e5a6a]/30 px-4 py-2 text-sm font-semibold text-[#0f3a45]"
              >
                Add Employee
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-[#1f2933]">
                  Employee Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Ama Owusu"
                  className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1f2933]">
                  Basic Salary (GHS)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.basic}
                  onChange={(e) => updateField("basic", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1f2933]">
                  Food Allowance
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.food}
                  onChange={(e) => updateField("food", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1f2933]">
                  Transportation Allowance
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.transportation}
                  onChange={(e) => updateField("transportation", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1f2933]">
                  Utilities Allowance
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.utilities}
                  onChange={(e) => updateField("utilities", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1f2933]">
                  Rent Allowance
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rent}
                  onChange={(e) => updateField("rent", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1f2933]">
                  Other Allowances
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.others}
                  onChange={(e) => updateField("others", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1f2933]">
                  Loan Deductions
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.loan}
                  onChange={(e) => updateField("loan", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div
            ref={summaryRef}
            className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e5a6a]">
                  Summary
                </p>
                <h2 className="text-xl font-semibold text-[#18212b]">Auto-calculated</h2>
                <p className="text-sm text-[#5f6b7a]">
                  Gross pay, SSNIT, PAYE, total deductions, and net pay update as you
                  type.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopySummaryText}
                  className="rounded-full border border-[#1e5a6a]/30 px-3 py-1 text-xs font-semibold text-[#0f3a45]"
                >
                  Copy text
                </button>
                <button
                  type="button"
                  onClick={handleCopySummarySnapshot}
                  className="rounded-full border border-[#1e5a6a]/30 px-3 py-1 text-xs font-semibold text-[#0f3a45]"
                >
                  Copy snapshot
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5f6b7a]">Allowances total</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(calculations.allowances)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5f6b7a]">Gross pay</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(calculations.gross)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5f6b7a]">Employee SSNIT (5.5%)</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(calculations.employeeSsnit)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5f6b7a]">Chargeable income</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(calculations.chargeable)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5f6b7a]">PAYE</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(calculations.paye)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5f6b7a]">Loan deductions</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(calculations.loan)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#5f6b7a]">Total deductions</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(calculations.totalDeductions)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="font-semibold text-[#0f3a45]">Net pay</span>
                <span className="text-lg font-semibold text-[#0f3a45]">
                  {formatMoney(calculations.netPay)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#5f6b7a]">
                <span>Employer SSNIT (13%)</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(calculations.employerSsnit)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e5a6a]">
                Employees
              </p>
              <h2 className="text-xl font-semibold text-[#18212b]">
                Salary Table
              </h2>
            </div>
            <p className="text-sm text-[#5f6b7a]">
              {entries.length} record{entries.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-left text-xs uppercase tracking-[0.2em] text-[#5f6b7a]">
                  <th className="py-3 pr-4">Employee</th>
                  <th className="py-3 pr-4">Basic</th>
                  <th className="py-3 pr-4">Allowances</th>
                  <th className="py-3 pr-4">Gross</th>
                  <th className="py-3 pr-4">SSNIT Employee (5.5%)</th>
                  <th className="py-3 pr-4">PAYE</th>
                  <th className="py-3 pr-4">Loan</th>
                  <th className="py-3 pr-4">Deductions</th>
                  <th className="py-3 pr-4">Net Pay</th>
                  <th className="py-3 pr-4">SSNIT Employer (13%)</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="py-6 text-center text-sm text-[#5f6b7a]"
                    >
                      No employees added yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-[#f1f5f9]">
                      <td className="py-3 pr-4 font-semibold text-[#18212b]">
                        {entry.name}
                      </td>
                      <td className="py-3 pr-4">{formatMoney(entry.basic)}</td>
                      <td className="py-3 pr-4">{formatMoney(entry.allowances)}</td>
                      <td className="py-3 pr-4">{formatMoney(entry.gross)}</td>
                      <td className="py-3 pr-4">{formatMoney(entry.employeeSsnit)}</td>
                      <td className="py-3 pr-4">{formatMoney(entry.paye)}</td>
                      <td className="py-3 pr-4">{formatMoney(entry.loan)}</td>
                      <td className="py-3 pr-4">{formatMoney(entry.totalDeductions)}</td>
                      <td className="py-3 pr-4 font-semibold text-[#0f3a45]">
                        {formatMoney(entry.netPay)}
                      </td>
                      <td className="py-3 pr-4">{formatMoney(entry.employerSsnit)}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveEntry(entry.id)}
                          className="rounded-full border border-[#1e5a6a]/30 px-3 py-1 text-xs font-semibold text-[#0f3a45]"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e5a6a]">
              Reverse Calculator
            </p>
            <h2 className="text-xl font-semibold text-[#18212b]">
              Net Pay → Basic Salary
            </h2>
            <p className="text-sm text-[#5f6b7a]">
              Enter net pay to estimate the basic salary. Allowances and loan
              deductions are ignored in this reverse calculation.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1.2fr]">
            <div>
              <label className="text-sm font-semibold text-[#1f2933]">
                Net Pay (GHS)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={reverseNetPay}
                onChange={(e) => setReverseNetPay(e.target.value)}
                placeholder="0.00"
                className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
              />
            </div>

            <div className="grid gap-3 rounded-xl border border-[#e2e8f0] bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#5f6b7a]">Basic / Gross salary</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(reverseCalculations.basic)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5f6b7a]">Chargeable income</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(reverseCalculations.chargeable)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5f6b7a]">Employee SSNIT (5.5%)</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(reverseCalculations.employeeSsnit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5f6b7a]">PAYE</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(reverseCalculations.paye)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5f6b7a]">Employer SSNIT (13%)</span>
                <span className="font-semibold text-[#18212b]">
                  {formatMoney(reverseCalculations.employerSsnit)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1e5a6a]">
              Reports
            </p>
            <h2 className="text-xl font-semibold text-[#18212b]">
              Export Payroll, PAYE, and SSNIT
            </h2>
            <p className="text-sm text-[#5f6b7a]">
              Generate a report for the current table in PDF, CSV, or JSON.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="text-sm font-semibold text-[#1f2933]">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
              >
                <option value="payroll">Payroll report</option>
                <option value="paye">PAYE report</option>
                <option value="ssnit">SSNIT report</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#1f2933]">
                File Format
              </label>
              <select
                value={reportFormat}
                onChange={(e) => setReportFormat(e.target.value as ReportFormat)}
                className="mt-2 w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#1f2933] shadow-sm focus:border-[#1e5a6a] focus:outline-none"
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center rounded-full border border-[#1e5a6a]/30 px-6 py-3 text-sm font-semibold text-[#0f3a45]"
            >
              Download
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-[#e2e8f0] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#18212b]">
                {previewReport.title} Preview
              </p>
              <p className="text-xs text-[#5f6b7a]">
                {entries.length} record{entries.length === 1 ? "" : "s"}
              </p>
            </div>

            {entries.length === 0 ? (
              <p className="mt-3 text-sm text-[#5f6b7a]">
                Add employees to see the report preview.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[900px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] text-left text-xs uppercase tracking-[0.18em] text-[#5f6b7a]">
                      {previewReport.headers.map((header) => (
                        <th key={header} className="py-3 pr-4">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewReport.rows.map((row, rowIndex) => (
                      <tr key={`preview-${rowIndex}`} className="border-b border-[#f1f5f9]">
                        {row.map((cell, cellIndex) => (
                          <td key={`preview-${rowIndex}-${cellIndex}`} className="py-3 pr-4">
                            {typeof cell === "number" ? formatMoney(cell) : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
