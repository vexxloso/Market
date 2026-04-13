"use client";

import { UserRole } from "@prisma/client";
import { withBasePath } from "@/lib/app-origin";
import { PASSWORD_MIN_LENGTH } from "@/lib/password";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import {
  IconBriefcase,
  IconCamera,
  IconChevronRight,
  PROMPT_ICONS,
} from "@/components/profile-airbnb-icons";
import {
  PROFILE_GRID_LEFT,
  PROFILE_GRID_RIGHT,
  PROFILE_PROMPTS,
  type ProfilePromptKey,
} from "@/lib/profile-shared";

const LINK_BLUE = "text-[#0072c6]";

export type ProfileEditInitial = {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  work: string | null;
  role: UserRole;
  profileAnswers: Record<ProfilePromptKey, string>;
};

function displayInitial(name: string | null | undefined, email: string) {
  const base = (name?.trim() || email).charAt(0);
  return base ? base.toUpperCase() : "?";
}

function ProfileFieldRow({
  icon,
  label,
  value,
  onChange,
  showChevron,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  showChevron?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-[#EBEBEB] py-5 first:pt-0">
      <span className="mt-0.5 text-neutral-800">{icon}</span>
      <div className="min-w-0 flex-1">
        <label className="block text-xs font-medium text-[#717171]">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Add ${label.toLowerCase()}`}
          className="mt-1 w-full border-0 bg-transparent p-0 text-base text-neutral-900 outline-none placeholder:text-neutral-400"
        />
      </div>
      {showChevron ? (
        <IconChevronRight className="mt-1 h-5 w-5 shrink-0 text-neutral-400" />
      ) : null}
    </div>
  );
}

export function ProfileEditClient({ initialUser }: { initialUser: ProfileEditInitial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwNext2, setPwNext2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState(false);

  const [name, setName] = useState(initialUser.name ?? "");
  const [bio, setBio] = useState(initialUser.bio ?? "");
  const [work, setWork] = useState(initialUser.work ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialUser.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [answers, setAnswers] = useState<Record<ProfilePromptKey, string>>({
    ...initialUser.profileAnswers,
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const patchAnswer = (key: ProfilePromptKey, v: string) => {
    setAnswers((a) => ({ ...a, [key]: v }));
  };

  async function uploadAvatar(file: File) {
    setError(null);
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch(withBasePath("/api/uploads/avatar"), {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Avatar upload failed.");
        return;
      }
      const url = data.url as string | undefined;
      if (!url) {
        setError("Avatar upload failed.");
        return;
      }

      setAvatarUrl(url);
      // Save immediately so the profile view updates without requiring a separate Save action.
      const patchRes = await fetch(withBasePath("/api/profile"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!patchRes.ok) {
        const patchData = await patchRes.json().catch(() => ({}));
        setError(
          typeof (patchData as { error?: string }).error === "string"
            ? (patchData as { error: string }).error
            : "Could not save avatar.",
        );
      }
    } catch {
      setError("Network error while uploading avatar.");
    } finally {
      setAvatarUploading(false);
    }
  }

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const res = await fetch(withBasePath("/api/profile"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || null,
            bio: bio || null,
            work: work || null,
            avatarUrl,
            profileAnswers: answers,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Save failed");
          return;
        }
        setSaved(true);
        router.push("/profile?tab=listings");
        router.refresh();
      } catch {
        setError("Network error");
      }
    });
  };

  const initialChar = displayInitial(initialUser.name, initialUser.email);

  async function changePassword() {
    setPwError(null);
    setPwOk(false);
    if (!pwCurrent) {
      setPwError("Enter your current password.");
      return;
    }
    if (pwNext.length < PASSWORD_MIN_LENGTH) {
      setPwError(`New password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (pwNext !== pwNext2) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwBusy(true);
    try {
      const res = await fetch(withBasePath("/api/auth/change-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNext }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwError(
          typeof (data as { error?: string }).error === "string"
            ? (data as { error: string }).error
            : "Could not change password.",
        );
        return;
      }
      setPwOk(true);
      setPwCurrent("");
      setPwNext("");
      setPwNext2("");
    } catch {
      setPwError("Network error while changing password.");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="container max-w-5xl pb-20 pt-10">
      <div className="flex flex-col gap-12 lg:flex-row lg:gap-20">
        <div className="flex shrink-0 justify-center lg:justify-start">
          <div className="relative h-56 w-56">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full rounded-full border border-[#EBEBEB] object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-700 text-6xl font-normal text-white">
                {initialChar}
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-neutral-50"
            >
              <IconCamera className="h-4 w-4" />
              {avatarUploading ? "Uploading..." : "Add"}
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void uploadAvatar(f);
                // Allow selecting the same file again.
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-10">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              My profile
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#717171]">
              Hosts and guests can see your profile and it may appear across Noire Haven to help us
              build trust in our community.{" "}
              <button type="button" className={`${LINK_BLUE} underline`}>
                Learn more
              </button>
            </p>
          </header>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">About me</h2>
            <div className="mt-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-white px-4 py-4 sm:px-5 sm:py-5">
              <textarea
                ref={bioRef}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something fun and punchy."
                rows={5}
                className="w-full resize-none border-0 bg-transparent text-base text-neutral-900 outline-none placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => bioRef.current?.focus()}
                className={`${LINK_BLUE} mt-1 text-sm font-semibold hover:underline`}
              >
                Add intro
              </button>
            </div>
          </section>

          <section className="border-t border-[#EBEBEB] pt-10">
            <div className="grid gap-0 md:grid-cols-2 md:gap-x-12">
              <div>
                <ProfileFieldRow
                  icon={<IconBriefcase className="h-6 w-6" />}
                  label="My work"
                  value={work}
                  onChange={setWork}
                  showChevron
                />
                {PROFILE_GRID_LEFT.map((key) => (
                  <ProfileFieldRow
                    key={key}
                    icon={PROMPT_ICONS[key]({ className: "h-6 w-6" })}
                    label={PROFILE_PROMPTS[key]}
                    value={answers[key]}
                    onChange={(v) => patchAnswer(key, v)}
                  />
                ))}
              </div>
              <div>
                {PROFILE_GRID_RIGHT.map((key) => (
                  <ProfileFieldRow
                    key={key}
                    icon={PROMPT_ICONS[key]({ className: "h-6 w-6" })}
                    label={PROFILE_PROMPTS[key]}
                    value={answers[key]}
                    onChange={(v) => patchAnswer(key, v)}
                  />
                ))}
              </div>
            </div>
            <div className="mt-6 border-b border-[#EBEBEB] pb-5">
              <label className="block text-xs font-medium text-[#717171]">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full border-0 bg-transparent p-0 text-base text-neutral-900 outline-none"
              />
            </div>
          </section>

          <section className="border-t border-[#EBEBEB] pt-10">
            <h2 className="text-lg font-semibold text-neutral-900">Change password</h2>
            <p className="mt-2 text-sm text-[#717171]">
              For security, we’ll ask for your current password.
            </p>
            <div className="mt-4 space-y-3 rounded-2xl border border-[#EBEBEB] bg-white p-5">
              <input
                type="password"
                autoComplete="current-password"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                placeholder="Current password"
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              />
              <input
                type="password"
                autoComplete="new-password"
                value={pwNext}
                onChange={(e) => setPwNext(e.target.value)}
                placeholder={`New password (min. ${PASSWORD_MIN_LENGTH} characters)`}
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              />
              <input
                type="password"
                autoComplete="new-password"
                value={pwNext2}
                onChange={(e) => setPwNext2(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              />
              {pwError ? (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {pwError}
                </p>
              ) : null}
              {pwOk ? (
                <p className="text-sm font-medium text-green-700" role="status">
                  Password updated.
                </p>
              ) : null}
              <button
                type="button"
                disabled={pwBusy}
                onClick={() => void changePassword()}
                className="rounded-lg border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
              >
                {pwBusy ? "Updating…" : "Update password"}
              </button>
            </div>
          </section>

          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? <p className="text-sm font-medium text-green-700">Profile saved.</p> : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="brand-btn rounded-lg px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/profile?tab=listings")}
              className="rounded-lg border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
