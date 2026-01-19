"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/components/I18nProvider";
import { Mail } from "@/lib/icons";
import type { AssistantContext, AssistantLocale } from "@/components/assistant/types";

type AssistantPanelProps = {
  isOpen: boolean;
  context: AssistantContext | null;
  onClose: () => void;
};

type AssistantAction = "compose" | "rephrase" | "translate";

type ComposeType = "invoice_followup" | "quote_send" | "payment_reminder" | "generic";

type RephraseTone = "professional" | "firm" | "courteous" | "correct";

const defaultComposeType: Record<AssistantContext["source"], ComposeType> = {
  dashboard: "generic",
  client: "generic",
  facture: "invoice_followup",
  devis: "quote_send",
};

function mapLocaleToLanguage(locale: AssistantLocale): string {
  if (locale === "en") return "English";
  if (locale === "de") return "Deutsch";
  return "Français";
}

export default function AssistantPanel({ isOpen, context, onClose }: AssistantPanelProps) {
  const { t, locale } = useI18n();
  const [activeAction, setActiveAction] = useState<AssistantAction>("compose");
  const [composeType, setComposeType] = useState<ComposeType>("generic");
  const [tone, setTone] = useState<RephraseTone>("professional");
  const [instruction, setInstruction] = useState("");
  const [inputText, setInputText] = useState("");
  const [emailLanguage, setEmailLanguage] = useState<AssistantLocale>(locale);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setEmailLanguage(locale);
  }, [locale]);

  useEffect(() => {
    if (context?.source) {
      setComposeType(defaultComposeType[context.source]);
      if (context.client?.email) {
        setRecipient(context.client.email);
      }
    }
  }, [context]);

  const contextSummary = useMemo(() => {
    if (!context) return null;
    const parts: string[] = [];
    if (context.client?.nom) {
      parts.push(`${t("dashboard.assistant.context.client")}: ${context.client.nom}`);
    }
    if (context.document?.numero) {
      parts.push(`${t("dashboard.assistant.context.document")}: ${context.document.numero}`);
    }
    if (context.document?.montant != null) {
      parts.push(`${t("dashboard.assistant.context.amount")}: ${context.document.montant}`);
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  }, [context, t]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: activeAction,
          language: emailLanguage,
          composeType,
          tone,
          instruction,
          input: activeAction === "compose" ? undefined : inputText || body,
          subject,
          context,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || t("dashboard.assistant.errors.generate"));
      }

      if (data.subject) {
        setSubject(data.subject);
      }
      if (data.body) {
        setBody(data.body);
        if (activeAction !== "compose") {
          setInputText(data.body);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || t("dashboard.assistant.errors.generate"));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!recipient || !subject || !body) {
      toast.error(t("dashboard.assistant.errors.missingFields"));
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/assistant/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          subject,
          content: body,
          language: emailLanguage,
          relatedType: context?.source || "dashboard",
          relatedId: context?.document?.id || context?.client?.id || null,
          clientId: context?.client?.id || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || t("dashboard.assistant.errors.send"));
      }

      toast.success(t("dashboard.assistant.messages.sent"));
    } catch (error: any) {
      toast.error(error?.message || t("dashboard.assistant.errors.send"));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl border-l border-subtle flex flex-col">
        <header className="px-6 py-5 border-b border-subtle flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-tertiary">
              {t("dashboard.assistant.badge")}
            </p>
            <h2 className="text-xl font-semibold text-primary">
              {t("dashboard.assistant.title")}
            </h2>
            <p className="text-sm text-secondary">
              {t("dashboard.assistant.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors text-sm"
          >
            {t("dashboard.assistant.close")}
          </button>
        </header>

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          {contextSummary && (
            <div className="rounded-xl border border-subtle bg-surface px-4 py-3 text-xs text-secondary">
              {contextSummary}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {(["compose", "rephrase", "translate"] as AssistantAction[]).map((action) => (
              <button
                key={action}
                onClick={() => setActiveAction(action)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  activeAction === action
                    ? "bg-accent-light border-accent-border text-primary"
                    : "border-subtle text-secondary hover:text-primary hover:bg-surface"
                }`}
              >
                {t(`dashboard.assistant.tabs.${action}`)}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-subtle bg-white p-4 space-y-4">
            <div>
              <label className="text-xs text-secondary mb-2 block">
                {t("dashboard.assistant.language")}
              </label>
              <select
                value={emailLanguage}
                onChange={(event) => setEmailLanguage(event.target.value as AssistantLocale)}
                className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
              >
                <option value="fr">{t("dashboard.assistant.languages.fr")}</option>
                <option value="en">{t("dashboard.assistant.languages.en")}</option>
                <option value="de">{t("dashboard.assistant.languages.de")}</option>
              </select>
            </div>

            {activeAction === "compose" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-secondary mb-2 block">
                    {t("dashboard.assistant.compose.typeLabel")}
                  </label>
                  <select
                    value={composeType}
                    onChange={(event) => setComposeType(event.target.value as ComposeType)}
                    className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                  >
                    <option value="invoice_followup">
                      {t("dashboard.assistant.compose.types.invoice_followup")}
                    </option>
                    <option value="quote_send">
                      {t("dashboard.assistant.compose.types.quote_send")}
                    </option>
                    <option value="payment_reminder">
                      {t("dashboard.assistant.compose.types.payment_reminder")}
                    </option>
                    <option value="generic">
                      {t("dashboard.assistant.compose.types.generic")}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-secondary mb-2 block">
                    {t("dashboard.assistant.compose.instructionLabel")}
                  </label>
                  <textarea
                    value={instruction}
                    onChange={(event) => setInstruction(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                    placeholder={t("dashboard.assistant.compose.instructionPlaceholder")}
                  />
                </div>
              </div>
            )}

            {activeAction === "rephrase" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-secondary mb-2 block">
                    {t("dashboard.assistant.rephrase.toneLabel")}
                  </label>
                  <select
                    value={tone}
                    onChange={(event) => setTone(event.target.value as RephraseTone)}
                    className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                  >
                    <option value="professional">
                      {t("dashboard.assistant.rephrase.tones.professional")}
                    </option>
                    <option value="firm">
                      {t("dashboard.assistant.rephrase.tones.firm")}
                    </option>
                    <option value="courteous">
                      {t("dashboard.assistant.rephrase.tones.courteous")}
                    </option>
                    <option value="correct">
                      {t("dashboard.assistant.rephrase.tones.correct")}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-secondary mb-2 block">
                    {t("dashboard.assistant.rephrase.sourceLabel")}
                  </label>
                  <textarea
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                    placeholder={t("dashboard.assistant.rephrase.sourcePlaceholder")}
                  />
                </div>
              </div>
            )}

            {activeAction === "translate" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-secondary mb-2 block">
                    {t("dashboard.assistant.translate.sourceLabel")}
                  </label>
                  <textarea
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                    placeholder={t("dashboard.assistant.translate.sourcePlaceholder")}
                  />
                </div>
                <p className="text-xs text-tertiary">
                  {t("dashboard.assistant.translate.note", {
                    language: mapLocaleToLanguage(emailLanguage),
                  })}
                </p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-lg accent-bg text-white px-4 py-2 text-sm font-semibold shadow-premium hover:shadow-premium-hover disabled:opacity-60"
            >
              {loading ? t("dashboard.assistant.generating") : t("dashboard.assistant.generate")}
            </button>
          </div>

          <div className="rounded-xl border border-subtle bg-white p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Mail className="w-4 h-4" />
              {t("dashboard.assistant.editor.title")}
            </div>
            <div>
              <label className="text-xs text-secondary mb-2 block">
                {t("dashboard.assistant.editor.recipient")}
              </label>
              <input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                placeholder={t("dashboard.assistant.editor.recipientPlaceholder")}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-2 block">
                {t("dashboard.assistant.editor.subject")}
              </label>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                placeholder={t("dashboard.assistant.editor.subjectPlaceholder")}
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-2 block">
                {t("dashboard.assistant.editor.body")}
              </label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={8}
                className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                placeholder={t("dashboard.assistant.editor.bodyPlaceholder")}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {sending ? t("dashboard.assistant.sending") : t("dashboard.assistant.send")}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

