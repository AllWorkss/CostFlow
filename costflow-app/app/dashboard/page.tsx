"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Settings, Download, RefreshCw, Plus, AlertTriangle,
  ChevronDown, ChevronUp, Trash2, Eye, EyeOff, Sparkles, Activity,
  BarChart2, ArrowLeft, Sun, Moon, Save, Factory, GraduationCap,
  ShoppingCart, Globe, HardHat, Package, Users, Receipt, Target,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useCostingStore } from "@/lib/store/costingStore";
import { DOMAIN_PRESETS } from "@/lib/engine/domainPresets";
import { detectAnomalies } from "@/lib/ml/anomalyDetector";
import { computePriceRecommendation } from "@/lib/ml/anomalyDetector";
import type { Domain } from "@/types/costing";

const DOMAIN_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  manufacturing: Factory, school: GraduationCap, retail: ShoppingCart,
  ecommerce: Globe, construction: HardHat,
};

const BLOCK_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Package, Users, Settings, Receipt, TrendingUp, Target,
  Trash2, Sparkles, AlertTriangle, Activity,
};

function formatCurrency(value: number, currency: string) {
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function DashboardPage() {
  const store = useCostingStore();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [targetMargin, setTargetMargin] = useState(0.25);
  const [addingBlock, setAddingBlock] = useState(false);
  const [newBlockLabel, setNewBlockLabel] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("cf-theme") as "dark" | "light" | null;
    setTheme(saved ?? "dark");
    store.recompute();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("cf-theme", theme);
  }, [theme]);

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const config = {
        domain: store.domain,
        blocks: store.blocks,
        summary: store.summary ?? { subtotal: 0, wastageAmount: 0, taxAmount: 0, profitAmount: 0, sellingPrice: 0, breakEvenUnits: 0, marginPercent: 0, costBreakdown: [] },
        currency: store.currency,
        projectName: store.projectName,
        companyName: store.companyName,
        exportedAt: new Date().toISOString(),
      };
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CostFlow_${store.projectName.replace(/\s+/g, "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showNotif("✅ Excel exported with real formulas!");
    } catch {
      showNotif("❌ Export failed. Please try again.");
    }
    setExportLoading(false);
  };

  const anomalies = detectAnomalies(store.blocks);
  const priceRec = computePriceRecommendation(
    store.summary?.subtotal ?? 0, targetMargin,
    (store.summary?.subtotal ?? 0) * 0.3, 100
  );

  const isDark = theme === "dark";
  const bg = isDark ? "#0F1629" : "#F8FAFF";
  const cardBg = isDark ? "#1A2440" : "#FFFFFF";
  const border = isDark ? "rgba(59,130,246,0.15)" : "#E2E8F0";
  const textPrimary = isDark ? "#F1F5F9" : "#0F1629";
  const textSec = isDark ? "#94A3B8" : "#64748B";

  const DomainIcon = DOMAIN_ICONS[store.domain] ?? Factory;
  const currentPreset = DOMAIN_PRESETS.find(p => p.id === store.domain);

  return (
    <div style={{ background: bg, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* ── Notification toast ── */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 z-50 px-6 py-3 rounded-xl font-medium text-sm shadow-2xl"
            style={{ transform: "translateX(-50%)", background: "linear-gradient(135deg,#1A2440,#243258)", color: "#F1F5F9", border: "1px solid rgba(59,130,246,0.3)" }}>
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Nav ── */}
      <nav className="flex items-center justify-between px-6 py-3 border-b sticky top-0 z-40"
        style={{ background: isDark ? "rgba(15,22,41,0.95)" : "rgba(248,250,255,0.95)", borderColor: border, backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm" style={{ color: textSec }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <span style={{ color: border }}>|</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#3B82F6,#06B6D4)" }}>
              <TrendingUp className="text-white" size={16} />
            </div>
            <span className="font-bold gradient-text">CostFlow</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select value={store.domain} onChange={(e) => store.setDomain(e.target.value as Domain)}
            className="cf-input py-1.5 text-sm w-44" style={{ background: cardBg, color: textPrimary, borderColor: border }}>
            {DOMAIN_PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <select value={store.currency} onChange={(e) => store.setCurrency(e.target.value as "INR" | "USD")}
            className="cf-input py-1.5 text-sm w-20" style={{ background: cardBg, color: textPrimary, borderColor: border }}>
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
          </select>
          <button onClick={() => setTheme(isDark ? "light" : "dark")} className="cf-btn-secondary py-1.5 px-3">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => { store.resetToPreset(); showNotif("Reset to preset defaults"); }} className="cf-btn-secondary py-1.5 px-3">
            <RefreshCw size={15} />
          </button>
          <button onClick={handleExport} disabled={exportLoading} className="cf-btn-primary py-1.5 px-4">
            <Download size={15} /> {exportLoading ? "Exporting…" : "Export Excel"}
          </button>
        </div>
      </nav>

      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        {/* ── Project header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${currentPreset?.color ?? "#3B82F6"}20` }}>
              <DomainIcon size={26} style={{ color: currentPreset?.color ?? "#3B82F6" }} />
            </div>
            <div>
              <input value={store.projectName} onChange={e => store.setProjectName(e.target.value)}
                className="font-bold text-xl bg-transparent border-none outline-none"
                style={{ color: textPrimary }} placeholder="Project Name" />
              <div className="text-sm" style={{ color: textSec }}>{currentPreset?.label}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/flow">
              <button className="cf-btn-secondary py-2">
                <BarChart2 size={15} /> Flow Diagram
              </button>
            </Link>
            <button onClick={() => setShowAI(!showAI)} className="cf-btn-secondary py-2">
              <Sparkles size={15} /> {showAI ? "Hide" : "Show"} AI Insights
            </button>
          </div>
        </div>

        {/* ── Anomaly Banner ── */}
        {anomalies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-4 rounded-xl border flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)" }}>
            <AlertTriangle size={20} style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div className="font-bold text-sm mb-1" style={{ color: "#EF4444" }}>
                ML Anomaly Detected — {anomalies.length} unusual value{anomalies.length > 1 ? "s" : ""}
              </div>
              {anomalies.slice(0, 2).map(a => (
                <div key={`${a.blockId}:${a.variableId}`} className="text-xs mb-0.5" style={{ color: textSec }}>
                  {a.message}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── LEFT: Costing Blocks ── */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg" style={{ color: textPrimary }}>Costing Blocks</h2>
              <button onClick={() => setAddingBlock(true)} className="cf-btn-secondary py-1.5 px-3 text-sm">
                <Plus size={14} /> Add Block
              </button>
            </div>

            {/* Add block form */}
            <AnimatePresence>
              {addingBlock && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl border flex gap-3 items-center"
                  style={{ background: cardBg, borderColor: "#3B82F6" }}>
                  <input autoFocus value={newBlockLabel} onChange={e => setNewBlockLabel(e.target.value)}
                    placeholder="Custom block name (e.g. Certification Fee)" className="cf-input flex-1"
                    onKeyDown={e => {
                      if (e.key === "Enter" && newBlockLabel.trim()) {
                        store.addCustomBlock(newBlockLabel.trim());
                        setNewBlockLabel(""); setAddingBlock(false);
                        showNotif(`Added "${newBlockLabel.trim()}"`);
                      }
                    }} />
                  <button onClick={() => { if (newBlockLabel.trim()) { store.addCustomBlock(newBlockLabel.trim()); setNewBlockLabel(""); setAddingBlock(false); } }}
                    className="cf-btn-primary py-2 px-4">Add</button>
                  <button onClick={() => setAddingBlock(false)} className="cf-btn-secondary py-2 px-3">Cancel</button>
                </motion.div>
              )}
            </AnimatePresence>

            {store.blocks.map((block, idx) => (
              <motion.div key={block.id} layout
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="block-card border"
                style={{
                  background: cardBg, borderColor: block.isAnomalous ? "rgba(239,68,68,0.4)" : border,
                  opacity: block.enabled ? 1 : 0.55,
                }}>
                {/* Block header */}
                <div className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${block.color}20` }}>
                    <span style={{ fontSize: 18 }}>
                      {block.type === "raw_material" ? "📦" :
                       block.type === "direct_labor" ? "👷" :
                       block.type === "wastage" ? "⚠️" :
                       block.type === "finishing" ? "✨" :
                       block.type === "tax_gst" ? "🧾" :
                       block.type === "profit_markup" ? "📈" :
                       block.type === "transport" ? "🚚" :
                       block.type === "packaging" ? "📫" :
                       block.type === "fixed_overhead" ? "🏛️" : "⚙️"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: textPrimary }}>{block.label}</span>
                      {block.isAnomalous && (
                        <span className="cf-badge cf-badge-red anomaly-badge">⚠ Anomaly</span>
                      )}
                    </div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: textSec }}>{block.formula}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-sm" style={{ color: block.color }}>
                      {formatCurrency(block.result ?? 0, store.currency)}
                    </div>
                    <div className="text-xs" style={{ color: textSec }}>
                      {block.enabled ? "enabled" : "disabled"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={e => { e.stopPropagation(); store.toggleBlock(block.id); }} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      {block.enabled ? <Eye size={15} style={{ color: "#3B82F6" }} /> : <EyeOff size={15} style={{ color: textSec }} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); store.deleteBlock(block.id); showNotif(`Removed "${block.label}"`); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={15} style={{ color: "#EF4444" }} />
                    </button>
                    {expandedBlock === block.id ? <ChevronUp size={16} style={{ color: textSec }} /> : <ChevronDown size={16} style={{ color: textSec }} />}
                  </div>
                </div>

                {/* Expanded variables */}
                <AnimatePresence>
                  {expandedBlock === block.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="border-t px-4 pb-4 pt-3"
                      style={{ borderColor: border }}>
                      <div className="text-xs mb-3 font-mono px-3 py-2 rounded-lg"
                        style={{ background: isDark ? "#0F1629" : "#F1F5FD", color: "#3B82F6" }}>
                        <span style={{ color: textSec }}>Formula: </span>{block.formula}
                        {block.excelFormula && <span className="ml-3" style={{ color: "#06B6D4" }}>Excel: {block.excelFormula}</span>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {block.variables.map((variable) => (
                          <div key={variable.id}>
                            <label className="text-xs font-medium mb-1 block" style={{ color: textSec }}>
                              {variable.name} {variable.unit && <span className="cf-badge cf-badge-blue">{variable.unit}</span>}
                            </label>
                            <input
                              type="number"
                              value={variable.value}
                              onChange={e => store.updateBlockVariable(block.id, variable.id, parseFloat(e.target.value) || 0)}
                              className="cf-input"
                              step={variable.unit?.includes("%") ? 0.01 : undefined}
                              min={0}
                            />
                            {variable.description && (
                              <div className="text-xs mt-1" style={{ color: textSec }}>{variable.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* ── RIGHT: Summary + Charts ── */}
          <div className="space-y-5">
            {/* Cost Summary Card */}
            <div className="metric-card" style={{ background: cardBg, borderColor: border }}>
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: textPrimary }}>
                <TrendingUp size={18} style={{ color: "#3B82F6" }} /> Cost Summary
              </h3>
              {store.summary ? (
                <div className="space-y-3">
                  {[
                    { label: "Subtotal", value: store.summary.subtotal, color: "#3B82F6" },
                    { label: "Wastage", value: store.summary.wastageAmount, color: "#F59E0B" },
                    { label: "Tax / GST", value: store.summary.taxAmount, color: "#EF4444" },
                    { label: "Profit", value: store.summary.profitAmount, color: "#10B981" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b"
                      style={{ borderColor: border }}>
                      <span className="text-sm" style={{ color: textSec }}>{item.label}</span>
                      <span className="font-semibold text-sm" style={{ color: item.color }}>
                        {formatCurrency(item.value, store.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 pb-1">
                    <span className="font-bold" style={{ color: textPrimary }}>Selling Price</span>
                    <span className="font-black text-xl gradient-text">
                      {formatCurrency(store.summary.sellingPrice, store.currency)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl text-center" style={{ background: "rgba(16,185,129,0.1)" }}>
                      <div className="font-bold text-lg" style={{ color: "#10B981" }}>
                        {store.summary.marginPercent.toFixed(1)}%
                      </div>
                      <div className="text-xs" style={{ color: textSec }}>Margin</div>
                    </div>
                    <div className="p-3 rounded-xl text-center" style={{ background: "rgba(59,130,246,0.1)" }}>
                      <div className="font-bold text-lg" style={{ color: "#3B82F6" }}>
                        {store.summary.breakEvenUnits}
                      </div>
                      <div className="text-xs" style={{ color: textSec }}>Break-Even Units</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: textSec }}>
                  Add and configure blocks to see your cost summary
                </div>
              )}
            </div>

            {/* Cost Breakdown Pie Chart */}
            {store.summary && store.summary.costBreakdown.length > 0 && (
              <div className="metric-card" style={{ background: cardBg, borderColor: border }}>
                <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: textPrimary }}>
                  <BarChart2 size={18} style={{ color: "#06B6D4" }} /> Cost Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={store.summary.costBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      dataKey="value" paddingAngle={3}>
                      {store.summary.costBreakdown.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v, store.currency)} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* AI Price Recommender */}
            <AnimatePresence>
              {showAI && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  className="metric-card" style={{ background: cardBg, borderColor: "rgba(139,92,246,0.3)" }}>
                  <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: textPrimary }}>
                    <Sparkles size={18} style={{ color: "#8B5CF6" }} /> AI Price Recommender
                  </h3>
                  <div className="mb-4">
                    <label className="text-xs font-medium mb-2 block" style={{ color: textSec }}>
                      Target Margin: <strong style={{ color: "#8B5CF6" }}>{(targetMargin * 100).toFixed(0)}%</strong>
                    </label>
                    <input type="range" min={0.05} max={0.60} step={0.01} value={targetMargin}
                      onChange={e => setTargetMargin(parseFloat(e.target.value))}
                      className="w-full accent-purple-500" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Recommended Price", value: priceRec.recommendedPrice, color: "#8B5CF6" },
                      { label: "Break-Even Price", value: priceRec.breakEvenPrice, color: "#F59E0B" },
                      { label: "Optimal Price", value: priceRec.optimalPrice, color: "#10B981" },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: textSec }}>{item.label}</span>
                        <span className="font-bold text-sm" style={{ color: item.color }}>
                          {formatCurrency(item.value, store.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: "rgba(139,92,246,0.08)", color: textSec }}>
                    💡 Price range: {formatCurrency(priceRec.priceRange.min, store.currency)} —{" "}
                    {formatCurrency(priceRec.priceRange.max, store.currency)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Block bar chart */}
            {store.blocks.filter(b => b.enabled && (b.result ?? 0) > 0).length > 0 && (
              <div className="metric-card" style={{ background: cardBg, borderColor: border }}>
                <h3 className="font-bold mb-4 text-sm" style={{ color: textPrimary }}>Block Contribution</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={store.blocks.filter(b => b.enabled && (b.result ?? 0) > 0)
                    .map(b => ({ name: b.label.split(" ")[0], value: Math.round(b.result ?? 0), fill: b.color }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1E3A5F" : "#E2E8F0"} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: textSec }} />
                    <YAxis tick={{ fontSize: 10, fill: textSec }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v, store.currency)} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {store.blocks.filter(b => b.enabled && (b.result ?? 0) > 0).map(b => (
                        <Cell key={b.id} fill={b.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Export button large */}
            <button onClick={handleExport} disabled={exportLoading}
              className="cf-btn-primary w-full py-4 text-base justify-center pulse-glow">
              <Download size={20} />
              {exportLoading ? "Generating Excel…" : "Export Excel with Real Formulas"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
