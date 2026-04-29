import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createVersion, listVersions } from "@/lib/versioning/version-manager";
import { normalizeFlow } from "@/lib/parsers/normalizer";

export async function GET(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const versions = await listVersions(params.flowId);
    return NextResponse.json({ versions });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { flowId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const content = await file.text();
    let raw;
    try {
      raw = JSON.parse(content);
    } catch (e) {
      return NextResponse.json({ error: "File must be valid JSON" }, { status: 400 });
    }

    const { success, data, errors } = normalizeFlow(raw);
    if (!success || !data) {
      return NextResponse.json({ error: "Invalid flow format", errors }, { status: 400 });
    }

    const newVersion = await createVersion(params.flowId, data, "local-upload", session.user.id);

    return NextResponse.json({
      versionId: newVersion.id,
      versionNumber: newVersion.versionNumber,
      diffSummary: "Diff computation triggered async"
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
