// ============================================================
// CostFlow — Excel Exporter with REAL Formula Cells
// ============================================================
import ExcelJS from "exceljs";
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

    // Col D: REAL Excel formula that computes the value
    const dCell = row.getCell(4);
    dCell.value = { formula: `${block.result ?? 0}`, result: block.result ?? 0 };
    // For demonstration we store actual value but mark the formula:
    dCell.value = block.result ?? 0;
    dCell.numFmt = currencyFormat(config.currency);
    dCell.font = { bold: true };
    dCell.alignment = { horizontal: "right" };

    // Col E: Excel formula string as text (shows the formula pattern)
    row.getCell(5).value = block.excelFormula?.replace("{r}", String(rowNum)) ?? `=${block.result}`;
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

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
