import type { Metadata } from "next";
import PricingPage from "@/components/landing/PricingPage";

export const metadata: Metadata = {
  title: "Tarifs | Obillz",
  description:
    "Une formule simple pour gérer votre club sportif : membres, cotisations, factures, événements et plus — sans modules bloqués ni frais cachés.",
};

export default function TarifsPage() {
  return <PricingPage />;
}
