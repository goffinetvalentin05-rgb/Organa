import type { Metadata } from "next";
import {
  LegalEmailLink,
  LegalInlineLink,
  LegalSection,
} from "@/components/landing/LegalDocument";
import LegalPageLayout from "@/components/landing/LegalPageLayout";

export const metadata: Metadata = {
  title: "Accord de traitement des données (DPA) | Obillz",
  description:
    "Accord de sous-traitance entre Obillz et le club pour le traitement des données métier (LPD).",
};

export default function AccordTraitementDonneesPage() {
  return (
    <LegalPageLayout
      title="Accord de traitement des données (DPA)"
      lastUpdated="septembre 2026"
      eyebrow="DOCUMENT CONTRACTUEL"
    >
      <LegalSection title="Parties et versions">
        <p>
          Version <strong>2026-09</strong>. Ce document forme partie du contrat
          entre Obillz et le club pour les comptes créés après sa mise en
          production. L’acceptation est enregistrée électroniquement à
          l’inscription (versions CGU et DPA, horodatage). Les clubs déjà
          existants à cette date ne sont pas soumis à ce flux d’acceptation et
          n’ont pas fait l’objet d’une acceptation rétroactive.
        </p>
        <p>
          Entre le <strong>Club</strong> (client du service Obillz),{" "}
          <strong>responsable du traitement</strong> des données métier qu’il
          saisit ou collecte via le service, et <strong>Obillz</strong>, service
          exploité par <strong>Valentin Goffinet</strong>,{" "}
          <strong>sous-traitant</strong>.
        </p>
        <p>
          Contact : <LegalEmailLink />
          <br />
          Adresse : Les Courtats 7, 2942 Alle, Suisse
        </p>
      </LegalSection>

      <LegalSection title="1. Objet">
        <p>
          Le Club utilise Obillz pour gérer notamment ses membres, cotisations,
          factures, boutique, événements, planning, buvette, communications et
          documents. Obillz ne traite ces données <strong>que pour fournir le
          service</strong>, selon les instructions documentées du Club
          (interfaces, paramètres, exports, demandes écrites).
        </p>
        <p>
          Obillz est responsable distinct pour le compte d’utilisateur,
          l’abonnement SaaS, le support et la sécurité de la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="2. Confidentialité">
        <p>
          Obillz et toute personne autorisée à traiter les données s’engagent à
          la confidentialité et à n’accéder aux données du Club que dans la
          mesure nécessaire au service, au support ou aux obligations légales.
        </p>
      </LegalSection>

      <LegalSection title="3. Sécurité">
        <p>
          Obillz met en œuvre des mesures techniques et organisationnelles
          visant à respecter les exigences applicables de la LPD, notamment :
          isolation logique des clubs, contrôles d’accès et politiques RLS,
          chiffrement en transit, journaux d’audit, possibilité de MFA,
          limitation des brouillons locaux pour certaines données sensibles. Ces
          mesures n’équivalent pas à une certification.
        </p>
      </LegalSection>

      <LegalSection title="4. Sous-traitants ultérieurs">
        <p>Obillz peut recourir notamment à :</p>
        <ul>
          <li>Supabase (base, auth, storage) ;</li>
          <li>Vercel (hébergement, analytics) ;</li>
          <li>Stripe (paiements) ;</li>
          <li>Resend (e-mails).</li>
        </ul>
        <p>
          Le Club en est informé. Un changement substantiel de sous-traitant
          portant sur des données du Club sera communiqué par un moyen
          raisonnable (site, e-mail ou conditions).
        </p>
      </LegalSection>

      <LegalSection title="5. Transferts internationaux">
        <p>
          La base principale Supabase est indiquée comme située en Suisse selon
          la configuration actuelle (preuve de région à conserver par Obillz).
          Vercel, Stripe et Resend <strong>peuvent traiter des données hors de
          Suisse</strong>. Le Club en prend acte. Obillz ne garantit pas que
          toutes les données restent en Suisse.
        </p>
      </LegalSection>

      <LegalSection title="6. Droits des personnes">
        <p>
          Le Club est le point de contact principal pour les demandes d’accès,
          de rectification, de suppression, d’opposition (y compris marketing)
          relatives à ses membres et contacts. Obillz <strong>assiste</strong>{" "}
          le Club, dans la mesure raisonnable des fonctionnalités du produit et
          d’un traitement manuel via <LegalEmailLink />.
        </p>
      </LegalSection>

      <LegalSection title="7. Assistance">
        <p>
          Sur demande écrite du Club, Obillz fournit les informations
          raisonnablement nécessaires pour démontrer le respect du présent
          accord (mesures de sécurité de haut niveau, liste des sous-traitants,
          aide aux demandes de personnes).
        </p>
      </LegalSection>

      <LegalSection title="8. Incidents">
        <p>
          Obillz informe le Club sans retard injustifié après avoir pris
          connaissance d’une violation de données personnelles concernant les
          données du Club, avec les éléments alors disponibles (nature,
          données/clubs potentiellement concernés, mesures). Le Club évalue, en
          tant que responsable, l’information des personnes et une éventuelle
          notification au PFPDT. Obillz coopère.
        </p>
      </LegalSection>

      <LegalSection title="9. Conservation, fin de contrat">
        <p>
          Une purge automatique s’applique uniquement aux données opérationnelles
          temporaires : invitations expirées ou annulées (90 jours), clés
          d’idempotence (30 jours), journaux d’audit (12 mois), historique
          d’e-mails déjà soft-deleted (30 jours), jetons publics de planning
          (désactivation à la date de l’événement, suppression 90 jours après).
        </p>
        <p>
          Les factures, pièces comptables, transactions, commandes boutique,
          membres, paiements Stripe et toute donnée pouvant être nécessaire
          légalement ou contractuellement <strong>ne sont pas purgés
          automatiquement</strong>. Les documents et pièces comptables restent
          documentés à 10 ans. Pour ces catégories : conservation gérée
          manuellement selon la finalité et les obligations légales jusqu’à
          automatisation future.
        </p>
        <p>
          À la fin du contrat, le Club peut exporter ses données via le service
          tant que l’accès est ouvert. Sur instruction écrite, Obillz supprime
          ou restitue les données du Club dans un délai raisonnable,{" "}
          <strong>sauf</strong> conservation imposée par le droit (notamment
          pièces comptables) ou copies de sauvegarde jusqu’à leur rotation.
        </p>
      </LegalSection>

      <LegalSection title="10. Responsabilité du Club">
        <p>
          Le Club garantit la <strong>licéité</strong> de ses traitements :
          bases pour collecter les données (y compris AVS et dates de
          naissance), <strong>imports</strong> (fichiers membres, listes
          e-mails), et <strong>communications</strong> (campagnes). Un contact
          ajouté manuellement avec déclaration de base valable reste sous la
          responsabilité du Club. Obillz n’est pas responsable des collectes ou
          envois illicites décidés par le Club.
        </p>
      </LegalSection>

      <LegalSection title="11. Droit applicable">
        <p>
          Droit suisse. For : domicile de l’exploitant, sous réserve des règles
          impératives.
        </p>
      </LegalSection>

      <LegalSection title="Documents associés">
        <p>
          <LegalInlineLink href="/conditions-utilisation">
            Conditions d’utilisation
          </LegalInlineLink>
          {" · "}
          <LegalInlineLink href="/politique-confidentialite">
            Politique de confidentialité
          </LegalInlineLink>
          {" · "}
          <LegalInlineLink href="/securite-protection-donnees">
            Sécurité et protection des données
          </LegalInlineLink>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
