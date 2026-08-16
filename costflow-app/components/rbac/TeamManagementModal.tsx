"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  Users,
  Lock,
  Unlock,
  CheckCircle,
  UserCheck,
  UserPlus,
  Eye,
  Edit3,
  Download,
  Building,
} from "lucide-react";
import type {
  UserRole,
  CostingApprovalStatus,
  BlockType,
} from "@/types/costing";
import { SAMPLE_TEAM_MEMBERS, canUserManageApproval } from "@/lib/auth/rbacEngine";
import { useCostingStore } from "@/lib/store/costingStore";

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES: { id: UserRole; label: string; icon: string; desc: string }[] = [
  { id: "super_admin", label: "Super Admin / CEO", icon: "👑", desc: "Full CRUD, team admin, executive profit visibility & approval rights" },
  { id: "plant_manager", label: "Plant Manager", icon: "⚙️", desc: "Manages BOM, machine rates, scrap %. (Hides net profit totals)" },
  { id: "procurement_specialist", label: "Procurement Specialist", icon: "📦", desc: "Inputs raw material & transport rates. (Hides selling markups)" },
  { id: "floor_operator", label: "Floor Line Operator", icon: "👷", desc: "Enters quantities & scrap kg. (STRICT MASKING: All rates masked as ***)" },
  { id: "sales_rep", label: "Sales Representative", icon: "💼", desc: "Views final selling prices & client quotes. (Hides base manufacturing cost)" },
];

const BLOCK_TYPES_MATRIX: { type: BlockType; label: string }[] = [
  { type: "raw_material", label: "Raw Materials" },
  { type: "direct_labor", label: "Direct Labor" },
  { type: "variable_overhead", label: "Variable Overheads" },
  { type: "wastage", label: "Scrap & Wastage" },
  { type: "finishing", label: "Surface Finishing" },
  { type: "profit_markup", label: "Profit & Markup" },
];

