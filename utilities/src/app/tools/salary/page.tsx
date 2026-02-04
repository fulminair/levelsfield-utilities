"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const currencyFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const EMPLOYEE_SSNIT_RATE = 0.05;
const EMPLOYER_SSNIT_RATE = 0.135;

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
        headers: ["Employee", "Basic Salary", "SSNIT Tier 1 (5%)", "SSNIT Tier 2 (13.5%)"],
        rows: entries.map((entry) => [
          entry.name,
          roundMoney(entry.basic),
          roundMoney(entry.employeeSsnit),
          roundMoney(entry.employerSsnit)
        ]),
        json: entries.map((entry) => ({
          employee: entry.name,
          basic_salary: roundMoney(entry.basic),
          ssnit_tier_1: roundMoney(entry.employeeSsnit),
          ssnit_tier_2: roundMoney(entry.employerSsnit)
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
        "SSNIT Tier 1 (5%)",
        "PAYE",
        "Loan",
        "Total Deductions",
        "Net Pay",
        "SSNIT Tier 2 (13.5%)"
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
        ssnit_tier_1: roundMoney(entry.employeeSsnit),
        paye: roundMoney(entry.paye),
        loan: roundMoney(entry.loan),
        total_deductions: roundMoney(entry.totalDeductions),
        net_pay: roundMoney(entry.netPay),
        ssnit_tier_2: roundMoney(entry.employerSsnit)
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
            Ghana PAYE (2024) with SSNIT Tier 1 (5%) employee deductions and Tier 2
            (13.5%) employer contribution. Enter pay details below and add each
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

          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur">
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
                <span className="text-[#5f6b7a]">Employee SSNIT Tier 1 (5%)</span>
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
                <span>Employer SSNIT Tier 2 (13.5%)</span>
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
                  <th className="py-3 pr-4">SSNIT Tier 1 (5%)</th>
                  <th className="py-3 pr-4">PAYE</th>
                  <th className="py-3 pr-4">Loan</th>
                  <th className="py-3 pr-4">Deductions</th>
                  <th className="py-3 pr-4">Net Pay</th>
                  <th className="py-3 pr-4">SSNIT Tier 2 (13.5%)</th>
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
        </section>
      </div>
    </main>
  );
}
