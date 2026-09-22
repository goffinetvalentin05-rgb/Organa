import type { Metadata } from "next";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import RevenueSimulator from "@/components/landing/RevenueSimulator";
import { obillzLandingHomeClass } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Revenus potentiels — Obillz",
  description: "Construisez votre projection à partir des outils que votre club souhaite utiliser.",
};

export default function RevenueSimulatorPage() {
  return (
    <main className={obillzLandingHomeClass}>
      <LandingNav />
      <RevenueSimulator />
      <LandingFooter />
    </main>
  );
}
