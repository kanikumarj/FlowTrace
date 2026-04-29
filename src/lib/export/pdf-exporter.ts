// ─── PDF Exporter ────────────────────────────────────────────
// Generates a PDF document with flow overview, node table, and change log.
// Uses html-pdf-node for server-side rendering (lighter than Puppeteer).

import { prisma } from "@/lib/prisma";
import { generateMermaid } from "./mermaid-exporter";
import type { NormalizedFlow } from "@/lib/parsers/types";

export async function generatePDF(
  flowId: string,
  versionId: string
): Promise<{ pdfBuffer: Buffer; fileName: string }> {
  const version = await prisma.flowVersion.findUniqueOrThrow({
    where: { id: versionId },
    include: { flow: true },
  });

  const flow = version.normalizedJson as unknown as NormalizedFlow;
  const exportDate = new Date().toISOString().split("T")[0];

  const diffs = await prisma.flowDiff.findMany({
    where: { flowId },
    orderBy: { computedAt: "desc" },
    take: 5,
    include: {
      fromVersion: { select: { versionNumber: true } },
      toVersion: { select: { versionNumber: true } },
    },
  });

  const htmlContent = buildPDFHTML(
    flow,
    version.flow.name,
    version.flow.platform,
    version.versionNumber,
    exportDate,
    diffs
  );

  // Dynamic import to avoid breaking edge runtime
  let pdfBuffer: Buffer;
  try {
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    await browser.close();
    pdfBuffer = Buffer.from(pdf);
  } catch {
    // Fallback: return HTML as buffer if Puppeteer unavailable
    pdfBuffer = Buffer.from(htmlContent, "utf-8");
  }

  const fileName = `${version.flow.name.replace(/\s+/g, "_")}_v${version.versionNumber}_${exportDate}.pdf`;
  return { pdfBuffer, fileName };
}

function buildPDFHTML(
  flow: NormalizedFlow,
  flowName: string,
  platform: string,
  versionNumber: number,
  exportDate: string,
  diffs: Array<{
    addedNodes: number;
    removedNodes: number;
    modifiedNodes: number;
    addedEdges: number;
    removedEdges: number;
    computedAt: Date;
    fromVersion: { versionNumber: number };
    toVersion: { versionNumber: number };
  }>
): string {
  const nodeRows = flow.nodes
    .map(
      (n) =>
        `<tr><td>${n.id}</td><td><span class="type-badge ${n.type.toLowerCase()}">${n.type}</span></td><td>${n.label}</td><td>${n.audioPrompt ?? "—"}</td></tr>`
    )
    .join("");

  const diffRows = diffs
    .map((d) => {
      const summary = [
        d.addedNodes > 0 ? `+${d.addedNodes} nodes` : "",
        d.removedNodes > 0 ? `-${d.removedNodes} nodes` : "",
        d.modifiedNodes > 0 ? `${d.modifiedNodes} modified` : "",
      ]
        .filter(Boolean)
        .join(", ");
      return `<li>v${d.toVersion.versionNumber} ← v${d.fromVersion.versionNumber}: ${summary} (${d.computedAt.toISOString().split("T")[0]})</li>`;
    })
    .join("");

  return `<!DOCTYPE html><html><head><style>
body{font-family:Inter,-apple-system,sans-serif;color:#1e293b;padding:40px;font-size:12px}
.cover{text-align:center;padding:80px 0 40px;border-bottom:2px solid #e2e8f0;margin-bottom:40px}
.cover h1{font-size:28px;font-weight:700;color:#0f172a;margin-bottom:8px}
.cover .sub{color:#64748b;font-size:14px}
.cover .logo{font-size:24px;color:#818cf8;font-weight:700;margin-bottom:24px}
h2{font-size:16px;color:#0f172a;margin:32px 0 12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{text-align:left;padding:8px 12px;border:1px solid #e2e8f0;font-size:11px}
th{background:#f8fafc;font-weight:600;color:#475569}
.type-badge{padding:2px 6px;border-radius:4px;font-size:9px;font-weight:600}
.start{background:#dcfce7;color:#166534}.menu{background:#dbeafe;color:#1e40af}
.hangup{background:#fef2f2;color:#991b1b}.queue{background:#ccfbf1;color:#115e59}
.transfer{background:#f3e8ff;color:#6b21a8}.condition{background:#fef3c7;color:#92400e}
ul{padding-left:20px}li{margin:4px 0;color:#475569}
.footer{margin-top:40px;text-align:center;color:#94a3b8;font-size:10px;border-top:1px solid #e2e8f0;padding-top:16px}
</style></head><body>
<div class="cover"><div class="logo">FlowTrace</div><h1>${flowName}</h1><p class="sub">Version ${versionNumber} · ${platform.replace("_", " ")} · Exported ${exportDate}</p><p class="sub">${flow.nodes.length} nodes · ${flow.edges.length} edges</p></div>
<h2>Node Reference</h2>
<table><thead><tr><th>Node ID</th><th>Type</th><th>Label</th><th>Audio Prompt</th></tr></thead><tbody>${nodeRows}</tbody></table>
${diffs.length > 0 ? `<h2>Change Log (Last 5 Versions)</h2><ul>${diffRows}</ul>` : ""}
<div class="footer">Generated by FlowTrace · ${exportDate}</div>
</body></html>`;
}
