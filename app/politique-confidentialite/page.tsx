import type { Metadata } from "next";
import {
  LegalEmailLink,
  LegalInlineLink,
  LegalSection,
} from "@/components/landing/LegalDocument";
import LegalPageLayout from "@/components/landing/LegalPageLayout";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Obillz",
  description:
    "Politique de confidentialité d’Obillz selon la Loi fédérale suisse sur la protection des données (LPD).",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPageLayout
      title="Politique de confidentialité"
      lastUpdated="11 septembre 2026"
    >
      <LegalSection title="Qui nous sommes">
        <p>
          Obillz est un service de gestion pour clubs sportifs, exploité par Valentin
          Goffinet. Cette politique décrit comment les données personnelles sont
          traitées lorsque vous utilisez le site et la plateforme Obillz.
        </p>
        <p>
          Contact : <LegalEmailLink />
          <br />
          Adresse postale : Les Courtats 7, 2942 Alle, Suisse
        </p>
      </LegalSection>

      <LegalSection title="Deux rôles distincts">
        <p>
          La Loi fédérale suisse sur la protection des données (LPD) distingue le
          responsable du traitement et le sous-traitant. Sur Obillz, deux situations
          coexistent.
        </p>
        <p>
          <strong>Obillz est responsable du traitement</strong> pour les données du
          compte utilisateur, de l’abonnement, du support, de la sécurité de la
          plateforme et des statistiques d’audience du site.
        </p>
        <p>
          <strong>Le club est responsable du traitement</strong> des données métier
          qu’il saisit ou collecte via Obillz (membres, cotisations, boutique,
          événements, bénévoles, communications, etc.). Dans ce cadre, Obillz agit
          comme <strong>sous-traitant</strong> du club. Un accord de sous-traitance
          (DPA) est disponible sur demande à <LegalEmailLink />.
        </p>
      </LegalSection>

      <LegalSection title="Données dont Obillz est responsable">
        <p>Lorsque vous créez un compte ou utilisez le service pour votre club :</p>
        <ul>
          <li>
            <strong>Compte utilisateur</strong> : identifiants, e-mail, nom affiché,
            rôle au sein du club, préférences de connexion (y compris
            authentification à plusieurs facteurs si activée).
          </li>
          <li>
            <strong>Abonnement</strong> : plan, statut de facturation, identifiants
            de paiement gérés par Stripe (Obillz ne stocke pas le numéro complet de
            carte).
          </li>
          <li>
            <strong>Support</strong> : contenu des demandes envoyées à{" "}
            <LegalEmailLink />.
          </li>
          <li>
            <strong>Sécurité</strong> : journaux techniques (horodatage, actions,
            parfois adresse IP) nécessaires pour détecter les abus, tracer les
            accès et protéger le service.
          </li>
          <li>
            <strong>Analytics</strong> : mesures d’audience via Vercel Analytics, sans
            cookie publicitaire. Les chemins d’URL contenant un jeton secret sont
            masqués avant envoi.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Données dont le club est responsable">
        <p>
          Le club décide quelles données il collecte et pour quelles finalités. Obillz
          les traite uniquement pour fournir le service. Cela peut inclure notamment :
        </p>
        <ul>
          <li>
            <strong>Membres</strong> : identité, coordonnées, éventuellement date de
            naissance et, seulement si le club active ce champ, numéro AVS.
          </li>
          <li>
            <strong>Cotisations et factures</strong> : montants, statuts de paiement,
            documents.
          </li>
          <li>
            <strong>Boutique</strong> : commandes, produits, coordonnées de
            livraison/facturation saisies par le club ou ses clients.
          </li>
          <li>
            <strong>Événements, planning, buvette</strong> : inscriptions,
            affectations, demandes de réservation.
          </li>
          <li>
            <strong>Bénévoles et communications</strong> : contacts marketing
            uniquement en cas d’opt-in (formulaire public) ou de déclaration
            explicite du staff.
          </li>
        </ul>
        <p>
          Le club est responsable de la licéité de ses collectes, de ses imports et
          de ses envois d’e-mails.
        </p>
      </LegalSection>

      <LegalSection title="Finalités et bases">
        <p>
          Obillz traite les données du compte et de la plateforme pour exécuter le
          contrat de service, sécuriser l’accès, facturer l’abonnement, fournir le
          support et améliorer le produit. Les traitements du club reposent sur les
          bases que le club détermine (contrat d’affiliation, obligation légale,
          intérêt prépondérant ou consentement, selon le cas).
        </p>
      </LegalSection>

      <LegalSection title="Sous-traitants et traitements internationaux">
        <p>
          Obillz recourt à des prestataires pour héberger et faire fonctionner le
          service, notamment Supabase (base de données et stockage), Vercel
          (hébergement de l’application et analytics), Stripe (paiements) et Resend
          (e-mails).
        </p>
        <p>
          La base de données principale Supabase est configurée, selon
          l’indication actuelle du propriétaire, en Suisse. Cette localisation doit
          être vérifiée et documentée (preuve de région du projet). D’autres
          prestataires peuvent traiter des données en Suisse, dans l’EEE ou dans
          d’autres pays. Obillz ne prétend pas que toutes les données restent en
          Suisse.
        </p>
      </LegalSection>

      <LegalSection title="Conservation">
        <p>
          Les données de compte sont conservées pendant la relation contractuelle,
          puis selon les durées nécessaires aux obligations légales (notamment
          comptables). Les données métier du club suivent la politique de
          conservation du club, dans les limites techniques du service. Les données
          comptables ne sont pas effacées automatiquement par Obillz.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Obillz applique des mesures techniques et organisationnelles visant à
          respecter les exigences applicables de la Loi fédérale suisse sur la
          protection des données (LPD) : isolation des clubs, contrôles d’accès et
          politiques RLS, chiffrement en transit, journaux d’audit, possibilité de
          MFA. Ces mesures réduisent les risques ; elles ne constituent pas une
          certification.
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Selon la LPD, vous pouvez demander l’accès, la rectification, la
          suppression ou la remise de vos données, ainsi que vous opposer à
          certaines communications. Pour un compte Obillz ou une question
          plateforme : <LegalEmailLink />.
        </p>
        <p>
          Pour des données de membre, de cotisation ou d’événement gérées par un
          club, adressez-vous d’abord au club, qui est responsable du traitement.
          Obillz peut assister le club. Vous pouvez aussi vous adresser au Préposé
          fédéral à la protection des données et à la transparence (PFPDT).
        </p>
      </LegalSection>

      <LegalSection title="Pages associées">
        <p>
          <LegalInlineLink href="/securite-protection-donnees">
            Sécurité et protection des données
          </LegalInlineLink>
          {" · "}
          <LegalInlineLink href="/mentions-legales">Mentions légales</LegalInlineLink>
          {" · "}
          <LegalInlineLink href="/conditions-utilisation">
            Conditions d’utilisation
          </LegalInlineLink>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
