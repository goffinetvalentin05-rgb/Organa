import type { Metadata } from "next";
import {
  LegalEmailLink,
  LegalInlineLink,
  LegalSection,
} from "@/components/landing/LegalDocument";
import LegalPageLayout from "@/components/landing/LegalPageLayout";

export const metadata: Metadata = {
  title: "Conditions d'utilisation | Obillz",
  description: "Conditions générales d'utilisation du service Obillz (droit suisse).",
};

export default function ConditionsUtilisationPage() {
  return (
    <LegalPageLayout title="Conditions d'utilisation" lastUpdated="11 septembre 2026">
      <LegalSection title="Objet">
        <p>
          Les présentes conditions régissent l’accès et l’utilisation du service
          Obillz, exploité par Valentin Goffinet, destiné aux clubs sportifs pour la
          gestion de leurs membres, cotisations, événements, plannings et finances.
        </p>
      </LegalSection>

      <LegalSection title="Création de compte">
        <p>
          L’utilisateur est responsable de l’exactitude des informations fournies, de
          la confidentialité de ses identifiants et de toute activité effectuée via
          son compte.
        </p>
      </LegalSection>

      <LegalSection title="Utilisation acceptable">
        <p>
          L’utilisateur s’engage à utiliser Obillz de manière conforme au droit suisse
          et aux lois applicables, sans tentative d’accès non autorisé, de
          perturbation du service ou d’usage frauduleux. Le club est responsable de
          la licéité de ses imports de données et de ses communications (y compris
          marketing).
        </p>
      </LegalSection>

      <LegalSection title="Abonnements et paiements">
        <p>
          Certains plans sont payants. Les tarifs, modalités de paiement et
          conditions de facturation sont indiqués lors de la souscription. En cas de
          non-paiement, l’accès au service peut être suspendu après notification
          raisonnable. Les paiements sont traités par Stripe.
        </p>
      </LegalSection>

      <LegalSection title="Données et confidentialité">
        <p>
          Les données saisies par le club (membres, cotisations, événements, etc.)
          restent sous sa responsabilité. Obillz les traite en qualité de
          sous-traitant pour fournir le service, conformément à la{" "}
          <LegalInlineLink href="/politique-confidentialite">
            politique de confidentialité
          </LegalInlineLink>{" "}
          et à l’accord de sous-traitance disponible sur demande.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Obillz et ses contenus (logiciel, interfaces, logos, éléments graphiques)
          sont protégés. L’utilisateur ne bénéficie d’aucun droit de propriété autre
          qu’un droit d’usage limité au cadre du service.
        </p>
      </LegalSection>

      <LegalSection title="Disponibilité et support">
        <p>
          Obillz vise une haute disponibilité, sans garantie d’absence
          d’interruption. Le support est fourni par email à <LegalEmailLink />.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>
          Obillz ne peut être tenu responsable des dommages indirects (perte de
          données non sauvegardées, interruption d’activité), sous réserve des
          limitations prévues par le droit suisse. La responsabilité pour faute
          intentionnelle ou négligence grave n’est pas exclue.
        </p>
      </LegalSection>

      <LegalSection title="Résiliation">
        <p>
          L’utilisateur peut résilier son compte à tout moment. Obillz peut résilier
          en cas de violation manifeste des conditions, avec notification préalable
          dans la mesure du possible. En fin de contrat, le club peut demander la
          restitution ou la suppression de ses données, sous réserve des obligations
          de conservation légales.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Les présentes conditions sont régies par le droit suisse. Sous réserve des
          règles impératives applicables, les tribunaux du for du domicile de
          l’exploitant sont compétents.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
