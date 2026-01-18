"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  LigneDocument,
  calculerTotalHT,
  calculerTVA,
  calculerTotalTTC,
} from "@/lib/utils/calculations";
import { Plus, Eye, Download, Trash, Loader } from "@/lib/icons";

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

export default function NouvelleFacturePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientId, setClientId] = useState("");
  const [lignes, setLignes] = useState<LigneDocument[]>([
    { id: "1", designation: "", quantite: 1, prixUnitaire: 0, tva: 7.7 },
  ]);
  const [statut, setStatut] = useState<"brouillon" | "envoye" | "paye" | "en-retard">("brouillon");
  const [dateEcheance, setDateEcheance] = useState("");
  const [datePaiement, setDatePaiement] = useState("");
  const [notes, setNotes] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [savingForPdf, setSavingForPdf] = useState(false);

  // Charger les clients depuis l'API Supabase
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const res = await fetch("/api/clients", { cache: "no-store" });
        if (!res.ok) {
          console.error("[Facture] Erreur chargement clients:", res.statusText);
          toast.error("Erreur lors du chargement des clients");
          return;
        }
        const data = await res.json();
        console.log(`[Facture] Clients source: API /api/clients, count=${data.clients?.length || 0}`);
        setClients(data.clients || []);
      } catch (error: any) {
        console.error("[Facture] Erreur chargement clients:", error);
        toast.error("Erreur lors du chargement des clients");
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      {
        id: Date.now().toString(),
        designation: "",
        quantite: 1,
        prixUnitaire: 0,
        tva: 7.7,
      },
    ]);
  };

  const supprimerLigne = (id: string) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((l) => l.id !== id));
    }
  };

  const modifierLigne = (
    id: string,
    updates: Partial<Omit<LigneDocument, "id">>
  ) => {
    setLignes(
      lignes.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    const lignesValides = lignes.filter(
      (l) => l.designation.trim() !== ""
    );

    if (lignesValides.length === 0) {
      toast.error("Veuillez ajouter au moins une ligne avec une désignation");
      return;
    }

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "invoice",
          clientId,
          lignes: lignesValides,
          statut,
          dateCreation: new Date().toISOString().split("T")[0],
          ...(dateEcheance && dateEcheance.trim() !== "" ? { dateEcheance } : {}),
          ...(datePaiement && datePaiement.trim() !== "" ? { datePaiement } : {}),
          ...(notes && notes.trim() !== "" ? { notes } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création de la facture");
      }

      const data = await response.json();
      setDocumentId(data.id);
      console.log("[Facture] Facture créée via API avec ID:", data.id, "Numéro:", data.numero);
      router.push(`/tableau-de-bord/factures/${data.id}`);
    } catch (error: any) {
      console.error("[Facture] Erreur lors de la création:", error);
      toast.error(`Erreur lors de la création de la facture: ${error.message || "Erreur inconnue"}`);
    }
  };

  // Fonction pour sauvegarder le document avant de générer le PDF
  const saveAndOpenPdf = async (download: boolean = false) => {
    // Validation
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    const lignesValides = lignes.filter(
      (l) => l.designation.trim() !== ""
    );

    if (lignesValides.length === 0) {
      toast.error("Veuillez ajouter au moins une ligne avec une désignation");
      return;
    }

    setSavingForPdf(true);

    try {
      let id = documentId;
      let numero: string | undefined;

      // Si le document n'existe pas encore, le créer via l'API
      if (!id) {
        const response = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "invoice",
            clientId,
            lignes: lignesValides,
            statut,
            dateCreation: new Date().toISOString().split("T")[0],
            ...(dateEcheance && dateEcheance.trim() !== "" ? { dateEcheance } : {}),
            ...(datePaiement && datePaiement.trim() !== "" ? { datePaiement } : {}),
            ...(notes && notes.trim() !== "" ? { notes } : {}),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de la création du document");
        }

        const data = await response.json();
        id = data.id.toString();
        numero = data.numero;
        setDocumentId(id);
        console.log("[Facture][PDF] Document créé via API avec ID:", id, "Numéro:", numero);
      } else {
        // Sinon, mettre à jour le document existant via l'API
        const response = await fetch("/api/documents", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            type: "invoice",
            clientId,
            lignes: lignesValides,
            statut,
            ...(dateEcheance && dateEcheance.trim() !== "" ? { dateEcheance } : { dateEcheance: null }),
            ...(datePaiement && datePaiement.trim() !== "" ? { datePaiement } : { datePaiement: null }),
            ...(notes && notes.trim() !== "" ? { notes } : { notes: null }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de la mise à jour du document");
        }

        const data = await response.json();
        numero = data.numero;
        console.log("[Facture][PDF] Document mis à jour via API avec ID:", id, "Numéro:", numero);
      }

      // Ouvrir le PDF
      const url = `/api/documents/${id}/pdf?type=invoice${download ? "&download=true" : ""}`;
      console.log("[Facture][PDF] Opening PDF URL:", url, "Document ID:", id);
      
      if (download) {
        const link = document.createElement("a");
        link.href = url;
        link.download = `organa-invoice-${numero || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, "_blank");
      }
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde pour PDF:", error);
      toast.error(`Impossible de sauvegarder le document: ${error.message || "Erreur inconnue"}`);
    } finally {
      setSavingForPdf(false);
    }
  };

  const totalHT = calculerTotalHT(lignes);
  const totalTVA = calculerTVA(lignes);
  const totalTTC = calculerTotalTTC(lignes);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nouvelle facture</h1>
        <p className="mt-2 text-secondary">Créer une nouvelle facture</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-subtle bg-surface p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Client *
            </label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={loadingClients}
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingClients ? "Chargement des clients..." : "Sélectionner un client"}
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Statut
            </label>
            <select
              value={statut}
              onChange={(e) =>
                setStatut(
                  e.target.value as "brouillon" | "envoye" | "paye" | "en-retard"
                )
              }
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            >
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoyée</option>
              <option value="paye">Payée</option>
              <option value="en-retard">En retard</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Date d'échéance
              </label>
              <input
                type="date"
                value={dateEcheance}
                onChange={(e) => setDateEcheance(e.target.value)}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Date de paiement
              </label>
              <input
                type="date"
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Lignes</h2>
            <button
              type="button"
              onClick={ajouterLigne}
              className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-primary transition-all text-sm flex items-center gap-2 border border-subtle"
            >
              <Plus className="w-4 h-4" />
              Ajouter une ligne
            </button>
          </div>

          <div className="space-y-4">
            {lignes.map((ligne) => (
              <div
                key={ligne.id}
                className="p-4 rounded-lg border border-subtle bg-surface-hover space-y-3"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-primary mb-2">
                      Titre de la prestation *
                    </label>
                    <input
                      type="text"
                      value={ligne.designation}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          designation: e.target.value,
                        })
                      }
                      placeholder="Description de la prestation"
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-primary mb-2">
                      Description (optionnelle)
                    </label>
                    <textarea
                      value={ligne.description || ""}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Détails supplémentaires de la prestation..."
                      rows={3}
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Quantité
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ligne.quantite}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          quantite: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Prix unitaire (CHF)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={ligne.prixUnitaire}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          prixUnitaire: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      TVA (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={ligne.tva || 0}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          tva: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <div className="text-sm text-secondary">
                      Sous-total:{" "}
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "CHF",
                      }).format(ligne.quantite * ligne.prixUnitaire)}
                    </div>
                    {lignes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => supprimerLigne(ligne.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm flex items-center gap-1.5"
                      >
                        <Trash className="w-4 h-4" />
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Notes additionnelles..."
            className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          />
        </div>

        <div className="rounded-xl border border-subtle bg-surface p-6">
          <div className="space-y-2 text-right">
            <div className="flex justify-between text-secondary">
              <span>Total HT:</span>
              <span>
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "CHF",
                }).format(totalHT)}
              </span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>TVA:</span>
              <span>
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "CHF",
                }).format(totalTVA)}
              </span>
            </div>
            <div className="flex justify-between text-2xl font-bold pt-2 border-t border-subtle">
              <span>Total TTC:</span>
              <span>
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "CHF",
                }).format(totalTTC)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary transition-all"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => saveAndOpenPdf(false)}
            disabled={savingForPdf}
            className="px-6 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            {savingForPdf ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Prévisualiser PDF
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => saveAndOpenPdf(true)}
            disabled={savingForPdf}
            className="px-6 py-3 rounded-lg bg-surface-hover hover:bg-surface text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-subtle"
          >
            {savingForPdf ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Télécharger PDF
              </>
            )}
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 rounded-lg accent-bg text-white font-medium transition-all"
          >
            Créer la facture
          </button>
        </div>
      </form>
    </div>
  );
}







