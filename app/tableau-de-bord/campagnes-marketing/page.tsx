"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import DraftAutosaveHint from "@/components/DraftAutosaveHint";
import { Edit, Trash, Mail, Users, CheckCircle } from "@/lib/icons";
import {
  PageLayout,
  PageHeader,
  SectionCard,
  EmptyState,
  StatCard,
  ActionButton,
  EntityCard,
  EntityCardList,
  EntityAvatar,
  EntityMetaRow,
  DashboardBadge,
  cn,
  dashboardGlassCardClass,
  dashboardInputClass,
  dashboardSelectLgClass,
  dashboardLabelClass,
  dashboardModalClass,
  dashboardCheckboxClass,
} from "@/components/ui";
import { useSafeSubmit } from "@/hooks/useSafeSubmit";
import { useAutoDraft } from "@/hooks/useAutoDraft";
import { usePermissions } from "@/lib/auth/permissions-client";
import { idempotentFetch } from "@/lib/api/idempotentFetch";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  emptyMarketingCampaignDraftData,
  marketingCampaignDraftStore,
  type MarketingCampaignDraftData,
} from "@/lib/drafts/marketingCampaignDraft";

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

type AudienceMode = MarketingCampaignDraftData["audienceMode"];

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("fr-CH");
};

function contactDisplayName(contact: MarketingContact) {
  const full = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
  return full || contact.email;
}

