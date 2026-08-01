import type { Metadata } from "next";
import AssociationsLanding from "@/components/associations/AssociationsLanding";

export const metadata: Metadata = {
  title: "Obillz Associations — Gérez votre association sans perdre vos soirées",
  description:
    "Membres, cotisations, événements, documents et communication réunis dans un outil pensé pour les associations et leurs bénévoles.",
};

type AssociationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function AssociationsPage({ searchParams }: AssociationsPageProps) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const raw = params?.comingSoon;
  const showComingSoonNotice =
    raw === "1" || raw === "true" || (Array.isArray(raw) && (raw[0] === "1" || raw[0] === "true"));

  return <AssociationsLanding showComingSoonNotice={showComingSoonNotice} />;
}
