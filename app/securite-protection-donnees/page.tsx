import type { Metadata } from "next";
import {
  LegalEmailLink,
  LegalInlineLink,
  LegalSection,
} from "@/components/landing/LegalDocument";
import LegalPageLayout from "@/components/landing/LegalPageLayout";

export const metadata: Metadata = {
  title: "Sécurité et protection des données | Obillz",
  description:
    "Comment Obillz protège les données des clubs : isolation, permissions, MFA et LPD.",
};

export default function SecuriteProtectionDonneesPage() {
  return (
    <LegalPageLayout
      title="Sécurité et protection des données"
      lastUpdated="11 septembre 2026"
      eyebrow="CONFIANCE"
    >
      <LegalSection title="Notre approche">
        <p>
          Obillz applique des mesures techniques et organisationnelles visant à
          respecter les exigences applicables de la Loi fédérale suisse sur la
          protection des données (LPD).
        </p>
        <p>
          Ces mesures visent à protéger les comptes, isoler les clubs et limiter
          l’accès aux données. Elles ne constituent pas une certification LPD et
          n’impliquent pas que toutes les données restent en Suisse.
        </p>
      </LegalSection>

      <LegalSection title="Isolation des clubs">
        <p>
          Chaque club dispose de son propre espace. Les données métier (membres,
          cotisations, événements, boutique, etc.) sont rattachées à un club et ne
          sont pas mélangées avec celles d’un autre club dans le fonctionnement
          normal du produit.
        </p>
      </LegalSection>

      <LegalSection title="Permissions et RLS">
        <p>
          L’accès au tableau de bord repose sur des rôles et des permissions
          (propriétaire, admin, comité, membre). Côté base de données, des
          politiques Row Level Security (RLS) restreignent ce qu’un utilisateur
          authentifié peut lire ou modifier. Les opérations sensibles passent par
          des API contrôlées.
        </p>
      </LegalSection>

      <LegalSection title="Authentification à plusieurs facteurs (MFA)">
        <p>
          Les comptes peuvent activer une authentification à plusieurs facteurs
          afin de réduire le risque d’accès non autorisé, y compris si un mot de
          passe est compromis.
        </p>
      </LegalSection>

      <LegalSection title="Données sensibles">
        <p>
          Certaines informations (numéro AVS, IBAN, jetons d’accès) sont traitées
          avec des précautions supplémentaires : le champ AVS est désactivé par
          défaut et facultatif ; les jetons présents dans les URL publiques ne
          sont pas envoyés tels quels à l’outil d’analytics ; les brouillons
          locaux n’enregistrent pas l’AVS ni l’IBAN.
        </p>
      </LegalSection>

      <LegalSection title="Hébergement et prestataires">
        <p>
          La base de données principale Supabase est indiquée, selon la
          configuration actuelle, comme située en Suisse. Il convient de conserver
          une preuve de la région réelle du projet. L’application est servie par
          Vercel ; les paiements passent par Stripe ; les e-mails par Resend.
          Certains de ces prestataires peuvent traiter des données à l’étranger.
        </p>
      </LegalSection>

      <LegalSection title="Droits des personnes">
        <p>
          Pour exercer un droit d’accès, de rectification, de suppression ou
          d’opposition (y compris marketing), contactez <LegalEmailLink />. Si la
          demande concerne les données d’un club, le club est le responsable du
          traitement ; Obillz l’assiste.
        </p>
      </LegalSection>

      <LegalSection title="Accord de sous-traitance">
        <p>
          L’
          <LegalInlineLink href="/accord-traitement-donnees">
            Accord de traitement des données (DPA)
          </LegalInlineLink>{" "}
          décrit le rôle d’Obillz vis-à-vis des clubs. Pour les nouveaux clubs, il
          fait partie du contrat et est accepté à l’inscription. Voir aussi la{" "}
          <LegalInlineLink href="/politique-confidentialite">
            politique de confidentialité
          </LegalInlineLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions relatives à la sécurité ou à la protection des données :{" "}
          <LegalEmailLink />.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
