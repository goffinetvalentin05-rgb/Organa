import { Landmark } from "lucide-react";
import AssociationsComingSoon from "@/components/associations/dashboard/AssociationsComingSoon";

export default function AssociationsFinancesPage() {
  return (
    <AssociationsComingSoon
      title="Finances"
      description="Visualisez revenus, dépenses et équilibre financier de votre association."
      ctaLabel="Retour au tableau de bord"
      icon={<Landmark className="h-6 w-6" aria-hidden />}
    />
  );
}
