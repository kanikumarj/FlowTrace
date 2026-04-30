import type { Platform, ParseResult } from "./types";
import { normalizeFlow } from "./normalizer";
import { AmazonConnectAdapter } from "./adapters/amazon-connect";
import { CiscoUccxAdapter } from "./adapters/cisco-uccx";
import { GenesysAdapter } from "./adapters/genesys";

const adapters = {
  AMAZON_CONNECT: new AmazonConnectAdapter(),
  CISCO_UCCX: new CiscoUccxAdapter(),
  GENESYS: new GenesysAdapter(),
};

/** Detect platform from file extension if not explicitly provided */
export function detectPlatform(fileName: string): Platform | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "xml" || ext === "aef") return "CISCO_UCCX";
  if (ext === "json") return "AMAZON_CONNECT"; // Default JSON → Amazon Connect
  if (ext === "i3inboundflow") return "GENESYS";
  return null;
}

/** Main parser factory — routes to correct adapter, validates output */
export async function parseFlow(
  fileContent: string,
  platform: Platform,
  flowName: string,
  flowId: string
): Promise<ParseResult> {
  const adapter = adapters[platform];
  if (!adapter) {
    return {
      success: false,
      data: null,
      error: `Unsupported platform: ${platform}`,
    };
  }

  // Run platform-specific parser
  const parseResult = await adapter.parse(fileContent, flowName, flowId);
  if (!parseResult.success || !parseResult.data) {
    return parseResult;
  }

  // Validate through normalizer
  const normalized = normalizeFlow(parseResult.data);
  if (!normalized.success) {
    return {
      success: false,
      data: normalized.data,
      error: `Validation failed: ${normalized.errors.join("; ")}`,
    };
  }

  return {
    success: true,
    data: normalized.data,
    error: null,
  };
}
