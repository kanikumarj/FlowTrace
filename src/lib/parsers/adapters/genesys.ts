import type { ParserAdapter, ParseResult, NormalizedFlow, NormalizedNode } from "../types";

export class GenesysAdapter implements ParserAdapter {
  parse(fileContent: string, flowName: string, flowId: string): ParseResult {
    try {
      let rawJson = {};
      try {
        rawJson = JSON.parse(fileContent);
      } catch {
        // If not standard JSON, just store as raw text in metadata
        rawJson = { rawContent: fileContent.substring(0, 1000) + "..." };
      }

      // Basic stub for Genesys parsing to unblock file ingestion
      const startNode: NormalizedNode = {
        id: "start-node",
        type: "START",
        label: "Genesys Flow Start",
        metadata: { info: "Genesys parsing engine under development", rawData: rawJson }
      };

      const normalizedFlow: NormalizedFlow = {
        flowId: flowId,
        flowName: flowName,
        platform: "GENESYS",
        nodes: [startNode],
        edges: []
      };

      return {
        success: true,
        data: normalizedFlow,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: `Genesys parse failed: ${String(error)}`,
      };
    }
  }
}
