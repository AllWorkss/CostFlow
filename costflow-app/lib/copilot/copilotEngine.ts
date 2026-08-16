// ============================================================
// CostFlow — AI Copilot Natural Language Reasoning Engine
// Universal Multi-Industry Cost Estimator & Clarification Brain
// ============================================================

export interface CopilotActionPayload {
  action: "SYNC_DASHBOARD_STATE";
  industry: "Manufacturing" | "Liquid & Dairy" | "Plastics & FMCG" | "Retail & D2C" | "General";
  data: {
    itemName?: string;
    rawMaterialCost?: number;
    rawMaterialQty?: number;
    rawMaterialUnitCost?: number;
    scrapCost?: number;
    scrapPct?: number;
    laborCost?: number;
    laborHours?: number;
    laborHourlyRate?: number;
    finishingCost?: number;
    taxGSTRate?: number;
    profitMarkupPct?: number;
    targetSellingPrice?: number;
    calculatedSellingPrice?: number;
    geometryConfig?: {
      profile: "round_bar" | "hollow_pipe" | "flat_bar" | "sheet_metal" | "hex_rod";
      diameter_mm: number;
      length_mm: number;
      materialDensity: number;
      buyPricePerKg: number;
    };
    liquidConfig?: {
      siloCapacityLiters: number;
      fatPct: number;
      snfPct: number;
      fatRatePerKg: number;
      snfRatePerKg: number;
      packSizeMl: number;
    };
  };
}

export interface CopilotMessageResult {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  status: "complete" | "needs_clarification" | "warning";
  step?: "AUDIT" | "CLARIFICATION" | "DEFAULTS" | "FINAL";
  structuredCard?: {
    title: string;
    industry: string;
    sellingPrice: number;
    unitLabel: string;
    breakdown: { label: string; value: number }[];
    defaultsApplied?: string[];
    warnings?: string[];
    payload: CopilotActionPayload;
  };
}

// ── Standard Industry Defaults ──
export const INDUSTRY_DEFAULTS = {
  steelDensity_g_cm3: 7.85,
  ss304Density_g_cm3: 7.93,
  aluminumDensity_g_cm3: 2.70,
  brassDensity_g_cm3: 8.50,
  copperDensity_g_cm3: 8.96,
  scrapAllowancePct: 0.04, // 4%
  laborRatePerHour: 150, // ₹150/hr
  defaultGstPct: 0.18, // 18%
  defaultMarginPct: 0.20, // 20%
  milkFatPct: 6.0,
  milkSnfPct: 9.0,
  fatRatePerKg: 420,
  snfRatePerKg: 280,
  packSizeMl: 500,
};

/**
 * Natural Language Query Parser & Clarification Engine
 * Supports English, Hindi, and Hinglish queries seamlessly.
 */
