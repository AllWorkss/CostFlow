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

export type MarginMode = "markup_on_cost" | "margin_on_selling";

export interface CostingSummary {
  directCosts: number;
  factoryOverheads: number;
  subtotal: number;
  wastageAmount: number;
  taxAmount: number;
  profitAmount: number;
  sellingPrice: number;
  breakEvenUnits: number;
  marginPercent: number;
  marginMode: MarginMode;
  batchMultiplier: number;
  targetPriceSolverEnabled: boolean;
  targetSellingPrice: number;
  solvedRawMaterialUnitCost?: number;
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

export interface ProformaInvoiceConfig {
  quoteRefNo: string;
  quoteDate: string;
  validUntilDate: string;
  
  // Sender Details
  senderCompany: string;
  senderGstin: string;
  senderAddress: string;
  senderPhone: string;
  senderEmail: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  upiId: string;
  
  // Receiver Details
  clientCompany: string;
  clientBuyerName: string;
  clientGstin: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;

  // View Switch
  viewMode: "commercial" | "open_book";

  // Terms
  paymentTerms: string;
  deliveryTimeline: string;
  freightTerms: string;
  hsnSacCode: string;
  gstRate: number;
  unitMetric: string;
}

export type SupportedCurrency = "INR" | "USD" | "AED" | "EUR" | "GBP";

export interface ForexConfig {
  baseCurrency: SupportedCurrency;
  targetCurrency: SupportedCurrency;
  hedgeBufferPct: number; // e.g. 2.0%
  spotRates: Record<SupportedCurrency, number>; // Relative to USD
}

export interface CommodityIndex {
  id: string;
  name: string;
  category: "metals" | "plastics" | "energy" | "forex";
  unit: string;
  price: number;
  change24h: number; // Percentage change e.g. +1.4 or -0.8
  lastUpdated: string;
}

export interface WhatIfScenarioConfig {
  rmPriceVolatilityPct: number; // [-30 to +50]
  scrapShiftPct: number; // [0 to +20]
  inflationPct: number; // [-10 to +30]
  volumeDiscountScale: number; // [0.5 to 10]
}

export interface ScenarioResultMetrics {
  label: string;
  directCosts: number;
  factoryOverheads: number;
  subtotal: number;
  sellingPrice: number;
  profitAmount: number;
  marginPercent: number;
  breakevenUnits: number;
  breakevenUnitPrice: number;
}

export interface WhatIfComparisonResult {
  worstCase: ScenarioResultMetrics;
  expectedCase: ScenarioResultMetrics;
  bestCase: ScenarioResultMetrics;
  riskVolatilityIndex: "LOW" | "MODERATE" | "HIGH";
  riskScore: number; // 0 to 100
}

export interface ReverseTargetSolverConfig {
  targetPrice: number;
  targetMarginPct: number;
  lockedVariableIds: string[]; // Variable IDs that cannot be changed
}

export interface ReverseTargetSolverResult {
  targetPrice: number;
  targetMarginPct: number;
  allowableSubtotal: number;
  allowableDirectMaterialCost: number;
  maxAllowableRmRate: number; // Max ₹/kg or ₹/m
  maxAllowableCycleTimeHours: number;
  feasibilityStatus: "VIABLE" | "TIGHT" | "UNFEASIBLE";
  recommendations: string[];
}

export interface CostSheetVersionSnapshot {
  id: string;
  versionName: string;
  versionNumber: string; // e.g. v1.0
  timestamp: string;
  authorName: string;
  authorRole: UserRole;
  notes: string;
  blocksSnapshot: CostingBlock[];
  summarySnapshot: CostingSummary;
  currencySnapshot: SupportedCurrency;
}

export interface VersionDiffResult {
  versionA: CostSheetVersionSnapshot;
  versionB: CostSheetVersionSnapshot;
  subtotalDelta: number;
  subtotalDeltaPct: number;
  sellingPriceDelta: number;
  marginDriftPct: number;
  materialPriceImpact: number;
  quantityEfficiencyImpact: number;
  blockDeltas: {
    blockId: string;
    label: string;
    costA: number;
    costB: number;
    delta: number;
    deltaPct: number;
  }[];
}

export interface ExportConfig {
  domain: Domain;
  blocks: CostingBlock[];
  summary: CostingSummary;
  currency: "INR" | "USD";
  projectName: string;
  companyName?: string;
  exportedAt: string;
  geometryConfig?: GeometryConfig;
  geometryMetrics?: GeometryMetrics;
  liquidBatchConfig?: LiquidBatchConfig;
  liquidBatchMetrics?: LiquidBatchMetrics;
  userRole?: UserRole;
  opexConfig?: OpexConfig;
  payrollConfig?: PayrollConfig;
  companyMetrics?: CompanyFinancialMetrics;
}

export interface PriceRecommendation {
  targetMargin: number;
  recommendedPrice: number;
  breakEvenPrice: number;
  optimalPrice: number;
  priceRange: { min: number; max: number };
  elasticityScore: number;
}

// ============================================================
// Cross-Dimensional Unit & Geometry Engine Types
// ============================================================

export type GeometricProfile =
  | "round_bar"
  | "hollow_pipe"
  | "flat_bar"
  | "sheet_metal"
  | "hex_rod";

export type MaterialId =
  | "steel"
  | "ss304"
  | "chrome_rod"
  | "aluminum"
  | "brass"
  | "copper"
  | "custom";

export type BuyUnit = "kg" | "ton" | "meter" | "sqm" | "sqft" | "piece";
export type SellUnit = "meter" | "mm" | "inch" | "piece" | "kg" | "ton" | "sqft" | "sqm";

export interface MaterialDensity {
  id: MaterialId;
  name: string;
  density_g_cm3: number; // e.g. 7.85
  density_kg_m3: number; // e.g. 7850
}

export interface GeometryDimensions {
  diameter_mm: number;
  outer_dia_mm: number;
  inner_dia_mm: number;
  width_mm: number;
  thickness_mm: number;
  across_flats_mm: number;
  piece_length_mm: number;
  stock_length_mm: number;
}

export interface CuttingConfig {
  kerf_mm: number;            // Saw blade kerf loss per cut
  scrapAllowancePct: number;  // Scrap % allowance (0.05 = 5%)
  fixedScrapKg: number;       // Fixed end-bit or setup scrap weight
}

export interface SecondaryProcessing {
  finishCostPerMeter: number; // e.g. Hard Chrome Plating ₹/meter
  finishCostPerKg: number;    // e.g. Centerless Grinding ₹/kg
  finishCostPerPiece: number; // e.g. Turning / Facing ₹/piece
}

export interface GeometryConfig {
  enabled: boolean;
  profile: GeometricProfile;
  materialId: MaterialId;
  customDensity_g_cm3: number;
  dimensions: GeometryDimensions;
  cutting: CuttingConfig;
  secondaryProcessing: SecondaryProcessing;
  buyUnit: BuyUnit;
  sellUnit: SellUnit;
  buyPricePerUnit: number; // Cost in buyUnit (e.g. ₹80/kg)
}

export interface GeometryMetrics {
  linearMassKgPerM: number;      // Mass per linear meter (kg/m)
  linearMassKgPerFt: number;     // Mass per linear foot (kg/ft)
  massPerPieceKg: number;        // Mass per finished cut piece (kg/pc)
  areaMassKgPerSqm: number;      // Mass per square meter (kg/m²)
  areaMassKgPerSqFt: number;     // Mass per square foot (kg/ft²)
  yieldPiecesPerStock: number;   // Yield pieces from 1 stock bar accounting for kerf
  kerfLossKgPerPiece: number;    // Saw cut kerf mass loss per piece
  endBitWasteLengthMm: number;   // Leftover scrap end-bit length per stock bar
  endBitWasteKgPerStock: number; // Leftover scrap end-bit weight per stock bar
  scrapYieldLossPct: number;     // Total scrap & kerf yield loss percentage
  // Unit Cost Conversions (Raw Material + Secondary Processing)
  rawMaterialCostPerKg: number;
  rawMaterialCostPerMeter: number;
  rawMaterialCostPerFoot: number;
  rawMaterialCostPerPiece: number;
  rawMaterialCostPerSqM: number;
  rawMaterialCostPerSqFt: number;
  secondaryCostPerPiece: number;
  totalCostPerMeter: number;
  totalCostPerFoot: number;
  totalCostPerPiece: number;
  totalCostPerKg: number;
  totalCostPerTon: number;
  totalCostPerSqM: number;
  totalCostPerSqFt: number;
  excelFormulaCostPerMeter?: string;
  excelFormulaCostPerPiece?: string;
}

// ============================================================
// Bulk Liquid, Chemical & Beverage Batch-to-Pack Engine Types
// ============================================================

export type FluidType =
  | "milk"
  | "edible_oil"
  | "chemical"
  | "beverage"
  | "custom_fluid";

export interface SKUAllocation {
  id: string;
  skuName: string;            // e.g. "500ml Milk Pouch", "1L Bottle", "200ml Tetra"
  packSizeMl: number;         // e.g. 500
  volumeAllocationPct: number;// e.g. 0.60 (60% of bulk batch)
  filmMicrons: number;        // e.g. 55 microns for LDPE pouch film
  filmCostPerKg: number;      // e.g. ₹180 / kg LDPE roll
  capCostPerUnit: number;     // e.g. ₹0.40 for bottle cap
  crateCapacityUnits: number; // e.g. 24 pouches per crate
  crateCostPerUnit: number;   // Amortized crate/carton cost per unit
}

export interface ShrinkageLossConfig {
  tankerHeelLossPct: number;       // Unpumped residue in tanker (e.g. 0.2%)
  thermalProcessingLossPct: number;// Evaporation & pasteurization loss (e.g. 0.8%)
  pipelineCipLossPct: number;      // CIP hold-up loss (e.g. 0.3%)
  fillingLeakerRejectionPct: number; // Machine spillage & pouch leakers (e.g. 1.5%)
  overfillBufferMlPerPack: number;   // Overfill safety buffer (e.g. +2ml for 500ml pack)
}

export interface UtilitiesConfig {
  steamBoilerFuelCostPerKl: number;     // Boiler steam fuel per 1000L processed (₹)
  chillingRefrigerationCostPerKl: number; // Chilling electricity per 1000L (₹)
  coldStorageCostPerCrateDay: number;    // Cold storage holding per crate/day (₹)
  directLaborCostPerShift: number;       // Line operator shift wages (₹)
}

export interface SupplyChainWaterfallConfig {
  reeferLogisticsCostPerPack: number; // Freight per pack (₹)
  superStockistMarginPct: number;     // Super-stockist margin % (e.g. 3%)
  distributorMarginPct: number;       // Distributor margin % (e.g. 5%)
  retailerMarginPct: number;          // Retailer margin % (e.g. 10%)
}

export interface LiquidBatchConfig {
  enabled: boolean;
  batchName: string;
  fluidType: FluidType;
  siloCapacityLiters: number;  // Bulk capacity in Liters (e.g. 50,000 L)
  specificGravity: number;     // Density in kg/L or g/cm³ (e.g. 1.032 for Milk)
  // Dairy Fat/SNF Pricing Model
  fatPct: number;               // Fat % (e.g. 6.0%)
  snfPct: number;               // SNF % (e.g. 9.0%)
  fatRatePerKg: number;         // Rate per kg Fat (e.g. ₹420)
  snfRatePerKg: number;         // Rate per kg SNF (e.g. ₹280)
  liquidPricePerLiter: number;  // Direct raw fluid price ₹/Liter (if not using Fat/SNF)
  shrinkage: ShrinkageLossConfig;
  skus: SKUAllocation[];
  utilities: UtilitiesConfig;
  supplyChain: SupplyChainWaterfallConfig;
}

export interface SKUOutputMetrics {
  skuId: string;
  skuName: string;
  allocatedLiters: number;
  netUsableLiters: number;
  totalPacksProduced: number;
  rawFluidCostPerPack: number;
  primaryFilmBomCostPerPack: number;
  secondaryCrateCostPerPack: number;
  utilityCostPerPack: number;
  laborCostPerPack: number;
  exFactoryCostPerPack: number;
  stockistPricePerPack: number;
  distributorLandingPerPack: number;
  retailerLandingPerPack: number;
  consumerMrpPerPack: number;
}

export interface LiquidBatchMetrics {
  totalInputWeightKg: number;
  totalInputVolumeLiters: number;
  totalShrinkageLossLiters: number;
  totalShrinkageLossPct: number;
  netSaleableLiters: number;
  totalPacksProducedAllSKUs: number;
  effectiveFluidCostPerLiter: number;
  skuOutputs: SKUOutputMetrics[];
  excelFormulaSiloToPack?: string;
}

// ============================================================
// Enterprise RBAC, Field-Level Security (FLS) & Audit Types
// ============================================================

export type UserRole =
  | "super_admin"
  | "plant_manager"
  | "procurement_specialist"
  | "floor_operator"
  | "sales_rep";

export type Department =
  | "procurement"
  | "production"
  | "finance"
  | "sales"
  | "executive";

export type PermissionState = "editable" | "readonly" | "hidden_masked";

export type CostingApprovalStatus = "draft" | "under_review" | "approved" | "locked";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  organizationId: string;
  organizationName: string;
  plantBranch: string;
  avatarUrl?: string;
}

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  status: "active" | "invited" | "disabled";
  joinedAt: string;
}

