import { redirect } from "next/navigation";

export default function HostListingsRedirectPage() {
  redirect("/profile?tab=listings");
}
