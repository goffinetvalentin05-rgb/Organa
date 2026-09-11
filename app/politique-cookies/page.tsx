import type { Metadata } from "next";
import {
  LegalEmailLink,
  LegalInlineLink,
  LegalSection,
} from "@/components/landing/LegalDocument";
import LegalPageLayout from "@/components/landing/LegalPageLayout";

export const metadata: Metadata = {
  title: "Politique de cookies | Obillz",
  description: "Cookies, session et mesure d’audience — Obillz.",
};

export default function PolitiqueCookiesPage() {
  return (
    <LegalPageLayout title="Politique de cookies" lastUpdated="11 septembre 2026">
      <LegalSection title="Vue d'ensemble">
        <p>
          Obillz utilise des cookies ou stockages strictement nécessaires au
          fonctionnement du service (session, sécurité). Aucun cookie de suivi
          publicitaire n’est installé par défaut.
        </p>
      </LegalSection>

      <LegalSection title="Cookies et stockage essentiels">
        <p>
          Ils permettent la connexion sécurisée, la gestion de session, le club
          actif et la prévention des usages abusifs. Sans eux, le service ne peut
          pas fonctionner correctement.
        </p>
      </LegalSection>

      <LegalSection title="Mesure d'audience">
        <p>
          Vercel Analytics est utilisé pour comprendre l’usage du site (pages
          visitées, performance). Il s’agit d’une mesure d’audience limitée, sans
          publicité ciblée. Les URL contenant un jeton secret (cotisation,
          invitation, désinscription) sont masquées avant transmission.
        </p>
      </LegalSection>

      <LegalSection title="Gestion">
        <p>
          Vous pouvez gérer ou supprimer les cookies via les paramètres de votre
          navigateur. Le refus des cookies essentiels peut empêcher l’accès au
          service. Pour toute question : <LegalEmailLink />. Voir aussi la{" "}
          <LegalInlineLink href="/politique-confidentialite">
            politique de confidentialité
          </LegalInlineLink>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
