import { parseStringPromise } from "xml2js";
import { z } from "zod";
import type { ParserAdapter, ParseResult, NormalizedFlow, NormalizedNode, NormalizedEdge } from "../types";
import { NodeType } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// STEP TYPE MAPPING
// Maps every PureConnect step type to the Normalized NodeType
// ─────────────────────────────────────────────────────────────────────────────

const STEP_TYPE_MAP: Record<string, NodeType> = {
  // Prompt / audio playback
  PlayPrompt: "PROMPT",
  PlayAudio: "PROMPT",
  TextToSpeech: "PROMPT",

  // Menu / digit collection
  GetAttention: "MENU",
  DigitCollect: "MENU",
  Menu: "MENU",
  SelectAction: "MENU",

  // Conditions / branching
  Compare: "CONDITION",
  Decision: "CONDITION",
  Calculation: "CONDITION",
  CheckSchedule: "CONDITION",
  CheckAttribute: "CONDITION",
  BusinessHoursCondition: "CONDITION",
  IfElse: "CONDITION",

  // Transfer
  Transfer: "TRANSFER",
  BlindTransfer: "TRANSFER",
  ConsultTransfer: "TRANSFER",
  SupervisedTransfer: "TRANSFER",

  // Queue routing
  TransferToACD: "QUEUE",
  TransferToWorkgroup: "QUEUE",
  RouteToQueue: "QUEUE",
  PlaceInQueue: "QUEUE",
  SetQueue: "QUEUE",

  // Hangup / disconnect
  Disconnect: "HANGUP",
  Hangup: "HANGUP",
  EndCall: "HANGUP",
  ReleaseCall: "HANGUP",

  // Voicemail
  Voicemail: "VOICEMAIL",
  RouteToVoicemail: "VOICEMAIL",
  TransferToVoicemail: "VOICEMAIL",

  // External calls / web services
  InvokeWebService: "API_CALL",
  CallSubroutine: "API_CALL",
  SubroutineCall: "API_CALL",
  RunHandler: "API_CALL",
  ExternalRoutingRequest: "API_CALL",
};

