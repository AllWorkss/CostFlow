// ============================================================
// CostFlow — Zustand Global State Store
// ============================================================
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CostingBlock,
  Domain,
  CostingSummary,
  GeometryConfig,
  GeometryMetrics,
  LiquidBatchConfig,
  LiquidBatchMetrics,
  UserRole,
  UserSession,
  CostingApprovalStatus,
  AuditLogEntry,
  OpexConfig,
  PayrollConfig,
  CompanyFinancialMetrics,
  MarginMode,
  ForexConfig,
  CommodityIndex,
  WhatIfScenarioConfig,
  ReverseTargetSolverConfig,
  CostSheetVersionSnapshot,
} from "@/types/costing";
import { DEFAULT_SPOT_RATES, DEFAULT_COMMODITY_INDICES } from "@/lib/engine/forexEngine";
import { DOMAIN_PRESETS } from "@/lib/engine/domainPresets";
import { computeAllBlocks, calculateSummary } from "@/lib/engine/formulaEngine";
import { detectAnomalies, markBlockAnomalies } from "@/lib/ml/anomalyDetector";
import { DEFAULT_GEOMETRY_CONFIG, calculateGeometryMetrics } from "@/lib/engine/geometryEngine";
import { DEFAULT_LIQUID_BATCH_CONFIG, calculateLiquidBatchMetrics } from "@/lib/engine/liquidBatchEngine";
import { DEFAULT_SUPER_ADMIN_SESSION, createAuditLogEntry } from "@/lib/auth/rbacEngine";
import { DEFAULT_OPEX_CONFIG, DEFAULT_PAYROLL_CONFIG, calculateCompanyFinancials, calculatePayrollMetrics } from "@/lib/engine/opexPayrollEngine";

let blockIdCounter = 1;
const genId = () => `block_${Date.now()}_${blockIdCounter++}`;

interface CostingStore {
  // State
  domain: Domain;
  blocks: CostingBlock[];
  summary: CostingSummary | null;
  currency: "INR" | "USD";
  projectId: string | null;
  projectName: string;
  companyName: string;
  targetMarginPct: number;
  isDirty: boolean;
  geometryConfig: GeometryConfig | null;
  geometryMetrics: GeometryMetrics | null;
  liquidBatchConfig: LiquidBatchConfig | null;
  liquidBatchMetrics: LiquidBatchMetrics | null;
  currentUser: UserSession;
  approvalStatus: CostingApprovalStatus;
  auditLogs: AuditLogEntry[];
  opexConfig: OpexConfig | null;
  payrollConfig: PayrollConfig | null;
  companyMetrics: CompanyFinancialMetrics | null;

  marginMode: MarginMode;
  batchMultiplier: number;
  targetPriceSolverEnabled: boolean;
  targetSellingPrice: number;

  forexConfig: ForexConfig;
  commodityIndices: CommodityIndex[];
  whatIfConfig: WhatIfScenarioConfig;
  reverseSolverConfig: ReverseTargetSolverConfig;
  savedVersions: CostSheetVersionSnapshot[];

  // Actions
  setDomain: (domain: Domain) => void;
  setProjectName: (name: string) => void;
  setCompanyName: (name: string) => void;
  setCurrency: (currency: "INR" | "USD") => void;
  setTargetMargin: (pct: number) => void;
  setMarginMode: (mode: MarginMode) => void;
  setBatchMultiplier: (mult: number) => void;
  setTargetPriceSolver: (enabled: boolean, targetSellingPrice?: number) => void;
  setForexConfig: (config: Partial<ForexConfig>) => void;
  setWhatIfConfig: (config: Partial<WhatIfScenarioConfig>) => void;
  setReverseSolverConfig: (config: Partial<ReverseTargetSolverConfig>) => void;
  saveVersionSnapshot: (versionName: string, notes?: string) => void;
  updateBlockVariable: (blockId: string, variableId: string, value: number) => void;
  toggleBlock: (blockId: string) => void;
  reorderBlocks: (blocks: CostingBlock[]) => void;
  deleteBlock: (blockId: string) => void;
  addCustomBlock: (label: string) => void;
  setGeometryConfig: (config: GeometryConfig, metrics: GeometryMetrics) => void;
  setLiquidBatchConfig: (config: LiquidBatchConfig, metrics: LiquidBatchMetrics) => void;
  setOpexConfig: (config: OpexConfig) => void;
  setPayrollConfig: (config: PayrollConfig) => void;
  setCurrentUserRole: (role: UserRole) => void;
  setApprovalStatus: (status: CostingApprovalStatus) => void;
  addAuditLog: (entry: AuditLogEntry) => void;
  loadProjectState: (projectId: string, data: any) => void;
  applyCopilotState: (data: any) => void;
  recompute: () => void;
  resetToPreset: () => void;
}

