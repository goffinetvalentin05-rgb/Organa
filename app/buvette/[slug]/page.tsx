"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import PublicBrandingHero from "@/components/public-branding/PublicBrandingHero";
import PublicPageCanvas from "@/components/public-branding/PublicPageCanvas";
import { cn } from "@/components/ui";
import { buildMonthGrid } from "@/lib/buvette/calendar";
import {
  buildBuvettePublicTheme,
  DEFAULT_BUVETTE_LABEL,
  DEFAULT_BUVETTE_SUBTITLE,
  defaultBuvetteTitle,
} from "@/lib/buvette/settings";
import { ctaColors, resolvePublicLayout } from "@/lib/public-branding/theme";
import type { PublicVisualTheme } from "@/lib/public-branding/types";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, monthNum] = monthKey.split("-").map(Number);
  return new Date(year, monthNum - 1, 1).toLocaleDateString("fr-CH", {
    month: "long",
    year: "numeric",
  });
}

function formatSelectedDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-CH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function PublicBuvettePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [month, setMonth] = useState(currentMonthKey());
  const [clubFound, setClubFound] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<PublicVisualTheme | null>(null);
  const [days, setDays] = useState<Record<string, "available" | "occupied" | "reserved">>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    eventType: "",
    message: "",
    marketingOptIn: false,
  });

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Erreur";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setClubFound(false);
    try {
      const [clubRes, calendarRes] = await Promise.all([
        fetch(`/api/public/buvette/${slug}`, { cache: "no-store" }),
        fetch(`/api/public/buvette/${slug}/calendar?month=${month}`, { cache: "no-store" }),
      ]);
      if (!clubRes.ok) throw new Error("Club introuvable");
      if (!calendarRes.ok) throw new Error("Impossible de charger le calendrier");
      const clubData = await clubRes.json();
      const calendarData = await calendarRes.json();
      setClubFound(true);
      const name = clubData.clubName || "Club";
      setClubName(name);
      setClubLogoUrl(clubData.logoUrl || null);
      setTheme(
        clubData.theme ||
          buildBuvettePublicTheme({
            slug: null,
            suggestedSlug: "",
            publicUrlPath: null,
            label: DEFAULT_BUVETTE_LABEL,
            title: clubData.title || defaultBuvetteTitle(name),
            description: clubData.description || DEFAULT_BUVETTE_SUBTITLE,
            primaryColor: clubData.primaryColor || "#1A23FF",
            secondaryColor: null,
            accentColor: clubData.accentColor || null,
            pageStyle: clubData.bannerUrl ? "banner" : "colors",
            imagePosition: "center",
            overlayIntensity: "normal",
            bannerUrl: clubData.bannerUrl || null,
            logoUrl: clubData.logoUrl || null,
            companyName: name,
          })
      );
      setDays(calendarData.days || {});
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [month, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const hasAvailableDates = useMemo(
    () =>
      grid.some((week) =>
        week.some((date) => {
          if (!date) return false;
          const status = days[date] || "available";
          return status === "available";
        })
      ),
    [days, grid]
  );

  const goMonth = (delta: number) => {
    const [year, monthNum] = month.split("-").map(Number);
    const next = new Date(year, monthNum - 1 + delta, 1);
    setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
    setSelectedDate(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.eventType) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/public/buvette/${slug}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          ...formData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi");

      setMessage(
        `Votre demande pour le ${formatSelectedDate(selectedDate)} a bien été enregistrée.`
      );
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        eventType: "",
        message: "",
        marketingOptIn: false,
      });
      setSelectedDate(null);
      await load();
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !clubFound) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Réservation indisponible</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            {error || "Ce lien de réservation n'existe pas ou n'est plus actif."}
          </p>
        </div>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
        Chargement…
      </div>
    );
  }

  return (
    <BuvettePublicView
      clubName={clubName}
      clubLogoUrl={clubLogoUrl}
      theme={theme}
      month={month}
      days={days}
      grid={grid}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      goMonth={goMonth}
      hasAvailableDates={hasAvailableDates}
      loading={loading}
      message={message}
      error={error}
      clubFound={clubFound}
      formData={formData}
      setFormData={setFormData}
      submitting={submitting}
      submit={submit}
    />
  );
}

