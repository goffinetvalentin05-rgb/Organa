"use client";

import { useEffect, useState, use } from "react";
import { useI18n } from "@/components/I18nProvider";
import { CheckCircle, Calendar2, Users } from "@/lib/icons";

interface EventData {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  eventDate?: string;
  isActive: boolean;
}

export default function PublicRegistrationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { t, locale } = useI18n();
  const [event, setEvent] = useState<EventData | null>(null);
  const [clubName, setClubName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    comment: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEvent();
  }, [code]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qrcodes/public/${code}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("dashboard.publicRegistration.errors.notFound"));
        return;
      }
      const data = await res.json();
      setEvent(data.qrcode);
      setClubName(data.clubName);
    } catch {
      setError(t("dashboard.publicRegistration.errors.notFound"));
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t("dashboard.publicRegistration.errors.required");
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t("dashboard.publicRegistration.errors.required");
    }
    if (!formData.email.trim()) {
      newErrors.email = t("dashboard.publicRegistration.errors.required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("dashboard.publicRegistration.errors.invalidEmail");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !event) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrcodeId: event.id,
          ...formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("dashboard.publicRegistration.errors.submitError");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return null;
    return new Date(value).toLocaleDateString(
      locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : "en-US",
      { weekday: "long", day: "numeric", month: "long", year: "numeric" }
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

  const getEventTypeEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      meal: "🍽️",
      match: "⚽",
      tournament: "🏆",
      party: "🎉",
      other: "📅",
    };
    return emojis[type] || "📅";
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-500">{t("dashboard.common.loading")}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Oops!</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t("dashboard.publicRegistration.success.title")}
          </h1>
          <p className="text-slate-600 mb-6">
            {t("dashboard.publicRegistration.success.message")}
          </p>
          <div className="bg-emerald-50 rounded-xl p-4">
            <p className="font-medium text-emerald-800">{event?.name}</p>
            {event?.eventDate && (
              <p className="text-sm text-emerald-600 mt-1">{formatDate(event.eventDate)}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <span className="text-3xl">{getEventTypeEmoji(event.eventType)}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {t("dashboard.publicRegistration.title")}
          </h1>
          <p className="text-slate-500">
            {t("dashboard.publicRegistration.organizerLabel")}: <span className="font-medium text-slate-700">{clubName}</span>
          </p>
        </div>

        {/* Event Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <p className="text-blue-200 text-sm mb-1">{t("dashboard.publicRegistration.eventLabel")}</p>
            <h2 className="text-xl font-bold">{event.name}</h2>
            {event.description && (
              <p className="text-blue-100 mt-2 text-sm">{event.description}</p>
            )}
          </div>
          <div className="p-4 flex items-center gap-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4" />
              {getEventTypeLabel(event.eventType)}
            </div>
            {event.eventDate && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar2 className="w-4 h-4" />
                {formatDate(event.eventDate)}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t("dashboard.publicRegistration.fields.firstName")}
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${errors.firstName ? "border-red-300 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {errors.firstName && (
                <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t("dashboard.publicRegistration.fields.lastName")}
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${errors.lastName ? "border-red-300 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {errors.lastName && (
                <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t("dashboard.publicRegistration.fields.email")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${errors.email ? "border-red-300 bg-red-50" : "border-slate-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t("dashboard.publicRegistration.fields.phone")}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t("dashboard.publicRegistration.fields.comment")}
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder={t("dashboard.publicRegistration.fields.commentPlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                rows={3}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("dashboard.publicRegistration.submitting")}
                </>
              ) : (
                t("dashboard.publicRegistration.submitAction")
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          Powered by <span className="font-medium">Obillz</span>
        </p>
      </div>
    </div>
  );
}
