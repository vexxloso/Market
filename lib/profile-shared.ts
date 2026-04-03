import type { Prisma } from "@prisma/client";

/** Airbnb-style extra prompts stored on `User.profileAnswers` */
export const PROFILE_PROMPTS = {
  uselessSkill: "My most useless skill",
  decadeBorn: "Decade I was born",
  funFact: "My fun fact",
  favoriteSong: "My favorite song in high school",
  obsessedWith: "I'm obsessed with",
  whereILive: "Where I live",
  whereIveWantedToGo: "Where I've always wanted to go",
  pets: "Pets",
  school: "Where I went to school",
  spendTooMuchTime: "I spend too much time",
  languages: "Languages I speak",
  biographyTitle: "My biography title would be",
} as const;

export type ProfilePromptKey = keyof typeof PROFILE_PROMPTS;

export const PROFILE_GRID_LEFT: ProfilePromptKey[] = [
  "uselessSkill",
  "decadeBorn",
  "funFact",
  "favoriteSong",
  "obsessedWith",
  "whereILive",
];

export const PROFILE_GRID_RIGHT: ProfilePromptKey[] = [
  "whereIveWantedToGo",
  "pets",
  "school",
  "spendTooMuchTime",
  "languages",
  "biographyTitle",
];

export function normalizeProfileAnswers(
  raw: Prisma.JsonValue | null | undefined,
): Record<ProfilePromptKey, string> {
  const empty = Object.fromEntries(
    Object.keys(PROFILE_PROMPTS).map((k) => [k, ""]),
  ) as Record<ProfilePromptKey, string>;

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty;

  for (const key of Object.keys(PROFILE_PROMPTS) as ProfilePromptKey[]) {
    const v = (raw as Record<string, unknown>)[key];
    if (typeof v === "string") empty[key] = v;
  }
  return empty;
}
