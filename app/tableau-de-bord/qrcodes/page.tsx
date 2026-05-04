"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import {
  QrCode,
  Trash,
  Eye,
  Download,
  X,
  Users,
  Calendar2,
  ArrowRight,
} from "@/lib/icons";
import {
  PageLayout,
  PageHeader,
  GlassCard,
  EmptyState,
  ActionButton,
  DashboardBadge,
  glassCardHeaderClass,
  cn,
} from "@/components/ui";

interface QRCodeItem {
  id: string;
  name: string;
  description?: string;
  event_type: string;
  event_date?: string;
  code: string;
  is_active: boolean;
  created_at: string;
  registrationsCount: number;
}

export default function QRCodesPage() {
  const { t, locale } = useI18n();
  const [qrcodes, setQrcodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventType: "other",
    eventDate: "",
  });

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/qrcodes", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQrcodes(data.qrcodes || []);
    } catch {
      toast.error(t("dashboard.qrcodes.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/qrcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success(t("dashboard.qrcodes.createSuccess"));
      setShowCreateModal(false);
      setFormData({ name: "", description: "", eventType: "other", eventDate: "" });
      loadQRCodes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("dashboard.qrcodes.createError");
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("dashboard.qrcodes.deleteConfirm"))) return;

    try {
      const res = await fetch(`/api/qrcodes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      loadQRCodes();
    } catch {
      toast.error(t("dashboard.qrcodes.deleteError"));
    }
  };

  const copyLink = async (code: string) => {
    const url = `${window.location.origin}/inscription/${code}`;
    await navigator.clipboard.writeText(url);
    toast.success(t("dashboard.qrcodes.card.linkCopied"));
  };

  const downloadQR = (code: string, name: string) => {
    const svg = document.getElementById(`qr-${code}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `qrcode-${name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const formatDate = (value?: string) => {
    if (!value) return null;
    return new Date(value).toLocaleDateString(locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-US");
  };

  const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      meal: t("dashboard.qrcodes.eventTypes.meal"),
      match: t("dashboard.qrcodes.eventTypes.match"),
      tournament: t("dashboard.qrcodes.eventTypes.tournament"),
      party: t("dashboard.qrcodes.eventTypes.party"),
      other: t("dashboard.qrcodes.eventTypes.other"),
    };
    return types[type] || type;
  };

  const getEventBadgeVariant = (type: string): "warning" | "success" | "info" | "neutral" | "default" => {
    const map: Record<string, "warning" | "success" | "info" | "neutral" | "default"> = {
      meal: "warning",
      match: "success",
      tournament: "info",
      party: "neutral",
      other: "default",
    };
    return map[type] ?? "default";
  };

  return (
    <PageLayout maxWidth="7xl" className="space-y-6">
      <PageHeader
        title={t("dashboard.qrcodes.title")}
        subtitle={t("dashboard.qrcodes.subtitle")}
        actions={
          <DashboardPrimaryButton type="button" onClick={() => setShowCreateModal(true)}>
            {t("dashboard.qrcodes.newAction")}
          </DashboardPrimaryButton>
        }
      />

      {loading ? (
        <GlassCard padding="lg" useInnerContent={false} className="text-center text-slate-600 shadow-xl shadow-blue-950/10">
          <div className="inline-flex items-center gap-3">
            <svg className="h-5 w-5 animate-spin text-[#2563EB]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t("dashboard.common.loading")}
          </div>
        </GlassCard>
      ) : qrcodes.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title={t("dashboard.qrcodes.emptyState")}
          action={
            <DashboardPrimaryButton type="button" onClick={() => setShowCreateModal(true)} className="inline-flex">
              {t("dashboard.qrcodes.emptyCta")}
            </DashboardPrimaryButton>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {qrcodes.map((qr) => (
            <GlassCard
              key={qr.id}
              padding="none"
              useInnerContent={false}
              className="flex flex-col overflow-hidden shadow-xl shadow-blue-950/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-950/15"
            >
              <div className="relative flex justify-center bg-gradient-to-br from-white/95 via-sky-50/70 to-indigo-100/55 px-6 pb-2 pt-8">
                <div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-white/90">
                  <QRCodeSVG
                    id={`qr-${qr.code}`}
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/inscription/${qr.code}`}
                    size={128}
                    level="M"
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col border-t border-white/45 p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 min-w-0 text-base font-bold leading-snug text-slate-900">{qr.name}</h3>
                  <DashboardBadge variant={getEventBadgeVariant(qr.event_type)} className="shrink-0">
                    {getEventTypeLabel(qr.event_type)}
                  </DashboardBadge>
                </div>

                {qr.description ? (
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-600">{qr.description}</p>
                ) : null}

                <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-[#2563EB]" />
                    <span className="font-medium">
                      {qr.registrationsCount > 0
                        ? `${qr.registrationsCount} ${t("dashboard.qrcodes.card.registrations")}`
                        : t("dashboard.qrcodes.card.noRegistrations")}
                    </span>
                  </div>
                  {qr.event_date ? (
                    <div className="flex items-center gap-2">
                      <Calendar2 className="h-4 w-4 shrink-0 text-[#2563EB]" />
                      <span className="font-medium">{formatDate(qr.event_date)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-auto space-y-3">
                  <ActionButton
                    href={`/tableau-de-bord/qrcodes/${qr.id}`}
                    variant="premiumInline"
                    className="w-full justify-center rounded-full py-3"
                  >
                    <Eye className="h-4 w-4" />
                    {t("dashboard.qrcodes.card.viewDetails")}
                    <ArrowRight className="h-4 w-4 opacity-90" />
                  </ActionButton>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadQR(qr.code, qr.name)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-white"
                      title={t("dashboard.qrcodes.card.download")}
                    >
                      <Download className="h-4 w-4" />
                      {t("dashboard.qrcodes.card.download")}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyLink(qr.code)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-white"
                      title={t("dashboard.qrcodes.card.copyLink")}
                    >
                      <QrCode className="h-4 w-4" />
                      {t("dashboard.qrcodes.card.copyLink")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(qr.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50/90 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      title={t("dashboard.common.delete")}
                    >
                      <Trash className="h-4 w-4" />
                      {t("dashboard.common.delete")}
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <GlassCard
            className="relative max-h-[90vh] w-full max-w-lg overflow-hidden shadow-2xl shadow-blue-950/25"
            padding="none"
            useInnerContent={false}
          >
            <div
              className={cn(
                glassCardHeaderClass,
                "sticky top-0 z-[1] flex items-center justify-between p-6 backdrop-blur-md"
              )}
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">{t("dashboard.qrcodes.createTitle")}</h2>
                <p className="mt-1 text-sm text-slate-600">{t("dashboard.qrcodes.createSubtitle")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-white/80 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="max-h-[calc(90vh-5.5rem)] space-y-5 overflow-y-auto p-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("dashboard.qrcodes.fields.name")}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("dashboard.qrcodes.fields.namePlaceholder")}
                  className="input-obillz"
                  required
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("dashboard.qrcodes.fields.eventType")}
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="input-obillz"
                >
                  <option value="meal">{t("dashboard.qrcodes.eventTypes.meal")}</option>
                  <option value="match">{t("dashboard.qrcodes.eventTypes.match")}</option>
                  <option value="tournament">{t("dashboard.qrcodes.eventTypes.tournament")}</option>
                  <option value="party">{t("dashboard.qrcodes.eventTypes.party")}</option>
                  <option value="other">{t("dashboard.qrcodes.eventTypes.other")}</option>
                </select>
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("dashboard.qrcodes.fields.eventDate")}
                </label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="input-obillz"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("dashboard.qrcodes.fields.description")}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t("dashboard.qrcodes.fields.descriptionPlaceholder")}
                  className="input-obillz"
                  rows={3}
                />
              </div>

              {/* Submit */}
              <DashboardPrimaryButton
                type="submit"
                disabled={creating || !formData.name.trim()}
                icon="none"
                fullWidth
                className="justify-center"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("dashboard.qrcodes.creating")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    {t("dashboard.qrcodes.createAction")}
                  </span>
                )}
              </DashboardPrimaryButton>
            </form>
          </GlassCard>
        </div>
      ) : null}
    </PageLayout>
  );
}
