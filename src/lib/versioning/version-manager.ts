import { prisma } from "@/lib/prisma";
import { NormalizedFlow } from "@/lib/parsers/types";
import { computeDiff } from "./diff-engine";

export async function createVersion(
  flowId: string,
  normalizedJson: NormalizedFlow,
  rawFileUrl: string,
  userId: string
) {
  // 1. Get current max versionNumber for flowId -> increment
  const maxVersion = await prisma.flowVersion.findFirst({
    where: { flowId },
    orderBy: { versionNumber: "desc" }
  });

  const nextVersionNumber = (maxVersion?.versionNumber || 0) + 1;

  // Set previous isActive version to false
  await prisma.flowVersion.updateMany({
    where: { flowId, isActive: true },
    data: { isActive: false }
  });

  // Create new version with isActive: true
  const newVersion = await prisma.flowVersion.create({
    data: {
      flowId,
      versionNumber: nextVersionNumber,
      label: `Version ${nextVersionNumber}`,
      rawFileUrl,
      normalizedJson: JSON.parse(JSON.stringify(normalizedJson)),
      nodeCount: normalizedJson.nodes.length,
      edgeCount: normalizedJson.edges.length,
      importedById: userId,
      isActive: true
    }
  });

  // Update Flow with new numbers
  await prisma.flow.update({
    where: { id: flowId },
    data: {
      nodeCount: normalizedJson.nodes.length,
      normalizedJson: JSON.parse(JSON.stringify(normalizedJson))
    }
  });

  // Trigger diff vs previous active (which is maxVersion if exists)
  if (maxVersion) {
    // async compute
    computeDiff(maxVersion, newVersion).catch(err => {
      console.error("Error computing diff:", err);
    });
  }

  return newVersion;
}

export async function listVersions(flowId: string) {
  return await prisma.flowVersion.findMany({
    where: { flowId },
    orderBy: { versionNumber: "desc" },
    include: { importedBy: { select: { name: true, email: true } } }
  });
}
