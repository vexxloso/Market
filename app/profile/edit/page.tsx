import Link from "next/link";
import { redirect } from "next/navigation";
import { getVerifiedSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeProfileAnswers } from "@/lib/profile-shared";
import { ProfileEditClient, type ProfileEditInitial } from "./profile-edit-client";

export default async function ProfileEditPage() {
  const session = await getVerifiedSessionUser();
  if (!session) {
    redirect("/?auth=login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      name: true,
      email: true,
      avatarUrl: true,
      bio: true,
      work: true,
      profileAnswers: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/?auth=login");
  }

  const initialUser: ProfileEditInitial = {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    work: user.work,
    role: user.role,
    profileAnswers: normalizeProfileAnswers(user.profileAnswers),
  };

  return (
    <main className="min-h-[60vh] bg-white">
      <div className="border-b border-[var(--border)] bg-white">
        <div className="container flex h-14 items-center">
          <Link
            href="/profile?tab=profile"
            className="text-sm font-semibold text-neutral-900 hover:underline"
          >
            ← Back to profile
          </Link>
        </div>
      </div>
      <ProfileEditClient initialUser={initialUser} />
    </main>
  );
}
