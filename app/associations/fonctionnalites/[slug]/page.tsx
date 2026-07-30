import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AssociationFeaturePage from "@/components/associations/AssociationFeaturePage";
import { associationFeatures, getAssociationFeature } from "@/lib/associations";

export function generateStaticParams() {
  return associationFeatures.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const feature = getAssociationFeature(slug);

  if (!feature) return {};

  return {
    title: `${feature.title} | Obillz Associations`,
    description: feature.description,
  };
}

export default async function AssociationFeatureRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = getAssociationFeature(slug);

  if (!feature) notFound();

  return <AssociationFeaturePage feature={feature} />;
}
