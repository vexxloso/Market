import Link from "next/link";
import { redirect } from "next/navigation";
import { getVerifiedSessionUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { BecomeHostClient } from "./become-host-client";

export default async function BecomeHostPage() {
  const session = await getVerifiedSessionUser();

  if (!session) {
    redirect("/?auth=signup");
  }

  if (session.role === UserRole.HOST || session.role === UserRole.ADMIN) {
    redirect("/host/new");
  }

  return (
    <main className="container max-w-lg py-12">
      <h1 className="text-2xl font-semibold">Become a host</h1>
      <p className="muted mt-2 text-sm">
        List your space with details guests expect: room type, amenities, safety, and
        languages you speak — similar to leading travel marketplaces.
      </p>
      <BecomeHostClient />
      <p className="muted mt-6 text-center text-xs">
        <Link href="/" className="underline">
          Back to home
        </Link>
      </p>
    </main>
  );
}