function loadPresetBlocks(domain: Domain): CostingBlock[] {
  const preset = DOMAIN_PRESETS.find((p) => p.id === domain);
  if (!preset) return [];
  return preset.blocks.map((b) => ({ ...b, id: genId() }));
}

export const useCostingStore = create<CostingStore>()(
  persist(
    (set, get) => ({
      domain: "manufacturing",
      blocks: loadPresetBlocks("manufacturing"),
      summary: null,
      currency: "INR",
      projectId: null,
      projectName: "New Costing Project",
      companyName: "",
      targetMarginPct: 0.25,
      isDirty: false,
      geometryConfig: DEFAULT_GEOMETRY_CONFIG,
      geometryMetrics: calculateGeometryMetrics(DEFAULT_GEOMETRY_CONFIG),
      liquidBatchConfig: DEFAULT_LIQUID_BATCH_CONFIG,
      liquidBatchMetrics: calculateLiquidBatchMetrics(DEFAULT_LIQUID_BATCH_CONFIG),
      currentUser: DEFAULT_SUPER_ADMIN_SESSION,
      approvalStatus: "draft",
      auditLogs: [],
      opexConfig: DEFAULT_OPEX_CONFIG,
      payrollConfig: DEFAULT_PAYROLL_CONFIG,
      companyMetrics: calculateCompanyFinancials(DEFAULT_OPEX_CONFIG, DEFAULT_PAYROLL_CONFIG, 150000, 0, 0.25),
      marginMode: "markup_on_cost",
      batchMultiplier: 1,
      targetPriceSolverEnabled: false,
      targetSellingPrice: 0,

      forexConfig: {
        baseCurrency: "INR",
        targetCurrency: "USD",
        hedgeBufferPct: 2.0,
        spotRates: DEFAULT_SPOT_RATES,
      },
      commodityIndices: DEFAULT_COMMODITY_INDICES,
      whatIfConfig: {
        rmPriceVolatilityPct: 0,
        scrapShiftPct: 0,
        inflationPct: 0,
        volumeDiscountScale: 1,
      },
      reverseSolverConfig: {
        targetPrice: 500,
        targetMarginPct: 0.25,
        lockedVariableIds: [],
      },
      savedVersions: [],

      setDomain: (domain) => {
        const blocks = loadPresetBlocks(domain);
        set({ domain, blocks, isDirty: false });
        get().recompute();
      },

      setProjectName: (name) => set({ projectName: name, isDirty: true }),
      setCompanyName: (name) => set({ companyName: name, isDirty: true }),
      setCurrency: (currency) => set({ currency, isDirty: true }),
      setTargetMargin: (pct) => {
        set({ targetMarginPct: pct, isDirty: true });
        get().recompute();
      },
      setMarginMode: (mode) => {
        set({ marginMode: mode, isDirty: true });
        get().recompute();
      },
      setBatchMultiplier: (mult) => {
        const batchMultiplier = Math.max(1, Math.round(mult));
        set({ batchMultiplier, isDirty: true });
        get().recompute();
      },
      setTargetPriceSolver: (enabled, price) => {
        set((state) => ({
          targetPriceSolverEnabled: enabled,
          targetSellingPrice: price !== undefined ? price : state.targetSellingPrice,
          isDirty: true,
        }));
        get().recompute();
      },
      setForexConfig: (cfg) => {
        set((state) => ({
          forexConfig: { ...state.forexConfig, ...cfg },
          isDirty: true,
        }));
        get().recompute();
      },
      setWhatIfConfig: (cfg) => {
        set((state) => ({
          whatIfConfig: { ...state.whatIfConfig, ...cfg },
          isDirty: true,
        }));
      },
      setReverseSolverConfig: (cfg) => {
        set((state) => ({
          reverseSolverConfig: { ...state.reverseSolverConfig, ...cfg },
          isDirty: true,
        }));
      },
      saveVersionSnapshot: (versionName, notes = "") => {
        const { blocks, summary, currency, currentUser, savedVersions } = get();
        if (!summary) return;
        const versionNumber = `v${savedVersions.length + 1}.0`;
        const newSnapshot: CostSheetVersionSnapshot = {
          id: `ver-${Date.now()}`,
          versionName: versionName || `Version ${versionNumber}`,
          versionNumber,
          timestamp: new Date().toLocaleString(),
          authorName: currentUser.name,
          authorRole: currentUser.role,
          notes,
          blocksSnapshot: JSON.parse(JSON.stringify(blocks)),
          summarySnapshot: JSON.parse(JSON.stringify(summary)),
          currencySnapshot: currency as any,
        };
        set({ savedVersions: [newSnapshot, ...savedVersions] });
      },

      updateBlockVariable: (blockId, variableId, value) => {
        const { blocks, currentUser } = get();
        const block = blocks.find((b) => b.id === blockId);
        const variable = block?.variables.find((v) => v.id === variableId);

        if (block && variable && variable.value !== value) {
          const auditEntry = createAuditLogEntry(
            currentUser,
            blockId,
            block.label,
            variableId,
            variable.name,
            variable.value,
            value
          );

          set((state) => ({
            isDirty: true,
            auditLogs: [auditEntry, ...state.auditLogs].slice(0, 50),
            blocks: state.blocks.map((b) =>
              b.id === blockId
                ? {
                    ...b,
                    variables: b.variables.map((v) =>
                      v.id === variableId ? { ...v, value } : v
                    ),
                  }
                : b
            ),
          }));
        } else {
          set((state) => ({
            isDirty: true,
            blocks: state.blocks.map((b) =>
              b.id === blockId
                ? {
                    ...b,
                    variables: b.variables.map((v) =>
                      v.id === variableId ? { ...v, value } : v
                    ),
                  }
                : b
            ),
          }));
        }
        get().recompute();
      },

      toggleBlock: (blockId) => {
        set((state) => ({
          isDirty: true,
          blocks: state.blocks.map((b) =>
            b.id === blockId ? { ...b, enabled: !b.enabled } : b
          ),
        }));
        get().recompute();
      },

      reorderBlocks: (blocks) => {
        const reordered = blocks.map((b, idx) => ({ ...b, order: idx }));
        set({ blocks: reordered, isDirty: true });
        get().recompute();
      },

      deleteBlock: (blockId) => {
        set((state) => ({
          isDirty: true,
          blocks: state.blocks.filter((b) => b.id !== blockId),
        }));
        get().recompute();
      },

      addCustomBlock: (label) => {
        const newBlock: CostingBlock = {
          id: genId(),
          type: "custom",
          label,
          enabled: true,
          order: get().blocks.length,
          variables: [{ id: "amount", name: "Amount (₹)", value: 0, unit: "₹" }],
          formula: "amount",
          excelFormula: "=B{r}",
          color: "#64748B",
          icon: "Plus",
          description: "Custom costing block",
        };
        set((state) => ({ blocks: [...state.blocks, newBlock], isDirty: true }));
        get().recompute();
      },

      setGeometryConfig: (config, metrics) => {
        set((state) => ({
          geometryConfig: config,
          geometryMetrics: metrics,
          isDirty: true,
          blocks: state.blocks.map((b) => {
            if (b.type === "raw_material") {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "unitCost" || v.id === "materialCostPerSqm" || v.id === "purchasePrice") {
                    return { ...v, value: Math.round(metrics.rawMaterialCostPerMeter * 100) / 100 };
                  }
                  if (v.id === "qty" && config.sellUnit === "meter") {
                    return { ...v, value: Math.round(metrics.linearMassKgPerM * 100) / 100 };
                  }
                  return v;
                }),
              };
            }
            if (b.type === "wastage") {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "scrapPct" || v.id === "yieldLossPct" || v.id === "spoilagePct") {
                    return { ...v, value: Math.round(metrics.scrapYieldLossPct) / 100 };
                  }
                  return v;
                }),
              };
            }
            if (b.type === "finishing") {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "finishCostPerMeter") {
                    return { ...v, value: config.secondaryProcessing.finishCostPerMeter };
                  }
                  return v;
                }),
              };
            }
            return b;
          }),
        }));
        get().recompute();
      },

      setLiquidBatchConfig: (config, metrics) => {
        const firstSku = metrics.skuOutputs[0];
        set((state) => ({
          liquidBatchConfig: config,
          liquidBatchMetrics: metrics,
          isDirty: true,
          blocks: state.blocks.map((b) => {
            if (b.type === "raw_material" && firstSku) {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "unitCost" || v.id === "purchasePrice" || v.id === "cogsCost") {
                    return { ...v, value: Math.round(firstSku.rawFluidCostPerPack * 100) / 100 };
                  }
                  return v;
                }),
              };
            }
            if (b.type === "packaging" && firstSku) {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "packagingCost") {
                    return { ...v, value: Math.round((firstSku.primaryFilmBomCostPerPack + firstSku.secondaryCrateCostPerPack) * 100) / 100 };
                  }
                  return v;
                }),
              };
            }
            if (b.type === "wastage") {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "scrapPct" || v.id === "spoilagePct" || v.id === "returnRate") {
                    return { ...v, value: Math.round(metrics.totalShrinkageLossPct * 100) / 100 };
                  }
                  return v;
                }),
              };
            }
            return b;
          }),
        }));
        get().recompute();
      },

      setOpexConfig: (config) => {
        const { payrollConfig, summary, targetMarginPct } = get();
        const metrics = calculateCompanyFinancials(
          config,
          payrollConfig || DEFAULT_PAYROLL_CONFIG,
          summary?.subtotal || 150000,
          0,
          targetMarginPct
        );
        set({ opexConfig: config, companyMetrics: metrics, isDirty: true });
        get().recompute();
      },

      setPayrollConfig: (config) => {
        const { opexConfig, summary, targetMarginPct } = get();
        const payroll = calculatePayrollMetrics(config);
        const metrics = calculateCompanyFinancials(
          opexConfig || DEFAULT_OPEX_CONFIG,
          config,
          summary?.subtotal || 150000,
          0,
          targetMarginPct
        );

        set((state) => ({
          payrollConfig: config,
          companyMetrics: metrics,
          isDirty: true,
          blocks: state.blocks.map((b) => {
            if (b.type === "direct_labor") {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "hourlyRate" || v.id === "laborCostPerSqm") {
                    return { ...v, value: Math.round(payroll.effectiveAverageHourlyCtc * 100) / 100 };
                  }
                  if (v.id === "laborHours" || v.id === "workers") {
                    return { ...v, value: payroll.totalAllocatedProjectHours };
                  }
                  return v;
                }),
              };
            }
            return b;
          }),
        }));
        get().recompute();
      },

      setCurrentUserRole: (role) => {
        set((state) => ({
          currentUser: { ...state.currentUser, role },
        }));
      },

      setApprovalStatus: (approvalStatus) => {
        set({ approvalStatus });
      },

      addAuditLog: (entry) => {
        set((state) => ({
          auditLogs: [entry, ...state.auditLogs].slice(0, 50),
        }));
      },

      loadProjectState: (projectId: string, data: any) => {
        set({
          projectId,
          projectName: data.projectName || "Untitled",
          domain: data.domain || "manufacturing",
          blocks: data.blocks || loadPresetBlocks("manufacturing"),
          currency: data.currency || "INR",
          companyName: data.companyName || "",
          targetMarginPct: data.targetMarginPct || 0.25,
          isDirty: false,
          geometryConfig: DEFAULT_GEOMETRY_CONFIG,
          geometryMetrics: calculateGeometryMetrics(DEFAULT_GEOMETRY_CONFIG),
          liquidBatchConfig: DEFAULT_LIQUID_BATCH_CONFIG,
          liquidBatchMetrics: calculateLiquidBatchMetrics(DEFAULT_LIQUID_BATCH_CONFIG),
          currentUser: DEFAULT_SUPER_ADMIN_SESSION,
          approvalStatus: "draft",
          auditLogs: [],
          opexConfig: DEFAULT_OPEX_CONFIG,
          companyMetrics: calculateCompanyFinancials(DEFAULT_OPEX_CONFIG, DEFAULT_PAYROLL_CONFIG, 150000, 0, 0.25),
        });
        get().recompute();
      },

      applyCopilotState: (data: any) => {
        if (!data) return;
        set((state) => {
          let nextMarginPct = state.targetMarginPct;
          if (data.profitMarkupPct !== undefined) {
            nextMarginPct = data.profitMarkupPct > 1 ? data.profitMarkupPct / 100 : data.profitMarkupPct;
          }

          const nextBlocks = state.blocks.map((b) => {
            if (b.type === "raw_material" && data.rawMaterialCost !== undefined) {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "unitCost" || v.id === "materialCostPerSqm" || v.id === "purchasePrice" || v.id === "cogsCost" || v.id === "amount") {
                    return { ...v, value: data.rawMaterialCost };
                  }
                  if (v.id === "qty" && data.rawMaterialQty !== undefined) {
                    return { ...v, value: data.rawMaterialQty };
                  }
                  return v;
                }),
              };
            }
            if (b.type === "wastage" && data.scrapPct !== undefined) {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "scrapPct" || v.id === "yieldLossPct" || v.id === "spoilagePct") {
                    return { ...v, value: data.scrapPct > 1 ? data.scrapPct / 100 : data.scrapPct };
                  }
                  return v;
                }),
              };
            }
            if (b.type === "direct_labor" && data.laborCost !== undefined) {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "hourlyRate" || v.id === "laborCostPerSqm" || v.id === "amount") {
                    return { ...v, value: data.laborCost };
                  }
                  return v;
                }),
              };
            }
            if (b.type === "finishing" && data.finishingCost !== undefined) {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "finishCostPerMeter" || v.id === "amount") {
                    return { ...v, value: data.finishingCost };
                  }
                  return v;
                }),
              };
            }
            if (b.type === "tax_gst" && data.taxGSTRate !== undefined) {
              return {
                ...b,
                variables: b.variables.map((v) => {
                  if (v.id === "gstRate" || v.id === "taxRate") {
                    return { ...v, value: data.taxGSTRate > 1 ? data.taxGSTRate / 100 : data.taxGSTRate };
                  }
                  return v;
                }),
              };
            }
            return b;
          });

          return {
            targetMarginPct: nextMarginPct,
            blocks: nextBlocks,
            targetPriceSolverEnabled: data.targetSellingPrice !== undefined ? true : state.targetPriceSolverEnabled,
            targetSellingPrice: data.targetSellingPrice !== undefined ? data.targetSellingPrice : state.targetSellingPrice,
            isDirty: true,
          };
        });

        get().recompute();
      },

      recompute: () => {
        const {
          blocks,
          targetMarginPct,
          marginMode,
          batchMultiplier,
          targetPriceSolverEnabled,
          targetSellingPrice,
        } = get();
        const computed = computeAllBlocks(blocks);
        const anomalies = detectAnomalies(computed);
        const markedBlocks = markBlockAnomalies(computed, anomalies);
        const summary = calculateSummary(
          markedBlocks,
          targetMarginPct,
          marginMode,
          batchMultiplier,
          targetPriceSolverEnabled,
          targetSellingPrice
        );
        set({ blocks: markedBlocks, summary });
      },

      resetToPreset: () => {
        const { domain } = get();
        const blocks = loadPresetBlocks(domain);
        set({ blocks, isDirty: false });
        get().recompute();
      },
    }),
    {
      name: "costflow-store",
      partialize: (state) => ({
        domain: state.domain,
        blocks: state.blocks,
        currency: state.currency,
        projectName: state.projectName,
        companyName: state.companyName,
        targetMarginPct: state.targetMarginPct,
        geometryConfig: state.geometryConfig,
        liquidBatchConfig: state.liquidBatchConfig,
        currentUser: state.currentUser,
        approvalStatus: state.approvalStatus,
      }),
    }
  )
);
