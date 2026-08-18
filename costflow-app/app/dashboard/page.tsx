"use client";

import React, { useEffect, useState, useCallback, Suspense, useMemo, startTransition } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  TrendingUp, Download, RefreshCw, Plus, AlertTriangle,
  ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Sparkles,
  BarChart2, ArrowLeft, Sun, Moon, Factory, GraduationCap,
  ShoppingCart, Globe, HardHat, X, ArrowRightLeft, Droplets,
  Shield, Activity, Lock, UserCheck, Building2, Info, Share2, Clock, FileText,
  Package, Settings, Box, Coffee, Droplet, Shirt,
  type LucideProps,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { useCostingStore } from "@/lib/store/costingStore";
import { useShallow } from "zustand/react/shallow";
import { DOMAIN_PRESETS } from "@/lib/engine/domainPresets";
import { detectAnomalies, computePriceRecommendation } from "@/lib/ml/anomalyDetector";
import { UnitGeometryModal } from "@/components/geometry/UnitGeometryModal";
import { LiquidBatchModal } from "@/components/liquid/LiquidBatchModal";
import { TeamManagementModal } from "@/components/rbac/TeamManagementModal";
import { AuditTrailModal } from "@/components/rbac/AuditTrailModal";
import { CompanyOpexModal } from "@/components/opex/CompanyOpexModal";
import { ProformaInvoiceModal } from "@/components/invoice/ProformaInvoiceModal";
import { WhatIfSensitivityModal } from "@/components/sensitivity/WhatIfSensitivityModal";
import { ReverseTargetSolverModal } from "@/components/solver/ReverseTargetSolverModal";
import { RevisionDiffModal } from "@/components/revision/RevisionDiffModal";
import { CostBlockCard } from "@/components/dashboard/CostBlockCard";
import type { Domain } from "@/types/costing";

// Lazy-loaded chart components with fallback skeletons
const CostPieChart = dynamic(
  () => import("@/components/analytics/LazyCharts").then((m) => m.CostPieChart),
  {
    ssr: false,
    loading: () => <div className="w-full h-[220px] bg-slate-800/10 rounded-xl animate-pulse" />,
  }
);

const BlockBarChart = dynamic(
  () => import("@/components/analytics/LazyCharts").then((m) => m.BlockBarChart),
  {
    ssr: false,
    loading: () => <div className="w-full h-[180px] bg-slate-800/10 rounded-xl animate-pulse" />,
  }
);

const CostFlowCopilot = dynamic(
  () => import("@/components/copilot/CostFlowCopilot").then((m) => m.CostFlowCopilot),
  { ssr: false }
);

/* ─── Icon maps ─── */
const DOMAIN_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  metals: Factory,
  plastics: Package,
  packaging: Box,
  food: Coffee,
  agro: Droplet,
  apparel: Shirt,
};

