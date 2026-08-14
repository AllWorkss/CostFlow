// ============================================================
// CostFlow — Bulk Liquid, Chemical & Beverage Batch Engine
// ============================================================

import type {
  LiquidBatchConfig,
  LiquidBatchMetrics,
  SKUOutputMetrics,
  FluidType,
} from "@/types/costing";

export const DEFAULT_LIQUID_BATCH_CONFIG: LiquidBatchConfig = {
  enabled: true,
  batchName: "Dairy Plant Silo - Standardized Milk Batch",
  fluidType: "milk",
  siloCapacityLiters: 50000,
  specificGravity: 1.032,
  fatPct: 6.0,
  snfPct: 9.0,
  fatRatePerKg: 420,
  snfRatePerKg: 280,
  liquidPricePerLiter: 48.5,
  shrinkage: {
    tankerHeelLossPct: 0.002,         // 0.2%
    thermalProcessingLossPct: 0.008,   // 0.8%
    pipelineCipLossPct: 0.003,        // 0.3%
    fillingLeakerRejectionPct: 0.015, // 1.5%
    overfillBufferMlPerPack: 2,       // +2ml safety buffer per pouch
  },
  skus: [
    {
      id: "sku_500ml_pouch",
      skuName: "500ml Standard Pouch",
      packSizeMl: 500,
      volumeAllocationPct: 0.60,
      filmMicrons: 55,
      filmCostPerKg: 180,
      capCostPerUnit: 0,
      crateCapacityUnits: 24,
      crateCostPerUnit: 2.4, // Amortized crate cost per pack
    },
    {
      id: "sku_1000ml_bottle",
      skuName: "1000ml (1L) PET Bottle",
      packSizeMl: 1000,
      volumeAllocationPct: 0.30,
      filmMicrons: 0,
      filmCostPerKg: 0,
      capCostPerUnit: 0.65,
      crateCapacityUnits: 12,
      crateCostPerUnit: 4.8,
    },
    {
      id: "sku_200ml_pouch",
      skuName: "200ml Small Pouch",
      packSizeMl: 200,
      volumeAllocationPct: 0.10,
      filmMicrons: 45,
      filmCostPerKg: 180,
      capCostPerUnit: 0,
      crateCapacityUnits: 48,
      crateCostPerUnit: 1.2,
    },
  ],
  utilities: {
    steamBoilerFuelCostPerKl: 120,      // ₹120 per 1000L
    chillingRefrigerationCostPerKl: 210, // ₹210 per 1000L
    coldStorageCostPerCrateDay: 0.50,   // ₹0.50 per crate/day
    directLaborCostPerShift: 12000,     // ₹12,000 shift wages
  },
  supplyChain: {
    reeferLogisticsCostPerPack: 0.75,   // Freight per pack
    superStockistMarginPct: 0.03,       // 3%
    distributorMarginPct: 0.05,         // 5%
    retailerMarginPct: 0.10,            // 10%
  },
};

/**
 * Calculate fluid price per liter based on Fluid Type & Dairy Fat/SNF Formula
 */
export function calculateRawFluidPricePerLiter(config: LiquidBatchConfig): number {
  if (config.fluidType === "milk") {
    // Dairy Fat/SNF Valuation: Price/L = SpecificGravity * ((Fat% / 100) * FatRate + (SNF% / 100) * SNFRate)
    const sg = config.specificGravity || 1.032;
    const fatVal = (config.fatPct / 100) * config.fatRatePerKg;
    const snfVal = (config.snfPct / 100) * config.snfRatePerKg;
    return sg * (fatVal + snfVal);
  }
  return config.liquidPricePerLiter || 45.0;
}

/**
 * Compute complete liquid batch metrics, SKU outputs, and price waterfall
 */
