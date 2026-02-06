import LandingNav from "@/components/LandingNav";
import SiteFooter from "@/components/SiteFooter";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LandingNav />
      <main className="pt-32">
        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white px-6 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)] md:px-10">
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Mentions légales
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Dernière mise à jour : 6 février 2026.
            </p>
            <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Éditeur du service
                </h2>
                <p className="mt-2">
                  Obillz est un service SaaS de gestion pour clubs sportifs.
                  Les informations d'identification complètes (raison sociale,
                  adresse du siège et numéro d'enregistrement) sont
                  communiquées sur demande légitime à l'adresse de contact.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Contact
                </h2>
                <p className="mt-2">
                  Email :{" "}
                  <a className="text-slate-900 underline" href="mailto:contact@obillz.fr">
                    contact@obillz.fr
                  </a>
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Hébergement
                </h2>
                <p className="mt-2">
                  Le service est hébergé sur une infrastructure cloud sécurisée,
                  avec des standards élevés de disponibilité et de protection
                  des données, située en Europe.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Propriété intellectuelle
                </h2>
                <p className="mt-2">
                  L'ensemble des contenus, marques, logos, interfaces et éléments
                  visuels liés à Obillz sont protégés par le droit de la
                  propriété intellectuelle. Toute reproduction non autorisée est
                  interdite.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Responsabilité
                </h2>
                <p className="mt-2">
                  Obillz met tout en œuvre pour fournir un service fiable et
                  sécurisé. La responsabilité ne saurait être engagée en cas de
                  perturbation temporaire, d'indisponibilité ou de dommages
                  indirects, sous réserve des dispositions légales impératives
                  applicables.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Signalement d'abus
                </h2>
                <p className="mt-2">
                  Pour signaler un contenu illicite ou un usage abusif du
                  service, veuillez contacter{" "}
                  <a className="text-slate-900 underline" href="mailto:contact@obillz.fr">
                    contact@obillz.fr
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
