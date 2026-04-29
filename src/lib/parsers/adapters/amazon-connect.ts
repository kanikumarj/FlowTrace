import type { ParserAdapter, ParseResult, NormalizedNode, NormalizedEdge, NodeType } from "../types";

// ─── Amazon Connect Action Type → FlowTrace Node Type ────────
const ACTION_TYPE_MAP: Record<string, NodeType> = {
  MessageParticipant: "PROMPT",
  PlayPrompt: "PROMPT",
  GetParticipantInput: "MENU",
  TransferContactToQueue: "QUEUE",
  TransferToPhoneNumber: "TRANSFER",
  TransferParticipantToThirdParty: "TRANSFER",
  CheckAttribute: "CONDITION",
  CheckContactAttributes: "CONDITION",
  Compare: "CONDITION",
  InvokeLambdaFunction: "API_CALL",
  InvokeExternalResource: "API_CALL",
  DisconnectParticipant: "HANGUP",
  SetQueue: "QUEUE",
  SetWorkingQueue: "QUEUE",
  TransferToQueue: "QUEUE",
  EndFlowExecution: "HANGUP",
  Wait: "PROMPT",
  Loop: "CONDITION",
  SetContactAttributes: "PROMPT",
  UpdateContactAttributes: "PROMPT",
  TransferToVoicemail: "VOICEMAIL",
};

function mapActionType(amazonType: string): NodeType {
  return ACTION_TYPE_MAP[amazonType] || "UNKNOWN";
}

function extractLabel(action: AmazonAction): string {
  const params = action.Parameters || {};
  if (params.Text) return String(params.Text).slice(0, 80);
  if (params.Prompt) return `Prompt: ${params.Prompt}`;
  if (params.QueueId) return `Queue: ${params.QueueId}`;
  if (params.PhoneNumber) return `Transfer: ${params.PhoneNumber}`;
  if (params.LambdaFunctionARN) {
    const arn = String(params.LambdaFunctionARN);
    return `Lambda: ${arn.split(":").pop() || arn}`;
  }
  if (params.Attribute) return `Check: ${params.Attribute}`;
  return action.Type || "Unknown";
}

function extractAudioPrompt(action: AmazonAction): string | undefined {
  const params = action.Parameters || {};
  if (params.PromptId) return String(params.PromptId);
  if (params.AudioPrompt) return String(params.AudioPrompt);
  return undefined;
}

// ─── Amazon Connect Types ────────────────────────────────────
interface AmazonAction {
  Identifier: string;
  Type: string;
  Parameters?: Record<string, unknown>;
  Transitions?: {
    NextAction?: string;
    Conditions?: Array<{
      NextAction: string;
      Condition?: {
        Operator?: string;
        Operands?: string[];
      };
    }>;
    Errors?: Array<{
      NextAction: string;
      ErrorType?: string;
    }>;
  };
}

interface AmazonConnectFlow {
  Version?: string;
  StartAction?: string;
  Actions?: AmazonAction[];
  Metadata?: {
    ActionMetadata?: Record<string, { position?: { x: number; y: number } }>;
  };
}

// ─── Parser ──────────────────────────────────────────────────
export class AmazonConnectAdapter implements ParserAdapter {
  parse(fileContent: string, flowName: string, flowId: string): ParseResult {
    let raw: AmazonConnectFlow;
    try {
      raw = JSON.parse(fileContent);
    } catch {
      return { success: false, data: null, error: "Invalid JSON — file could not be parsed" };
    }

    if (!raw.Actions || !Array.isArray(raw.Actions)) {
      return { success: false, data: null, error: "Missing required 'Actions' array — not a valid Amazon Connect flow" };
    }

    if (raw.Actions.length === 0) {
      return { success: false, data: null, error: "Zero nodes detected — Actions array is empty" };
    }

    const nodes: NormalizedNode[] = [];
    const edges: NormalizedEdge[] = [];
    const actionIds = new Set(raw.Actions.map((a) => a.Identifier));
    const metadata = raw.Metadata?.ActionMetadata || {};

    // Add START node
    if (raw.StartAction && actionIds.has(raw.StartAction)) {
      nodes.push({
        id: "__start__",
        type: "START",
        label: "Start",
        metadata: {},
      });
      edges.push({
        source: "__start__",
        target: raw.StartAction,
        label: "",
      });
    }

    // Parse each action
    for (const action of raw.Actions) {
      const nodeType = mapActionType(action.Type);
      const node: NormalizedNode = {
        id: action.Identifier,
        type: nodeType,
        label: extractLabel(action),
        audioPrompt: extractAudioPrompt(action),
        metadata: {
          originalType: action.Type,
          parameters: action.Parameters || {},
          ...(metadata[action.Identifier]?.position
            ? { position: metadata[action.Identifier].position }
            : {}),
        },
      };
      nodes.push(node);

      // Extract edges from transitions
      const transitions = action.Transitions;
      if (!transitions) continue;

      // Default next action
      if (transitions.NextAction && actionIds.has(transitions.NextAction)) {
        const label = nodeType === "MENU" ? "Default / Timeout" :
                      nodeType === "CONDITION" ? "No Match" : "";
        edges.push({
          source: action.Identifier,
          target: transitions.NextAction,
          label,
        });
      }

      // Conditional transitions (DTMF options, attribute checks)
      if (transitions.Conditions) {
        for (const cond of transitions.Conditions) {
          if (!cond.NextAction || !actionIds.has(cond.NextAction)) continue;
          let label = "";
          if (cond.Condition?.Operands?.[0]) {
            label = nodeType === "MENU"
              ? `Press ${cond.Condition.Operands[0]}`
              : `${cond.Condition.Operator || "="} ${cond.Condition.Operands[0]}`;
          }
          edges.push({
            source: action.Identifier,
            target: cond.NextAction,
            label,
            condition: cond.Condition
              ? `${cond.Condition.Operator || "Equals"}(${(cond.Condition.Operands || []).join(", ")})`
              : undefined,
          });
        }
      }

      // Error transitions
      if (transitions.Errors) {
        for (const err of transitions.Errors) {
          if (!err.NextAction || !actionIds.has(err.NextAction)) continue;
          edges.push({
            source: action.Identifier,
            target: err.NextAction,
            label: `Error: ${err.ErrorType || "Unknown"}`,
          });
        }
      }
    }

    if (nodes.length <= 1) {
      return { success: false, data: null, error: "Zero actionable nodes detected — file may be empty or unsupported version" };
    }

    return {
      success: true,
      data: { flowId, platform: "AMAZON_CONNECT", flowName, nodes, edges },
      error: null,
    };
  }
}
