# CostFlow — CSF Costing

# 🎯 Universal Multi-Industry AI/ML Powered Costing Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![ExcelJS](https://img.shields.io/badge/ExcelJS-Real%20Formulas-1D6F42)](https://github.com/exceljs/exceljs)
[![React Flow](https://img.shields.io/badge/React%20Flow-Interactive-8B5CF6)](https://reactflow.dev)

---

## 📋 Overview

**CostFlow (CSF Costing)** is a production-grade, modular costing platform that dynamically adapts to **any industry domain** without code modification. It ships with 5 industry presets, a live Excel exporter generating real formula cells, an interactive React Flow architecture diagram, AI/ML anomaly detection, and an optimal price recommender.

---

## 🏭 Supported Industries

| Industry | Preset Blocks |
|---|---|
| **Manufacturing & Fabrication** | Raw Material (Kg/m), Scrap %, Labor Shift Rate, Machine Wear, Surface Finishing |
| **Education (School/College)** | Classroom Allocation, Teacher Salary, Lab Fee, Bus Transport, Admin Overhead |
| **Retail & Kirana Store** | Landed Cost, Spoilage %, Store Overhead, Retail Margin, GST |
| **E-Commerce & D2C** | COGS, Packaging, Shipping Tiers, Payment Gateway %, CAC Buffer, Return Rate |
| **Construction & Metals** | Area (sq.m), Material Yield Loss, Fabrication Labor, Subcontract, Site Overhead |

---

## 🚀 Key Features

### ✅ Live Excel Export with Real Formulas
Cells in the exported `.xlsx` contain actual Excel formula strings (`=SUM(C2:C10)`, `=C5*D5*(1+E5)`) — not hardcoded values. Open in Excel and check the formula bar.

### ✅ React Flow Architecture Diagram
Interactive visualization of the full costing flow:
`[Raw Input] → [Unit Conversion] → [Cost Blocks] → [Tax/GST] → [Profit Markup] → [Selling Price]`
Click any node to see its underlying formula.

### ✅ ML Anomaly Detection
Z-score statistical analysis flags inputs that deviate >2σ from historical baselines with severity levels (low/medium/high).

### ✅ AI Price Recommender
Break-even optimizer + target margin slider + optimal price range calculator.

### ✅ Universal Unit Conversion Matrix
Seamless conversion across weight (Kg, g, Ton, lb), length (m, cm, mm, ft, inch), area (m², ft²), volume (L, mL, gal), count (pcs, dozen), and time (hr, shift, day, month).

### ✅ Dynamic Formula Engine
Evaluate user-defined expressions like `FinalCost = (MaterialCost * (1 + ScrapPct)) + (LaborHours * HourlyRate) + FinishingPerMeter` with live variable injection.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + Custom Design System |
| State | Zustand (with localStorage persistence) |
| Excel | ExcelJS (real formula cells) |
| Flow Diagram | React Flow |
| Charts | Recharts |
| Animation | Framer Motion |
| Icons | Lucide React |
| AI/ML | IQR + Z-Score anomaly detection |

---

## ⚡ Getting Started

```bash
# Clone
git clone https://github.com/AllWorkss/CostFlow.git
cd CostFlow/costflow-app

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
costflow-app/
├── app/
│   ├── page.tsx              # Landing page with domain selector
│   ├── dashboard/page.tsx    # Main costing dashboard
│   ├── flow/page.tsx         # React Flow architecture diagram
│   └── api/export/route.ts  # Excel export API (real formulas)
├── lib/
│   ├── engine/
│   │   ├── domainPresets.ts  # 5 industry presets
│   │   ├── unitConverter.ts  # Unit conversion matrix
│   │   └── formulaEngine.ts  # Dynamic formula evaluator
│   ├── ml/
│   │   └── anomalyDetector.ts # IQR/Z-score anomaly detection
│   ├── excel/
│   │   └── excelExporter.ts  # ExcelJS 3-sheet export
│   └── store/
│       └── costingStore.ts   # Zustand global state
└── types/
    └── costing.ts            # TypeScript interfaces
```

---

## 📊 Excel Export — 3 Sheets

1. **Cost Summary** — All enabled blocks with formula column showing `=SUM()`, `=C5*D5*(1+E5)` etc., totals with real `=SUM(D5:D12)` formulas, conditional formatting for margins
2. **Variable Detail** — Every variable from every block with its value, unit, and column reference
3. **Formula Reference** — Side-by-side: human formula vs Excel formula string for all blocks

---

## 🤖 AI/ML Details

- **Anomaly Detector**: Uses Z-score method. Flags values >2σ from historical baselines. Severity: Low (2-2.5σ), Medium (2.5-3σ), High (>3σ).
- **Price Recommender**: `RecommendedPrice = TotalCost / (1 - TargetMargin)`. Break-even calculation, optimal price = geometric mean of recommended and break-even. Elasticity score based on margin ratio.

---

## 📜 License

MIT © 2026 CostFlow — CSF Costing System
