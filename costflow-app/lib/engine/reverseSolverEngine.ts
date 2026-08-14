import type {
  CostingBlock,
  CostingSummary,
  ReverseTargetSolverConfig,
  ReverseTargetSolverResult,
} from "@/types/costing";
import { computeAllBlocks } from "./formulaEngine";

/**
 * Solves costing backwards from customer-mandated target purchase price P_target
 */
export function solveReverseTargetCosting(
  blocks: CostingBlock[],
  config: ReverseTargetSolverConfig,
  gstRate = 18,
  batchMultiplier = 1
): ReverseTargetSolverResult {
  const computed = computeAllBlocks(blocks);

  let totalLaborCost = 0;
  let totalOverheadCost = 0;
  let totalWastageCost = 0;
  let totalFinishingCost = 0;
  let rawMaterialQty = 1;
  let rawMaterialCurrentCost = 0;

  for (const block of computed) {
    const res = block.result ?? 0;
    switch (block.type) {
      case "raw_material": {
        rawMaterialCurrentCost += res;
        const qtyVar = block.variables.find((v) => v.id === "qty" || v.id === "amount");
        if (qtyVar && qtyVar.value > 0) rawMaterialQty = qtyVar.value;
        break;
      }
      case "direct_labor":
        totalLaborCost += res;
        break;
      case "variable_overhead":
      case "fixed_overhead":
        totalOverheadCost += res;
        break;
      case "finishing":
      case "transport":
      case "packaging":
        totalFinishingCost += res;
        break;
      case "wastage":
        totalWastageCost += res;
        break;
    }
  }

  const P_target = config.targetPrice;
  const M_target = config.targetMarginPct;

  // Max Allowable Subtotal = P_target / ((1 + GST%) * (1 + Margin%))
  const allowableSubtotalWithTax = P_target / (1 + gstRate / 100);
  const allowableSubtotal = allowableSubtotalWithTax * (1 - M_target);

  // Subtract non-material costs (Labor, Overheads, Scrap, Finishing)
  const allowableDirectMaterialCost =
    allowableSubtotal / Math.max(batchMultiplier, 1) -
    totalLaborCost -
    totalOverheadCost -
    totalWastageCost -
    totalFinishingCost;

  // Calculate Max Allowable Raw Material Rate (₹/kg or ₹/meter)
  const maxAllowableRmRate =
    allowableDirectMaterialCost > 0
      ? Math.round((allowableDirectMaterialCost / Math.max(rawMaterialQty, 0.001)) * 100) / 100
      : 0;

  // Calculate Max Allowable Production Cycle Time (Hours/Piece assuming average ₹250/hr labor rate)
  const avgHourlyLaborRate = 250;
  const allowableLaborBudget = allowableSubtotal - rawMaterialCurrentCost - totalOverheadCost;
  const maxAllowableCycleTimeHours =
    allowableLaborBudget > 0
      ? Math.round((allowableLaborBudget / avgHourlyLaborRate) * 10) / 10
      : 0;

  // Determine Feasibility Status
  let feasibilityStatus: "VIABLE" | "TIGHT" | "UNFEASIBLE" = "VIABLE";
  if (allowableDirectMaterialCost < 0) {
    feasibilityStatus = "UNFEASIBLE";
  } else if (allowableDirectMaterialCost < rawMaterialCurrentCost * 0.85) {
    feasibilityStatus = "TIGHT";
  }

  // Generate Actionable Recommendations
  const recommendations: string[] = [];
  if (feasibilityStatus === "UNFEASIBLE") {
    recommendations.push(
      `Target price ${P_target} is lower than non-material overheads. Reduce labor or overhead burden by ${Math.round(
        Math.abs(allowableDirectMaterialCost)
      )}.`
    );
  } else if (feasibilityStatus === "TIGHT") {
    const requiredRmPriceDrop = Math.round(
      ((rawMaterialCurrentCost - allowableDirectMaterialCost) / Math.max(rawMaterialCurrentCost, 1)) * 100
    );
    recommendations.push(
      `Procure raw material below ${maxAllowableRmRate}/unit (a ${requiredRmPriceDrop}% price reduction required).`
    );
    recommendations.push(
      `Alternatively, reduce cycle time by ${Math.round(
        maxAllowableCycleTimeHours * 15
      )} minutes per unit.`
    );
  } else {
    recommendations.push(
      `Target price of ${P_target} is fully viable with a target raw material ceiling of ${maxAllowableRmRate}/unit.`
    );
  }

  return {
    targetPrice: P_target,
    targetMarginPct: M_target,
    allowableSubtotal,
    allowableDirectMaterialCost: Math.max(allowableDirectMaterialCost, 0),
    maxAllowableRmRate,
    maxAllowableCycleTimeHours,
    feasibilityStatus,
    recommendations,
  };
}
