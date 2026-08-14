// ============================================================
// CostFlow — Company OPEX, Payroll CTC & Custom Block Engine
// ============================================================

import type {
  OpexConfig,
  PayrollConfig,
  CompanyFinancialMetrics,
  BlockPreset,
  CustomBlockDefinition,
} from "@/types/costing";

export const DEFAULT_OPEX_CONFIG: OpexConfig = {
  items: [
    { id: "op_1", name: "Main HQ & Factory Office Rent", category: "facility", monthlyCost: 75000, description: "Commercial lease in industrial estate" },
    { id: "op_2", name: "Warehouse & Storage Lease", category: "facility", monthlyCost: 45000, description: "Raw material & finished goods staging" },
    { id: "op_3", name: "Industrial Electricity & Power", category: "facility", monthlyCost: 22000, description: "Utility power & backup DG fuel" },
    { id: "op_4", name: "Commercial High-Speed Internet & Tel", category: "facility", monthlyCost: 6000, description: "Dedicated fiber link" },
    { id: "op_5", name: "Tea, Pantry & Office Maintenance", category: "facility", monthlyCost: 12000, description: "Cleaning, tea/coffee, snacks" },
    { id: "op_6", name: "Audit, CA & Legal Compliance Fees", category: "compliance", monthlyCost: 15000, description: "Monthly GST filing & audit retainership" },
    { id: "op_7", name: "Plant & Fire Safety Insurance", category: "compliance", monthlyCost: 10000, description: "Comprehensive asset insurance" },
    { id: "op_8", name: "Cloud Infrastructure (AWS / GCP)", category: "tech", monthlyCost: 25000, description: "Servers, database & storage" },
    { id: "op_9", name: "ERP, Software & CAD Subscriptions", category: "tech", monthlyCost: 20000, description: "Manufacturing software licenses" },
  ],
  totalBillableEmployees: 5,
  billableHoursPerMonth: 160,
};

export const DEFAULT_PAYROLL_CONFIG: PayrollConfig = {
  employees: [
    {
      id: "emp_1",
      name: "Vikram Patel",
      roleTitle: "Lead Systems Architect",
      department: "production",
      baseSalaryMonthly: 95000,
      bonusesMonthly: 15000,
      statutoryMonthly: 10000, // PF + ESIC + Insurance
      workingDaysPerMonth: 22,
      productiveHoursPerDay: 8,
      allocatedProjectHours: 40,
    },
    {
      id: "emp_2",
      name: "Ananya Roy",
      roleTitle: "Procurement Specialist",
      department: "procurement",
      baseSalaryMonthly: 65000,
      bonusesMonthly: 8000,
      statutoryMonthly: 7000,
      workingDaysPerMonth: 22,
      productiveHoursPerDay: 8,
      allocatedProjectHours: 25,
    },
    {
      id: "emp_3",
      name: "Suresh Kumar",
      roleTitle: "Senior Tooling Operator",
      department: "production",
      baseSalaryMonthly: 45000,
      bonusesMonthly: 5000,
      statutoryMonthly: 5000,
      workingDaysPerMonth: 22,
      productiveHoursPerDay: 8,
      allocatedProjectHours: 60,
    },
    {
      id: "emp_4",
      name: "Priya Singh",
      roleTitle: "Sales & Client Lead",
      department: "sales",
      baseSalaryMonthly: 55000,
      bonusesMonthly: 10000,
      statutoryMonthly: 6000,
      workingDaysPerMonth: 22,
      productiveHoursPerDay: 8,
      allocatedProjectHours: 15,
    },
  ],
};

