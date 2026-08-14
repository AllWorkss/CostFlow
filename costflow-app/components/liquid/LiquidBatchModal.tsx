"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Droplets,
  Flame,
  Package,
  Zap,
  TrendingUp,
  CheckCircle,
  Plus,
  Trash2,
  Box,
} from "lucide-react";
import type {
  LiquidBatchConfig,
  FluidType,
  SKUAllocation,
} from "@/types/costing";
import {
  DEFAULT_LIQUID_BATCH_CONFIG,
  calculateLiquidBatchMetrics,
  calculateRawFluidPricePerLiter,
} from "@/lib/engine/liquidBatchEngine";
import { SiloTankerVisualizer } from "./SiloTankerVisualizer";
import { useCostingStore } from "@/lib/store/costingStore";

interface LiquidBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuccess?: () => void;
}

const FLUID_TYPES: { id: FluidType; label: string; icon: string }[] = [
  { id: "milk", label: "Dairy Milk (Fat/SNF)", icon: "🥛" },
  { id: "edible_oil", label: "Edible Oils (Mustard/Palm)", icon: "🛢️" },
  { id: "chemical", label: "Industrial Chemical / Acid", icon: "🧪" },
  { id: "beverage", label: "Beverage & Bottling", icon: "🧃" },
  { id: "custom_fluid", label: "Custom Bulk Fluid", icon: "💧" },
];

