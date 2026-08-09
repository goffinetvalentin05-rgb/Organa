import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SportFeaturePage from "@/components/landing/SportFeaturePage";
import { getSportFeature, sportFeatures } from "@/lib/sport-features";

export function generateStaticParams() {
  return sportFeatures.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const feature = getSportFeature(slug);

  if (!feature) return {};

  return {
    title: `${feature.title} | Obillz Sport`,
    description: feature.description,
  };
}

export default async function SportFeatureRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = getSportFeature(slug);

  if (!feature) notFound();

  return <SportFeaturePage feature={feature} />;
}
