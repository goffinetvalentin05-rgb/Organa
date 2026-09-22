import type { Metadata } from "next";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import TimeSimulator from "@/components/landing/TimeSimulator";
import { obillzLandingHomeClass } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "Temps récupéré — Obillz",
  description: "Une estimation basée sur les tâches réellement gérées par votre club.",
};

export default function TimeSimulatorPage() {
  return (
    <main className={obillzLandingHomeClass}>
      <LandingNav />
      <TimeSimulator />
      <LandingFooter />
    </main>
  );
}
