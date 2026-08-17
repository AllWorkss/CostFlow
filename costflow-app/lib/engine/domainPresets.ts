// ============================================================
// CostFlow — Domain Presets (6 Industries)
// ============================================================
import type { DomainPreset } from "@/types/costing";

const v = (id: string, name: string, value: number, unit?: string, description?: string) => ({
  id, name, value, unit, description,
});

export const DOMAIN_PRESETS: DomainPreset[] = [
  {
    id: "metals",
    label: "Metals, Pipes & Fabrication",
    description: "Geometry calculations, laser cutting, nesting scrap, surface finishing",
    icon: "Factory",
    color: "#3B82F6",
    gradient: "from-blue-600 to-cyan-500",
    defaultCurrency: "INR",
    unitSystem: "metric",
    blocks: [
      {
        type: "raw_material", label: "Geometry Mass Base", enabled: true, order: 0,
        color: "#3B82F6", icon: "Package",
        description: "Mass = Volume × Density (Steel: 7.85)",
        formula: "3.14159 * (radius * radius) * length * density / 1000 * unitCost", // Simplified for Round Bar
        excelFormula: "=3.14159*(B{r}*B{r})*C{r}*D{r}/1000*E{r}",
        variables: [
          v("radius", "Radius (cm)", 5, "cm", "Radius of round bar"),
          v("length", "Length (cm)", 100, "cm"),
          v("density", "Density (g/cm³)", 7.85, "g/cm³"),
          v("unitCost", "Cost per Kg (₹)", 85, "₹/kg")
        ],
      },
      {
        type: "direct_labor", label: "Sheet Metal Laser Cutting", enabled: true, order: 1,
        color: "#10B981", icon: "Settings",
        description: "Cut Cost = Perimeter × Rate/m + Pierces × Rate",
        formula: "perimeter * cuttingRate + pierces * pierceRate",
        excelFormula: "=F{r}*G{r}+H{r}*I{r}",
        variables: [
          v("perimeter", "Perimeter (m)", 15, "m"),
          v("cuttingRate", "Cutting Rate (₹/m)", 45, "₹/m"),
          v("pierces", "Pierces (count)", 10, "pcs"),
          v("pierceRate", "Pierce Rate (₹)", 2, "₹/pc")
        ],
      },
      {
        type: "wastage", label: "Nesting Scrap Allowance", enabled: true, order: 2,
        color: "#F59E0B", icon: "Trash2",
        description: "Scrap generated from nesting sheets",
        formula: "materialCost * scrapPct",
        excelFormula: "=J{r}*K{r}",
        variables: [v("scrapPct", "Scrap %", 0.12, "%", "Scrap allowance")],
      },
      {
        type: "finishing", label: "Surface Finishing / Plating", enabled: true, order: 3,
        color: "#8B5CF6", icon: "Sparkles",
        description: "Cost = Area × Thickness × Rate / Efficiency",
        formula: "(surfaceArea * thickness * rate) / efficiency",
        excelFormula: "=(L{r}*M{r}*N{r})/O{r}",
        variables: [
          v("surfaceArea", "Surface Area (cm²)", 500, "cm²"),
          v("thickness", "Thickness (Micron)", 10, "μm"),
          v("rate", "Plating Rate (₹)", 0.5, "₹"),
          v("efficiency", "Efficiency", 0.85, "")
        ],
      }
    ],
  },
  {
    id: "plastics",
    label: "Plastics & Injection Molding",
    description: "Polymer blending, cycle time cost, runner scrap regrind",
    icon: "Settings", // Replace with appropriate icons as needed, maybe 'Box'
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-500",
    defaultCurrency: "INR",
    unitSystem: "metric",
    blocks: [
      {
        type: "raw_material", label: "Polymer + Masterbatch", enabled: true, order: 0,
        color: "#F59E0B", icon: "Package",
        description: "Raw material with colorant %",
        formula: "(weight * polymerCost) + (weight * masterbatchPct * masterbatchCost)",
        excelFormula: "=(B{r}*C{r})+(B{r}*D{r}*E{r})",
        variables: [
          v("weight", "Part Weight (Kg)", 0.2, "Kg"),
          v("polymerCost", "Polymer Cost (₹/Kg)", 110, "₹/Kg"),
          v("masterbatchPct", "Masterbatch %", 0.03, "%"),
          v("masterbatchCost", "Masterbatch Cost (₹/Kg)", 450, "₹/Kg")
        ],
      },
      {
        type: "variable_overhead", label: "Molding Cycle Cost", enabled: true, order: 1,
        color: "#10B981", icon: "Settings",
        description: "Machine Hourly Rate / Parts per Hour",
        formula: "machineRate / ((3600 / cycleTime) * cavities)",
        excelFormula: "=F{r}/((3600/G{r})*H{r})",
        variables: [
          v("machineRate", "Machine Rate (₹/Hr)", 350, "₹/Hr"),
          v("cycleTime", "Cycle Time (s)", 45, "s"),
          v("cavities", "Cavities", 4, "pcs")
        ],
      },
      {
        type: "wastage", label: "Runner & Gate Scrap", enabled: true, order: 2,
        color: "#EF4444", icon: "Trash2",
        description: "Scrap cost less regrind credit",
        formula: "(weight * scrapPct * polymerCost) - (weight * scrapPct * regrindCredit)",
        excelFormula: "=(I{r}*J{r}*K{r})-(I{r}*J{r}*L{r})",
        variables: [
          v("scrapPct", "Runner Scrap %", 0.05, "%"),
          v("regrindCredit", "Regrind Value (₹/Kg)", 40, "₹/Kg")
        ],
      }
    ],
  },
  {
    id: "packaging",
    label: "Packaging & Corrugation",
    description: "Total GSM, Sheet blank area, Lamination overheads",
    icon: "Package",
    color: "#10B981",
    gradient: "from-emerald-600 to-teal-500",
    defaultCurrency: "INR",
    unitSystem: "metric",
    blocks: [
      {
        type: "raw_material", label: "Total GSM Engine", enabled: true, order: 0,
        color: "#10B981", icon: "Layers",
        description: "Top Liner + (Flute * 1.4) + Bottom Liner",
        formula: "topLiner + (fluteMedium * 1.4) + bottomLiner",
        excelFormula: "=B{r}+(C{r}*1.4)+D{r}",
        variables: [
          v("topLiner", "Top Liner (GSM)", 150, "GSM"),
          v("fluteMedium", "Flute Medium (GSM)", 120, "GSM"),
          v("bottomLiner", "Bottom Liner (GSM)", 150, "GSM")
        ],
      },
      {
        type: "raw_material", label: "Sheet Blank Cost", enabled: true, order: 1,
        color: "#3B82F6", icon: "Box",
        description: "Area * GSM Cost",
        formula: "(2*(length+width)+joint) * (width+height+creasing) * gsmCostRate",
        excelFormula: "=(2*(E{r}+F{r})+G{r})*(F{r}+H{r}+I{r})*J{r}",
        variables: [
          v("length", "Length (cm)", 40, "cm"),
          v("width", "Width (cm)", 30, "cm"),
          v("height", "Height (cm)", 20, "cm"),
          v("joint", "Joint (cm)", 4, "cm"),
          v("creasing", "Creasing (cm)", 2, "cm"),
          v("gsmCostRate", "GSM Cost Rate (₹)", 0.005, "₹")
        ],
      },
      {
        type: "finishing", label: "Printing & Lamination", enabled: true, order: 2,
        color: "#8B5CF6", icon: "Sparkles",
        description: "Cost per 1,000 units",
        formula: "(printCostPer1k + lamCostPer1k) / 1000",
        excelFormula: "=(K{r}+L{r})/1000",
        variables: [
          v("printCostPer1k", "Printing / 1k (₹)", 2500, "₹"),
          v("lamCostPer1k", "Lamination / 1k (₹)", 1800, "₹")
        ],
      }
    ],
  },
  {
    id: "food",
    label: "Food, Bakery & HoReCa",
    description: "Recipe BOM, cooking yield/shrinkage, portion scaling",
    icon: "Coffee", // or "Utensils"
    color: "#EF4444",
    gradient: "from-red-600 to-rose-500",
    defaultCurrency: "INR",
    unitSystem: "metric",
    blocks: [
      {
        type: "raw_material", label: "Multi-Ingredient Recipe BOM", enabled: true, order: 0,
        color: "#EF4444", icon: "ClipboardList", // placeholder
        description: "Sum of recipe ingredients (Simplified)",
        formula: "ingredientQty * purchasePrice",
        excelFormula: "=B{r}*C{r}",
        variables: [
          v("ingredientQty", "Main Ingredient (Kg)", 10, "Kg"),
          v("purchasePrice", "Purchase Price (₹/Kg)", 150, "₹/Kg")
        ],
      },
      {
        type: "wastage", label: "Cooking Shrinkage & Yield", enabled: true, order: 1,
        color: "#F59E0B", icon: "Flame", // placeholder
        description: "Cost adjusted for shrinkage %",
        formula: "rawCost / (rawWeight * (1 - shrinkagePct))",
        excelFormula: "=D{r}/(E{r}*(1-F{r}))",
        variables: [
          v("rawCost", "Raw Cost (₹)", 1500, "₹"),
          v("rawWeight", "Raw Wt (Kg)", 10, "Kg"),
          v("shrinkagePct", "Shrinkage %", 0.20, "%")
        ],
      },
      {
        type: "packaging", label: "Portion Scaler & Pack", enabled: true, order: 2,
        color: "#10B981", icon: "Package",
        description: "Dish portion cost + packaging",
        formula: "(cookedCostPerKg * portionWeight) + containerCost",
        excelFormula: "=(G{r}*H{r})+I{r}",
        variables: [
          v("cookedCostPerKg", "Cooked Cost (₹/Kg)", 187.5, "₹/Kg"),
          v("portionWeight", "Portion (Kg)", 0.35, "Kg"),
          v("containerCost", "Container Cost (₹)", 12, "₹")
        ],
      }
    ],
  },
  {
    id: "agro",
    label: "Agro-Processing & Dairy",
    description: "Grain milling yield, Amul 2-Axis dairy pricing, liquid transfer spillage",
    icon: "Wheat", // or equivalent
    color: "#8B5CF6",
    gradient: "from-purple-600 to-pink-500",
    defaultCurrency: "INR",
    unitSystem: "metric",
    blocks: [
      {
        type: "raw_material", label: "Grain Milling Yield", enabled: true, order: 0,
        color: "#8B5CF6", icon: "Settings", // placeholder
        description: "Net Cost = Raw - Byproducts + OPEX",
        formula: "rawCost - (brokenWt * brokenRate + huskWt * huskRate) + processingOpex",
        excelFormula: "=B{r}-(C{r}*D{r}+E{r}*F{r})+G{r}",
        variables: [
          v("rawCost", "Raw Inward Cost (₹)", 2500, "₹"),
          v("brokenWt", "Broken Wt (Kg)", 5, "Kg"),
          v("brokenRate", "Broken Rate (₹/Kg)", 20, "₹/Kg"),
          v("huskWt", "Husk Wt (Kg)", 15, "Kg"),
          v("huskRate", "Husk Rate (₹/Kg)", 5, "₹/Kg"),
          v("processingOpex", "Processing OPEX (₹)", 300, "₹")
        ],
      },
      {
        type: "raw_material", label: "Dairy: Amul 2-Axis Pricing", enabled: true, order: 1,
        color: "#3B82F6", icon: "Droplets",
        description: "Milk base price based on Fat and SNF %",
        formula: "volumeLiters * baseRate * (fatPct + snfPct)/100",
        excelFormula: "=H{r}*I{r}*(J{r}+K{r})/100",
        variables: [
          v("volumeLiters", "Volume (L)", 1000, "L"),
          v("baseRate", "Base Rate (₹/L)", 45, "₹/L"),
          v("fatPct", "Fat %", 6.0, "%"),
          v("snfPct", "SNF %", 9.0, "%"),
        ],
      },
      {
        type: "wastage", label: "Bulk Spillage & Transfer", enabled: true, order: 2,
        color: "#F59E0B", icon: "AlertTriangle",
        description: "Transfer loss % factor on bulk volume",
        formula: "materialCost * spillagePct",
        excelFormula: "=L{r}*M{r}",
        variables: [v("spillagePct", "Spillage %", 0.015, "%")],
      }
    ],
  },
  {
    id: "apparel",
    label: "Apparel, D2C & Logistics",
    description: "Garment fabric yield, SAM stitching labor, volumetric freight",
    icon: "Shirt",
    color: "#06B6D4",
    gradient: "from-cyan-500 to-blue-500",
    defaultCurrency: "INR",
    unitSystem: "metric",
    blocks: [
      {
        type: "raw_material", label: "Garment Fabric Yield", enabled: true, order: 0,
        color: "#06B6D4", icon: "Scissors", // placeholder
        description: "Fabric Wt = (L * W * GSM) / (1000 * Efficiency)",
        formula: "(length * width * gsm) / (1000 * efficiency)",
        excelFormula: "=(B{r}*C{r}*D{r})/(1000*E{r})",
        variables: [
          v("length", "Length (m)", 1.5, "m"),
          v("width", "Width (m)", 1.2, "m"),
          v("gsm", "Fabric GSM", 180, "g/m²"),
          v("efficiency", "Marker Efficiency %", 0.82, "%")
        ],
      },
      {
        type: "direct_labor", label: "SAM Stitching Labor", enabled: true, order: 1,
        color: "#10B981", icon: "Clock",
        description: "SAM * (Shift Wage / Shift Mins)",
        formula: "sam * (shiftWage / shiftMins)",
        excelFormula: "=F{r}*(G{r}/H{r})",
        variables: [
          v("sam", "Allowed Mins (SAM)", 25, "mins"),
          v("shiftWage", "Shift Wage (₹)", 600, "₹"),
          v("shiftMins", "Shift Working Mins", 480, "mins")
        ],
      },
      {
        type: "transport", label: "Volumetric Freight & RTO", enabled: true, order: 2,
        color: "#8B5CF6", icon: "Truck",
        description: "Forward + (RTO Rate * Reverse Freight)",
        formula: "forwardFreight + (rtoRate * reverseFreight)",
        excelFormula: "=I{r}+(J{r}*K{r})",
        variables: [
          v("forwardFreight", "Forward Freight (₹)", 85, "₹"),
          v("rtoRate", "RTO Risk %", 0.12, "%"),
          v("reverseFreight", "Reverse Freight (₹)", 65, "₹")
        ],
      }
    ],
  }
];

export function getPreset(domain: string): DomainPreset | undefined {
  return DOMAIN_PRESETS.find((p) => p.id === domain);
}