export default function MarketingCampaignsPage() {
  const { t } = useI18n();
  const { clubId, loading: clubLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState<"contacts" | "campaigns">("contacts");
  const [loading, setLoading] = useState(true);

  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const {
    isSubmitting: sending,
    showOverlay: showCampaignOverlay,
    run: runCampaignSend,
  } = useSafeSubmit({ overlayDelayMs: 450 });
  const {
    isSubmitting: savingContact,
    showOverlay: showContactOverlay,
    run: runContactSave,
  } = useSafeSubmit({ overlayDelayMs: 450 });
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [contentHtml, setContentHtml] = useState("<p>Bonjour,</p><p>Votre message ici.</p>");
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("all");
  const [audienceSource, setAudienceSource] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    lastName: "",
    firstName: "",
    email: "",
    phone: "",
    source: "",
  });

  const draftData = useMemo<MarketingCampaignDraftData>(
    () => ({
      name,
      subject,
      contentHtml,
      audienceMode,
      audienceSource,
      selectedContactIds,
    }),
    [name, subject, contentHtml, audienceMode, audienceSource, selectedContactIds]
  );

  const applyDraftData = useCallback((data: MarketingCampaignDraftData) => {
    setName(data.name);
    setSubject(data.subject);
    setContentHtml(data.contentHtml);
    setAudienceMode(data.audienceMode);
    setAudienceSource(data.audienceSource);
    setSelectedContactIds(data.selectedContactIds);
    if (editorRef.current) {
      editorRef.current.innerHTML = data.contentHtml;
    }
  }, []);

  const resetDraftForm = useCallback(() => {
    applyDraftData(emptyMarketingCampaignDraftData());
  }, [applyDraftData]);

  const { clearDraft, showDraftStatus, draftStatusLabel, draftHydrated } = useAutoDraft({
    store: marketingCampaignDraftStore,
    clubId,
    clubLoading,
    data: draftData,
    onRestore: applyDraftData,
    onEmpty: resetDraftForm,
  });

  // Sync contentEditable après hydratation / ouverture de l’onglet campagnes.
  useEffect(() => {
    if (!draftHydrated || activeTab !== "campaigns") return;
    if (!editorRef.current) return;
    editorRef.current.innerHTML = contentHtml;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on tab/hydrate only
  }, [draftHydrated, activeTab]);

  const activeContacts = useMemo(() => contacts.filter((contact) => !contact.unsubscribed), [contacts]);
  const campaignsSent = useMemo(
    () => campaigns.filter((c) => c.status === "sent").length,
    [campaigns],
  );

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
    if (!confirm(t("dashboard.marketing.contacts.deleteConfirm"))) return;

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
    if (savingContact) return;

    await runContactSave(async (idempotencyKey) => {
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

        const res = isEdit
          ? await fetch(endpoint, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await idempotentFetch(endpoint, {
              method,
              headers: { "Content-Type": "application/json" },
              idempotencyKey,
              body: JSON.stringify(payload),
            });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erreur enregistrement contact");
        }

        closeContactModal();
        await refreshContacts();
        notifySuccess(
          isEdit ? "Contact mis à jour ✓" : "Contact créé ✓",
          "marketing-contact-save"
        );
      } catch (error) {
        console.error("[MARKETING][contacts] save error:", error);
        notifyError(
          error instanceof Error ? error.message : "Erreur enregistrement",
          "marketing-contact-save"
        );
      }
    });
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
    if (sending) return;

    await runCampaignSend(async (idempotencyKey) => {
      try {
        const payload = {
          name,
          subject,
          contentHtml,
          sendTo: audienceMode,
          source: audienceMode === "source" ? audienceSource : null,
          contactIds: audienceMode === "manual" ? selectedContactIds : [],
        };

        const res = await idempotentFetch("/api/marketing/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          idempotencyKey,
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erreur envoi campagne");
        }

        clearDraft();
        notifySuccess(
          `Campagne envoyée : ${data.sentCount || 0}/${data.recipientCount || 0} emails`,
          "marketing-campaign-send"
        );
        setName("");
        setSubject("");
        setContentHtml("<p>Bonjour,</p><p>Votre message ici.</p>");
        if (editorRef.current) {
          editorRef.current.innerHTML = "<p>Bonjour,</p><p>Votre message ici.</p>";
        }
        setSelectedContactIds([]);
        setAudienceMode("all");
        setAudienceSource("");
        await Promise.all([refreshContacts(), refreshCampaigns()]);
      } catch (error) {
        console.error("[MARKETING][campaigns] send error:", error);
        notifyError(
          error instanceof Error ? error.message : "Erreur envoi campagne",
          "marketing-campaign-send"
        );
      }
    });
  };

  const campaignStatusBadge = (status: MarketingCampaign["status"]) => {
    const variant =
      status === "sent"
        ? "success"
        : status === "sending"
          ? "info"
          : status === "failed"
            ? "danger"
            : "neutral";
    return (
      <DashboardBadge variant={variant}>
        {t(`dashboard.marketing.campaigns.status.${status}`)}
      </DashboardBadge>
    );
  };

  if (loading) {
    return (
      <PageLayout maxWidth="7xl">
        <div className="flex items-center justify-center py-20 text-[#64748B]">
          {t("dashboard.marketing.loading")}
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <SubmittingOverlay
        visible={showCampaignOverlay || showContactOverlay}
        message={showCampaignOverlay ? "Envoi de la campagne…" : "Enregistrement…"}
      />
      <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.pageTitles.marketing")}
        subtitle={t("dashboard.marketing.subtitle")}
      />

      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        <StatCard
          label={t("dashboard.marketing.stats.contacts")}
          value={contacts.length}
          icon={Users}
          accent="electric"
        />
        <StatCard
          label={t("dashboard.marketing.stats.campaignsSent")}
          value={campaignsSent}
          icon={Mail}
          accent="royal"
        />
        <StatCard
          label={t("dashboard.marketing.stats.openRate")}
          value="—"
          icon={CheckCircle}
          accent="cyan"
        />
      </div>

      <div
        className={cn(
          "inline-flex w-full max-w-md rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] p-1.5",
          "shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        )}
        role="tablist"
        aria-label={t("dashboard.pageTitles.marketing")}
      >
        {(
          [
            ["contacts", t("dashboard.marketing.tabs.contacts")],
            ["campaigns", t("dashboard.marketing.tabs.campaigns")],
          ] as const
        ).map(([key, label]) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-250",
                active
                  ? "bg-gradient-to-r from-[#2563EB] via-[#1A23FF] to-[#151dd9] text-white shadow-[0_4px_14px_rgba(26,35,255,0.28)]"
                  : "text-[#64748B] hover:bg-white hover:text-[#0F172A]",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === "contacts" ? (
        <div className="space-y-5 sm:space-y-6">
          <div
            className={cn(
              dashboardGlassCardClass,
              "flex flex-col gap-3 p-4 transition-shadow duration-250 sm:flex-row sm:items-center sm:gap-4 sm:p-5",
            )}
          >
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder={t("dashboard.marketing.contacts.searchPlaceholder")}
              className={cn(dashboardInputClass, "sm:flex-1")}
            />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className={cn(dashboardSelectLgClass, "sm:w-56")}
            >
              <option value="">{t("dashboard.marketing.contacts.allSources")}</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            <DashboardPrimaryButton
              type="button"
              onClick={openCreateContactModal}
              className="w-full justify-center whitespace-nowrap sm:w-auto"
            >
              {t("dashboard.marketing.contacts.addContact")}
            </DashboardPrimaryButton>
          </div>

          {contacts.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("dashboard.marketing.contacts.empty")}
              description={t("dashboard.marketing.contacts.emptyDescription")}
              action={
                <DashboardPrimaryButton type="button" onClick={openCreateContactModal}>
                  {t("dashboard.marketing.contacts.addContact")}
                </DashboardPrimaryButton>
              }
            />
          ) : (
            <EntityCardList>
              {contacts.map((contact) => {
                const displayName = contactDisplayName(contact);
                return (
                  <EntityCard
                    key={contact.id}
                    layout="row"
                    leading={<EntityAvatar label={displayName} size="sm" />}
                    title={displayName}
                    subtitle={contact.email}
                    badges={
                      <>
                        {contact.source ? (
                          <DashboardBadge variant="info">{contact.source}</DashboardBadge>
                        ) : null}
                        {contact.unsubscribed ? (
                          <DashboardBadge variant="warning">
                            {t("dashboard.marketing.contacts.unsubscribed")}
                          </DashboardBadge>
                        ) : null}
                      </>
                    }
                    meta={
                      <>
                        <EntityMetaRow
                          inline
                          label={t("dashboard.marketing.contacts.columns.phone")}
                          value={contact.phone || "—"}
                        />
                        {contact.first_name || contact.last_name ? (
                          <EntityMetaRow
                            inline
                            label={t("dashboard.marketing.contacts.columns.email")}
                            value={contact.email}
                          />
                        ) : null}
                      </>
                    }
                    actions={
                      <>
                        <ActionButton
                          type="button"
                          onClick={() => openEditContactModal(contact)}
                          className="inline-flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          {t("dashboard.marketing.contacts.edit")}
                        </ActionButton>
                        <ActionButton
                          type="button"
                          variant="dangerSoft"
                          onClick={() => void handleDeleteContact(contact.id)}
                          className="inline-flex items-center gap-2"
                        >
                          <Trash className="h-4 w-4" />
                          {t("dashboard.marketing.contacts.delete")}
                        </ActionButton>
                      </>
                    }
                  />
                );
              })}
            </EntityCardList>
          )}
        </div>
      ) : null}

      {contactModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-250"
            onClick={closeContactModal}
          />
          <div className={cn(dashboardModalClass, "relative z-[1] w-full max-w-lg p-6 sm:p-7")}>
            <h3 className="mb-5 text-lg font-semibold tracking-tight text-[#0F172A]">
              {editingContactId
                ? t("dashboard.marketing.contacts.modalEditTitle")
                : t("dashboard.marketing.contacts.modalAddTitle")}
            </h3>

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className={dashboardLabelClass}>
                  {t("dashboard.marketing.contacts.columns.lastName")} *
                </label>
                <input
                  type="text"
                  value={contactForm.lastName}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className={dashboardInputClass}
                  required
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>
                  {t("dashboard.marketing.contacts.columns.firstName")} *
                </label>
                <input
                  type="text"
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className={dashboardInputClass}
                  required
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>
                  {t("dashboard.marketing.contacts.columns.email")} *
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={dashboardInputClass}
                  required
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>
                  {t("dashboard.marketing.contacts.columns.phone")}
                </label>
                <input
                  type="text"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className={dashboardInputClass}
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>
                  {t("dashboard.marketing.contacts.columns.source")}
                </label>
                <input
                  type="text"
                  value={contactForm.source}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, source: e.target.value }))}
                  className={dashboardInputClass}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <ActionButton type="button" onClick={closeContactModal}>
                  {t("dashboard.marketing.contacts.cancel")}
                </ActionButton>
                <DashboardPrimaryButton
                  type="submit"
                  icon="none"
                  disabled={savingContact}
                  className="justify-center"
                >
                  {savingContact
                    ? t("dashboard.common.saving")
                    : t("dashboard.marketing.contacts.save")}
                </DashboardPrimaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {activeTab === "campaigns" ? (
        <div className="space-y-6 sm:space-y-8">
          <SectionCard
            icon={Mail}
            title={t("dashboard.marketing.campaigns.createTitle")}
            description={t("dashboard.marketing.subtitle")}
          >
            <DraftAutosaveHint show={showDraftStatus} label={draftStatusLabel} />
            <form onSubmit={handleSendCampaign} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={dashboardLabelClass}>
                    {t("dashboard.marketing.campaigns.nameLabel")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={dashboardInputClass}
                    required
                  />
                </div>
                <div>
                  <label className={dashboardLabelClass}>
                    {t("dashboard.marketing.campaigns.subjectLabel")}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={dashboardInputClass}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <p className={dashboardLabelClass}>Contenu</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["bold", "Gras"],
                      ["italic", "Italique"],
                      ["insertUnorderedList", "Liste"],
                    ] as const
                  ).map(([cmd, label]) => (
                    <ActionButton
                      key={cmd}
                      type="button"
                      onClick={() => applyEditorCommand(cmd)}
                      className="!px-3 !py-1.5 text-xs"
                    >
                      {label}
                    </ActionButton>
                  ))}
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className={cn(
                    dashboardInputClass,
                    "min-h-40 py-3 focus:outline-none [&>p]:mb-2",
                  )}
                  onInput={(e) => setContentHtml(e.currentTarget.innerHTML)}
                />
              </div>

              <div className="space-y-3">
                <p className={dashboardLabelClass}>
                  {t("dashboard.marketing.campaigns.audienceLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["all", t("dashboard.marketing.campaigns.audienceAll")],
                      ["source", t("dashboard.marketing.campaigns.audienceSource")],
                      ["manual", t("dashboard.marketing.campaigns.audienceManual")],
                    ] as const
                  ).map(([mode, label]) => {
                    const active = audienceMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setAudienceMode(mode)}
                        className={cn(
                          "rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-250",
                          active
                            ? "border-[rgba(26,35,255,0.28)] bg-[rgba(26,35,255,0.08)] text-[#1A23FF]"
                            : "border-[rgba(15,23,42,0.1)] bg-white text-[#64748B] hover:border-[rgba(26,35,255,0.16)] hover:text-[#0F172A]",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {audienceMode === "source" ? (
                  <select
                    value={audienceSource}
                    onChange={(e) => setAudienceSource(e.target.value)}
                    className={dashboardSelectLgClass}
                    required
                  >
                    <option value="">Choisir une source</option>
                    {sources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                ) : null}

                {audienceMode === "manual" ? (
                  <div className="max-h-48 space-y-2 overflow-auto rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] p-4">
                    {activeContacts.length === 0 ? (
                      <p className="text-sm text-[#64748B]">Aucun contact actif.</p>
                    ) : (
                      activeContacts.map((contact) => (
                        <label
                          key={contact.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm text-[#0F172A] transition-colors duration-200 hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            className={dashboardCheckboxClass}
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
                ) : null}
              </div>

              <DashboardPrimaryButton
                type="submit"
                icon="none"
                disabled={sending}
                className="w-full justify-center sm:w-auto"
              >
                {sending
                  ? t("dashboard.marketing.campaigns.sending")
                  : t("dashboard.marketing.campaigns.send")}
              </DashboardPrimaryButton>
            </form>
          </SectionCard>

          <div className="space-y-4">
            <h2 className="text-base font-semibold tracking-tight text-[#0F172A] sm:text-lg">
              {t("dashboard.marketing.campaigns.historyTitle")}
            </h2>

            {campaigns.length === 0 ? (
              <EmptyState
                icon={Mail}
                title={t("dashboard.marketing.campaigns.empty")}
                description={t("dashboard.marketing.campaigns.emptyDescription")}
              />
            ) : (
              <EntityCardList>
                {campaigns.map((campaign) => (
                  <EntityCard
                    key={campaign.id}
                    layout="row"
                    leading={
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4F57FF] via-[#1A23FF] to-[#151dd9] text-white shadow-[0_4px_12px_rgba(26,35,255,0.22)]"
                        aria-hidden
                      >
                        <Mail className="h-5 w-5" />
                      </span>
                    }
                    title={campaign.name}
                    subtitle={campaign.subject}
                    status={campaignStatusBadge(campaign.status)}
                    meta={
                      <>
                        <EntityMetaRow
                          inline
                          label={t("dashboard.marketing.campaigns.recipients")}
                          value={String(campaign.recipient_count)}
                        />
                        <EntityMetaRow
                          inline
                          label="Date"
                          value={formatDate(campaign.sent_at || campaign.created_at)}
                        />
                      </>
                    }
                    amount={
                      <span className="text-base font-semibold tabular-nums text-[#0F172A] sm:text-lg">
                        {campaign.recipient_count}
                        <span className="ml-1.5 text-xs font-medium text-[#94A3B8]">
                          {t("dashboard.marketing.campaigns.recipients")}
                        </span>
                      </span>
                    }
                  />
                ))}
              </EntityCardList>
            )}
          </div>
        </div>
      ) : null}
      </PageLayout>
    </>
  );
}
