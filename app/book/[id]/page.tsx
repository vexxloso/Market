import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function BookListingRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/listing/${id}`);
}
