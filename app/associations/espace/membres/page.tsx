import { Users } from "lucide-react";
import AssociationsComingSoon from "@/components/associations/dashboard/AssociationsComingSoon";

export default function AssociationsMembresPage() {
  return (
    <AssociationsComingSoon
      title="Membres"
      description="Gérez l’annuaire de votre association, les fiches adhérents et les rôles du comité."
      ctaLabel="Retour au tableau de bord"
      icon={<Users className="h-6 w-6" aria-hidden />}
    />
  );
}
