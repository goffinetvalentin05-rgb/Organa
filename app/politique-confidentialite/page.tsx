import type { Metadata } from "next";
import {
  LegalDocument,
  LegalEmailLink,
  LegalSection,
} from "@/components/landing/LegalDocument";
import LegalPageShell from "@/components/landing/LegalPageShell";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Obillz",
  description: "Politique de confidentialité et protection des données (RGPD) — Obillz.",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPageShell>
      <LegalDocument title="Politique de confidentialité (RGPD)" updatedAt="6 février 2026">
        <LegalSection title="Responsable du traitement">
          <p>
            Les données personnelles collectées via Obillz sont traitées par la société éditrice du
            service. Pour toute question relative à la protection des données, vous pouvez nous
            contacter à <LegalEmailLink />.
          </p>
        </LegalSection>

        <LegalSection title="Données traitées">
          <p>
            Obillz collecte uniquement les données nécessaires au fonctionnement du service de
            gestion pour clubs sportifs, notamment : informations de compte (nom, email,
            identifiants), informations relatives au club (membres, cotisations, événements,
            finances), ainsi que des données techniques d&apos;accès (logs, sécurité, métriques de
            performance).
          </p>
        </LegalSection>

        <LegalSection title="Finalités">
          <p>
            Les données sont utilisées pour : fournir et opérer le service de gestion de club,
            gérer les comptes et les abonnements, sécuriser l&apos;accès, assurer la maintenance,
            améliorer l&apos;expérience utilisateur et répondre aux demandes d&apos;assistance.
          </p>
        </LegalSection>

        <LegalSection title="Base légale">
          <p>
            Les traitements reposent sur l&apos;exécution du contrat (fourniture du service), le
            respect d&apos;obligations légales, et l&apos;intérêt légitime à sécuriser et améliorer
            la plateforme.
          </p>
        </LegalSection>

        <LegalSection title="Destinataires et sous-traitants">
          <p>
            Les données sont accessibles aux équipes Obillz habilitées et à des prestataires
            techniques agissant comme sous-traitants (hébergement cloud sécurisé, email
            transactionnel, support, paiement). Aucun usage publicitaire n&apos;est réalisé et
            aucun partage à des fins de prospection n&apos;est effectué.
          </p>
        </LegalSection>

        <LegalSection title="Transferts internationaux">
          <p>
            Obillz privilégie un hébergement en Europe. Si un transfert hors de l&apos;UE devait
            intervenir, il serait encadré par des garanties appropriées (clauses contractuelles types
            ou mécanismes équivalents) conformément au RGPD.
          </p>
        </LegalSection>

        <LegalSection title="Durées de conservation">
          <p>
            Les données sont conservées pendant la durée de la relation contractuelle. Certaines
            données peuvent être conservées plus longtemps pour répondre à des obligations légales
            (notamment comptables et fiscales). Les comptes inactifs sont supprimés ou anonymisés
            après une période raisonnable.
          </p>
        </LegalSection>

        <LegalSection title="Sécurité">
          <p>
            Obillz met en place des mesures techniques et organisationnelles adaptées afin de
            protéger les données contre la perte, l&apos;accès non autorisé ou l&apos;altération
            (contrôles d&apos;accès, chiffrement en transit, sauvegardes).
          </p>
        </LegalSection>

        <LegalSection title="Vos droits">
          <p>
            Conformément au RGPD, vous disposez de droits d&apos;accès, de rectification,
            d&apos;effacement, de limitation, d&apos;opposition et de portabilité. Vous pouvez
            exercer vos droits en nous contactant à <LegalEmailLink />. Vous pouvez également
            déposer une réclamation auprès de l&apos;autorité de protection des données compétente
            (CNIL en France ou autorité locale au sein de l&apos;UE).
          </p>
        </LegalSection>
      </LegalDocument>
    </LegalPageShell>
  );
}
