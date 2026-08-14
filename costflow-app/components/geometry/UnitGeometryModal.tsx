"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Layers,
  Settings,
  Scissors,
  Sparkles,
  ArrowRightLeft,
  CheckCircle,
  TrendingUp,
  Box,
} from "lucide-react";
import type {
  GeometryConfig,
  GeometricProfile,
  MaterialId,
  BuyUnit,
  SellUnit,
} from "@/types/costing";
import {
  MATERIAL_DENSITIES,
  calculateGeometryMetrics,
} from "@/lib/engine/geometryEngine";
import { ProfileSvgVisualizer } from "./ProfileSvgVisualizer";
import { useCostingStore } from "@/lib/store/costingStore";

interface UnitGeometryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuccess?: () => void;
}

const PROFILE_OPTIONS: { id: GeometricProfile; label: string; icon: string }[] = [
  { id: "round_bar", label: "Round Rod / Shaft", icon: "⭕" },
  { id: "hollow_pipe", label: "Hollow Tube / Pipe", icon: "⭕" },
  { id: "flat_bar", label: "Square / Flat Bar", icon: "⬛" },
  { id: "sheet_metal", label: "Sheet Metal / Plate", icon: "📄" },
  { id: "hex_rod", label: "Hexagonal Rod", icon: "⬡" },
];

const BUY_UNITS: { id: BuyUnit; label: string }[] = [
  { id: "kg", label: "₹ / Kg" },
  { id: "ton", label: "₹ / Metric Ton" },
  { id: "meter", label: "₹ / Meter" },
  { id: "sqft", label: "₹ / Sq.Ft" },
  { id: "sqm", label: "₹ / Sq.Meter" },
  { id: "piece", label: "₹ / Piece" },
];

const SELL_UNITS: { id: SellUnit; label: string }[] = [
  { id: "meter", label: "Per Meter" },
  { id: "piece", label: "Per Piece" },
  { id: "kg", label: "Per Kg" },
  { id: "inch", label: "Per Inch" },
  { id: "sqft", label: "Per Sq.Ft" },
  { id: "ton", label: "Per Ton" },
];

