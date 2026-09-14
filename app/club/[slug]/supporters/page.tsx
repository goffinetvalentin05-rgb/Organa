import PublicSupportersPageClient from "@/components/supporters/public/PublicSupportersPageClient";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Supporters" };
}

export default async function ClubSupportersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicSupportersPageClient slug={slug} />;
}
