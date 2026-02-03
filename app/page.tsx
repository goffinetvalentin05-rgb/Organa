import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Obillz — Logiciel de gestion pour les clubs sportifs",
  description:
    "Obillz centralise joueurs, membres, cotisations, manifestations, calendriers, dépenses, recettes et la communication par e-mail. Un seul outil pour votre club.",
};

export default function Home() {
  return <LandingPage />;
}
