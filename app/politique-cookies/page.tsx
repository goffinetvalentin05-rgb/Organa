import LandingNav from "@/components/LandingNav";
import SiteFooter from "@/components/SiteFooter";

export default function PolitiqueCookiesPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <LandingNav />
      <main className="pt-32">
        <section className="px-4 pb-20 md:px-6 md:pb-28">
          <div className="mx-auto max-w-4xl rounded-[32px] border border-slate-200 bg-white px-6 py-10 shadow-[0_18px_46px_rgba(15,23,42,0.06)] md:px-10">
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Politique de cookies
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Dernière mise à jour : 18 janvier 2026.
            </p>
            <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Vue d’ensemble
                </h2>
                <p className="mt-2">
                  Organa utilise des cookies strictement nécessaires au
                  fonctionnement du service. Aucun cookie de suivi publicitaire
                  n’est installé par défaut.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Cookies essentiels
                </h2>
                <p className="mt-2">
                  Ces cookies permettent notamment la connexion sécurisée, la
                  gestion de session et la prévention des usages frauduleux.
                  Ils sont indispensables au bon fonctionnement du service.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Mesure d’audience
                </h2>
                <p className="mt-2">
                  Si des statistiques d’usage basiques sont activées, elles
                  servent uniquement à améliorer le service (performance,
                  stabilité, compréhension des parcours). Ces mesures sont
                  limitées et ne visent pas à vous profiler à des fins
                  publicitaires.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Gestion des cookies
                </h2>
                <p className="mt-2">
                  Vous pouvez gérer ou supprimer les cookies via les paramètres
                  de votre navigateur. Le refus des cookies essentiels peut
                  empêcher l’accès au service ou en dégrader le fonctionnement.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Durée de conservation
                </h2>
                <p className="mt-2">
                  Les cookies essentiels sont conservés pour la durée de la
                  session ou selon une durée limitée afin d’assurer la sécurité
                  et la continuité du service.
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

