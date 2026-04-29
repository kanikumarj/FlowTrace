import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  workspaceName?: string;
}

export async function POST(request: Request) {
  try {
    const body: RegisterBody = await request.json();
    const { name, email, password, workspaceName } = body;

    // ─── Validation ────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // ─── Check for existing user ───────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ─── Create user + workspace in a transaction ──────────
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
        },
      });

      // Create workspace (user becomes ADMIN)
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName?.trim() || `${name.trim()}'s Workspace`,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });

      return { user, workspace };
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
        },
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
