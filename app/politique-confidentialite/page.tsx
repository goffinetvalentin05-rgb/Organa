import LandingNav from "@/components/LandingNav";
import SiteFooter from "@/components/SiteFooter";

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LandingNav />
      <main className="pt-32">
        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white px-6 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)] md:px-10">
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Politique de confidentialité (RGPD)
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Dernière mise à jour : 18 janvier 2026.
            </p>
            <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Responsable du traitement
                </h2>
                <p className="mt-2">
                  Les données personnelles collectées via Organa sont traitées
                  par la société éditrice du service, basée en Suisse. Pour
                  toute question relative à la protection des données, vous
                  pouvez nous contacter à{" "}
                  <a className="text-slate-900 underline" href="mailto:contact@organa.dev">
                    contact@organa.dev
                  </a>
                  .
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Données traitées
                </h2>
                <p className="mt-2">
                  Organa collecte uniquement les données nécessaires au
                  fonctionnement du service, notamment : informations de compte
                  (nom, email, identifiants), informations de facturation,
                  données professionnelles saisies par les utilisateurs
                  (clients, devis, factures, tâches), ainsi que des données
                  techniques d’accès (logs, sécurité, métriques de performance).
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Finalités
                </h2>
                <p className="mt-2">
                  Les données sont utilisées pour : fournir et opérer le service,
                  gérer les comptes et les paiements, sécuriser l’accès, assurer
                  la maintenance, améliorer l’expérience utilisateur et répondre
                  aux demandes d’assistance.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Base légale
                </h2>
                <p className="mt-2">
                  Les traitements reposent sur l’exécution du contrat (fourniture
                  du service), le respect d’obligations légales (facturation),
                  et l’intérêt légitime à sécuriser et améliorer la plateforme.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Destinataires et sous-traitants
                </h2>
                <p className="mt-2">
                  Les données sont accessibles aux équipes Organa habilitées et
                  à des prestataires techniques agissant comme sous-traitants
                  (hébergement cloud sécurisé, email transactionnel, support,
                  paiement). Aucun usage publicitaire n’est réalisé et aucun
                  partage à des fins de prospection n’est effectué.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Transferts internationaux
                </h2>
                <p className="mt-2">
                  Organa privilégie un hébergement en Suisse et/ou en Europe.
                  Si un transfert hors de ces zones devait intervenir, il serait
                  encadré par des garanties appropriées (clauses contractuelles
                  types ou mécanismes équivalents) conformément au RGPD.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Durées de conservation
                </h2>
                <p className="mt-2">
                  Les données sont conservées pendant la durée de la relation
                  contractuelle. Certaines données peuvent être conservées plus
                  longtemps pour répondre à des obligations légales (notamment
                  comptables et fiscales). Les comptes inactifs sont supprimés
                  ou anonymisés après une période raisonnable.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Sécurité
                </h2>
                <p className="mt-2">
                  Organa met en place des mesures techniques et organisationnelles
                  adaptées afin de protéger les données contre la perte, l’accès
                  non autorisé ou l’altération (contrôles d’accès, chiffrement
                  en transit, sauvegardes).
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Vos droits
                </h2>
                <p className="mt-2">
                  Conformément au RGPD et au droit suisse, vous disposez de
                  droits d’accès, de rectification, d’effacement, de limitation,
                  d’opposition et de portabilité. Vous pouvez exercer vos droits
                  en nous contactant à{" "}
                  <a className="text-slate-900 underline" href="mailto:contact@organa.dev">
                    contact@organa.dev
                  </a>
                  . Vous pouvez également déposer une réclamation auprès de
                  l’autorité de protection des données compétente (PFPDT en
                  Suisse ou autorité locale au sein de l’UE).
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

