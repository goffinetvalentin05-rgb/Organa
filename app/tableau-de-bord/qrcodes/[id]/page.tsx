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
} from "@/lib/icons";

interface QRCodeData {
  id: string;
  name: string;
  description?: string;
  event_type: string;
  event_date?: string;
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
      formatDate(r.created_at),
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

  const formatDate = (value?: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString(
      locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-US",
      { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    );
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
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center gap-3 text-slate-500">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t("dashboard.common.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (!qrcode) return null;

  const registrationUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/inscription/${qrcode.code}`;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/tableau-de-bord/qrcodes"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        {t("dashboard.qrcodes.detail.backToList")}
      </Link>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* QR Code & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* QR Code Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {t("dashboard.qrcodes.detail.qrCodeLabel")}
            </h2>
            <div className="flex justify-center p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl mb-4">
              <QRCodeSVG
                id={`qr-detail-${qrcode.code}`}
                value={registrationUrl}
                size={200}
                level="M"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadQR("png")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t("dashboard.qrcodes.detail.downloadPng")}
              </button>
              <button
                onClick={() => downloadQR("svg")}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                {t("dashboard.qrcodes.detail.downloadSvg")}
              </button>
            </div>
          </div>

          {/* Event Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {t("dashboard.qrcodes.detail.eventInfo")}
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Nom</p>
                <p className="font-medium text-slate-900">{qrcode.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Type</p>
                <p className="font-medium text-slate-900">{getEventTypeLabel(qrcode.event_type)}</p>
              </div>
              {qrcode.event_date && (
                <div>
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium text-slate-900">{formatDate(qrcode.event_date)}</p>
                </div>
              )}
              {qrcode.description && (
                <div>
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="text-slate-700">{qrcode.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Registration Link */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {t("dashboard.qrcodes.detail.registrationLink")}
            </h2>
            <div className="bg-slate-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-slate-600 break-all font-mono">{registrationUrl}</p>
            </div>
            <button
              onClick={copyLink}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--obillz-blue-light)] text-[var(--obillz-hero-blue)] text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              {t("dashboard.qrcodes.card.copyLink")}
            </button>
          </div>
        </div>

        {/* Registrations */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t("dashboard.qrcodes.detail.registrations")}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {t("dashboard.qrcodes.detail.registrationsCount").replace("{count}", String(registrations.length))}
                </p>
              </div>
              {registrations.length > 0 && (
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t("dashboard.qrcodes.detail.exportCsv")}
                </button>
              )}
            </div>

            {registrations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">{t("dashboard.qrcodes.detail.noRegistrations")}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[var(--obillz-blue-light)] flex items-center justify-center text-[var(--obillz-hero-blue)] font-semibold">
                            {reg.first_name.charAt(0)}{reg.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {reg.first_name} {reg.last_name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Mail className="w-3.5 h-3.5" />
                              {reg.email}
                            </div>
                          </div>
                        </div>
                        {reg.phone && (
                          <p className="text-sm text-slate-500 ml-13">📞 {reg.phone}</p>
                        )}
                        {reg.comment && (
                          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-2 mt-2 ml-13">
                            {reg.comment}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2 ml-13">
                          {formatDate(reg.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteRegistration(reg.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title={t("dashboard.qrcodes.detail.deleteRegistration")}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
