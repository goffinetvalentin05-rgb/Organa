"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  LigneDocument,
  calculerTotalHT,
  calculerTVA,
  calculerTotalTTC,
} from "@/lib/utils/calculations";
import { getErrorMessage } from "@/lib/utils/error-message";
import { Plus, Eye, Download, Trash, Loader } from "@/lib/icons";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  ActionButton,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import type { RecipientType } from "@/lib/documents/recipient";

interface Client {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  postal_code?: string | null;
  city?: string | null;
}

interface SponsorContract {
  id: string;
  sponsorName: string;
  title: string;
}

interface Event {
  id: string;
  name: string;
}

function NouvelleFacturePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [sponsors, setSponsors] = useState<SponsorContract[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [recipientType, setRecipientType] = useState<RecipientType>("member");
  const [clientId, setClientId] = useState("");
  const [sponsorContractId, setSponsorContractId] = useState("");
  const [extName, setExtName] = useState("");
  const [extContactName, setExtContactName] = useState("");
  const [extAddress, setExtAddress] = useState("");
  const [extPostalCode, setExtPostalCode] = useState("");
  const [extCity, setExtCity] = useState("");
  const [extCountry, setExtCountry] = useState("");
  const [extEmail, setExtEmail] = useState("");
  const [extPhone, setExtPhone] = useState("");
  const [eventId, setEventId] = useState("");
  const [lignes, setLignes] = useState<LigneDocument[]>([
    { id: "1", designation: "", quantite: 1, prixUnitaire: 0, tva: 7.7 },
  ]);
  const [statut, setStatut] = useState<"brouillon" | "envoye" | "paye" | "en-retard">("brouillon");
  const [dateEcheance, setDateEcheance] = useState("");
  const [datePaiement, setDatePaiement] = useState("");
  const [notes, setNotes] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [savingForPdf, setSavingForPdf] = useState(false);

  // Charger les clients et les événements depuis l'API Supabase
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const res = await fetch("/api/clients", { cache: "no-store" });
        if (!res.ok) {
          console.error("[Facture] Erreur chargement clients:", res.statusText);
          toast.error(t("dashboard.invoices.form.clientsLoadError"));
          return;
        }
        const data = await res.json();
        console.log(`[Facture] Clients source: API /api/clients, count=${data.clients?.length || 0}`);
        setClients(data.clients || []);
      } catch (error: unknown) {
        console.error("[Facture] Erreur chargement clients:", error);
        toast.error(t("dashboard.invoices.form.clientsLoadError"));
      } finally {
        setLoadingClients(false);
      }
    };

    const loadEvents = async () => {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch (error: unknown) {
        console.error("[Facture] Erreur chargement événements:", error);
      }
    };

    const loadSponsors = async () => {
      try {
        setLoadingSponsors(true);
        const res = await fetch("/api/sponsor-contracts", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSponsors(data.contracts || []);
        }
      } catch (error: unknown) {
        console.error("[Facture] Erreur chargement sponsors:", error);
      } finally {
        setLoadingSponsors(false);
      }
    };

    loadClients();
    loadSponsors();
    loadEvents();
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("eventId");
    if (fromUrl) {
      setEventId(fromUrl);
    }
  }, [searchParams]);

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

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedSponsor = sponsors.find((s) => s.id === sponsorContractId);

  const inputClassName =
    "w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]";

  const validateRecipient = (): boolean => {
    if (recipientType === "member" && !clientId) {
      toast.error(t("dashboard.invoices.form.selectClientError"));
      return false;
    }
    if (recipientType === "sponsor" && !sponsorContractId) {
      toast.error(t("dashboard.invoices.form.selectSponsorError"));
      return false;
    }
    if (recipientType === "external") {
      if (!extName.trim() || !extAddress.trim() || !extPostalCode.trim() || !extCity.trim()) {
        toast.error(t("dashboard.invoices.form.externalRequiredError"));
        return false;
      }
    }
    return true;
  };

  const buildDocumentBody = (lignesValides: LigneDocument[]) => ({
    type: "invoice" as const,
    recipientType,
    ...(recipientType === "member" ? { clientId } : {}),
    ...(recipientType === "sponsor" ? { sponsorContractId } : {}),
    ...(recipientType === "external"
      ? {
          recipientData: {
            name: extName.trim(),
            contactName: extContactName.trim() || undefined,
            address: extAddress.trim(),
            postalCode: extPostalCode.trim(),
            city: extCity.trim(),
            country: extCountry.trim() || undefined,
            email: extEmail.trim() || undefined,
            phone: extPhone.trim() || undefined,
          },
        }
      : {}),
    lignes: lignesValides,
    statut,
    dateCreation: new Date().toISOString().split("T")[0],
    ...(dateEcheance && dateEcheance.trim() !== "" ? { dateEcheance } : {}),
    ...(datePaiement && datePaiement.trim() !== "" ? { datePaiement } : {}),
    ...(notes && notes.trim() !== "" ? { notes } : {}),
    ...(eventId ? { eventId } : {}),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRecipient()) return;

    const lignesValides = lignes.filter(
      (l) => l.designation.trim() !== ""
    );

    if (lignesValides.length === 0) {
      toast.error(t("dashboard.invoices.form.lineRequiredError"));
      return;
    }

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildDocumentBody(lignesValides)),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("dashboard.invoices.form.createError"));
      }

      const data = await response.json();
      setDocumentId(data.id);
      console.log("[Facture] Facture créée via API avec ID:", data.id, "Numéro:", data.numero);
      router.push(`/tableau-de-bord/factures/${data.id}`);
    } catch (error: unknown) {
      console.error("[Facture] Erreur lors de la création:", error);
      toast.error(
        `${t("dashboard.invoices.form.createError")}: ${getErrorMessage(error)}`
      );
    }
  };

  // Fonction pour sauvegarder le document avant de générer le PDF
  const saveAndOpenPdf = async (download: boolean = false) => {
    if (!validateRecipient()) return;

    const lignesValides = lignes.filter(
      (l) => l.designation.trim() !== ""
    );

    if (lignesValides.length === 0) {
      toast.error(t("dashboard.invoices.form.lineRequiredError"));
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
            ...(eventId ? { eventId } : {}),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t("dashboard.invoices.form.createDocumentError"));
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
            ...buildDocumentBody(lignesValides),
            ...(dateEcheance && dateEcheance.trim() !== "" ? { dateEcheance } : { dateEcheance: null }),
            ...(datePaiement && datePaiement.trim() !== "" ? { datePaiement } : { datePaiement: null }),
            ...(notes && notes.trim() !== "" ? { notes } : { notes: null }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || t("dashboard.invoices.form.updateDocumentError"));
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
        link.download = `obillz-invoice-${numero || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, "_blank");
      }
    } catch (error: unknown) {
      console.error("Erreur lors de la sauvegarde pour PDF:", error);
      toast.error(
        `${t("dashboard.invoices.form.saveForPdfError")}: ${getErrorMessage(error)}`
      );
    } finally {
      setSavingForPdf(false);
    }
  };

  const totalHT = calculerTotalHT(lignes);
  const totalTVA = calculerTVA(lignes);
  const totalTTC = calculerTotalTTC(lignes);

  return (
    <PageLayout maxWidth="4xl">
      <PageHeader
        title={t("dashboard.invoices.form.title")}
        subtitle={t("dashboard.invoices.form.subtitle")}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard padding="lg" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.invoices.form.fields.recipientType")}
            </label>
            <div className="flex flex-wrap gap-2">
              {(["member", "sponsor", "external"] as RecipientType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRecipientType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    recipientType === type
                      ? "bg-[#7C5CFF] text-white border-[#7C5CFF]"
                      : "bg-surface text-primary border-subtle-hover hover:border-[#7C5CFF]/50"
                  }`}
                >
                  {t(`dashboard.invoices.form.recipientTypes.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {recipientType === "member" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t("dashboard.invoices.form.fields.member")}
                </label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={loadingClients}
                  className={`${inputClassName} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {loadingClients
                      ? t("dashboard.invoices.form.loadingClients")
                      : t("dashboard.invoices.form.selectClient")}
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nom}
                    </option>
                  ))}
                </select>
              </div>
              {selectedClient && (
                <div className="rounded-lg border border-subtle bg-surface-hover p-3 text-sm text-secondary space-y-1">
                  <p className="font-medium text-primary">{selectedClient.nom}</p>
                  {selectedClient.adresse && <p>{selectedClient.adresse}</p>}
                  {(selectedClient.postal_code || selectedClient.city) && (
                    <p>
                      {[selectedClient.postal_code, selectedClient.city]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  )}
                  {selectedClient.email && <p>{selectedClient.email}</p>}
                  {selectedClient.telephone && <p>{selectedClient.telephone}</p>}
                </div>
              )}
            </div>
          )}

          {recipientType === "sponsor" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t("dashboard.invoices.form.fields.sponsor")}
                </label>
                <select
                  required
                  value={sponsorContractId}
                  onChange={(e) => setSponsorContractId(e.target.value)}
                  disabled={loadingSponsors}
                  className={`${inputClassName} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {loadingSponsors
                      ? t("dashboard.invoices.form.loadingSponsors")
                      : t("dashboard.invoices.form.selectSponsor")}
                  </option>
                  {sponsors.map((sponsor) => (
                    <option key={sponsor.id} value={sponsor.id}>
                      {sponsor.sponsorName}
                      {sponsor.title ? ` — ${sponsor.title}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {selectedSponsor && (
                <div className="rounded-lg border border-subtle bg-surface-hover p-3 text-sm text-secondary space-y-1">
                  <p className="font-medium text-primary">{selectedSponsor.sponsorName}</p>
                  {selectedSponsor.title && (
                    <p>{t("dashboard.invoices.form.sponsorContract")}: {selectedSponsor.title}</p>
                  )}
                </div>
              )}
              {sponsors.length === 0 && !loadingSponsors && (
                <p className="text-sm text-secondary">
                  {t("dashboard.invoices.form.noSponsorsHint")}
                </p>
              )}
            </div>
          )}

          {recipientType === "external" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t("dashboard.invoices.form.fields.externalName")}
                </label>
                <input
                  type="text"
                  required
                  value={extName}
                  onChange={(e) => setExtName(e.target.value)}
                  className={inputClassName}
                  placeholder={t("dashboard.invoices.form.fields.externalNamePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t("dashboard.invoices.form.fields.externalContact")}
                </label>
                <input
                  type="text"
                  value={extContactName}
                  onChange={(e) => setExtContactName(e.target.value)}
                  className={inputClassName}
                  placeholder={t("dashboard.invoices.form.fields.externalContactPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t("dashboard.invoices.form.fields.externalAddress")}
                </label>
                <input
                  type="text"
                  required
                  value={extAddress}
                  onChange={(e) => setExtAddress(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    {t("dashboard.invoices.form.fields.externalPostalCode")}
                  </label>
                  <input
                    type="text"
                    required
                    value={extPostalCode}
                    onChange={(e) => setExtPostalCode(e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    {t("dashboard.invoices.form.fields.externalCity")}
                  </label>
                  <input
                    type="text"
                    required
                    value={extCity}
                    onChange={(e) => setExtCity(e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t("dashboard.invoices.form.fields.externalCountry")}
                </label>
                <input
                  type="text"
                  value={extCountry}
                  onChange={(e) => setExtCountry(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    {t("dashboard.invoices.form.fields.externalEmail")}
                  </label>
                  <input
                    type="email"
                    value={extEmail}
                    onChange={(e) => setExtEmail(e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    {t("dashboard.invoices.form.fields.externalPhone")}
                  </label>
                  <input
                    type="tel"
                    value={extPhone}
                    onChange={(e) => setExtPhone(e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.common.status")}
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
            <option value="brouillon">{t("dashboard.status.invoice.draft")}</option>
            <option value="envoye">{t("dashboard.status.invoice.sent")}</option>
            <option value="paye">{t("dashboard.status.invoice.paid")}</option>
            <option value="en-retard">{t("dashboard.status.invoice.overdue")}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.invoices.form.fields.dueDate")}
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
                {t("dashboard.invoices.form.fields.paymentDate")}
              </label>
              <input
                type="date"
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>
          </div>

          {events.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.events.fields.type")} (optionnel)
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              >
                <option value="">— Aucun événement lié —</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </GlassCard>

        <GlassCard padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">{t("dashboard.invoices.form.lines.title")}</h2>
            <ActionButton type="button" onClick={ajouterLigne} className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t("dashboard.invoices.form.lines.add")}
            </ActionButton>
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
                      {t("dashboard.invoices.form.lines.titleLabel")}
                    </label>
                    <input
                      type="text"
                      value={ligne.designation}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          designation: e.target.value,
                        })
                      }
                      placeholder={t("dashboard.invoices.form.lines.titlePlaceholder")}
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-primary mb-2">
                      {t("dashboard.invoices.form.lines.descriptionLabel")}
                    </label>
                    <textarea
                      value={ligne.description || ""}
                      onChange={(e) =>
                        modifierLigne(ligne.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder={t("dashboard.invoices.form.lines.descriptionPlaceholder")}
                      rows={3}
                      className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      {t("dashboard.invoices.form.lines.quantity")}
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
                      {t("dashboard.invoices.form.lines.unitPrice")}
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
                      {t("dashboard.invoices.form.lines.vat")}
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
                      {t("dashboard.invoices.form.lines.subtotal")}{" "}
                      {new Intl.NumberFormat(localeToIntl[locale], {
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
                        {t("dashboard.common.delete")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard padding="lg">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">{t("dashboard.invoices.form.fields.notes")}</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={t("dashboard.invoices.form.fields.notesPlaceholder")}
            className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
          />
        </GlassCard>

        <GlassCard padding="lg">
          <div className="space-y-2 text-right">
            <div className="flex justify-between text-slate-600">
              <span>{t("dashboard.common.totalHT")}</span>
              <span>
                {new Intl.NumberFormat(localeToIntl[locale], {
                  style: "currency",
                  currency: "CHF",
                }).format(totalHT)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t("dashboard.common.vatLabel")}</span>
              <span>
                {new Intl.NumberFormat(localeToIntl[locale], {
                  style: "currency",
                  currency: "CHF",
                }).format(totalTVA)}
              </span>
            </div>
            <div className="flex justify-between text-2xl font-bold pt-2 border-t border-slate-200/70 text-slate-900">
              <span>{t("dashboard.common.totalTTC")}</span>
              <span>
                {new Intl.NumberFormat(localeToIntl[locale], {
                  style: "currency",
                  currency: "CHF",
                }).format(totalTTC)}
              </span>
            </div>
          </div>
        </GlassCard>

        <div className="flex flex-wrap items-center gap-3">
          <ActionButton type="button" onClick={() => router.back()} className="flex-1 justify-center min-w-[150px]">
            {t("dashboard.common.cancel")}
          </ActionButton>
          <ActionButton
            type="button"
            onClick={() => saveAndOpenPdf(false)}
            disabled={savingForPdf}
            className="inline-flex items-center gap-2 disabled:opacity-50"
          >
            {savingForPdf ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t("dashboard.invoices.form.saving")}
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                {t("dashboard.invoices.form.previewPdf")}
              </>
            )}
          </ActionButton>
          <ActionButton
            type="button"
            onClick={() => saveAndOpenPdf(true)}
            disabled={savingForPdf}
            className="inline-flex items-center gap-2 disabled:opacity-50"
          >
            {savingForPdf ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t("dashboard.invoices.form.saving")}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t("dashboard.invoices.form.downloadPdf")}
              </>
            )}
          </ActionButton>
          <DashboardPrimaryButton type="submit" icon="none" className="flex-1 justify-center min-w-[180px] rounded-xl">
            {t("dashboard.invoices.form.createAction")}
          </DashboardPrimaryButton>
        </div>
      </form>
    </PageLayout>
  );
}

export default function NouvelleFacturePage() {
  return (
    <Suspense fallback={<PageLayout maxWidth="4xl" stack="none" className="py-8 text-white/80">…</PageLayout>}>
      <NouvelleFacturePageContent />
    </Suspense>
  );
}





