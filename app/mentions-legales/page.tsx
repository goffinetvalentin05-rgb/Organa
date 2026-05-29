import type { Metadata } from "next";
import {
  LegalDocument,
  LegalEmailLink,
  LegalSection,
} from "@/components/landing/LegalDocument";
import LegalPageShell from "@/components/landing/LegalPageShell";

export const metadata: Metadata = {
  title: "Mentions légales | Obillz",
  description: "Mentions légales du service Obillz.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPageShell>
      <LegalDocument title="Mentions légales" updatedAt="6 février 2026">
        <LegalSection title="Éditeur du service">
          <p>
            Obillz est un service SaaS de gestion pour clubs sportifs. Les informations
            d&apos;identification complètes (raison sociale, adresse du siège et numéro
            d&apos;enregistrement) sont communiquées sur demande légitime à l&apos;adresse de
            contact.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Email : <LegalEmailLink />
          </p>
        </LegalSection>

        <LegalSection title="Hébergement">
          <p>
            Le service est hébergé sur une infrastructure cloud sécurisée, avec des standards
            élevés de disponibilité et de protection des données, située en Europe.
          </p>
        </LegalSection>

        <LegalSection title="Propriété intellectuelle">
          <p>
            L&apos;ensemble des contenus, marques, logos, interfaces et éléments visuels liés à
            Obillz sont protégés par le droit de la propriété intellectuelle. Toute reproduction non
            autorisée est interdite.
          </p>
        </LegalSection>

        <LegalSection title="Responsabilité">
          <p>
            Obillz met tout en œuvre pour fournir un service fiable et sécurisé. La responsabilité
            ne saurait être engagée en cas de perturbation temporaire, d&apos;indisponibilité ou de
            dommages indirects, sous réserve des dispositions légales impératives applicables.
          </p>
        </LegalSection>

        <LegalSection title="Signalement d'abus">
          <p>
            Pour signaler un contenu illicite ou un usage abusif du service, veuillez contacter{" "}
            <LegalEmailLink />.
          </p>
        </LegalSection>
      </LegalDocument>
    </LegalPageShell>
  );
}
