"use client";

import { Layers } from "lucide-react";

export default function ShareViewClient({ data }: { data: any }) {
  const totalCost = data.blocks?.filter((b: any) => b.enabled).reduce((acc: number, b: any) => acc + (b.result || 0), 0) || 0;
  const margin = data.targetMarginPct || 0.25;
  const sellingPrice = totalCost / (1 - margin);
  const profit = sellingPrice - totalCost;
  
  const currencySymbol = data.currency === "INR" ? "₹" : "$";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <div className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Total Cost</div>
          <div className="text-3xl font-black mt-2 text-gray-900 dark:text-white">
            {currencySymbol}{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30 shadow-sm">
          <div className="text-sm text-green-600 uppercase font-semibold tracking-wider">Target Price</div>
          <div className="text-3xl font-black mt-2 text-green-700 dark:text-green-400">
            {currencySymbol}{sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
          <div className="text-sm text-blue-600 uppercase font-semibold tracking-wider">Expected Profit</div>
          <div className="text-3xl font-black mt-2 text-blue-700 dark:text-blue-400">
            {currencySymbol}{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Layers size={16} /> Cost Breakdown
        </div>
        <div className="space-y-4">
          {data.blocks?.filter((b: any) => b.enabled).map((b: any) => (
            <div key={b.id} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: b.color || '#ccc' }} />
                <span className="font-medium text-gray-900 dark:text-gray-100">{b.label}</span>
              </div>
              <span className="font-mono text-lg font-bold text-gray-800 dark:text-gray-200">
                {currencySymbol}{(b.result || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center pt-8">
        <a href="/" className="text-sm text-blue-600 hover:underline">Build your own cost sheet with CostFlow</a>
      </div>
    </div>
  );
}
