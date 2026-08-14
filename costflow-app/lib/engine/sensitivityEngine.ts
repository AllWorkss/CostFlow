import type {
  CostingBlock,
  CostingSummary,
  WhatIfScenarioConfig,
  ScenarioResultMetrics,
  WhatIfComparisonResult,
} from "@/types/costing";
import { computeAllBlocks, calculateSummary } from "./formulaEngine";

/**
 * Compute scenario metrics based on stress multipliers
 */
function computeScenario(
  baseBlocks: CostingBlock[],
  rmVolPct: number,
  scrapShiftPct: number,
  inflationPct: number,
  volumeScale: number,
  targetMarginPct = 0.25,
  label: string
): ScenarioResultMetrics {
  // Deep clone blocks to simulate shift
  const modifiedBlocks: CostingBlock[] = baseBlocks.map((block) => {
    const updatedVars = block.variables.map((v) => {
      let val = v.value;

      // Apply raw material volatility
      if (block.type === "raw_material" && (v.id === "unitCost" || v.id === "rate")) {
        val = val * (1 + rmVolPct / 100);
      }

      // Apply scrap rate shift
      if (block.type === "wastage" || v.id === "scrapPct" || v.id === "wastagePct") {
        val = Math.max(0, val + scrapShiftPct / 100);
      }

      // Apply labor & utility inflation
      if (
        (block.type === "direct_labor" || block.type === "variable_overhead" || block.type === "fixed_overhead") &&
        (v.id === "rate" || v.id === "powerRate" || v.id === "hourlyRate")
      ) {
        val = val * (1 + inflationPct / 100);
      }

      return { ...v, value: val };
    });

    return { ...block, variables: updatedVars };
  });

  const computed = computeAllBlocks(modifiedBlocks);
  const summary = calculateSummary(
    computed,
    targetMarginPct,
    "markup_on_cost",
    volumeScale,
    false,
    0
  );

  const totalQty = Math.max(volumeScale, 1);
  const directCosts = summary.directCosts;
  const factoryOverheads = summary.factoryOverheads;
  const subtotal = summary.subtotal;
  const sellingPrice = summary.sellingPrice;
  const profitAmount = summary.profitAmount;
  const marginPercent = summary.marginPercent;

  // Breakeven calculation: Breakeven Unit Price = (Direct Costs + Allocated Fixed OPEX) / (1 - Scrap Shift)
  const scrapFactor = Math.max(1 - Math.max(scrapShiftPct / 100, 0), 0.05);
  const breakevenUnitPrice = (subtotal / totalQty) / scrapFactor;
  const breakevenUnits = summary.breakEvenUnits;

  return {
    label,
    directCosts,
    factoryOverheads,
    subtotal,
    sellingPrice,
    profitAmount,
    marginPercent,
    breakevenUnits,
    breakevenUnitPrice,
  };
}

/**
 * Perform 3-Column Parallel Comparison (Worst-Case, Expected-Case, Best-Case)
 */
export function runWhatIfStressTest(
  baseBlocks: CostingBlock[],
  config: WhatIfScenarioConfig,
  targetMarginPct = 0.25
): WhatIfComparisonResult {
  // Expected Case (Active Baseline)
  const expectedCase = computeScenario(
    baseBlocks,
    config.rmPriceVolatilityPct,
    config.scrapShiftPct,
    config.inflationPct,
    config.volumeDiscountScale,
    targetMarginPct,
    "Expected Case (Baseline)"
  );

  // Worst Case (Max Material Surge + Peak Scrap + High Inflation + Low Volume)
  const worstCase = computeScenario(
    baseBlocks,
    Math.min(config.rmPriceVolatilityPct + 25, 50),
    Math.min(config.scrapShiftPct + 10, 20),
    Math.min(config.inflationPct + 15, 30),
    Math.max(config.volumeDiscountScale * 0.75, 0.5),
    targetMarginPct,
    "Worst Case (Stress)"
  );

  // Best Case (Optimal Procurement + Low Scrap + Volume Discount)
  const bestCase = computeScenario(
    baseBlocks,
    Math.max(config.rmPriceVolatilityPct - 15, -30),
    0,
    Math.max(config.inflationPct - 5, -10),
    config.volumeDiscountScale * 1.5,
    targetMarginPct,
    "Best Case (Optimized)"
  );

  // Calculate Risk Volatility Score (0 - 100)
  const priceSpreadPct =
    expectedCase.sellingPrice > 0
      ? Math.abs((worstCase.sellingPrice - bestCase.sellingPrice) / expectedCase.sellingPrice) * 100
      : 0;

  let riskVolatilityIndex: "LOW" | "MODERATE" | "HIGH" = "LOW";
  if (priceSpreadPct > 35) riskVolatilityIndex = "HIGH";
  else if (priceSpreadPct > 18) riskVolatilityIndex = "MODERATE";

  return {
    worstCase,
    expectedCase,
    bestCase,
    riskVolatilityIndex,
    riskScore: Math.min(Math.round(priceSpreadPct * 1.5), 100),
  };
}
