"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";

type MarketingContact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  source: string;
  unsubscribed: boolean;
};

type MarketingCampaign = {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "sending" | "sent" | "failed";
  recipient_count: number;
  sent_at: string | null;
  created_at: string;
};

type AudienceMode = "all" | "source" | "manual";

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-CH");
};

export default function MarketingCampaignsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"contacts" | "campaigns">("contacts");
  const [loading, setLoading] = useState(true);

  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [contentHtml, setContentHtml] = useState("<p>Bonjour,</p><p>Votre message ici.</p>");
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("all");
  const [audienceSource, setAudienceSource] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [savingContact, setSavingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    lastName: "",
    firstName: "",
    email: "",
    phone: "",
    source: "",
  });

  const activeContacts = useMemo(() => contacts.filter((contact) => !contact.unsubscribed), [contacts]);

  const refreshContacts = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchEmail.trim()) params.set("search", searchEmail.trim());
    if (sourceFilter) params.set("source", sourceFilter);

    const res = await fetch(`/api/marketing/contacts?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Erreur chargement contacts");
    }

    setContacts(data.contacts || []);
    setSources(data.sources || []);
  }, [searchEmail, sourceFilter]);

  const refreshCampaigns = useCallback(async () => {
    const res = await fetch("/api/marketing/campaigns", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Erreur chargement campagnes");
    }
    setCampaigns(data.campaigns || []);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshContacts(), refreshCampaigns()]);
    } catch (error) {
      console.error("[MARKETING][page] load error:", error);
      alert(error instanceof Error ? error.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [refreshCampaigns, refreshContacts]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = contentHtml;
    }
  }, [contentHtml]);

  useEffect(() => {
    if (!loading) {
      void refreshContacts();
    }
  }, [loading, refreshContacts]);

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Supprimer ce contact ?")) return;

    try {
      const res = await fetch(`/api/marketing/contacts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur suppression");
      }
      await refreshContacts();
    } catch (error) {
      console.error("[MARKETING][contacts] delete error:", error);
      alert(error instanceof Error ? error.message : "Erreur suppression");
    }
  };

  const openCreateContactModal = () => {
    setEditingContactId(null);
    setContactForm({
      lastName: "",
      firstName: "",
      email: "",
      phone: "",
      source: "",
    });
    setContactModalOpen(true);
  };

  const openEditContactModal = (contact: MarketingContact) => {
    setEditingContactId(contact.id);
    setContactForm({
      lastName: contact.last_name || "",
      firstName: contact.first_name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      source: contact.source || "",
    });
    setContactModalOpen(true);
  };

  const closeContactModal = () => {
    setContactModalOpen(false);
    setEditingContactId(null);
  };

  const handleSaveContact = async (event: FormEvent) => {
    event.preventDefault();
    setSavingContact(true);

    try {
      const payload = {
        lastName: contactForm.lastName,
        firstName: contactForm.firstName,
        email: contactForm.email,
        phone: contactForm.phone,
        source: contactForm.source,
      };

      const isEdit = Boolean(editingContactId);
      const endpoint = isEdit
        ? `/api/marketing/contacts/${editingContactId}`
        : "/api/marketing/contacts";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur enregistrement contact");
      }

      closeContactModal();
      await refreshContacts();
    } catch (error) {
      console.error("[MARKETING][contacts] save error:", error);
      alert(error instanceof Error ? error.message : "Erreur enregistrement");
    } finally {
      setSavingContact(false);
    }
  };

  const toggleManualContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const applyEditorCommand = (command: "bold" | "italic" | "insertUnorderedList") => {
    editorRef.current?.focus();
    document.execCommand(command);
    setContentHtml(editorRef.current?.innerHTML || "");
  };

  const handleSendCampaign = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);

    try {
      const payload = {
        name,
        subject,
        contentHtml,
        sendTo: audienceMode,
        source: audienceMode === "source" ? audienceSource : null,
        contactIds: audienceMode === "manual" ? selectedContactIds : [],
      };

      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur envoi campagne");
      }

      alert(
        `Campagne envoyée : ${data.sentCount || 0}/${data.recipientCount || 0} emails`
      );
      setName("");
      setSubject("");
      setContentHtml("<p>Bonjour,</p><p>Votre message ici.</p>");
      if (editorRef.current) editorRef.current.innerHTML = "<p>Bonjour,</p><p>Votre message ici.</p>";
      setSelectedContactIds([]);
      await Promise.all([refreshContacts(), refreshCampaigns()]);
    } catch (error) {
      console.error("[MARKETING][campaigns] send error:", error);
      alert(error instanceof Error ? error.message : "Erreur envoi campagne");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center text-slate-500">
        {t("dashboard.marketing.loading")}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-2 inline-flex gap-2">
        <button
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            activeTab === "contacts"
              ? "bg-[var(--obillz-hero-blue)] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          onClick={() => setActiveTab("contacts")}
        >
          {t("dashboard.marketing.tabs.contacts")}
        </button>
        <button
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            activeTab === "campaigns"
              ? "bg-[var(--obillz-hero-blue)] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          onClick={() => setActiveTab("campaigns")}
        >
          {t("dashboard.marketing.tabs.campaigns")}
        </button>
      </div>

      {activeTab === "contacts" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
              <input
                type="text"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder={t("dashboard.marketing.contacts.searchPlaceholder")}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">{t("dashboard.marketing.contacts.allSources")}</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            <DashboardPrimaryButton type="button" onClick={openCreateContactModal} className="whitespace-nowrap">
              {t("dashboard.marketing.contacts.addContact")}
            </DashboardPrimaryButton>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-3 pr-4">Nom</th>
                  <th className="py-3 pr-4">Prénom</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Téléphone</th>
                  <th className="py-3 pr-4">Source</th>
                  <th className="py-3 pr-0">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr>
                    <td className="py-6 text-slate-500" colSpan={6}>
                      Aucun contact pour le moment
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4">{contact.last_name || "-"}</td>
                      <td className="py-3 pr-4">{contact.first_name || "-"}</td>
                      <td className="py-3 pr-4">{contact.email}</td>
                      <td className="py-3 pr-4">{contact.phone || "-"}</td>
                      <td className="py-3 pr-4">{contact.source}</td>
                      <td className="py-3 pr-0 flex items-center gap-3">
                        <button
                          className="text-slate-700 hover:text-slate-900"
                          onClick={() => openEditContactModal(contact)}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          🗑 Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {contactModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={closeContactModal} />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editingContactId ? "Modifier un contact" : "Ajouter un contact"}
            </h3>

            <form onSubmit={handleSaveContact} className="space-y-3">
              <input
                type="text"
                value={contactForm.lastName}
                onChange={(e) => setContactForm((prev) => ({ ...prev, lastName: e.target.value }))}
                placeholder="Nom *"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
              <input
                type="text"
                value={contactForm.firstName}
                onChange={(e) => setContactForm((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="Prénom *"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email *"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
              <input
                type="text"
                value={contactForm.phone}
                onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Téléphone"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                type="text"
                value={contactForm.source}
                onChange={(e) => setContactForm((prev) => ({ ...prev, source: e.target.value }))}
                placeholder="Source"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />

              <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={closeContactModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingContact}
                  className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-60"
                  style={{ backgroundColor: "var(--obillz-hero-blue)" }}
                >
                  {savingContact ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "campaigns" && (
        <section className="space-y-6">
          <form
            onSubmit={handleSendCampaign}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
          >
            <h2 className="text-lg font-semibold">Créer une campagne</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom interne de la campagne"
                className="rounded-lg border border-slate-300 px-3 py-2"
                required
              />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet de l'email"
                className="rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Contenu (éditeur simple riche)</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                  onClick={() => applyEditorCommand("bold")}
                >
                  Gras
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                  onClick={() => applyEditorCommand("italic")}
                >
                  Italique
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
                  onClick={() => applyEditorCommand("insertUnorderedList")}
                >
                  Liste
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-40 rounded-lg border border-slate-300 p-3 focus:outline-none"
                onInput={(e) => setContentHtml(e.currentTarget.innerHTML)}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Envoyer à</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    checked={audienceMode === "all"}
                    onChange={() => setAudienceMode("all")}
                  />
                  Tous les contacts
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    checked={audienceMode === "source"}
                    onChange={() => setAudienceMode("source")}
                  />
                  Filtrer par source
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    checked={audienceMode === "manual"}
                    onChange={() => setAudienceMode("manual")}
                  />
                  Sélection manuelle
                </label>
              </div>

              {audienceMode === "source" && (
                <select
                  value={audienceSource}
                  onChange={(e) => setAudienceSource(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2"
                  required
                >
                  <option value="">Choisir une source</option>
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              )}

              {audienceMode === "manual" && (
                <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 p-3 space-y-2">
                  {activeContacts.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucun contact actif.</p>
                  ) : (
                    activeContacts.map((contact) => (
                      <label key={contact.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={() => toggleManualContact(contact.id)}
                        />
                        <span>
                          {contact.email} ({contact.first_name || "-"} {contact.last_name || "-"})
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 rounded-lg text-white font-medium disabled:opacity-60"
              style={{ backgroundColor: "var(--obillz-hero-blue)" }}
            >
              {sending ? "Envoi en cours..." : "Envoyer"}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Historique des campagnes</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-3 pr-4">Campagne</th>
                    <th className="py-3 pr-4">Objet</th>
                    <th className="py-3 pr-4">Date d&apos;envoi</th>
                    <th className="py-3 pr-4">Destinataires</th>
                    <th className="py-3 pr-0">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td className="py-6 text-slate-500" colSpan={5}>
                        Aucune campagne envoyée.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4">{campaign.name}</td>
                        <td className="py-3 pr-4">{campaign.subject}</td>
                        <td className="py-3 pr-4">{formatDate(campaign.sent_at || campaign.created_at)}</td>
                        <td className="py-3 pr-4">{campaign.recipient_count}</td>
                        <td className="py-3 pr-0">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              campaign.status === "sent"
                                ? "bg-emerald-100 text-emerald-700"
                                : campaign.status === "sending"
                                  ? "bg-blue-100 text-blue-700"
                                  : campaign.status === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {campaign.status === "sent"
                              ? "Envoyée"
                              : campaign.status === "sending"
                                ? "En cours"
                                : campaign.status === "failed"
                                  ? "Échec"
                                  : "Brouillon"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

