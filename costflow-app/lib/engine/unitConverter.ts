// ============================================================
// CostFlow — Unit Conversion Matrix
// ============================================================
import type { Unit, UnitCategory } from "@/types/costing";

export const UNITS: Unit[] = [
  // Weight
  { id: "kg", label: "Kilogram", symbol: "Kg", category: "weight", toBase: 1 },
  { id: "g", label: "Gram", symbol: "g", category: "weight", toBase: 0.001 },
  { id: "ton", label: "Metric Ton", symbol: "T", category: "weight", toBase: 1000 },
  { id: "lb", label: "Pound", symbol: "lb", category: "weight", toBase: 0.453592 },
  { id: "oz", label: "Ounce", symbol: "oz", category: "weight", toBase: 0.0283495 },
  // Length
  { id: "m", label: "Meter", symbol: "m", category: "length", toBase: 1 },
  { id: "cm", label: "Centimeter", symbol: "cm", category: "length", toBase: 0.01 },
  { id: "mm", label: "Millimeter", symbol: "mm", category: "length", toBase: 0.001 },
  { id: "km", label: "Kilometer", symbol: "km", category: "length", toBase: 1000 },
  { id: "ft", label: "Feet", symbol: "ft", category: "length", toBase: 0.3048 },
  { id: "inch", label: "Inch", symbol: "in", category: "length", toBase: 0.0254 },
  { id: "yard", label: "Yard", symbol: "yd", category: "length", toBase: 0.9144 },
  // Area
  { id: "sqm", label: "Square Meter", symbol: "m²", category: "area", toBase: 1 },
  { id: "sqft", label: "Square Feet", symbol: "ft²", category: "area", toBase: 0.092903 },
  { id: "sqcm", label: "Square Cm", symbol: "cm²", category: "area", toBase: 0.0001 },
  // Volume
  { id: "l", label: "Liter", symbol: "L", category: "volume", toBase: 1 },
  { id: "ml", label: "Milliliter", symbol: "mL", category: "volume", toBase: 0.001 },
  { id: "gal", label: "Gallon (US)", symbol: "gal", category: "volume", toBase: 3.78541 },
  // Count
  { id: "pcs", label: "Pieces", symbol: "pcs", category: "count", toBase: 1 },
  { id: "units", label: "Units", symbol: "units", category: "count", toBase: 1 },
  { id: "packs", label: "Packs", symbol: "packs", category: "count", toBase: 1 },
  { id: "dozen", label: "Dozen", symbol: "doz", category: "count", toBase: 12 },
  // Time
  { id: "hr", label: "Hour", symbol: "hr", category: "time", toBase: 1 },
  { id: "min", label: "Minute", symbol: "min", category: "time", toBase: 1 / 60 },
  { id: "shift", label: "Shift (8hr)", symbol: "shift", category: "time", toBase: 8 },
  { id: "day", label: "Day (8hr)", symbol: "day", category: "time", toBase: 8 },
  { id: "month", label: "Month (26d)", symbol: "mo", category: "time", toBase: 208 },
];

export function getUnitsByCategory(category: UnitCategory): Unit[] {
  return UNITS.filter((u) => u.category === category);
}

export function convert(value: number, fromId: string, toId: string): number | null {
  const from = UNITS.find((u) => u.id === fromId);
  const to = UNITS.find((u) => u.id === toId);
  if (!from || !to || from.category !== to.category) return null;
  return (value * from.toBase) / to.toBase;
}

export const MATERIAL_DENSITIES: Record<string, { density: number; label: string }> = {
  steel: { density: 7850, label: "Steel" },
  aluminum: { density: 2700, label: "Aluminum" },
  copper: { density: 8960, label: "Copper" },
  brass: { density: 8500, label: "Brass" },
  timber: { density: 600, label: "Timber" },
};

export function kgToLinearMeters(kg: number, materialId: string, crossSectionCm2: number): number | null {
  const mat = MATERIAL_DENSITIES[materialId];
  if (!mat) return null;
  const volumeM3 = kg / mat.density;
  const crossSectionM2 = crossSectionCm2 / 10000;
  return volumeM3 / crossSectionM2;
}
