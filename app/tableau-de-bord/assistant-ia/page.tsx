"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useI18n } from "@/components/I18nProvider";

type AssistantAction = "compose" | "rephrase" | "translate";
type AssistantLocale = "fr" | "en" | "de";
type ComposeType = "invoice_followup" | "quote_send" | "payment_reminder" | "generic";
type RephraseTone = "professional" | "firm" | "courteous" | "correct";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const quickActions: Array<{
  id: string;
  labelKey: string;
  action: AssistantAction;
  composeType?: ComposeType;
  tone?: RephraseTone;
  templateKey: string;
}> = [
  {
    id: "invoice-followup",
    labelKey: "dashboard.assistantPage.quickActions.invoiceFollowup",
    action: "compose",
    composeType: "invoice_followup",
    templateKey: "dashboard.assistantPage.templates.invoiceFollowup",
  },
  {
    id: "professional",
    labelKey: "dashboard.assistantPage.quickActions.professional",
    action: "compose",
    composeType: "generic",
    templateKey: "dashboard.assistantPage.templates.professional",
  },
  {
    id: "rephrase",
    labelKey: "dashboard.assistantPage.quickActions.rephrase",
    action: "rephrase",
    tone: "professional",
    templateKey: "dashboard.assistantPage.templates.rephrase",
  },
  {
    id: "translate",
    labelKey: "dashboard.assistantPage.quickActions.translate",
    action: "translate",
    templateKey: "dashboard.assistantPage.templates.translate",
  },
];

export default function AssistantIaPage() {
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [action, setAction] = useState<AssistantAction>("compose");
  const [composeType, setComposeType] = useState<ComposeType>("invoice_followup");
  const [tone, setTone] = useState<RephraseTone>("professional");
  const [language, setLanguage] = useState<AssistantLocale>(locale);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLanguage(locale);
  }, [locale]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const actionLabel = useMemo(() => t(`dashboard.assistant.tabs.${action}`), [action, t]);

  const handleQuickAction = (actionId: string) => {
    const selected = quickActions.find((item) => item.id === actionId);
    if (!selected) return;
    setAction(selected.action);
    if (selected.composeType) setComposeType(selected.composeType);
    if (selected.tone) setTone(selected.tone);
    setInput(t(selected.templateKey));
  };

  const handleSendMessage = async () => {
    if (!input.trim()) {
      toast.error(t("dashboard.assistantPage.errors.emptyMessage"));
      return;
    }
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          language,
          composeType,
          tone,
          instruction: action === "compose" ? input.trim() : undefined,
          input: action === "compose" ? undefined : input.trim(),
          subject,
          context: null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || t("dashboard.assistant.errors.generate"));
      }
      const assistantContent = data.subject
        ? `${t("dashboard.assistantPage.subjectPrefix")} ${data.subject}\n\n${data.body}`
        : data.body;
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: assistantContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
      setInput("");
    } catch (error: any) {
      toast.error(error?.message || t("dashboard.assistant.errors.generate"));
    } finally {
      setSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipient || !subject || !body) {
      toast.error(t("dashboard.assistant.errors.missingFields"));
      return;
    }
    setSendingEmail(true);
    try {
      const response = await fetch("/api/assistant/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          subject,
          content: body,
          language,
          relatedType: "dashboard",
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
      setSendingEmail(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("dashboard.assistantPage.title")}</h1>
        <p className="text-secondary">{t("dashboard.assistantPage.subtitle")}</p>
      </div>

      <div className="rounded-2xl border border-subtle bg-white p-6 shadow-premium space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary">{t("dashboard.assistantPage.quickActions.title")}</p>
          <span className="text-xs text-tertiary">{actionLabel}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((item) => (
            <button
              key={item.id}
              onClick={() => handleQuickAction(item.id)}
              className="rounded-full border border-subtle px-4 py-2 text-sm text-secondary hover:text-primary hover:bg-surface"
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-subtle bg-white shadow-premium flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-subtle bg-surface px-4 py-6 text-sm text-secondary">
              {t("dashboard.assistantPage.emptyState")}
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                message.role === "user"
                  ? "ml-auto bg-slate-900 text-white"
                  : "bg-surface text-primary"
              }`}
            >
              {message.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-subtle bg-surface px-6 py-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs text-secondary mb-2 block">
                {t("dashboard.assistantPage.controls.action")}
              </label>
              <select
                value={action}
                onChange={(event) => setAction(event.target.value as AssistantAction)}
                className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
              >
                <option value="compose">{t("dashboard.assistant.tabs.compose")}</option>
                <option value="rephrase">{t("dashboard.assistant.tabs.rephrase")}</option>
                <option value="translate">{t("dashboard.assistant.tabs.translate")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary mb-2 block">
                {t("dashboard.assistantPage.controls.language")}
              </label>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as AssistantLocale)}
                className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
              >
                <option value="fr">{t("dashboard.assistant.languages.fr")}</option>
                <option value="en">{t("dashboard.assistant.languages.en")}</option>
                <option value="de">{t("dashboard.assistant.languages.de")}</option>
              </select>
            </div>
            {action === "compose" ? (
              <div>
                <label className="text-xs text-secondary mb-2 block">
                  {t("dashboard.assistantPage.controls.composeType")}
                </label>
                <select
                  value={composeType}
                  onChange={(event) => setComposeType(event.target.value as ComposeType)}
                  className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                >
                  <option value="invoice_followup">
                    {t("dashboard.assistant.compose.types.invoice_followup")}
                  </option>
                  <option value="quote_send">{t("dashboard.assistant.compose.types.quote_send")}</option>
                  <option value="payment_reminder">
                    {t("dashboard.assistant.compose.types.payment_reminder")}
                  </option>
                  <option value="generic">{t("dashboard.assistant.compose.types.generic")}</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs text-secondary mb-2 block">
                  {t("dashboard.assistantPage.controls.tone")}
                </label>
                <select
                  value={tone}
                  onChange={(event) => setTone(event.target.value as RephraseTone)}
                  className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                >
                  <option value="professional">
                    {t("dashboard.assistant.rephrase.tones.professional")}
                  </option>
                  <option value="firm">{t("dashboard.assistant.rephrase.tones.firm")}</option>
                  <option value="courteous">
                    {t("dashboard.assistant.rephrase.tones.courteous")}
                  </option>
                  <option value="correct">{t("dashboard.assistant.rephrase.tones.correct")}</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-xs text-secondary mb-2 block">
                {t("dashboard.assistantPage.controls.inputLabel")}
              </label>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
                placeholder={t("dashboard.assistantPage.controls.inputPlaceholder")}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={sending}
              className="h-11 px-6 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {sending ? t("dashboard.assistantPage.controls.sending") : t("dashboard.assistantPage.controls.send")}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-subtle bg-white p-6 shadow-premium space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-primary">{t("dashboard.assistantPage.email.title")}</h2>
          <p className="text-sm text-secondary">{t("dashboard.assistantPage.email.subtitle")}</p>
        </div>
        <div className="grid gap-4">
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
              rows={6}
              className="w-full rounded-lg border border-subtle px-3 py-2 text-sm"
              placeholder={t("dashboard.assistant.editor.bodyPlaceholder")}
            />
          </div>
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail}
            className="w-full rounded-lg accent-bg text-white px-4 py-2 text-sm font-semibold shadow-premium hover:shadow-premium-hover disabled:opacity-60"
          >
            {sendingEmail ? t("dashboard.assistantPage.email.sending") : t("dashboard.assistantPage.email.send")}
          </button>
        </div>
      </div>
    </div>
  );
}

