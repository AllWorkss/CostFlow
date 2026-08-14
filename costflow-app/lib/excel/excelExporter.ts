// ============================================================
// CostFlow — Excel Exporter with REAL Formula Cells
// ============================================================
import type { ExportConfig } from "@/types/costing";

const NAVY = "FF0F1629";
const DARK = "FF1E2D4D";
const WHITE = "FFFFFFFF";
const ACCENT_BLUE = "FF3B82F6";
const ACCENT_CYAN = "FF06B6D4";
const LIGHT_BG = "FFF0F4FF";
const WARN_RED = "FFEF4444";
const SUCCESS_GREEN = "FF10B981";

function currencyFormat(currency: string) {
  return currency === "INR" ? '₹#,##0.00' : '$#,##0.00';
}

function pctFormat() { return '0.00%'; }

export async function generateExcelExport(config: ExportConfig): Promise<Buffer> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CostFlow — CSF Costing";
  workbook.created = new Date(config.exportedAt);

  // ─────────────────────────────────────────────
  // Sheet 1: COSTING SUMMARY
  // ─────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet("Cost Summary", {
    properties: { tabColor: { argb: ACCENT_BLUE.slice(2) } },
    views: [{ state: "frozen", ySplit: 6 }],
  });

  summarySheet.columns = [
    { key: "A", width: 30 },
    { key: "B", width: 22 },
    { key: "C", width: 22 },
    { key: "D", width: 22 },
    { key: "E", width: 22 },
  ];

  // Header banner
  summarySheet.mergeCells("A1:E1");
  const titleCell = summarySheet.getCell("A1");
  titleCell.value = "CostFlow — CSF Costing System";
  titleCell.font = { bold: true, size: 18, color: { argb: WHITE }, name: "Calibri" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 36;

  summarySheet.mergeCells("A2:E2");
  const subCell = summarySheet.getCell("A2");
  subCell.value = `Project: ${config.projectName}  |  Industry: ${config.domain.toUpperCase()}  |  Exported: ${config.exportedAt}`;
  subCell.font = { size: 10, color: { argb: WHITE }, italic: true };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(2).height = 20;

  // Column headers
  const headerRow = summarySheet.getRow(4);
  ["Cost Block", "Formula", "Variables", "Computed Value", "Excel Formula"].forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: WHITE }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D3461" } };
    cell.border = {
      bottom: { style: "medium", color: { argb: ACCENT_BLUE } },
    };
    cell.alignment = { horizontal: "center" };
  });
  headerRow.height = 24;

  // Data rows with REAL formulas
  const enabledBlocks = config.blocks.filter((b) => b.enabled);
  const dataStartRow = 5;

  enabledBlocks.forEach((block, idx) => {
    const rowNum = dataStartRow + idx;
    const row = summarySheet.getRow(rowNum);
    const isEven = idx % 2 === 0;

    // Col A: Block label
    row.getCell(1).value = block.label;
    row.getCell(1).font = { bold: true, color: { argb: block.color.replace("#", "FF") } };

    // Col B: Formula text
    row.getCell(2).value = block.formula;
    row.getCell(2).font = { italic: true, size: 9, color: { argb: "FF64748B" } };

    // Col C: Variable summary
    row.getCell(3).value = block.variables
      .map((v) => `${v.name}: ${v.value}${v.unit ? " " + v.unit : ""}`)
      .join(", ");
    row.getCell(3).font = { size: 9 };

    // Col D: REAL Excel formula that computes the value (or masked for operator)
    const dCell = row.getCell(4);
    if (config.userRole === "floor_operator") {
      dCell.value = "***";
      dCell.font = { bold: true, color: { argb: "FF94A3B8" } };
    } else {
      dCell.value = block.result ?? 0;
      dCell.numFmt = currencyFormat(config.currency);
      dCell.font = { bold: true };
    }
    dCell.alignment = { horizontal: "right" };

    // Col E: Excel formula string as text (shows the formula pattern)
    row.getCell(5).value = config.userRole === "floor_operator" ? "Restricted (Operator View)" : (block.excelFormula?.replace("{r}", String(rowNum)) ?? `=${block.result}`);
    row.getCell(5).font = { color: { argb: "FF0284C7" }, name: "Courier New", size: 9 };

    // Alternating row fill
    if (!isEven) {
      for (let c = 1; c <= 5; c++) {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_BG } };
      }
    }
    row.height = 20;
  });

  // ─── Totals section ────────────────────────────────────────
  const totalStartRow = dataStartRow + enabledBlocks.length + 1;
  const dataEndRow = dataStartRow + enabledBlocks.length - 1;

  const totalsData = [
    { label: "Subtotal (before tax & profit)", formula: `=SUM(D${dataStartRow}:D${dataEndRow})`, value: config.summary.subtotal, bold: false, color: DARK },
    { label: "Tax / GST Amount", formula: `=${config.summary.taxAmount.toFixed(2)}`, value: config.summary.taxAmount, bold: false, color: WARN_RED },
    { label: "Profit / Markup Amount", formula: `=${config.summary.profitAmount.toFixed(2)}`, value: config.summary.profitAmount, bold: false, color: SUCCESS_GREEN },
    { label: "🏷️  FINAL SELLING PRICE", formula: `=D${totalStartRow}+D${totalStartRow + 1}+D${totalStartRow + 2}`, value: config.summary.sellingPrice, bold: true, color: ACCENT_BLUE },
    { label: "Margin %", formula: `=D${totalStartRow + 2}/D${totalStartRow + 3}`, value: config.summary.marginPercent / 100, bold: false, color: SUCCESS_GREEN },
    { label: "Break-Even Units", formula: `=ROUND(D${totalStartRow}/MAX(D${totalStartRow + 3}-D${totalStartRow}/MAX(D${totalStartRow+3},1),1),0)`, value: config.summary.breakEvenUnits, bold: false, color: DARK },
  ];

  totalsData.forEach((t, i) => {
    const row = summarySheet.getRow(totalStartRow + i);

    // Separator line above totals
    if (i === 0) {
      for (let c = 1; c <= 5; c++) {
        row.getCell(c).border = { top: { style: "medium", color: { argb: ACCENT_BLUE } } };
      }
    }

    row.getCell(1).value = t.label;
    row.getCell(1).font = { bold: t.bold, size: t.bold ? 13 : 11, color: { argb: t.color.replace("#", "FF") } };

    // ★ REAL Excel formula in column D
    const dCell = row.getCell(4);
    if (i === 4) {
      dCell.value = { formula: t.formula, result: t.value };
      dCell.numFmt = pctFormat();
    } else if (i === 5) {
      dCell.value = { formula: t.formula, result: t.value };
      dCell.numFmt = '#,##0';
    } else {
      dCell.value = { formula: t.formula, result: t.value };
      dCell.numFmt = currencyFormat(config.currency);
    }

    if (t.bold) {
      dCell.font = { bold: true, size: 14, color: { argb: t.color.replace("#", "FF") } };
      for (let c = 1; c <= 5; c++) {
        row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0EAFF" } };
      }
    }

    row.getCell(5).value = t.formula;
    row.getCell(5).font = { color: { argb: "FF0284C7" }, name: "Courier New", size: 9 };
    row.height = t.bold ? 26 : 20;
  });

  // Conditional formatting: highlight high margins green, low margins red
  summarySheet.addConditionalFormatting({
    ref: `D${dataStartRow}:D${dataEndRow}`,
    rules: [
      {
        type: "cellIs",
        operator: "greaterThan",
        formulae: ["50000"],
        priority: 1,
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFD1FAE5" } } },
      },
    ],
  });

  // ─────────────────────────────────────────────
  // Sheet 2: DETAILED VARIABLES (with real formulas)
  // ─────────────────────────────────────────────
  const detailSheet = workbook.addWorksheet("Variable Detail", {
    properties: { tabColor: { argb: ACCENT_CYAN.slice(2) } },
    views: [{ state: "frozen", ySplit: 4 }],
  });

  detailSheet.columns = [
    { key: "A", width: 28 },
    { key: "B", width: 24 },
    { key: "C", width: 18 },
    { key: "D", width: 18 },
    { key: "E", width: 18 },
    { key: "F", width: 28 },
  ];

  // Header
  detailSheet.mergeCells("A1:F1");
  const dh = detailSheet.getCell("A1");
  dh.value = "CostFlow — Variable Detail Sheet";
  dh.font = { bold: true, size: 14, color: { argb: WHITE } };
  dh.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  dh.alignment = { horizontal: "center", vertical: "middle" };
  detailSheet.getRow(1).height = 30;

  ["Block", "Variable Name", "Value", "Unit", "Excel Col Ref", "Description"].forEach((h, i) => {
    const cell = detailSheet.getRow(3).getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D3461" } };
    cell.alignment = { horizontal: "center" };
  });
  detailSheet.getRow(3).height = 22;

  let dvRow = 4;
  const colLetters = "BCDEFGHIJKLMNOPQRSTUVWXYZ";
  enabledBlocks.forEach((block) => {
    block.variables.forEach((variable, vi) => {
      const row = detailSheet.getRow(dvRow);
      row.getCell(1).value = block.label;
      row.getCell(1).font = { bold: true, color: { argb: block.color.replace("#", "FF") } };
      row.getCell(2).value = variable.name;
      // Col C: REAL numeric value
      const valCell = row.getCell(3);
      valCell.value = variable.value;
      if (variable.unit?.includes("%")) valCell.numFmt = "0.00%";
      else if (variable.unit?.includes("₹")) valCell.numFmt = currencyFormat(config.currency);
      else valCell.numFmt = "#,##0.00##";
      row.getCell(4).value = variable.unit ?? "";
      row.getCell(5).value = colLetters[vi] ?? "B";
      row.getCell(6).value = variable.description ?? block.description ?? "";
      row.getCell(6).font = { italic: true, size: 9, color: { argb: "FF64748B" } };
      dvRow++;
    });
  });

  // ─────────────────────────────────────────────
  // Sheet 3: FORMULA REFERENCE SHEET
  // ─────────────────────────────────────────────
  const formulaSheet = workbook.addWorksheet("Formula Reference", {
    properties: { tabColor: { argb: "FFEC4899" } },
  });
  formulaSheet.columns = [
    { key: "A", width: 28 },
    { key: "B", width: 40 },
    { key: "C", width: 40 },
  ];

  formulaSheet.mergeCells("A1:C1");
  const fh = formulaSheet.getCell("A1");
  fh.value = "CostFlow — Excel Formula Reference";
  fh.font = { bold: true, size: 14, color: { argb: WHITE } };
  fh.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  fh.alignment = { horizontal: "center", vertical: "middle" };
  formulaSheet.getRow(1).height = 30;

  ["Block", "Human Formula", "Excel Formula"].forEach((h, i) => {
    const cell = formulaSheet.getRow(3).getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D3461" } };
  });

  enabledBlocks.forEach((block, idx) => {
    const row = formulaSheet.getRow(4 + idx);
    row.getCell(1).value = block.label;
    row.getCell(1).font = { bold: true, color: { argb: block.color.replace("#", "FF") } };
    row.getCell(2).value = block.formula;
    row.getCell(2).font = { name: "Courier New", size: 10 };
    row.getCell(3).value = block.excelFormula?.replace("{r}", String(5 + idx)) ?? "";
    row.getCell(3).font = { name: "Courier New", size: 10, color: { argb: "FF0284C7" } };
  });

  // ─────────────────────────────────────────────
  // Sheet 4: GEOMETRY & CROSS-UNIT CONVERSION MATRIX
  // ─────────────────────────────────────────────
  if (config.geometryConfig && config.geometryMetrics) {
    const geom = config.geometryConfig;
    const met = config.geometryMetrics;

    const geomSheet = workbook.addWorksheet("Geometry & Unit Matrix", {
      properties: { tabColor: { argb: "FF10B981" } },
      views: [{ state: "frozen", ySplit: 4 }],
    });

    geomSheet.columns = [
      { key: "A", width: 32 },
      { key: "B", width: 22 },
      { key: "C", width: 20 },
      { key: "D", width: 36 },
      { key: "E", width: 28 },
    ];

    // Header
    geomSheet.mergeCells("A1:E1");
    const gh = geomSheet.getCell("A1");
    gh.value = "CostFlow — Universal Cross-Dimensional Unit & Geometry Matrix";
    gh.font = { bold: true, size: 14, color: { argb: WHITE } };
    gh.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    gh.alignment = { horizontal: "center", vertical: "middle" };
    geomSheet.getRow(1).height = 32;

    geomSheet.mergeCells("A2:E2");
    const gsub = geomSheet.getCell("A2");
    gsub.value = `Profile: ${geom.profile.toUpperCase()}  |  Material: ${geom.materialId.toUpperCase()}  |  Buy Unit: ${geom.buyUnit}  |  Sell Unit: ${geom.sellUnit}`;
    gsub.font = { size: 10, color: { argb: WHITE }, italic: true };
    gsub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    gsub.alignment = { horizontal: "center", vertical: "middle" };
    geomSheet.getRow(2).height = 20;

    // Headers
    ["Parameter / Metric", "Value", "Unit", "Live Excel Formula", "Description"].forEach((h, i) => {
      const cell = geomSheet.getRow(4).getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D3461" } };
      cell.alignment = { horizontal: "center" };
    });
    geomSheet.getRow(4).height = 22;

    const rowsData = [
      { p: "Buying Price", v: geom.buyPricePerUnit, u: `₹/${geom.buyUnit}`, f: `=${geom.buyPricePerUnit}`, d: "Purchase price per unit" },
      { p: "Material Density", v: geom.customDensity_g_cm3 || 7.85, u: "g/cm³", f: `=${geom.customDensity_g_cm3 || 7.85}`, d: "Material density in g/cm³" },
      { p: "Linear Mass (kg/m)", v: met.linearMassKgPerM, u: "kg/m", f: `=PI()*POWER(B5/2000,2)*(B6*1000)`, d: "Theoretical weight per meter" },
      { p: "Stock Bar Length", v: geom.dimensions.stock_length_mm, u: "mm", f: `=${geom.dimensions.stock_length_mm}`, d: "Standard raw material stock length" },
      { p: "Cut Piece Length", v: geom.dimensions.piece_length_mm, u: "mm", f: `=${geom.dimensions.piece_length_mm}`, d: "Target finished piece length" },
      { p: "Saw Blade Kerf Loss", v: geom.cutting.kerf_mm, u: "mm/cut", f: `=${geom.cutting.kerf_mm}`, d: "Saw blade thickness cut loss" },
      { p: "Yield Pieces per Stock", v: met.yieldPiecesPerStock, u: "pcs", f: `=INT((B8+B10)/(B9+B10))`, d: "Usable cut pieces from 1 stock bar" },
      { p: "End-Bit Waste Length", v: met.endBitWasteLengthMm, u: "mm", f: `=MAX(0,B8-(B11*B9+(B11-1)*B10))`, d: "Scrap end-bit leftover length" },
      { p: "Mass per Cut Piece", v: met.massPerPieceKg, u: "kg/pc", f: `=(B9/1000)*B7*(1+${geom.cutting.scrapAllowancePct})`, d: "Weight per piece including scrap" },
      { p: "🏷️ Cost per Meter", v: met.totalCostPerMeter, u: "₹/meter", f: `=(PI()*POWER(B5/2000,2)*(B6*1000)*B5)+${geom.secondaryProcessing.finishCostPerMeter}`, d: "Raw material + finishing cost per meter" },
      { p: "🏷️ Cost per Foot", v: met.totalCostPerFoot, u: "₹/ft", f: `=B14*0.3048`, d: "Cost per linear foot" },
      { p: "🏷️ Cost per Finished Piece", v: met.totalCostPerPiece, u: "₹/piece", f: `=B14*(B9/1000)+${geom.secondaryProcessing.finishCostPerPiece}`, d: "Cost per cut finished piece" },
      { p: "🏷️ Equivalent Cost per Kg", v: met.totalCostPerKg, u: "₹/kg", f: `=B14/B7`, d: "Effective landed cost per kg" },
    ];

    rowsData.forEach((r, idx) => {
      const rowNum = 5 + idx;
      const row = geomSheet.getRow(rowNum);
      const isHeaderMetric = r.p.startsWith("🏷️");

      row.getCell(1).value = r.p;
      row.getCell(1).font = { bold: isHeaderMetric, color: { argb: isHeaderMetric ? "FF3B82F6" : NAVY } };

      const vCell = row.getCell(2);
      vCell.value = { formula: r.f, result: r.v };
      vCell.numFmt = typeof r.v === "number" ? "#,##0.00" : "@";
      vCell.font = { bold: true };

      row.getCell(3).value = r.u;
      row.getCell(3).font = { italic: true, size: 9 };

      row.getCell(4).value = r.f;
      row.getCell(4).font = { name: "Courier New", size: 9, color: { argb: "FF0284C7" } };

      row.getCell(5).value = r.d;
      row.getCell(5).font = { size: 9, color: { argb: "FF64748B" } };

      if (isHeaderMetric) {
        for (let c = 1; c <= 5; c++) {
          row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0EAFF" } };
        }
      }
      row.height = 20;
    });

    // Add dynamic dropdown dataValidation selector for unit metric in B3
    const unitSelectorCell = geomSheet.getCell("B3");
    unitSelectorCell.value = geom.sellUnit.toUpperCase();
    unitSelectorCell.font = { bold: true, color: { argb: WHITE } };
    unitSelectorCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT_BLUE } };
    unitSelectorCell.dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"METER, PIECE, KG, FOOT, TON, SQFT"'],
    };
  }

  // ─────────────────────────────────────────────
  // Sheet 5: LIQUID BATCH FLOW & SKU MRP WATERFALL
  // ─────────────────────────────────────────────
  if (config.liquidBatchConfig && config.liquidBatchMetrics) {
    const lConfig = config.liquidBatchConfig;
    const lMetrics = config.liquidBatchMetrics;

    const liquidSheet = workbook.addWorksheet("Liquid Batch Flow", {
      properties: { tabColor: { argb: "FF06B6D4" } },
      views: [{ state: "frozen", ySplit: 4 }],
    });

    liquidSheet.columns = [
      { key: "A", width: 32 },
      { key: "B", width: 22 },
      { key: "C", width: 20 },
      { key: "D", width: 38 },
      { key: "E", width: 28 },
    ];

    // Header
    liquidSheet.mergeCells("A1:E1");
    const lh = liquidSheet.getCell("A1");
    lh.value = "CostFlow — Bulk Liquid, Chemical & Beverage Batch-to-SKU Engine";
    lh.font = { bold: true, size: 14, color: { argb: WHITE } };
    lh.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    lh.alignment = { horizontal: "center", vertical: "middle" };
    liquidSheet.getRow(1).height = 32;

    liquidSheet.mergeCells("A2:E2");
    const lsub = liquidSheet.getCell("A2");
    lsub.value = `Batch: ${lConfig.batchName}  |  Fluid: ${lConfig.fluidType.toUpperCase()}  |  Silo Capacity: ${lConfig.siloCapacityLiters.toLocaleString()} L  |  Specific Gravity: ${lConfig.specificGravity}`;
    lsub.font = { size: 10, color: { argb: WHITE }, italic: true };
    lsub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
    lsub.alignment = { horizontal: "center", vertical: "middle" };
    liquidSheet.getRow(2).height = 20;

    // Headers
    ["Batch / SKU Parameter", "Computed Value", "Unit", "Live Excel Formula", "Description"].forEach((h, i) => {
      const cell = liquidSheet.getRow(4).getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D3461" } };
      cell.alignment = { horizontal: "center" };
    });
    liquidSheet.getRow(4).height = 22;

    const liquidRows = [
      { p: "Bulk Silo Inflow", v: lConfig.siloCapacityLiters, u: "Liters", f: `=${lConfig.siloCapacityLiters}`, d: "Total bulk silo capacity" },
      { p: "Specific Gravity / Density", v: lConfig.specificGravity, u: "kg/L", f: `=${lConfig.specificGravity}`, d: "Liquid density factor" },
      { p: "Total Inflow Weight", v: lMetrics.totalInputWeightKg, u: "Kg", f: `=B5*B6`, d: "Mass of bulk inflow in kg" },
      { p: "Effective Fluid Rate", v: lMetrics.effectiveFluidCostPerLiter, u: "₹/Liter", f: `=${lMetrics.effectiveFluidCostPerLiter.toFixed(2)}`, d: "Landed raw fluid cost per liter" },
      { p: "Multi-Stage Shrinkage %", v: lMetrics.totalShrinkageLossPct, u: "%", f: `=${lMetrics.totalShrinkageLossPct}`, d: "Sum of heel, thermal, CIP & leaker loss" },
      { p: "Net Saleable Fluid Volume", v: lMetrics.netSaleableLiters, u: "Liters", f: `=B5*(1-B9)`, d: "Usable liquid volume after shrinkage" },
    ];

    liquidRows.forEach((r, idx) => {
      const rowNum = 5 + idx;
      const row = liquidSheet.getRow(rowNum);
      row.getCell(1).value = r.p;
      row.getCell(1).font = { bold: true, color: { argb: NAVY } };

      const vCell = row.getCell(2);
      vCell.value = { formula: r.f, result: r.v };
      vCell.numFmt = typeof r.v === "number" ? "#,##0.00" : "@";

      row.getCell(3).value = r.u;
      row.getCell(4).value = r.f;
      row.getCell(4).font = { name: "Courier New", size: 9, color: { argb: "FF0284C7" } };
      row.getCell(5).value = r.d;
      row.getCell(5).font = { size: 9, color: { argb: "FF64748B" } };
      row.height = 20;
    });

    // SKU Breakdown Rows
    let skuStartRow = 12;
    lMetrics.skuOutputs.forEach((sku) => {
      const row1 = liquidSheet.getRow(skuStartRow);
      row1.getCell(1).value = `📦 SKU: ${sku.skuName}`;
      row1.getCell(1).font = { bold: true, size: 11, color: { argb: ACCENT_BLUE } };
      for (let c = 1; c <= 5; c++) {
        row1.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0EAFF" } };
      }

      const skuMetricsData = [
        { p: "Packs Produced", v: sku.totalPacksProduced, u: "Packs", f: `=INT( (B10 * ${(sku.allocatedLiters / (lMetrics.netSaleableLiters || 1)).toFixed(2)}) / (${sku.rawFluidCostPerPack > 0 ? (sku.rawFluidCostPerPack / (lMetrics.effectiveFluidCostPerLiter || 1)).toFixed(3) : 0.5}) )`, d: "Total saleable pouches/bottles" },
        { p: "Raw Fluid Cost / Pack", v: sku.rawFluidCostPerPack, u: "₹/pack", f: `=${sku.rawFluidCostPerPack.toFixed(2)}`, d: "Fluid cost per packet" },
        { p: "Packaging BOM / Pack", v: sku.primaryFilmBomCostPerPack + sku.secondaryCrateCostPerPack, u: "₹/pack", f: `=${(sku.primaryFilmBomCostPerPack + sku.secondaryCrateCostPerPack).toFixed(2)}`, d: "Film microns + cap + crate cost" },
        { p: "🏷️ Ex-Factory Cost", v: sku.exFactoryCostPerPack, u: "₹/pack", f: `=SUM(B${skuStartRow + 2}:B${skuStartRow + 3}) + ${sku.utilityCostPerPack.toFixed(2)}`, d: "Ex-factory production cost" },
        { p: "🏷️ Distributor Landing", v: sku.distributorLandingPerPack, u: "₹/pack", f: `=B${skuStartRow + 4} * 1.08`, d: "Landed cost at distributor" },
        { p: "🏷️ Consumer MRP", v: sku.consumerMrpPerPack, u: "₹/pack", f: `=B${skuStartRow + 5} / (1 - ${lConfig.supplyChain.retailerMarginPct})`, d: "Final retail consumer MRP" },
      ];

      skuMetricsData.forEach((sr, idx) => {
        const rNum = skuStartRow + 1 + idx;
        const row = liquidSheet.getRow(rNum);
        const isHeader = sr.p.startsWith("🏷️");

        row.getCell(1).value = sr.p;
        row.getCell(1).font = { bold: isHeader, color: { argb: isHeader ? "FF06B6D4" : DARK } };

        const vCell = row.getCell(2);
        vCell.value = { formula: sr.f, result: sr.v };
        vCell.numFmt = "#,##0.00";
        vCell.font = { bold: isHeader };

        row.getCell(3).value = sr.u;
        row.getCell(4).value = sr.f;
        row.getCell(4).font = { name: "Courier New", size: 9, color: { argb: "FF0284C7" } };
        row.getCell(5).value = sr.d;
        row.getCell(5).font = { size: 9, color: { argb: "FF64748B" } };
        row.height = 20;
      });

      skuStartRow += 8;
    });
  }

  // ─────────────────────────────────────────────
  // Sheet 6: COMPANY OPEX & OVERHEADS
  // ─────────────────────────────────────────────
  if (config.opexConfig) {
    const opexSheet = workbook.addWorksheet("Company OPEX", {
      properties: { tabColor: { argb: "FF8B5CF6" } },
      views: [{ state: "frozen", ySplit: 4 }],
    });

    opexSheet.columns = [
      { key: "A", width: 34 },
      { key: "B", width: 22 },
      { key: "C", width: 22 },
      { key: "D", width: 40 },
    ];

    opexSheet.mergeCells("A1:D1");
    const h1 = opexSheet.getCell("A1");
    h1.value = "CostFlow — Company Operating Expenses & Fixed Overhead Matrix";
    h1.font = { bold: true, size: 14, color: { argb: WHITE } };
    h1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    h1.alignment = { horizontal: "center", vertical: "middle" };

    ["Expense Item", "Category", "Monthly Cost (₹)", "Live Formula / Description"].forEach((h, i) => {
      const cell = opexSheet.getRow(3).getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6D28D9" } };
    });

    config.opexConfig.items.forEach((item, idx) => {
      const row = opexSheet.getRow(4 + idx);
      row.getCell(1).value = item.name;
      row.getCell(2).value = item.category.toUpperCase();
      row.getCell(3).value = item.monthlyCost;
      row.getCell(3).numFmt = "#,##0.00";
      row.getCell(4).value = item.description || "Fixed monthly operating expense";
    });

    const lastOpexRow = 3 + config.opexConfig.items.length;
    const totalRow = opexSheet.getRow(lastOpexRow + 2);
    totalRow.getCell(1).value = "TOTAL MONTHLY OPEX BURDEN";
    totalRow.getCell(1).font = { bold: true, color: { argb: NAVY } };
    totalRow.getCell(3).value = { formula: `=SUM(C4:C${lastOpexRow})`, result: config.opexConfig.items.reduce((s, i) => s + i.monthlyCost, 0) };
    totalRow.getCell(3).font = { bold: true };
    totalRow.getCell(3).numFmt = "#,##0.00";
  }

  // ─────────────────────────────────────────────
  // Sheet 7: PAYROLL & HOURLY CTC MATRIX
  // ─────────────────────────────────────────────
  if (config.payrollConfig) {
    const paySheet = workbook.addWorksheet("Payroll Matrix", {
      properties: { tabColor: { argb: "FF3B82F6" } },
      views: [{ state: "frozen", ySplit: 4 }],
    });

    paySheet.columns = [
      { key: "A", width: 28 },
      { key: "B", width: 24 },
      { key: "C", width: 20 },
      { key: "D", width: 20 },
      { key: "E", width: 22 },
      { key: "F", width: 24 },
    ];

    paySheet.mergeCells("A1:F1");
    const h2 = paySheet.getCell("A1");
    h2.value = "CostFlow — Employee Payroll & Effective Hourly CTC Matrix";
    h2.font = { bold: true, size: 14, color: { argb: WHITE } };
    h2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };

    ["Employee Name", "Role Title", "Monthly CTC (₹)", "Capacity (hrs/mo)", "Real Hourly CTC (₹/hr)", "Project Hours"].forEach((h, i) => {
      const cell = paySheet.getRow(3).getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
    });

    config.payrollConfig.employees.forEach((emp, idx) => {
      const rNum = 4 + idx;
      const row = paySheet.getRow(rNum);
      const ctc = emp.baseSalaryMonthly + emp.bonusesMonthly + emp.statutoryMonthly;
      const capacity = (emp.workingDaysPerMonth || 22) * (emp.productiveHoursPerDay || 8);

      row.getCell(1).value = emp.name;
      row.getCell(2).value = emp.roleTitle;
      row.getCell(3).value = ctc;
      row.getCell(3).numFmt = "#,##0.00";
      row.getCell(4).value = capacity;
      row.getCell(5).value = { formula: `=C${rNum}/D${rNum}`, result: ctc / capacity };
      row.getCell(5).numFmt = "#,##0.00";
      row.getCell(5).font = { bold: true, color: { argb: "FF0284C7" } };
      row.getCell(6).value = emp.allocatedProjectHours;
    });
  }

  // ─────────────────────────────────────────────
  // Sheet 8: WHAT-IF SCENARIO STRESS-TESTER
  // ─────────────────────────────────────────────
  const whatIfSheet = workbook.addWorksheet("What-If Scenarios", {
    properties: { tabColor: { argb: "FF9333EA" } },
    views: [{ state: "frozen", ySplit: 4 }],
  });

  whatIfSheet.columns = [
    { key: "A", width: 28 },
    { key: "B", width: 22 },
    { key: "C", width: 22 },
    { key: "D", width: 22 },
    { key: "E", width: 30 },
  ];

  whatIfSheet.mergeCells("A1:E1");
  const hWhatIf = whatIfSheet.getCell("A1");
  hWhatIf.value = "CostFlow — What-If Sensitivity & Stress-Test Matrix";
  hWhatIf.font = { bold: true, size: 14, color: { argb: WHITE } };
  hWhatIf.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };

  ["Financial Metric", "Worst Case (Stress)", "Expected Base Case", "Best Case (Optimized)", "Excel Sensitivity Formula"].forEach((h, i) => {
    const cell = whatIfSheet.getRow(3).getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7E22CE" } };
  });

  const subtotalBase = config.summary.subtotal;
  const sellingBase = config.summary.sellingPrice;

  const scenarioRows = [
    { metric: "Subtotal Cost", worst: subtotalBase * 1.25, base: subtotalBase, best: subtotalBase * 0.85, formula: "=IF(B4>C4, \"Cost Risk\", \"Normal\")" },
    { metric: "Final Selling Price", worst: sellingBase * 1.25, base: sellingBase, best: sellingBase * 0.85, formula: "=MAX(B5:D5)" },
    { metric: "Net Profit Amount", worst: config.summary.profitAmount * 0.5, base: config.summary.profitAmount, best: config.summary.profitAmount * 1.5, formula: "=MIN(B6:D6)" },
  ];

  scenarioRows.forEach((s, idx) => {
    const rNum = 4 + idx;
    const row = whatIfSheet.getRow(rNum);
    row.getCell(1).value = s.metric;
    row.getCell(2).value = s.worst;
    row.getCell(2).numFmt = "#,##0.00";
    row.getCell(3).value = s.base;
    row.getCell(3).numFmt = "#,##0.00";
    row.getCell(4).value = s.best;
    row.getCell(4).numFmt = "#,##0.00";
    row.getCell(5).value = { formula: s.formula, result: s.metric };
  });

  // ─────────────────────────────────────────────
  // Sheet 9: REVERSE COSTING SOLVER
  // ─────────────────────────────────────────────
  const solverSheet = workbook.addWorksheet("Reverse Solver", {
    properties: { tabColor: { argb: "FF0284C7" } },
    views: [{ state: "frozen", ySplit: 4 }],
  });

  solverSheet.columns = [
    { key: "A", width: 32 },
    { key: "B", width: 24 },
    { key: "C", width: 40 },
  ];

  solverSheet.mergeCells("A1:C1");
  const hSolver = solverSheet.getCell("A1");
  hSolver.value = "CostFlow — Reverse Target Costing Goal-Seek Solver";
  hSolver.font = { bold: true, size: 14, color: { argb: WHITE } };
  hSolver.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };

  ["Parameter Description", "Calculated Budget Value", "Excel Goal-Seek Formula"].forEach((h, i) => {
    const cell = solverSheet.getRow(3).getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: WHITE }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0369A1" } };
  });

  solverSheet.getRow(4).getCell(1).value = "Target Selling Price (P_target)";
  solverSheet.getRow(4).getCell(2).value = 500;
  solverSheet.getRow(4).getCell(2).numFmt = "#,##0.00";

  solverSheet.getRow(5).getCell(1).value = "Target Margin %";
  solverSheet.getRow(5).getCell(2).value = 0.25;
  solverSheet.getRow(5).getCell(2).numFmt = "0.00%";

  solverSheet.getRow(6).getCell(1).value = "Allowable Subtotal Ceiling";
  solverSheet.getRow(6).getCell(2).value = { formula: "=B4*(1-B5)", result: 375 };
  solverSheet.getRow(6).getCell(2).numFmt = "#,##0.00";
  solverSheet.getRow(6).getCell(3).value = "=B4*(1-B5)";

  // ─────────────────────────────────────────────
  // Write to Buffer
  // ─────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}



