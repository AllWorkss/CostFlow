"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Building2,
  Users,
  Briefcase,
  Layers,
  TrendingUp,
  Plus,
  Trash2,
  Check,
  DollarSign,
  Sparkles,
  PieChart as PieIcon,
  HelpCircle,
} from "lucide-react";
import type {
  OpexConfig,
  PayrollConfig,
  OpexCategory,
  CustomBlockDefinition,
  CustomBlockKind,
} from "@/types/costing";
import {
  DEFAULT_OPEX_CONFIG,
  DEFAULT_PAYROLL_CONFIG,
  PRESET_LIBRARIES,
  calculateOpexMetrics,
  calculatePayrollMetrics,
  calculateCompanyFinancials,
} from "@/lib/engine/opexPayrollEngine";
import { useCostingStore } from "@/lib/store/costingStore";

interface CompanyOpexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuccess?: () => void;
}

export function CompanyOpexModal({ isOpen, onClose, onApplySuccess }: CompanyOpexModalProps) {
  const store = useCostingStore();

  const [activeTab, setActiveTab] = useState<"opex" | "payroll" | "project_staff" | "custom_blocks" | "pnl">("opex");
  const [opexConfig, setOpexConfigState] = useState<OpexConfig>(store.opexConfig || DEFAULT_OPEX_CONFIG);
  const [payrollConfig, setPayrollConfigState] = useState<PayrollConfig>(store.payrollConfig || DEFAULT_PAYROLL_CONFIG);
  const [customBlocks, setCustomBlocks] = useState<CustomBlockDefinition[]>([]);

  // New OPEX item form state
  const [newOpexName, setNewOpexName] = useState("");
  const [newOpexCategory, setNewOpexCategory] = useState<OpexCategory>("facility");
  const [newOpexCost, setNewOpexCost] = useState(15000);

  // New Employee form state
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("Software / CAD Lead");
  const [newEmpSalary, setNewEmpSalary] = useState(70000);

  // Custom Block Builder form state
  const [newBlockName, setNewBlockName] = useState("");
  const [newBlockKind, setNewBlockKind] = useState<CustomBlockKind>("lump_sum");
  const [newBlockCost, setNewBlockCost] = useState(25000);

  if (!isOpen) return null;

  const opexMetrics = calculateOpexMetrics(opexConfig);
  const payrollMetrics = calculatePayrollMetrics(payrollConfig);
  const directMaterialCost = store.summary?.subtotal || 150000;
  const customBlocksTotalCost = customBlocks.reduce((sum, b) => sum + b.totalCost, 0);

  const financials = calculateCompanyFinancials(
    opexConfig,
    payrollConfig,
    directMaterialCost,
    customBlocksTotalCost,
    store.targetMarginPct || 0.25
  );

  const handleAddOpexItem = () => {
    if (!newOpexName.trim()) return;
    const newItem = {
      id: `op_${Date.now()}`,
      name: newOpexName,
      category: newOpexCategory,
      monthlyCost: newOpexCost,
    };
    setOpexConfigState({
      ...opexConfig,
      items: [...opexConfig.items, newItem],
    });
    setNewOpexName("");
  };

  const handleRemoveOpexItem = (id: string) => {
    setOpexConfigState({
      ...opexConfig,
      items: opexConfig.items.filter((i) => i.id !== id),
    });
  };

  const handleAddEmployee = () => {
    if (!newEmpName.trim()) return;
    const newEmp = {
      id: `emp_${Date.now()}`,
      name: newEmpName,
      roleTitle: newEmpRole,
      department: "production" as const,
      baseSalaryMonthly: newEmpSalary,
      bonusesMonthly: Math.round(newEmpSalary * 0.1),
      statutoryMonthly: Math.round(newEmpSalary * 0.1),
      workingDaysPerMonth: 22,
      productiveHoursPerDay: 8,
      allocatedProjectHours: 30,
    };
    setPayrollConfigState({
      ...payrollConfig,
      employees: [...payrollConfig.employees, newEmp],
    });
    setNewEmpName("");
  };

  const handleRemoveEmployee = (id: string) => {
    setPayrollConfigState({
      ...payrollConfig,
      employees: payrollConfig.employees.filter((e) => e.id !== id),
    });
  };

  const handleAddCustomBlock = () => {
    if (!newBlockName.trim()) return;
    const newBlock: CustomBlockDefinition = {
      id: `cb_${Date.now()}`,
      name: newBlockName,
      kind: newBlockKind,
      category: "Custom Block",
      fields: [{ id: "f1", name: "Amount (₹)", type: "currency", value: newBlockCost, unit: "₹" }],
      totalCost: newBlockCost,
    };
    setCustomBlocks([...customBlocks, newBlock]);
    setNewBlockName("");
  };

  const handleApplyPreset = (presetBlocks: CustomBlockDefinition[]) => {
    setCustomBlocks([...customBlocks, ...presetBlocks]);
  };

  const handleApplyToStore = () => {
    store.setOpexConfig(opexConfig);
    store.setPayrollConfig(payrollConfig);
    if (onApplySuccess) onApplySuccess();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-6xl rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Building2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Company OPEX & Financial Modeler
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase">
                    Activity-Based Overhead Absorption
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Model fixed monthly rent, utilities, employee CTC & absorbed overhead rate into project P&L proposals
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

          {/* Sub Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 overflow-x-auto">
            {[
              { id: "opex", label: "1. Monthly OPEX", icon: Building2 },
              { id: "payroll", label: "2. Employee Payroll CTC", icon: Users },
              { id: "project_staff", label: "3. Project Staff Hours", icon: Briefcase },
              { id: "custom_blocks", label: "4. Custom Blocks Canvas", icon: Layers },
              { id: "pnl", label: "5. True Project P&L", icon: TrendingUp },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={`py-3 px-4 text-xs font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${
                    activeTab === t.id
                      ? "border-cyan-500 text-cyan-400 bg-cyan-950/30"
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

            {/* TAB 1: MONTHLY OPEX & OVERHEAD RATE */}
            {activeTab === "opex" && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Total Monthly Fixed OPEX</div>
                    <div className="text-xl font-black text-white mt-1">
                      ₹{opexMetrics.totalMonthlyOpex.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[11px] text-cyan-400 mt-1">Rent, utilities, compliance, cloud</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Billable Employee Capacity</div>
                    <div className="text-xl font-black text-white mt-1">
                      {opexMetrics.totalBillableCapacityHours} hrs/mo
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {opexConfig.totalBillableEmployees} employees × {opexConfig.billableHoursPerMonth} hrs
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40">
                    <div className="text-xs text-cyan-300">Company Burden / Overhead Rate</div>
                    <div className="text-2xl font-black text-cyan-400 mt-1">
                      ₹{opexMetrics.companyOverheadHourlyRate.toFixed(2)}/hr
                    </div>
                    <div className="text-[11px] text-cyan-300 mt-1">Absorbed per allocated employee project hour</div>
                  </div>
                </div>

                {/* Add OPEX Form */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <Plus size={16} className="text-cyan-400" /> Add Fixed Operating Expense Item
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Expense Name (e.g. Fiber Internet)"
                      value={newOpexName}
                      onChange={(e) => setNewOpexName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                    <select
                      value={newOpexCategory}
                      onChange={(e) => setNewOpexCategory(e.target.value as OpexCategory)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    >
                      <option value="facility">Facility & Operations</option>
                      <option value="compliance">Legal & Compliance</option>
                      <option value="tech">Tech & Software Subscriptions</option>
                      <option value="general">General Administration</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Monthly Cost (₹)"
                      value={newOpexCost}
                      onChange={(e) => setNewOpexCost(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddOpexItem}
                      className="btn btn-primary text-xs justify-center py-2"
                    >
                      Add OPEX Item
                    </button>
                  </div>
                </div>

                {/* OPEX Items Table */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-200">Itemized Operating Expenses ({opexConfig.items.length})</div>
                  <div className="rounded-2xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Expense Item</th>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-right">Monthly Cost (₹)</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                        {opexConfig.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-900">
                            <td className="p-3 font-semibold text-white">
                              {item.name}
                              {item.description && <div className="text-[11px] text-slate-400 font-normal">{item.description}</div>}
                            </td>
                            <td className="p-3 uppercase text-cyan-400 font-bold">{item.category}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-100">
                              ₹{item.monthlyCost.toLocaleString("en-IN")}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveOpexItem(item.id)}
                                className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMPLOYEE PAYROLL CTC MATRIX */}
            {activeTab === "payroll" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Total Monthly Payroll CTC</div>
                    <div className="text-xl font-black text-white mt-1">
                      ₹{payrollMetrics.totalMonthlyPayroll.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Average Employee Hourly CTC</div>
                    <div className="text-xl font-black text-white mt-1">
                      ₹{payrollMetrics.effectiveAverageHourlyCtc.toFixed(2)}/hr
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/40">
                    <div className="text-xs text-blue-300">Total Project Direct Labor Cost</div>
                    <div className="text-2xl font-black text-blue-400 mt-1">
                      ₹{payrollMetrics.totalAllocatedProjectLaborCost.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Add Employee Form */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <Plus size={16} className="text-blue-400" /> Add Team Member to Payroll Matrix
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Employee Name"
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Role Title"
                      value={newEmpRole}
                      onChange={(e) => setNewEmpRole(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Base Salary Monthly (₹)"
                      value={newEmpSalary}
                      onChange={(e) => setNewEmpSalary(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddEmployee}
                      className="btn btn-primary text-xs justify-center py-2"
                    >
                      Add Employee
                    </button>
                  </div>
                </div>

                {/* Payroll Table */}
                <div className="rounded-2xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Employee</th>
                        <th className="p-3">Base Salary</th>
                        <th className="p-3">Bonuses & Statutory</th>
                        <th className="p-3">Total Monthly CTC</th>
                        <th className="p-3 text-right">Real Hourly CTC (₹/hr)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {payrollMetrics.employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-900">
                          <td className="p-3 font-semibold text-white">
                            {emp.name}
                            <div className="text-[11px] text-blue-400 font-normal">{emp.roleTitle}</div>
                          </td>
                          <td className="p-3 font-mono">₹{emp.baseSalaryMonthly.toLocaleString("en-IN")}</td>
                          <td className="p-3 font-mono">₹{(emp.bonusesMonthly + emp.statutoryMonthly).toLocaleString("en-IN")}</td>
                          <td className="p-3 font-mono font-bold text-white">₹{emp.totalMonthlyCtc.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-right font-mono font-bold text-cyan-400">
                            ₹{emp.effectiveHourlyCtc.toFixed(2)}/hr
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveEmployee(emp.id)}
                              className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: PROJECT STAFF ALLOCATION */}
            {activeTab === "project_staff" && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="font-bold text-slate-200">Project Staff Resource Allocation</div>
                  <p className="text-xs text-slate-400">
                    Allocate project execution hours for each team member. CostFlow multiplies allocated hours by each member&apos;s real hourly CTC rate and adds company overhead absorption.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {payrollConfig.employees.map((emp) => {
                    const monthlyCtc = emp.baseSalaryMonthly + emp.bonusesMonthly + emp.statutoryMonthly;
                    const hourlyCtc = monthlyCtc / ((emp.workingDaysPerMonth || 22) * (emp.productiveHoursPerDay || 8));
                    const allocatedCost = hourlyCtc * emp.allocatedProjectHours;

                    return (
                      <div key={emp.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-sm">{emp.name}</div>
                            <div className="text-xs text-blue-400">{emp.roleTitle}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono text-cyan-400 font-bold">₹{hourlyCtc.toFixed(2)}/hr</div>
                            <div className="text-[11px] text-slate-400">Effective CTC</div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-300 flex justify-between">
                            <span>Allocated Project Hours</span>
                            <span className="font-bold text-white">{emp.allocatedProjectHours} hrs</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="160"
                            value={emp.allocatedProjectHours}
                            onChange={(e) => {
                              const hours = parseInt(e.target.value) || 0;
                              setPayrollConfigState({
                                ...payrollConfig,
                                employees: payrollConfig.employees.map((item) =>
                                  item.id === emp.id ? { ...item, allocatedProjectHours: hours } : item
                                ),
                              });
                            }}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
                          <span className="text-slate-400">Direct Labor Charge:</span>
                          <span className="font-mono font-bold text-emerald-400">₹{allocatedCost.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: CUSTOM BLOCK BUILDER & PRESETS */}
            {activeTab === "custom_blocks" && (
              <div className="space-y-6">
                {/* Presets Library */}
                <div className="space-y-3">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-400" /> Presets Template Library
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {PRESET_LIBRARIES.map((preset) => (
                      <div key={preset.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-white text-sm">{preset.title}</div>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{preset.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(preset.blocks)}
                          className="mt-3 btn btn-ghost text-xs text-purple-400 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 justify-center"
                        >
                          + Inject Preset Blocks ({preset.blocks.length})
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Custom Block */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <Plus size={16} className="text-cyan-400" /> Build Custom Project Block
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Block Name (e.g. Scaffolding Rental)"
                      value={newBlockName}
                      onChange={(e) => setNewBlockName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                    <select
                      value={newBlockKind}
                      onChange={(e) => setNewBlockKind(e.target.value as CustomBlockKind)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    >
                      <option value="lump_sum">Fixed Lump-Sum</option>
                      <option value="recurring">Recurring (Daily/Monthly)</option>
                      <option value="per_unit">Per-Unit Metric</option>
                      <option value="hourly">Hourly Resource</option>
                      <option value="contingency_pct">Contingency Risk Buffer %</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Amount / Cost (₹)"
                      value={newBlockCost}
                      onChange={(e) => setNewBlockCost(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomBlock}
                      className="btn btn-primary text-xs justify-center py-2"
                    >
                      Inject Custom Block
                    </button>
                  </div>
                </div>

                {/* Custom Blocks List */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-200">Active Custom Blocks Canvas ({customBlocks.length})</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customBlocks.map((b) => (
                      <div key={b.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{b.name}</div>
                          <div className="text-[11px] text-purple-400 uppercase font-semibold">{b.kind.replace("_", " ")}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            ₹{b.totalCost.toLocaleString("en-IN")}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomBlocks(customBlocks.filter((item) => item.id !== b.id))}
                            className="p-1 rounded text-rose-400 hover:bg-rose-500/20"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: TRUE PROJECT P&L & WATERFALL */}
            {activeTab === "pnl" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Direct Material Cost</div>
                    <div className="text-lg font-bold text-white mt-1">₹{directMaterialCost.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Direct Employee Labor</div>
                    <div className="text-lg font-bold text-blue-400 mt-1">
                      ₹{financials.totalAllocatedProjectLaborCost.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400">Absorbed Company OPEX</div>
                    <div className="text-lg font-bold text-cyan-400 mt-1">
                      ₹{financials.totalAbsorbedOverheadCost.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
                    <div className="text-xs text-emerald-300">Suggested Client Proposal</div>
                    <div className="text-xl font-black text-emerald-400 mt-1">
                      ₹{financials.suggestedClientInvoicePrice.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Financial Waterfall Visualizer */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-200 flex items-center justify-between">
                    <span>Financial Revenue Waterfall Breakdown</span>
                    <span className="text-xs font-mono text-cyan-400">Target Margin: {((store.targetMarginPct || 0.25) * 100).toFixed(0)}%</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: "1. Direct Material & BOM", cost: directMaterialCost, color: "bg-slate-700" },
                      { label: "2. Direct Employee Labor", cost: financials.totalAllocatedProjectLaborCost, color: "bg-blue-600" },
                      { label: "3. Absorbed Company OPEX", cost: financials.totalAbsorbedOverheadCost, color: "bg-cyan-600" },
                      { label: "4. Custom Blocks & Risk Buffer", cost: customBlocksTotalCost, color: "bg-purple-600" },
                      { label: "5. Net Profit Contribution", cost: financials.suggestedClientInvoicePrice - financials.trueProjectCost, color: "bg-emerald-500" },
                    ].map((w, i) => {
                      const pct = financials.suggestedClientInvoicePrice > 0 ? (w.cost / financials.suggestedClientInvoicePrice) * 100 : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300 font-medium">{w.label}</span>
                            <span className="font-mono text-slate-200">
                              ₹{w.cost.toLocaleString("en-IN")} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-900 overflow-hidden">
                            <div className={`h-full ${w.color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between sticky bottom-0 z-20">
            <div className="text-xs text-slate-400">
              Absorbed Overhead Rate: <strong className="text-cyan-400">₹{opexMetrics.companyOverheadHourlyRate.toFixed(2)}/hr</strong>
            </div>

            <button
              type="button"
              onClick={handleApplyToStore}
              className="btn btn-primary px-6 py-2 text-xs justify-center"
            >
              Apply OPEX & Payroll to Costing Sheet
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
