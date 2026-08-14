"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, User, Clock, FileText, ArrowRight } from "lucide-react";
import { useCostingStore } from "@/lib/store/costingStore";

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditTrailModal({ isOpen, onClose }: AuditTrailModalProps) {
  const store = useCostingStore();

  if (!isOpen) return null;

  const logs = store.auditLogs || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Immutable Enterprise Audit Log Trail
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                    ISO 27001 Compliant
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Every parameter change, rate edit, and workflow transition is recorded with timestamp and user ID
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span>{log.userName}</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-amber-400 uppercase">
                          {log.userRole.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        Modified <strong className="text-slate-200">{log.variableName}</strong> in block{" "}
                        <strong className="text-slate-200">{log.blockLabel}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-300 font-mono self-end sm:self-center">
                    <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400">{log.oldValue}</span>
                      <ArrowRight size={13} className="text-amber-400" />
                      <span className="font-bold text-emerald-400">{log.newValue}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={13} /> {log.timestamp}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Activity size={32} className="mx-auto text-slate-600 animate-pulse" />
                <div className="font-bold text-slate-400">No Audit Trail Events Recorded Yet</div>
                <p className="text-xs max-w-sm mx-auto text-slate-500">
                  Edit any variable rate or scrap percentage in the costing blocks to generate immutable audit log entries.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between sticky bottom-0 z-20">
            <div className="text-xs text-slate-400">
              Total Logged Events: <strong className="text-white">{logs.length}</strong>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost px-5 py-2 text-xs justify-center"
            >
              Close Log Viewer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
