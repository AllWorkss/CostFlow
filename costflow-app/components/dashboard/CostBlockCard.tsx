"use client";

import React, { memo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Factory,
  GraduationCap,
  ShoppingCart,
  Globe,
  HardHat,
  Plus,
  X,
  CheckCircle,
} from "lucide-react";
import type { CostingBlock, UserRole, CostingApprovalStatus } from "@/types/costing";
import { getVariablePermissionState } from "@/lib/auth/rbacEngine";

const ICON_MAP: Record<string, React.ElementType> = {
  Factory,
  GraduationCap,
  ShoppingCart,
  Globe,
  HardHat,
  Plus,
};

interface CostBlockCardProps {
  block: CostingBlock;
  currency: string;
  isDark: boolean;
  expanded: boolean;
  userRole: UserRole;
  approvalStatus: CostingApprovalStatus;
  onToggleExpand: (id: string) => void;
  onToggleEnable: (id: string) => void;
  onDelete: (id: string, label: string) => void;
  onUpdateVariable: (blockId: string, variableId: string, value: number) => void;
}

function fmt(val: number, currency: string) {
  const prefix = currency === "INR" ? "₹" : "$";
  return `${prefix}${val.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const CostBlockCard = memo(function CostBlockCard({
  block,
  currency,
  isDark,
  expanded,
  userRole,
  approvalStatus,
  onToggleExpand,
  onToggleEnable,
  onDelete,
  onUpdateVariable,
}: CostBlockCardProps) {
  const IconComp = ICON_MAP[block.icon] || Plus;

  const vars = block?.variables || [];
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Local variable state for 150ms debounced smooth typing
  const [localValues, setLocalValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(vars.map((v) => [v.id, v.value]))
  );

  useEffect(() => {
    setLocalValues(Object.fromEntries(vars.map((v) => [v.id, v.value])));
  }, [vars]);

  const handleInputChange = useCallback(
    (varId: string, valStr: string) => {
      const numVal = parseFloat(valStr) || 0;
      setLocalValues((prev) => ({ ...prev, [varId]: numVal }));
      onUpdateVariable(block.id, varId, numVal);
    },
    [block.id, onUpdateVariable]
  );

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      className={`block-card transition-all gpu-accelerated mb-4 ${
        !block.enabled ? "disabled grayscale-[30%]" : "hover:border-indigo-500/40 hover:shadow-md"
      } ${block.isAnomalous ? "anomalous" : ""}`}
      style={{ contain: "content" }}
    >
      <div
        className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 cursor-pointer select-none"
        onClick={() => onToggleExpand(block.id)}
      >

        {/* Icon pill */}
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${block.color}20`, color: block.color }}
        >
          <IconComp size={18} />
        </div>

        {/* Label & Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-sm sm:text-base truncate"
              style={{ color: "var(--text-1)" }}
            >
              {block.label}
            </span>
            {block.isAnomalous && (
              <span className="badge badge-amber text-[10px] flex items-center gap-1">
                <AlertTriangle size={10} /> Check Rate
              </span>
            )}
          </div>
          <div className="text-xs truncate hidden sm:block" style={{ color: "var(--text-3)" }}>
            {block.formula}
          </div>
        </div>

        {/* Value */}
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-sm sm:text-base font-mono" style={{ color: block.color }}>
            {fmt(block.result ?? 0, currency)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-red-500/10 rounded-xl p-1 border border-red-500/20">
              <span className="text-[10px] font-bold text-red-500 px-1 hidden sm:inline">Delete?</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(block.id, block.label);
                  setConfirmDelete(false);
                }}
                className="btn btn-icon bg-red-500 text-white min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] w-9 h-9 sm:w-8 sm:h-8 hover:bg-red-600 rounded-lg shadow-md shadow-red-500/20"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(false);
                }}
                className="btn btn-icon min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] w-9 h-9 sm:w-8 sm:h-8 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <button
                aria-label="Toggle Block"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEnable(block.id);
                }}
                className="btn btn-icon min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] w-10 h-10 sm:w-9 sm:h-9 rounded-xl transition-transform hover:scale-105"
              >
                {block.enabled ? (
                  <Eye size={18} color="var(--cf-blue)" />
                ) : (
                  <EyeOff size={18} color="var(--text-3)" />
                )}
              </button>
              <button
                aria-label="Delete Block"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(true);
                }}
                className="btn btn-icon btn-danger min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] w-10 h-10 sm:w-9 sm:h-9 rounded-xl transition-transform hover:scale-105"
              >
                <Trash2 size={16} />
              </button>
              {expanded ? (
                <ChevronUp size={15} color="var(--text-3)" />
              ) : (
                <ChevronDown size={15} color="var(--text-3)" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded variables */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t px-3 pb-4 pt-3 bg-[var(--bg-card)]"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Formula display */}
            <div
              className="mono text-xs px-3 py-2 rounded-lg mb-3"
              style={{
                background: isDark ? "rgba(15,26,46,0.7)" : "#EFF6FF",
                color: "var(--cf-blue)",
              }}
            >
              <span style={{ color: "var(--text-3)" }}>Formula: </span>
              {block.formula}
            </div>

            {/* Variables grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vars.map((variable) => {
                const permState = getVariablePermissionState(
                  userRole,
                  block.type,
                  variable.id,
                  approvalStatus
                );
                const isMasked = permState === "hidden_masked";
                const isReadOnly = permState === "readonly";

                return (
                  <div key={variable.id}>
                    <label
                      className="text-xs font-medium block mb-1.5 flex items-center justify-between"
                      style={{ color: "var(--text-2)" }}
                    >
                      <span>
                        {variable.name}{" "}
                        {variable.unit && (
                          <span className="badge badge-blue ml-1.5">{variable.unit}</span>
                        )}
                      </span>
                      {isMasked && <span className="text-[10px] text-rose-400 font-bold">🔒 Masked</span>}
                      {isReadOnly && !isMasked && (
                        <span className="text-[10px] text-slate-400">🔒 Read-Only</span>
                      )}
                    </label>
                    {isMasked ? (
                      <input
                        type="text"
                        disabled
                        value="***"
                        aria-label={variable.name}
                        className="cf-input bg-slate-900 border-slate-800 text-rose-400 font-mono font-bold"
                      />
                    ) : (
                      <input
                        type="number"
                        disabled={isReadOnly}
                        value={localValues[variable.id] ?? variable.value}
                        aria-label={variable.name}
                        onChange={(e) => handleInputChange(variable.id, e.target.value)}
                        className={`cf-input ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                        min={0}
                        step={variable.unit?.includes("%") ? 0.01 : undefined}
                      />
                    )}
                    {variable.description && (
                      <div className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                        {variable.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
});
