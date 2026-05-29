import { notFound } from "next/navigation";
import ClubPublicPage from "@/components/public/ClubPublicPage";
import PublicPlanningPageClient from "@/components/public/PublicPlanningPageClient";
import { resolvePublicSlug } from "@/lib/public-page/resolve";

export default async function PublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolution = await resolvePublicSlug(slug);

  if (resolution.type === "club") {
    return <ClubPublicPage initialData={resolution.data} />;
  }

  if (resolution.type === "planning") {
    return <PublicPlanningPageClient slug={slug} />;
  }

  notFound();
}
