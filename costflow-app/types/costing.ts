// ============================================================
// CostFlow — Core TypeScript Types
// ============================================================

export type Domain =
  | "manufacturing"
  | "school"
  | "retail"
  | "ecommerce"
  | "construction";

export type BlockType =
  | "raw_material"
  | "direct_labor"
  | "variable_overhead"
  | "fixed_overhead"
  | "finishing"
  | "tax_gst"
  | "profit_markup"
  | "wastage"
  | "transport"
  | "packaging"
  | "custom";

export type UnitCategory = "weight" | "length" | "volume" | "count" | "area" | "time" | "custom";

export interface Unit {
  id: string;
  label: string;
  symbol: string;
  category: UnitCategory;
  toBase: number;
}

export interface CostingVariable {
  id: string;
  name: string;
  value: number;
  unit?: string;
  description?: string;
}

export interface CostingBlock {
  id: string;
  type: BlockType;
  label: string;
  enabled: boolean;
  order: number;
  variables: CostingVariable[];
  formula: string;
  result?: number;
  excelFormula?: string;
  color: string;
  icon: string;
  description?: string;
  isAnomalous?: boolean;
  anomalyReason?: string;
}

export interface DomainPreset {
  id: Domain;
  label: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  blocks: Omit<CostingBlock, "id">[];
  defaultCurrency: "INR" | "USD";
  unitSystem: "metric" | "imperial";
}

export interface CostingSummary {
  subtotal: number;
  wastageAmount: number;
  taxAmount: number;
  profitAmount: number;
  sellingPrice: number;
  breakEvenUnits: number;
  marginPercent: number;
  costBreakdown: { label: string; value: number; color: string }[];
}

export interface AnomalyResult {
  blockId: string;
  variableId: string;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  severity: "low" | "medium" | "high";
  message: string;
}

export interface ExportConfig {
  domain: Domain;
  blocks: CostingBlock[];
  summary: CostingSummary;
  currency: "INR" | "USD";
  projectName: string;
  companyName?: string;
  exportedAt: string;
}

export interface PriceRecommendation {
  targetMargin: number;
  recommendedPrice: number;
  breakEvenPrice: number;
  optimalPrice: number;
  priceRange: { min: number; max: number };
  elasticityScore: number;
}
