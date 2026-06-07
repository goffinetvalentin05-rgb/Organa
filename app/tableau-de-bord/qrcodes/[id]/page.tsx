"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Download,
  Trash,
  Users,
  Calendar2,
  Mail,
  QrCode,
  Edit,
  X,
} from "@/lib/icons";
import {
  PageLayout,
  GlassCard,
  dashboardInnerPanelClass,
  dashboardSecondaryButtonClass,
  dashboardCardTitleClass,
  sectionListRowClass,
  dashboardModalClass,
  dashboardInputClass,
  dashboardSelectLgClass,
  dashboardLabelClass,
  cn,
} from "@/components/ui";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import {
  formatEventDate,
  formatEventDateTime,
  formatEventTime,
  normalizeEventTimeForInput,
  normalizeEventTimeForApi,
} from "@/lib/qrcodes/eventDateTime";

interface QRCodeData {
  id: string;
  name: string;
  description?: string;
  event_type: string;
  event_date?: string;
  event_time?: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

interface Registration {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  comment?: string;
  created_at: string;
}

export default function QRCodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, locale } = useI18n();
  const router = useRouter();
  const [qrcode, setQrcode] = useState<QRCodeData | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    eventType: "other",
    eventDate: "",
    eventTime: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qrcodes/${id}`, { cache: "no-store" });
      if (!res.ok) {
        router.push("/tableau-de-bord/qrcodes");
        return;
      }
      const data = await res.json();
      setQrcode(data.qrcode);
      setRegistrations(data.registrations || []);
    } catch {
      toast.error(t("dashboard.qrcodes.loadError"));
      router.push("/tableau-de-bord/qrcodes");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!qrcode) return;
    setEditForm({
      name: qrcode.name,
      description: qrcode.description || "",
      eventType: qrcode.event_type,
      eventDate: qrcode.event_date || "",
      eventTime: normalizeEventTimeForInput(qrcode.event_time),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/qrcodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          eventType: editForm.eventType,
          eventDate: editForm.eventDate || null,
          eventTime: normalizeEventTimeForApi(editForm.eventTime),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success(t("dashboard.qrcodes.editSuccess"));
      setShowEditModal(false);
      loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("dashboard.qrcodes.editError");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRegistration = async (regId: string) => {
    if (!confirm(t("dashboard.qrcodes.deleteConfirm"))) return;

    try {
      const res = await fetch(`/api/registrations?id=${regId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("dashboard.qrcodes.detail.registrationDeleted"));
      loadData();
    } catch {
      toast.error(t("dashboard.qrcodes.deleteError"));
    }
  };

  const copyLink = async () => {
    if (!qrcode) return;
    const url = `${window.location.origin}/inscription/${qrcode.code}`;
    await navigator.clipboard.writeText(url);
    toast.success(t("dashboard.qrcodes.card.linkCopied"));
  };

  const downloadQR = (format: "png" | "svg") => {
    if (!qrcode) return;
    const svg = document.getElementById(`qr-detail-${qrcode.code}`);
    if (!svg) return;

    if (format === "svg") {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qrcode-${qrcode.name.toLowerCase().replace(/\s+/g, "-")}.svg`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx?.drawImage(img, 0, 0, 400, 400);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `qrcode-${qrcode.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const exportCSV = () => {
    if (!registrations.length) return;

    const headers = [
      t("dashboard.qrcodes.registration.columns.name"),
      t("dashboard.qrcodes.registration.columns.email"),
      t("dashboard.qrcodes.registration.columns.phone"),
      t("dashboard.qrcodes.registration.columns.comment"),
      t("dashboard.qrcodes.registration.columns.date"),
    ];

    const rows = registrations.map((r) => [
      `${r.first_name} ${r.last_name}`,
      r.email,
      r.phone || "",
      r.comment || "",
      formatRegistrationDate(r.created_at),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inscriptions-${qrcode?.name.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatRegistrationDate = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString(
      locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-US",
      { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    );
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

  if (loading) {
    return (
      <PageLayout maxWidth="7xl">
        <GlassCard padding="lg" className="text-center">
          <div className="inline-flex items-center gap-3 text-white/55">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t("dashboard.common.loading")}
          </div>
        </GlassCard>
      </PageLayout>
    );
  }

  if (!qrcode) return null;

  const registrationUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/inscription/${qrcode.code}`;

  return (
    <PageLayout maxWidth="7xl">
      {/* Back link */}
      <Link
        href="/tableau-de-bord/qrcodes"
        className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        {t("dashboard.qrcodes.detail.backToList")}
      </Link>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* QR Code & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* QR Code Card */}
          <div className={`${dashboardInnerPanelClass} p-6`}>
            <h2 className={`${dashboardCardTitleClass} mb-4`}>
              {t("dashboard.qrcodes.detail.qrCodeLabel")}
            </h2>
            <div className="mb-4 flex justify-center rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="qr-code-surface rounded-xl p-4 shadow-lg ring-1 ring-white/20">
                <QRCodeSVG
                  id={`qr-detail-${qrcode.code}`}
                  value={registrationUrl}
                  size={200}
                  level="M"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => downloadQR("png")}
                className={`flex-1 ${dashboardSecondaryButtonClass} px-3 py-2 text-sm`}
              >
                <Download className="w-4 h-4" />
                {t("dashboard.qrcodes.detail.downloadPng")}
              </button>
              <button
                type="button"
                onClick={() => downloadQR("svg")}
                className={`flex-1 ${dashboardSecondaryButtonClass} px-3 py-2 text-sm`}
              >
                <Download className="w-4 h-4" />
                {t("dashboard.qrcodes.detail.downloadSvg")}
              </button>
            </div>
          </div>

          {/* Event Info */}
          <div className={`${dashboardInnerPanelClass} p-6`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className={dashboardCardTitleClass}>
                {t("dashboard.qrcodes.detail.eventInfo")}
              </h2>
              <button
                type="button"
                onClick={openEditModal}
                className={`${dashboardSecondaryButtonClass} px-3 py-2 text-xs`}
              >
                <Edit className="w-4 h-4" />
                {t("dashboard.common.edit")}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-white/55">{t("dashboard.qrcodes.fields.name")}</p>
                <p className="font-medium text-white/90">{qrcode.name}</p>
              </div>
              <div>
                <p className="text-sm text-white/55">{t("dashboard.qrcodes.fields.eventType")}</p>
                <p className="font-medium text-white/90">{getEventTypeLabel(qrcode.event_type)}</p>
              </div>
              {(qrcode.event_date || qrcode.event_time) && (
                <div>
                  <p className="text-sm text-white/55">{t("dashboard.qrcodes.fields.eventDate")}</p>
                  <p className="font-medium text-white/90">
                    {formatEventSchedule(qrcode.event_date, qrcode.event_time) ||
                      formatEventDate(qrcode.event_date, locale as "fr" | "de" | "en") ||
                      formatEventTime(qrcode.event_time, locale as "fr" | "de" | "en")}
                  </p>
                </div>
              )}
              {qrcode.description && (
                <div>
                  <p className="text-sm text-white/55">{t("dashboard.qrcodes.fields.description")}</p>
                  <p className="text-white/75">{qrcode.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Registration Link */}
          <div className={`${dashboardInnerPanelClass} p-6`}>
            <h2 className={`${dashboardCardTitleClass} mb-4`}>
              {t("dashboard.qrcodes.detail.registrationLink")}
            </h2>
            <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p className="break-all font-mono text-sm text-white/65">{registrationUrl}</p>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className={`w-full ${dashboardSecondaryButtonClass} px-3 py-2 text-sm`}
            >
              <QrCode className="w-4 h-4" />
              {t("dashboard.qrcodes.card.copyLink")}
            </button>
          </div>
        </div>

        {/* Registrations */}
        <div className="lg:col-span-2">
          <div className={`${dashboardInnerPanelClass} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className={dashboardCardTitleClass}>
                  {t("dashboard.qrcodes.detail.registrations")}
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  {t("dashboard.qrcodes.detail.registrationsCount").replace("{count}", String(registrations.length))}
                </p>
              </div>
              {registrations.length > 0 && (
                <button
                  type="button"
                  onClick={exportCSV}
                  className={`${dashboardSecondaryButtonClass} px-4 py-2 text-sm`}
                >
                  <Download className="w-4 h-4" />
                  {t("dashboard.qrcodes.detail.exportCsv")}
                </button>
              )}
            </div>

            {registrations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
                  <Users className="h-8 w-8 text-white/40" />
                </div>
                <p className="text-white/55">{t("dashboard.qrcodes.detail.noRegistrations")}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className={`${sectionListRowClass} rounded-none border-0 hover:border-transparent`}
                  >
                    <div className="flex w-full items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-400/25 bg-blue-500/15 font-semibold text-blue-200">
                            {reg.first_name.charAt(0)}{reg.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white/90">
                              {reg.first_name} {reg.last_name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-white/55">
                              <Mail className="h-3.5 w-3.5" />
                              {reg.email}
                            </div>
                          </div>
                        </div>
                        {reg.phone && (
                          <p className="ml-13 text-sm text-white/55">📞 {reg.phone}</p>
                        )}
                        {reg.comment && (
                          <p className="ml-13 mt-2 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sm text-white/65">
                            {reg.comment}
                          </p>
                        )}
                        <p className="ml-13 mt-2 text-xs text-white/40">
                          {formatRegistrationDate(reg.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRegistration(reg.id)}
                        className="rounded-lg border border-red-400/20 bg-red-500/10 p-2 text-red-300 transition-colors hover:bg-red-500/18"
                        title={t("dashboard.qrcodes.detail.deleteRegistration")}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          />
          <div className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto ${dashboardModalClass}`}>
            <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-white/10 bg-[#0a0f2e]/95 p-6 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-bold text-white">{t("dashboard.qrcodes.editTitle")}</h2>
                <p className="mt-1 text-sm text-white/55">{t("dashboard.qrcodes.editSubtitle")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-xl p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5 p-6">
              <div>
                <label className={dashboardLabelClass}>{t("dashboard.qrcodes.fields.name")}</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder={t("dashboard.qrcodes.fields.namePlaceholder")}
                  className={dashboardInputClass}
                  required
                />
              </div>

              <div>
                <label className={dashboardLabelClass}>{t("dashboard.qrcodes.fields.eventType")}</label>
                <select
                  value={editForm.eventType}
                  onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                  className={dashboardSelectLgClass}
                >
                  <option value="meal">{t("dashboard.qrcodes.eventTypes.meal")}</option>
                  <option value="match">{t("dashboard.qrcodes.eventTypes.match")}</option>
                  <option value="tournament">{t("dashboard.qrcodes.eventTypes.tournament")}</option>
                  <option value="party">{t("dashboard.qrcodes.eventTypes.party")}</option>
                  <option value="other">{t("dashboard.qrcodes.eventTypes.other")}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={dashboardLabelClass}>{t("dashboard.qrcodes.fields.eventDate")}</label>
                  <input
                    type="date"
                    value={editForm.eventDate}
                    onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                    className={cn(dashboardInputClass, "[color-scheme:dark]")}
                  />
                </div>
                <div>
                  <label className={dashboardLabelClass}>{t("dashboard.qrcodes.fields.eventTime")}</label>
                  <input
                    type="time"
                    value={editForm.eventTime}
                    onChange={(e) => setEditForm({ ...editForm, eventTime: e.target.value })}
                    className={cn(dashboardInputClass, "[color-scheme:dark]")}
                  />
                </div>
              </div>

              <div>
                <label className={dashboardLabelClass}>{t("dashboard.qrcodes.fields.description")}</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder={t("dashboard.qrcodes.fields.descriptionPlaceholder")}
                  className={cn(dashboardInputClass, "min-h-[6rem] resize-y")}
                  rows={3}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`${dashboardSecondaryButtonClass} justify-center px-4 py-2.5`}
                >
                  {t("dashboard.common.cancel")}
                </button>
                <DashboardPrimaryButton
                  type="submit"
                  disabled={saving || !editForm.name.trim()}
                  icon="none"
                  className="justify-center"
                >
                  {saving ? t("dashboard.common.saving") : t("dashboard.qrcodes.editSave")}
                </DashboardPrimaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
}
