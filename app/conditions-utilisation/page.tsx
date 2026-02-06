import LandingNav from "@/components/LandingNav";
import SiteFooter from "@/components/SiteFooter";

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LandingNav />
      <main className="pt-32">
        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white px-6 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)] md:px-10">
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Conditions d'utilisation
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Dernière mise à jour : 6 février 2026.
            </p>
            <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Objet
                </h2>
                <p className="mt-2">
                  Les présentes conditions régissent l'accès et l'utilisation du
                  service Obillz, destiné aux clubs sportifs pour la gestion de
                  leurs membres, cotisations, événements, plannings et finances.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Création de compte
                </h2>
                <p className="mt-2">
                  L'utilisateur est responsable de l'exactitude des informations
                  fournies, de la confidentialité de ses identifiants et de toute
                  activité effectuée via son compte.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Utilisation acceptable
                </h2>
                <p className="mt-2">
                  L'utilisateur s'engage à utiliser Obillz de manière conforme
                  aux lois applicables, sans tentative d'accès non autorisé, de
                  perturbation du service ou d'usage frauduleux.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Abonnements et paiements
                </h2>
                <p className="mt-2">
                  Certains plans sont payants. Les tarifs, modalités de paiement
                  et conditions de facturation sont indiqués lors de la
                  souscription. En cas de non-paiement, l'accès au service peut
                  être suspendu après notification raisonnable.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Données et confidentialité
                </h2>
                <p className="mt-2">
                  Les données saisies par l'utilisateur (informations du club,
                  membres, cotisations, etc.) restent sa propriété. Obillz
                  traite ces données uniquement pour fournir le service,
                  conformément à la politique de confidentialité.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Propriété intellectuelle
                </h2>
                <p className="mt-2">
                  Obillz et ses contenus (logiciel, interfaces, logos, éléments
                  graphiques) sont protégés. L'utilisateur ne bénéficie d'aucun
                  droit de propriété autre qu'un droit d'usage limité au cadre
                  du service.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Disponibilité et support
                </h2>
                <p className="mt-2">
                  Obillz vise une haute disponibilité, sans garantie d'absence
                  d'interruption. Le support est fourni par email à{" "}
                  <a className="text-slate-900 underline" href="mailto:contact@obillz.fr">
                    contact@obillz.fr
                  </a>
                  .
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Responsabilité
                </h2>
                <p className="mt-2">
                  Obillz ne peut être tenu responsable des dommages indirects
                  (perte de données non sauvegardées, interruption d'activité),
                  sous réserve des limitations prévues par la loi. La
                  responsabilité pour faute intentionnelle ou négligence grave
                  n'est pas exclue.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Résiliation
                </h2>
                <p className="mt-2">
                  L'utilisateur peut résilier son compte à tout moment. Obillz
                  peut résilier en cas de violation manifeste des conditions,
                  avec notification préalable dans la mesure du possible.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Droit applicable
                </h2>
                <p className="mt-2">
                  Les présentes conditions sont régies par le droit français.
                  Sous réserve des règles impératives applicables, les tribunaux
                  compétents du siège de l'éditeur sont seuls compétents.
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
