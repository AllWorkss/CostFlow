"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCostingStore } from "@/lib/store/costingStore";
import { useShallow } from "zustand/react/shallow";

const FlowCanvas = dynamic(() => import("./FlowCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: "#0A1020", color: "#94A3B8" }}>
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-mono">Initializing System Architecture Canvas...</span>
    </div>
  ),
});

export default function FlowPage() {
  const { blocks, currency } = useCostingStore(
    useShallow((state) => ({
      blocks: state.blocks,
      currency: state.currency,
    }))
  );

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("cf-theme") as "dark" | "light" | null;
    setTheme(saved ?? "dark");
  }, []);

  const isDark = theme === "dark";
  const bg = isDark ? "#0A1020" : "#F0F4FF";
  const border = isDark ? "rgba(59,130,246,0.2)" : "#E2E8F0";
  const textSec = isDark ? "#94A3B8" : "#64748B";

  const memoizedBlocks = useMemo(() => blocks, [blocks]);

  return (
    <div style={{ height: "100vh", background: bg, display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{
          background: isDark ? "rgba(15,22,41,0.95)" : "rgba(248,250,255,0.95)",
          borderColor: border,
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm" style={{ color: textSec }}>
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <span style={{ color: border }}>|</span>
          <span className="font-bold gradient-text">CostFlow — System Architecture</span>
        </div>
        <div className="text-xs" style={{ color: textSec }}>
          Click any node to see its formula details
        </div>
      </nav>

      <FlowCanvas blocks={memoizedBlocks} isDark={isDark} currency={currency} />
    </div>
  );
}
