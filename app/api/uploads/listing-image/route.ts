import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getVerifiedSessionUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const session = await getVerifiedSessionUser();
  if (
    !session ||
    (session.role !== UserRole.HOST && session.role !== UserRole.ADMIN)
  ) {
    return NextResponse.json({ error: "Host login required." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use JPEG, PNG, or WebP." },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)." }, { status: 400 });
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "listings");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  await writeFile(filePath, buf);

  const url = `/uploads/listings/${fileName}`;
  return NextResponse.json({ url });
}