function resolveNodeType(rawType: string): NodeType {
  return STEP_TYPE_MAP[rawType] ?? "UNKNOWN";
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMETER EXTRACTOR
// Pulls named parameters from a Step's <Parameters> block
// ─────────────────────────────────────────────────────────────────────────────

function extractParams(
  step: Record<string, unknown>
): Record<string, string> {
  const params: Record<string, string> = {};

  // xml2js structure: step.Parameters[0].Parameter = [ { $: { name, value } } ]
  const paramBlock = (step["Parameters"] as Array<unknown>)?.[0];
  if (!paramBlock || typeof paramBlock !== "object") return params;

  const paramList = (paramBlock as Record<string, unknown>)[
    "Parameter"
  ] as Array<Record<string, Record<string, string>>>;

  if (!Array.isArray(paramList)) return params;

  for (const param of paramList) {
    const attrs = param["$"];
    if (attrs?.name) {
      params[attrs.name] = attrs.value ?? "";
    }
  }

  return params;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO PROMPT RESOLVER
// Multiple PureConnect parameter names carry audio prompt info
// ─────────────────────────────────────────────────────────────────────────────

const AUDIO_PARAM_KEYS = [
  "Prompt",
  "AudioFile",
  "PromptFile",
  "GreetingFile",
  "WavFile",
  "TTSText",
  "PromptName",
];

function resolveAudioPrompt(
  params: Record<string, string>
): string | undefined {
  for (const key of AUDIO_PARAM_KEYS) {
    if (params[key]) return params[key];
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXIT / EDGE EXTRACTOR
// Converts a Step's <Exits> block into NormalizedEdge[]
// ─────────────────────────────────────────────────────────────────────────────

function extractEdges(
  step: Record<string, unknown>,
  sourceId: string
): NormalizedEdge[] {
  const edges: NormalizedEdge[] = [];

  const exitBlock = (step["Exits"] as Array<unknown>)?.[0];
  if (!exitBlock || typeof exitBlock !== "object") return edges;

  const exitList = (exitBlock as Record<string, unknown>)[
    "Exit"
  ] as Array<Record<string, Record<string, string>>>;

  if (!Array.isArray(exitList)) return edges;

  for (const exit of exitList) {
    const attrs = exit["$"];
    if (!attrs?.targetStepId) continue; // dangling exit — skip

    edges.push({
      source: sourceId,
      target: String(attrs.targetStepId),
      label: attrs.label ?? attrs.id ?? "Next",
      condition: attrs.condition ?? undefined,
    });
  }

  return edges;
}

// ─────────────────────────────────────────────────────────────────────────────
// START NODE DETECTOR
// In PureConnect, the first Step in the Handler is the entry point.
// Some flows explicitly mark it with type="Start" or label="Entry".
// ─────────────────────────────────────────────────────────────────────────────

function detectStartNodeId(
  steps: Array<Record<string, Record<string, string>>>
): string | null {
  if (!steps.length) return null;

  // Explicit start node
  for (const step of steps) {
    const attrs = step["$"];
    if (
      attrs?.type?.toLowerCase() === "start" ||
      attrs?.label?.toLowerCase() === "entry" ||
      attrs?.label?.toLowerCase() === "start"
    ) {
      return attrs.id;
    }
  }

  // Fallback: first step is always the entry point in PureConnect
  return steps[0]["$"]?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN STEP PARSER
// Converts a single <Step> element into a NormalizedNode
// ─────────────────────────────────────────────────────────────────────────────

function parseStep(
  step: Record<string, unknown>,
  isStartNode: boolean
): NormalizedNode {
  const attrs = (step["$"] as Record<string, string>) ?? {};
  const rawType = attrs["type"] ?? "UNKNOWN";
  const params = extractParams(step);

  const nodeType: NodeType = isStartNode ? "START" : resolveNodeType(rawType);

  const node: NormalizedNode = {
    id: attrs["id"] ?? `node_${Math.random().toString(36).slice(2, 8)}`,
    type: nodeType,
    label:
      attrs["label"] ||
      params["Name"] ||
      params["StepName"] ||
      rawType,
    audioPrompt: resolveAudioPrompt(params),
    metadata: {
      originalType: rawType,
      rawParameters: params,
      stepOrder: attrs["order"] ?? undefined,
      category: attrs["category"] ?? undefined,
    },
  };

  return node;
}


// ─────────────────────────────────────────────────────────────────────────────
// GENESYS ADAPTER
// ─────────────────────────────────────────────────────────────────────────────

export class GenesysAdapter implements ParserAdapter {
  async parse(fileContent: string, flowName: string, flowId: string): Promise<ParseResult> {
    // ── Pre-Stage: Detect format (JSON vs XML) ──────────────────────────────
    let isJson = false;
    let rawJson: any = null;
    try {
      rawJson = JSON.parse(fileContent.trim());
      isJson = true;
    } catch {
      // Not JSON, assume XML
    }

    if (isJson) {
      // Basic stub for Genesys Cloud parsing to unblock file ingestion
      const startNode: NormalizedNode = {
        id: "start-node",
        type: "START",
        label: "Genesys Cloud Flow Start",
        metadata: { info: "Genesys Cloud parsing engine under development", rawData: rawJson }
      };

      const normalizedFlow: NormalizedFlow = {
        flowId,
        platform: "GENESYS",
        flowName: flowName ?? "Genesys Cloud Flow",
        nodes: [startNode],
        edges: []
      };

      return {
        success: true,
        data: normalizedFlow,
        error: null,
      };
    }

    // ── Stage 1: XML → JS object (Genesys PureConnect) ──────────────────────
    let parsed: Record<string, unknown>;
    try {
      parsed = await parseStringPromise(fileContent, {
        explicitArray: true,
        mergeAttrs: false,
        trim: true,
        normalize: true,
      });
    } catch (err) {
      return {
        success: false,
        data: null,
        error: `File format not recognized as JSON or XML: ${String(err)}`,
      };
    }

    // ── Stage 2: Navigate to Handler root ────────────────────────────────────
    const handlerRoot =
      (parsed["Handler"] as Record<string, unknown>) ??
      (parsed["InboundFlowHandler"] as Record<string, unknown>) ??
      (parsed["HandlerDefinition"] as Record<string, unknown>);

    if (!handlerRoot) {
      return {
        success: false,
        data: null,
        error: `Missing required <Handler> root element. Top-level keys found: ${Object.keys(parsed).join(", ")}`,
      };
    }

    const handlerAttrs = (handlerRoot["$"] as Record<string, string>) ?? {};

    const resolvedFlowName =
      flowName ??
      handlerAttrs["HandlerName"] ??
      handlerAttrs["Name"] ??
      "Unnamed Flow";

    // ── Stage 3: Extract Steps ───────────────────────────────────────────────
    const stepsBlock = (handlerRoot["Steps"] as Array<unknown>)?.[0];
    if (!stepsBlock || typeof stepsBlock !== "object") {
      return {
        success: false,
        data: null,
        error: "Zero nodes detected — could not locate <Steps> block inside <Handler>",
      };
    }

    const rawSteps = (stepsBlock as Record<string, unknown>)["Step"] as Array<Record<string, unknown>>;

    if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
      return {
        success: false,
        data: null,
        error: "Zero nodes detected — <Steps> block is present but contains no <Step> elements",
      };
    }

    // ── Stage 4: Detect start node ───────────────────────────────────────────
    const startNodeId = detectStartNodeId(
      rawSteps as Array<Record<string, Record<string, string>>>
    );

    // ── Stage 5: Parse nodes + edges ─────────────────────────────────────────
    const nodes: NormalizedNode[] = [];
    const edges: NormalizedEdge[] = [];
    const seenIds = new Set<string>();

    for (const rawStep of rawSteps) {
      const attrs = (rawStep["$"] as Record<string, string>) ?? {};
      const stepId = attrs["id"];

      if (!stepId) continue; // skip malformed steps
      if (seenIds.has(stepId)) continue; // skip duplicate IDs
      seenIds.add(stepId);

      const isStart = stepId === startNodeId;
      nodes.push(parseStep(rawStep, isStart));
      edges.push(...extractEdges(rawStep, stepId));
    }

    // ── Stage 6: Filter dangling edges ───────────────────────────────────────
    // Remove edges that point to non-existent node IDs
    const nodeIdSet = new Set(nodes.map((n) => n.id));
    const validEdges = edges.filter((e) => nodeIdSet.has(e.target));

    // ── Stage 7: Build + return NormalizedFlow ──────────────────────────────
    const normalizedFlow: NormalizedFlow = {
      flowId,
      platform: "GENESYS",
      flowName: resolvedFlowName,
      nodes,
      edges: validEdges,
    };

    return {
      success: true,
      data: normalizedFlow,
      error: null,
    };
  }
}
