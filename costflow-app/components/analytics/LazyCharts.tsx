"use client";

import React, { memo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  currency?: string;
}

const ChartTooltip = memo(({ active, payload, currency }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const fmt = (v: number) =>
    currency === "INR"
      ? `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      : `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div
      className="p-2.5 rounded-xl shadow-xl border text-xs"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text-1)",
      }}
    >
      <div className="font-bold flex items-center gap-1.5 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full inline-block"
          style={{ background: item.payload?.color || item.color }}
        />
        {item.payload?.name || item.name}
      </div>
      <div className="font-mono text-sm font-bold" style={{ color: "var(--cf-blue)" }}>
        {fmt(item.value)}
      </div>
      {item.payload?.percent && (
        <div className="text-[10px] opacity-75 mt-0.5">
          {(item.payload.percent * 100).toFixed(1)}% of total
        </div>
      )}
    </div>
  );
});

ChartTooltip.displayName = "ChartTooltip";

interface PieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  currency: string;
}

export const CostPieChart = memo(({ data, currency }: PieChartProps) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 220, minWidth: 0 }}>
      <ResponsiveContainer width="99%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={52}
            outerRadius={82}
            dataKey="value"
            paddingAngle={3}
            nameKey="name"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={(props: any) => <ChartTooltip {...props} currency={currency} />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value, entry: any) => (
              <span style={{ color: "var(--text-2)", fontSize: 11 }}>
                {entry.payload?.name || value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

CostPieChart.displayName = "CostPieChart";

interface BarChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  currency: string;
  isDark: boolean;
}

export const BlockBarChart = memo(({ data, currency, isDark }: BarChartProps) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: "100%", height: 180, minWidth: 0 }}>
      <ResponsiveContainer width="99%" height="100%">
        <BarChart data={data} margin={{ left: -16, right: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? "rgba(59,130,246,0.1)" : "#E2E8F0"}
          />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-3)" }} />
          <YAxis tick={{ fontSize: 9, fill: "var(--text-3)" }} />
          <Tooltip content={(props: any) => <ChartTooltip {...props} currency={currency} />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((b) => (
              <Cell key={b.name} fill={b.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

BlockBarChart.displayName = "BlockBarChart";
