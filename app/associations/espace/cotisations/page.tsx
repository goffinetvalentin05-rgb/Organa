import { Wallet } from "lucide-react";
import AssociationsComingSoon from "@/components/associations/dashboard/AssociationsComingSoon";

export default function AssociationsCotisationsPage() {
  return (
    <AssociationsComingSoon
      title="Cotisations"
      description="Suivez les cotisations, relances et paiements de vos membres depuis un seul endroit."
      ctaLabel="Retour au tableau de bord"
      icon={<Wallet className="h-6 w-6" aria-hidden />}
    />
  );
}