export function UnitGeometryModal({ isOpen, onClose, onApplySuccess }: UnitGeometryModalProps) {
  const store = useCostingStore();

  const [config, setConfig] = useState<GeometryConfig>(
    store.geometryConfig || {
      enabled: true,
      profile: "round_bar",
      materialId: "steel",
      customDensity_g_cm3: 7.85,
      dimensions: {
        diameter_mm: 50,
        outer_dia_mm: 60,
        inner_dia_mm: 50,
        width_mm: 100,
        thickness_mm: 10,
        across_flats_mm: 25,
        piece_length_mm: 500,
        stock_length_mm: 6000,
      },
      cutting: {
        kerf_mm: 3,
        scrapAllowancePct: 0.05,
        fixedScrapKg: 0,
      },
      secondaryProcessing: {
        finishCostPerMeter: 45,
        finishCostPerKg: 0,
        finishCostPerPiece: 0,
      },
      buyUnit: "kg",
      sellUnit: "meter",
      buyPricePerUnit: 80,
    }
  );

  const metrics = calculateGeometryMetrics(config);
  const currencySym = store.currency === "INR" ? "₹" : "$";
  const activeMaterial = MATERIAL_DENSITIES.find((m) => m.id === config.materialId);

  const updateDim = (key: keyof GeometryConfig["dimensions"], val: number) => {
    setConfig((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [key]: val },
    }));
  };

  const updateCut = (key: keyof GeometryConfig["cutting"], val: number) => {
    setConfig((prev) => ({
      ...prev,
      cutting: { ...prev.cutting, [key]: val },
    }));
  };

  const updateSec = (key: keyof GeometryConfig["secondaryProcessing"], val: number) => {
    setConfig((prev) => ({
      ...prev,
      secondaryProcessing: { ...prev.secondaryProcessing, [key]: val },
    }));
  };

  const handleApplyToStore = () => {
    store.setGeometryConfig(config, metrics);
    if (onApplySuccess) onApplySuccess();
    onClose();
  };

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
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Universal Cross-Dimensional Unit & Geometry Engine
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                    Live Formula
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Bi-directional conversion between Weight (Kg/Tons), Length (Meter/Foot/Inch), Area (Sq.Ft/Sq.M), and Finished Pieces
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

          {/* Body content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {/* SECTION 1: BUY / SELL UNIT SWITCHER & BUY PRICE */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-400" />
                  1. Bi-Directional Buy/Sell Unit Converter
                </div>
                <span className="text-xs text-slate-400">Input your buying metric and target selling metric</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Buy In */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Purchase Unit (Buy In)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BUY_UNITS.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setConfig({ ...config, buyUnit: u.id })}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xl border transition-all ${
                          config.buyUnit === u.id
                            ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                            : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purchase Price Input */}
                <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/30 text-center">
                  <label className="text-xs font-semibold text-blue-300 block mb-1">
                    Purchase Price ({currencySym} / {config.buyUnit})
                  </label>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg font-bold text-blue-400">{currencySym}</span>
                    <input
                      type="number"
                      value={config.buyPricePerUnit}
                      onChange={(e) => setConfig({ ...config, buyPricePerUnit: parseFloat(e.target.value) || 0 })}
                      className="w-32 text-center text-xl font-black bg-slate-900 border border-blue-500/50 rounded-xl px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {/* Sell In */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Target Pricing Unit (Sell In)</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SELL_UNITS.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setConfig({ ...config, sellUnit: u.id })}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-xl border transition-all ${
                          config.sellUnit === u.id
                            ? "bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/20"
                            : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PROFILE GEOMETRY & DENSITY MATRIX */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Shape & Material Picker */}
              <div className="lg:col-span-2 space-y-4">
                {/* Profile selection */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    2. Product Shape / Geometric Profile
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PROFILE_OPTIONS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setConfig({ ...config, profile: p.id })}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                          config.profile === p.id
                            ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xl">{p.icon}</span>
                        <span className="text-xs font-bold text-center leading-tight">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Material Density Selection */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Material Density Library
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MATERIAL_DENSITIES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setConfig({ ...config, materialId: m.id })}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          config.materialId === m.id
                            ? "bg-blue-600/20 border-blue-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="font-bold text-xs truncate">{m.name}</div>
                        <div className="text-[11px] text-blue-400 font-mono mt-0.5">
                          {m.id === "custom" ? `${config.customDensity_g_cm3} g/cm³` : `${m.density_g_cm3} g/cm³ (${m.density_kg_m3} kg/m³)`}
                        </div>
                      </button>
                    ))}
                  </div>

                  {config.materialId === "custom" && (
                    <div className="pt-2 flex items-center gap-3">
                      <label className="text-xs font-semibold text-slate-300">Custom Density Override (g/cm³):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={config.customDensity_g_cm3}
                        onChange={(e) => setConfig({ ...config, customDensity_g_cm3: parseFloat(e.target.value) || 0 })}
                        className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-white text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Profile Dimensions Input */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Dimensions Configurator
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {config.profile === "round_bar" && (
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Diameter (mm)</label>
                        <input
                          type="number"
                          value={config.dimensions.diameter_mm}
                          onChange={(e) => updateDim("diameter_mm", parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                        />
                      </div>
                    )}

                    {config.profile === "hollow_pipe" && (
                      <>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Outer Dia (mm)</label>
                          <input
                            type="number"
                            value={config.dimensions.outer_dia_mm}
                            onChange={(e) => updateDim("outer_dia_mm", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Inner Dia (mm)</label>
                          <input
                            type="number"
                            value={config.dimensions.inner_dia_mm}
                            onChange={(e) => updateDim("inner_dia_mm", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                          />
                        </div>
                      </>
                    )}

                    {(config.profile === "flat_bar" || config.profile === "sheet_metal") && (
                      <>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">
                            {config.profile === "sheet_metal" ? "Sheet Width (mm)" : "Width (mm)"}
                          </label>
                          <input
                            type="number"
                            value={config.dimensions.width_mm}
                            onChange={(e) => updateDim("width_mm", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Thickness (mm)</label>
                          <input
                            type="number"
                            value={config.dimensions.thickness_mm}
                            onChange={(e) => updateDim("thickness_mm", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                          />
                        </div>
                      </>
                    )}

                    {config.profile === "hex_rod" && (
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Across Flats (mm)</label>
                        <input
                          type="number"
                          value={config.dimensions.across_flats_mm}
                          onChange={(e) => updateDim("across_flats_mm", parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Cut Piece Length (mm)</label>
                      <input
                        type="number"
                        value={config.dimensions.piece_length_mm}
                        onChange={(e) => updateDim("piece_length_mm", parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Stock Bar Length (mm)</label>
                      <input
                        type="number"
                        value={config.dimensions.stock_length_mm}
                        onChange={(e) => updateDim("stock_length_mm", parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: 2D SVG Visualizer */}
              <div className="flex flex-col gap-4">
                <ProfileSvgVisualizer
                  profile={config.profile}
                  dimensions={config.dimensions}
                  materialName={activeMaterial?.name}
                  linearMassKgPerM={metrics.linearMassKgPerM}
                />

                {/* Stock Yield Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Box size={14} className="text-cyan-400" /> Stock Cut Yield & Loss Summary
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Stock Bar Length:</span>
                    <span className="font-mono text-slate-200">{config.dimensions.stock_length_mm} mm</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Yield Pieces / Stock:</span>
                    <span className="font-bold text-emerald-400">{metrics.yieldPiecesPerStock} pcs</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Saw Kerf Loss:</span>
                    <span className="font-mono text-amber-400">
                      {config.cutting.kerf_mm} mm/cut ({(metrics.kerfLossKgPerPiece * metrics.yieldPiecesPerStock).toFixed(2)} kg)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Leftover End-Bit:</span>
                    <span className="font-mono text-slate-300">
                      {metrics.endBitWasteLengthMm} mm ({metrics.endBitWasteKgPerStock.toFixed(2)} kg)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: CUTTING, SCRAP & SECONDARY PROCESSING */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <Scissors size={16} className="text-amber-400" />
                3. Saw Kerf, Scrap Allowance & Secondary Finishing Configurator
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Saw Blade Kerf Loss (mm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={config.cutting.kerf_mm}
                    onChange={(e) => updateCut("kerf_mm", parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Scrap Rate % (Allowance)</label>
                  <input
                    type="number"
                    step="1"
                    value={config.cutting.scrapAllowancePct * 100}
                    onChange={(e) => updateCut("scrapAllowancePct", (parseFloat(e.target.value) || 0) / 100)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Plating Charge ({currencySym} / Meter)</label>
                  <input
                    type="number"
                    value={config.secondaryProcessing.finishCostPerMeter}
                    onChange={(e) => updateSec("finishCostPerMeter", parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Grinding Charge ({currencySym} / Kg)</label>
                  <input
                    type="number"
                    value={config.secondaryProcessing.finishCostPerKg}
                    onChange={(e) => updateSec("finishCostPerKg", parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: CONVERTED PRICING MATRIX OUTPUT */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-cyan-950/30 border border-blue-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-2 text-base">
                  <Sparkles size={18} className="text-cyan-400" />
                  Calculated Cross-Metric Conversion Matrix
                </div>
                <div className="text-xs text-cyan-300 font-mono bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                  Target Pricing: {currencySym}{" "}
                  {(() => {
                    switch (config.sellUnit) {
                      case "meter": return metrics.totalCostPerMeter.toFixed(2);
                      case "piece": return metrics.totalCostPerPiece.toFixed(2);
                      case "kg": return metrics.totalCostPerKg.toFixed(2);
                      case "inch": return metrics.totalCostPerFoot ? (metrics.totalCostPerFoot / 12).toFixed(2) : (metrics.totalCostPerMeter / 39.37).toFixed(2);
                      case "sqft": return metrics.totalCostPerSqFt.toFixed(2);
                      case "ton": return metrics.totalCostPerTon.toFixed(0);
                      default: return metrics.totalCostPerMeter.toFixed(2);
                    }
                  })()}{" "}
                  / {config.sellUnit}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 mb-0.5">Cost per Meter</div>
                  <div className="text-base font-bold text-blue-400">
                    {currencySym} {metrics.totalCostPerMeter.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">/ linear m</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 mb-0.5">Cost per Foot</div>
                  <div className="text-base font-bold text-cyan-400">
                    {currencySym} {metrics.totalCostPerFoot.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">/ linear ft</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 mb-0.5">Cost per Piece</div>
                  <div className="text-base font-bold text-emerald-400">
                    {currencySym} {metrics.totalCostPerPiece.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">({metrics.massPerPieceKg.toFixed(2)} kg/pc)</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 mb-0.5">Cost per Kg</div>
                  <div className="text-base font-bold text-amber-400">
                    {currencySym} {metrics.totalCostPerKg.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">/ kg</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 mb-0.5">Cost per Metric Ton</div>
                  <div className="text-base font-bold text-purple-400">
                    {currencySym} {metrics.totalCostPerTon.toFixed(0)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">/ Ton</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 mb-0.5">Cost per Sq.Foot</div>
                  <div className="text-base font-bold text-rose-400">
                    {currencySym} {metrics.totalCostPerSqFt.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">/ sq.ft</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20">
            <div className="text-xs text-slate-400">
              Applying will update Raw Material cost to{" "}
              <strong className="text-blue-400">
                {currencySym} {metrics.totalCostPerMeter.toFixed(2)} / Meter
              </strong>{" "}
              in your costing model.
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost px-4 py-2 text-xs w-1/2 sm:w-auto justify-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyToStore}
                className="btn btn-primary px-6 py-2.5 text-xs w-1/2 sm:w-auto justify-center pulse-glow"
              >
                <CheckCircle size={15} /> Apply to Costing Sheet
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
