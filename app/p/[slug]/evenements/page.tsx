import { notFound } from "next/navigation";
import PublicClubEventsClient from "@/components/public/PublicClubEventsClient";
import { getPublicClubBySlug } from "@/lib/public-page/resolve";

export default async function PublicClubEventsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getPublicClubBySlug(slug);

  if (!club) {
    notFound();
  }

  return (
    <PublicClubEventsClient
      slug={slug}
      clubTitle={club.title}
      primaryColor={club.primaryColor}
    />
  );
}
