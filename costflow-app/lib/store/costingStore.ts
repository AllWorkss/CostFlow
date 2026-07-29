// ============================================================
// CostFlow — Zustand Global State Store
// ============================================================
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CostingBlock, Domain, CostingSummary } from "@/types/costing";
import { DOMAIN_PRESETS } from "@/lib/engine/domainPresets";
import { computeAllBlocks, calculateSummary } from "@/lib/engine/formulaEngine";
import { detectAnomalies, markBlockAnomalies } from "@/lib/ml/anomalyDetector";

let blockIdCounter = 1;
const genId = () => `block_${Date.now()}_${blockIdCounter++}`;

interface CostingStore {
  // State
  domain: Domain;
  blocks: CostingBlock[];
  summary: CostingSummary | null;
  currency: "INR" | "USD";
  projectName: string;
  companyName: string;
  targetMarginPct: number;
  isDirty: boolean;

  // Actions
  setDomain: (domain: Domain) => void;
  setProjectName: (name: string) => void;
  setCompanyName: (name: string) => void;
  setCurrency: (currency: "INR" | "USD") => void;
  setTargetMargin: (pct: number) => void;
  updateBlockVariable: (blockId: string, variableId: string, value: number) => void;
  toggleBlock: (blockId: string) => void;
  reorderBlocks: (blocks: CostingBlock[]) => void;
  deleteBlock: (blockId: string) => void;
  addCustomBlock: (label: string) => void;
  recompute: () => void;
  resetToPreset: () => void;
}

const defaultSummary: CostingSummary = {
  subtotal: 0, wastageAmount: 0, taxAmount: 0,
  profitAmount: 0, sellingPrice: 0, breakEvenUnits: 0,
  marginPercent: 0, costBreakdown: [],
};

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
      projectName: "New Costing Project",
      companyName: "",
      targetMarginPct: 0.25,
      isDirty: false,

      setDomain: (domain) => {
        const blocks = loadPresetBlocks(domain);
        set({ domain, blocks, isDirty: false });
        get().recompute();
      },

      setProjectName: (name) => set({ projectName: name }),
      setCompanyName: (name) => set({ companyName: name }),
      setCurrency: (currency) => set({ currency }),
      setTargetMargin: (pct) => {
        set({ targetMarginPct: pct });
        get().recompute();
      },

      updateBlockVariable: (blockId, variableId, value) => {
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

      reorderBlocks: (blocks) => set({ blocks, isDirty: true }),

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

      recompute: () => {
        const { blocks, targetMarginPct } = get();
        const computed = computeAllBlocks(blocks);
        const anomalies = detectAnomalies(computed);
        const markedBlocks = markBlockAnomalies(computed, anomalies);
        const summary = calculateSummary(computed, targetMarginPct);
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
      }),
    }
  )
);
