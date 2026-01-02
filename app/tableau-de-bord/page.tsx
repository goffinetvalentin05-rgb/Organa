"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  clientsAPI,
  devisAPI,
  facturesAPI,
  calculerTotalTTC,
} from "@/lib/mock-data";
import { Users, FileText, Receipt, AlertCircle, UserPlus, FilePlus, DollarSign, Clock, Mail, Eye, Download, Send, RefreshCw } from "@/lib/icons";

function CheckoutHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Vérifier si on revient d'un checkout réussi
    const checkout = searchParams?.get("checkout");
    if (checkout === "success") {
      toast.success("Paiement réussi ! Votre compte est maintenant Pro.");
      // Nettoyer l'URL
      router.replace("/tableau-de-bord");
    }
  }, [searchParams, router]);

  return null;
}

export default function TableauDeBordPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDevis: 0,
    totalFactures: 0,
    devisEnAttente: 0,
    facturesPayees: 0,
    facturesEnRetard: 0,
    montantFacturesImpayees: 0,
    montantTresorerieMois: 0,
    nombreFacturesImpayees: 0,
  });

  const [derniersDocuments, setDerniersDocuments] = useState<any[]>([]);
  const [aFaire, setAFaire] = useState<any[]>([]);

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "CHF",
    }).format(montant);
  };

  useEffect(() => {
    const clients = clientsAPI.getAll();
    const devis = devisAPI.getAll();
    const factures = facturesAPI.getAll();

    const devisEnAttente = devis.filter(
      (d) => d.statut === "envoye" || d.statut === "brouillon"
    ).length;
    const facturesPayees = factures.filter((f) => f.statut === "paye").length;
    const facturesEnRetard = factures.filter(
      (f) => f.statut === "en-retard"
    ).length;

    // Calculer le montant des factures impayées
    const facturesImpayees = factures.filter(
      (f) => f.statut !== "paye" && f.statut !== "brouillon"
    );
    const montantFacturesImpayees = facturesImpayees.reduce(
      (total, f) => total + calculerTotalTTC(f.lignes),
      0
    );

    // Calculer la trésorerie encaissée ce mois-ci
    const maintenant = new Date();
    const premierJourMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const facturesPayeesCeMois = factures.filter((f) => {
      if (f.statut !== "paye" || !f.datePaiement) return false;
      const datePaiement = new Date(f.datePaiement);
      return datePaiement >= premierJourMois;
    });
    const montantTresorerieMois = facturesPayeesCeMois.reduce(
      (total, f) => total + calculerTotalTTC(f.lignes),
      0
    );

    setStats({
      totalClients: clients.length,
      totalDevis: devis.length,
      totalFactures: factures.length,
      devisEnAttente,
      facturesPayees,
      facturesEnRetard,
      montantFacturesImpayees,
      montantTresorerieMois,
      nombreFacturesImpayees: facturesImpayees.length,
    });

    // Derniers documents (devis + factures)
    const tousDocuments = [
      ...devis.map((d) => ({
        ...d,
        type: "devis",
        montant: calculerTotalTTC(d.lignes),
      })),
      ...factures.map((f) => ({
        ...f,
        type: "facture",
        montant: calculerTotalTTC(f.lignes),
      })),
    ]
      .sort((a, b) => b.dateCreation.localeCompare(a.dateCreation))
      .slice(0, 5);

    setDerniersDocuments(tousDocuments);

    // Section "À faire"
    const aFaireList: any[] = [];

    // Factures en retard
    const facturesRetard = factures.filter((f) => f.statut === "en-retard");
    facturesRetard.forEach((f) => {
      aFaireList.push({
        id: f.id,
        type: "facture-retard",
        titre: `Facture ${f.numero} en retard`,
        description: `${f.client?.nom || "Client inconnu"} - ${formatMontant(calculerTotalTTC(f.lignes))}`,
        date: f.dateEcheance || f.dateCreation,
        document: f,
      });
    });

    // Devis sans réponse (envoyés il y a plus de 7 jours)
    const maintenantDate = new Date();
    const devisSansReponse = devis.filter((d) => {
      if (d.statut !== "envoye") return false;
      const dateEnvoi = new Date(d.dateCreation);
      const joursEcoules = (maintenantDate.getTime() - dateEnvoi.getTime()) / (1000 * 60 * 60 * 24);
      return joursEcoules > 7;
    });
    devisSansReponse.forEach((d) => {
      aFaireList.push({
        id: d.id,
        type: "devis-sans-reponse",
        titre: `Devis ${d.numero} sans réponse`,
        description: `${d.client?.nom || "Client inconnu"} - ${formatMontant(calculerTotalTTC(d.lignes))}`,
        date: d.dateCreation,
        document: d,
      });
    });

    // Documents à envoyer (brouillons)
    const documentsAEnvoyer = [
      ...devis.filter((d) => d.statut === "brouillon").map((d) => ({
        ...d,
        type: "devis",
      })),
      ...factures.filter((f) => f.statut === "brouillon").map((f) => ({
        ...f,
        type: "facture",
      })),
    ];
    documentsAEnvoyer.forEach((doc) => {
      aFaireList.push({
        id: doc.id,
        type: "document-a-envoyer",
        titre: `${doc.type === "devis" ? "Devis" : "Facture"} ${doc.numero} à envoyer`,
        description: `${doc.client?.nom || "Client inconnu"} - ${formatMontant(calculerTotalTTC(doc.lignes))}`,
        date: doc.dateCreation,
        document: doc,
      });
    });

    // Trier par urgence (retard > sans réponse > à envoyer)
    aFaireList.sort((a, b) => {
      const priorite = { "facture-retard": 3, "devis-sans-reponse": 2, "document-a-envoyer": 1 };
      return (priorite[b.type as keyof typeof priorite] || 0) - (priorite[a.type as keyof typeof priorite] || 0);
    });

    setAFaire(aFaireList.slice(0, 5));
  }, []);

  const handleEnvoyerDocument = async (doc: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: doc.type === "devis" ? "devis" : "facture",
          documentId: doc.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Erreur lors de l'envoi");
      }

      toast.success("Document envoyé avec succès !");
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l'envoi");
    }
  };

  const handleTelechargerPDF = (doc: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `/api/documents/${doc.id}/pdf?type=${doc.type === "devis" ? "quote" : "invoice"}&download=true`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `organa-${doc.type === "devis" ? "quote" : "invoice"}-${doc.numero || doc.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: "bg-surface-hover text-secondary",
      envoye: "bg-accent-light text-accent",
      accepte: "bg-success-bg text-success",
      refuse: "bg-error-bg text-error",
      paye: "bg-success-bg text-success",
      "en-retard": "bg-error-bg text-error",
    };
    return colors[statut] || "bg-surface-hover text-secondary";
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: "Brouillon",
      envoye: "Envoyé",
      accepte: "Accepté",
      refuse: "Refusé",
      paye: "Payé",
      "en-retard": "En retard",
    };
    return labels[statut] || statut;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Suspense fallback={null}>
        <CheckoutHandler />
      </Suspense>
      {/* En-tête */}
      <div className="relative">
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2 text-primary">
          Tableau de bord
        </h1>
        <p className="font-body text-sm text-secondary font-normal">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">Clients</span>
            <Users className="w-6 h-6 text-secondary" />
          </div>
          <div className="font-heading text-4xl font-bold text-primary">
            {stats.totalClients}
          </div>
        </div>

        <div className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">Factures impayées</span>
            <DollarSign className="w-6 h-6 text-secondary" />
          </div>
          <div className="font-heading text-3xl font-bold text-primary">
            {formatMontant(stats.montantFacturesImpayees)}
          </div>
          <div className="mt-2 font-body text-xs text-tertiary">
            {stats.nombreFacturesImpayees} facture{stats.nombreFacturesImpayees > 1 ? "s" : ""}
          </div>
        </div>

        <div className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-accent-border transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">Trésorerie ce mois</span>
            <DollarSign className="w-6 h-6 text-success" />
          </div>
          <div className="font-heading text-3xl font-bold" style={{ color: 'var(--success)' }}>
            {formatMontant(stats.montantTresorerieMois)}
          </div>
          <div className="mt-2 font-body text-xs text-tertiary">
            Encaissements du mois
          </div>
        </div>

        <div className="group relative rounded-xl border border-subtle bg-surface p-6 hover:border-red-500/30 transition-all duration-200 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-body text-secondary text-sm font-medium">Factures en retard</span>
            <AlertCircle className="w-6 h-6 text-error" />
          </div>
          <div className="font-heading text-4xl font-bold" style={{ color: 'var(--error)' }}>
            {stats.facturesEnRetard}
          </div>
          {stats.facturesEnRetard > 0 && (
            <div className="mt-2 font-body text-xs text-tertiary">
              Action requise
            </div>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="rounded-xl border border-subtle bg-surface p-8">
        <h2 className="font-heading text-2xl font-semibold mb-6 text-primary">
          Actions rapides
        </h2>
        <div className="space-y-4">
          {/* Actions principales */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/tableau-de-bord/factures/nouvelle"
              className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              Nouvelle facture
            </Link>
            <Link
              href="/tableau-de-bord/devis/nouveau"
              className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" />
              Nouveau devis
            </Link>
            <Link
              href="/tableau-de-bord/clients/nouveau"
              className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Nouveau client
            </Link>
          </div>
          {/* Actions secondaires */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-subtle">
            <Link
              href="/tableau-de-bord/devis"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 border border-subtle text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Relancer devis
            </Link>
            <Link
              href="/tableau-de-bord/factures"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2 border border-subtle text-sm"
            >
              <Send className="w-4 h-4" />
              Envoyer facture
            </Link>
          </div>
        </div>
      </div>

      {/* Section À faire */}
      {aFaire.length > 0 && (
        <div className="rounded-xl border border-subtle bg-surface p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-semibold text-primary">
              À faire
            </h2>
            <Clock className="w-5 h-5 text-secondary" />
          </div>
          <div className="space-y-3">
            {aFaire.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={`/tableau-de-bord/${item.document.type === "devis" ? "devis" : "factures"}/${item.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-subtle bg-surface-hover hover:border-accent-border transition-all duration-200"
              >
                <div className="flex items-center gap-3 flex-1">
                  {item.type === "facture-retard" ? (
                    <AlertCircle className="w-5 h-5 text-error" />
                  ) : item.type === "devis-sans-reponse" ? (
                    <Clock className="w-5 h-5 text-warning" />
                  ) : (
                    <Mail className="w-5 h-5 text-secondary" />
                  )}
                  <div className="flex-1">
                    <div className="font-body font-semibold text-primary">{item.titre}</div>
                    <div className="font-body text-sm text-secondary">{item.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.type === "document-a-envoyer" && (
                    <button
                      onClick={(e) => handleEnvoyerDocument(item.document, e)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                      title="Envoyer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.type === "facture-retard"
                        ? "bg-error-bg text-error"
                        : item.type === "devis-sans-reponse"
                        ? "bg-warning-bg text-warning"
                        : "bg-accent-light text-accent"
                    }`}
                  >
                    {item.type === "facture-retard"
                      ? "Urgent"
                      : item.type === "devis-sans-reponse"
                      ? "À relancer"
                      : "À envoyer"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Derniers documents */}
      <div className="rounded-xl border border-subtle bg-surface p-8">
        <h2 className="font-heading text-2xl font-semibold mb-6 text-primary">
          Derniers documents
        </h2>
        {derniersDocuments.length === 0 ? (
          <p className="font-body text-secondary text-lg font-normal">Aucun document pour le moment</p>
        ) : (
          <div className="space-y-3">
            {derniersDocuments.map((doc) => (
              <div
                key={`${doc.type}-${doc.id}`}
                className="flex items-center justify-between p-5 rounded-lg border border-subtle bg-surface-hover hover:border-accent-border transition-all duration-200 group"
              >
                <Link
                  href={`/tableau-de-bord/${doc.type === "devis" ? "devis" : "factures"}/${doc.id}`}
                  className="flex items-center gap-4 flex-1"
                >
                  {doc.type === "devis" ? (
                    <FileText className="w-5 h-5 text-secondary" />
                  ) : (
                    <Receipt className="w-5 h-5 text-secondary" />
                  )}
                  <div className="flex-1">
                    <div className="font-body font-semibold text-lg text-primary">{doc.title || doc.numero}</div>
                    <div className="font-body text-sm text-secondary">
                      {doc.client?.nom || "Client inconnu"}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-body font-bold text-lg text-primary">{formatMontant(doc.montant)}</div>
                    <div className="font-body text-xs text-tertiary">{doc.dateCreation}</div>
                  </div>
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold ${getStatutColor(
                      doc.statut
                    )}`}
                  >
                    {getStatutLabel(doc.statut)}
                  </span>
                  <div className="flex items-center gap-2 ml-2">
                    <Link
                      href={`/tableau-de-bord/${doc.type === "devis" ? "devis" : "factures"}/${doc.id}`}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all opacity-0 group-hover:opacity-100"
                      title="Ouvrir"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={(e) => handleTelechargerPDF(doc, e)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all opacity-0 group-hover:opacity-100"
                      title="Télécharger PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {(doc.statut === "brouillon" || doc.statut === "envoye") && (
                      <button
                        onClick={(e) => handleEnvoyerDocument(doc, e)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Envoyer par email"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
