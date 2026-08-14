import type {
  CostSheetVersionSnapshot,
  VersionDiffResult,
} from "@/types/costing";

/**
 * Compare two cost sheet version snapshots (vA vs vB) and compute side-by-side deltas & price/quantity attribution
 */
export function compareVersionSnapshots(
  vA: CostSheetVersionSnapshot,
  vB: CostSheetVersionSnapshot
): VersionDiffResult {
  const subtotalA = vA.summarySnapshot.subtotal;
  const subtotalB = vB.summarySnapshot.subtotal;
  const subtotalDelta = subtotalB - subtotalA;
  const subtotalDeltaPct = subtotalA > 0 ? (subtotalDelta / subtotalA) * 100 : 0;

  const sellingPriceDelta = vB.summarySnapshot.sellingPrice - vA.summarySnapshot.sellingPrice;
  const marginDriftPct = vB.summarySnapshot.marginPercent - vA.summarySnapshot.marginPercent;

  // Material Price Impact: (Price_B - Price_A) * Qty_A
  let materialPriceImpact = 0;
  // Quantity / Efficiency Impact: (Qty_B - Qty_A) * Price_B
  let quantityEfficiencyImpact = 0;

  const blockDeltas: VersionDiffResult["blockDeltas"] = [];

  const blocksA = vA.blocksSnapshot || [];
  const blocksB = vB.blocksSnapshot || [];

  // Map blocks by label or type
  const mapA = new Map(blocksA.map((b) => [b.label, b]));

  for (const blockB of blocksB) {
    const blockA = mapA.get(blockB.label);
    const costA = blockA?.result ?? 0;
    const costB = blockB.result ?? 0;
    const delta = costB - costA;
    const deltaPct = costA > 0 ? (delta / costA) * 100 : 0;

    blockDeltas.push({
      blockId: blockB.id,
      label: blockB.label,
      costA,
      costB,
      delta,
      deltaPct,
    });

    if (blockB.type === "raw_material" && blockA) {
      const priceVarA = blockA.variables.find((v) => v.id === "unitCost" || v.id === "rate")?.value ?? 0;
      const priceVarB = blockB.variables.find((v) => v.id === "unitCost" || v.id === "rate")?.value ?? 0;
      const qtyVarA = blockA.variables.find((v) => v.id === "qty" || v.id === "amount")?.value ?? 1;
      const qtyVarB = blockB.variables.find((v) => v.id === "qty" || v.id === "amount")?.value ?? 1;

      materialPriceImpact += (priceVarB - priceVarA) * qtyVarA;
      quantityEfficiencyImpact += (qtyVarB - qtyVarA) * priceVarB;
    }
  }

  return {
    versionA: vA,
    versionB: vB,
    subtotalDelta,
    subtotalDeltaPct,
    sellingPriceDelta,
    marginDriftPct,
    materialPriceImpact,
    quantityEfficiencyImpact,
    blockDeltas,
  };
}
