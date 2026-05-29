import type { Metadata } from "next";
import {
  LegalDocument,
  LegalEmailLink,
  LegalSection,
} from "@/components/landing/LegalDocument";
import LegalPageShell from "@/components/landing/LegalPageShell";

export const metadata: Metadata = {
  title: "Conditions d'utilisation | Obillz",
  description: "Conditions générales d'utilisation du service Obillz.",
};

export default function ConditionsUtilisationPage() {
  return (
    <LegalPageShell>
      <LegalDocument title="Conditions d'utilisation" updatedAt="6 février 2026">
        <LegalSection title="Objet">
          <p>
            Les présentes conditions régissent l&apos;accès et l&apos;utilisation du service
            Obillz, destiné aux clubs sportifs pour la gestion de leurs membres, cotisations,
            événements, plannings et finances.
          </p>
        </LegalSection>

        <LegalSection title="Création de compte">
          <p>
            L&apos;utilisateur est responsable de l&apos;exactitude des informations fournies, de la
            confidentialité de ses identifiants et de toute activité effectuée via son compte.
          </p>
        </LegalSection>

        <LegalSection title="Utilisation acceptable">
          <p>
            L&apos;utilisateur s&apos;engage à utiliser Obillz de manière conforme aux lois
            applicables, sans tentative d&apos;accès non autorisé, de perturbation du service ou
            d&apos;usage frauduleux.
          </p>
        </LegalSection>

        <LegalSection title="Abonnements et paiements">
          <p>
            Certains plans sont payants. Les tarifs, modalités de paiement et conditions de
            facturation sont indiqués lors de la souscription. En cas de non-paiement, l&apos;accès
            au service peut être suspendu après notification raisonnable.
          </p>
        </LegalSection>

        <LegalSection title="Données et confidentialité">
          <p>
            Les données saisies par l&apos;utilisateur (informations du club, membres, cotisations,
            etc.) restent sa propriété. Obillz traite ces données uniquement pour fournir le service,
            conformément à la politique de confidentialité.
          </p>
        </LegalSection>

        <LegalSection title="Propriété intellectuelle">
          <p>
            Obillz et ses contenus (logiciel, interfaces, logos, éléments graphiques) sont protégés.
            L&apos;utilisateur ne bénéficie d&apos;aucun droit de propriété autre qu&apos;un droit
            d&apos;usage limité au cadre du service.
          </p>
        </LegalSection>

        <LegalSection title="Disponibilité et support">
          <p>
            Obillz vise une haute disponibilité, sans garantie d&apos;absence d&apos;interruption.
            Le support est fourni par email à <LegalEmailLink />.
          </p>
        </LegalSection>

        <LegalSection title="Responsabilité">
          <p>
            Obillz ne peut être tenu responsable des dommages indirects (perte de données non
            sauvegardées, interruption d&apos;activité), sous réserve des limitations prévues par la
            loi. La responsabilité pour faute intentionnelle ou négligence grave n&apos;est pas
            exclue.
          </p>
        </LegalSection>

        <LegalSection title="Résiliation">
          <p>
            L&apos;utilisateur peut résilier son compte à tout moment. Obillz peut résilier en cas
            de violation manifeste des conditions, avec notification préalable dans la mesure du
            possible.
          </p>
        </LegalSection>

        <LegalSection title="Droit applicable">
          <p>
            Les présentes conditions sont régies par le droit français. Sous réserve des règles
            impératives applicables, les tribunaux compétents du siège de l&apos;éditeur sont seuls
            compétents.
          </p>
        </LegalSection>
      </LegalDocument>
    </LegalPageShell>
  );
}
