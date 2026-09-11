import type { Metadata } from "next";
import {
  LegalEmailLink,
  LegalInlineLink,
  LegalSection,
} from "@/components/landing/LegalDocument";
import LegalPageLayout from "@/components/landing/LegalPageLayout";

export const metadata: Metadata = {
  title: "Mentions légales | Obillz",
  description: "Mentions légales du service Obillz, exploité par Valentin Goffinet.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPageLayout title="Mentions légales" lastUpdated="11 septembre 2026">
      <LegalSection title="Éditeur du service">
        <p>
          Obillz est un service SaaS de gestion pour clubs sportifs, exploité par
          Valentin Goffinet.
        </p>
        <p>
          Adresse postale : Les Courtats 7, 2942 Alle, Suisse
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Email : <LegalEmailLink />
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          L’application est hébergée par Vercel. Les données métier sont stockées
          principalement via Supabase. La base principale est indiquée comme située
          en Suisse selon la configuration actuelle ; certains prestataires peuvent
          traiter des données à l’étranger. Voir la{" "}
          <LegalInlineLink href="/politique-confidentialite">
            politique de confidentialité
          </LegalInlineLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L’ensemble des contenus, marques, logos, interfaces et éléments visuels
          liés à Obillz sont protégés par le droit de la propriété intellectuelle.
          Toute reproduction non autorisée est interdite.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>
          Obillz met tout en œuvre pour fournir un service fiable et sécurisé. La
          responsabilité ne saurait être engagée en cas de perturbation temporaire,
          d’indisponibilité ou de dommages indirects, sous réserve des dispositions
          impératives du droit suisse.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Les présentes mentions sont régies par le droit suisse. Le for est, sous
          réserve des règles impératives, celui du domicile de l’exploitant.
        </p>
      </LegalSection>

      <LegalSection title="Signalement d'abus">
        <p>
          Pour signaler un contenu illicite ou un usage abusif du service, veuillez
          contacter <LegalEmailLink />.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