export function TeamManagementModal({ isOpen, onClose }: TeamManagementModalProps) {
  const store = useCostingStore();
  const [activeSubTab, setActiveSubTab] = useState<"roles" | "matrix" | "team" | "workflow">("roles");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("plant_manager");
  const [showDiscardAlert, setShowDiscardAlert] = useState(false);

  const isDirty = inviteEmail.trim().length > 0;

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowDiscardAlert(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    setInviteEmail("");
    setShowDiscardAlert(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentRole = store.currentUser?.role || "super_admin";
  const canApprove = canUserManageApproval(currentRole);

  const handleRoleChange = (role: UserRole) => {
    store.setCurrentUserRole(role);
  };

  const handleStatusChange = (status: CostingApprovalStatus) => {
    store.setApprovalStatus(status);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        onClick={handleCloseAttempt}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-5xl rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        >
          {showDiscardAlert && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center">
                <h3 className="text-lg font-bold text-white mb-2">Discard unsent invite?</h3>
                <p className="text-sm text-slate-400 mb-6">Your invite details will be lost.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => setShowDiscardAlert(false)} className="btn btn-ghost">Keep Editing</button>
                  <button onClick={handleDiscard} className="btn bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">Discard & Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Enterprise RBAC, Field Security & Team Settings
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
                    Row & Field Level Security
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Multi-Tenant Organization: <strong className="text-slate-200">CostFlow Enterprise Manufacturing Ltd</strong>
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseAttempt}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
            {[
              { id: "roles", label: "Live Role Simulator", icon: UserCheck },
              { id: "workflow", label: "Approval & Sheet Lock", icon: Lock },
              { id: "matrix", label: "Visual Permission Matrix", icon: Shield },
              { id: "team", label: "Team Members & Invite", icon: Users },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveSubTab(t.id as typeof activeSubTab)}
                  className={`py-3 px-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 ${
                    activeSubTab === t.id
                      ? "border-purple-500 text-purple-400 bg-purple-950/30"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {/* SUBTAB 1: LIVE ROLE SWITCHER SIMULATOR */}
            {activeSubTab === "roles" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                  <div className="font-bold text-purple-300 flex items-center gap-2">
                    <UserCheck size={18} /> Switch Active Session Role for Live UI Masking Test
                  </div>
                  <p className="text-xs text-slate-300">
                    Select an enterprise role to simulate field masking (`***`), input locking, and restricted costing block visibility in real time.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ROLES.map((r) => {
                    const active = currentRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleChange(r.id)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                          active
                            ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/10"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        <span className="text-2xl mt-0.5">{r.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-sm ${active ? "text-white" : "text-slate-200"}`}>
                              {r.label}
                            </span>
                            {active && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500 text-white">
                                Active Role
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed mt-1 text-slate-400">{r.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBTAB 2: APPROVAL & SHEET LOCK WORKFLOW */}
            {activeSubTab === "workflow" && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <Lock size={18} className="text-amber-400" />
                    Sheet Lock & Lifecycle Approval Status Workflow
                  </div>
                  <p className="text-xs text-slate-400">
                    Control production locks. When status is set to <strong className="text-rose-400">Locked for Production</strong>, all costing parameters become readonly across all roles to prevent accidental alterations.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {[
                      { id: "draft", label: "Draft", icon: Edit3, color: "border-slate-600 text-slate-300" },
                      { id: "under_review", label: "Under Review", icon: Eye, color: "border-blue-500 text-blue-400" },
                      { id: "approved", label: "Manager Approved", icon: CheckCircle, color: "border-emerald-500 text-emerald-400" },
                      { id: "locked", label: "Locked Production", icon: Lock, color: "border-rose-500 text-rose-400" },
                    ].map((s) => {
                      const active = store.approvalStatus === s.id;
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={!canApprove}
                          onClick={() => handleStatusChange(s.id as CostingApprovalStatus)}
                          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                            active
                              ? "bg-slate-800 border-2 shadow-lg " + s.color
                              : "bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700"
                          } ${!canApprove ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <Icon size={18} />
                          <span className="text-xs font-bold">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: VISUAL PERMISSION MATRIX GRID */}
            {activeSubTab === "matrix" && (
              <div className="space-y-4">
                <div className="font-bold text-slate-200">Granular Permission Matrix by Role & Block Type</div>
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Costing Block</th>
                        <th className="p-3">Super Admin</th>
                        <th className="p-3">Plant Manager</th>
                        <th className="p-3">Procurement</th>
                        <th className="p-3">Line Operator</th>
                        <th className="p-3">Sales Rep</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {BLOCK_TYPES_MATRIX.map((b) => (
                        <tr key={b.type} className="hover:bg-slate-900">
                          <td className="p-3 font-bold text-white">{b.label}</td>
                          <td className="p-3 text-emerald-400 font-semibold">Full Edit</td>
                          <td className="p-3 text-blue-400 font-semibold">
                            {b.type === "profit_markup" ? "Read-Only" : "Editable"}
                          </td>
                          <td className="p-3 text-amber-400 font-semibold">
                            {b.type === "raw_material" ? "Editable" : b.type === "profit_markup" ? "Masked ***" : "Read-Only"}
                          </td>
                          <td className="p-3 text-rose-400 font-semibold">
                            {b.type === "wastage" ? "Qty Only" : "Masked ***"}
                          </td>
                          <td className="p-3 text-purple-400 font-semibold">
                            {b.type === "profit_markup" ? "Editable" : "Masked ***"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBTAB 4: TEAM MEMBERS & INVITE */}
            {activeSubTab === "team" && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <UserPlus size={18} className="text-purple-400" />
                    Invite Organization Team Member
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      placeholder="Colleague Email (e.g. manager@plant.com)"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (inviteEmail.trim()) {
                          setInviteEmail("");
                        }
                      }}
                      className="btn btn-primary px-4 py-2 text-xs justify-center"
                    >
                      Send Invite
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-bold text-slate-200">Active Organization Members</div>
                  <div className="space-y-2">
                    {SAMPLE_TEAM_MEMBERS.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{m.name}</div>
                          <div className="text-slate-400">{m.email} · <span className="uppercase text-purple-400 font-semibold">{m.department}</span></div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                          {m.role.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between sticky bottom-0 z-20">
            <div className="text-xs text-slate-400">
              Active Role: <strong className="text-purple-400">{currentRole.replace("_", " ").toUpperCase()}</strong>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary px-6 py-2 text-xs justify-center"
            >
              Done & Save Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
