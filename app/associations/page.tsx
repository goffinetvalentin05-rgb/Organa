import type { Metadata } from "next";
import AssociationsLanding from "@/components/associations/AssociationsLanding";

export const metadata: Metadata = {
  title: "Obillz Associations — Gérez votre association sans perdre vos soirées",
  description:
    "Membres, cotisations, événements, documents et communication réunis dans un outil pensé pour les associations et leurs bénévoles.",
};

export default function AssociationsPage() {
  return <AssociationsLanding />;
}
