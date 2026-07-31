import { Megaphone } from "lucide-react";
import AssociationsComingSoon from "@/components/associations/dashboard/AssociationsComingSoon";

export default function AssociationsCommunicationPage() {
  return (
    <AssociationsComingSoon
      title="Communication"
      description="Diffusez des annonces et gardez le contact avec vos membres et votre comité."
      ctaLabel="Retour au tableau de bord"
      icon={<Megaphone className="h-6 w-6" aria-hidden />}
    />
  );
}
