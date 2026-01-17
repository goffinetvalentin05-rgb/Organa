"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { calculerTotalHT, calculerTVA, calculerTotalTTC } from "@/lib/utils/calculations";
import { calendrierAPI } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils/currency";
import { Eye, Download, Mail, Trash, FileText } from "@/lib/icons";

interface Facture {
  id: string;
  numero: string;
  clientId?: string | null;
  client?: { nom?: string; email?: string };
  lignes: any[];
  statut: "brouillon" | "envoye" | "paye" | "en-retard";
  dateCreation: string;
  dateEcheance?: string | null;
  datePaiement?: string | null;
  notes?: string | null;
  type?: string;
}

export default function FactureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";
  const [facture, setFacture] = useState<Facture | null>(null);
  const [envoiEmail, setEnvoiEmail] = useState(false);
  const [currency, setCurrency] = useState<string>("CHF");

  useEffect(() => {
    if (!id) {
      router.push("/tableau-de-bord/factures");
      return;
    }

    const loadFacture = async () => {
      try {
        const response = await fetch(`/api/documents?id=${id}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          router.push("/tableau-de-bord/factures");
          return;
        }
        const data = await response.json();
        if (!data.document || data.document.type !== "invoice") {
          router.push("/tableau-de-bord/factures");
          return;
        }
        setFacture(data.document);
      } catch (error) {
        console.error("[Facture] Erreur chargement:", error);
        router.push("/tableau-de-bord/factures");
      }
    };

    const loadCurrency = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const data = await res.json();
        if (data.settings?.currency) {
          setCurrency(data.settings.currency);
        }
      } catch (err) {
        console.error("Erreur lors du chargement de la devise:", err);
      }
    };

    void loadFacture();
    void loadCurrency();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;
    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la facture");
      }
      router.push("/tableau-de-bord/factures");
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la suppression");
    }
  };

  const handleEnvoyerEmail = async () => {
    if (!facture || !facture.client?.email) {
      if (typeof toast !== "undefined" && toast.error) {
        toast.error("Email du client manquant");
      }
      return;
    }

    setEnvoiEmail(true);
    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "facture",
          documentId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de l'envoi");
      }

      if (typeof toast !== "undefined" && toast.success) {
        toast.success("Email envoyé avec succès !");
      }
      // Mettre à jour le statut si c'est un brouillon
      if (facture.statut === "brouillon") {
        handleChangerStatut("envoye");
      }
    } catch (error: any) {
      if (typeof toast !== "undefined" && toast.error) {
        const errorMessage = error?.message || "Erreur lors de l'envoi de l'email";
        toast.error(String(errorMessage));
      }
    } finally {
      setEnvoiEmail(false);
    }
  };

  const handleImprimer = () => {
    window.print();
  };

  const handleChangerStatut = async (nouveauStatut: Facture["statut"]) => {
    if (!facture) return;
    try {
      const response = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          type: "invoice",
          statut: nouveauStatut,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut");
      }

      setFacture({ ...facture, statut: nouveauStatut });
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la mise à jour du statut");
    }
  };

  const handleCreerTacheRelance = () => {
    if (!facture) return;
    
    const dateEcheance = facture.dateEcheance 
      ? new Date(facture.dateEcheance)
      : new Date();
    dateEcheance.setDate(dateEcheance.getDate() + 7); // 7 jours après l'échéance

    calendrierAPI.create({
      titre: `Relancer facture ${facture.numero || ""}`,
      description: `Relancer le client ${facture.client?.nom || ""} pour la facture ${facture.numero || ""}`,
      date: new Date().toISOString().split("T")[0],
      type: "tache",
      statut: "a-faire",
      typeTache: "relance",
      dateEcheance: dateEcheance.toISOString().split("T")[0],
      factureId: facture.id || "",
    });

    if (typeof toast !== "undefined" && toast.success) {
      toast.success("Tâche de relance créée !");
    }
  };

  if (!facture) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-secondary">Chargement...</p>
      </div>
    );
  }

  if (!facture.lignes || !Array.isArray(facture.lignes)) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-secondary">Erreur : données de facture invalides</p>
        <Link
          href="/tableau-de-bord/factures"
          className="text-secondary hover:text-white mt-4 inline-block"
        >
          ← Retour aux factures
        </Link>
      </div>
    );
  }

  const totalHT = calculerTotalHT(facture.lignes);
  const totalTVA = calculerTVA(facture.lignes);
  const totalTTC = calculerTotalTTC(facture.lignes);

  const formatMontant = (montant: number) => {
    return formatCurrency(montant, currency);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/tableau-de-bord/factures"
            className="text-secondary hover:text-white mb-2 inline-block"
          >
            ← Retour aux factures
          </Link>
          <h1 className="text-3xl font-bold">{facture.numero}</h1>
          <p className="mt-2 text-secondary">
            Client: {facture.client?.nom || "Client inconnu"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleEnvoyerEmail}
            disabled={envoiEmail || !facture.client?.email}
            className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            <Mail className="w-4 h-4" />
            {envoiEmail ? "Envoi..." : "Envoyer par email"}
          </button>
          <button
            onClick={() => {
              if (!id) {
                toast.error("ID du document manquant");
                return;
              }
              const url = `/api/documents/${id}/pdf?type=invoice`;
              console.log("Opening PDF URL:", url);
              window.open(url, "_blank");
            }}
            disabled={!id}
            className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            <Eye className="w-4 h-4" />
            Prévisualiser PDF
          </button>
          <button
            onClick={() => {
              if (!id) {
                toast.error("ID du document manquant");
                return;
              }
              const url = `/api/documents/${id}/pdf?type=invoice&download=true`;
              console.log("Downloading PDF URL:", url);
              const link = document.createElement("a");
              link.href = url;
              link.download = `organa-invoice-${facture?.numero || id}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            disabled={!id}
            className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            <Download className="w-4 h-4" />
            Télécharger PDF
          </button>
          {facture.statut !== "paye" && (
            <button
              onClick={handleCreerTacheRelance}
              className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-white font-medium transition-all flex items-center gap-2 border border-subtle"
            >
              <FileText className="w-4 h-4" />
              Créer tâche de relance
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all flex items-center gap-2"
          >
            <Trash className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Informations */}
      <div className="rounded-xl border border-subtle bg-surface p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-secondary">Date de création</label>
            <p className="font-medium">{facture.dateCreation}</p>
          </div>
          {facture.dateEcheance && (
            <div>
              <label className="text-sm text-secondary">Date d'échéance</label>
              <p className="font-medium">{facture.dateEcheance}</p>
            </div>
          )}
          {facture.datePaiement && (
            <div>
              <label className="text-sm text-secondary">Date de paiement</label>
              <p className="font-medium">{facture.datePaiement}</p>
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="text-sm text-secondary mb-2 block">Statut</label>
          <select
            value={facture.statut}
            onChange={(e) =>
              handleChangerStatut(
                e.target.value as "brouillon" | "envoye" | "paye" | "en-retard"
              )
            }
            className="rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          >
            <option value="brouillon">Brouillon</option>
            <option value="envoye">Envoyée</option>
            <option value="paye">Payée</option>
            <option value="en-retard">En retard</option>
          </select>
        </div>
        {facture.notes && (
          <div>
            <label className="text-sm text-secondary mb-2 block">Notes</label>
            <p className="text-primary">{facture.notes}</p>
          </div>
        )}
      </div>

      {/* Lignes */}
      <div className="rounded-xl border border-subtle bg-surface p-6">
        <h2 className="text-xl font-semibold mb-4">Lignes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-primary">
                  Désignation
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-primary">
                  Quantité
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-primary">
                  Prix unitaire
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-primary">
                  TVA
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-primary">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {facture.lignes && facture.lignes.length > 0 ? (
                facture.lignes.map((ligne) => {
                  if (!ligne) return null;
                  const sousTotal = (ligne.quantite || 0) * (ligne.prixUnitaire || 0);
                  return (
                    <tr key={ligne.id || Math.random()}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{ligne.designation || ""}</div>
                        {ligne.description && (
                          <div className="text-sm text-secondary mt-1 whitespace-pre-line">
                            {ligne.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{ligne.quantite || 0}</td>
                      <td className="px-4 py-3 text-right">
                        {formatMontant(ligne.prixUnitaire || 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {ligne.tva || 0}%
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatMontant(sousTotal)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-center text-secondary">
                    Aucune ligne
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="mt-6 pt-6 border-t border-subtle space-y-2 text-right">
          <div className="flex justify-between text-secondary">
            <span>Total HT:</span>
            <span>{formatMontant(totalHT)}</span>
          </div>
          <div className="flex justify-between text-secondary">
            <span>TVA:</span>
            <span>{formatMontant(totalTVA)}</span>
          </div>
          <div className="flex justify-between text-2xl font-bold pt-2">
            <span>Total TTC:</span>
            <span>{formatMontant(totalTTC)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}




