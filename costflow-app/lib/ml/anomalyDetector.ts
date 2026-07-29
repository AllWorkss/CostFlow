// ============================================================
// CostFlow — ML Anomaly Detector (IQR + Z-Score)
// ============================================================
import type { CostingBlock, AnomalyResult } from "@/types/costing";

/**
 * Historical baseline data for anomaly detection
 * These represent "typical" ranges for common costing variables
 */
const HISTORICAL_BASELINES: Record<string, { mean: number; stdDev: number; unit: string }> = {
  // Manufacturing
  unitCost: { mean: 100, stdDev: 40, unit: "₹/Kg" },
  qty: { mean: 50, stdDev: 30, unit: "Kg" },
  scrapPct: { mean: 0.07, stdDev: 0.03, unit: "%" },
  hourlyRate: { mean: 80, stdDev: 25, unit: "₹/hr" },
  laborHours: { mean: 8, stdDev: 2, unit: "hrs" },
  machineRate: { mean: 180, stdDev: 60, unit: "₹/hr" },
  // Retail
  purchasePrice: { mean: 75, stdDev: 30, unit: "₹/Kg" },
  spoilagePct: { mean: 0.05, stdDev: 0.02, unit: "%" },
  markupPct: { mean: 0.28, stdDev: 0.10, unit: "%" },
  // E-commerce
  cogsCost: { mean: 200, stdDev: 100, unit: "₹" },
  gatewayPct: { mean: 0.02, stdDev: 0.005, unit: "%" },
  cac: { mean: 100, stdDev: 50, unit: "₹" },
  returnRate: { mean: 0.08, stdDev: 0.04, unit: "%" },
  // School
  teacherSalary: { mean: 40000, stdDev: 15000, unit: "₹/mo" },
  studentsPerClass: { mean: 40, stdDev: 10, unit: "students" },
  // Construction
  materialCostPerSqm: { mean: 800, stdDev: 250, unit: "₹/sq.m" },
  yieldLossPct: { mean: 0.10, stdDev: 0.04, unit: "%" },
  laborCostPerSqm: { mean: 200, stdDev: 80, unit: "₹/sq.m" },
};

function getZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return Math.abs((value - mean) / stdDev);
}

function getSeverity(zScore: number): "low" | "medium" | "high" {
  if (zScore > 3) return "high";
  if (zScore > 2) return "medium";
  return "low";
}

export function detectAnomalies(blocks: CostingBlock[]): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];

  for (const block of blocks) {
    if (!block.enabled) continue;
    for (const variable of block.variables) {
      const baseline = HISTORICAL_BASELINES[variable.id];
      if (!baseline) continue;

      const zScore = getZScore(variable.value, baseline.mean, baseline.stdDev);
      if (zScore > 2) {
        const severity = getSeverity(zScore);
        const direction = variable.value > baseline.mean ? "above" : "below";
        anomalies.push({
          blockId: block.id,
          variableId: variable.id,
          value: variable.value,
          mean: baseline.mean,
          stdDev: baseline.stdDev,
          zScore,
          severity,
          message: `"${variable.name}" is ${direction} the typical range. Expected ~${baseline.mean} ${baseline.unit}, got ${variable.value} ${baseline.unit ?? ""} (${zScore.toFixed(1)}σ deviation).`,
        });
      }
    }
  }
  return anomalies;
}

export function markBlockAnomalies(
  blocks: CostingBlock[],
  anomalies: AnomalyResult[]
): CostingBlock[] {
  const anomalyMap = new Map<string, AnomalyResult>();
  for (const a of anomalies) {
    anomalyMap.set(`${a.blockId}:${a.variableId}`, a);
  }

  return blocks.map((block) => {
    const blockAnomalies = anomalies.filter((a) => a.blockId === block.id);
    return {
      ...block,
      isAnomalous: blockAnomalies.length > 0,
      anomalyReason: blockAnomalies.map((a) => a.message).join(" | "),
    };
  });
}

export function computePriceRecommendation(
  totalCost: number,
  targetMarginPct: number,
  fixedCosts: number,
  volume: number
) {
  const recommendedPrice = totalCost / (1 - targetMarginPct);
  const breakEvenPrice = fixedCosts / Math.max(volume, 1) + (totalCost - fixedCosts / Math.max(volume, 1));
  const optimalPrice = (recommendedPrice + breakEvenPrice) / 2;

  return {
    targetMargin: targetMarginPct,
    recommendedPrice,
    breakEvenPrice,
    optimalPrice,
    priceRange: { min: breakEvenPrice * 1.05, max: recommendedPrice * 1.2 },
    elasticityScore: Math.min(10, (targetMarginPct / 0.25) * 7),
  };
}
