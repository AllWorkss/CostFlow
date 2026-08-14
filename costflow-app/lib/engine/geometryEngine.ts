// ============================================================
// CostFlow — Cross-Dimensional Unit & Geometry Calculation Engine
// ============================================================

import type {
  GeometryConfig,
  GeometryMetrics,
  MaterialDensity,
  MaterialId,
  GeometricProfile,
} from "@/types/costing";

// Built-in Material Density Library (g/cm³ and kg/m³)
export const MATERIAL_DENSITIES: MaterialDensity[] = [
  {
    id: "steel",
    name: "Mild Steel / Carbon Steel",
    density_g_cm3: 7.85,
    density_kg_m3: 7850,
  },
  {
    id: "ss304",
    name: "Stainless Steel (304 / 316)",
    density_g_cm3: 8.00,
    density_kg_m3: 8000,
  },
  {
    id: "chrome_rod",
    name: "Hard Chrome Plated Rod / EN8D / EN9",
    density_g_cm3: 7.85,
    density_kg_m3: 7850,
  },
  {
    id: "aluminum",
    name: "Aluminum Alloys (6061 / 6063)",
    density_g_cm3: 2.70,
    density_kg_m3: 2700,
  },
  {
    id: "brass",
    name: "Brass / Bronze",
    density_g_cm3: 8.50,
    density_kg_m3: 8500,
  },
  {
    id: "copper",
    name: "Copper",
    density_g_cm3: 8.96,
    density_kg_m3: 8960,
  },
  {
    id: "custom",
    name: "Custom Material (User Defined)",
    density_g_cm3: 7.85,
    density_kg_m3: 7850,
  },
];

export function getEffectiveDensity(config: GeometryConfig): { g_cm3: number; kg_m3: number } {
  if (config.materialId === "custom") {
    const g_cm3 = Math.max(0.1, config.customDensity_g_cm3 || 7.85);
    return { g_cm3, kg_m3: g_cm3 * 1000 };
  }
  const mat = MATERIAL_DENSITIES.find((m) => m.id === config.materialId) || MATERIAL_DENSITIES[0];
  return { g_cm3: mat.density_g_cm3, kg_m3: mat.density_kg_m3 };
}

/**
 * Calculate linear mass (kg/m) and area mass (kg/m²) for geometric profiles
 */
export function calculateProfileMass(
  profile: GeometricProfile,
  dims: GeometryConfig["dimensions"],
  density_kg_m3: number
): { linearMassKgPerM: number; areaMassKgPerSqm: number } {
  let linearMassKgPerM = 0;
  let areaMassKgPerSqm = 0;

  switch (profile) {
    case "round_bar": {
      // Mass/m = π * (Dia / 2000)² * Density
      const radiusM = (dims.diameter_mm || 0) / 2000;
      linearMassKgPerM = Math.PI * radiusM * radiusM * density_kg_m3;
      areaMassKgPerSqm = 0;
      break;
    }
    case "hollow_pipe": {
      // Mass/m = π * (OuterDia² - InnerDia²) / 4,000,000 * Density
      const outerR_m = (dims.outer_dia_mm || 0) / 2000;
      const innerR_m = Math.min((dims.inner_dia_mm || 0), (dims.outer_dia_mm || 0)) / 2000;
      linearMassKgPerM = Math.PI * (outerR_m * outerR_m - innerR_m * innerR_m) * density_kg_m3;
      areaMassKgPerSqm = 0;
      break;
    }
    case "flat_bar": {
      // Mass/m = (Width * Thickness / 1,000,000) * Density
      const widthM = (dims.width_mm || 0) / 1000;
      const thickM = (dims.thickness_mm || 0) / 1000;
      linearMassKgPerM = widthM * thickM * density_kg_m3;
      areaMassKgPerSqm = thickM * density_kg_m3;
      break;
    }
    case "sheet_metal": {
      // Mass/sqm = Thickness_mm * (Density / 1000)
      const thickM = (dims.thickness_mm || 0) / 1000;
      areaMassKgPerSqm = thickM * density_kg_m3;
      // If width is specified, linear mass per meter of sheet width:
      const widthM = (dims.width_mm || 1000) / 1000;
      linearMassKgPerM = areaMassKgPerSqm * widthM;
      break;
    }
    case "hex_rod": {
      // Mass/m = (0.866 * AcrossFlats² / 1,000,000) * Density
      const flatsM = (dims.across_flats_mm || 0) / 1000;
      linearMassKgPerM = 0.866 * flatsM * flatsM * density_kg_m3;
      areaMassKgPerSqm = 0;
      break;
    }
  }

  return {
    linearMassKgPerM: Math.max(0, linearMassKgPerM),
    areaMassKgPerSqm: Math.max(0, areaMassKgPerSqm),
  };
}

