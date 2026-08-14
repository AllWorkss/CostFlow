// ============================================================
// CostFlow — Enterprise RBAC, FLS & Audit Engine
// ============================================================

import type {
  UserRole,
  UserSession,
  BlockType,
  PermissionState,
  CostingApprovalStatus,
  AuditLogEntry,
  OrganizationMember,
} from "@/types/costing";

export const SAMPLE_TEAM_MEMBERS: OrganizationMember[] = [
  {
    id: "usr_101",
    name: "Rahul Sharma (Executive)",
    email: "rahul@costflow-enterprise.com",
    role: "super_admin",
    department: "executive",
    status: "active",
    joinedAt: "2026-01-10",
  },
  {
    id: "usr_102",
    name: "Vikram Patel (Plant Manager)",
    email: "vikram.p@costflow-enterprise.com",
    role: "plant_manager",
    department: "production",
    status: "active",
    joinedAt: "2026-02-15",
  },
  {
    id: "usr_103",
    name: "Ananya Roy (Procurement Lead)",
    email: "ananya.r@costflow-enterprise.com",
    role: "procurement_specialist",
    department: "procurement",
    status: "active",
    joinedAt: "2026-03-01",
  },
  {
    id: "usr_104",
    name: "Suresh Kumar (Line Operator)",
    email: "suresh.k@costflow-enterprise.com",
    role: "floor_operator",
    department: "production",
    status: "active",
    joinedAt: "2026-04-12",
  },
  {
    id: "usr_105",
    name: "Priya Singh (Sales Rep)",
    email: "priya.s@costflow-enterprise.com",
    role: "sales_rep",
    department: "sales",
    status: "active",
    joinedAt: "2026-05-20",
  },
];

export const DEFAULT_SUPER_ADMIN_SESSION: UserSession = {
  id: "usr_101",
  name: "Rahul Sharma",
  email: "rahul@costflow-enterprise.com",
  role: "super_admin",
  department: "executive",
  organizationId: "org_costflow_ind",
  organizationName: "CostFlow Enterprise Manufacturing Ltd",
  plantBranch: "Plant 1 — Mumbai Industrial Zone",
};

/**
 * Determine Field-Level Security (FLS) state for a costing variable
 */
export function getVariablePermissionState(
  role: UserRole,
  blockType: BlockType,
  variableId: string,
  approvalStatus: CostingApprovalStatus = "draft"
): PermissionState {
  // If the sheet is locked for production, all fields become readonly regardless of role
  if (approvalStatus === "locked") return "readonly";

  // 1. Super Admin: Full edit rights everywhere
  if (role === "super_admin") return "editable";

  // 2. Floor Operator: Strict financial masking
  if (role === "floor_operator") {
    const isFinancial = [
      "unitCost", "hourlyRate", "machineRate", "finishCostPerMeter",
      "purchasePrice", "transportCost", "cogsCost", "markupPct", "gstRate",
      "adminPct", "materialCostPerSqm", "laborCostPerSqm", "subcontractAmount", "siteOverhead",
    ].includes(variableId);

    if (isFinancial) return "hidden_masked";

    // Operational quantities are editable
    if (["qty", "scrapPct", "laborHours", "workers", "shiftHours", "spoilagePct", "areaSqm"].includes(variableId)) {
      return "editable";
    }
    return "readonly";
  }

  // 3. Sales Representative: Can only see approved prices, hides base costs & supplier details
  if (role === "sales_rep") {
    if (blockType === "profit_markup") return "editable";
    const isBaseCost = ["unitCost", "purchasePrice", "hourlyRate", "machineRate", "subcontractAmount"].includes(variableId);
    if (isBaseCost) return "hidden_masked";
    return "readonly";
  }

  // 4. Procurement Specialist: Manages raw material purchase rates; hides selling markups
  if (role === "procurement_specialist") {
    if (blockType === "raw_material" || blockType === "transport" || blockType === "packaging") {
      return "editable";
    }
    if (blockType === "profit_markup") return "hidden_masked";
    return "readonly";
  }

  // 5. Plant Manager: Manages BOM, scrap %, machine rates; hides executive net profit
  if (role === "plant_manager") {
    if (["raw_material", "wastage", "direct_labor", "variable_overhead", "finishing"].includes(blockType)) {
      return "editable";
    }
    if (blockType === "profit_markup") return "readonly";
    return "editable";
  }

  return "readonly";
}

/**
 * Format & mask variable values for UI display
 */
export function maskDisplayValue(
  value: number,
  permState: PermissionState,
  currency: "INR" | "USD" = "INR",
  isPercentage = false
): string {
  if (permState === "hidden_masked") return "***";

  const symbol = currency === "INR" ? "₹" : "$";
  if (isPercentage) return `${(value * 100).toFixed(1)}%`;
  return `${symbol}${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Check if a user can approve or change workflow status
 */
export function canUserManageApproval(role: UserRole): boolean {
  return role === "super_admin" || role === "plant_manager";
}

/**
 * Check if a user can view full summary breakdown
 */
export function canUserViewFullSummary(role: UserRole): boolean {
  return role === "super_admin" || role === "plant_manager" || role === "procurement_specialist";
}

/**
 * Create immutable audit log entry
 */
export function createAuditLogEntry(
  user: UserSession,
  blockId: string,
  blockLabel: string,
  variableId: string,
  variableName: string,
  oldValue: number | string,
  newValue: number | string
): AuditLogEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    blockId,
    blockLabel,
    variableId,
    variableName,
    oldValue,
    newValue,
    department: user.department,
  };
}
