"use client";

import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#03062A] via-[#050A3A] to-[#0A1A5E]">
      <LandingNav />
      
      {/* HERO SECTION */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-center mb-6 leading-tight">
              <span className="block text-white">Organa</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 mt-4">
                La gestion simple pour les indépendants
              </span>
            </h1>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <p className="mt-8 max-w-3xl mx-auto text-center text-lg md:text-xl text-gray-300 leading-relaxed">
              Créez des devis et factures professionnels, transformez vos devis en factures,
              gérez vos clients, planifiez vos rendez-vous et modifiez tout manuellement,
              sans dépendre d'une IA.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-12 flex flex-wrap justify-center gap-4 text-gray-300">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <span>📄</span>
                <span>Devis → Factures en 1 clic</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <span>🧾</span>
                <span>Documents A4 professionnels (PDF)</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <span>✏️</span>
                <span>Modification totale par l'entreprise</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <span>📅</span>
                <span>Calendrier intégré</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                <span>💳</span>
                <span>Abonnements mensuel & annuel</span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mt-12 text-center">
              <Link
                href="/inscription"
                className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 transform"
              >
                Découvrir Organa
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION LE PROBLÈME */}
      <section id="probleme" className="py-20 md:py-32 px-6 bg-gradient-to-b from-[#0A1A5E] via-[#050A3A] to-[#03062A]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
              Le Problème
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            <ScrollReveal delay={0}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-3 text-white">Gestion dispersée</h3>
                <p className="text-gray-300 leading-relaxed">
                  Vos outils de gestion sont éparpillés entre plusieurs plateformes. 
                  Vous perdez du temps à jongler entre différents logiciels pour gérer 
                  vos clients, vos devis, vos factures et votre calendrier.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10">
                <div className="text-4xl mb-4">⏱️</div>
                <h3 className="text-xl font-semibold mb-3 text-white">Perte de temps</h3>
                <p className="text-gray-300 leading-relaxed">
                  La création manuelle de devis et factures prend beaucoup de temps. 
                  Chaque document doit être créé depuis zéro, avec un risque d'erreur 
                  et une charge mentale importante.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
                <div className="text-4xl mb-4">🔀</div>
                <h3 className="text-xl font-semibold mb-3 text-white">Manque de fluidité</h3>
                <p className="text-gray-300 leading-relaxed">
                  Transformer un devis en facture est un processus fastidieux qui nécessite 
                  de recopier toutes les informations. Cette étape répétitive augmente 
                  les risques d'erreurs et la frustration.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-3 text-white">Manque de contrôle</h3>
                <p className="text-gray-300 leading-relaxed">
                  Beaucoup d'outils imposent leurs formats et leurs processus. Vous n'avez 
                  pas la liberté de personnaliser vos documents selon vos besoins spécifiques 
                  et votre identité visuelle.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION LA SOLUTION ORGANA */}
      <section id="solution" className="py-20 md:py-32 px-6 bg-gradient-to-b from-[#03062A] via-[#050A3A] to-[#0A1A5E]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-white">
              La Solution Organa
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="text-xl md:text-2xl text-center text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed">
              Une plateforme centralisée qui vous donne le contrôle total sur votre gestion, 
              avec des outils simples et puissants conçus pour les indépendants.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            <ScrollReveal delay={0}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-3 text-white">Centralisation</h3>
                <p className="text-gray-300 leading-relaxed">
                  Tous vos outils en un seul endroit : clients, devis, factures, calendrier. 
                  Plus besoin de jongler entre plusieurs applications.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-3 text-white">Efficacité</h3>
                <p className="text-gray-300 leading-relaxed">
                  Transformez vos devis en factures en un clic. Créez des documents 
                  professionnels en quelques secondes, sans recopier d'informations.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="text-4xl mb-4">✏️</div>
                <h3 className="text-xl font-semibold mb-3 text-white">Contrôle total</h3>
                <p className="text-gray-300 leading-relaxed">
                  Modifiez tout manuellement selon vos besoins. Personnalisez vos documents, 
                  adaptez vos processus, sans dépendre d'une IA ou de formats imposés.
                </p>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={300}>
            <div className="mt-16 text-center">
              <Link
                href="/inscription"
                className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 transform"
              >
                Découvrir Organa
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* SECTION COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="py-20 md:py-32 px-6 bg-gradient-to-b from-[#0A1A5E] via-[#050A3A] to-[#03062A]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
              Comment ça marche
            </h2>
          </ScrollReveal>

          <div className="space-y-12">
            <ScrollReveal delay={0}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Créez votre compte</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Inscrivez-vous en quelques secondes. Aucune carte bancaire requise pour commencer. 
                    Vous avez accès immédiatement à toutes les fonctionnalités de base.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Ajoutez vos clients</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Importez ou créez manuellement votre base de clients. Organisez toutes 
                    vos informations de contact en un seul endroit sécurisé.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Créez vos devis</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Générez des devis professionnels en quelques clics. Personnalisez chaque 
                    détail selon vos besoins. Exportez en PDF prêt à envoyer à vos clients.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Transformez en factures</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Une fois le devis accepté, transformez-le en facture en un seul clic. 
                    Toutes les informations sont automatiquement transférées. Plus besoin de recopier.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.01]">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-3 text-white">Gérez votre calendrier</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Planifiez vos rendez-vous directement dans Organa. Synchronisez avec vos clients 
                    et gardez une vue d'ensemble de votre activité.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION POURQUOI FAIRE CONFIANCE */}
      <section id="confiance" className="py-20 md:py-32 px-6 bg-gradient-to-b from-[#03062A] via-[#050A3A] to-[#0A1A5E]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
              Pourquoi faire confiance à Organa
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            <ScrollReveal delay={0}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-3 text-white">Sécurité</h3>
                <p className="text-gray-300 leading-relaxed">
                  Vos données sont protégées avec les meilleures pratiques de sécurité. 
                  Chiffrement, sauvegardes régulières et conformité RGPD.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-3 text-white">Simplicité</h3>
                <p className="text-gray-300 leading-relaxed">
                  Interface intuitive conçue pour les indépendants. Pas besoin de formation 
                  ou de connaissances techniques. Vous êtes opérationnel en quelques minutes.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10">
                <div className="text-4xl mb-4">💪</div>
                <h3 className="text-xl font-semibold mb-3 text-white">Fiabilité</h3>
                <p className="text-gray-300 leading-relaxed">
                  Une plateforme stable et performante, disponible 24/7. Support réactif 
                  et mises à jour régulières pour toujours améliorer votre expérience.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION TARIFS */}
      <section id="tarifs" className="py-20 md:py-32 px-6 bg-gradient-to-b from-[#0A1A5E] via-[#050A3A] to-[#03062A]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal delay={0}>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 text-white">
              Tarifs
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="text-xl text-center text-gray-300 mb-16 max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Commencez gratuitement, 
              passez au niveau supérieur quand vous êtes prêt.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan Gratuit */}
            <ScrollReveal delay={0}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                <h3 className="text-2xl font-bold mb-2 text-white">Gratuit</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">0€</span>
                  <span className="text-gray-400">/mois</span>
                </div>
                <ul className="space-y-3 mb-8 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Jusqu'à 5 clients</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>10 devis par mois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>10 factures par mois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Calendrier de base</span>
                  </li>
                </ul>
                <Link
                  href="/inscription"
                  className="block w-full text-center px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-all duration-300 hover:scale-105"
                >
                  Découvrir le plan gratuit
                </Link>
              </div>
            </ScrollReveal>

            {/* Plan Pro */}
            <ScrollReveal delay={100}>
              <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-transparent backdrop-blur-sm border-2 border-blue-500/40 hover:border-blue-500/60 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-blue-500/30 relative overflow-hidden">
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold">
                  POPULAIRE
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Pro</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">29€</span>
                  <span className="text-gray-400">/mois</span>
                </div>
                <ul className="space-y-3 mb-8 text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Clients illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Devis illimités</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Factures illimitées</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Calendrier avancé</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Support prioritaire</span>
                  </li>
                </ul>
                <Link
                  href="/inscription"
                  className="block w-full text-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50"
                >
                  Passer au plan Pro
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-white/10 bg-gradient-to-b from-[#03062A] to-black">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Organa. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
