import { FileText } from "lucide-react";
import AssociationsComingSoon from "@/components/associations/dashboard/AssociationsComingSoon";

export default function AssociationsDocumentsPage() {
  return (
    <AssociationsComingSoon
      title="Documents"
      description="Centralisez PV, statuts, archives et fichiers partagés de votre association."
      ctaLabel="Retour au tableau de bord"
      icon={<FileText className="h-6 w-6" aria-hidden />}
    />
  );
}