export function calculateLiquidBatchMetrics(config: LiquidBatchConfig): LiquidBatchMetrics {
  const sg = Math.max(0.5, config.specificGravity || 1.032);
  const siloVolLiters = Math.max(1, config.siloCapacityLiters || 50000);
  const totalInputWeightKg = siloVolLiters * sg;

  // Multi-stage shrinkage calculation
  const s = config.shrinkage;
  const totalShrinkageLossPct =
    (s.tankerHeelLossPct || 0) +
    (s.thermalProcessingLossPct || 0) +
    (s.pipelineCipLossPct || 0) +
    (s.fillingLeakerRejectionPct || 0);

  const totalShrinkageLossLiters = siloVolLiters * totalShrinkageLossPct;
  const netSaleableLiters = Math.max(0, siloVolLiters * (1 - totalShrinkageLossPct));

  const rawFluidPricePerLiter = calculateRawFluidPricePerLiter(config);
  const effectiveFluidCostPerLiter = rawFluidPricePerLiter / Math.max(0.01, 1 - totalShrinkageLossPct);

  // First pass: Calculate total estimated packs across all SKUs for labor allocation
  let estimatedTotalPacks = 0;
  config.skus.forEach((sku) => {
    const skuAllocLiters = netSaleableLiters * (sku.volumeAllocationPct || 0);
    const effectivePackVolumeL = (sku.packSizeMl + (s.overfillBufferMlPerPack || 0)) / 1000;
    if (effectivePackVolumeL > 0) {
      estimatedTotalPacks += Math.floor(skuAllocLiters / effectivePackVolumeL);
    }
  });

  const totalPacksAll = Math.max(1, estimatedTotalPacks);
  const laborCostPerPack = (config.utilities.directLaborCostPerShift || 0) / totalPacksAll;

  // Second pass: Calculate detailed SKU outputs and packaging BOM
  const skuOutputs: SKUOutputMetrics[] = config.skus.map((sku) => {
    const allocatedLiters = netSaleableLiters * (sku.volumeAllocationPct || 0);
    const packSizeL = sku.packSizeMl / 1000;
    const effectivePackVolumeL = (sku.packSizeMl + (s.overfillBufferMlPerPack || 0)) / 1000;

    const packsProduced = effectivePackVolumeL > 0
      ? Math.floor(allocatedLiters / effectivePackVolumeL)
      : 0;

    // Raw Fluid Cost per Pack (including overfill & shrinkage)
    const rawFluidCostPerPack = effectivePackVolumeL * effectiveFluidCostPerLiter;

    // Primary Film BOM Cost per Pouch / Bottle
    let primaryFilmBomCostPerPack = sku.capCostPerUnit || 0;
    if (sku.filmMicrons > 0 && sku.filmCostPerKg > 0) {
      // 500ml pouch surface area ~ 360 cm²; 1000ml ~ 580 cm²; 200ml ~ 220 cm²
      const surfaceAreaCm2 = sku.packSizeMl >= 1000 ? 580 : sku.packSizeMl >= 500 ? 360 : 220;
      // Film Weight in grams = Area * (Microns / 10,000) * 0.92 g/cm³ LDPE density
      const filmWeightGrams = surfaceAreaCm2 * (sku.filmMicrons / 10000) * 0.92;
      primaryFilmBomCostPerPack += (filmWeightGrams / 1000) * sku.filmCostPerKg;
    }

    // Secondary Crate / Carton Cost per Pack
    const crateCap = Math.max(1, sku.crateCapacityUnits || 24);
    const secondaryCrateCostPerPack = (sku.crateCostPerUnit || 0) / crateCap;

    // Utility Cost per Pack (Boiler steam + Chilling electricity + Cold storage)
    const utilPerLiter = ((config.utilities.steamBoilerFuelCostPerKl || 0) + (config.utilities.chillingRefrigerationCostPerKl || 0)) / 1000;
    const coldStoragePerPack = (config.utilities.coldStorageCostPerCrateDay || 0) / crateCap;
    const utilityCostPerPack = (packSizeL * utilPerLiter) + coldStoragePerPack;

    // Ex-Factory Cost per Pack
    const exFactoryCostPerPack =
      rawFluidCostPerPack +
      primaryFilmBomCostPerPack +
      secondaryCrateCostPerPack +
      utilityCostPerPack +
      laborCostPerPack;

    // Supply Chain Price Waterfall
    const sc = config.supplyChain;
    const freight = sc.reeferLogisticsCostPerPack || 0;

    const stockistPricePerPack = (exFactoryCostPerPack + freight) * (1 + (sc.superStockistMarginPct || 0));
    const distributorLandingPerPack = stockistPricePerPack * (1 + (sc.distributorMarginPct || 0));
    const retailerLandingPerPack = distributorLandingPerPack * (1 + (sc.retailerMarginPct || 0));
    const consumerMrpPerPack = retailerLandingPerPack / Math.max(0.01, 1 - (sc.retailerMarginPct || 0));

    return {
      skuId: sku.id,
      skuName: sku.skuName,
      allocatedLiters,
      netUsableLiters: allocatedLiters,
      totalPacksProduced: packsProduced,
      rawFluidCostPerPack,
      primaryFilmBomCostPerPack,
      secondaryCrateCostPerPack,
      utilityCostPerPack,
      laborCostPerPack,
      exFactoryCostPerPack,
      stockistPricePerPack,
      distributorLandingPerPack,
      retailerLandingPerPack,
      consumerMrpPerPack,
    };
  });

  const excelFormulaSiloToPack = `= ( (B5 * B6 * (1 - B12)) / (B15 / 1000) )`;

  return {
    totalInputWeightKg,
    totalInputVolumeLiters: siloVolLiters,
    totalShrinkageLossLiters,
    totalShrinkageLossPct,
    netSaleableLiters,
    totalPacksProducedAllSKUs: estimatedTotalPacks,
    effectiveFluidCostPerLiter,
    skuOutputs,
    excelFormulaSiloToPack,
  };
}
