import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import {
  normalizeProfileAnswers,
  PROFILE_GRID_LEFT,
  PROFILE_GRID_RIGHT,
  PROFILE_PROMPTS,
} from "@/lib/profile-shared";
import { PROMPT_ICONS as PROMPT_ICONS_INTERNAL } from "@/components/profile-airbnb-icons";
import { UserRole as PrismaUserRole } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

function roleLabel(role: PrismaUserRole) {
  if (role === PrismaUserRole.HOST || role === PrismaUserRole.ADMIN) return "Host";
  return "Guest";
}

function profileInitial(name: string | null | undefined, email: string) {
  const base = (name?.trim() || email).charAt(0);
  return base ? base.toUpperCase() : "?";
}

function PromptRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[#EBEBEB] py-5 first:pt-0">
      <span className="mt-0.5 text-neutral-800">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#717171]">{label}</p>
        <p className="mt-1 truncate text-sm text-neutral-900">{value.trim()}</p>
      </div>
    </div>
  );
}

export default async function PublicProfilePage({ params }: Params) {
  const { id: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      bio: true,
      work: true,
      profileAnswers: true,
    },
  });

  if (!user) notFound();

  const profileAnswers = normalizeProfileAnswers(user.profileAnswers);

  const typedRole = user.role as PrismaUserRole;

  return (
    <main className="min-h-[60vh] w-full">
      <div className="w-full bg-white px-6 py-8 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Profile
          </h1>
          <Link
            href="/"
            className="rounded-full bg-[#F0F0F0] px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-[#E4E4E4]"
          >
            Back to home
          </Link>
        </div>

        <div className="mt-10 flex flex-col gap-10 sm:flex-row sm:items-start sm:gap-14">
          <div className="flex justify-center sm:justify-start">
            <div className="w-full max-w-[280px] rounded-[24px] bg-white px-10 py-9 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="mx-auto h-28 w-28 rounded-full border border-[#EBEBEB] object-cover"
                />
              ) : (
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-[var(--brand-soft-border-light)] bg-[var(--brand-soft)] text-3xl font-semibold text-[var(--brand)]">
                  {profileInitial(user.name, user.email)}
                </div>
              )}

              <p className="mt-5 text-xl font-semibold text-black">
                {user.name?.trim() || user.email.split("@")[0]}
              </p>
              <p className="mt-1 text-sm text-[#717171]">
                {roleLabel(typedRole)}
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-6 pt-1">
            <div className="flex items-start gap-3 text-base text-neutral-900">
              <span className="mt-0.5 text-neutral-800">•</span>
              <p>
                <span className="font-medium">My work: </span>
                <span className={user.work?.trim() ? "" : "text-[#717171]"}>
                  {user.work?.trim() || "Add what you do"}
                </span>
              </p>
            </div>
            {user.bio?.trim() ? (
              <p className="max-w-xl text-[15px] leading-relaxed text-neutral-800">
                {user.bio.trim()}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-10 grid gap-0 md:grid-cols-2 md:gap-x-12">
          <div>
            {PROFILE_GRID_LEFT.filter((key) => (profileAnswers[key] ?? "").trim()).map((key) => (
              <PromptRow
                key={key}
                icon={PROMPT_ICONS_INTERNAL[key]({ className: "h-5 w-5" })}
                label={PROFILE_PROMPTS[key]}
                value={profileAnswers[key] ?? ""}
              />
            ))}
          </div>
          <div>
            {PROFILE_GRID_RIGHT.filter((key) => (profileAnswers[key] ?? "").trim()).map((key) => (
              <PromptRow
                key={key}
                icon={PROMPT_ICONS_INTERNAL[key]({ className: "h-5 w-5" })}
                label={PROFILE_PROMPTS[key]}
                value={profileAnswers[key] ?? ""}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

