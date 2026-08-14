import type { SupportedCurrency, ForexConfig, CommodityIndex } from "@/types/costing";

// Default Spot Exchange Rates relative to 1 USD
export const DEFAULT_SPOT_RATES: Record<SupportedCurrency, number> = {
  USD: 1.0,
  INR: 83.5,
  AED: 3.67,
  EUR: 0.92,
  GBP: 0.79,
};

export const DEFAULT_COMMODITY_INDICES: CommodityIndex[] = [
  { id: "usd_inr", name: "USD / INR", category: "forex", unit: "₹", price: 83.5, change24h: +0.24, lastUpdated: "Live" },
  { id: "eur_inr", name: "EUR / INR", category: "forex", unit: "₹", price: 90.75, change24h: -0.15, lastUpdated: "Live" },
  { id: "aed_inr", name: "AED / INR", category: "forex", unit: "₹", price: 22.73, change24h: +0.08, lastUpdated: "Live" },
  { id: "gbp_inr", name: "GBP / INR", category: "forex", unit: "₹", price: 105.7, change24h: +0.42, lastUpdated: "Live" },
  { id: "steel_tmt", name: "Steel TMT Index", category: "metals", unit: "₹/MT", price: 52400, change24h: +1.45, lastUpdated: "Live" },
  { id: "alum_lme", name: "Aluminum LME", category: "metals", unit: "$/MT", price: 2420, change24h: -0.62, lastUpdated: "Live" },
  { id: "polymer_hdpe", name: "Polymer HDPE", category: "plastics", unit: "₹/Kg", price: 118.5, change24h: +0.85, lastUpdated: "Live" },
  { id: "en8d_bar", name: "EN8D Steel Bar", category: "metals", unit: "₹/Kg", price: 68.2, change24h: 0.0, lastUpdated: "Live" },
];

/**
 * Convert value from base currency to target currency applying Forex risk buffer
 */
export function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  hedgeBufferPct = 0,
  spotRates = DEFAULT_SPOT_RATES
): number {
  if (from === to) return amount;

  const fromRateInUsd = spotRates[from] || 1;
  const toRateInUsd = spotRates[to] || 1;

  // Convert to USD first then to target
  const amountInUsd = amount / fromRateInUsd;
  const targetAmount = amountInUsd * toRateInUsd;

  // Apply Forex Hedge Buffer
  const bufferFactor = 1 + (hedgeBufferPct / 100);
  return targetAmount * bufferFactor;
}

/**
 * Format currency with locale formatting (e.g. en-IN for INR, en-US for USD, ar-AE for AED)
 */
export function formatCurrencyLocale(
  amount: number,
  currency: SupportedCurrency = "INR"
): string {
  const currencySymbols: Record<SupportedCurrency, string> = {
    INR: "₹",
    USD: "$",
    AED: "د.إ ",
    EUR: "€",
    GBP: "£",
  };

  const localeMap: Record<SupportedCurrency, string> = {
    INR: "en-IN",
    USD: "en-US",
    AED: "en-AE",
    EUR: "de-DE",
    GBP: "en-GB",
  };

  const symbol = currencySymbols[currency] || "₹";
  const formatted = amount.toLocaleString(localeMap[currency] || "en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formatted}`;
}
