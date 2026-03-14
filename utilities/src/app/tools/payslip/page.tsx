"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
const currencyFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const SOCIAL_SECURITY_RATE = 0.055;
const PF_EARN_35_RATE = 0.035;
const PF_EARN_65_RATE = 0.065;
const PF_DED_35_RATE = 0.035;
const PF_DED_165_RATE = 0.165;
const DEFAULT_TRANSPORT_RATE_PERCENT = 25;
const DEFAULT_UTILITY_RATE_PERCENT = 15;
const DEFAULT_RENT_RATE_PERCENT = 20;
const DEFAULT_RISK_RATE_PERCENT = 10;
const DEFAULT_LEAVE_RATE_PERCENT = 100;
const DEFAULT_CLOTHING_RATE_PERCENT = 0;
const toNumber = (value: string) => {
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const roundMoney = (value: number) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};
const formatMoney = (value: number) => currencyFormatter.format(value || 0);
const formatPdfMoney = (value: number) =>
  `GHS\u00A0${roundMoney(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPercent = (value: number) =>
  `${roundMoney(value).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
const isZeroAmount = (value: number) => roundMoney(value) === 0;
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
  },
) => Promise<HTMLCanvasElement>;
type PayslipForm = {
  name: string;
  basic: string;
  includeTransportAllowance: boolean;
  transportRate: string;
  transport: string;
  includeUtilityAllowance: boolean;
  utilityRate: string;
  utility: string;
  includeRentAllowance: boolean;
  rentRate: string;
  rent: string;
  includeRiskAllowance: boolean;
  riskRate: string;
  risk: string;
  includeLeaveAllowance: boolean;
  leaveAllowanceRate: string;
  leaveAllowance: string;
  includeClothingAllowance: boolean;
  clothingRate: string;
  clothingAllowance: string;
  otherEarnings: string;
  overtimeAddition: string;
  latenessDeduction: string;
  absenteeismDeduction: string;
  welfare: string;
  unionDues: string;
  support: string;
  loanAmount: string;
  totalPaid: string;
};
type PayslipEntry = {
  id: string;
  name: string;
  basic: number;
  includeTransportAllowance: boolean;
  transportRate: number;
  transport: number;
  includeUtilityAllowance: boolean;
  utilityRate: number;
  utility: number;
  includeRentAllowance: boolean;
  rentRate: number;
  rent: number;
  includeRiskAllowance: boolean;
  riskRate: number;
  risk: number;
  includeLeaveAllowance: boolean;
  leaveAllowanceRate: number;
  leaveAllowance: number;
  includeClothingAllowance: boolean;
  clothingRate: number;
  clothingAllowance: number;
  overrideTransport: boolean;
  overrideUtility: boolean;
  overrideRent: boolean;
  overrideRisk: boolean;
  overrideLeaveAllowance: boolean;
  overrideClothingAllowance: boolean;
  otherEarnings: number;
  overtimeAddition: number;
  providentEarning35: number;
  providentEarning65: number;
  grossEarnings: number;
  socialSecurity: number;
  providentDeduction35: number;
  providentDeduction165: number;
  taxableIncome: number;
  paye: number;
  welfare: number;
  unionDues: number;
  support: number;
  latenessDeduction: number;
  absenteeismDeduction: number;
  totalDeductions: number;
  netSalary: number;
  loanAmount: number;
  totalPaid: number;
  outstanding: number;
};
type ReportType = "payroll" | "paye" | "deductions" | "loan" | "slip";
type ReportFormat = "pdf" | "csv" | "json";
type AllowanceOverrideState = {
  transport: boolean;
  utility: boolean;
  rent: boolean;
  risk: boolean;
  leaveAllowance: boolean;
  clothingAllowance: boolean;
};
const initialAllowanceOverrides: AllowanceOverrideState = {
  transport: false,
  utility: false,
  rent: false,
  risk: false,
  leaveAllowance: false,
  clothingAllowance: false,
};
const initialForm: PayslipForm = {
  name: "Ama Owusu",
  basic: "20000",
  includeTransportAllowance: true,
  transportRate: String(DEFAULT_TRANSPORT_RATE_PERCENT),
  transport: "",
  includeUtilityAllowance: true,
  utilityRate: String(DEFAULT_UTILITY_RATE_PERCENT),
  utility: "",
  includeRentAllowance: true,
  rentRate: String(DEFAULT_RENT_RATE_PERCENT),
  rent: "",
  includeRiskAllowance: true,
  riskRate: String(DEFAULT_RISK_RATE_PERCENT),
  risk: "",
  includeLeaveAllowance: false,
  leaveAllowanceRate: String(DEFAULT_LEAVE_RATE_PERCENT),
  leaveAllowance: "",
  includeClothingAllowance: false,
  clothingRate: String(DEFAULT_CLOTHING_RATE_PERCENT),
  clothingAllowance: "",
  otherEarnings: "",
  overtimeAddition: "",
  latenessDeduction: "",
  absenteeismDeduction: "",
  welfare: "",
  unionDues: "",
  support: "",
  loanAmount: "",
  totalPaid: "",
};
export default function PayslipPage() {
  const [form, setForm] = useState<PayslipForm>(initialForm);
  const [allowanceOverrides, setAllowanceOverrides] =
    useState<AllowanceOverrideState>(initialAllowanceOverrides);
  const [entries, setEntries] = useState<PayslipEntry[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = useState<PayslipEntry | null>(null);
  const [reportType, setReportType] = useState<ReportType>("slip");
  const [reportFormat, setReportFormat] = useState<ReportFormat>("pdf");
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const calculations = useMemo(() => {
    const basic = toNumber(form.basic);
    const transportRate = Math.max(0, toNumber(form.transportRate));
    const utilityRate = Math.max(0, toNumber(form.utilityRate));
    const rentRate = Math.max(0, toNumber(form.rentRate));
    const riskRate = Math.max(0, toNumber(form.riskRate));
    const leaveAllowanceRate = Math.max(0, toNumber(form.leaveAllowanceRate));
    const clothingRate = Math.max(0, toNumber(form.clothingRate));
    const transportAuto = form.includeTransportAllowance
      ? basic * (transportRate / 100)
      : 0;
    const utilityAuto = form.includeUtilityAllowance
      ? basic * (utilityRate / 100)
      : 0;
    const rentAuto = form.includeRentAllowance ? basic * (rentRate / 100) : 0;
    const riskAuto = form.includeRiskAllowance ? basic * (riskRate / 100) : 0;
    const leaveAllowanceAuto = form.includeLeaveAllowance
      ? basic * (leaveAllowanceRate / 100)
      : 0;
    const clothingAllowanceAuto = form.includeClothingAllowance
      ? basic * (clothingRate / 100)
      : 0;
    const transport = form.includeTransportAllowance
      ? allowanceOverrides.transport
        ? toNumber(form.transport)
        : transportAuto
      : 0;
    const utility = form.includeUtilityAllowance
      ? allowanceOverrides.utility
        ? toNumber(form.utility)
        : utilityAuto
      : 0;
    const rent = form.includeRentAllowance
      ? allowanceOverrides.rent
        ? toNumber(form.rent)
        : rentAuto
      : 0;
    const risk = form.includeRiskAllowance
      ? allowanceOverrides.risk
        ? toNumber(form.risk)
        : riskAuto
      : 0;
    const leaveAllowance = form.includeLeaveAllowance
      ? allowanceOverrides.leaveAllowance
        ? toNumber(form.leaveAllowance)
        : leaveAllowanceAuto
      : 0;
    const clothingAllowance = form.includeClothingAllowance
      ? allowanceOverrides.clothingAllowance
        ? toNumber(form.clothingAllowance)
        : clothingAllowanceAuto
      : 0;
    const otherEarnings = toNumber(form.otherEarnings);
    const overtimeAddition = toNumber(form.overtimeAddition);
    const latenessDeduction = toNumber(form.latenessDeduction);
    const absenteeismDeduction = toNumber(form.absenteeismDeduction);
    const welfare = toNumber(form.welfare);
    const unionDues = toNumber(form.unionDues);
    const support = toNumber(form.support);
    const loanAmount = toNumber(form.loanAmount);
    const totalPaid = toNumber(form.totalPaid);
    const providentEarning35 = basic * PF_EARN_35_RATE;
    const providentEarning65 = basic * PF_EARN_65_RATE;
    const grossEarnings =
      basic +
      transport +
      utility +
      rent +
      risk +
      leaveAllowance +
      clothingAllowance +
      otherEarnings +
      overtimeAddition +
      providentEarning35 +
      providentEarning65;
    const socialSecurity = basic * SOCIAL_SECURITY_RATE;
    const providentDeduction35 = basic * PF_DED_35_RATE;
    const providentDeduction165 = basic * PF_DED_165_RATE;
    const taxableIncome = Math.max(
      0,
      grossEarnings - socialSecurity - providentDeduction165,
    );
    const paye = calculatePaye(taxableIncome);
    const totalDeductions =
      socialSecurity +
      paye +
      welfare +
      unionDues +
      support +
      latenessDeduction +
      absenteeismDeduction +
      providentDeduction35 +
      providentDeduction165;
    const netSalary = grossEarnings - totalDeductions;
    const outstanding = loanAmount - totalPaid;
    return {
      basic: roundMoney(basic),
      includeTransportAllowance: form.includeTransportAllowance,
      transportRate: roundMoney(transportRate),
      transport: roundMoney(transport),
      includeUtilityAllowance: form.includeUtilityAllowance,
      utilityRate: roundMoney(utilityRate),
      utility: roundMoney(utility),
      includeRentAllowance: form.includeRentAllowance,
      rentRate: roundMoney(rentRate),
      rent: roundMoney(rent),
      includeRiskAllowance: form.includeRiskAllowance,
      riskRate: roundMoney(riskRate),
      risk: roundMoney(risk),
      includeLeaveAllowance: form.includeLeaveAllowance,
      leaveAllowanceRate: roundMoney(leaveAllowanceRate),
      leaveAllowance: roundMoney(leaveAllowance),
      includeClothingAllowance: form.includeClothingAllowance,
      clothingRate: roundMoney(clothingRate),
      clothingAllowance: roundMoney(clothingAllowance),
      otherEarnings: roundMoney(otherEarnings),
      overtimeAddition: roundMoney(overtimeAddition),
      providentEarning35: roundMoney(providentEarning35),
      providentEarning65: roundMoney(providentEarning65),
      grossEarnings: roundMoney(grossEarnings),
      socialSecurity: roundMoney(socialSecurity),
      providentDeduction35: roundMoney(providentDeduction35),
      providentDeduction165: roundMoney(providentDeduction165),
      taxableIncome: roundMoney(taxableIncome),
      paye: roundMoney(paye),
      welfare: roundMoney(welfare),
      unionDues: roundMoney(unionDues),
      support: roundMoney(support),
      latenessDeduction: roundMoney(latenessDeduction),
      absenteeismDeduction: roundMoney(absenteeismDeduction),
      totalDeductions: roundMoney(totalDeductions),
      netSalary: roundMoney(netSalary),
      loanAmount: roundMoney(loanAmount),
      totalPaid: roundMoney(totalPaid),
      outstanding: roundMoney(outstanding),
    };
  }, [form, allowanceOverrides]);
  const updateField = <K extends keyof PayslipForm>(
    field: K,
    value: PayslipForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const updateAllowanceOverride = <K extends keyof AllowanceOverrideState>(
    key: K,
    value: AllowanceOverrideState[K],
  ) => {
    setAllowanceOverrides((prev) => ({ ...prev, [key]: value }));
  };
  const updateAllowanceAmount = (
    field:
      | "transport"
      | "utility"
      | "rent"
      | "risk"
      | "leaveAllowance"
      | "clothingAllowance",
    overrideKey: keyof AllowanceOverrideState,
    value: string,
  ) => {
    updateField(field, value);
    updateAllowanceOverride(overrideKey, true);
  };
  const toInputValue = (value: number) => String(roundMoney(value));
  const toFormFromEntry = (entry: PayslipEntry): PayslipForm => ({
    name: entry.name,
    basic: toInputValue(entry.basic),
    includeTransportAllowance: entry.includeTransportAllowance ?? true,
    transportRate: toInputValue(
      entry.transportRate ?? DEFAULT_TRANSPORT_RATE_PERCENT,
    ),
    transport: toInputValue(entry.transport),
    includeUtilityAllowance: entry.includeUtilityAllowance ?? true,
    utilityRate: toInputValue(
      entry.utilityRate ?? DEFAULT_UTILITY_RATE_PERCENT,
    ),
    utility: toInputValue(entry.utility),
    includeRentAllowance: entry.includeRentAllowance ?? true,
    rentRate: toInputValue(entry.rentRate ?? DEFAULT_RENT_RATE_PERCENT),
    rent: toInputValue(entry.rent),
    includeRiskAllowance: Boolean(entry.includeRiskAllowance),
    riskRate: toInputValue(entry.riskRate ?? DEFAULT_RISK_RATE_PERCENT),
    risk: toInputValue(entry.risk ?? 0),
    includeLeaveAllowance: Boolean(entry.includeLeaveAllowance),
    leaveAllowanceRate: toInputValue(
      entry.leaveAllowanceRate ?? DEFAULT_LEAVE_RATE_PERCENT,
    ),
    leaveAllowance: toInputValue(entry.leaveAllowance ?? 0),
    includeClothingAllowance: Boolean(entry.includeClothingAllowance),
    clothingRate: toInputValue(
      entry.clothingRate ?? DEFAULT_CLOTHING_RATE_PERCENT,
    ),
    clothingAllowance: toInputValue(entry.clothingAllowance ?? 0),
    otherEarnings: toInputValue(entry.otherEarnings),
    overtimeAddition: toInputValue(entry.overtimeAddition),
    latenessDeduction: toInputValue(entry.latenessDeduction),
    absenteeismDeduction: toInputValue(entry.absenteeismDeduction),
    welfare: toInputValue(entry.welfare),
    unionDues: toInputValue(entry.unionDues),
    support: toInputValue(entry.support),
    loanAmount: toInputValue(entry.loanAmount),
    totalPaid: toInputValue(entry.totalPaid),
  });
  const buildEntrySummaryText = (entry: PayslipEntry) => {
    const lines = [
      `GB Calculator Summary - ${entry.name}`,
      `Basic salary: ${formatMoney(entry.basic)}`,
      `Transport allowance (${formatPercent(entry.transportRate)} of basic): ${entry.includeTransportAllowance ? formatMoney(entry.transport) : "Off"}`,
      `Utility allowance (${formatPercent(entry.utilityRate)} of basic): ${entry.includeUtilityAllowance ? formatMoney(entry.utility) : "Off"}`,
      `Rent allowance (${formatPercent(entry.rentRate)} of basic): ${entry.includeRentAllowance ? formatMoney(entry.rent) : "Off"}`,
      `Risk allowance (${formatPercent(entry.riskRate)} of basic): ${entry.includeRiskAllowance ? formatMoney(entry.risk) : "Off"}`,
      `Leave allowance (${formatPercent(entry.leaveAllowanceRate)} of basic): ${formatMoney(entry.leaveAllowance)} (${entry.includeLeaveAllowance ? "enabled" : "disabled"})`,
      `Clothing allowance (${formatPercent(entry.clothingRate)} of basic): ${entry.includeClothingAllowance ? formatMoney(entry.clothingAllowance) : "Off"}`,
      `Other earnings: ${formatMoney(entry.otherEarnings)}`,
      `Overtime addition: ${formatMoney(entry.overtimeAddition)}`,
      `Provident earning 3.5%: ${formatMoney(entry.providentEarning35)}`,
      `Provident earning 6.5%: ${formatMoney(entry.providentEarning65)}`,
      `Gross earnings: ${formatMoney(entry.grossEarnings)}`,
      `Social security 5.5%: ${formatMoney(entry.socialSecurity)}`,
      `Provident deduction 16.5% (pre-tax): ${formatMoney(entry.providentDeduction165)}`,
      `Taxable income: ${formatMoney(entry.taxableIncome)}`,
      `PAYE: ${formatMoney(entry.paye)}`,
      `Provident deduction 3.5% (post-tax): ${formatMoney(entry.providentDeduction35)}`,
      `Welfare fund: ${formatMoney(entry.welfare)}`,
      `Union dues: ${formatMoney(entry.unionDues)}`,
      `Support: ${formatMoney(entry.support)}`,
      `Lateness deduction: ${formatMoney(entry.latenessDeduction)}`,
      `Absenteeism deduction: ${formatMoney(entry.absenteeismDeduction)}`,
      `Total deductions: ${formatMoney(entry.totalDeductions)}`,
      `Net salary: ${formatMoney(entry.netSalary)}`,
      `Loan amount: ${formatMoney(entry.loanAmount)}`,
      `Total paid: ${formatMoney(entry.totalPaid)}`,
      `Outstanding: ${formatMoney(entry.outstanding)}`,
    ];
    return lines.join("\n");
  };
  const clearEditor = () => {
    setForm(initialForm);
    setAllowanceOverrides(initialAllowanceOverrides);
    setEditingEntryId(null);
  };
  const handleSaveEmployee = () => {
    const name = form.name.trim();
    if (!name) {
      alert("Please enter an employee name.");
      return;
    }
    const entry: PayslipEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      basic: calculations.basic,
      includeTransportAllowance: calculations.includeTransportAllowance,
      transportRate: calculations.transportRate,
      transport: calculations.transport,
      includeUtilityAllowance: calculations.includeUtilityAllowance,
      utilityRate: calculations.utilityRate,
      utility: calculations.utility,
      includeRentAllowance: calculations.includeRentAllowance,
      rentRate: calculations.rentRate,
      rent: calculations.rent,
      includeRiskAllowance: calculations.includeRiskAllowance,
      riskRate: calculations.riskRate,
      risk: calculations.risk,
      includeLeaveAllowance: calculations.includeLeaveAllowance,
      leaveAllowanceRate: calculations.leaveAllowanceRate,
      leaveAllowance: calculations.leaveAllowance,
      includeClothingAllowance: calculations.includeClothingAllowance,
      clothingRate: calculations.clothingRate,
      clothingAllowance: calculations.clothingAllowance,
      overrideTransport: allowanceOverrides.transport,
      overrideUtility: allowanceOverrides.utility,
      overrideRent: allowanceOverrides.rent,
      overrideRisk: allowanceOverrides.risk,
      overrideLeaveAllowance: allowanceOverrides.leaveAllowance,
      overrideClothingAllowance: allowanceOverrides.clothingAllowance,
      otherEarnings: calculations.otherEarnings,
      overtimeAddition: calculations.overtimeAddition,
      providentEarning35: calculations.providentEarning35,
      providentEarning65: calculations.providentEarning65,
      grossEarnings: calculations.grossEarnings,
      socialSecurity: calculations.socialSecurity,
      providentDeduction35: calculations.providentDeduction35,
      providentDeduction165: calculations.providentDeduction165,
      taxableIncome: calculations.taxableIncome,
      paye: calculations.paye,
      welfare: calculations.welfare,
      unionDues: calculations.unionDues,
      support: calculations.support,
      latenessDeduction: calculations.latenessDeduction,
      absenteeismDeduction: calculations.absenteeismDeduction,
      totalDeductions: calculations.totalDeductions,
      netSalary: calculations.netSalary,
      loanAmount: calculations.loanAmount,
      totalPaid: calculations.totalPaid,
      outstanding: calculations.outstanding,
    };
    if (editingEntryId) {
      setEntries((prev) =>
        prev.map((current) =>
          current.id === editingEntryId
            ? { ...entry, id: current.id }
            : current,
        ),
      );
      clearEditor();
      return;
    }
    setEntries((prev) => [entry, ...prev]);
    clearEditor();
  };
  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (editingEntryId === id) clearEditor();
    if (viewingEntry?.id === id) setViewingEntry(null);
  };
  const handleEditEntry = (entry: PayslipEntry) => {
    setForm(toFormFromEntry(entry));
    setAllowanceOverrides({
      transport: Boolean(entry.overrideTransport),
      utility: Boolean(entry.overrideUtility),
      rent: Boolean(entry.overrideRent),
      risk: Boolean(entry.overrideRisk),
      leaveAllowance: Boolean(entry.overrideLeaveAllowance),
      clothingAllowance: Boolean(entry.overrideClothingAllowance),
    });
    setEditingEntryId(entry.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleViewEntry = (entry: PayslipEntry) => {
    setViewingEntry(entry);
  };
  const handleCopyEntry = async (entry: PayslipEntry) => {
    const text = buildEntrySummaryText(entry);
    try {
      await navigator.clipboard.writeText(text);
      alert(`Summary copied for ${entry.name}.`);
    } catch {
      prompt("Copy summary text:", text);
    }
  };
  const buildSummaryText = () => {
    const title = form.name.trim()
      ? `GB Calculator Summary - ${form.name.trim()}`
      : "GB Calculator Summary";
    const lines = [
      title,
      `Basic salary: ${formatMoney(calculations.basic)}`,
      `Transport allowance (${formatPercent(calculations.transportRate)} of basic): ${calculations.includeTransportAllowance ? formatMoney(calculations.transport) : "Off"}`,
      `Utility allowance (${formatPercent(calculations.utilityRate)} of basic): ${calculations.includeUtilityAllowance ? formatMoney(calculations.utility) : "Off"}`,
      `Rent allowance (${formatPercent(calculations.rentRate)} of basic): ${calculations.includeRentAllowance ? formatMoney(calculations.rent) : "Off"}`,
      `Risk allowance (${formatPercent(calculations.riskRate)} of basic): ${calculations.includeRiskAllowance ? formatMoney(calculations.risk) : "Off"}`,
      `Leave allowance (${formatPercent(calculations.leaveAllowanceRate)} of basic): ${formatMoney(calculations.leaveAllowance)} (${calculations.includeLeaveAllowance ? "enabled" : "disabled"})`,
      `Clothing allowance (${formatPercent(calculations.clothingRate)} of basic): ${calculations.includeClothingAllowance ? formatMoney(calculations.clothingAllowance) : "Off"}`,
      `Other earnings: ${formatMoney(calculations.otherEarnings)}`,
      `Overtime addition: ${formatMoney(calculations.overtimeAddition)}`,
      `Provident earning 3.5%: ${formatMoney(calculations.providentEarning35)}`,
      `Provident earning 6.5%: ${formatMoney(calculations.providentEarning65)}`,
      `Gross earnings: ${formatMoney(calculations.grossEarnings)}`,
      `Social security 5.5%: ${formatMoney(calculations.socialSecurity)}`,
      `Provident deduction 16.5% (pre-tax): ${formatMoney(calculations.providentDeduction165)}`,
      `Taxable income: ${formatMoney(calculations.taxableIncome)}`,
      `PAYE: ${formatMoney(calculations.paye)}`,
      `Provident deduction 3.5% (post-tax): ${formatMoney(calculations.providentDeduction35)}`,
      `Welfare fund: ${formatMoney(calculations.welfare)}`,
      `Union dues: ${formatMoney(calculations.unionDues)}`,
      `Support: ${formatMoney(calculations.support)}`,
      `Lateness deduction: ${formatMoney(calculations.latenessDeduction)}`,
      `Absenteeism deduction: ${formatMoney(calculations.absenteeismDeduction)}`,
      `Total deductions: ${formatMoney(calculations.totalDeductions)}`,
      `Net salary: ${formatMoney(calculations.netSalary)}`,
      `Loan amount: ${formatMoney(calculations.loanAmount)}`,
      `Total paid: ${formatMoney(calculations.totalPaid)}`,
      `Outstanding: ${formatMoney(calculations.outstanding)}`,
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
        existing.addEventListener(
          "load",
          () => resolve(w.html2canvas as Html2Canvas),
          { once: true },
        );
        existing.addEventListener(
          "error",
          () => reject(new Error("Failed to load html2canvas")),
          { once: true },
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
        backgroundColor: "#ffffff",
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Snapshot failed"))),
          "image/png",
        );
      });
      const canClipboardWrite =
        navigator.clipboard &&
        typeof navigator.clipboard.write === "function" &&
        "ClipboardItem" in window;
      if (canClipboardWrite) {
        await navigator.clipboard.write([
          new window.ClipboardItem({ "image/png": blob }),
        ]);
        alert("Summary snapshot copied to clipboard.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "gb-calculator-summary.png";
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
        title: "GB Calculator PAYE Report",
        filename: `gb-calculator-paye-report-${dateStamp}`,
        headers: ["Employee", "Gross Earnings", "Taxable Income", "PAYE"],
        rows: entries.map((entry) => [
          entry.name,
          roundMoney(entry.grossEarnings),
          roundMoney(entry.taxableIncome),
          roundMoney(entry.paye),
        ]),
        json: entries.map((entry) => ({
          employee: entry.name,
          gross_earnings: roundMoney(entry.grossEarnings),
          taxable_income: roundMoney(entry.taxableIncome),
          paye: roundMoney(entry.paye),
        })),
      };
    }
    if (type === "deductions") {
      return {
        title: "GB Calculator Deductions Report",
        filename: `gb-calculator-deductions-report-${dateStamp}`,
        headers: [
          "Employee",
          "Social Security (5.5%)",
          "Provident Ded. 3.5%",
          "Provident Ded. 16.5%",
          "Welfare",
          "Union Dues",
          "Support",
          "Lateness Deduction",
          "Absenteeism Deduction",
          "PAYE",
          "Total Deductions",
          "Net Salary",
        ],
        rows: entries.map((entry) => [
          entry.name,
          roundMoney(entry.socialSecurity),
          roundMoney(entry.providentDeduction35),
          roundMoney(entry.providentDeduction165),
          roundMoney(entry.welfare),
          roundMoney(entry.unionDues),
          roundMoney(entry.support),
          roundMoney(entry.latenessDeduction),
          roundMoney(entry.absenteeismDeduction),
          roundMoney(entry.paye),
          roundMoney(entry.totalDeductions),
          roundMoney(entry.netSalary),
        ]),
        json: entries.map((entry) => ({
          employee: entry.name,
          social_security: roundMoney(entry.socialSecurity),
          provident_deduction_35: roundMoney(entry.providentDeduction35),
          provident_deduction_165: roundMoney(entry.providentDeduction165),
          welfare: roundMoney(entry.welfare),
          union_dues: roundMoney(entry.unionDues),
          support: roundMoney(entry.support),
          lateness_deduction: roundMoney(entry.latenessDeduction),
          absenteeism_deduction: roundMoney(entry.absenteeismDeduction),
          paye: roundMoney(entry.paye),
          total_deductions: roundMoney(entry.totalDeductions),
          net_salary: roundMoney(entry.netSalary),
        })),
      };
    }
    if (type === "loan") {
      return {
        title: "GB Calculator Loan Tracking Report",
        filename: `gb-calculator-loan-report-${dateStamp}`,
        headers: ["Employee", "Loan Amount", "Total Paid", "Outstanding"],
        rows: entries.map((entry) => [
          entry.name,
          roundMoney(entry.loanAmount),
          roundMoney(entry.totalPaid),
          roundMoney(entry.outstanding),
        ]),
        json: entries.map((entry) => ({
          employee: entry.name,
          loan_amount: roundMoney(entry.loanAmount),
          total_paid: roundMoney(entry.totalPaid),
          outstanding: roundMoney(entry.outstanding),
        })),
      };
    }
    if (type === "slip") {
      return {
        title: "GB Calculator Simple Payslip",
        filename: `gb-calculator-simple-payslip-${dateStamp}`,
        headers: [
          "Employee",
          "Gross Earnings",
          "Taxable Income",
          "Total Deductions",
          "Net Salary",
          "Outstanding",
        ],
        rows: entries.map((entry) => [
          entry.name,
          roundMoney(entry.grossEarnings),
          roundMoney(entry.taxableIncome),
          roundMoney(entry.totalDeductions),
          roundMoney(entry.netSalary),
          roundMoney(entry.outstanding),
        ]),
        json: entries.map((entry) => ({
          employee: entry.name,
          gross_earnings: roundMoney(entry.grossEarnings),
          taxable_income: roundMoney(entry.taxableIncome),
          total_deductions: roundMoney(entry.totalDeductions),
          net_salary: roundMoney(entry.netSalary),
          outstanding: roundMoney(entry.outstanding),
        })),
      };
    }
    return {
      title: "GB Calculator Payroll Report",
      filename: `gb-calculator-payroll-report-${dateStamp}`,
      headers: [
        "Employee",
        "Basic",
        "Transport (% of Basic)",
        "Utility (% of Basic)",
        "Rent (% of Basic)",
        "Risk Allowance (% of Basic)",
        "Leave Allowance (% of Basic)",
        "Clothing Allowance (% of Basic)",
        "Other Earnings",
        "Overtime Addition",
        "Prov. Earn 3.5%",
        "Prov. Earn 6.5%",
        "Gross Earnings",
        "Taxable Income",
        "PAYE",
        "Lateness Deduction",
        "Absenteeism Deduction",
        "Total Deductions",
        "Net Salary",
        "Loan Amount",
        "Total Paid",
        "Outstanding",
      ],
      rows: entries.map((entry) => [
        entry.name,
        roundMoney(entry.basic),
        roundMoney(entry.transport),
        roundMoney(entry.utility),
        roundMoney(entry.rent),
        roundMoney(entry.risk),
        roundMoney(entry.leaveAllowance),
        roundMoney(entry.clothingAllowance),
        roundMoney(entry.otherEarnings),
        roundMoney(entry.overtimeAddition),
        roundMoney(entry.providentEarning35),
        roundMoney(entry.providentEarning65),
        roundMoney(entry.grossEarnings),
        roundMoney(entry.taxableIncome),
        roundMoney(entry.paye),
        roundMoney(entry.latenessDeduction),
        roundMoney(entry.absenteeismDeduction),
        roundMoney(entry.totalDeductions),
        roundMoney(entry.netSalary),
        roundMoney(entry.loanAmount),
        roundMoney(entry.totalPaid),
        roundMoney(entry.outstanding),
      ]),
      json: entries.map((entry) => ({
        employee: entry.name,
        basic_salary: roundMoney(entry.basic),
        transport_allowance: roundMoney(entry.transport),
        utility_allowance: roundMoney(entry.utility),
        rent_allowance: roundMoney(entry.rent),
        risk_allowance: roundMoney(entry.risk),
        leave_allowance: roundMoney(entry.leaveAllowance),
        clothing_allowance: roundMoney(entry.clothingAllowance),
        other_earnings: roundMoney(entry.otherEarnings),
        overtime_addition: roundMoney(entry.overtimeAddition),
        provident_earning_35: roundMoney(entry.providentEarning35),
        provident_earning_65: roundMoney(entry.providentEarning65),
        gross_earnings: roundMoney(entry.grossEarnings),
        taxable_income: roundMoney(entry.taxableIncome),
        paye: roundMoney(entry.paye),
        lateness_deduction: roundMoney(entry.latenessDeduction),
        absenteeism_deduction: roundMoney(entry.absenteeismDeduction),
        total_deductions: roundMoney(entry.totalDeductions),
        net_salary: roundMoney(entry.netSalary),
        loan_amount: roundMoney(entry.loanAmount),
        total_paid: roundMoney(entry.totalPaid),
        outstanding: roundMoney(entry.outstanding),
      })),
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
  const openPdfPrintPreview = (
    doc: { output: (type: "blob") => Blob; save: (filename: string) => void },
    filename: string,
  ) => {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!previewWindow) {
      doc.save(`${filename}.pdf`);
      URL.revokeObjectURL(url);
      return;
    }
    previewWindow.addEventListener(
      "load",
      () => {
        try {
          previewWindow.focus();
          previewWindow.print();
        } catch {
          doc.save(`${filename}.pdf`);
        } finally {
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
      },
      { once: true },
    );
  };
  const isPdfChunkLoadError = (error: unknown) => {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return (
      message.includes("chunkloaderror") ||
      message.includes("loading chunk") ||
      message.includes("failed to fetch dynamically imported module") ||
      message.includes("importing a module script failed")
    );
  };
  const loadPdfDependencies = async () => {
    const maxAttempts = 2;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const [{ jsPDF }, autoTableModule] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);
        return { jsPDF, autoTable: autoTableModule.default };
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }
    }
    throw lastError;
  };
  const sanitizeExportRows = (rows: Array<Array<string | number>>) =>
    rows.map((row) =>
      row.map((cell) =>
        typeof cell === "number" && isZeroAmount(cell) ? "" : cell,
      ),
    );
  const sanitizeJsonExport = (value: unknown): unknown => {
    if (Array.isArray(value))
      return value.map((item) => sanitizeJsonExport(item));
    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
        const sanitized = sanitizeJsonExport(val);
        if (typeof sanitized === "number" && isZeroAmount(sanitized)) return;
        result[key] = sanitized;
      });
      return result;
    }
    return value;
  };
  const exportCsv = (
    headers: string[],
    rows: Array<Array<string | number>>,
  ) => {
    const escape = (value: string | number) => {
      const str = String(value ?? "");
      return `"${str.replace(/\"/g, '""')}"`;
    };
    const lines = [headers.map(escape).join(",")];
    rows.forEach((row) => {
      lines.push(row.map(escape).join(","));
    });
    return lines.join("\n");
  };
  const exportPdf = async (
    title: string,
    headers: string[],
    rows: Array<Array<string | number>>,
    filename: string,
  ) => {
    let pdfDeps: Awaited<ReturnType<typeof loadPdfDependencies>>;
    try {
      pdfDeps = await loadPdfDependencies();
    } catch (error) {
      console.error(error);
      if (isPdfChunkLoadError(error)) {
        alert(
          "PDF module load timed out. Refresh the page and try Print Preview again.",
        );
      } else {
        alert("Unable to load PDF module. Please try again.");
      }
      return;
    }
    const { jsPDF, autoTable } = pdfDeps;
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
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
        row.map((cell) =>
          typeof cell === "number" ? formatMoney(cell) : String(cell),
        ),
      ),
      styles: { fontSize: 8, cellPadding: 6 },
      headStyles: { fillColor: [31, 107, 114], textColor: 255 },
    });
    openPdfPrintPreview(doc, filename);
  };
  const exportStyledPayslipPdf = async (
    filename: string,
    sourceEntries: PayslipEntry[] = entries,
    includeAllStaffSummary = false,
  ) => {
    if (!sourceEntries.length) {
      alert("Add at least one employee to generate a payslip PDF.");
      return;
    }
    let pdfDeps: Awaited<ReturnType<typeof loadPdfDependencies>>;
    try {
      pdfDeps = await loadPdfDependencies();
    } catch (error) {
      console.error(error);
      if (isPdfChunkLoadError(error)) {
        alert(
          "PDF module load timed out. Refresh the page and try Print Preview again.",
        );
      } else {
        alert("Unable to load PDF module. Please try again.");
      }
      return;
    }
    const { jsPDF, autoTable } = pdfDeps;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const margin = 34;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageInnerWidth = pageWidth - margin * 2;
    sourceEntries.forEach((entry, index) => {
      if (index > 0) doc.addPage();
      const generatedAt = new Date().toLocaleString();
      const periodStamp = new Date()
        .toLocaleDateString("en-GH", { year: "numeric", month: "long" })
        .toUpperCase();
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("GB CALCULATOR PAYSLIP", margin, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`EMPLOYEE: ${entry.name.toUpperCase()}`, margin, 60);
      doc.text(`PERIOD: ${periodStamp}`, margin, 74);
      doc.text(`GENERATED: ${generatedAt}`, pageWidth - margin, 74, {
        align: "right",
      });
      doc.setDrawColor(90, 90, 90);
      doc.setLineWidth(0.7);
      doc.line(margin, 84, pageWidth - margin, 84);
      const earningsRows: Array<[string, number]> = [
        ["BASIC SALARY", entry.basic],
      ];
      if (entry.includeTransportAllowance) {
        earningsRows.push([
          `TRANSPORT ALLOWANCE (${formatPercent(entry.transportRate)})`,
          entry.transport,
        ]);
      }
      if (entry.includeUtilityAllowance) {
        earningsRows.push([
          `UTILITY ALLOWANCE (${formatPercent(entry.utilityRate)})`,
          entry.utility,
        ]);
      }
      if (entry.includeRentAllowance) {
        earningsRows.push([
          `RENT ALLOWANCE (${formatPercent(entry.rentRate)})`,
          entry.rent,
        ]);
      }
      if (entry.includeRiskAllowance) {
        earningsRows.push([
          `RISK ALLOWANCE (${formatPercent(entry.riskRate)})`,
          entry.risk,
        ]);
      }
      if (entry.includeLeaveAllowance) {
        earningsRows.push([
          `LEAVE ALLOWANCE (${formatPercent(entry.leaveAllowanceRate)})`,
          entry.leaveAllowance,
        ]);
      }
      if (entry.includeClothingAllowance) {
        earningsRows.push([
          `CLOTHING ALLOWANCE (${formatPercent(entry.clothingRate)})`,
          entry.clothingAllowance,
        ]);
      }
      earningsRows.push(
        ["OTHER EARNINGS", entry.otherEarnings],
        ["OVERTIME ADDITION", entry.overtimeAddition],
        ["PROVIDENT EARNING (3.5%)", entry.providentEarning35],
        ["PROVIDENT EARNING (6.5%)", entry.providentEarning65],
      );
      const filteredEarningsRows: Array<[string, number]> = earningsRows.filter(
        (row): row is [string, number] => !isZeroAmount(row[1]),
      );
      const deductionRows: Array<[string, number]> = [
        ["SOCIAL SECURITY (5.5%)", entry.socialSecurity],
        ["PAYE", entry.paye],
        ["WELFARE FUND", entry.welfare],
        ["UNION DUES", entry.unionDues],
        ["PMSU/GMWU SUPPORT", entry.support],
        ["LATENESS DEDUCTION", entry.latenessDeduction],
        ["ABSENTEEISM DEDUCTION", entry.absenteeismDeduction],
        ["PROVIDENT DEDUCTION (3.5%)", entry.providentDeduction35],
        ["PROVIDENT DEDUCTION (16.5%)", entry.providentDeduction165],
      ];
      const filteredDeductionRows: Array<[string, number]> =
        deductionRows.filter(
          (row): row is [string, number] => !isZeroAmount(row[1]),
        );
      const standardRowCount = Math.max(
        filteredEarningsRows.length,
        filteredDeductionRows.length,
      );
      const combinedBody: Array<[string, string, string, string]> = Array.from(
        { length: standardRowCount },
        (_, rowIndex) => {
          const earning = filteredEarningsRows[rowIndex];
          const deduction = filteredDeductionRows[rowIndex];
          return [
            earning?.[0] ?? "",
            earning ? formatPdfMoney(earning[1]) : "",
            deduction?.[0] ?? "",
            deduction ? formatPdfMoney(deduction[1]) : "",
          ];
        },
      );
      combinedBody.push([
        "GROSS EARNINGS",
        formatPdfMoney(entry.grossEarnings),
        "TOTAL DEDUCTIONS",
        formatPdfMoney(entry.totalDeductions),
      ]);
      combinedBody.push([
        "TAXABLE INCOME",
        formatPdfMoney(entry.taxableIncome),
        "NET SALARY",
        formatPdfMoney(entry.netSalary),
      ]);
      const grossSummaryRowIndex = standardRowCount;
      const taxableSummaryRowIndex = standardRowCount + 1;
      autoTable(doc, {
        startY: 98,
        margin: { left: margin, right: margin },
        tableWidth: pageInnerWidth,
        head: [["EARNINGS", "AMOUNT", "DEDUCTIONS", "AMOUNT"]],
        body: combinedBody,
        styles: {
          font: "helvetica",
          fontSize: 9.5,
          cellPadding: 5.5,
          valign: "middle",
          textColor: [28, 31, 36],
          lineColor: [201, 208, 217],
          lineWidth: 0.35,
        },
        headStyles: {
          fillColor: [246, 248, 251],
          textColor: [24, 28, 36],
          fontStyle: "bold",
          lineColor: [171, 180, 193],
          lineWidth: 0.5,
        },
        bodyStyles: { fillColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [251, 253, 255] },
        columnStyles: {
          0: { cellWidth: pageInnerWidth * 0.33, halign: "left" },
          1: { cellWidth: pageInnerWidth * 0.17, halign: "right" },
          2: { cellWidth: pageInnerWidth * 0.33, halign: "left" },
          3: { cellWidth: pageInnerWidth * 0.17, halign: "right" },
        },
        didParseCell: (data) => {
          if (data.section !== "body") return;
          const isSummaryRow =
            data.row.index === grossSummaryRowIndex ||
            data.row.index === taxableSummaryRowIndex;
          if (isSummaryRow) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [248, 250, 253];
            data.cell.styles.lineColor = [163, 173, 188];
            data.cell.styles.lineWidth = 0.5;
          }
          const isNetSalaryCell =
            data.row.index === taxableSummaryRowIndex &&
            (data.column.index === 2 || data.column.index === 3);
          if (isNetSalaryCell) {
            data.cell.styles.textColor = [20, 120, 76];
          }
        },
      });
    });
    if (includeAllStaffSummary) {
      doc.addPage();
      const generatedAt = new Date().toLocaleString();
      const totals = sourceEntries.reduce(
        (acc, entry) => ({
          grossEarnings: acc.grossEarnings + entry.grossEarnings,
          taxableIncome: acc.taxableIncome + entry.taxableIncome,
          paye: acc.paye + entry.paye,
          totalDeductions: acc.totalDeductions + entry.totalDeductions,
          netSalary: acc.netSalary + entry.netSalary,
          outstanding: acc.outstanding + entry.outstanding,
        }),
        {
          grossEarnings: 0,
          taxableIncome: 0,
          paye: 0,
          totalDeductions: 0,
          netSalary: 0,
          outstanding: 0,
        },
      );
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("ALL STAFF SUMMARY", margin, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`GENERATED: ${generatedAt}`, pageWidth - margin, 42, {
        align: "right",
      });
      doc.setDrawColor(90, 90, 90);
      doc.setLineWidth(0.7);
      doc.line(margin, 52, pageWidth - margin, 52);
      autoTable(doc, {
        startY: 66,
        margin: { left: margin, right: margin },
        tableWidth: pageInnerWidth,
        head: [
          [
            "EMPLOYEE",
            "GROSS",
            "TAXABLE",
            "PAYE",
            "DEDUCTIONS",
            "NET",
            "OUTSTANDING",
          ],
        ],
        body: sourceEntries.map((entry) => [
          entry.name,
          isZeroAmount(entry.grossEarnings)
            ? ""
            : formatPdfMoney(entry.grossEarnings),
          isZeroAmount(entry.taxableIncome)
            ? ""
            : formatPdfMoney(entry.taxableIncome),
          isZeroAmount(entry.paye) ? "" : formatPdfMoney(entry.paye),
          isZeroAmount(entry.totalDeductions)
            ? ""
            : formatPdfMoney(entry.totalDeductions),
          isZeroAmount(entry.netSalary) ? "" : formatPdfMoney(entry.netSalary),
          isZeroAmount(entry.outstanding)
            ? ""
            : formatPdfMoney(entry.outstanding),
        ]),
        foot: [
          [
            "TOTALS",
            isZeroAmount(totals.grossEarnings)
              ? ""
              : formatPdfMoney(totals.grossEarnings),
            isZeroAmount(totals.taxableIncome)
              ? ""
              : formatPdfMoney(totals.taxableIncome),
            isZeroAmount(totals.paye) ? "" : formatPdfMoney(totals.paye),
            isZeroAmount(totals.totalDeductions)
              ? ""
              : formatPdfMoney(totals.totalDeductions),
            isZeroAmount(totals.netSalary)
              ? ""
              : formatPdfMoney(totals.netSalary),
            isZeroAmount(totals.outstanding)
              ? ""
              : formatPdfMoney(totals.outstanding),
          ],
        ],
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 5,
          textColor: [25, 25, 25],
          lineColor: [170, 170, 170],
          lineWidth: 0.35,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [20, 20, 20],
          fontStyle: "bold",
          lineColor: [90, 90, 90],
          lineWidth: 0.5,
        },
        bodyStyles: { fillColor: [255, 255, 255] },
        footStyles: {
          fillColor: [255, 255, 255],
          textColor: [20, 20, 20],
          fontStyle: "bold",
          lineColor: [90, 90, 90],
          lineWidth: 0.5,
        },
        columnStyles: {
          0: { halign: "left", cellWidth: pageInnerWidth * 0.28 },
          1: { halign: "right", cellWidth: pageInnerWidth * 0.12 },
          2: { halign: "right", cellWidth: pageInnerWidth * 0.12 },
          3: { halign: "right", cellWidth: pageInnerWidth * 0.11 },
          4: { halign: "right", cellWidth: pageInnerWidth * 0.13 },
          5: { halign: "right", cellWidth: pageInnerWidth * 0.12 },
          6: { halign: "right", cellWidth: pageInnerWidth * 0.12 },
        },
      });
    }
    openPdfPrintPreview(doc, filename);
  };
  const handleDownloadEntrySlip = async (entry: PayslipEntry) => {
    const safeName = entry.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStamp = `${y}${m}${d}`;
    const filename = `gb-calculator-slip-${safeName || "employee"}-${dateStamp}`;
    await exportStyledPayslipPdf(filename, [entry], false);
  };
  const handleExport = async () => {
    if (!entries.length) {
      alert("Add at least one employee to generate a report.");
      return;
    }
    const report = buildReport(reportType);
    const sanitizedRows = sanitizeExportRows(report.rows);
    if (reportFormat === "json") {
      const sanitizedJson = sanitizeJsonExport(report.json);
      downloadFile(
        JSON.stringify(sanitizedJson, null, 2),
        `${report.filename}.json`,
        "application/json",
      );
      return;
    }
    if (reportFormat === "csv") {
      const csv = exportCsv(report.headers, sanitizedRows);
      downloadFile(csv, `${report.filename}.csv`, "text/csv");
      return;
    }
    if (reportType === "slip") {
      await exportStyledPayslipPdf(report.filename, entries, true);
      return;
    }
    await exportPdf(
      report.title,
      report.headers,
      sanitizedRows,
      report.filename,
    );
  };
  const previewReport = buildReport(reportType);
  return (
    <main className="min-h-screen px-6 py-12 md:px-10">
      {" "}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        {" "}
        <header className="flex flex-col gap-3">
          {" "}
          <Link
            href="/"
            className="text-sm font-semibold text-[color:var(--accent)]"
          >
            {" "}
            {"<-"} Back to Utilities{" "}
          </Link>{" "}
          <h1 className="text-3xl font-semibold text-[color:var(--text-primary)] md:text-4xl">
            {" "}
            GB Calculator{" "}
          </h1>{" "}
          <p className="max-w-4xl text-sm text-[color:var(--text-secondary)] md:text-base">
            {" "}
            Payroll aligned to your slip: provident earning lines (3.5% and
            6.5%) are included in gross earnings, taxable income is calculated
            as gross minus Social Security (5.5%) and Provident Deduction
            (16.5%), then PAYE is applied.{" "}
          </p>{" "}
        </header>{" "}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {" "}
          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6 ">
            {" "}
            <div className="flex items-center justify-between gap-4">
              {" "}
              <div>
                {" "}
                <p className="text-xs font-semibold tracking-[0.08em] text-[color:var(--accent)]">
                  {" "}
                  Inputs{" "}
                </p>{" "}
                <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                  Employee Payroll Details
                </h2>{" "}
                {editingEntryId ? (
                  <p className="mt-1 text-xs font-semibold tracking-[0.06em] text-[color:var(--accent-strong)]">
                    {" "}
                    Edit mode{" "}
                  </p>
                ) : null}{" "}
              </div>{" "}
              <div className="flex items-center gap-2">
                {" "}
                <button
                  type="button"
                  onClick={handleSaveEmployee}
                  className="inline-flex items-center justify-center rounded-md border border-[color:var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-strong)]"
                >
                  {" "}
                  {editingEntryId ? "Save Changes" : "Add Employee"}{" "}
                </button>{" "}
                <button
                  type="button"
                  onClick={clearEditor}
                  className="inline-flex items-center justify-center rounded-md border border-[color:var(--border-default)] px-4 py-2 text-sm font-semibold text-[color:var(--text-secondary)]"
                >
                  {" "}
                  Reset Calculations{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
            <p className="mt-4 text-xs text-[color:var(--text-secondary)]">
              {" "}
              Values auto-calculate as you type. Comma-formatted amounts like
              `22,000` are supported.{" "}
            </p>{" "}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {" "}
              <div className="md:col-span-2">
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  Employee Name
                </label>{" "}
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Ama Owusu"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  Basic Salary (GHS)
                </label>{" "}
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.basic}
                  onChange={(e) => updateField("basic", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  {" "}
                  Transport Allowance (% of Basic){" "}
                </label>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={form.includeTransportAllowance}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateField("includeTransportAllowance", checked);
                      if (!checked) updateAllowanceOverride("transport", false);
                    }}
                  />{" "}
                  Include transport{" "}
                </label>{" "}
                <div className="mt-2 grid grid-cols-[1fr_1fr] gap-2">
                  {" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.transportRate}
                    onChange={(e) =>
                      updateField("transportRate", e.target.value)
                    }
                    placeholder="25"
                    disabled={!form.includeTransportAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      allowanceOverrides.transport
                        ? form.transport
                        : toInputValue(calculations.transport)
                    }
                    onChange={(e) =>
                      updateAllowanceAmount(
                        "transport",
                        "transport",
                        e.target.value,
                      )
                    }
                    placeholder="0.00"
                    readOnly={!allowanceOverrides.transport}
                    disabled={!form.includeTransportAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                </div>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={allowanceOverrides.transport}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked)
                        updateField(
                          "transport",
                          toInputValue(calculations.transport),
                        );
                      updateAllowanceOverride("transport", checked);
                    }}
                    disabled={!form.includeTransportAllowance}
                  />{" "}
                  Override amount{" "}
                </label>{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  {" "}
                  Utility Allowance (% of Basic){" "}
                </label>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={form.includeUtilityAllowance}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateField("includeUtilityAllowance", checked);
                      if (!checked) updateAllowanceOverride("utility", false);
                    }}
                  />{" "}
                  Include utility{" "}
                </label>{" "}
                <div className="mt-2 grid grid-cols-[1fr_1fr] gap-2">
                  {" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.utilityRate}
                    onChange={(e) => updateField("utilityRate", e.target.value)}
                    placeholder="15"
                    disabled={!form.includeUtilityAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      allowanceOverrides.utility
                        ? form.utility
                        : toInputValue(calculations.utility)
                    }
                    onChange={(e) =>
                      updateAllowanceAmount(
                        "utility",
                        "utility",
                        e.target.value,
                      )
                    }
                    placeholder="0.00"
                    readOnly={!allowanceOverrides.utility}
                    disabled={!form.includeUtilityAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                </div>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={allowanceOverrides.utility}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked)
                        updateField(
                          "utility",
                          toInputValue(calculations.utility),
                        );
                      updateAllowanceOverride("utility", checked);
                    }}
                    disabled={!form.includeUtilityAllowance}
                  />{" "}
                  Override amount{" "}
                </label>{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  {" "}
                  Rent Allowance (% of Basic){" "}
                </label>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={form.includeRentAllowance}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateField("includeRentAllowance", checked);
                      if (!checked) updateAllowanceOverride("rent", false);
                    }}
                  />{" "}
                  Include rent{" "}
                </label>{" "}
                <div className="mt-2 grid grid-cols-[1fr_1fr] gap-2">
                  {" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.rentRate}
                    onChange={(e) => updateField("rentRate", e.target.value)}
                    placeholder="20"
                    disabled={!form.includeRentAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      allowanceOverrides.rent
                        ? form.rent
                        : toInputValue(calculations.rent)
                    }
                    onChange={(e) =>
                      updateAllowanceAmount("rent", "rent", e.target.value)
                    }
                    placeholder="0.00"
                    readOnly={!allowanceOverrides.rent}
                    disabled={!form.includeRentAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                </div>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={allowanceOverrides.rent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked)
                        updateField("rent", toInputValue(calculations.rent));
                      updateAllowanceOverride("rent", checked);
                    }}
                    disabled={!form.includeRentAllowance}
                  />{" "}
                  Override amount{" "}
                </label>{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  {" "}
                  Risk Allowance (% of Basic){" "}
                </label>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={form.includeRiskAllowance}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateField("includeRiskAllowance", checked);
                      if (!checked) updateAllowanceOverride("risk", false);
                    }}
                  />{" "}
                  Include risk{" "}
                </label>{" "}
                <div className="mt-2 grid grid-cols-[1fr_1fr] gap-2">
                  {" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.riskRate}
                    onChange={(e) => updateField("riskRate", e.target.value)}
                    placeholder="10"
                    disabled={!form.includeRiskAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      allowanceOverrides.risk
                        ? form.risk
                        : toInputValue(calculations.risk)
                    }
                    onChange={(e) =>
                      updateAllowanceAmount("risk", "risk", e.target.value)
                    }
                    placeholder="0.00"
                    readOnly={!allowanceOverrides.risk}
                    disabled={!form.includeRiskAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                </div>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={allowanceOverrides.risk}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked)
                        updateField("risk", toInputValue(calculations.risk));
                      updateAllowanceOverride("risk", checked);
                    }}
                    disabled={!form.includeRiskAllowance}
                  />{" "}
                  Override amount{" "}
                </label>{" "}
              </div>{" "}
              <div className="md:col-span-2 rounded-xl border border-[color:var(--border-subtle)] p-3">
                {" "}
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-tertiary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={form.includeLeaveAllowance}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateField("includeLeaveAllowance", checked);
                      if (!checked)
                        updateAllowanceOverride("leaveAllowance", false);
                    }}
                  />{" "}
                  Include Leave Allowance{" "}
                </label>{" "}
                <div className="mt-3 grid grid-cols-[1fr_1fr] gap-2">
                  {" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.leaveAllowanceRate}
                    onChange={(e) =>
                      updateField("leaveAllowanceRate", e.target.value)
                    }
                    placeholder="100"
                    disabled={!form.includeLeaveAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      allowanceOverrides.leaveAllowance
                        ? form.leaveAllowance
                        : toInputValue(calculations.leaveAllowance)
                    }
                    onChange={(e) =>
                      updateAllowanceAmount(
                        "leaveAllowance",
                        "leaveAllowance",
                        e.target.value,
                      )
                    }
                    placeholder="0.00"
                    readOnly={!allowanceOverrides.leaveAllowance}
                    disabled={!form.includeLeaveAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                </div>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={allowanceOverrides.leaveAllowance}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked)
                        updateField(
                          "leaveAllowance",
                          toInputValue(calculations.leaveAllowance),
                        );
                      updateAllowanceOverride("leaveAllowance", checked);
                    }}
                    disabled={!form.includeLeaveAllowance}
                  />{" "}
                  Override leave amount{" "}
                </label>{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  {" "}
                  Clothing Allowance (% of Basic){" "}
                </label>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={form.includeClothingAllowance}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateField("includeClothingAllowance", checked);
                      if (!checked)
                        updateAllowanceOverride("clothingAllowance", false);
                    }}
                  />{" "}
                  Include clothing{" "}
                </label>{" "}
                <div className="mt-2 grid grid-cols-[1fr_1fr] gap-2">
                  {" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.clothingRate}
                    onChange={(e) =>
                      updateField("clothingRate", e.target.value)
                    }
                    placeholder="0"
                    disabled={!form.includeClothingAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      allowanceOverrides.clothingAllowance
                        ? form.clothingAllowance
                        : toInputValue(calculations.clothingAllowance)
                    }
                    onChange={(e) =>
                      updateAllowanceAmount(
                        "clothingAllowance",
                        "clothingAllowance",
                        e.target.value,
                      )
                    }
                    placeholder="0.00"
                    readOnly={!allowanceOverrides.clothingAllowance}
                    disabled={!form.includeClothingAllowance}
                    className="w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none disabled:opacity-60"
                  />{" "}
                </div>{" "}
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                  {" "}
                  <input
                    type="checkbox"
                    checked={allowanceOverrides.clothingAllowance}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        updateField(
                          "clothingAllowance",
                          toInputValue(calculations.clothingAllowance),
                        );
                      }
                      updateAllowanceOverride("clothingAllowance", checked);
                    }}
                    disabled={!form.includeClothingAllowance}
                  />{" "}
                  Override amount{" "}
                </label>{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  Other Earnings
                </label>{" "}
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.otherEarnings}
                  onChange={(e) => updateField("otherEarnings", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  Overtime Addition
                </label>{" "}
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.overtimeAddition}
                  onChange={(e) =>
                    updateField("overtimeAddition", e.target.value)
                  }
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  Welfare Fund
                </label>{" "}
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.welfare}
                  onChange={(e) => updateField("welfare", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  Union Dues
                </label>{" "}
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.unionDues}
                  onChange={(e) => updateField("unionDues", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  PMSU/GMWU Support
                </label>{" "}
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.support}
                  onChange={(e) => updateField("support", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  Lateness Deduction
                </label>{" "}
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.latenessDeduction}
                  onChange={(e) =>
                    updateField("latenessDeduction", e.target.value)
                  }
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  {" "}
                  Absenteeism Deduction{" "}
                </label>{" "}
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.absenteeismDeduction}
                  onChange={(e) =>
                    updateField("absenteeismDeduction", e.target.value)
                  }
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  Loan Amount
                </label>{" "}
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.loanAmount}
                  onChange={(e) => updateField("loanAmount", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                  Total Paid (Loan)
                </label>{" "}
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.totalPaid}
                  onChange={(e) => updateField("totalPaid", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
                />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div
            ref={summaryRef}
            className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6 "
          >
            {" "}
            <div className="flex flex-wrap items-start justify-between gap-4">
              {" "}
              <div className="flex flex-col gap-2">
                {" "}
                <p className="text-xs font-semibold tracking-[0.08em] text-[color:var(--accent)]">
                  Summary
                </p>{" "}
                <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                  Auto-calculated
                </h2>{" "}
                <p className="text-sm text-[color:var(--text-secondary)]">
                  {" "}
                  Taxable = Gross - Social Security (5.5%) - Provident Deduction
                  (16.5%).{" "}
                </p>{" "}
              </div>{" "}
              <div className="flex flex-wrap gap-2">
                {" "}
                <button
                  type="button"
                  onClick={handleCopySummaryText}
                  className="rounded-md border border-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]"
                >
                  {" "}
                  Copy text{" "}
                </button>{" "}
                <button
                  type="button"
                  onClick={handleCopySummarySnapshot}
                  className="rounded-md border border-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]"
                >
                  {" "}
                  Copy snapshot{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-6 grid gap-3 text-sm">
              {" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  {" "}
                  Transport ({formatPercent(calculations.transportRate)}){" "}
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {" "}
                  {calculations.includeTransportAllowance
                    ? formatMoney(calculations.transport)
                    : "Off"}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  {" "}
                  Utility ({formatPercent(calculations.utilityRate)}){" "}
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {" "}
                  {calculations.includeUtilityAllowance
                    ? formatMoney(calculations.utility)
                    : "Off"}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  {" "}
                  Rent ({formatPercent(calculations.rentRate)}){" "}
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {" "}
                  {calculations.includeRentAllowance
                    ? formatMoney(calculations.rent)
                    : "Off"}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  {" "}
                  Risk ({formatPercent(calculations.riskRate)}){" "}
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {" "}
                  {calculations.includeRiskAllowance
                    ? formatMoney(calculations.risk)
                    : "Off"}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  {" "}
                  Leave ({formatPercent(calculations.leaveAllowanceRate)}){" "}
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {" "}
                  {calculations.includeLeaveAllowance
                    ? formatMoney(calculations.leaveAllowance)
                    : "Off"}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  {" "}
                  Clothing ({formatPercent(calculations.clothingRate)}){" "}
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {" "}
                  {calculations.includeClothingAllowance
                    ? formatMoney(calculations.clothingAllowance)
                    : "Off"}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  Prov. earning 3.5%
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatMoney(calculations.providentEarning35)}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  Prov. earning 6.5%
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatMoney(calculations.providentEarning65)}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  Overtime addition
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {" "}
                  {formatMoney(calculations.overtimeAddition)}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  Gross earnings
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatMoney(calculations.grossEarnings)}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  Social Security (5.5%)
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatMoney(calculations.socialSecurity)}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  Provident Deduction (16.5%)
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatMoney(calculations.providentDeduction165)}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  Taxable income
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatMoney(calculations.taxableIncome)}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  PAYE
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatMoney(calculations.paye)}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  Lateness deduction
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {" "}
                  {formatMoney(calculations.latenessDeduction)}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  Absenteeism deduction
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {" "}
                  {formatMoney(calculations.absenteeismDeduction)}{" "}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between">
                {" "}
                <span className="text-[color:var(--text-secondary)]">
                  Total deductions
                </span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatMoney(calculations.totalDeductions)}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between text-base">
                {" "}
                <span className="font-semibold text-[color:var(--accent-strong)]">
                  Net salary
                </span>{" "}
                <span className="text-lg font-semibold text-[color:var(--accent-strong)]">
                  {formatMoney(calculations.netSalary)}
                </span>{" "}
              </div>{" "}
              <div className="flex items-center justify-between text-xs text-[color:var(--text-secondary)]">
                {" "}
                <span>Outstanding loan</span>{" "}
                <span className="font-semibold text-[color:var(--text-primary)]">
                  {formatMoney(calculations.outstanding)}
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6 ">
          {" "}
          <div className="flex items-center justify-between gap-4">
            {" "}
            <div>
              {" "}
              <p className="text-xs font-semibold tracking-[0.08em] text-[color:var(--accent)]">
                Employees
              </p>{" "}
              <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                GB Payroll Table
              </h2>{" "}
            </div>{" "}
            <p className="text-sm text-[color:var(--text-secondary)]">
              {" "}
              {entries.length} record{entries.length === 1 ? "" : "s"}{" "}
            </p>{" "}
          </div>{" "}
          <div className="mt-5 overflow-x-auto">
            {" "}
            <table className="min-w-[2300px] w-full border-collapse text-sm">
              {" "}
              <thead>
                {" "}
                <tr className="border-b border-[color:var(--border-default)] text-left text-xs tracking-[0.08em] text-[color:var(--text-secondary)]">
                  {" "}
                  <th className="py-3 pr-4">Employee</th>{" "}
                  <th className="py-3 pr-4">Basic</th>{" "}
                  <th className="py-3 pr-4">Transport (%)</th>{" "}
                  <th className="py-3 pr-4">Utility (%)</th>{" "}
                  <th className="py-3 pr-4">Rent (%)</th>{" "}
                  <th className="py-3 pr-4">Risk (%)</th>{" "}
                  <th className="py-3 pr-4">Leave (%)</th>{" "}
                  <th className="py-3 pr-4">Clothing (%)</th>{" "}
                  <th className="py-3 pr-4">Other Earnings</th>{" "}
                  <th className="py-3 pr-4">Overtime Add</th>{" "}
                  <th className="py-3 pr-4">Prov. Earn 3.5%</th>{" "}
                  <th className="py-3 pr-4">Prov. Earn 6.5%</th>{" "}
                  <th className="py-3 pr-4">Gross Earnings</th>{" "}
                  <th className="py-3 pr-4">Social Security</th>{" "}
                  <th className="py-3 pr-4">Prov. Ded 3.5%</th>{" "}
                  <th className="py-3 pr-4">Prov. Ded 16.5%</th>{" "}
                  <th className="py-3 pr-4">Taxable Income</th>{" "}
                  <th className="py-3 pr-4">PAYE</th>{" "}
                  <th className="py-3 pr-4">Welfare</th>{" "}
                  <th className="py-3 pr-4">Union Dues</th>{" "}
                  <th className="py-3 pr-4">Support</th>{" "}
                  <th className="py-3 pr-4">Lateness Ded.</th>{" "}
                  <th className="py-3 pr-4">Absenteeism Ded.</th>{" "}
                  <th className="py-3 pr-4">Total Deductions</th>{" "}
                  <th className="py-3 pr-4">Net Salary</th>{" "}
                  <th className="py-3 pr-4">Loan Amount</th>{" "}
                  <th className="py-3 pr-4">Total Paid</th>{" "}
                  <th className="py-3 pr-4">Outstanding</th>{" "}
                  <th className="py-3 text-right">Action</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {entries.length === 0 ? (
                  <tr>
                    {" "}
                    <td
                      colSpan={29}
                      className="py-6 text-center text-sm text-[color:var(--text-secondary)]"
                    >
                      {" "}
                      No employees added yet.{" "}
                    </td>{" "}
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-[color:var(--border-subtle)]"
                    >
                      {" "}
                      <td className="py-3 pr-4 font-semibold text-[color:var(--text-primary)]">
                        {entry.name}
                      </td>{" "}
                      <td className="py-3 pr-4">{formatMoney(entry.basic)}</td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.transport)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.utility)}
                      </td>{" "}
                      <td className="py-3 pr-4">{formatMoney(entry.rent)}</td>{" "}
                      <td className="py-3 pr-4">{formatMoney(entry.risk)}</td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.leaveAllowance)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.clothingAllowance)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.otherEarnings)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.overtimeAddition)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.providentEarning35)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.providentEarning65)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.grossEarnings)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.socialSecurity)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.providentDeduction35)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.providentDeduction165)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.taxableIncome)}
                      </td>{" "}
                      <td className="py-3 pr-4">{formatMoney(entry.paye)}</td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.welfare)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.unionDues)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.support)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.latenessDeduction)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.absenteeismDeduction)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.totalDeductions)}
                      </td>{" "}
                      <td className="py-3 pr-4 font-semibold text-[color:var(--accent-strong)]">
                        {formatMoney(entry.netSalary)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.loanAmount)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.totalPaid)}
                      </td>{" "}
                      <td className="py-3 pr-4">
                        {formatMoney(entry.outstanding)}
                      </td>{" "}
                      <td className="py-3 text-right">
                        {" "}
                        <div className="flex justify-end gap-2">
                          {" "}
                          <button
                            type="button"
                            onClick={() => handleViewEntry(entry)}
                            className="rounded-md border border-[color:var(--border-default)] px-3 py-1 text-xs font-semibold text-[color:var(--text-secondary)]"
                          >
                            {" "}
                            View{" "}
                          </button>{" "}
                          <button
                            type="button"
                            onClick={() => handleEditEntry(entry)}
                            className="rounded-md border border-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]"
                          >
                            {" "}
                            Edit{" "}
                          </button>{" "}
                          <button
                            type="button"
                            onClick={() => void handleCopyEntry(entry)}
                            className="rounded-md border border-[color:var(--border-default)] px-3 py-1 text-xs font-semibold text-[color:var(--text-secondary)]"
                          >
                            {" "}
                            Copy{" "}
                          </button>{" "}
                          <button
                            type="button"
                            onClick={() => void handleDownloadEntrySlip(entry)}
                            className="rounded-md border border-[color:var(--border-default)] px-3 py-1 text-xs font-semibold text-[color:var(--text-secondary)]"
                          >
                            {" "}
                            Print{" "}
                          </button>{" "}
                          <button
                            type="button"
                            onClick={() => handleRemoveEntry(entry.id)}
                            className="rounded-md border border-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]"
                          >
                            {" "}
                            Delete{" "}
                          </button>{" "}
                        </div>{" "}
                      </td>{" "}
                    </tr>
                  ))
                )}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </section>{" "}
        <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6 ">
          {" "}
          <div className="flex flex-col gap-2">
            {" "}
            <p className="text-xs font-semibold tracking-[0.08em] text-[color:var(--accent)]">
              Reports
            </p>{" "}
            <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
              Export Payroll and Deductions
            </h2>{" "}
            <p className="text-sm text-[color:var(--text-secondary)]">
              {" "}
              Generate PDF, CSV, or JSON files using the GB calculator,
              including a simple printer-friendly payslip PDF.{" "}
            </p>{" "}
          </div>{" "}
          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            {" "}
            <div>
              {" "}
              <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                Report Type
              </label>{" "}
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
              >
                {" "}
                <option value="payroll">Payroll report</option>{" "}
                <option value="paye">PAYE report</option>{" "}
                <option value="deductions">Deductions report</option>{" "}
                <option value="loan">Loan tracking report</option>{" "}
                <option value="slip">Simple payslip PDF</option>{" "}
              </select>{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="text-sm font-semibold text-[color:var(--text-tertiary)]">
                File Format
              </label>{" "}
              <select
                value={reportFormat}
                onChange={(e) =>
                  setReportFormat(e.target.value as ReportFormat)
                }
                className="mt-2 w-full rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text-tertiary)] shadow-sm focus:border-[color:var(--accent)] focus:outline-none"
              >
                {" "}
                <option value="pdf">PDF</option>{" "}
                <option value="csv">CSV</option>{" "}
                <option value="json">JSON</option>{" "}
              </select>{" "}
            </div>{" "}
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center justify-center rounded-md border border-[color:var(--accent-soft)] px-6 py-3 text-sm font-semibold text-[color:var(--accent-strong)]"
            >
              {" "}
              {reportFormat === "pdf" ? "Print Preview" : "Download"}{" "}
            </button>{" "}
          </div>{" "}
          <div className="mt-6 rounded-xl border border-[color:var(--border-default)] bg-[color:var(--surface)] p-4">
            {" "}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {" "}
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                {previewReport.title} Preview
              </p>{" "}
              <p className="text-xs text-[color:var(--text-secondary)]">
                {" "}
                {entries.length} record{entries.length === 1 ? "" : "s"}{" "}
              </p>{" "}
            </div>{" "}
            {entries.length === 0 ? (
              <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
                Add employees to see the report preview.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                {" "}
                <table className="min-w-[900px] w-full border-collapse text-sm">
                  {" "}
                  <thead>
                    {" "}
                    <tr className="border-b border-[color:var(--border-default)] text-left text-xs tracking-[0.08em] text-[color:var(--text-secondary)]">
                      {" "}
                      {previewReport.headers.map((header) => (
                        <th key={header} className="py-3 pr-4">
                          {" "}
                          {header}{" "}
                        </th>
                      ))}{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody>
                    {" "}
                    {previewReport.rows.map((row, rowIndex) => (
                      <tr
                        key={`preview-${rowIndex}`}
                        className="border-b border-[color:var(--border-subtle)]"
                      >
                        {" "}
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`preview-${rowIndex}-${cellIndex}`}
                            className="py-3 pr-4"
                          >
                            {" "}
                            {typeof cell === "number"
                              ? formatMoney(cell)
                              : String(cell)}{" "}
                          </td>
                        ))}{" "}
                      </tr>
                    ))}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>
            )}{" "}
          </div>{" "}
        </section>{" "}
      </div>{" "}
      {viewingEntry ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setViewingEntry(null)}
        >
          {" "}
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] p-6 "
            onClick={(e) => e.stopPropagation()}
          >
            {" "}
            <div className="flex items-center justify-between gap-3">
              {" "}
              <div>
                {" "}
                <p className="text-xs font-semibold tracking-[0.08em] text-[color:var(--accent)]">
                  View
                </p>{" "}
                <h3 className="text-xl font-semibold text-[color:var(--text-primary)]">
                  {viewingEntry.name}
                </h3>{" "}
              </div>{" "}
              <button
                type="button"
                onClick={() => setViewingEntry(null)}
                className="rounded-md border border-[color:var(--border-default)] px-4 py-2 text-sm font-semibold text-[color:var(--text-secondary)]"
              >
                {" "}
                Close{" "}
              </button>{" "}
            </div>{" "}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {" "}
              <div className="rounded-xl border border-[color:var(--border-default)] p-4">
                {" "}
                <h4 className="text-sm font-semibold text-[color:var(--text-primary)]">
                  Earnings
                </h4>{" "}
                <div className="mt-3 grid gap-2 text-sm">
                  {" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Basic</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.basic)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Transport</span>{" "}
                    <span className="font-semibold">
                      {" "}
                      {viewingEntry.includeTransportAllowance
                        ? formatMoney(viewingEntry.transport)
                        : "Off"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Utility</span>{" "}
                    <span className="font-semibold">
                      {" "}
                      {viewingEntry.includeUtilityAllowance
                        ? formatMoney(viewingEntry.utility)
                        : "Off"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Rent</span>{" "}
                    <span className="font-semibold">
                      {" "}
                      {viewingEntry.includeRentAllowance
                        ? formatMoney(viewingEntry.rent)
                        : "Off"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Risk</span>{" "}
                    <span className="font-semibold">
                      {" "}
                      {viewingEntry.includeRiskAllowance
                        ? formatMoney(viewingEntry.risk)
                        : "Off"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Leave</span>{" "}
                    <span className="font-semibold">
                      {" "}
                      {viewingEntry.includeLeaveAllowance
                        ? formatMoney(viewingEntry.leaveAllowance)
                        : "Off"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Clothing</span>{" "}
                    <span className="font-semibold">
                      {" "}
                      {viewingEntry.includeClothingAllowance
                        ? formatMoney(viewingEntry.clothingAllowance)
                        : "Off"}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Other earnings</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.otherEarnings)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Overtime</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.overtimeAddition)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Prov. 3.5%</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.providentEarning35)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Prov. 6.5%</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.providentEarning65)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between border-t border-[color:var(--border-subtle)] pt-2">
                    {" "}
                    <span className="font-semibold">Gross earnings</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.grossEarnings)}
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="rounded-xl border border-[color:var(--border-default)] p-4">
                {" "}
                <h4 className="text-sm font-semibold text-[color:var(--text-primary)]">
                  Deductions
                </h4>{" "}
                <div className="mt-3 grid gap-2 text-sm">
                  {" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Social Security (5.5%)</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.socialSecurity)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>PAYE</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.paye)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Welfare</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.welfare)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Union dues</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.unionDues)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Support</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.support)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Lateness</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.latenessDeduction)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Absenteeism</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.absenteeismDeduction)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Provident 3.5%</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.providentDeduction35)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <span>Provident 16.5%</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.providentDeduction165)}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between border-t border-[color:var(--border-subtle)] pt-2">
                    {" "}
                    <span className="font-semibold">Total deductions</span>{" "}
                    <span className="font-semibold">
                      {formatMoney(viewingEntry.totalDeductions)}
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-6 rounded-xl border border-[color:var(--border-default)] p-4">
              {" "}
              <h4 className="text-sm font-semibold text-[color:var(--text-primary)]">
                Summary
              </h4>{" "}
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                {" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <span>Taxable income</span>{" "}
                  <span className="font-semibold">
                    {formatMoney(viewingEntry.taxableIncome)}
                  </span>{" "}
                </div>{" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <span>Net salary</span>{" "}
                  <span className="font-semibold">
                    {formatMoney(viewingEntry.netSalary)}
                  </span>{" "}
                </div>{" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <span>Loan amount</span>{" "}
                  <span className="font-semibold">
                    {formatMoney(viewingEntry.loanAmount)}
                  </span>{" "}
                </div>{" "}
                <div className="flex items-center justify-between">
                  {" "}
                  <span>Total paid</span>{" "}
                  <span className="font-semibold">
                    {formatMoney(viewingEntry.totalPaid)}
                  </span>{" "}
                </div>{" "}
                <div className="flex items-center justify-between md:col-span-2">
                  {" "}
                  <span className="font-semibold">Outstanding loan</span>{" "}
                  <span className="font-semibold">
                    {formatMoney(viewingEntry.outstanding)}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      ) : null}{" "}
    </main>
  );
}
