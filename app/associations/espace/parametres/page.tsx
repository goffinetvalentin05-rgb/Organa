import { Settings } from "lucide-react";
import AssociationsComingSoon from "@/components/associations/dashboard/AssociationsComingSoon";

export default function AssociationsParametresPage() {
  return (
    <AssociationsComingSoon
      title="Paramètres"
      description="Complétez les informations de votre association, votre identité visuelle et vos préférences."
      ctaLabel="Retour au tableau de bord"
      icon={<Settings className="h-6 w-6" aria-hidden />}
    />
  );
}