/* ─── Helpers ─── */
function fmt(value: number, currency: string) {
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ─── Selling price display ─── */
const SellingPriceCard = React.memo(function SellingPriceCard({
  value,
  currency,
}: {
  value: number;
  currency: string;
}) {
  return (
    <div className="selling-price-box text-center my-4">
      <div
        className="text-xs font-semibold uppercase tracking-widest mb-1"
        style={{ color: "var(--text-3)" }}
      >
        Selling Price
      </div>
      <div className="font-black g-text font-mono" style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>
        {fmt(value, currency)}
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export function DashboardPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  // Granular Zustand selector via useShallow to prevent unnecessary parent re-renders
  const {
    domain,
    blocks,
    summary,
    currency,
    projectName,
    companyName,
    targetMarginPct,
    isDirty,
    geometryConfig,
    geometryMetrics,
    liquidBatchConfig,
    liquidBatchMetrics,
    currentUser,
    approvalStatus,
    auditLogs,
    opexConfig,
    payrollConfig,
    companyMetrics,
    marginMode,
    batchMultiplier,
    targetPriceSolverEnabled,
    targetSellingPrice,
    gstRate,
    setMarginMode,
    setBatchMultiplier,
    setTargetPriceSolver,
    setDomain,
    setProjectName,
    setCompanyName,
    setCurrency,
    setTargetMargin: storeSetTargetMargin,
    setGstRate,
    updateBlockVariable,
    toggleBlock,
    reorderBlocks,
    deleteBlock,
    addCustomBlock,
    setCurrentUserRole,
    setApprovalStatus,
    loadProjectState,
    recompute,
    resetToPreset,
  } = useCostingStore(
    useShallow((state) => ({
      domain: state.domain,
      blocks: state.blocks,
      summary: state.summary,
      currency: state.currency,
      projectName: state.projectName,
      companyName: state.companyName,
      targetMarginPct: state.targetMarginPct,
      isDirty: state.isDirty,
      geometryConfig: state.geometryConfig,
      geometryMetrics: state.geometryMetrics,
      liquidBatchConfig: state.liquidBatchConfig,
      liquidBatchMetrics: state.liquidBatchMetrics,
      currentUser: state.currentUser,
      approvalStatus: state.approvalStatus,
      auditLogs: state.auditLogs,
      opexConfig: state.opexConfig,
      payrollConfig: state.payrollConfig,
      companyMetrics: state.companyMetrics,
      marginMode: state.marginMode,
      batchMultiplier: state.batchMultiplier,
      targetPriceSolverEnabled: state.targetPriceSolverEnabled,
      targetSellingPrice: state.targetSellingPrice,
      gstRate: state.gstRate,
      setMarginMode: state.setMarginMode,
      setBatchMultiplier: state.setBatchMultiplier,
      setTargetPriceSolver: state.setTargetPriceSolver,
      setDomain: state.setDomain,
      setProjectName: state.setProjectName,
      setCompanyName: state.setCompanyName,
      setCurrency: state.setCurrency,
      setTargetMargin: state.setTargetMargin,
      setGstRate: state.setGstRate,
      updateBlockVariable: state.updateBlockVariable,
      toggleBlock: state.toggleBlock,
      reorderBlocks: state.reorderBlocks,
      deleteBlock: state.deleteBlock,
      addCustomBlock: state.addCustomBlock,
      setCurrentUserRole: state.setCurrentUserRole,
      setApprovalStatus: state.setApprovalStatus,
      loadProjectState: state.loadProjectState,
      recompute: state.recompute,
      resetToPreset: state.resetToPreset,
    }))
  );

  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showGeometryModal, setShowGeometryModal] = useState(false);
  const [showLiquidModal, setShowLiquidModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showOpexModal, setShowOpexModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showWhatIfModal, setShowWhatIfModal] = useState(false);
  const [showReverseSolverModal, setShowReverseSolverModal] = useState(false);
  const [showRevisionDiffModal, setShowRevisionDiffModal] = useState(false);
  const [enginesMenuOpen, setEnginesMenuOpen] = useState(false);
  const [rbacMenuOpen, setRbacMenuOpen] = useState(false);
  const [targetMargin, setTargetMarginState] = useState(0.25);
  const [solverPriceInput, setSolverPriceInput] = useState<string>("500");
  const [addingBlock, setAddingBlock] = useState(false);
  const [newBlockLabel, setNewBlockLabel] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"blocks" | "summary">("blocks");
  const [showTour, setShowTour] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [savingVersion, setSavingVersion] = useState(false);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const payload = {
        domain,
        blocks,
        summary: summary ?? {
          subtotal: 0,
          wastageAmount: 0,
          taxAmount: 0,
          profitAmount: 0,
          sellingPrice: 0,
          breakEvenUnits: 0,
          marginPercent: 0,
          costBreakdown: [],
        },
        currency,
        projectName,
        companyName,
        exportedAt: new Date().toISOString(),
        geometryConfig,
        geometryMetrics,
        liquidBatchConfig,
        liquidBatchMetrics,
        userRole: currentUser.role,
        opexConfig,
        payrollConfig,
        companyMetrics,
      };
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CostFlow_${projectName.replace(/\s+/g, "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      notify("✅ Excel exported with real formulas & liquid batch sheet!");
    } catch {
      notify("❌ Export failed — please try again.");
    }
    setExporting(false);
  }, [
    domain,
    blocks,
    summary,
    currency,
    projectName,
    companyName,
    geometryConfig,
    geometryMetrics,
    liquidBatchConfig,
    liquidBatchMetrics,
    currentUser.role,
    opexConfig,
    payrollConfig,
    companyMetrics,
    notify,
  ]);

  const handleShare = useCallback(() => {
    if (!projectId) return;
    const url = `${window.location.origin}/share/${projectId}`;
    navigator.clipboard.writeText(url);
    notify("✅ Share link copied to clipboard!");
  }, [projectId, notify]);

  const loadVersions = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`);
      const data = await res.json();
      if (Array.isArray(data)) setVersions(data);
    } catch (e) {
      console.error(e);
    }
  }, [projectId]);

  const saveVersion = async () => {
    if (!projectId) return;
    setSavingVersion(true);
    try {
      await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Snapshot ${new Date().toLocaleString()}` }),
      });
      notify("✅ Version saved!");
      loadVersions();
    } catch (e) {
      notify("❌ Failed to save version");
    }
    setSavingVersion(false);
  };

  const restoreVersion = (versionDataStr: string) => {
    if (confirm("Restore this version? Unsaved changes will be lost.")) {
      const data = JSON.parse(versionDataStr);
      loadProjectState(projectId!, data);
      notify("✅ Version restored!");
    }
  };

  // Initialization (Theme, Tour, DB Load)
  useEffect(() => {
    const saved = localStorage.getItem("cf-theme") as "dark" | "light" | null;
    setTheme(saved ?? "dark");

    if (projectId) {
      fetch(`/api/projects/${projectId}`)
        .then((res) => res.json())
        .then((project) => {
          if (project && project.data) {
            const data = JSON.parse(project.data);
            loadProjectState(projectId, data);
            setProjectName(project.name);
          }
          recompute();
          setIsMounted(true);
        })
        .catch((err) => {
          console.error("Failed to load project", err);
          recompute();
          setIsMounted(true);
        });
    } else {
      recompute();
      setIsMounted(true);
    }

    if (!localStorage.getItem("cf-tour-done")) {
      setShowTour(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        handleExport();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "r") {
        e.preventDefault();
        startTransition(() => {
          resetToPreset();
        });
        notify("Reset to preset");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExport, resetToPreset, notify]);

  // Prevent accidental unsaved closing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Auto-save
  useEffect(() => {
    if (isDirty && projectId && isMounted) {
      const timer = setTimeout(() => {
        fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: projectName,
            data: JSON.stringify({
              domain,
              blocks,
              currency,
              companyName,
              targetMarginPct,
            }),
          }),
        }).then(() => {
          useCostingStore.setState({ isDirty: false });
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDirty, blocks, projectName, domain, currency, companyName, targetMarginPct, projectId, isMounted]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("cf-theme", theme);
  }, [theme]);

  /* ── Recharts data ── */
  const pieData = useMemo(() => {
    return (
      summary?.costBreakdown.map((b) => ({
        name: b.label,
        value: b.value,
        color: b.color,
      })) ?? []
    );
  }, [summary?.costBreakdown]);

  const barData = useMemo(() => {
    const enabled = blocks.filter((b) => b.enabled && (b.result ?? 0) > 0);
    return enabled.map((b) => ({
      name: b.label.split(" ").slice(0, 2).join(" "),
      value: Math.round(b.result ?? 0),
      color: b.color,
    }));
  }, [blocks]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  const handleToggleEnable = useCallback(
    (id: string) => {
      toggleBlock(id);
    },
    [toggleBlock]
  );

  const handleDeleteBlock = useCallback(
    (id: string, label: string) => {
      deleteBlock(id);
      notify(`Removed "${label}"`);
    },
    [deleteBlock, notify]
  );

  const handleUpdateVariable = useCallback(
    (blockId: string, variableId: string, value: number) => {
      updateBlockVariable(blockId, variableId, value);
    },
    [updateBlockVariable]
  );

  if (!isMounted) {
    return (
      <div style={{ minHeight: "100svh", background: "var(--bg)" }}>
        <nav
          className="h-14 sm:h-16 border-b skeleton w-full rounded-none"
          style={{ borderColor: "var(--border)" }}
        />
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col xl:flex-row gap-5">
          <div className="flex-1 space-y-4">
            <div className="h-8 skeleton w-48 mb-6" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 skeleton w-full rounded-xl" />
            ))}
          </div>
          <div className="xl:w-96 space-y-4">
            <div className="h-64 skeleton w-full rounded-xl" />
            <div className="h-48 skeleton w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const anomalies = detectAnomalies(blocks);
  const priceRec = computePriceRecommendation(
    summary?.subtotal ?? 0,
    targetMargin,
    (summary?.subtotal ?? 0) * 0.3,
    100
  );

  const isDark = theme === "dark";
  const preset = DOMAIN_PRESETS.find((p) => p.id === domain);
  const DomainIcon = DOMAIN_ICONS[domain] ?? Factory;

  /* ══════ JSX ══════ */
  return (
    <div style={{ minHeight: "100svh", background: "var(--bg)" }} className="has-mobile-nav">
      {/* ── Onboarding Tour ── */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ y: 20, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="card p-6 max-w-sm w-full text-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Welcome to CostFlow! 🚀</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                Add, reorder, and configure blocks to calculate your selling price. Swipe blocks on
                mobile or drag them to reorder.
                <br />
                <br />
                Use{" "}
                <kbd className="px-1.5 py-0.5 border rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">
                  ⌘E
                </kbd>{" "}
                to export an Excel sheet anytime!
              </p>
              <button
                className="btn btn-primary w-full shadow-lg"
                onClick={() => {
                  setShowTour(false);
                  localStorage.setItem("cf-tour-done", "true");
                }}
              >
                Get Started
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 z-[60] px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl card"
            style={{
              transform: "translateX(-50%)",
              zIndex: 60,
              minWidth: 240,
              textAlign: "center",
              color: "var(--text-1)",
              border: "1px solid var(--border)",
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ NAV ══════ */}
      <nav className="sticky top-0 z-40 glass border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-3 sm:px-6 h-14 sm:h-16 max-w-screen-2xl mx-auto">
          {/* LEFT: Logo + Version */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-none">
            <Link
              href="/dashboard/projects"
              className="btn btn-icon flex-shrink-0 min-h-[44px] min-w-[44px] hidden sm:flex items-center justify-center"
              aria-label="Go back to workspace"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${preset?.color ?? "#3B82F6"}18` }}
              >
                <DomainIcon size={20} color={preset?.color ?? "#3B82F6"} />
              </div>
              <div className="flex flex-col min-w-0 justify-center h-full">
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  aria-label="Project Name"
                  className="font-bold text-sm sm:text-base bg-transparent border-none outline-none truncate min-h-[24px]"
                  style={{ color: "var(--text-1)", maxWidth: 180 }}
                  placeholder="Project Name"
                />
                <span className="text-[10px] text-slate-500 font-bold tracking-wider leading-none">
                  v2.4
                </span>
              </div>
            </div>
          </div>

          {/* CENTER: Workspace Switcher */}
          <div className="hidden lg:flex items-center gap-3 flex-1 justify-center px-4">
            <div className="text-sm font-medium text-slate-500 mr-2 flex items-center gap-2">
              <Factory size={16} /> Active Workspace:
            </div>
            <select
              value={domain}
              onChange={(e) => {
                const nextDomain = e.target.value as Domain;
                startTransition(() => {
                  setDomain(nextDomain);
                });
              }}
              aria-label="Select Domain"
              className="cf-input py-1.5 text-sm min-h-[44px] rounded-md bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:border-blue-500"
              style={{ minWidth: 200 }}
            >
              {DOMAIN_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label.split("—")[0].trim()}
                </option>
              ))}
            </select>
          </div>

          {/* RIGHT: Essential Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "INR" | "USD")}
              aria-label="Select Currency"
              className="cf-input py-1.5 text-sm w-20 min-h-[44px] hidden sm:block rounded-md bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 focus:border-blue-500"
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
            </select>

            <button
              aria-label="Toggle Theme"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="btn btn-icon min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md border border-slate-200 dark:border-zinc-700"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              aria-label="Export Excel"
              onClick={handleExport}
              disabled={exporting}
              className="btn btn-primary min-h-[44px] px-4 hidden sm:flex items-center justify-center gap-2 rounded-md text-sm font-semibold"
            >
              <Download size={16} /> {exporting ? "..." : "Export PI"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Anomaly Banner ── */}
      {anomalies.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-500">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>
              <strong>Cost Anomaly Alert:</strong> {anomalies.length} block(s) detected with high
              variance vs industry standards. Check highlighted cards below.
            </span>
          </div>
        </div>
      )}

      {/* ── Pipeline Stepper ── */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 pt-5 pb-1">
        <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar pb-2">
          {/* Step 1 */}
          <div className="flex flex-col gap-1.5 min-w-[140px] flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${blocks.length > 0 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-800'}`} />
            <div className={`text-[10px] font-bold uppercase tracking-wider ${blocks.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500'}`}>
              1. Raw Materials & Geometry
            </div>
          </div>
          {/* Step 2 */}
          <div className="flex flex-col gap-1.5 min-w-[140px] flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${(summary?.subtotal ?? 0) > 0 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-800'}`} />
            <div className={`text-[10px] font-bold uppercase tracking-wider ${(summary?.subtotal ?? 0) > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500'}`}>
              2. Processing & OPEX
            </div>
          </div>
          {/* Step 3 */}
          <div className="flex flex-col gap-1.5 min-w-[140px] flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${(summary?.sellingPrice ?? 0) > 0 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-zinc-800'}`} />
            <div className={`text-[10px] font-bold uppercase tracking-wider ${(summary?.sellingPrice ?? 0) > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500'}`}>
              3. Margin & PI Output
            </div>
          </div>
        </div>
      </div>

      {/* ══════ MAIN CONTENT ══════ */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-2 sm:py-4 overflow-x-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-[65%_35%] gap-6 items-start">
          {/* ════ LEFT: BLOCKS PANEL ════ */}
          <div className={`min-w-0 ${mobileTab === "summary" ? "hidden sm:block" : "block"}`}>
            {/* Quick-Start Industry Presets Bar */}
            <div className="card p-3 mb-4 flex items-center justify-between gap-2 overflow-x-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 flex-shrink-0">
                <Sparkles size={14} className="text-amber-400" /> Presets:
              </span>
              <div className="flex items-center gap-2 flex-nowrap">
                {DOMAIN_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      startTransition(() => {
                        setDomain(p.id);
                      });
                      notify(`Loaded ${p.label.split("—")[0].trim()} preset`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all flex-shrink-0 ${
                      domain === p.id
                        ? "bg-blue-600 text-white border-blue-500 shadow-md"
                        : "bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-700 hover:border-blue-500/50"
                    }`}
                  >
                    <span>{p.label.split("—")[0].trim()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formula Engine Control Toolbar */}
            <div className="card p-3 sm:p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/40 border-slate-800">
              {/* Batch Multiplier */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  📦 Batch Quantity Scaling
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    value={batchMultiplier}
                    onChange={(e) => setBatchMultiplier(parseFloat(e.target.value) || 1)}
                    className="cf-input py-1 text-xs font-mono font-bold text-blue-400 w-20 text-center"
                  />
                  <div className="flex gap-1">
                    {[1, 10, 100].map((m) => (
                      <button
                        key={m}
                        onClick={() => setBatchMultiplier(m)}
                        className={`px-2 py-1 text-[11px] font-bold rounded-md border ${
                          batchMultiplier === m
                            ? "bg-blue-600 text-white border-blue-500"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Margin Calculation Mode */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  📈 Margin Calculation Mode
                </label>
                <button
                  onClick={() =>
                    setMarginMode(
                      marginMode === "markup_on_cost" ? "margin_on_selling" : "markup_on_cost"
                    )
                  }
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800 text-cyan-300 hover:bg-slate-700 transition-colors text-left flex items-center justify-between"
                >
                  <span>
                    {marginMode === "margin_on_selling"
                      ? "Margin on Selling %"
                      : "Markup on Cost %"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Toggle</span>
                </button>
              </div>

              {/* Reverse Target Price Solver */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  🎯 Target Price Solver
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setTargetPriceSolver(
                        !targetPriceSolverEnabled,
                        parseFloat(solverPriceInput) || 500
                      )
                    }
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                      targetPriceSolverEnabled
                        ? "bg-purple-600 text-white border-purple-500"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {targetPriceSolverEnabled ? "ON" : "OFF"}
                  </button>
                  {targetPriceSolverEnabled && (
                    <input
                      type="number"
                      value={solverPriceInput}
                      onChange={(e) => {
                        setSolverPriceInput(e.target.value);
                        setTargetPriceSolver(true, parseFloat(e.target.value) || 0);
                      }}
                      placeholder="Target ₹"
                      className="cf-input py-1 text-xs font-mono font-bold text-purple-300 flex-1"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h2
                className="font-bold flex items-center gap-2"
                style={{ fontSize: "clamp(1rem,2.5vw,1.15rem)", color: "var(--text-1)" }}
              >
                Costing Blocks
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/flow"
                  aria-label="View Flow"
                  className="hidden sm:flex btn btn-ghost py-1.5 text-xs"
                >
                  <BarChart2 size={14} /> Flow
                </Link>
                <button
                  aria-label="AI Insights"
                  onClick={() => setShowAI(!showAI)}
                  className="hidden sm:flex btn btn-ghost py-1.5 text-xs"
                >
                  <Sparkles size={14} /> AI Insights
                </button>
                <button
                  aria-label="Add Block"
                  onClick={() => setAddingBlock(true)}
                  className="btn btn-ghost py-1.5 px-3 text-xs"
                >
                  <Plus size={14} /> Add Block
                </button>
              </div>
            </div>

            {/* Add block input */}
            <AnimatePresence>
              {addingBlock && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="card p-3 mb-3 flex gap-2"
                  style={{ borderColor: "var(--cf-blue)" }}
                >
                  <input
                    autoFocus
                    value={newBlockLabel}
                    onChange={(e) => setNewBlockLabel(e.target.value)}
                    aria-label="New block name"
                    placeholder="Block name (e.g. Quality Inspection, Tooling)"
                    className="cf-input flex-1 text-xs sm:text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newBlockLabel.trim()) {
                        addCustomBlock(newBlockLabel.trim());
                        setNewBlockLabel("");
                        setAddingBlock(false);
                      }
                    }}
                  />
                  <button
                    className="btn btn-primary text-xs"
                    onClick={() => {
                      if (newBlockLabel.trim()) {
                        addCustomBlock(newBlockLabel.trim());
                        setNewBlockLabel("");
                        setAddingBlock(false);
                      }
                    }}
                  >
                    Add
                  </button>
                  <button className="btn btn-ghost text-xs" onClick={() => setAddingBlock(false)}>
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Bento Cards ── */}
            <div className="space-y-6">
              {/* Card 1 */}
              <div className="card p-5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
                <h3 className="font-bold mb-4 text-sm flex items-center gap-2" style={{ color: "var(--text-1)" }}>
                  <Package size={18} className="text-blue-500" /> [Raw Material & Dimensions]
                </h3>
                <div className="space-y-3">
                  {blocks.filter(b => b.type === "raw_material" || b.type === "packaging" || b.label.toLowerCase().includes("material") || b.label.toLowerCase().includes("geometry")).map((block) => (
                    <CostBlockCard
                      key={block.id} block={block} currency={currency} isDark={isDark} expanded={expanded === block.id} userRole={currentUser.role} approvalStatus={approvalStatus} onToggleExpand={handleToggleExpand} onToggleEnable={handleToggleEnable} onDelete={handleDeleteBlock} onUpdateVariable={handleUpdateVariable}
                    />
                  ))}
                </div>
              </div>

              {/* Card 2 */}
              <div className="card p-5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
                <h3 className="font-bold mb-4 text-sm flex items-center gap-2" style={{ color: "var(--text-1)" }}>
                  <Settings size={18} className="text-emerald-500" /> [Processing, Labor & Machine Overhead]
                </h3>
                <div className="space-y-3">
                  {blocks.filter(b => b.type === "direct_labor" || b.type === "fixed_overhead" || b.type === "variable_overhead" || b.type === "finishing" || b.label.toLowerCase().includes("labor") || b.label.toLowerCase().includes("processing") || b.label.toLowerCase().includes("tool")).map((block) => (
                    <CostBlockCard
                      key={block.id} block={block} currency={currency} isDark={isDark} expanded={expanded === block.id} userRole={currentUser.role} approvalStatus={approvalStatus} onToggleExpand={handleToggleExpand} onToggleEnable={handleToggleEnable} onDelete={handleDeleteBlock} onUpdateVariable={handleUpdateVariable}
                    />
                  ))}
                </div>
              </div>

              {/* Card 3 */}
              <div className="card p-5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
                <h3 className="font-bold mb-4 text-sm flex items-center gap-2" style={{ color: "var(--text-1)" }}>
                  <Trash2 size={18} className="text-amber-500" /> [Scrap Allowance & Waste Recovery]
                </h3>
                <div className="space-y-3">
                  {blocks.filter(b => b.type === "wastage" || b.label.toLowerCase().includes("scrap") || b.label.toLowerCase().includes("waste") || b.label.toLowerCase().includes("shrinkage")).map((block) => (
                    <CostBlockCard
                      key={block.id} block={block} currency={currency} isDark={isDark} expanded={expanded === block.id} userRole={currentUser.role} approvalStatus={approvalStatus} onToggleExpand={handleToggleExpand} onToggleEnable={handleToggleEnable} onDelete={handleDeleteBlock} onUpdateVariable={handleUpdateVariable}
                    />
                  ))}
                </div>
              </div>

              {/* Other Blocks */}
              {(() => {
                const categorized = new Set([
                  ...blocks.filter(b => b.type === "raw_material" || b.type === "packaging" || b.label.toLowerCase().includes("material") || b.label.toLowerCase().includes("geometry")),
                  ...blocks.filter(b => b.type === "direct_labor" || b.type === "fixed_overhead" || b.type === "variable_overhead" || b.type === "finishing" || b.label.toLowerCase().includes("labor") || b.label.toLowerCase().includes("processing") || b.label.toLowerCase().includes("tool")),
                  ...blocks.filter(b => b.type === "wastage" || b.label.toLowerCase().includes("scrap") || b.label.toLowerCase().includes("waste") || b.label.toLowerCase().includes("shrinkage"))
                ].map(b => b.id));
                const other = blocks.filter(b => !categorized.has(b.id));
                if (other.length === 0) return null;
                return (
                  <div className="card p-5 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl">
                    <h3 className="font-bold mb-4 text-sm flex items-center gap-2" style={{ color: "var(--text-1)" }}>
                      <Plus size={18} className="text-purple-500" /> Other Components
                    </h3>
                    <div className="space-y-3">
                      {other.map(block => (
                        <CostBlockCard
                          key={block.id} block={block} currency={currency} isDark={isDark} expanded={expanded === block.id} userRole={currentUser.role} approvalStatus={approvalStatus} onToggleExpand={handleToggleExpand} onToggleEnable={handleToggleEnable} onDelete={handleDeleteBlock} onUpdateVariable={handleUpdateVariable}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ════ RIGHT: SUMMARY PANEL ════ */}
          <div
            className={`min-w-0 space-y-4 sticky top-24 h-fit ${
              mobileTab === "blocks" ? "hidden sm:block" : "block"
            }`}
          >
            {/* Cost Summary Card */}
            <div className="metric-card">
              <h3 className="font-bold mb-3 flex items-center justify-between text-[var(--text-1)]">
                <span className="flex items-center gap-2">
                  <TrendingUp size={17} className="text-indigo-500" /> Cost Summary
                </span>
                {batchMultiplier > 1 && (
                  <span className="badge bg-indigo-500/10 text-indigo-500 text-[10px] font-bold">
                    {batchMultiplier}x Batch
                  </span>
                )}
              </h3>
              {summary ? (
                <>
                  {/* Total Cost Section */}
                  <div className="mb-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Cost (Pre-Tax)</div>
                    <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
                      <span className="text-sm text-[var(--text-2)]">Direct Costs</span>
                      <span className="font-medium text-sm font-mono text-[var(--text-1)]">{fmt(summary.directCosts, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
                      <span className="text-sm text-[var(--text-2)]">Factory Overheads</span>
                      <span className="font-medium text-sm font-mono text-[var(--text-1)]">{fmt(summary.factoryOverheads, currency)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border)] bg-slate-50 dark:bg-zinc-800/30 px-2 rounded-md mt-1">
                      <span className="text-sm font-bold text-[var(--text-1)]">Subtotal</span>
                      <span className="font-bold text-sm font-mono text-[var(--text-1)]">{fmt(summary.subtotal, currency)}</span>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="mb-2 mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tax Layer / GST</div>
                      <select 
                        value={gstRate.toString()}
                        onChange={(e) => setGstRate(parseFloat(e.target.value))}
                        className="text-xs bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded px-1 py-0.5"
                      >
                        <option value="0">0%</option>
                        <option value="0.05">5%</option>
                        <option value="0.12">12%</option>
                        <option value="0.18">18%</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
                      <span className="text-sm text-[var(--text-2)]">Tax Amount</span>
                      <span className="font-medium text-sm font-mono text-amber-500">{fmt(summary.taxAmount, currency)}</span>
                    </div>
                  </div>

                  {/* Profit Margin */}
                  <div className="mb-2 mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Net Profit Margin ({(targetMarginPct * 100).toFixed(0)}%)</div>
                    </div>
                    <input
                      type="range"
                      min={0.10}
                      max={0.50}
                      step={0.01}
                      value={targetMarginPct}
                      onChange={(e) => storeSetTargetMargin(parseFloat(e.target.value))}
                      className="w-full mb-1 accent-emerald-500"
                    />
                    <div className="flex justify-between items-center py-1.5 border-b border-[var(--border)]">
                      <span className="text-sm text-[var(--text-2)]">Profit Target</span>
                      <span className="font-medium text-sm font-mono text-emerald-500">{fmt(summary.profitAmount, currency)}</span>
                    </div>
                  </div>

                  {/* Food Cost Sanity Alert (Workspace 4) */}
                  {domain === "food" && summary.sellingPrice > 0 && (
                    (() => {
                      const foodCostPct = (summary.directCosts / summary.sellingPrice) * 100;
                      return foodCostPct > 32 ? (
                        <div className="mb-4 mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-start gap-2">
                          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <strong>Target Food Cost Alert</strong>
                            <p className="mt-0.5">Your food cost is currently {foodCostPct.toFixed(1)}% of the selling price, which exceeds the standard 32% threshold for HoReCa profitability.</p>
                          </div>
                        </div>
                      ) : null;
                    })()
                  )}

                  <SellingPriceCard value={summary.sellingPrice} currency={currency} />

                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="btn w-full py-3.5 mb-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl rounded-xl font-bold flex justify-center gap-2 text-base tracking-wide"
                  >
                    <FileText size={18} /> Generate Proforma Invoice (PDF)
                  </button>

                  {/* Reverse Target Price Solver Result Card */}
                  {summary.targetPriceSolverEnabled && (
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs my-3">
                      <div className="font-bold flex items-center justify-between mb-1">
                        <span>🎯 Reverse Target Price</span>
                        <span className="font-mono text-purple-200">{fmt(summary.targetSellingPrice, currency)}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 flex justify-between items-center mt-1">
                        <span>Allowable Raw Material Unit Cost:</span>
                        <strong className="text-emerald-400 font-mono text-xs">
                          {fmt(summary.solvedRawMaterialUnitCost ?? 0, currency)}
                        </strong>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-xs" style={{ color: "var(--text-3)" }}>
                  No enabled blocks
                </div>
              )}
            </div>

            {/* Pie chart card */}
            {pieData.length > 0 && (
              <div className="metric-card">
                <h3
                  className="font-bold mb-3 flex items-center gap-2 text-sm"
                  style={{ color: "var(--text-1)" }}
                >
                  <BarChart2 size={16} color="var(--cf-cyan)" /> Cost Breakdown
                </h3>
                <CostPieChart data={pieData} currency={currency} />
              </div>
            )}

            {/* AI Price Recommender */}
            <AnimatePresence>
              {showAI && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  className="metric-card"
                  style={{ borderColor: "rgba(139,92,246,0.3)" }}
                >
                  <h3
                    className="font-bold mb-4 flex items-center gap-2 text-sm"
                    style={{ color: "var(--text-1)" }}
                  >
                    <Sparkles size={16} color="var(--cf-purple)" /> AI Price Recommender
                  </h3>
                  <div className="mb-4">
                    <label
                      className="text-xs font-medium block mb-2"
                      style={{ color: "var(--text-2)" }}
                    >
                      Target Margin: {(targetMargin * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min={0.05}
                      max={0.7}
                      step={0.01}
                      value={targetMargin}
                      aria-label="Target Margin Slider"
                      onChange={(e) => setTargetMarginState(parseFloat(e.target.value))}
                      className="w-full"
                      style={{ accentColor: "var(--cf-purple)" }}
                    />
                  </div>
                  {[
                    {
                      label: "Recommended Price",
                      value: priceRec.recommendedPrice,
                      color: "var(--cf-purple)",
                    },
                    {
                      label: "Break-Even Price",
                      value: priceRec.breakEvenPrice,
                      color: "var(--cf-amber)",
                    },
                    {
                      label: "Optimal Price",
                      value: priceRec.optimalPrice,
                      color: "var(--cf-emerald)",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center py-2 border-b"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span className="text-xs" style={{ color: "var(--text-2)" }}>
                        {row.label}
                      </span>
                      <span className="font-bold text-sm font-mono" style={{ color: row.color }}>
                        {fmt(row.value, currency)}
                      </span>
                    </div>
                  ))}
                  <div
                    className="mt-3 p-3 rounded-xl text-xs"
                    style={{ background: "rgba(139,92,246,0.07)", color: "var(--text-2)" }}
                  >
                    💡 Price range: {fmt(priceRec.priceRange.min, currency)} —{" "}
                    {fmt(priceRec.priceRange.max, currency)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Block bar chart */}
            {barData.length > 0 && (
              <div className="metric-card">
                <h3
                  className="font-bold mb-3 text-sm"
                  style={{ color: "var(--text-1)" }}
                >
                  Block Contribution
                </h3>
                <BlockBarChart data={barData} currency={currency} isDark={isDark} />
              </div>
            )}

            {/* Export CTA */}
            <button
              aria-label="Generate Excel"
              onClick={handleExport}
              disabled={exporting}
              className="btn btn-primary w-full py-4 text-sm sm:text-base justify-center pulse-glow"
            >
              <Download size={18} />
              {exporting ? "Generating Excel…" : "Export Excel with Real Formulas"}
            </button>
          </div>
        </div>
      </div>

      {/* ══════ MOBILE BOTTOM NAV & SUMMARY DRAWER ══════ */}
      <div className="mobile-nav safe-bottom flex flex-col pointer-events-none justify-end pb-0 sm:hidden">
        <div className="pointer-events-auto w-full bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
           <div className="flex items-center justify-between px-5 py-3 pb-safe">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Final Selling Price</span>
               <span className="text-xl font-black text-emerald-400 font-mono">{fmt(summary?.sellingPrice ?? 0, currency)}</span>
             </div>
             
             <div className="flex gap-2">
               <button
                 onClick={() => setMobileTab(mobileTab === "summary" ? "blocks" : "summary")}
                 className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-white shadow-md"
                 title="Toggle Details"
               >
                 {mobileTab === "summary" ? <X size={18} /> : <BarChart2 size={18} />}
               </button>
               <button
                 onClick={handleExport}
                 disabled={exporting}
                 className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-blue-600 flex items-center justify-center border border-blue-500 text-white shadow-lg shadow-blue-500/20"
                 title="Export"
               >
                 <Download size={18} />
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* ══════ UNIT & GEOMETRY MODAL ══════ */}
      <UnitGeometryModal
        isOpen={showGeometryModal}
        onClose={() => setShowGeometryModal(false)}
        onApplySuccess={() => notify("✅ Applied Unit & Geometry costs to Costing Sheet!")}
      />

      {/* ══════ LIQUID BATCH ENGINE MODAL ══════ */}
      <LiquidBatchModal
        isOpen={showLiquidModal}
        onClose={() => setShowLiquidModal(false)}
        onApplySuccess={() => notify("✅ Applied Liquid Batch costs to Costing Sheet!")}
      />

      {/* ══════ TEAM MANAGEMENT & RBAC MATRIX MODAL ══════ */}
      <TeamManagementModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
      />

      {/* ══════ IMMUTABLE AUDIT TRAIL MODAL ══════ */}
      <AuditTrailModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />

      {/* ══════ COMPANY OPEX & FINANCIAL MODELER MODAL ══════ */}
      <CompanyOpexModal
        isOpen={showOpexModal}
        onClose={() => setShowOpexModal(false)}
        onApplySuccess={() => notify("✅ Applied Company OPEX & Payroll to Costing Sheet!")}
      />

      {/* Version History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="font-bold flex items-center gap-2">
                <Clock size={18} /> Version History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <button
                onClick={saveVersion}
                disabled={savingVersion}
                className="w-full py-2 bg-[var(--cf-blue)] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {savingVersion ? "Saving..." : "Save Current Snapshot"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {versions.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  No snapshots saved yet.
                </div>
              ) : (
                versions.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:border-[var(--cf-blue)] transition-colors group"
                  >
                    <div className="font-medium text-sm mb-1">{v.name}</div>
                    <div className="text-xs text-gray-500 mb-3">
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                    <button
                      onClick={() => restoreVersion(v.data)}
                      className="text-xs font-medium text-[var(--cf-blue)] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Restore Version
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proforma Invoice & Quotation PDF Modal */}
      <ProformaInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />

      {/* "What-If" Sensitivity & Scenario Stress-Tester Modal */}
      <WhatIfSensitivityModal
        isOpen={showWhatIfModal}
        onClose={() => setShowWhatIfModal(false)}
      />

      {/* Reverse Target Costing & Feasibility Solver Modal */}
      <ReverseTargetSolverModal
        isOpen={showReverseSolverModal}
        onClose={() => setShowReverseSolverModal(false)}
      />

      {/* Cost Sheet Revision & Immutable Diff Modal */}
      <RevisionDiffModal
        isOpen={showRevisionDiffModal}
        onClose={() => setShowRevisionDiffModal(false)}
      />

      {/* Embedded Floating AI Costing Copilot */}
      <CostFlowCopilot
        onOpenInvoiceModal={() => setShowInvoiceModal(true)}
        onStateApplied={() => notify("⚡ Autonomous AI Copilot: Updated canvas parameters in real-time!")}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Loading Workspace...
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
