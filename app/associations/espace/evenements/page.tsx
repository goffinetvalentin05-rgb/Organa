import { Calendar } from "lucide-react";
import AssociationsComingSoon from "@/components/associations/dashboard/AssociationsComingSoon";

export default function AssociationsEvenementsPage() {
  return (
    <AssociationsComingSoon
      title="Événements"
      description="Organisez vos activités, inscriptions et moments forts de la vie associative."
      ctaLabel="Retour au tableau de bord"
      icon={<Calendar className="h-6 w-6" aria-hidden />}
    />
  );
}
