import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Obillz — Gérez votre club sportif sans perdre vos soirées",
  description:
    "Factures, membres, cotisations, événements et paiements réunis dans un seul logiciel pensé pour les clubs sportifs. Testez Obillz gratuitement.",
};

export default function Home() {
  return <LandingPage />;
}
