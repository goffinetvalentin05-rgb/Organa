"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import {
  Plus,
  QrCode,
  Trash,
  Eye,
  Download,
  X,
  Users,
  Calendar2,
} from "@/lib/icons";

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

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      meal: "bg-amber-100 text-amber-700",
      match: "bg-emerald-100 text-emerald-700",
      tournament: "bg-purple-100 text-purple-700",
      party: "bg-pink-100 text-pink-700",
      other: "bg-slate-100 text-slate-700",
    };
    return colors[type] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {t("dashboard.qrcodes.title")}
          </h1>
          <p className="mt-1 text-slate-500">
            {t("dashboard.qrcodes.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-obillz"
        >
          <Plus className="w-5 h-5" />
          {t("dashboard.qrcodes.newAction")}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center gap-3 text-slate-500">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t("dashboard.common.loading")}
          </div>
        </div>
      ) : qrcodes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 mb-4">{t("dashboard.qrcodes.emptyState")}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-obillz inline-flex"
          >
            <Plus className="w-5 h-5" />
            {t("dashboard.qrcodes.emptyCta")}
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {qrcodes.map((qr) => (
            <div
              key={qr.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* QR Code Preview */}
              <div className="p-6 bg-gradient-to-br from-slate-50 to-white flex justify-center">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <QRCodeSVG
                    id={`qr-${qr.code}`}
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/inscription/${qr.code}`}
                    size={120}
                    level="M"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="p-5 border-t border-slate-100">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{qr.name}</h3>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(qr.event_type)}`}>
                    {getEventTypeLabel(qr.event_type)}
                  </span>
                </div>

                {qr.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{qr.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>
                      {qr.registrationsCount > 0
                        ? `${qr.registrationsCount} ${t("dashboard.qrcodes.card.registrations")}`
                        : t("dashboard.qrcodes.card.noRegistrations")
                      }
                    </span>
                  </div>
                  {qr.event_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar2 className="w-4 h-4" />
                      <span>{formatDate(qr.event_date)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/tableau-de-bord/qrcodes/${qr.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--obillz-blue-light)] text-[var(--obillz-hero-blue)] text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    {t("dashboard.qrcodes.card.viewDetails")}
                  </Link>
                  <button
                    onClick={() => downloadQR(qr.code, qr.name)}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    title={t("dashboard.qrcodes.card.download")}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyLink(qr.code)}
                    className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    title={t("dashboard.qrcodes.card.copyLink")}
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(qr.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title={t("dashboard.common.delete")}
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t("dashboard.qrcodes.createTitle")}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {t("dashboard.qrcodes.createSubtitle")}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
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
              <button
                type="submit"
                disabled={creating || !formData.name.trim()}
                className="w-full btn-obillz justify-center"
              >
                {creating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("dashboard.qrcodes.creating")}
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    {t("dashboard.qrcodes.createAction")}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
