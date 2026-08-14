"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Target,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useCostingStore } from "@/lib/store/costingStore";
import { solveReverseTargetCosting } from "@/lib/engine/reverseSolverEngine";
import { formatCurrencyLocale } from "@/lib/engine/forexEngine";

interface ReverseTargetSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReverseTargetSolverModal({ isOpen, onClose }: ReverseTargetSolverModalProps) {
  const { blocks, summary, currency, reverseSolverConfig, setReverseSolverConfig, batchMultiplier } =
    useCostingStore();

  const [targetPriceInput, setTargetPriceInput] = useState<string>(
    reverseSolverConfig.targetPrice ? String(reverseSolverConfig.targetPrice) : "500"
  );
  const [targetMarginInput, setTargetMarginInput] = useState<string>(
    reverseSolverConfig.targetMarginPct ? String(reverseSolverConfig.targetMarginPct * 100) : "25"
  );

  const result = useMemo(() => {
    const P = parseFloat(targetPriceInput) || 500;
    const M = (parseFloat(targetMarginInput) || 25) / 100;
    return solveReverseTargetCosting(
      blocks,
      { targetPrice: P, targetMarginPct: M, lockedVariableIds: reverseSolverConfig.lockedVariableIds },
      18,
      batchMultiplier
    );
  }, [blocks, targetPriceInput, targetMarginInput, reverseSolverConfig.lockedVariableIds, batchMultiplier]);

  if (!isOpen) return null;

  const statusColor =
    result.feasibilityStatus === "VIABLE"
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : result.feasibilityStatus === "TIGHT"
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Target size={20} />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  Reverse Target Costing & Feasibility Solver
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase ${statusColor}`}>
                    {result.feasibilityStatus}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Solve costing backwards from client-mandated target purchase price $P_{`\\text{target}`}$
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

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

            {/* Target Inputs & Lockable Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Target Price & Margin Box */}
              <div className="card p-5 bg-slate-950/60 border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Target size={15} /> Mandated Target Parameters
                </h4>

                <div>
                  <label className="text-slate-400 block mb-1">Target Purchase Price (P_target):</label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-300">
                      {currency === "INR" ? "₹" : "$"}
                    </span>
                    <input
                      type="number"
                      value={targetPriceInput}
                      onChange={(e) => setTargetPriceInput(e.target.value)}
                      className="cf-input py-2 text-sm font-mono font-bold text-purple-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Minimum Acceptable Net Margin (M_target %):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={targetMarginInput}
                      onChange={(e) => setTargetMarginInput(e.target.value)}
                      className="cf-input py-2 text-sm font-mono font-bold text-emerald-400 w-24 text-center"
                    />
                    <span className="font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Allowable Net Subtotal:</span>
                    <span className="font-bold font-mono text-slate-200">
                      {formatCurrencyLocale(result.allowableSubtotal, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Allowable Direct Material Budget:</span>
                    <span className="font-bold font-mono text-emerald-400">
                      {formatCurrencyLocale(result.allowableDirectMaterialCost, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Back-Calculated Ceilings */}
              <div className="card p-5 bg-slate-950/60 border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <TrendingUp size={15} /> Back-Calculated Cost Ceilings
                </h4>

                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 space-y-1">
                  <div className="text-[11px] text-blue-400 font-bold uppercase">
                    Max Allowable Raw Material Unit Rate:
                  </div>
                  <div className="text-xl font-black font-mono text-white">
                    {formatCurrencyLocale(result.maxAllowableRmRate, currency)} / unit
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 space-y-1">
                  <div className="text-[11px] text-indigo-400 font-bold uppercase">
                    Max Allowable Cycle Time Ceiling:
                  </div>
                  <div className="text-xl font-black font-mono text-white">
                    {result.maxAllowableCycleTimeHours} Hours / Piece
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                    <Lightbulb size={14} className="text-amber-400" /> Actionable Recommendations:
                  </div>
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="text-slate-400 text-[11px] leading-relaxed flex items-start gap-1">
                      <span>•</span> <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
