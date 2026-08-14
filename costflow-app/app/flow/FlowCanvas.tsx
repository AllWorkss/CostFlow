"use client";

import React, { useState, useCallback, memo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";
import type { CostingBlock } from "@/types/costing";

const NODE_COLORS = {
  input: { bg: "#1D3461", border: "#3B82F6", text: "#93C5FD" },
  convert: { bg: "#1E1B4B", border: "#8B5CF6", text: "#C4B5FD" },
  block: { bg: "#14532D", border: "#10B981", text: "#6EE7B7" },
  tax: { bg: "#7F1D1D", border: "#EF4444", text: "#FCA5A5" },
  profit: { bg: "#064E3B", border: "#06B6D4", text: "#67E8F9" },
  output: { bg: "#1E3A5F", border: "#F59E0B", text: "#FCD34D" },
};

function makeNode(
  id: string,
  label: string,
  formula: string,
  x: number,
  y: number,
  colorKey: keyof typeof NODE_COLORS,
  value?: number,
  blockId?: string
): Node {
  const colors = NODE_COLORS[colorKey];
  return {
    id,
    position: { x, y },
    data: { label, formula, value, blockId, colors },
    style: {
      background: colors.bg,
      border: `2px solid ${colors.border}`,
      color: colors.text,
      borderRadius: 12,
      padding: "10px 14px",
      minWidth: 160,
      fontFamily: "Inter, sans-serif",
      fontSize: 12,
    },
  };
}

function makeEdge(id: string, source: string, target: string, color = "#3B82F6"): Edge {
  return {
    id,
    source,
    target,
    animated: true,
    style: { stroke: color, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color },
  };
}

interface FlowCanvasProps {
  blocks: CostingBlock[];
  isDark: boolean;
  currency: string;
}

function FlowCanvasComponent({ blocks, isDark, currency }: FlowCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const bg = isDark ? "#0A1020" : "#F0F4FF";
  const cardBg = isDark ? "#1A2440" : "#FFFFFF";
  const border = isDark ? "rgba(59,130,246,0.2)" : "#E2E8F0";
  const textPrimary = isDark ? "#F1F5F9" : "#0F1629";
  const textSec = isDark ? "#94A3B8" : "#64748B";

  const enabledBlocks = blocks.filter((b) => b.enabled);

  const initialNodes: Node[] = [
    makeNode("input", "📥 Raw Inputs\n& Parameters", "User-defined variables: quantities, rates, percentages", 0, 200, "input"),
    makeNode("convert", "🔄 Unit Conversion\nMatrix", "Kg↔m, ft↔m², L↔mL, hrs↔shifts", 260, 200, "convert"),
    ...enabledBlocks.map((block, i) =>
      makeNode(
        `block_${block.id}`,
        `${block.label}`,
        block.formula,
        560,
        i * 90,
        "block",
        block.result,
        block.id
      )
    ),
    makeNode("aggregate", "➕ Subtotal\nAggregation", "=SUM(all enabled cost blocks)", 860, Math.max(0, (enabledBlocks.length - 1) * 45), "block"),
    makeNode("tax", "🧾 Tax / GST\nLayer", "subtotal × gstRate", 1160, Math.max(0, (enabledBlocks.length - 1) * 45), "tax"),
    makeNode("profit", "📈 Profit &\nMarkup", "totalCost × markupPct", 1160, Math.max(0, (enabledBlocks.length - 1) * 45) + 120, "profit"),
    makeNode("output", "🏷️ Final Selling\nPrice", "subtotal + tax + profit", 1460, Math.max(0, (enabledBlocks.length - 1) * 45) + 60, "output"),
  ];

  const initialEdges: Edge[] = [
    makeEdge("e-input-convert", "input", "convert", "#8B5CF6"),
    ...enabledBlocks.map((block, i) =>
      makeEdge(`e-convert-block-${i}`, "convert", `block_${block.id}`, "#10B981")
    ),
    ...enabledBlocks.map((block, i) =>
      makeEdge(`e-block-agg-${i}`, `block_${block.id}`, "aggregate", "#10B981")
    ),
    makeEdge("e-agg-tax", "aggregate", "tax", "#EF4444"),
    makeEdge("e-agg-profit", "aggregate", "profit", "#06B6D4"),
    makeEdge("e-tax-out", "tax", "output", "#F59E0B"),
    makeEdge("e-profit-out", "profit", "output", "#F59E0B"),
  ];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div style={{ flex: 1, position: "relative" }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          style={{ background: bg }}
        >
          <Background color={isDark ? "#1E3A5F" : "#CBD5E1"} gap={24} size={1} />
          <Controls style={{ background: cardBg, border: `1px solid ${border}` }} />
          <MiniMap
            nodeColor={(n) => {
              const c = (n.data?.colors as { border: string })?.border;
              return c ?? "#3B82F6";
            }}
            style={{ background: cardBg, border: `1px solid ${border}` }}
          />
        </ReactFlow>
      </ReactFlowProvider>

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              width: 320,
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              zIndex: 10,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-bold text-sm" style={{ color: textPrimary }}>
                  {selectedNode.data.label as string}
                </div>
                {selectedNode.data.blockId && (
                  <span className="cf-badge cf-badge-blue text-xs mt-1">Costing Block</span>
                )}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg"
                style={{ color: textSec }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold mb-1" style={{ color: textSec }}>
                  Formula
                </div>
                <div
                  className="font-mono text-xs px-3 py-2 rounded-lg"
                  style={{ background: isDark ? "#0F1629" : "#F1F5FD", color: "#3B82F6" }}
                >
                  {selectedNode.data.formula as string}
                </div>
              </div>
              {selectedNode.data.value !== undefined && (
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: textSec }}>
                    Computed Value
                  </div>
                  <div className="font-bold text-xl gradient-text">
                    {currency === "INR" ? "₹" : "$"}
                    {((selectedNode.data.value as number) ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t" style={{ borderColor: border }}>
              <div className="text-xs" style={{ color: textSec }}>
                <Info size={12} className="inline mr-1" />
                Click other nodes to explore their formulas and dependencies
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(FlowCanvasComponent);
