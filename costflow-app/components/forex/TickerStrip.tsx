"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Globe,
  Sliders,
  DollarSign,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { useCostingStore } from "@/lib/store/costingStore";
import type { SupportedCurrency } from "@/types/costing";

export function TickerStrip() {
  const { currency, setCurrency, forexConfig, setForexConfig, commodityIndices } = useCostingStore();
  const [showConfigModal, setShowConfigModal] = useState(false);

  const currencies: SupportedCurrency[] = ["INR", "USD", "AED", "EUR", "GBP"];

  return (
    <>
      {/* Ticker Bar */}
      <div className="bg-slate-950 text-slate-200 border-b border-slate-800 text-xs py-1.5 px-3 sm:px-6 overflow-hidden flex items-center justify-between select-none">
        {/* Left Badge */}
        <div className="flex items-center gap-2 flex-shrink-0 mr-4">
          <span className="flex items-center gap-1 font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
            LIVE MARKETS
          </span>

          {/* Quick Currency Selector */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
            <Globe size={12} className="text-slate-400" />
            {currencies.map((curr) => (
              <button
                key={curr}
                onClick={() => setCurrency(curr as any)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                  currency === curr
                    ? "bg-blue-600 text-white font-mono shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        {/* Scrolling Marquee / Ticker List */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-6 whitespace-nowrap py-0.5">
          {commodityIndices.map((item) => {
            const isPos = item.change24h >= 0;
            return (
              <div key={item.id} className="flex items-center gap-1.5 font-mono text-[11px] flex-shrink-0">
                <span className="font-semibold text-slate-300">{item.name}:</span>
                <span className="font-bold text-white">
                  {item.unit.startsWith("₹") || item.unit.startsWith("$") ? "" : item.unit} {item.price}
                </span>
                <span
                  className={`flex items-center text-[10px] font-bold px-1 rounded ${
                    isPos ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                  }`}
                >
                  {isPos ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                  {isPos ? "+" : ""}
                  {item.change24h}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Forex Buffer Config Trigger */}
        <button
          onClick={() => setShowConfigModal(true)}
          className="ml-4 flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
        >
          <Sliders size={12} />
          <span>Hedge Buffer: +{forexConfig.hedgeBufferPct}%</span>
        </button>
      </div>

      {/* Forex Hedge Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-5 max-w-md w-full bg-slate-900 border-slate-800 text-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2 text-blue-400">
                <ShieldAlert size={16} /> Export Forex Risk & Hedge Config
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Forex Volatility Buffer (%):
              </label>
              <input
                type="number"
                step={0.5}
                min={0}
                max={15}
                value={forexConfig.hedgeBufferPct}
                onChange={(e) => setForexConfig({ hedgeBufferPct: parseFloat(e.target.value) || 0 })}
                className="cf-input py-1.5 text-xs font-mono font-bold text-blue-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Adds a protective margin buffer over spot rates to insulate international export quotations against currency swings.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-300">Live Spot Reference:</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <div>1 USD = 83.50 INR</div>
                <div>1 EUR = 90.75 INR</div>
                <div>1 AED = 22.73 INR</div>
                <div>1 GBP = 105.70 INR</div>
              </div>
            </div>

            <button
              onClick={() => setShowConfigModal(false)}
              className="btn btn-primary w-full text-xs py-2 justify-center"
            >
              Apply Hedge Buffer
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
