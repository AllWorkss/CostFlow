"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sliders,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  CheckCircle,
  BarChart3,
  Layers,
  Scale,
} from "lucide-react";
import { useCostingStore } from "@/lib/store/costingStore";
import { runWhatIfStressTest } from "@/lib/engine/sensitivityEngine";
import { formatCurrencyLocale } from "@/lib/engine/forexEngine";

interface WhatIfSensitivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatIfSensitivityModal({ isOpen, onClose }: WhatIfSensitivityModalProps) {
  const { blocks, currency, targetMarginPct, whatIfConfig, setWhatIfConfig } = useCostingStore();

  const results = useMemo(() => {
    return runWhatIfStressTest(blocks, whatIfConfig, targetMarginPct);
  }, [blocks, whatIfConfig, targetMarginPct]);

  if (!isOpen) return null;

  const { worstCase, expectedCase, bestCase, riskVolatilityIndex, riskScore } = results;

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
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Sliders size={20} />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  "What-If" Sensitivity & Scenario Stress-Tester
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase ${
                      riskVolatilityIndex === "HIGH"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : riskVolatilityIndex === "MODERATE"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    Risk: {riskVolatilityIndex} ({riskScore}/100)
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Simulate market price volatility, scrap shifts, and volume discount scenarios in real-time
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

            {/* Interactive Sliders Panel */}
            <div className="card p-4 bg-slate-950/60 border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* RM Price Volatility */}
              <div>
                <div className="flex justify-between items-center mb-1 font-bold">
                  <span className="text-slate-300">Raw Material Volatility:</span>
                  <span className="text-purple-400 font-mono">
                    {whatIfConfig.rmPriceVolatilityPct >= 0 ? "+" : ""}
                    {whatIfConfig.rmPriceVolatilityPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={50}
                  step={5}
                  value={whatIfConfig.rmPriceVolatilityPct}
                  onChange={(e) =>
                    setWhatIfConfig({ rmPriceVolatilityPct: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Scrap Rate Shift */}
              <div>
                <div className="flex justify-between items-center mb-1 font-bold">
                  <span className="text-slate-300">Scrap Rate Shift:</span>
                  <span className="text-amber-400 font-mono">+{whatIfConfig.scrapShiftPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={2}
                  value={whatIfConfig.scrapShiftPct}
                  onChange={(e) =>
                    setWhatIfConfig({ scrapShiftPct: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Labor & Inflation Shift */}
              <div>
                <div className="flex justify-between items-center mb-1 font-bold">
                  <span className="text-slate-300">Labor & Utility Inflation:</span>
                  <span className="text-blue-400 font-mono">
                    {whatIfConfig.inflationPct >= 0 ? "+" : ""}
                    {whatIfConfig.inflationPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-10}
                  max={30}
                  step={2}
                  value={whatIfConfig.inflationPct}
                  onChange={(e) =>
                    setWhatIfConfig({ inflationPct: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Batch Volume Scale */}
              <div>
                <div className="flex justify-between items-center mb-1 font-bold">
                  <span className="text-slate-300">Batch Volume Scale:</span>
                  <span className="text-emerald-400 font-mono">{whatIfConfig.volumeDiscountScale}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={whatIfConfig.volumeDiscountScale}
                  onChange={(e) =>
                    setWhatIfConfig({ volumeDiscountScale: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full accent-emerald-500"
                />
              </div>

            </div>

            {/* 3-Column Parallel Comparison View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Worst-Case Card */}
              <div className="card p-5 bg-rose-500/5 border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                  <span className="font-black text-rose-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <AlertTriangle size={15} /> Worst-Case Scenario
                  </span>
                  <span className="badge badge-red text-[10px]">Surge Stress</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Direct Material & Labor:</span>
                    <span className="font-mono">{formatCurrencyLocale(worstCase.directCosts, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Factory Overheads:</span>
                    <span className="font-mono">{formatCurrencyLocale(worstCase.factoryOverheads, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 font-bold border-t border-rose-500/20 pt-1">
                    <span>Subtotal Cost:</span>
                    <span className="font-mono text-rose-300">{formatCurrencyLocale(worstCase.subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>Final Selling Price:</span>
                    <span className="font-mono text-white text-sm">{formatCurrencyLocale(worstCase.sellingPrice, currency)}</span>
                  </div>
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>Profit Amount:</span>
                    <span className="font-mono">{formatCurrencyLocale(worstCase.profitAmount, currency)}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Net Margin %:</span>
                    <span className="font-bold font-mono text-rose-400">{worstCase.marginPercent.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Breakeven Unit Ceiling:</span>
                    <span className="font-bold font-mono text-slate-200">{formatCurrencyLocale(worstCase.breakevenUnitPrice, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Expected Base Case Card */}
              <div className="card p-5 bg-blue-500/5 border-blue-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                  <span className="font-black text-blue-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Zap size={15} /> Expected (Active Base)
                  </span>
                  <span className="badge badge-blue text-[10px]">Active Baseline</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Direct Material & Labor:</span>
                    <span className="font-mono">{formatCurrencyLocale(expectedCase.directCosts, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Factory Overheads:</span>
                    <span className="font-mono">{formatCurrencyLocale(expectedCase.factoryOverheads, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 font-bold border-t border-blue-500/20 pt-1">
                    <span>Subtotal Cost:</span>
                    <span className="font-mono text-blue-300">{formatCurrencyLocale(expectedCase.subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>Final Selling Price:</span>
                    <span className="font-mono text-white text-sm">{formatCurrencyLocale(expectedCase.sellingPrice, currency)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Profit Amount:</span>
                    <span className="font-mono">{formatCurrencyLocale(expectedCase.profitAmount, currency)}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/20 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Net Margin %:</span>
                    <span className="font-bold font-mono text-emerald-400">{expectedCase.marginPercent.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Breakeven Unit Ceiling:</span>
                    <span className="font-bold font-mono text-slate-200">{formatCurrencyLocale(expectedCase.breakevenUnitPrice, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Best-Case Card */}
              <div className="card p-5 bg-emerald-500/5 border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <span className="font-black text-emerald-400 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <CheckCircle size={15} /> Best-Case Scenario
                  </span>
                  <span className="badge badge-emerald text-[10px]">Optimized</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Direct Material & Labor:</span>
                    <span className="font-mono">{formatCurrencyLocale(bestCase.directCosts, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Factory Overheads:</span>
                    <span className="font-mono">{formatCurrencyLocale(bestCase.factoryOverheads, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 font-bold border-t border-emerald-500/20 pt-1">
                    <span>Subtotal Cost:</span>
                    <span className="font-mono text-emerald-300">{formatCurrencyLocale(bestCase.subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>Final Selling Price:</span>
                    <span className="font-mono text-white text-sm">{formatCurrencyLocale(bestCase.sellingPrice, currency)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Profit Amount:</span>
                    <span className="font-mono">{formatCurrencyLocale(bestCase.profitAmount, currency)}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Net Margin %:</span>
                    <span className="font-bold font-mono text-emerald-400">{bestCase.marginPercent.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Breakeven Unit Ceiling:</span>
                    <span className="font-bold font-mono text-slate-200">{formatCurrencyLocale(bestCase.breakevenUnitPrice, currency)}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
