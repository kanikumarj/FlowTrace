import type { NodeTypes } from "reactflow";
import { StartNode } from "./StartNode";
import { MenuNode } from "./MenuNode";
import { PromptNode } from "./PromptNode";
import { ConditionNode } from "./ConditionNode";
import { TransferNode } from "./TransferNode";
import { ApiCallNode } from "./ApiCallNode";
import { QueueNode } from "./QueueNode";
import { HangupNode } from "./HangupNode";
import { VoicemailNode, UnknownNode } from "./VoicemailNode";

export const nodeTypes: NodeTypes = {
  START: StartNode,
  MENU: MenuNode,
  PROMPT: PromptNode,
  CONDITION: ConditionNode,
  TRANSFER: TransferNode,
  API_CALL: ApiCallNode,
  QUEUE: QueueNode,
  HANGUP: HangupNode,
  VOICEMAIL: VoicemailNode,
  UNKNOWN: UnknownNode,
};
