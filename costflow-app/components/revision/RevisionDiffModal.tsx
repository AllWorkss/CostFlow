"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  History,
  GitCompare,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  FileCheck,
  User,
  Clock,
} from "lucide-react";
import { useCostingStore } from "@/lib/store/costingStore";
import { compareVersionSnapshots } from "@/lib/engine/revisionEngine";
import { formatCurrencyLocale } from "@/lib/engine/forexEngine";

interface RevisionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RevisionDiffModal({ isOpen, onClose }: RevisionDiffModalProps) {
  const { savedVersions, saveVersionSnapshot, currency } = useCostingStore();

  const [versionAName, setVersionAName] = useState<string>("");
  const [versionBName, setVersionBName] = useState<string>("");
  const [newVersionName, setNewVersionName] = useState<string>("");
  const [newVersionNotes, setNewVersionNotes] = useState<string>("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Set default selected versions
  const vA = savedVersions.find((v) => v.id === versionAName) || savedVersions[1] || savedVersions[0];
  const vB = savedVersions.find((v) => v.id === versionBName) || savedVersions[0];

  const diffResult = useMemo(() => {
    if (!vA || !vB) return null;
    return compareVersionSnapshots(vA, vB);
  }, [vA, vB]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-5xl rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <GitCompare size={20} />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  Cost Sheet Revision & Immutable Diff Engine
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase">
                    Audit Grade
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Compare version snapshots side-by-side with price vs quantity variance attribution
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSaveForm(!showSaveForm)}
                className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-lg"
              >
                <Plus size={14} /> Create Version Snapshot
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

            {/* Create New Snapshot Form */}
            {showSaveForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="card p-4 bg-slate-950/80 border-cyan-500/30 space-y-3"
              >
                <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <FileCheck size={15} /> Publish Immutable Version Snapshot
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Version Title / Label:</label>
                    <input
                      value={newVersionName}
                      onChange={(e) => setNewVersionName(e.target.value)}
                      placeholder="e.g. v2.0 - Q3 Annual Price Hike"
                      className="cf-input py-1.5 text-xs font-bold text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Notes / Revision Rationale:</label>
                    <input
                      value={newVersionNotes}
                      onChange={(e) => setNewVersionNotes(e.target.value)}
                      placeholder="e.g. Raw material price surge + 5% labor hike"
                      className="cf-input py-1.5 text-xs text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowSaveForm(false)}
                    className="btn btn-ghost text-xs py-1 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newVersionName.trim()) {
                        saveVersionSnapshot(newVersionName.trim(), newVersionNotes.trim());
                        setNewVersionName("");
                        setNewVersionNotes("");
                        setShowSaveForm(false);
                      }
                    }}
                    className="btn btn-primary text-xs py-1 px-4"
                  >
                    Publish Snapshot
                  </button>
                </div>
              </motion.div>
            )}

            {/* Version Selectors Bar */}
            {savedVersions.length >= 2 ? (
              <div className="card p-4 bg-slate-950/60 border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <label className="text-slate-400 font-bold block mb-1">Baseline Version (vA):</label>
                    <select
                      value={vA?.id}
                      onChange={(e) => setVersionAName(e.target.value)}
                      className="cf-input py-1.5 text-xs font-bold bg-slate-900"
                    >
                      {savedVersions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.versionNumber} — {v.versionName} ({v.timestamp})
                        </option>
                      ))}
                    </select>
                  </div>

                  <ArrowRight size={18} className="text-cyan-400 shrink-0 mt-5" />

                  <div className="flex-1">
                    <label className="text-slate-400 font-bold block mb-1">Comparison Version (vB):</label>
                    <select
                      value={vB?.id}
                      onChange={(e) => setVersionBName(e.target.value)}
                      className="cf-input py-1.5 text-xs font-bold bg-slate-900"
                    >
                      {savedVersions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.versionNumber} — {v.versionName} ({v.timestamp})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
                <History size={24} className="mx-auto text-cyan-400" />
                <div className="font-bold text-slate-300">Minimum 2 Version Snapshots Required</div>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Click "Create Version Snapshot" above to capture version state benchmarks.
                </p>
              </div>
            )}

            {/* High-Level Variance Attribution Cards */}
            {diffResult && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="card p-4 bg-slate-950/60 border-slate-800 space-y-1">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      Subtotal Cost Delta (Δ):
                    </span>
                    <div
                      className={`text-lg font-black font-mono ${
                        diffResult.subtotalDelta >= 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {diffResult.subtotalDelta >= 0 ? "+" : ""}
                      {formatCurrencyLocale(diffResult.subtotalDelta, currency)} ({diffResult.subtotalDeltaPct.toFixed(1)}%)
                    </div>
                  </div>

                  <div className="card p-4 bg-slate-950/60 border-slate-800 space-y-1">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      Material Price Impact:
                    </span>
                    <div className="text-lg font-black font-mono text-cyan-400">
                      {formatCurrencyLocale(diffResult.materialPriceImpact, currency)}
                    </div>
                  </div>

                  <div className="card p-4 bg-slate-950/60 border-slate-800 space-y-1">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      Quantity / Efficiency Impact:
                    </span>
                    <div className="text-lg font-black font-mono text-purple-400">
                      {formatCurrencyLocale(diffResult.quantityEfficiencyImpact, currency)}
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Diff Table */}
                <div className="card p-0 overflow-hidden border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                        <th className="p-3">Costing Block</th>
                        <th className="p-3 text-right">{vA.versionNumber} ({vA.versionName})</th>
                        <th className="p-3 text-right">{vB.versionNumber} ({vB.versionName})</th>
                        <th className="p-3 text-right">Variance Delta (Δ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {diffResult.blockDeltas.map((row) => (
                        <tr key={row.blockId} className="hover:bg-slate-800/30">
                          <td className="p-3 font-sans font-bold text-slate-200">{row.label}</td>
                          <td className="p-3 text-right text-slate-400">
                            {formatCurrencyLocale(row.costA, currency)}
                          </td>
                          <td className="p-3 text-right text-slate-200">
                            {formatCurrencyLocale(row.costB, currency)}
                          </td>
                          <td
                            className={`p-3 text-right font-bold ${
                              row.delta > 0
                                ? "text-rose-400"
                                : row.delta < 0
                                ? "text-emerald-400"
                                : "text-slate-500"
                            }`}
                          >
                            {row.delta > 0 ? "+" : ""}
                            {formatCurrencyLocale(row.delta, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
