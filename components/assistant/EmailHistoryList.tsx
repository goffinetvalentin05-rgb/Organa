"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

type EmailHistoryItem = {
  id: string;
  to_email: string;
  subject: string;
  content: string;
  created_at: string;
};

type EmailHistoryListProps = {
  relatedType: "client" | "facture" | "devis" | "dashboard";
  relatedId?: string | null;
  clientId?: string | null;
};

export default function EmailHistoryList({ relatedType, relatedId, clientId }: EmailHistoryListProps) {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<EmailHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const params = new URLSearchParams();
        params.set("relatedType", relatedType);
        if (relatedId) params.set("relatedId", relatedId);
        if (clientId) params.set("clientId", clientId);
        const response = await fetch(`/api/assistant/history?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || t("dashboard.assistant.errors.history"));
        }
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        console.error("[AssistantHistory] Error", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [relatedType, relatedId, clientId, t]);

  if (loading) {
    return <p className="text-sm text-secondary">{t("dashboard.assistant.history.loading")}</p>;
  }

  return (
    <div className="rounded-xl border border-subtle bg-white p-4 space-y-4">
      <h3 className="text-sm font-semibold text-primary">{t("dashboard.assistant.history.title")}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-secondary">{t("dashboard.assistant.history.empty")}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-subtle px-3 py-3">
              <p className="text-xs text-tertiary">
                {new Date(item.created_at).toLocaleDateString(locale)} · {item.to_email}
              </p>
              <p className="text-sm font-semibold text-primary mt-1">{item.subject}</p>
              <p className="text-sm text-secondary mt-2 whitespace-pre-line">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

