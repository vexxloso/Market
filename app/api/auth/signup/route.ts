import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { setSessionUser } from "@/lib/auth";
import { hashPassword, PASSWORD_MIN_LENGTH } from "@/lib/password";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    name?: string;
    password?: string;
  };
  if (!body.email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` },
      { status: 400 },
    );
  }

  const email = body.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already exists." }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name: body.name?.trim() || null,
      passwordHash,
      role: UserRole.GUEST,
    },
  });

  await setSessionUser({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return NextResponse.json({
    message: "Signup successful.",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