function BuvettePublicView({
  clubName,
  clubLogoUrl,
  theme,
  month,
  days,
  grid,
  selectedDate,
  setSelectedDate,
  goMonth,
  hasAvailableDates,
  loading,
  message,
  error,
  clubFound,
  formData,
  setFormData,
  submitting,
  submit,
}: {
  clubName: string;
  clubLogoUrl: string | null;
  theme: PublicVisualTheme;
  month: string;
  days: Record<string, "available" | "occupied" | "reserved">;
  grid: Array<Array<string | null>>;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  goMonth: (delta: number) => void;
  hasAvailableDates: boolean;
  loading: boolean;
  message: string | null;
  error: string | null;
  clubFound: boolean;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    eventType: string;
    message: string;
    marketingOptIn: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    eventType: string;
    message: string;
    marketingOptIn: boolean;
  }>>;
  submitting: boolean;
  submit: (e: React.FormEvent) => void;
}) {
  const layout = resolvePublicLayout(theme);
  const cta = ctaColors(theme.primaryColor, theme.secondaryColor, theme.accentColor);
  const fieldClass =
    "h-12 w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 text-sm outline-none transition focus:border-[rgba(15,23,42,0.28)]";

  return (
    <PublicPageCanvas theme={theme} priority>
      <PublicBrandingHero clubName={clubName} logoUrl={clubLogoUrl} theme={theme}>
        <a
          href="#calendrier"
          className="mt-6 inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-full px-6 text-sm font-semibold shadow-[0_10px_28px_rgba(2,6,23,0.22)] transition hover:opacity-95 sm:w-auto sm:min-w-[220px]"
          style={{ backgroundColor: cta.background, color: cta.color }}
        >
          Voir les disponibilités
        </a>
      </PublicBrandingHero>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="-mt-8 space-y-5 sm:-mt-10">
          {loading ? (
            <p className={cn("rounded-[1.35rem] px-4 py-3 text-center text-sm text-[#64748B]", layout.surfaceClass)}>
              Chargement du calendrier…
            </p>
          ) : null}
          {message ? (
            <div className={cn("rounded-[1.35rem] px-5 py-5 text-center", layout.surfaceClass)}>
              <p className="text-base font-semibold text-[#0F172A]">Réservation envoyée</p>
              <p className="mt-1.5 text-sm leading-relaxed text-[#64748B]">{message}</p>
            </div>
          ) : null}
          {error && clubFound ? (
            <p className="rounded-[1.35rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <section id="calendrier" className={cn("scroll-mt-6 overflow-hidden rounded-[1.5rem] p-4 sm:p-6", layout.surfaceClass)}>
            <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#64748B] sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Disponible
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Occupée
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Réservée
              </span>
            </div>

            <div className="mb-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(15,23,42,0.1)] text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC]"
                aria-label="Mois précédent"
              >
                {"<"}
              </button>
              <p className="text-base font-semibold capitalize tracking-tight text-[#0F172A] sm:text-lg">
                {formatMonthLabel(month)}
              </p>
              <button
                type="button"
                onClick={() => goMonth(1)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(15,23,42,0.1)] text-sm font-medium text-[#334155] transition hover:bg-[#F8FAFC]"
                aria-label="Mois suivant"
              >
                {">"}
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-[11px] font-medium text-[#94A3B8] sm:gap-2 sm:text-xs">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center">
                  {d}
                </div>
              ))}
            </div>

            <div className="space-y-1 sm:space-y-2">
              {grid.map((week, idx) => (
                <div key={idx} className="grid grid-cols-7 gap-1 sm:gap-2">
                  {week.map((date, dayIdx) => {
                    if (!date) return <div key={`${idx}-${dayIdx}-empty`} className="h-11 rounded-xl bg-[#F8FAFC]/80 sm:h-12" />;
                    const status = days[date] || "available";
                    const clickable = status === "available";
                    const isSelected = selectedDate === date;
                    const cls =
                      status === "available"
                        ? "bg-green-50 border-green-200 text-green-900 hover:bg-green-100"
                        : status === "reserved"
                          ? "cursor-not-allowed border-amber-300 bg-amber-50 text-amber-900"
                          : "cursor-not-allowed border-red-300 bg-red-50 text-red-900";
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => clickable && setSelectedDate(date)}
                        disabled={!clickable}
                        className={`h-11 rounded-xl border text-sm font-semibold transition sm:h-12 ${cls}`}
                        style={
                          isSelected
                            ? {
                                boxShadow: `0 0 0 2px ${cta.background}, 0 0 0 4px ${cta.background}33`,
                              }
                            : undefined
                        }
                        title={clickable ? "Date disponible" : "Date non disponible"}
                      >
                        {date.slice(-2)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {!loading && !hasAvailableDates ? (
              <p className="mt-4 text-center text-sm text-[#64748B]">
                Aucune date disponible ce mois-ci. Merci de consulter le mois suivant.
              </p>
            ) : null}
          </section>

          {selectedDate ? (
            <form onSubmit={submit} className={cn("space-y-4 rounded-[1.5rem] p-5 sm:p-6", layout.surfaceClass)}>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Votre demande</h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Créneau sélectionné :{" "}
                  <span className="font-semibold text-[#0F172A]">{formatSelectedDate(selectedDate)}</span>
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Prénom *"
                  autoComplete="given-name"
                  className={fieldClass}
                />
                <input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Nom *"
                  autoComplete="family-name"
                  className={fieldClass}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email *"
                  autoComplete="email"
                  className={fieldClass}
                />
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Téléphone"
                  autoComplete="tel"
                  className={fieldClass}
                />
              </div>
              <input
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                placeholder="Type d'événement *"
                className={fieldClass}
              />
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Message (optionnel)"
                rows={4}
                className="w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[rgba(15,23,42,0.28)]"
              />
              <label className="flex items-start gap-3 rounded-xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-3 text-sm text-[#334155]">
                <input
                  type="checkbox"
                  checked={formData.marketingOptIn}
                  onChange={(e) => setFormData({ ...formData, marketingOptIn: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
                <span>J’accepte de recevoir les communications du club par e-mail.</span>
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold disabled:opacity-50 sm:w-auto sm:min-w-[220px] sm:px-6"
                style={{ backgroundColor: cta.background, color: cta.color }}
              >
                {submitting ? "Envoi…" : "Envoyer la demande"}
              </button>
            </form>
          ) : null}
        </div>

        <footer
          className={cn(
            "pt-10 text-center text-xs",
            layout.immersive ? "text-white/65" : "text-[#94A3B8]"
          )}
        >
          {clubName} · propulsé par Obillz
        </footer>
      </main>
    </PublicPageCanvas>
  );
}
