import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVerifiedSessionUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

const MAX_LEN = 2000;

function asStringRecord(value: unknown): Record<string, string> | null {
  if (value === null || value === undefined) return {};
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v.slice(0, MAX_LEN);
    else if (v === null || v === undefined) out[k] = "";
  }
  return out;
}

export async function PATCH(request: Request) {
  const session = await getVerifiedSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const data: {
    name?: string | null;
    bio?: string | null;
    work?: string | null;
    avatarUrl?: string | null;
    showTravelStamps?: boolean;
    profileAnswers?: Prisma.InputJsonValue;
  } = {};

  if ("name" in b) {
    if (b.name === null) data.name = null;
    else if (typeof b.name === "string") data.name = b.name.trim().slice(0, 120) || null;
    else return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  if ("bio" in b) {
    if (b.bio === null) data.bio = null;
    else if (typeof b.bio === "string") data.bio = b.bio.slice(0, MAX_LEN) || null;
    else return NextResponse.json({ error: "Invalid bio" }, { status: 400 });
  }

  if ("work" in b) {
    if (b.work === null) data.work = null;
    else if (typeof b.work === "string") data.work = b.work.slice(0, MAX_LEN) || null;
    else return NextResponse.json({ error: "Invalid work" }, { status: 400 });
  }

  if ("avatarUrl" in b) {
    if (b.avatarUrl === null) data.avatarUrl = null;
    else if (typeof b.avatarUrl === "string") data.avatarUrl = b.avatarUrl.slice(0, MAX_LEN) || null;
    else return NextResponse.json({ error: "Invalid avatarUrl" }, { status: 400 });
  }

  if ("showTravelStamps" in b) {
    if (typeof b.showTravelStamps !== "boolean") {
      return NextResponse.json({ error: "Invalid showTravelStamps" }, { status: 400 });
    }
    data.showTravelStamps = b.showTravelStamps;
  }

  if ("profileAnswers" in b) {
    const parsed = asStringRecord(b.profileAnswers);
    if (parsed === null) {
      return NextResponse.json({ error: "Invalid profileAnswers" }, { status: 400 });
    }
    data.profileAnswers = parsed as Prisma.InputJsonValue;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
