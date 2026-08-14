# CostFlow — Project Overview

## 1. Introduction
**CostFlow** is a modern, dynamic web application designed to help businesses and individuals calculate, visualize, and manage their product or service costings. The primary goal of this project is to simplify complex costing formulas into an intuitive, block-based interface.

## 2. Problem Statement
Different industries have different ways of calculating costs. A manufacturing unit needs to account for raw materials, machine wear, and scrap percentages, whereas a retail store focuses on landed costs, spoilage, and retail margins. Traditional spreadsheet software can become messy and hard to standardize. 

**CostFlow** solves this by providing industry-specific presets and a drag-and-drop or block-based approach to building cost models.

## 3. Key Features
- **Industry-Specific Presets:** Pre-configured costing templates for various sectors (Manufacturing, Education, Retail, E-Commerce, and Construction).
- **Dynamic Formula Engine:** Automatically calculates total costs, taxes, and profit margins based on user-defined variables (like quantity, hourly rates, scrap percentage, etc.).
- **Excel Export with Live Formulas:** Unlike standard CSV exports that only export flat numbers, CostFlow exports the costing summary to an Excel file with **real formulas** embedded. This means users can still change numbers in the exported Excel file, and the totals will update automatically.
- **Interactive Visualizations:** Uses charts and node-based graphs to visualize the flow of costs and highlight where the maximum money is being spent.

## 4. Supported Domains (Use Cases)
CostFlow currently supports the following industries out-of-the-box:
1. **Manufacturing & Fabrication:** Handles BOM (Bill of Materials), raw material density, labor hours, scrap percentage, and machine shift rates.
2. **Education (Schools/Colleges):** Calculates per-student overheads, classroom allocation, teacher salaries, and lab fees.
3. **Retail & Kirana Stores:** Manages landed purchase costs, transport, spoilage, and retail markup.
4. **E-Commerce & D2C:** Accounts for Cost of Goods Sold (COGS), payment gateway fees, shipping tiers, packaging, and return buffers.
5. **Construction & Metals:** Focuses on area metrics (sq.m), yield loss, subcontract work, and fabrication labor.

## 5. Technology Stack
The project is built using modern web development technologies to ensure high performance, maintainability, and an excellent user experience:
- **Frontend Framework:** Next.js and React
- **Styling:** Tailwind CSS (for responsive, modern UI design)
- **Data Visualization:** Recharts (for charts) and React Flow (for node-based visual flows)
- **State Management:** Zustand
- **Exporting Engine:** ExcelJS (for generating rich Excel workbooks with formulas)

## 6. Conclusion
CostFlow is a robust, scalable solution that abstracts the complexities of financial costing into a clean, user-friendly interface. It bridges the gap between rigid software and chaotic spreadsheets by providing structured flexibility tailored to specific industries.
