import { z } from "zod";

// ─── Node Types ──────────────────────────────────────────────
export const NODE_TYPES = [
  "MENU", "PROMPT", "TRANSFER", "CONDITION", "API_CALL",
  "QUEUE", "HANGUP", "START", "VOICEMAIL", "UNKNOWN",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

// ─── Zod Schemas ─────────────────────────────────────────────
export const NormalizedNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NODE_TYPES),
  label: z.string(),
  audioPrompt: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
});

export const NormalizedEdgeSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().default(""),
  condition: z.string().optional(),
});

export const NormalizedFlowSchema = z.object({
  flowId: z.string(),
  platform: z.string(),
  flowName: z.string(),
  nodes: z.array(NormalizedNodeSchema).min(1, "Flow must have at least one node"),
  edges: z.array(NormalizedEdgeSchema),
});

// ─── TypeScript Types (inferred from Zod) ────────────────────
export type NormalizedNode = z.infer<typeof NormalizedNodeSchema>;
export type NormalizedEdge = z.infer<typeof NormalizedEdgeSchema>;
export type NormalizedFlow = z.infer<typeof NormalizedFlowSchema>;

// ─── Parser Result ───────────────────────────────────────────
export interface ParseResult {
  success: boolean;
  data: NormalizedFlow | null;
  error: string | null;
}

export type Platform = "AMAZON_CONNECT" | "CISCO_UCCX" | "GENESYS";

// ─── Parser Adapter Interface ────────────────────────────────
export interface ParserAdapter {
  parse(fileContent: string, flowName: string, flowId: string): ParseResult;
}
