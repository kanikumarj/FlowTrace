// ─── Export Factory ──────────────────────────────────────────
// Routes export requests to the correct format handler.

import { prisma } from "@/lib/prisma";
import { generatePDF } from "./pdf-exporter";
import { generateHTML } from "./html-exporter";
import { generateMarkdown } from "./markdown-exporter";
import { generateMermaid } from "./mermaid-exporter";
import type { NormalizedFlow } from "@/lib/parsers/types";

export type ExportFormatType = "PDF" | "HTML" | "MARKDOWN" | "MERMAID";

export interface ExportResult {
  format: ExportFormatType;
  content: string | Buffer;
  fileName: string;
  contentType: string;
  embedUrl?: string;
  token?: string;
}

export async function exportFlow(
  flowId: string,
  versionId: string,
  format: ExportFormatType,
  userId: string,
  options?: { expiresInDays?: number }
): Promise<ExportResult> {
  switch (format) {
    case "PDF": {
      const { pdfBuffer, fileName } = await generatePDF(flowId, versionId);
      await saveExportRecord(flowId, versionId, userId, "PDF", fileName);
      return {
        format: "PDF",
        content: pdfBuffer,
        fileName,
        contentType: "application/pdf",
      };
    }

    case "HTML": {
      const { html, token, embedUrl } = await generateHTML(
        flowId,
        versionId,
        userId,
        options?.expiresInDays
      );
      await saveExportRecord(flowId, versionId, userId, "HTML", embedUrl);
      return {
        format: "HTML",
        content: html,
        fileName: "flow-embed.html",
        contentType: "text/html",
        embedUrl,
        token,
      };
    }

    case "MARKDOWN": {
      const md = await generateMarkdown(flowId, versionId);
      const fileName = `flow-export-v${versionId}.md`;
      await saveExportRecord(flowId, versionId, userId, "MARKDOWN", fileName);
      return {
        format: "MARKDOWN",
        content: md,
        fileName,
        contentType: "text/markdown",
      };
    }

    case "MERMAID": {
      const version = await prisma.flowVersion.findUniqueOrThrow({
        where: { id: versionId },
      });
      const flow = version.normalizedJson as unknown as NormalizedFlow;
      const mermaid = generateMermaid(flow);
      await saveExportRecord(flowId, versionId, userId, "MERMAID", "mermaid.txt");
      return {
        format: "MERMAID",
        content: mermaid,
        fileName: "flow-diagram.mmd",
        contentType: "text/plain",
      };
    }

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

async function saveExportRecord(
  flowId: string,
  versionId: string,
  userId: string,
  format: ExportFormatType,
  fileUrl: string
): Promise<void> {
  await prisma.exportRecord.create({
    data: {
      flowId,
      versionId,
      exportedBy: userId,
      format,
      fileUrl,
    },
  });
}
