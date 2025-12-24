"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  devisAPI,
  facturesAPI,
  calculerTotalHT,
  calculerTVA,
  calculerTotalTTC,
  Devis,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils/currency";

export default function DevisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "";
  const [devis, setDevis] = useState<Devis | null>(null);
  const [envoiEmail, setEnvoiEmail] = useState(false);
  const [currency, setCurrency] = useState<string>("CHF");

  useEffect(() => {
    if (!id) {
      router.push("/tableau-de-bord/devis");
      return;
    }
    const devisItem = devisAPI.getById(id);
    if (!devisItem) {
      router.push("/tableau-de-bord/devis");
      return;
    }
    setDevis(devisItem);
    
    // Charger la devise depuis les settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.currency) {
          setCurrency(data.settings.currency);
        }
      })
      .catch((err) => {
        console.error("Erreur lors du chargement de la devise:", err);
      });
  }, [id, router]);

  const handleDelete = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) {
      devisAPI.delete(id);
      router.push("/tableau-de-bord/devis");
    }
  };

  const handleTransformerEnFacture = () => {
    if (confirm("Transformer ce devis en facture ?")) {
      const facture = devisAPI.transformerEnFacture(id);
      if (facture) {
        router.push(`/tableau-de-bord/factures/${facture.id}`);
      }
    }
  };

  const handleChangerStatut = (nouveauStatut: Devis["statut"]) => {
    if (devis) {
      devisAPI.update(id, { statut: nouveauStatut });
      setDevis({ ...devis, statut: nouveauStatut });
    }
  };

  const handleEnvoyerEmail = async () => {
    if (!devis || !devis.client?.email) {
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
          type: "devis",
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
      if (devis.statut === "brouillon") {
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

  if (!devis) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-white/70">Chargement...</p>
      </div>
    );
  }

  if (!devis.lignes || !Array.isArray(devis.lignes)) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-white/70">Erreur : données de devis invalides</p>
        <Link
          href="/tableau-de-bord/devis"
          className="text-white/70 hover:text-white mt-4 inline-block"
        >
          ← Retour aux devis
        </Link>
      </div>
    );
  }

  const totalHT = calculerTotalHT(devis.lignes);
  const totalTVA = calculerTVA(devis.lignes);
  const totalTTC = calculerTotalTTC(devis.lignes);

  const formatMontant = (montant: number) => {
    return formatCurrency(montant, currency);
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: "bg-gray-500/20 text-gray-300",
      envoye: "bg-blue-500/20 text-blue-300",
      accepte: "bg-green-500/20 text-green-300",
      refuse: "bg-red-500/20 text-red-300",
    };
    return colors[statut] || "bg-gray-500/20 text-gray-300";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/tableau-de-bord/devis"
            className="text-white/70 hover:text-white mb-2 inline-block"
          >
            ← Retour aux devis
          </Link>
          <h1 className="text-3xl font-bold">{devis.numero}</h1>
          <p className="mt-2 text-white/70">
            Client: {devis.client?.nom || "Client inconnu"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEnvoyerEmail}
            disabled={envoiEmail || !devis.client?.email}
            className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {envoiEmail ? "⏳ Envoi..." : "📧 Envoyer par email"}
          </button>
          <button
            onClick={() => {
              if (!id) {
                toast.error("ID du document manquant");
                return;
              }
              const url = `/api/documents/${id}/pdf?type=quote`;
              console.log("Opening PDF URL:", url);
              window.open(url, "_blank");
            }}
            disabled={!id}
            className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            👁️ Prévisualiser PDF
          </button>
          <button
            onClick={() => {
              if (!id) {
                toast.error("ID du document manquant");
                return;
              }
              const url = `/api/documents/${id}/pdf?type=quote&download=true`;
              console.log("Downloading PDF URL:", url);
              const link = document.createElement("a");
              link.href = url;
              link.download = `organa-quote-${devis?.numero || id}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            disabled={!id}
            className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📥 Télécharger PDF
          </button>
          <button
            onClick={handleTransformerEnFacture}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
          >
            ➡️ Transformer en facture
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-white/70">Date de création</label>
            <p className="font-medium">{devis.dateCreation}</p>
          </div>
          {devis.dateEcheance && (
            <div>
              <label className="text-sm text-white/70">Date d'échéance</label>
              <p className="font-medium">{devis.dateEcheance}</p>
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="text-sm text-white/70 mb-2 block">Statut</label>
          <select
            value={devis.statut}
            onChange={(e) =>
              handleChangerStatut(
                e.target.value as "brouillon" | "envoye" | "accepte" | "refuse"
              )
            }
            className="rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          >
            <option value="brouillon">Brouillon</option>
            <option value="envoye">Envoyé</option>
            <option value="accepte">Accepté</option>
            <option value="refuse">Refusé</option>
          </select>
        </div>
        {devis.notes && (
          <div>
            <label className="text-sm text-white/70 mb-2 block">Notes</label>
            <p className="text-white/90">{devis.notes}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4">Lignes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-white/90">
                  Désignation
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-white/90">
                  Quantité
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-white/90">
                  Prix unitaire
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-white/90">
                  TVA
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-white/90">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {devis.lignes && devis.lignes.length > 0 ? (
                devis.lignes.map((ligne) => {
                  if (!ligne) return null;
                  const sousTotal = (ligne.quantite || 0) * (ligne.prixUnitaire || 0);
                  return (
                    <tr key={ligne.id || Math.random()}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{ligne.designation || ""}</div>
                        {ligne.description && (
                          <div className="text-sm text-white/60 mt-1 whitespace-pre-line">
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
                  <td colSpan={5} className="px-4 py-3 text-center text-white/70">
                    Aucune ligne
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-right">
          <div className="flex justify-between text-white/70">
            <span>Total HT:</span>
            <span>{formatMontant(totalHT)}</span>
          </div>
          <div className="flex justify-between text-white/70">
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
