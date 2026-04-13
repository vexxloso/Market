import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy URL: email links and bookmarks redirect to the main confirmation page. */
export default async function VerifyEmailRedirect({ searchParams }: Props) {
  const sp = await searchParams;
  const q = new URLSearchParams();

  const pick = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const verified = pick(sp.verified);
  const error = pick(sp.error);
  const email = pick(sp.email);

  if (verified) q.set("verified", verified);
  if (error) q.set("error", error);
  if (email) q.set("email", email);

  const suffix = q.toString();
  redirect(suffix ? `/confirm-email?${suffix}` : "/confirm-email");
}
