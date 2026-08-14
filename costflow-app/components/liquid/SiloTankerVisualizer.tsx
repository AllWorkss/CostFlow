"use client";

import React from "react";
import type { FluidType } from "@/types/costing";

interface SiloTankerVisualizerProps {
  siloCapacityLiters: number;
  netSaleableLiters: number;
  shrinkageLossPct: number;
  fluidType: FluidType;
  totalPacksProduced: number;
}

export function SiloTankerVisualizer({
  siloCapacityLiters,
  netSaleableLiters,
  shrinkageLossPct,
  fluidType,
  totalPacksProduced,
}: SiloTankerVisualizerProps) {
  const getFluidColor = () => {
    switch (fluidType) {
      case "milk":
        return "#F8FAFC"; // Cream White
      case "edible_oil":
        return "#F59E0B"; // Amber Gold
      case "chemical":
        return "#A855F7"; // Purple Acid
      case "beverage":
        return "#06B6D4"; // Cyan Blue
      default:
        return "#3B82F6";
    }
  };

  const fluidColor = getFluidColor();
  const fillPct = Math.min(100, Math.max(10, Math.round((netSaleableLiters / (siloCapacityLiters || 1)) * 100)));

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-100 shadow-inner w-full">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Silo Tanker Batch Gauge & Flow Sankey
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full items-center">
        {/* Silo Gauge Graphic */}
        <div className="flex flex-col items-center justify-center relative h-[180px] bg-slate-950/60 rounded-xl p-2 border border-slate-800/80">
          <svg viewBox="0 0 140 160" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="siloFluidGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={fluidColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor={fluidColor} stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Silo Outer Capsule Structure */}
            <rect x="30" y="20" width="80" height="110" rx="20" fill="#0F172A" stroke="#475569" strokeWidth="2.5" />
            {/* Silo Top Cone Dome */}
            <path d="M 30 35 Q 70 10 110 35" fill="none" stroke="#64748B" strokeWidth="2" />
            {/* Silo Legs */}
            <line x1="40" y1="130" x2="35" y2="150" stroke="#64748B" strokeWidth="3" />
            <line x1="100" y1="130" x2="105" y2="150" stroke="#64748B" strokeWidth="3" />

            {/* Dynamic Liquid Level */}
            <rect
              x="33"
              y={130 - fillPct * 0.95}
              width="74"
              height={fillPct * 0.95}
              rx="6"
              fill="url(#siloFluidGrad)"
            />

            {/* Measurement Level Marks */}
            <line x1="110" y1="40" x2="118" y2="40" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="110" y1="70" x2="118" y2="70" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="110" y1="100" x2="118" y2="100" stroke="#94A3B8" strokeWidth="1.5" />
            <text x="122" y="73" fill="#94A3B8" fontSize="8" fontWeight="bold">
              {fillPct}%
            </text>
          </svg>

          <div className="text-[11px] font-bold text-slate-200 mt-1">
            Capacity: {siloCapacityLiters.toLocaleString()} L
          </div>
        </div>

        {/* Process Flow Diagram */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">1. Bulk Inflow:</span>
            <span className="font-bold text-blue-400">{siloCapacityLiters.toLocaleString()} Liters</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">2. Processing Loss:</span>
            <span className="font-bold text-amber-400">{(shrinkageLossPct * 100).toFixed(1)}% Shrinkage</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">3. Net Saleable:</span>
            <span className="font-bold text-emerald-400">{Math.round(netSaleableLiters).toLocaleString()} Liters</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">4. Usable Output:</span>
            <span className="font-bold text-cyan-400">{totalPacksProduced.toLocaleString()} Packs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
