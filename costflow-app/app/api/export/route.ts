// ============================================================
// CostFlow — API Route: Excel Export
// POST /api/export  → returns .xlsx file with real formulas
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { generateExcelExport } from "@/lib/excel/excelExporter";
import type { ExportConfig } from "@/types/costing";

export async function POST(request: NextRequest) {
  try {
    const config: ExportConfig = await request.json();

    if (!config.blocks || !config.domain) {
      return NextResponse.json({ error: "Invalid export config" }, { status: 400 });
    }

    const buffer = await generateExcelExport(config);
    const uint8Array = new Uint8Array(buffer);

    const fileName = `CostFlow_${config.projectName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": uint8Array.length.toString(),
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
