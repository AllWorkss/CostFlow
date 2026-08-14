// ============================================================
// CostFlow — Dynamic Formula Engine
// ============================================================
import type { CostingBlock, CostingVariable, MarginMode } from "@/types/costing";

/**
 * Safely evaluate a mathematical formula string with named variables.
 * E.g. formula = "qty * unitCost * (1 + scrapPct)"
 * vars = { qty: 50, unitCost: 120, scrapPct: 0.08 }
 */
export function evaluateFormula(formula: string, vars: Record<string, number>): number {
  try {
    // Build a safe expression evaluator using Function
    const varNames = Object.keys(vars);
    const varValues = Object.values(vars);
    // Only allow safe math characters
    const sanitized = formula.replace(/[^0-9a-zA-Z_+\-*/().%, ]/g, "");
    // eslint-disable-next-line no-new-func
    const fn = new Function(...varNames, `"use strict"; return (${sanitized});`);
    const result = fn(...varValues);
    return typeof result === "number" && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

/**
 * Build a variable map from a block's variables array
 */
export function buildVarMap(variables: CostingVariable[]): Record<string, number> {
  return Object.fromEntries(variables.map((v) => [v.id, v.value]));
}

/**
 * Compute a single block's result
 */
export function computeBlock(block: CostingBlock, extraVars?: Record<string, number>): number {
  const vars = { ...buildVarMap(block.variables), ...(extraVars ?? {}) };
  return evaluateFormula(block.formula, vars);
}

/**
 * Compute all enabled blocks in order, passing running totals as extra vars
 */
export function computeAllBlocks(blocks: CostingBlock[]): CostingBlock[] {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  let runningTotal = 0;
  const results: CostingBlock[] = [];

  for (const block of sorted) {
    if (!block.enabled) {
      results.push({ ...block, result: 0 });
      continue;
    }
    const extraVars: Record<string, number> = {
      subtotal: runningTotal,
      totalCost: runningTotal,
      materialCost: runningTotal,
      landedCost: runningTotal,
      sellingPrice: runningTotal * 1.3,
    };
    const result = computeBlock(block, extraVars);
    runningTotal += result;
    results.push({ ...block, result });
  }
  return results;
}

/**
 * Generate a human-readable formula description
 */
export function describeFormula(formula: string, vars: CostingVariable[]): string {
  let description = formula;
  for (const v of vars) {
    description = description.replace(
      new RegExp(`\\b${v.id}\\b`, "g"),
      `[${v.name}=${v.value}${v.unit ? " " + v.unit : ""}]`
    );
  }
  return description;
}

/**
 * Calculate cost summary from computed blocks
 */
export function calculateSummary(
  blocks: CostingBlock[],
  targetMarginPct = 0.25,
  marginMode: MarginMode = "markup_on_cost",
  batchMultiplier = 1,
  targetPriceSolverEnabled = false,
  targetSellingPrice = 0
): CostingSummary {
  const computed = computeAllBlocks(blocks);

  let materialCost = 0;
  let laborCost = 0;
  let overheadCost = 0;
  let wastageAmount = 0;
  let taxRate = 0.18;
  let taxAmount = 0;
  let profitAmount = 0;
  let rawMaterialQty = 1;

  for (const block of computed) {
    const r = block.result ?? 0;
    switch (block.type) {
      case "raw_material": {
        materialCost += r;
        const qtyVar = block.variables.find((v) => v.id === "qty" || v.id === "amount");
        if (qtyVar && qtyVar.value > 0) rawMaterialQty = qtyVar.value;
        break;
      }
      case "direct_labor":
        laborCost += r;
        break;
      case "variable_overhead":
      case "fixed_overhead":
      case "finishing":
      case "transport":
      case "packaging":
      case "custom":
        overheadCost += r;
        break;
      case "wastage":
        wastageAmount += r;
        break;
      case "tax_gst": {
        const gstVar = block.variables.find((v) => v.id === "gstRate");
        if (gstVar) taxRate = gstVar.value;
        taxAmount += r;
        break;
      }
      case "profit_markup":
        profitAmount += r;
        break;
    }
  }

  const directCosts = materialCost + wastageAmount + laborCost;
  const factoryOverheads = overheadCost;
  const subtotal = (directCosts + factoryOverheads) * batchMultiplier;

  // Margin Calculation
  let calculatedProfit = 0;
  if (marginMode === "margin_on_selling") {
    const denominator = Math.max(1 - targetMarginPct, 0.01);
    calculatedProfit = subtotal / denominator - subtotal;
  } else {
    calculatedProfit = subtotal * targetMarginPct;
  }
  profitAmount = profitAmount > 0 ? profitAmount * batchMultiplier : calculatedProfit;

  const calculatedTax = (subtotal + profitAmount) * taxRate;
  taxAmount = taxAmount > 0 ? taxAmount * batchMultiplier : calculatedTax;

  const sellingPrice = subtotal + profitAmount + taxAmount;
  const marginPercent = sellingPrice > 0 ? (profitAmount / sellingPrice) * 100 : 0;
  const breakEvenUnits = subtotal > 0 ? Math.ceil(subtotal / Math.max(sellingPrice - subtotal, 1)) : 0;

  // Reverse Target Price Solver (Back-calculate allowable Raw Material Unit Cost)
  let solvedRawMaterialUnitCost: number | undefined = undefined;
  if (targetPriceSolverEnabled && targetSellingPrice > 0) {
    let allowableSubtotal = 0;
    if (marginMode === "margin_on_selling") {
      allowableSubtotal = (targetSellingPrice * (1 - targetMarginPct)) / (1 + taxRate);
    } else {
      allowableSubtotal = targetSellingPrice / ((1 + taxRate) * (1 + targetMarginPct));
    }
    const allowableDirectCost =
      allowableSubtotal / Math.max(batchMultiplier, 1) - factoryOverheads - laborCost - wastageAmount;
    solvedRawMaterialUnitCost =
      allowableDirectCost > 0
        ? Math.round((allowableDirectCost / Math.max(rawMaterialQty, 0.001)) * 100) / 100
        : 0;
  }

  return {
    directCosts: directCosts * batchMultiplier,
    factoryOverheads: factoryOverheads * batchMultiplier,
    subtotal,
    wastageAmount: wastageAmount * batchMultiplier,
    taxAmount,
    profitAmount,
    sellingPrice,
    breakEvenUnits,
    marginPercent,
    marginMode,
    batchMultiplier,
    targetPriceSolverEnabled,
    targetSellingPrice,
    solvedRawMaterialUnitCost,
    costBreakdown: [
      { label: "Materials", value: materialCost * batchMultiplier, color: "#3B82F6" },
      { label: "Labor", value: laborCost * batchMultiplier, color: "#10B981" },
      { label: "Overhead", value: overheadCost * batchMultiplier, color: "#8B5CF6" },
      { label: "Wastage", value: wastageAmount * batchMultiplier, color: "#F59E0B" },
      { label: "Tax/GST", value: taxAmount, color: "#EF4444" },
      { label: "Profit", value: profitAmount, color: "#06B6D4" },
    ].filter((x) => x.value > 0),
  };
}