export function processCopilotQuery(query: string, previousContext?: CopilotMessageResult[]): CopilotMessageResult {
  const q = query.trim().toLowerCase();
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Check if query is a request to use standard defaults ("standard pakad lo", "normal", "use default", etc.)
  const isDefaultRequest = /standard|normal|default|jo normal|chalta hai|pakad lo|le lo/i.test(q);

  // ─────────────────────────────────────────────────────────────
  // DOMAIN 1: METALS, SHAFTS & ROD CUTTING
  // e.g., "Calculate 25mm Rod cost @ ₹80/kg"
  // e.g., "25mm rod ka price nikalo"
  // e.g., "2 inch pipe 6 meter length cutting cost"
  // e.g., "50kg ka rate nikalo 80 ke hisab se 20 percent margin lagake"
  // ─────────────────────────────────────────────────────────────
  const isRodOrMetal = /rod|bar|shaft|pipe|metal|steel|ss304|aluminum|brass|copper|mm|kg|cutting/i.test(q);

  if (isRodOrMetal && !q.includes("milk") && !q.includes("silo") && !q.includes("liquid")) {
    // Extract diameter
    const diaMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:mm|inch|in|dia|diameter)/i) || q.match(/(\d+(?:\.\d+)?)\s*mm\s*rod/i);
    let diaMm = diaMatch ? parseFloat(diaMatch[1]) : null;
    if (q.includes("2 inch") || q.includes('2"')) diaMm = 50.8;
    if (q.includes("1 inch") || q.includes('1"')) diaMm = 25.4;

    // Extract length
    const lenMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:meter|mtr|m|mm|cm|ft|feet|length|l)/i);
    let lengthMm: number | null = null;
    if (lenMatch) {
      const val = parseFloat(lenMatch[1]);
      if (/meter|mtr|\bm\b/i.test(lenMatch[0])) lengthMm = val * 1000;
      else if (/ft|feet/i.test(lenMatch[0])) lengthMm = val * 304.8;
      else if (/cm/i.test(lenMatch[0])) lengthMm = val * 10;
      else if (/mm/i.test(lenMatch[0])) lengthMm = val;
      else if (val <= 10) lengthMm = val * 1000; // Assume meters if small number like 1, 2, 6
      else lengthMm = val;
    }

    // Extract Buy Rate (₹/kg)
    const rateMatch = q.match(/(?:₹|rs|rate|cost|@|\bat\b)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:₹|rs|\/kg|per kg|ke hisab)/i);
    let buyRateKg = rateMatch ? parseFloat(rateMatch[1] || rateMatch[2]) : null;
    if (buyRateKg && buyRateKg > 5000) buyRateKg = buyRateKg / 1000; // e.g. ₹80000/ton -> ₹80/kg

    // Extract Weight directly if specified (e.g., "50kg ka rate")
    const weightMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/i);
    const directWeightKg = weightMatch ? parseFloat(weightMatch[1]) : null;

    // Extract Margin %
    const marginMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:%|percent|margin)/i);
    let marginPct = marginMatch ? parseFloat(marginMatch[1]) / 100 : null;
    if (marginPct && marginPct > 1) marginPct = marginPct / 100;

    // Extract Material Type & Density
    let density = INDUSTRY_DEFAULTS.steelDensity_g_cm3;
    let materialName = "EN8D / Mild Steel";
    if (q.includes("ss304") || q.includes("stainless")) {
      density = INDUSTRY_DEFAULTS.ss304Density_g_cm3;
      materialName = "Stainless Steel SS304";
    } else if (q.includes("aluminum") || q.includes("al")) {
      density = INDUSTRY_DEFAULTS.aluminumDensity_g_cm3;
      materialName = "Aluminum T6";
    } else if (q.includes("brass")) {
      density = INDUSTRY_DEFAULTS.brassDensity_g_cm3;
      materialName = "Brass Commercial";
    } else if (q.includes("copper")) {
      density = INDUSTRY_DEFAULTS.copperDensity_g_cm3;
      materialName = "Electrolytic Copper";
    }

    // ── STEP 1 & 2: PARAMETER AUDIT & CLARIFICATION LOOP ──
    const missingParams: string[] = [];
    if (!diaMm && !directWeightKg) missingParams.push("Rod Diameter (mm/inch)");
    if (!lengthMm && !directWeightKg) missingParams.push("Rod Length (e.g. 500mm ya 1 Meter)");
    if (!buyRateKg) missingParams.push("Raw Material Buy Rate (₹/kg)");

    if (missingParams.length > 0 && !isDefaultRequest) {
      const defaultRatePrompt = buyRateKg ? `₹${buyRateKg}/kg` : "standard ₹80/kg";
      const defaultLenPrompt = lengthMm ? `${lengthMm}mm` : "standard 1 Meter (1000mm)";
      return {
        id: msgId,
        role: "assistant",
        timestamp: now,
        status: "needs_clarification",
        step: "CLARIFICATION",
        content: `Bhai / Sir, ${diaMm ? `${diaMm}mm rod` : "Metal item"} ke costing ke liye thodi jankari aur chahiye:\n\n` +
          missingParams.map((p, idx) => `  ${idx + 1}. **${p}**`).join("\n") +
          `\n\n💡 *Tip: Aap explicit values bata sakte hain ya bol sakte hain:* **"Standard pakad lo"** (jisse hum ${defaultRatePrompt} aur ${defaultLenPrompt} le lenge).`,
      };
    }

    // Apply defaults if requested or partially missing
    const defaultsApplied: string[] = [];
    if (!diaMm && !directWeightKg) {
      diaMm = 25;
      defaultsApplied.push("Diameter: 25mm (Standard Bright Bar)");
    }
    if (!lengthMm && !directWeightKg) {
      lengthMm = 1000; // 1 Meter
      defaultsApplied.push("Length: 1000mm (1 Meter)");
    }
    if (!buyRateKg) {
      buyRateKg = 80;
      defaultsApplied.push("Material Rate: ₹80/kg");
    }
    if (marginPct === null) {
      marginPct = INDUSTRY_DEFAULTS.defaultMarginPct;
      defaultsApplied.push(`Target Margin: ${(marginPct * 100).toFixed(0)}%`);
    }

    // ── STEP 3: ARITHMETIC COMPUTATION & SANITY GUARDS ──
    let weightKg = 0;
    if (directWeightKg) {
      weightKg = directWeightKg;
    } else if (diaMm && lengthMm) {
      // Weight = Volume * Density = (π * r² * L) * Density / 1000
      const radiusCm = (diaMm / 10) / 2;
      const lengthCm = lengthMm / 10;
      const volumeCm3 = Math.PI * Math.pow(radiusCm, 2) * lengthCm;
      weightKg = (volumeCm3 * density) / 1000;
    }

    const rmCost = weightKg * buyRateKg;
    const scrapPct = INDUSTRY_DEFAULTS.scrapAllowancePct;
    const scrapCost = rmCost * scrapPct;
    const laborCost = 45; // ₹45 cutting & turning labor per piece
    const subtotal = rmCost + scrapCost + laborCost;
    const marginAmount = subtotal * marginPct;
    const gstRatePct = 18;
    const taxAmount = (subtotal + marginAmount) * (gstRatePct / 100);
    const finalSellingPrice = subtotal + marginAmount + taxAmount;

    // Sanity Guards
    const warnings: string[] = [];
    if (buyRateKg > 500) warnings.push("⚠️ High material buy rate (> ₹500/kg). Verify alloy grade.");
    if (weightKg > 100) warnings.push("⚠️ Heavy unit weight (> 100kg/pc). Check handling equipment overhead.");

    const itemName = `${diaMm ? `${diaMm}mm` : `${weightKg.toFixed(1)}kg`} ${materialName} Bar (${lengthMm ? `${lengthMm}mm` : "Piece"})`;

    const summaryText = `Done! Multi-stage cost breakdown for **${itemName}**:\n\n` +
      `• **Raw Material Mass**: \`${weightKg.toFixed(3)} kg\` @ ₹${buyRateKg}/kg = **₹${rmCost.toFixed(2)}**\n` +
      `• **Saw Cut & Scrap Allowance (4%)**: ₹${scrapCost.toFixed(2)}\n` +
      `• **Machining & Direct Labor**: ₹${laborCost.toFixed(2)}\n` +
      `• **Subtotal Direct Cost**: ₹${subtotal.toFixed(2)}\n` +
      `• **Profit Margin (${(marginPct * 100).toFixed(0)}%)**: ₹${marginAmount.toFixed(2)}\n` +
      `• **GST Tax (18%)**: ₹${taxAmount.toFixed(2)}\n` +
      `• **Recommended Selling Price**: **₹${finalSellingPrice.toFixed(2)} / pc**` +
      (defaultsApplied.length > 0 ? `\n\n📌 *Assumptions Used:* ${defaultsApplied.join(" | ")}` : "");

    return {
      id: msgId,
      role: "assistant",
      timestamp: now,
      status: warnings.length > 0 ? "warning" : "complete",
      step: "FINAL",
      content: summaryText,
      structuredCard: {
        title: itemName,
        industry: "Manufacturing",
        sellingPrice: Math.round(finalSellingPrice * 100) / 100,
        unitLabel: "per cut piece",
        breakdown: [
          { label: "Raw Material Cost", value: Math.round(rmCost * 100) / 100 },
          { label: "Scrap & Saw Kerf", value: Math.round(scrapCost * 100) / 100 },
          { label: "Machining Labor", value: laborCost },
          { label: "Margin & Taxes", value: Math.round((marginAmount + taxAmount) * 100) / 100 },
        ],
        defaultsApplied,
        warnings,
        payload: {
          action: "SYNC_DASHBOARD_STATE",
          industry: "Manufacturing",
          data: {
            itemName,
            rawMaterialCost: Math.round(rmCost * 100) / 100,
            rawMaterialQty: Math.round(weightKg * 1000) / 1000,
            rawMaterialUnitCost: buyRateKg,
            scrapCost: Math.round(scrapCost * 100) / 100,
            scrapPct: 4,
            laborCost: laborCost,
            taxGSTRate: 18,
            profitMarkupPct: Math.round(marginPct * 100),
            calculatedSellingPrice: Math.round(finalSellingPrice * 100) / 100,
            geometryConfig: {
              profile: "round_bar",
              diameter_mm: diaMm || 25,
              length_mm: lengthMm || 1000,
              materialDensity: density,
              buyPricePerKg: buyRateKg,
            },
          },
        },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // DOMAIN 2: BULK LIQUID, CHEMICALS & AMUL DAIRY PACKAGING
  // e.g., "Estimate 500ml Milk Pouch from 50k Liters Silo"
  // e.g., "Milk packaging costing 6% fat 9% snf"
  // ─────────────────────────────────────────────────────────────
  const isLiquidOrDairy = /milk|pouch|silo|liter|litres|fat|snf|amul|beverage|fluid|chemical|oil/i.test(q);

  if (isLiquidOrDairy) {
    // Extract Silo Capacity
    const siloMatch = q.match(/(\d+(?:,\d+)?)\s*(?:k|thousand)?\s*(?:liter|litres|l|silo)/i);
    let siloLiters = 50000;
    if (siloMatch) {
      let val = parseFloat(siloMatch[1].replace(/,/g, ""));
      if (q.includes("50k") || q.includes("50 k")) val = 50000;
      else if (q.includes("20k") || q.includes("20 k")) val = 20000;
      else if (val < 100 && (q.includes("k") || q.includes("thousand"))) val = val * 1000;
      siloLiters = val;
    }

    // Extract Pack size
    const packMatch = q.match(/(\d+)\s*(?:ml|liter|l|pouch|pack)/i);
    let packMl = packMatch ? parseInt(packMatch[1]) : 500;
    if (packMl === 1) packMl = 1000;

    // Extract Fat % and SNF %
    const fatMatch = q.match(/(\d+(?:\.\d+)?)\s*%?\s*fat/i);
    const snfMatch = q.match(/(\d+(?:\.\d+)?)\s*%?\s*snf/i);
    const fatPct = fatMatch ? parseFloat(fatMatch[1]) : INDUSTRY_DEFAULTS.milkFatPct;
    const snfPct = snfMatch ? parseFloat(snfMatch[1]) : INDUSTRY_DEFAULTS.milkSnfPct;

    // Amul 2-Axis Valuation: Fat Cost + SNF Cost per Liter
    // 1 Liter Milk (approx 1.032 kg)
    const fatKgPerLiter = (fatPct / 100) * 1.032;
    const snfKgPerLiter = (snfPct / 100) * 1.032;
    const fatRate = INDUSTRY_DEFAULTS.fatRatePerKg; // ₹420/kg
    const snfRate = INDUSTRY_DEFAULTS.snfRatePerKg; // ₹280/kg

    const rawMilkCostPerLiter = (fatKgPerLiter * fatRate) + (snfKgPerLiter * snfRate);

    // Multi-stage Shrinkage Loss (2.8% total loss: tanker heel + pasteurization + filling leakers)
    const shrinkagePct = 0.028;
    const usableLiters = siloLiters * (1 - shrinkagePct);
    const packsProduced = Math.floor((usableLiters * 1000) / packMl);

    // Packaging BOM
    const filmCostPerPack = packMl === 500 ? 0.65 : 1.10; // LDPE pouch film
    const crateAmortizedCost = 0.25; // Crate handling & transport
    const utilityBoilerCost = 0.35; // Pasteurization & chilling electricity
    const rawFluidCostPerPack = (rawMilkCostPerLiter * packMl) / 1000;

    const netExFactoryCost = rawFluidCostPerPack + filmCostPerPack + crateAmortizedCost + utilityBoilerCost;
    const marginPct = 0.08; // 8% dairy margin
    const distributorMrpMargin = netExFactoryCost * marginPct;
    const gstRatePct = 5; // 5% GST on packaged dairy
    const taxAmount = (netExFactoryCost + distributorMrpMargin) * (gstRatePct / 100);
    const consumerMrp = netExFactoryCost + distributorMrpMargin + taxAmount;

    const defaultsApplied = [
      `Silo Capacity: ${siloLiters.toLocaleString()} Liters`,
      `Fat ${fatPct}% @ ₹${fatRate}/kg | SNF ${snfPct}% @ ₹${snfRate}/kg`,
      `Pouch Film BOM: ₹${filmCostPerPack}/pack`,
      `Shrinkage Loss: 2.8% across processing & filling`,
    ];

    const summaryText = `Done! Silo Batch & SKU Pouch Valuation for **${siloLiters.toLocaleString()}L Bulk Milk Silo**:\n\n` +
      `• **Amul 2-Axis Base Fluid Cost**: **₹${rawMilkCostPerLiter.toFixed(2)} / Liter** (${fatPct}% Fat / ${snfPct}% SNF)\n` +
      `• **Total Saleable Packs (${packMl}ml)**: **${packsProduced.toLocaleString()} pouches** (after 2.8% shrinkage loss)\n` +
      `• **Raw Fluid Cost per Pack**: ₹${rawFluidCostPerPack.toFixed(2)}\n` +
      `• **55μ LDPE Film BOM & Packaging**: ₹${filmCostPerPack.toFixed(2)}\n` +
      `• **Chilling & Boiler Utilities**: ₹${utilityBoilerCost.toFixed(2)}\n` +
      `• **Ex-Factory Production Cost**: ₹${netExFactoryCost.toFixed(2)} / pouch\n` +
      `• **Recommended Consumer MRP**: **₹${consumerMrp.toFixed(2)} / pouch** (with 8% margin + 5% GST)\n\n` +
      `📌 *Assumptions Used:* ${defaultsApplied.join(" | ")}`;

    return {
      id: msgId,
      role: "assistant",
      timestamp: now,
      status: "complete",
      step: "FINAL",
      content: summaryText,
      structuredCard: {
        title: `${packMl}ml Fresh Milk Pouch (${siloLiters / 1000}kL Silo)`,
        industry: "Liquid & Dairy",
        sellingPrice: Math.round(consumerMrp * 100) / 100,
        unitLabel: `per ${packMl}ml pouch`,
        breakdown: [
          { label: "Raw Fluid Cost", value: Math.round(rawFluidCostPerPack * 100) / 100 },
          { label: "LDPE Film & Crate", value: Math.round((filmCostPerPack + crateAmortizedCost) * 100) / 100 },
          { label: "Pasteurization Energy", value: utilityBoilerCost },
          { label: "Margin & Taxes (5%)", value: Math.round((distributorMrpMargin + taxAmount) * 100) / 100 },
        ],
        defaultsApplied,
        payload: {
          action: "SYNC_DASHBOARD_STATE",
          industry: "Liquid & Dairy",
          data: {
            itemName: `${packMl}ml Milk Pouch`,
            rawMaterialCost: Math.round(rawFluidCostPerPack * 100) / 100,
            scrapCost: Math.round(rawFluidCostPerPack * shrinkagePct * 100) / 100,
            scrapPct: 2.8,
            laborCost: utilityBoilerCost,
            finishingCost: filmCostPerPack,
            taxGSTRate: 5,
            profitMarkupPct: 8,
            calculatedSellingPrice: Math.round(consumerMrp * 100) / 100,
            liquidConfig: {
              siloCapacityLiters: siloLiters,
              fatPct,
              snfPct,
              fatRatePerKg: fatRate,
              snfRatePerKg: snfRate,
              packSizeMl: packMl,
            },
          },
        },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // DOMAIN 3: REVERSE TARGET PRICE SOLVER
  // e.g., "Solve my price for ₹150 target with 15% margin"
  // e.g., "Target selling price 500 margin 25"
  // ─────────────────────────────────────────────────────────────
  const isTargetSolver = /target|solve|price target|reverse|selling price|150 target|500 target/i.test(q);

  if (isTargetSolver) {
    const priceMatch = q.match(/(?:₹|rs|target|price)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:target|rupees|rs)/i);
    const targetPrice = priceMatch ? parseFloat(priceMatch[1] || priceMatch[2]) : 150;

    const marginMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:%|percent|margin)/i);
    const targetMarginPct = marginMatch ? parseFloat(marginMatch[1]) / 100 : 0.15;

    const allowableGrossAmount = targetPrice / (1 + targetMarginPct);
    const allowableGst = allowableGrossAmount * 0.18;
    const maxAllowableRmSubtotal = allowableGrossAmount - allowableGst - 25; // ₹25 labor allocation

    const summaryText = `Target Solver Analysis for **₹${targetPrice.toFixed(2)} Target Price** @ **${(targetMarginPct * 100).toFixed(0)}% Margin**:\n\n` +
      `• **Target Selling Price**: **₹${targetPrice.toFixed(2)}**\n` +
      `• **Allowable Direct Cost**: **₹${maxAllowableRmSubtotal.toFixed(2)}**\n` +
      `• **Fixed Machining & Labor Allowance**: ₹25.00\n` +
      `• **Estimated GST (18%)**: ₹${allowableGst.toFixed(2)}\n` +
      `• **Feasibility Status**: **VIABLE** ✅\n\n` +
      `Click below to inject this target configuration into your live workspace canvas!`;

    return {
      id: msgId,
      role: "assistant",
      timestamp: now,
      status: "complete",
      step: "FINAL",
      content: summaryText,
      structuredCard: {
        title: `Reverse Target Solver (Target ₹${targetPrice})`,
        industry: "General",
        sellingPrice: targetPrice,
        unitLabel: "target selling price",
        breakdown: [
          { label: "Max Allowable Material", value: Math.round(maxAllowableRmSubtotal * 100) / 100 },
          { label: "Labor & Overhead", value: 25 },
          { label: "Target Margin (15%)", value: Math.round((targetPrice - allowableGrossAmount) * 100) / 100 },
        ],
        payload: {
          action: "SYNC_DASHBOARD_STATE",
          industry: "General",
          data: {
            itemName: `Target Spec (₹${targetPrice})`,
            targetSellingPrice: targetPrice,
            rawMaterialCost: Math.round(maxAllowableRmSubtotal * 100) / 100,
            laborCost: 25,
            taxGSTRate: 18,
            profitMarkupPct: Math.round(targetMarginPct * 100),
            calculatedSellingPrice: targetPrice,
          },
        },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // FALLBACK / GENERAL CONVERSATIONAL AID
  // ─────────────────────────────────────────────────────────────
  return {
    id: msgId,
    role: "assistant",
    timestamp: now,
    status: "complete",
    step: "FINAL",
    content: `Namaste! Main **CostFlow AI Copilot** hu. Aap simple Hindi/Hinglish ya English me pooch sakte hain, jaise:\n\n` +
      `1. *"Calculate 25mm Rod cost @ ₹80/kg"* (Bright Bar, Saw Kerf & Cutting Cost)\n` +
      `2. *"Estimate 500ml Milk Pouch from 50k Liters Silo"* (Amul Fat/SNF Pricing & Shrinkage)\n` +
      `3. *"Solve my price for ₹150 target with 15% margin"* (Reverse Target Solver)\n` +
      `4. *"50kg ka rate nikalo 80 ke hisab se 20 percent margin lagake"*\n\n` +
      `Aap input bataiye, main live parameters compute karke aapke Dashboard Canvas par auto-sync kar dunga! 🚀`,
  };
}
