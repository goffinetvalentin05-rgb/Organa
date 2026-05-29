import type { Metadata } from "next";
import { LegalDocument, LegalSection } from "@/components/landing/LegalDocument";
import LegalPageShell from "@/components/landing/LegalPageShell";

export const metadata: Metadata = {
  title: "Politique de cookies | Obillz",
  description: "Politique de cookies et traceurs — Obillz.",
};

export default function PolitiqueCookiesPage() {
  return (
    <LegalPageShell>
      <LegalDocument title="Politique de cookies" updatedAt="6 février 2026">
        <LegalSection title="Vue d'ensemble">
          <p>
            Obillz utilise des cookies strictement nécessaires au fonctionnement du service de
            gestion pour clubs sportifs. Aucun cookie de suivi publicitaire n&apos;est installé par
            défaut.
          </p>
        </LegalSection>

        <LegalSection title="Cookies essentiels">
          <p>
            Ces cookies permettent notamment la connexion sécurisée, la gestion de session et la
            prévention des usages frauduleux. Ils sont indispensables au bon fonctionnement du
            service.
          </p>
        </LegalSection>

        <LegalSection title="Mesure d'audience">
          <p>
            Si des statistiques d&apos;usage basiques sont activées, elles servent uniquement à
            améliorer le service (performance, stabilité, compréhension des parcours). Ces mesures
            sont limitées et ne visent pas à vous profiler à des fins publicitaires.
          </p>
        </LegalSection>

        <LegalSection title="Gestion des cookies">
          <p>
            Vous pouvez gérer ou supprimer les cookies via les paramètres de votre navigateur. Le
            refus des cookies essentiels peut empêcher l&apos;accès au service ou en dégrader le
            fonctionnement.
          </p>
        </LegalSection>

        <LegalSection title="Durée de conservation">
          <p>
            Les cookies essentiels sont conservés pour la durée de la session ou selon une durée
            limitée afin d&apos;assurer la sécurité et la continuité du service.
          </p>
        </LegalSection>
      </LegalDocument>
    </LegalPageShell>
  );
}
