import type { Metadata } from "next";
import OurStoryPage from "@/components/landing/OurStoryPage";

export const metadata: Metadata = {
  title: "Notre histoire | Obillz",
  description:
    "Découvrez la naissance d’Obillz — une plateforme née pour simplifier la vie des bénévoles de clubs sportifs.",
};

export default function NotreHistoireRoute() {
  return <OurStoryPage />;
}