export const PRESET_LIBRARIES: BlockPreset[] = [
  {
    id: "preset_agency",
    title: "Digital Agency & Client Consulting",
    category: "Agency",
    description: "Includes client Discovery Workshops, UI/UX Prototype Sprints, Travel & Allowance, and Ad Budget Buffer.",
    blocks: [
      {
        id: "cb_ag1",
        name: "Client Strategy & Discovery Workshop",
        kind: "lump_sum",
        category: "Consulting",
        fields: [{ id: "f1", name: "Workshop Fee (₹)", type: "currency", value: 35000, unit: "₹" }],
        totalCost: 35000,
        description: "Initial discovery & requirement gathering",
      },
      {
        id: "cb_ag2",
        name: "UI/UX Interactive Prototype Sprint",
        kind: "hourly",
        category: "Design",
        fields: [
          { id: "f1", name: "Designer Rate (₹/hr)", type: "currency", value: 1200, unit: "₹/hr" },
          { id: "f2", name: "Allocated Hours", type: "number", value: 40, unit: "hrs" },
        ],
        totalCost: 48000,
        description: "Figma prototype & user testing",
      },
      {
        id: "cb_ag3",
        name: "Client Onsite Travel & Food Allowance",
        kind: "per_unit",
        category: "Travel",
        fields: [
          { id: "f1", name: "Cost Per Visit (₹)", type: "currency", value: 2500, unit: "₹/visit" },
          { id: "f2", name: "Number of Visits", type: "number", value: 6, unit: "visits" },
        ],
        totalCost: 15000,
        description: "Local client meetings & presentation travel",
      },
    ],
  },
  {
    id: "preset_hardware",
    title: "Hardware & Physical Prototyping",
    category: "Hardware",
    description: "Includes CNC Tooling Die Setup, High-Precision 3D Samples, Test Jig Electronics, and Compliance Testing.",
    blocks: [
      {
        id: "cb_hw1",
        name: "Custom CNC Injection Mold Tooling Die",
        kind: "lump_sum",
        category: "Tooling",
        fields: [{ id: "f1", name: "Die Manufacturing Cost (₹)", type: "currency", value: 85000, unit: "₹" }],
        totalCost: 85000,
        description: "Hardened steel injection mold die",
      },
      {
        id: "cb_hw2",
        name: "SLS 3D Printing Resin Samples",
        kind: "per_unit",
        category: "Prototyping",
        fields: [
          { id: "f1", name: "Cost Per Prototype Unit (₹)", type: "currency", value: 1800, unit: "₹/unit" },
          { id: "f2", name: "Sample Quantity", type: "number", value: 10, unit: "units" },
        ],
        totalCost: 18000,
        description: "High-precision resin 3D prints",
      },
      {
        id: "cb_hw3",
        name: "Regulatory EMC & Safety Compliance Testing",
        kind: "lump_sum",
        category: "Testing",
        fields: [{ id: "f1", name: "Lab Test Certificate (₹)", type: "currency", value: 25000, unit: "₹" }],
        totalCost: 25000,
        description: "CE / BIS certification lab fees",
      },
    ],
  },
  {
    id: "preset_construction",
    title: "Construction & Industrial Site Project",
    category: "Construction",
    description: "Includes Heavy Scaffolding Rental, Site Supervisor Allowance, Safety Equipment, and Weather Risk Buffer.",
    blocks: [
      {
        id: "cb_cn1",
        name: "Heavy Modular Scaffolding Rental",
        kind: "recurring",
        category: "Equipment",
        fields: [
          { id: "f1", name: "Daily Rental Rate (₹)", type: "currency", value: 1500, unit: "₹/day" },
          { id: "f2", name: "Duration in Days", type: "number", value: 20, unit: "days" },
        ],
        totalCost: 30000,
        description: "Steel scaffolding towers & platform",
      },
      {
        id: "cb_cn2",
        name: "Site Safety Equipment & PPE Kits",
        kind: "per_unit",
        category: "Safety",
        fields: [
          { id: "f1", name: "Kit Price (₹)", type: "currency", value: 850, unit: "₹/kit" },
          { id: "f2", name: "Worker Count", type: "number", value: 25, unit: "workers" },
        ],
        totalCost: 21250,
        description: "Helmets, boots, harnesses & reflective vests",
      },
    ],
  },
];

/**
 * Calculate Company OPEX & Overhead Hourly Rate
 */
