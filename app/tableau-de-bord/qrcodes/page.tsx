"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  Copy,
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
import { formatEventDateTime, normalizeEventTimeForApi } from "@/lib/qrcodes/eventDateTime";

interface QRCodeItem {
  id: string;
  name: string;
  description?: string;
  event_type: string;
  event_date?: string;
  event_time?: string;
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
    eventTime: "",
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
        body: JSON.stringify({
          ...formData,
          eventTime: normalizeEventTimeForApi(formData.eventTime),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success(t("dashboard.qrcodes.createSuccess"));
      setShowCreateModal(false);
      setFormData({ name: "", description: "", eventType: "other", eventDate: "", eventTime: "" });
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

  const formatEventSchedule = (eventDate?: string, eventTime?: string) => {
    return formatEventDateTime(eventDate, eventTime, locale as "fr" | "de" | "en");
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
    <PageLayout maxWidth="7xl">
      <PageHeader
        title={t("dashboard.qrcodes.title")}
        subtitle={t("dashboard.qrcodes.subtitle")}
        actions={
          <DashboardPrimaryButton type="button" size="sm" onClick={() => setShowCreateModal(true)}>
            {t("dashboard.qrcodes.newAction")}
          </DashboardPrimaryButton>
        }
      />

      {loading ? (
        <div className="rounded-[1.25rem] border border-[#E5E7EB] bg-white p-12 text-center text-sm text-[#64748B] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {t("dashboard.common.loading")}
        </div>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {qrcodes.map((qr) => (
            <article
              key={qr.id}
              className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFF] via-[#F4F7FF] to-[#EEF2FF] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] duration-200 hover:border-[rgba(26,35,255,0.16)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.07)] sm:p-6"
            >
              <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#1A23FF]/[0.06]" />
              <span className="pointer-events-none absolute -bottom-12 right-4 h-32 w-32 rounded-full bg-[#3B82F6]/[0.05]" />

              <Link
                href={`/tableau-de-bord/qrcodes/${qr.id}`}
                className="relative flex justify-center"
              >
                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#E5E7EB]">
                  <QRCodeSVG
                    id={`qr-${qr.code}`}
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/inscription/${qr.code}`}
                    size={148}
                    level="M"
                    bgColor="#FFFFFF"
                    fgColor="#0F172A"
                  />
                </div>
              </Link>

              <div className="relative mt-5 min-w-0">
                <Link
                  href={`/tableau-de-bord/qrcodes/${qr.id}`}
                  className="block truncate text-base font-semibold tracking-tight text-[#0F172A] transition-colors hover:text-[#1A23FF]"
                >
                  {qr.name}
                </Link>
                {qr.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-[#64748B]">{qr.description}</p>
                ) : null}
                <div className="mt-2.5">
                  <DashboardBadge variant={getEventBadgeVariant(qr.event_type)}>
                    {getEventTypeLabel(qr.event_type)}
                  </DashboardBadge>
                </div>
                <p className="mt-3 text-sm text-[#64748B]">
                  {qr.registrationsCount > 0
                    ? `${qr.registrationsCount} ${t("dashboard.qrcodes.card.registrations")}`
                    : t("dashboard.qrcodes.card.noRegistrations")}
                </p>
                {qr.event_date ? (
                  <p className="mt-1 truncate text-xs text-[#94A3B8]">
                    {formatEventSchedule(qr.event_date, qr.event_time)}
                  </p>
                ) : null}
              </div>

              <div className="relative mt-auto flex flex-col gap-2 pt-5">
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    href={`/tableau-de-bord/qrcodes/${qr.id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t("dashboard.qrcodes.card.viewDetails")}
                  </ActionButton>
                  <ActionButton
                    type="button"
                    onClick={() => downloadQR(qr.code, qr.name)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                    title={t("dashboard.qrcodes.card.download")}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t("dashboard.qrcodes.card.download")}
                  </ActionButton>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ActionButton
                    type="button"
                    onClick={() => copyLink(qr.code)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
                    title={t("dashboard.qrcodes.card.copyLink")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t("dashboard.qrcodes.card.copyLink")}
                  </ActionButton>
                  <button
                    type="button"
                    onClick={() => handleDelete(qr.id)}
                    title={t("dashboard.common.delete")}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
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

              {/* Event Date & Time */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t("dashboard.qrcodes.fields.eventTime")}
                  </label>
                  <input
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    className="input-obillz"
                  />
                </div>
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
