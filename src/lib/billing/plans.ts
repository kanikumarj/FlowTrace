// ─── FlowTrace Plan Limits Definition ────────────────────────
// Defines hard caps and feature flags for each subscription tier.

export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

export interface PlanLimits {
  maxFlows: number;           // -1 = unlimited
  maxUsers: number;
  maxVersionsPerFlow: number;
  simulationRuns: number;     // per month, -1 = unlimited
  confluenceSync: boolean;
  exportFormats: string[];
  htmlEmbed: boolean;
  apiAccess: boolean;
  auditLog: boolean;
  ssoEnabled: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    maxFlows: 1,
    maxUsers: 3,
    maxVersionsPerFlow: 5,
    simulationRuns: 10,
    confluenceSync: false,
    exportFormats: ["PDF"],
    htmlEmbed: false,
    apiAccess: false,
    auditLog: false,
    ssoEnabled: false,
  },
  PRO: {
    maxFlows: -1,
    maxUsers: 10,
    maxVersionsPerFlow: -1,
    simulationRuns: -1,
    confluenceSync: true,
    exportFormats: ["PDF", "HTML", "MARKDOWN", "MERMAID"],
    htmlEmbed: true,
    apiAccess: false,
    auditLog: false,
    ssoEnabled: false,
  },
  ENTERPRISE: {
    maxFlows: -1,
    maxUsers: -1,
    maxVersionsPerFlow: -1,
    simulationRuns: -1,
    confluenceSync: true,
    exportFormats: ["PDF", "HTML", "MARKDOWN", "MERMAID"],
    htmlEmbed: true,
    apiAccess: true,
    auditLog: true,
    ssoEnabled: true,
  },
};

export const PLAN_DISPLAY: Record<PlanTier, { name: string; price: number; priceLabel: string }> = {
  FREE: { name: "Free", price: 0, priceLabel: "Free" },
  PRO: { name: "Pro", price: 9900, priceLabel: "$99/mo" },
  ENTERPRISE: { name: "Enterprise", price: 49900, priceLabel: "$499/mo" },
};
