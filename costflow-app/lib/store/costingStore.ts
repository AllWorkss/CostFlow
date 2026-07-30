// ============================================================
// CostFlow — Zustand Global State Store
// ============================================================
"use client";

import { create } from "zustand";
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
  projectId: string | null;
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
  loadProjectState: (projectId: string, state: any) => void;
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

export const useCostingStore = create<CostingStore>()((set, get) => ({
  domain: "manufacturing",
  blocks: loadPresetBlocks("manufacturing"),
  summary: null,
  currency: "INR",
  projectId: null,
  projectName: "New Costing Project",
  companyName: "",
  targetMarginPct: 0.25,
  isDirty: false,

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
    });
    get().recompute();
  },
}));