export function calculateOpexMetrics(config: OpexConfig) {
  const totalMonthlyOpex = config.items.reduce((sum, item) => sum + item.monthlyCost, 0);
  const totalBillableCapacityHours = (config.totalBillableEmployees || 1) * (config.billableHoursPerMonth || 160);
  const companyOverheadHourlyRate = totalMonthlyOpex / (totalBillableCapacityHours || 1);

  return {
    totalMonthlyOpex,
    totalBillableCapacityHours,
    companyOverheadHourlyRate,
  };
}

/**
 * Calculate Payroll Monthly CTC & Real Hourly Rates
 */
export function calculatePayrollMetrics(config: PayrollConfig) {
  let totalMonthlyPayroll = 0;
  let totalAllocatedProjectHours = 0;
  let totalAllocatedProjectLaborCost = 0;

  const employeeMetrics = config.employees.map((emp) => {
    const totalMonthlyCtc = emp.baseSalaryMonthly + emp.bonusesMonthly + emp.statutoryMonthly;
    const monthlyCapacityHours = (emp.workingDaysPerMonth || 22) * (emp.productiveHoursPerDay || 8);
    const effectiveHourlyCtc = totalMonthlyCtc / (monthlyCapacityHours || 1);
    const allocatedCost = effectiveHourlyCtc * emp.allocatedProjectHours;

    totalMonthlyPayroll += totalMonthlyCtc;
    totalAllocatedProjectHours += emp.allocatedProjectHours;
    totalAllocatedProjectLaborCost += allocatedCost;

    return {
      ...emp,
      totalMonthlyCtc,
      monthlyCapacityHours,
      effectiveHourlyCtc,
      allocatedCost,
    };
  });

  const effectiveAverageHourlyCtc =
    config.employees.length > 0 ? totalMonthlyPayroll / (config.employees.length * 176) : 0;

  return {
    employees: employeeMetrics,
    totalMonthlyPayroll,
    totalAllocatedProjectHours,
    totalAllocatedProjectLaborCost,
    effectiveAverageHourlyCtc,
  };
}

/**
 * Calculate Activity-Based Overhead Absorption & True Company P&L
 */
export function calculateCompanyFinancials(
  opexConfig: OpexConfig = DEFAULT_OPEX_CONFIG,
  payrollConfig: PayrollConfig = DEFAULT_PAYROLL_CONFIG,
  directMaterialCost = 0,
  customBlocksCost = 0,
  targetMarginPct = 0.25
): CompanyFinancialMetrics {
  const opex = calculateOpexMetrics(opexConfig);
  const payroll = calculatePayrollMetrics(payrollConfig);

  const totalAbsorbedOverheadCost = payroll.totalAllocatedProjectHours * opex.companyOverheadHourlyRate;

  const trueProjectCost =
    directMaterialCost +
    payroll.totalAllocatedProjectLaborCost +
    totalAbsorbedOverheadCost +
    customBlocksCost;

  const suggestedClientInvoicePrice = trueProjectCost / (1 - (targetMarginPct || 0.25));
  const breakEvenInvoicePrice = trueProjectCost;

  const projectGrossMarginPct =
    suggestedClientInvoicePrice > 0
      ? (suggestedClientInvoicePrice - (directMaterialCost + payroll.totalAllocatedProjectLaborCost)) /
        suggestedClientInvoicePrice
      : 0;

  const projectNetProfitPct =
    suggestedClientInvoicePrice > 0
      ? (suggestedClientInvoicePrice - trueProjectCost) / suggestedClientInvoicePrice
      : 0;

  return {
    totalMonthlyOpex: opex.totalMonthlyOpex,
    companyOverheadHourlyRate: opex.companyOverheadHourlyRate,
    totalMonthlyPayroll: payroll.totalMonthlyPayroll,
    effectiveAverageHourlyCtc: payroll.effectiveAverageHourlyCtc,
    totalAllocatedProjectLaborCost: payroll.totalAllocatedProjectLaborCost,
    totalAbsorbedOverheadCost,
    trueProjectCost,
    suggestedClientInvoicePrice,
    breakEvenInvoicePrice,
    projectGrossMarginPct,
    projectNetProfitPct,
  };
}