export function LiquidBatchModal({ isOpen, onClose, onApplySuccess }: LiquidBatchModalProps) {
  const store = useCostingStore();

  const [config, setConfig] = useState<LiquidBatchConfig>(
    store.liquidBatchConfig || DEFAULT_LIQUID_BATCH_CONFIG
  );

  const [activeTab, setActiveTab] = useState<"inflow" | "loss" | "sku" | "waterfall">("inflow");

  const metrics = calculateLiquidBatchMetrics(config);
  const rawFluidPricePerLiter = calculateRawFluidPricePerLiter(config);
  const currencySym = store.currency === "INR" ? "₹" : "$";

  const handleApplyToStore = () => {
    store.setLiquidBatchConfig(config, metrics);
    if (onApplySuccess) onApplySuccess();
    onClose();
  };

  const updateShrinkage = (key: keyof LiquidBatchConfig["shrinkage"], val: number) => {
    setConfig((prev) => ({
      ...prev,
      shrinkage: { ...prev.shrinkage, [key]: val },
    }));
  };

  const updateUtilities = (key: keyof LiquidBatchConfig["utilities"], val: number) => {
    setConfig((prev) => ({
      ...prev,
      utilities: { ...prev.utilities, [key]: val },
    }));
  };

  const updateSupplyChain = (key: keyof LiquidBatchConfig["supplyChain"], val: number) => {
    setConfig((prev) => ({
      ...prev,
      supplyChain: { ...prev.supplyChain, [key]: val },
    }));
  };

  const updateSKU = (id: string, key: keyof SKUAllocation, val: number | string) => {
    setConfig((prev) => ({
      ...prev,
      skus: prev.skus.map((sku) => (sku.id === id ? { ...sku, [key]: val } : sku)),
    }));
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
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Droplets size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Bulk Liquid, Chemical & Beverage Batch Engine
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase">
                    Amul Model
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Bulk Silo Capacity $\rightarrow$ Specific Gravity $\rightarrow$ Multi-Stage Shrinkage $\rightarrow$ Packaging BOM $\rightarrow$ MRP Waterfall
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

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
            {[
              { id: "inflow", label: "1. Silo & Fat/SNF Matrix", icon: Droplets },
              { id: "loss", label: "2. Shrinkage & Utilities", icon: Flame },
              { id: "sku", label: "3. SKU Split & Packaging BOM", icon: Package },
              { id: "waterfall", label: "4. MRP Price Waterfall", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-3 px-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${
                    activeTab === tab.id
                      ? "border-cyan-500 text-cyan-400 bg-cyan-950/30"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {/* TAB 1: SILO INFLOW & SPECIFIC GRAVITY */}
            {activeTab === "inflow" && (
              <div className="space-y-6">
                {/* Fluid Type Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Select Liquid Industry / Fluid Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {FLUID_TYPES.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setConfig({ ...config, fluidType: f.id })}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                          config.fluidType === f.id
                            ? "bg-cyan-600/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span className="text-xl">{f.icon}</span>
                        <span className="text-xs font-bold text-center leading-tight">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Controls Column */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="font-bold text-slate-200">Bulk Silo & Specific Gravity Parameters</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Bulk Silo Capacity (Liters)</label>
                          <input
                            type="number"
                            value={config.siloCapacityLiters}
                            onChange={(e) => setConfig({ ...config, siloCapacityLiters: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Specific Gravity (kg/L)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={config.specificGravity}
                            onChange={(e) => setConfig({ ...config, specificGravity: parseFloat(e.target.value) || 1.0 })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Total Inflow Weight (Kg)</label>
                          <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-cyan-400 font-mono font-bold">
                            {metrics.totalInputWeightKg.toLocaleString()} kg
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dairy Fat / SNF Calculator */}
                    {config.fluidType === "milk" && (
                      <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-blue-300">Amul Dairy Model — Fat % & SNF % Valuation</div>
                          <div className="text-xs text-blue-400 font-mono font-bold">
                            Raw Milk Cost: {currencySym} {rawFluidPricePerLiter.toFixed(2)} / Liter
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-slate-300 block mb-1">Fat % (e.g. 6.0%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={config.fatPct}
                              onChange={(e) => setConfig({ ...config, fatPct: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-slate-300 block mb-1">Rate / Kg Fat ({currencySym})</label>
                            <input
                              type="number"
                              value={config.fatRatePerKg}
                              onChange={(e) => setConfig({ ...config, fatRatePerKg: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-slate-300 block mb-1">SNF % (e.g. 9.0%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={config.snfPct}
                              onChange={(e) => setConfig({ ...config, snfPct: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-slate-300 block mb-1">Rate / Kg SNF ({currencySym})</label>
                            <input
                              type="number"
                              value={config.snfRatePerKg}
                              onChange={(e) => setConfig({ ...config, snfRatePerKg: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visualizer Column */}
                  <SiloTankerVisualizer
                    siloCapacityLiters={config.siloCapacityLiters}
                    netSaleableLiters={metrics.netSaleableLiters}
                    shrinkageLossPct={metrics.totalShrinkageLossPct}
                    fluidType={config.fluidType}
                    totalPacksProduced={metrics.totalPacksProducedAllSKUs}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: MULTI-STAGE SHRINKAGE & UTILITIES */}
            {activeTab === "loss" && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="font-bold text-slate-200">Multi-Stage Process Loss & Shrinkage Matrix</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Tanker Heel Residue %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.shrinkage.tankerHeelLossPct * 100}
                        onChange={(e) => updateShrinkage("tankerHeelLossPct", (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Thermal Pasteurization %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.shrinkage.thermalProcessingLossPct * 100}
                        onChange={(e) => updateShrinkage("thermalProcessingLossPct", (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Pipeline CIP Loss %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.shrinkage.pipelineCipLossPct * 100}
                        onChange={(e) => updateShrinkage("pipelineCipLossPct", (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Filling Leaker Rejection %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.shrinkage.fillingLeakerRejectionPct * 100}
                        onChange={(e) => updateShrinkage("fillingLeakerRejectionPct", (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="font-bold text-slate-200">Utilities & Direct Line Operator Labor</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Boiler Steam Fuel ({currencySym} / 1000L)</label>
                      <input
                        type="number"
                        value={config.utilities.steamBoilerFuelCostPerKl}
                        onChange={(e) => updateUtilities("steamBoilerFuelCostPerKl", parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Chilling Electricity ({currencySym} / 1000L)</label>
                      <input
                        type="number"
                        value={config.utilities.chillingRefrigerationCostPerKl}
                        onChange={(e) => updateUtilities("chillingRefrigerationCostPerKl", parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Cold Storage Holding ({currencySym} / Crate/Day)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.utilities.coldStorageCostPerCrateDay}
                        onChange={(e) => updateUtilities("coldStorageCostPerCrateDay", parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Operator Shift Wages ({currencySym})</label>
                      <input
                        type="number"
                        value={config.utilities.directLaborCostPerShift}
                        onChange={(e) => updateUtilities("directLaborCostPerShift", parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SKU SPLIT & PACKAGING BOM */}
            {activeTab === "sku" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200">SKU Batch Allocation & Packaging BOM</div>
                </div>

                <div className="space-y-3">
                  {config.skus.map((sku) => (
                    <div key={sku.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={sku.skuName}
                          onChange={(e) => updateSKU(sku.id, "skuName", e.target.value)}
                          className="font-bold text-sm bg-transparent border-none outline-none text-cyan-400"
                        />
                        <span className="text-xs text-slate-400">
                          Pack Size: <strong className="text-white">{sku.packSizeMl} ml</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div>
                          <label className="text-slate-400 block mb-1">Volume Split %</label>
                          <input
                            type="number"
                            step="5"
                            value={sku.volumeAllocationPct * 100}
                            onChange={(e) => updateSKU(sku.id, "volumeAllocationPct", (parseFloat(e.target.value) || 0) / 100)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">LDPE Film (Microns)</label>
                          <input
                            type="number"
                            value={sku.filmMicrons}
                            onChange={(e) => updateSKU(sku.id, "filmMicrons", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Film Roll ({currencySym} / Kg)</label>
                          <input
                            type="number"
                            value={sku.filmCostPerKg}
                            onChange={(e) => updateSKU(sku.id, "filmCostPerKg", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Crate Units (Cap)</label>
                          <input
                            type="number"
                            value={sku.crateCapacityUnits}
                            onChange={(e) => updateSKU(sku.id, "crateCapacityUnits", parseFloat(e.target.value) || 24)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Crate Cost ({currencySym} / Pack)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={sku.crateCostPerUnit}
                            onChange={(e) => updateSKU(sku.id, "crateCostPerUnit", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: SUPPLY CHAIN WATERFALL & MRP */}
            {activeTab === "waterfall" && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="font-bold text-slate-200">Supply Chain Waterfall Margins</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Freight / Reefer ({currencySym} / Pack)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.supplyChain.reeferLogisticsCostPerPack}
                        onChange={(e) => updateSupplyChain("reeferLogisticsCostPerPack", parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Super-Stockist Margin %</label>
                      <input
                        type="number"
                        step="0.5"
                        value={config.supplyChain.superStockistMarginPct * 100}
                        onChange={(e) => updateSupplyChain("superStockistMarginPct", (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Distributor Margin %</label>
                      <input
                        type="number"
                        step="0.5"
                        value={config.supplyChain.distributorMarginPct * 100}
                        onChange={(e) => updateSupplyChain("distributorMarginPct", (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Retailer Margin %</label>
                      <input
                        type="number"
                        step="0.5"
                        value={config.supplyChain.retailerMarginPct * 100}
                        onChange={(e) => updateSupplyChain("retailerMarginPct", (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* SKU Waterfall Output Matrix */}
                <div className="space-y-3">
                  <div className="font-bold text-slate-200">Ex-Factory to Retail Consumer MRP Waterfall Results</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {metrics.skuOutputs.map((sku) => (
                      <div key={sku.skuId} className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 border border-blue-500/30 text-xs space-y-2">
                        <div className="font-bold text-sm text-cyan-300 border-b border-slate-800 pb-1.5">
                          {sku.skuName}
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Output Packs:</span>
                          <span className="font-bold text-white">{sku.totalPacksProduced.toLocaleString()} pcs</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Raw Fluid Cost:</span>
                          <span className="font-mono text-slate-200">{currencySym} {sku.rawFluidCostPerPack.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Packaging BOM:</span>
                          <span className="font-mono text-slate-200">{currencySym} {sku.primaryFilmBomCostPerPack.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Ex-Factory Cost:</span>
                          <span className="font-bold text-blue-400">{currencySym} {sku.exFactoryCostPerPack.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Distributor Landing:</span>
                          <span className="font-mono text-cyan-400">{currencySym} {sku.distributorLandingPerPack.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                          <span className="font-bold text-slate-200">Consumer MRP:</span>
                          <span className="font-black text-emerald-400 text-sm">{currencySym} {sku.consumerMrpPerPack.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-20">
            <div className="text-xs text-slate-400">
              Applying will update Raw Material liquid cost to{" "}
              <strong className="text-cyan-400">
                {currencySym} {metrics.effectiveFluidCostPerLiter.toFixed(2)} / Liter
              </strong>{" "}
              in your costing sheet.
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