export interface FieldPermissionRule {
  blockType: BlockType;
  role: UserRole;
  canView: boolean;
  canEdit: boolean;
  canExport: boolean;
  maskFinancials: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  blockId: string;
  blockLabel: string;
  variableId: string;
  variableName: string;
  oldValue: number | string;
  newValue: number | string;
  department: Department;
}

// ============================================================
// Company OPEX, Payroll CTC & Custom Block Builder Types
// ============================================================

export type OpexCategory =
  | "facility"
  | "compliance"
  | "tech"
  | "general";

export interface OpexItem {
  id: string;
  name: string;
  category: OpexCategory;
  monthlyCost: number;
  description?: string;
}

export interface OpexConfig {
  items: OpexItem[];
  totalBillableEmployees: number;
  billableHoursPerMonth: number;
}

export interface EmployeePayroll {
  id: string;
  name: string;
  roleTitle: string;
  department: Department;
  baseSalaryMonthly: number;
  bonusesMonthly: number;
  statutoryMonthly: number; // PF, ESIC, Insurance
  workingDaysPerMonth: number;
  productiveHoursPerDay: number;
  allocatedProjectHours: number;
}

export interface PayrollConfig {
  employees: EmployeePayroll[];
}

export type CustomBlockKind =
  | "lump_sum"
  | "recurring"
  | "per_unit"
  | "hourly"
  | "contingency_pct";

export interface CustomBlockField {
  id: string;
  name: string;
  type: "number" | "text" | "select" | "currency";
  value: number | string;
  unit?: string;
  options?: string[];
}

export interface CustomBlockDefinition {
  id: string;
  name: string;
  kind: CustomBlockKind;
  category: string;
  fields: CustomBlockField[];
  totalCost: number;
  description?: string;
}

export interface BlockPreset {
  id: string;
  title: string;
  category: "Agency" | "Hardware" | "Construction" | "Consulting";
  description: string;
  blocks: CustomBlockDefinition[];
}

export interface CompanyFinancialMetrics {
  totalMonthlyOpex: number;
  companyOverheadHourlyRate: number;
  totalMonthlyPayroll: number;
  effectiveAverageHourlyCtc: number;
  totalAllocatedProjectLaborCost: number;
  totalAbsorbedOverheadCost: number;
  trueProjectCost: number;
  suggestedClientInvoicePrice: number;
  breakEvenInvoicePrice: number;
  projectGrossMarginPct: number;
  projectNetProfitPct: number;
}




