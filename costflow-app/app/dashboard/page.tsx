"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  TrendingUp, Download, RefreshCw, Plus, AlertTriangle,
  ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Sparkles,
  BarChart2, ArrowLeft, Sun, Moon, Factory, GraduationCap,
  ShoppingCart, Globe, HardHat, X, type LucideProps, Info, Share2, Clock
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useCostingStore } from "@/lib/store/costingStore";
import { DOMAIN_PRESETS } from "@/lib/engine/domainPresets";
import { detectAnomalies, computePriceRecommendation } from "@/lib/ml/anomalyDetector";
import type { Domain } from "@/types/costing";

/* ─── Icon maps ─── */
const DOMAIN_ICONS: Record<string, React.ComponentType<LucideProps>> = {
  manufacturing: Factory, school: GraduationCap,
  retail: ShoppingCart, ecommerce: Globe, construction: HardHat,
};

const BLOCK_EMOJIS: Record<string, string> = {
  raw_material: "📦", direct_labor: "👷", wastage: "⚠️",
  finishing: "✨", tax_gst: "🧾", profit_markup: "📈",
  transport: "🚚", packaging: "📫", fixed_overhead: "🏛️",
};

/* ─── Helpers ─── */
function fmt(value: number, currency: string) {
  const sym = currency === "INR" ? "₹" : "$";
  return `${sym}${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ─── Custom tooltip ─── */
function ChartTooltip({ active, payload, currency }: {
  active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }>;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: item } = payload[0];
  return (
    <div className="card px-3 py-2 text-sm">
      <div className="font-semibold" style={{ color: item.color }}>{name}</div>
      <div style={{ color: "var(--text-1)" }}>{fmt(value, currency)}</div>
    </div>
  );
}

/* ─── Selling price display ─── */
function SellingPriceCard({ value, currency }: { value: number; currency: string }) {
  return (
    <div className="selling-price-box text-center my-4">
      <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-3)" }}>
        Selling Price
      </div>
      <div className="font-black g-text" style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>
        {fmt(value, currency)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export function DashboardPageContent() {
  const store = useCostingStore();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme]       = useState<"dark"|"light">("dark");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showAI, setShowAI]     = useState(false);
  const [targetMargin, setTargetMargin] = useState(0.25);
  const [addingBlock, setAddingBlock] = useState(false);
  const [newBlockLabel, setNewBlockLabel] = useState("");
  const [toast, setToast]       = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"blocks"|"summary">("blocks");
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
        domain: store.domain,
        blocks: store.blocks,
        summary: store.summary ?? {
          subtotal: 0, wastageAmount: 0, taxAmount: 0, profitAmount: 0,
          sellingPrice: 0, breakEvenUnits: 0, marginPercent: 0, costBreakdown: [],
        },
        currency: store.currency,
        projectName: store.projectName,
        companyName: store.companyName,
        exportedAt: new Date().toISOString(),
      };
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `CostFlow_${store.projectName.replace(/\s+/g,"_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      notify("✅ Excel exported with real formulas!");
    } catch {
      notify("❌ Export failed — please try again.");
    }
    setExporting(false);
  }, [store, notify]);

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
        body: JSON.stringify({ name: `Snapshot ${new Date().toLocaleString()}` })
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
      store.loadProjectState(projectId!, data);
      notify("✅ Version restored!");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("cf-theme") as "dark"|"light" | null;
    setTheme(saved ?? "dark");
    store.recompute();
    
    // Load from DB
    if (projectId) {
      fetch(`/api/projects/${projectId}`)
        .then(res => res.json())
        .then(project => {
          if (project && project.data) {
            const data = JSON.parse(project.data);
            store.loadProjectState(projectId, data);
            store.setProjectName(project.name);
          }
          setIsMounted(true);
        })
        .catch(err => {
          console.error("Failed to load project", err);
          setIsMounted(true);
        });
    } else {
      setIsMounted(true);
    }
    
    if (!localStorage.getItem("cf-tour-done")) {
      setShowTour(true);
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        store.resetToPreset();
        notify("Reset to preset");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExport, store, notify]);

  // Auto-save
  useEffect(() => {
    if (store.isDirty && projectId && isMounted) {
      const timer = setTimeout(() => {
        fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: store.projectName,
            data: JSON.stringify({
              domain: store.domain,
              blocks: store.blocks,
              currency: store.currency,
              companyName: store.companyName,
              targetMarginPct: store.targetMarginPct,
            })
          })
        }).then(() => {
          useCostingStore.setState({ isDirty: false });
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [store.isDirty, store.blocks, store.projectName, store.domain, store.currency, store.companyName, store.targetMarginPct, projectId, isMounted]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("cf-theme", theme);
  }, [theme]);

  const enabledBlocks = store.blocks.filter(b => b.enabled && (b.result ?? 0) > 0);

  /* ── Recharts data ── */
  const pieData = useMemo(() => {
    return store.summary?.costBreakdown.map(b => ({
      name: b.label, value: b.value, color: b.color,
    })) ?? [];
  }, [store.summary?.costBreakdown]);

  const barData = useMemo(() => {
    return enabledBlocks.map(b => ({
      name: b.label.split(" ").slice(0,2).join(" "),
      value: Math.round(b.result ?? 0),
      color: b.color,
    }));
  }, [enabledBlocks]);

  if (!isMounted) {
    return (
      <div style={{ minHeight:"100svh", background:"var(--bg)" }}>
        <nav className="h-14 sm:h-16 border-b skeleton w-full rounded-none" style={{ borderColor: "var(--border)" }}></nav>
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col xl:flex-row gap-5">
          <div className="flex-1 space-y-4">
            <div className="h-8 skeleton w-48 mb-6"></div>
            {[1,2,3].map(i => <div key={i} className="h-20 skeleton w-full rounded-xl"></div>)}
          </div>
          <div className="xl:w-96 space-y-4">
            <div className="h-64 skeleton w-full rounded-xl"></div>
            <div className="h-48 skeleton w-full rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const anomalies  = detectAnomalies(store.blocks);
  const priceRec   = computePriceRecommendation(
    store.summary?.subtotal ?? 0, targetMargin,
    (store.summary?.subtotal ?? 0) * 0.3, 100
  );

  const isDark     = theme === "dark";
  const preset     = DOMAIN_PRESETS.find(p => p.id === store.domain);
  const DomainIcon = DOMAIN_ICONS[store.domain] ?? Factory;

  /* ══════ JSX ══════ */
  return (
    <div style={{ minHeight:"100svh", background:"var(--bg)" }} className="has-mobile-nav">

      {/* ── Onboarding Tour ── */}
      <AnimatePresence>
        {showTour && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ y: 20, scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }}
              className="card p-6 max-w-sm w-full text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={24} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Welcome to CostFlow! 🚀</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                Add, reorder, and configure blocks to calculate your selling price. Swipe blocks on mobile or drag them to reorder. 
                <br/><br/>Use <kbd className="px-1.5 py-0.5 border rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">⌘E</kbd> to export an Excel sheet anytime!
              </p>
              <button className="btn btn-primary w-full shadow-lg" onClick={() => {
                setShowTour(false);
                localStorage.setItem("cf-tour-done", "true");
              }}>
                Get Started
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-40 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-40 }}
            className="fixed top-4 left-1/2 z-[60] px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl card"
            style={{ transform:"translateX(-50%)", zIndex:60, minWidth:240, textAlign:"center",
              color:"var(--text-1)", border:"1px solid var(--border)" }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ NAV ══════ */}
      <nav className="sticky top-0 z-40 glass border-b"
        style={{ borderColor:"var(--border)" }}>
        <div className="flex items-center gap-2 px-3 sm:px-6 h-14 sm:h-16 max-w-screen-2xl mx-auto">

          {/* Back */}
          <Link href="/dashboard/projects" className="btn btn-icon flex-shrink-0" aria-label="Go back to workspace">
            <ArrowLeft size={16} />
          </Link>

          {/* Logo + project name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:`${preset?.color ?? "#3B82F6"}18` }}>
              <DomainIcon size={18} color={preset?.color ?? "#3B82F6"} />
            </div>
            <input value={store.projectName}
              onChange={e => store.setProjectName(e.target.value)}
              aria-label="Project Name"
              className="font-bold text-sm sm:text-base bg-transparent border-none outline-none min-w-0 flex-1 truncate"
              style={{ color:"var(--text-1)", maxWidth:180 }}
              placeholder="Project Name" />
          </div>

          {/* Right controls — hidden on mobile, shown via bottom nav */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <select value={store.domain} onChange={e => store.setDomain(e.target.value as Domain)}
              aria-label="Select Domain"
              className="cf-input py-1.5 text-sm" style={{ width:170 }}>
              {DOMAIN_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label.split("—")[0].trim()}</option>)}
            </select>
            <select value={store.currency} onChange={e => store.setCurrency(e.target.value as "INR"|"USD")}
              aria-label="Select Currency"
              className="cf-input py-1.5 text-sm w-20">
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
            </select>
            <button aria-label="Toggle Theme" onClick={() => setTheme(isDark ? "light" : "dark")} className="btn btn-icon">
              {isDark ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
            <button aria-label="Share" onClick={handleShare} className="btn btn-icon" title="Share Project">
              <Share2 size={15}/>
            </button>
            <button aria-label="Version History" onClick={() => { setShowHistory(true); loadVersions(); }} className="btn btn-icon" title="Version History">
              <Clock size={15}/>
            </button>
            <button aria-label="Reset Blocks" onClick={() => { store.resetToPreset(); notify("Reset to preset"); }} className="btn btn-icon">
              <RefreshCw size={15}/>
            </button>
            <button aria-label="Export Excel" onClick={handleExport} disabled={exporting} className="btn btn-primary">
              <Download size={15}/> {exporting ? "Exporting…" : "Export Excel"}
            </button>
          </div>

          {/* Mobile: theme toggle only */}
          <div className="flex sm:hidden items-center gap-2">
            <button aria-label="Toggle Theme" onClick={() => setTheme(isDark ? "light" : "dark")} className="btn btn-icon">
              {isDark ? <Sun size={15}/> : <Moon size={15}/>}
            </button>
          </div>
        </div>

        {/* Mobile: domain + currency bar */}
        <div className="sm:hidden flex gap-2 px-3 pb-3">
          <select value={store.domain} onChange={e => store.setDomain(e.target.value as Domain)}
            aria-label="Select Domain Mobile"
            className="cf-input py-1.5 text-sm flex-1">
            {DOMAIN_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label.split("—")[0].trim()}</option>)}
          </select>
          <select value={store.currency} onChange={e => store.setCurrency(e.target.value as "INR"|"USD")}
            aria-label="Select Currency Mobile"
            className="cf-input py-1.5 text-sm w-20">
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
          </select>
        </div>
      </nav>

      {/* ══════ MOBILE TAB BAR ══════ */}
      <div className="flex sm:hidden border-b sticky top-0 z-30"
        style={{ borderColor:"var(--border)", background:"var(--bg-card)" }}>
        {(["blocks","summary"] as const).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)}
            aria-label={`Switch to ${tab} tab`}
            className="flex-1 py-3 text-sm font-semibold capitalize transition-colors"
            style={{
              color: mobileTab === tab ? "var(--cf-blue)" : "var(--text-3)",
              borderBottom: mobileTab === tab ? "2px solid var(--cf-blue)" : "2px solid transparent",
            }}>
            {tab === "blocks" ? "🧱 Blocks" : "📊 Summary"}
          </button>
        ))}
      </div>

      {/* ══════ ANOMALY BANNER ══════ */}
      {anomalies.length > 0 && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          className="mx-3 sm:mx-6 mt-4 p-3 sm:p-4 rounded-xl border flex items-start gap-3"
          style={{ maxWidth:"calc(100% - 24px)", background:"rgba(239,68,68,0.07)", borderColor:"rgba(239,68,68,0.28)" }}>
          <AlertTriangle size={18} color="#EF4444" style={{ flexShrink:0, marginTop:2 }} />
          <div className="min-w-0">
            <div className="font-bold text-sm mb-0.5" style={{ color:"#EF4444" }}>
              ML Anomaly — {anomalies.length} unusual value{anomalies.length > 1 ? "s" : ""}
            </div>
            {anomalies.slice(0,2).map(a => (
              <div key={`${a.blockId}:${a.variableId}`} className="text-xs truncate" style={{ color:"var(--text-2)" }}>
                {a.message}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══════ MAIN CONTENT ══════ */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-x-hidden">
        <div className="flex flex-col xl:flex-row gap-5">

          {/* ════ LEFT: BLOCKS PANEL ════ */}
          <div className={`xl:flex-1 ${mobileTab === "summary" ? "hidden sm:block" : "block"}`}>

            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold" style={{ fontSize:"clamp(1rem,2.5vw,1.15rem)", color:"var(--text-1)" }}>
                Costing Blocks
              </h2>
              <div className="flex items-center gap-2">
                <Link href="/flow" aria-label="View Flow" className="hidden sm:flex btn btn-ghost py-1.5 text-xs">
                  <BarChart2 size={14}/> Flow
                </Link>
                <button aria-label="AI Insights" onClick={() => setShowAI(!showAI)} className="hidden sm:flex btn btn-ghost py-1.5 text-xs">
                  <Sparkles size={14}/> AI Insights
                </button>
                <button aria-label="Add Block" onClick={() => setAddingBlock(true)} className="btn btn-ghost py-1.5 px-3 text-xs">
                  <Plus size={14}/> Add Block
                </button>
              </div>
            </div>

            {/* Add block */}
            <AnimatePresence>
              {addingBlock && (
                <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                  exit={{ opacity:0, height:0 }} className="card p-3 mb-3 flex gap-2"
                  style={{ borderColor:"var(--cf-blue)" }}>
                  <input autoFocus value={newBlockLabel} onChange={e => setNewBlockLabel(e.target.value)}
                    aria-label="New block name"
                    placeholder="Block name e.g. Certification Fee" className="cf-input"
                    onKeyDown={e => {
                      if (e.key === "Enter" && newBlockLabel.trim()) {
                        store.addCustomBlock(newBlockLabel.trim());
                        setNewBlockLabel(""); setAddingBlock(false);
                        notify(`Added "${newBlockLabel.trim()}"`);
                      }
                      if (e.key === "Escape") setAddingBlock(false);
                    }} />
                  <button className="btn btn-primary flex-shrink-0"
                    aria-label="Confirm add block"
                    onClick={() => {
                      if (newBlockLabel.trim()) {
                        store.addCustomBlock(newBlockLabel.trim());
                        setNewBlockLabel(""); setAddingBlock(false);
                      }
                    }}>Add</button>
                  <button aria-label="Cancel add block" className="btn btn-icon flex-shrink-0" onClick={() => setAddingBlock(false)}>
                    <X size={15}/>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Block list using Framer Motion Reorder */}
            <Reorder.Group axis="y" values={store.blocks} onReorder={store.reorderBlocks} className="space-y-2.5">
              {store.blocks.map((block) => (
                <Reorder.Item key={block.id} value={block}
                  drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 100) {
                       store.toggleBlock(block.id);
                    } else if (info.offset.x < -100) {
                       store.deleteBlock(block.id);
                       notify(`Removed "${block.label}"`);
                    }
                  }}
                  className={`block-card relative ${!block.enabled ? "disabled" : ""} ${block.isAnomalous ? "anomalous" : ""}`}>
                  
                  {/* Swipe indicator hints - behind the content */}
                  <div className="absolute inset-y-0 left-0 w-16 bg-blue-500/10 flex items-center justify-center opacity-0 transition-opacity" style={{ zIndex: -1 }}>
                    <Eye size={20} className="text-blue-500" />
                  </div>
                  <div className="absolute inset-y-0 right-0 w-16 bg-red-500/10 flex items-center justify-center opacity-0 transition-opacity" style={{ zIndex: -1 }}>
                    <Trash2 size={20} className="text-red-500" />
                  </div>

                  {/* Block header row */}
                  <div className="flex items-center gap-2.5 p-3 cursor-pointer bg-[var(--bg-card)]"
                    onClick={() => setExpanded(expanded === block.id ? null : block.id)}>

                    {/* Icon */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg sm:text-xl cursor-grab active:cursor-grabbing"
                      style={{ background:`${block.color}15` }}>
                      {BLOCK_EMOJIS[block.type] ?? "⚙️"}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm truncate" style={{ color:"var(--text-1)" }}>
                          {block.label}
                        </span>
                        {block.isAnomalous && (
                          <span className="badge badge-red text-xs anomaly-wiggle">⚠ Anomaly</span>
                        )}
                      </div>
                      <div className="text-xs mono truncate mt-0.5" style={{ color:"var(--text-3)" }}>
                        {block.formula}
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm sm:text-base" style={{ color: block.color }}>
                        {fmt(block.result ?? 0, store.currency)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button aria-label="Toggle Block" onClick={e => { e.stopPropagation(); store.toggleBlock(block.id); }}
                        className="btn btn-icon w-8 h-8 sm:w-9 sm:h-9">
                        {block.enabled
                          ? <Eye size={14} color="var(--cf-blue)"/>
                          : <EyeOff size={14} color="var(--text-3)"/>}
                      </button>
                      <button aria-label="Delete Block" onClick={e => { e.stopPropagation(); store.deleteBlock(block.id); notify(`Removed "${block.label}"`); }}
                        className="btn btn-icon btn-danger w-8 h-8 sm:w-9 sm:h-9">
                        <Trash2 size={14}/>
                      </button>
                      {expanded === block.id
                        ? <ChevronUp size={15} color="var(--text-3)"/>
                        : <ChevronDown size={15} color="var(--text-3)"/>}
                    </div>
                  </div>

                  {/* Expanded variables */}
                  <AnimatePresence>
                    {expanded === block.id && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }}
                        exit={{ opacity:0, height:0 }}
                        className="border-t px-3 pb-4 pt-3 bg-[var(--bg-card)]"
                        style={{ borderColor:"var(--border)" }}>

                        {/* Formula display */}
                        <div className="mono text-xs px-3 py-2 rounded-lg mb-3"
                          style={{ background: isDark ? "rgba(15,26,46,0.7)" : "#EFF6FF", color:"var(--cf-blue)" }}>
                          <span style={{ color:"var(--text-3)" }}>Formula: </span>{block.formula}
                        </div>

                        {/* Variables grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {block.variables.map(variable => (
                            <div key={variable.id}>
                              <label className="text-xs font-medium block mb-1.5" style={{ color:"var(--text-2)" }}>
                                {variable.name}
                                {variable.unit && <span className="badge badge-blue ml-1.5">{variable.unit}</span>}
                              </label>
                              <input type="number" value={variable.value}
                                aria-label={variable.name}
                                onChange={e => store.updateBlockVariable(block.id, variable.id, parseFloat(e.target.value) || 0)}
                                className="cf-input" min={0}
                                step={variable.unit?.includes("%") ? 0.01 : undefined} />
                              {variable.description && (
                                <div className="text-xs mt-1" style={{ color:"var(--text-3)" }}>
                                  {variable.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            
            <div className="mt-4 text-xs text-center text-gray-500 opacity-60 flex items-center justify-center gap-2 show-mobile">
              <Info size={12}/> Swipe blocks left to delete, right to toggle.
            </div>
            
          </div>

          {/* ════ RIGHT: SUMMARY PANEL ════ */}
          <div className={`xl:w-96 space-y-4 ${mobileTab === "blocks" ? "hidden sm:block" : "block"}`}>

            {/* Cost Summary Card */}
            <div className="metric-card">
              <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color:"var(--text-1)" }}>
                <TrendingUp size={17} color="var(--cf-blue)"/> Cost Summary
              </h3>
              {store.summary ? (
                <>
                  {[
                    { label:"Subtotal",  value: store.summary.subtotal,      color:"var(--cf-blue)" },
                    { label:"Wastage",   value: store.summary.wastageAmount,  color:"var(--cf-amber)" },
                    { label:"Tax / GST", value: store.summary.taxAmount,      color:"var(--cf-red)" },
                    { label:"Profit",    value: store.summary.profitAmount,   color:"var(--cf-emerald)" },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b"
                      style={{ borderColor:"var(--border)" }}>
                      <span className="text-sm" style={{ color:"var(--text-2)" }}>{row.label}</span>
                      <span className="font-semibold text-sm" style={{ color: row.color }}>
                        {fmt(row.value, store.currency)}
                      </span>
                    </div>
                  ))}

                  <SellingPriceCard value={store.summary.sellingPrice} currency={store.currency} />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl text-center" style={{ background:"rgba(16,185,129,0.08)" }}>
                      <div className="font-black text-lg" style={{ color:"var(--cf-emerald)" }}>
                        {store.summary.marginPercent.toFixed(1)}%
                      </div>
                      <div className="text-xs" style={{ color:"var(--text-3)" }}>Margin</div>
                    </div>
                    <div className="p-3 rounded-xl text-center" style={{ background:"rgba(59,130,246,0.08)" }}>
                      <div className="font-black text-lg" style={{ color:"var(--cf-blue)" }}>
                        {store.summary.breakEvenUnits}
                      </div>
                      <div className="text-xs" style={{ color:"var(--text-3)" }}>Break-Even</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-sm" style={{ color:"var(--text-3)" }}>
                  Configure blocks to see your cost summary
                </div>
              )}
            </div>

            {/* Cost Breakdown Pie */}
            {pieData.length > 0 && (
              <div className="metric-card">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-sm" style={{ color:"var(--text-1)" }}>
                  <BarChart2 size={16} color="var(--cf-cyan)"/> Cost Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={52} outerRadius={82}
                      dataKey="value" paddingAngle={3} nameKey="name">
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip currency={store.currency} />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value, entry: any) => (
                        <span style={{ color:"var(--text-2)", fontSize:11 }}>{entry.payload?.name || value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* AI Price Recommender */}
            <AnimatePresence>
              {showAI && (
                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:16 }}
                  className="metric-card" style={{ borderColor:"rgba(139,92,246,0.3)" }}>
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-sm" style={{ color:"var(--text-1)" }}>
                    <Sparkles size={16} color="var(--cf-purple)"/> AI Price Recommender
                  </h3>
                  <div className="mb-4">
                    <label className="text-xs font-medium block mb-2" style={{ color:"var(--text-2)" }}>
                      Target Margin:{" "}
                      <strong style={{ color:"var(--cf-purple)" }}>{(targetMargin * 100).toFixed(0)}%</strong>
                    </label>
                    <input type="range" min={0.05} max={0.60} step={0.01} value={targetMargin}
                      aria-label="Target Margin"
                      onChange={e => setTargetMargin(parseFloat(e.target.value))}
                      className="w-full" style={{ accentColor:"var(--cf-purple)" }} />
                  </div>
                  {[
                    { label:"Recommended Price", value: priceRec.recommendedPrice, color:"var(--cf-purple)" },
                    { label:"Break-Even Price",  value: priceRec.breakEvenPrice,   color:"var(--cf-amber)"  },
                    { label:"Optimal Price",     value: priceRec.optimalPrice,     color:"var(--cf-emerald)"},
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b"
                      style={{ borderColor:"var(--border)" }}>
                      <span className="text-xs" style={{ color:"var(--text-2)" }}>{row.label}</span>
                      <span className="font-bold text-sm" style={{ color: row.color }}>
                        {fmt(row.value, store.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-3 p-3 rounded-xl text-xs" style={{ background:"rgba(139,92,246,0.07)", color:"var(--text-2)" }}>
                    💡 Price range: {fmt(priceRec.priceRange.min, store.currency)} — {fmt(priceRec.priceRange.max, store.currency)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Block bar chart */}
            {barData.length > 0 && (
              <div className="metric-card">
                <h3 className="font-bold mb-3 text-sm" style={{ color:"var(--text-1)" }}>
                  Block Contribution
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} margin={{ left:-16, right:4 }}>
                    <CartesianGrid strokeDasharray="3 3"
                      stroke={isDark ? "rgba(59,130,246,0.1)" : "#E2E8F0"} />
                    <XAxis dataKey="name" tick={{ fontSize:9, fill:"var(--text-3)" }} />
                    <YAxis tick={{ fontSize:9, fill:"var(--text-3)" }} />
                    <Tooltip content={<ChartTooltip currency={store.currency} />} />
                    <Bar dataKey="value" radius={[6,6,0,0]}>
                      {barData.map(b => (
                        <Cell key={b.name} fill={b.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Export CTA */}
            <button aria-label="Generate Excel" onClick={handleExport} disabled={exporting}
              className="btn btn-primary w-full py-4 text-sm sm:text-base justify-center pulse-glow">
              <Download size={18}/>
              {exporting ? "Generating Excel…" : "Export Excel with Real Formulas"}
            </button>
          </div>
        </div>
      </div>

      {/* ══════ MOBILE BOTTOM NAV ══════ */}
      <div className="mobile-nav safe-bottom">
        <Link href="/" aria-label="Home" className="flex flex-col items-center gap-0.5 text-xs px-2"
          style={{ color:"var(--text-3)" }}>
          <ArrowLeft size={20}/> <span>Home</span>
        </Link>
        <button aria-label="Blocks tab" onClick={() => setMobileTab("blocks")}
          className="flex flex-col items-center gap-0.5 text-xs px-2"
          style={{ color: mobileTab === "blocks" ? "var(--cf-blue)" : "var(--text-3)" }}>
          <span className="text-xl">🧱</span><span>Blocks</span>
        </button>
        <button aria-label="Summary tab" onClick={() => setMobileTab("summary")}
          className="flex flex-col items-center gap-0.5 text-xs px-2"
          style={{ color: mobileTab === "summary" ? "var(--cf-blue)" : "var(--text-3)" }}>
          <span className="text-xl">📊</span><span>Summary</span>
        </button>
        <Link href="/flow" aria-label="Flow view" className="flex flex-col items-center gap-0.5 text-xs px-2"
          style={{ color:"var(--text-3)" }}>
          <BarChart2 size={20}/><span>Flow</span>
        </Link>
        <button aria-label="Export button" onClick={handleExport} disabled={exporting}
          className="flex flex-col items-center gap-0.5 text-xs px-2"
          style={{ color: exporting ? "var(--text-3)" : "var(--cf-blue)" }}>
          <Download size={20}/><span>{exporting ? "…" : "Export"}</span>
        </button>
      </div>

      {/* Version History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="font-bold flex items-center gap-2"><Clock size={18} /> Version History</h3>
              <button onClick={() => setShowHistory(false)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"><X size={18}/></button>
            </div>
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <button onClick={saveVersion} disabled={savingVersion} className="w-full py-2 bg-[var(--cf-blue)] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                {savingVersion ? "Saving..." : "Save Current Snapshot"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {versions.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">No snapshots saved yet.</div>
              ) : (
                versions.map(v => (
                  <div key={v.id} className="p-3 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:border-[var(--cf-blue)] transition-colors group">
                    <div className="font-medium text-sm mb-1">{v.name}</div>
                    <div className="text-xs text-gray-500 mb-3">{new Date(v.createdAt).toLocaleString()}</div>
                    <button onClick={() => restoreVersion(v.data)} className="text-xs font-medium text-[var(--cf-blue)] opacity-0 group-hover:opacity-100 transition-opacity">
                      Restore Version
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading Workspace...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}