/**
 * Compute comprehensive geometry metrics and bi-directional unit conversion matrix
 */
export function calculateGeometryMetrics(config: GeometryConfig): GeometryMetrics {
  const { kg_m3 } = getEffectiveDensity(config);
  const dims = config.dimensions;
  const cut = config.cutting;
  const sec = config.secondaryProcessing;

  const { linearMassKgPerM, areaMassKgPerSqm } = calculateProfileMass(config.profile, dims, kg_m3);

  const linearMassKgPerFt = linearMassKgPerM * 0.3048;
  const areaMassKgPerSqFt = areaMassKgPerSqm * 0.092903;

  // Cut piece mass
  const pieceLengthM = (dims.piece_length_mm || 0) / 1000;
  const baseMassPerPieceKg = config.profile === "sheet_metal" && dims.width_mm && dims.piece_length_mm
    ? (dims.width_mm / 1000) * pieceLengthM * areaMassKgPerSqm
    : linearMassKgPerM * pieceLengthM;

  // Stock length cut yield calculations
  const stockLengthM = (dims.stock_length_mm || 6000) / 1000;
  const kerfM = (cut.kerf_mm || 0) / 1000;

  const effectivePitchMm = dims.piece_length_mm + cut.kerf_mm;
  const yieldPiecesPerStock = effectivePitchMm > 0
    ? Math.floor(((dims.stock_length_mm || 6000) + cut.kerf_mm) / effectivePitchMm)
    : 0;

  const totalUsedLengthMm = yieldPiecesPerStock > 0
    ? yieldPiecesPerStock * dims.piece_length_mm + Math.max(0, yieldPiecesPerStock - 1) * cut.kerf_mm
    : 0;

  const endBitWasteLengthMm = Math.max(0, (dims.stock_length_mm || 6000) - totalUsedLengthMm);
  const endBitWasteKgPerStock = (endBitWasteLengthMm / 1000) * linearMassKgPerM;

  const kerfLossKgPerPiece = kerfM * linearMassKgPerM;

  // Scrap allowance & yield loss %
  const totalStockWeightKg = stockLengthM * linearMassKgPerM;
  const totalUsableWeightKg = yieldPiecesPerStock * baseMassPerPieceKg;
  const geometricYieldLossPct = totalStockWeightKg > 0
    ? ((totalStockWeightKg - totalUsableWeightKg) / totalStockWeightKg) * 100
    : 0;

  const scrapYieldLossPct = Math.max(geometricYieldLossPct, cut.scrapAllowancePct * 100);

  // Accounting for kerf & scrap in piece weight
  const scrapFactor = 1 + (cut.scrapAllowancePct || 0);
  const massPerPieceKg = baseMassPerPieceKg * scrapFactor + (yieldPiecesPerStock > 0 ? endBitWasteKgPerStock / yieldPiecesPerStock : 0);

  // -------------------------------------------------------------
  // BI-DIRECTIONAL UNIT CONVERSION PIPELINE
  // -------------------------------------------------------------
  const buyPrice = Math.max(0, config.buyPricePerUnit || 0);
  let rawMaterialCostPerKg = 0;

  switch (config.buyUnit) {
    case "kg":
      rawMaterialCostPerKg = buyPrice;
      break;
    case "ton":
      rawMaterialCostPerKg = buyPrice / 1000;
      break;
    case "meter":
      rawMaterialCostPerKg = linearMassKgPerM > 0 ? buyPrice / linearMassKgPerM : 0;
      break;
    case "sqm":
      rawMaterialCostPerKg = areaMassKgPerSqm > 0 ? buyPrice / areaMassKgPerSqm : 0;
      break;
    case "sqft":
      rawMaterialCostPerKg = areaMassKgPerSqFt > 0 ? buyPrice / areaMassKgPerSqFt : 0;
      break;
    case "piece":
      rawMaterialCostPerKg = massPerPieceKg > 0 ? buyPrice / massPerPieceKg : 0;
      break;
    default:
      rawMaterialCostPerKg = buyPrice;
  }

  // Raw material costs in different target metrics
  const rawMaterialCostPerMeter = rawMaterialCostPerKg * linearMassKgPerM;
  const rawMaterialCostPerFoot = rawMaterialCostPerMeter * 0.3048;
  const rawMaterialCostPerPiece = rawMaterialCostPerKg * massPerPieceKg;
  const rawMaterialCostPerSqM = rawMaterialCostPerKg * areaMassKgPerSqm;
  const rawMaterialCostPerSqFt = rawMaterialCostPerSqM * 0.092903;

  // Secondary processing costs per piece and meter
  const finishPerM = sec.finishCostPerMeter || 0;
  const finishPerKg = sec.finishCostPerKg || 0;
  const finishPerPc = sec.finishCostPerPiece || 0;

  const secondaryCostPerPiece = (finishPerM * pieceLengthM) + (finishPerKg * massPerPieceKg) + finishPerPc;
  const secondaryCostPerMeter = finishPerM + (finishPerKg * linearMassKgPerM) + (pieceLengthM > 0 ? finishPerPc / pieceLengthM : 0);

  // Total costs (Raw Material + Secondary Processing)
  const totalCostPerMeter = rawMaterialCostPerMeter + secondaryCostPerMeter;
  const totalCostPerFoot = totalCostPerMeter * 0.3048;
  const totalCostPerPiece = rawMaterialCostPerPiece + secondaryCostPerPiece;
  const totalCostPerKg = linearMassKgPerM > 0 ? totalCostPerMeter / linearMassKgPerM : rawMaterialCostPerKg + finishPerKg;
  const totalCostPerTon = totalCostPerKg * 1000;
  const totalCostPerSqM = rawMaterialCostPerSqM + (finishPerKg * areaMassKgPerSqm);
  const totalCostPerSqFt = totalCostPerSqM * 0.092903;

  // Generate Excel formula strings for live Excel exported cells
  let excelFormulaCostPerMeter = "";
  if (config.profile === "round_bar") {
    excelFormulaCostPerMeter = `= (PI() * POWER(B5/2000, 2) * C5 * D5)`;
  } else if (config.profile === "hollow_pipe") {
    excelFormulaCostPerMeter = `= (PI() * (POWER(B5, 2) - POWER(C5, 2)) / 4000000 * D5 * E5)`;
  } else if (config.profile === "flat_bar") {
    excelFormulaCostPerMeter = `= (B5 * C5 / 1000000 * D5 * E5)`;
  } else {
    excelFormulaCostPerMeter = `= (D5 * E5)`;
  }

  const excelFormulaCostPerPiece = `= (E5 * (F5 / 1000) * (1 + G5)) + H5`;

  return {
    linearMassKgPerM,
    linearMassKgPerFt,
    massPerPieceKg,
    areaMassKgPerSqm,
    areaMassKgPerSqFt,
    yieldPiecesPerStock,
    kerfLossKgPerPiece,
    endBitWasteLengthMm,
    endBitWasteKgPerStock,
    scrapYieldLossPct,
    rawMaterialCostPerKg,
    rawMaterialCostPerMeter,
    rawMaterialCostPerFoot,
    rawMaterialCostPerPiece,
    rawMaterialCostPerSqM,
    rawMaterialCostPerSqFt,
    secondaryCostPerPiece,
    totalCostPerMeter,
    totalCostPerFoot,
    totalCostPerPiece,
    totalCostPerKg,
    totalCostPerTon,
    totalCostPerSqM,
    totalCostPerSqFt,
    excelFormulaCostPerMeter,
    excelFormulaCostPerPiece,
  };
}

/**
 * Default geometry configuration
 */
export const DEFAULT_GEOMETRY_CONFIG: GeometryConfig = {
  enabled: true,
  profile: "round_bar",
  materialId: "steel",
  customDensity_g_cm3: 7.85,
  dimensions: {
    diameter_mm: 50,
    outer_dia_mm: 60,
    inner_dia_mm: 50,
    width_mm: 100,
    thickness_mm: 10,
    across_flats_mm: 25,
    piece_length_mm: 500,
    stock_length_mm: 6000,
  },
  cutting: {
    kerf_mm: 3,
    scrapAllowancePct: 0.05,
    fixedScrapKg: 0,
  },
  secondaryProcessing: {
    finishCostPerMeter: 0,
    finishCostPerKg: 0,
    finishCostPerPiece: 0,
  },
  buyUnit: "kg",
  sellUnit: "meter",
  buyPricePerUnit: 80,
};
