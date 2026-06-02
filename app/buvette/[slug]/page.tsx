"use client";

import Image from "next/image";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import PublicClubLogo from "@/components/public/PublicClubLogo";
import { buildMonthGrid } from "@/lib/buvette/calendar";
import { getClubBrandPalette } from "@/lib/public-page/colors";

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

export default function PublicBuvettePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [month, setMonth] = useState(currentMonthKey());
  const [clubFound, setClubFound] = useState(false);
  const [clubName, setClubName] = useState("");
  const [pageTitle, setPageTitle] = useState("Réservation de buvette");
  const [pageDescription, setPageDescription] = useState<string | null>(null);
  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#1A23FF");
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
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
  });

  const brand = useMemo(
    () => getClubBrandPalette(primaryColor, accentColor),
    [primaryColor, accentColor]
  );

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
      setClubName(clubData.clubName || "Club");
      setPageTitle(clubData.title || "Réservation de buvette");
      setPageDescription(clubData.description || null);
      setClubLogoUrl(clubData.logoUrl || null);
      setPrimaryColor(clubData.primaryColor || "#1A23FF");
      setAccentColor(clubData.accentColor || null);
      setBannerUrl(clubData.bannerUrl || null);
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

      setMessage("Demande envoyée. Vous allez recevoir un email de confirmation.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        eventType: "",
        message: "",
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Réservation indisponible</p>
          <p className="mt-2 text-sm text-slate-600">
            {error || "Ce lien de réservation n'existe pas ou n'est plus actif."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: brand.pageBackground }}>
      <header className="relative overflow-hidden">
        {bannerUrl ? (
          <div className="absolute inset-0">
            <Image
              src={bannerUrl}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(165deg, ${brand.primary}ee 0%, ${brand.primaryDark}dd 55%, #0f172ae6 100%)`,
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: brand.headerGradient }} />
        )}

        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-col items-center text-center">
            <PublicClubLogo
              logoUrl={clubLogoUrl}
              clubName={clubName}
              accentColor={brand.primary}
              size="lg"
              className="mb-5"
            />
            <p
              className="text-xs font-bold uppercase tracking-[0.28em]"
              style={{ color: brand.headerTextMuted }}
            >
              {clubName}
            </p>
            <h1
              className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: brand.headerText }}
            >
              {pageTitle}
            </h1>
            {pageDescription ? (
              <p
                className="mt-4 max-w-xl text-base leading-relaxed sm:text-lg"
                style={{ color: brand.headerTextMuted }}
              >
                {pageDescription}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-3 pb-12 pt-8 sm:px-4">
        {loading && (
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-500 shadow-sm">
            Chargement du calendrier...
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm">
            {message}
          </div>
        )}
        {error && clubFound && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-lg shadow-slate-200/40 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-600 sm:text-sm">
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
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              aria-label="Mois précédent"
            >
              {"<"}
            </button>
            <p className="text-base font-semibold capitalize text-slate-800 sm:text-lg">
              {formatMonthLabel(month)}
            </p>
            <button
              type="button"
              onClick={() => goMonth(1)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              aria-label="Mois suivant"
            >
              {">"}
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2 text-xs font-medium text-slate-500">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {grid.map((week, idx) => (
              <div key={idx} className="grid grid-cols-7 gap-2">
                {week.map((date) => {
                  if (!date) return <div key={`${idx}-empty`} className="h-12 rounded-xl bg-slate-50/80" />;
                  const status = days[date] || "available";
                  const clickable = status === "available";
                  const isSelected = selectedDate === date;
                  const cls =
                    status === "available"
                      ? "bg-green-50 border-green-200 hover:bg-green-100 text-green-900"
                      : status === "reserved"
                        ? "bg-amber-50 border-amber-300 cursor-not-allowed text-amber-900"
                        : "bg-red-50 border-red-300 cursor-not-allowed text-red-900";
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
                              boxShadow: `0 0 0 2px ${brand.primary}, 0 0 0 4px ${brand.primarySoft}`,
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

          {!loading && !hasAvailableDates && (
            <p className="mt-4 text-sm text-slate-500">
              Aucune date disponible ce mois-ci. Merci de consulter le mois suivant.
            </p>
          )}
        </section>

        {selectedDate && (
          <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-6"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900">Votre demande</h2>
              <p className="mt-1 text-sm text-slate-600">
                Créneau sélectionné :{" "}
                <span className="font-semibold text-slate-800">
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("fr-CH", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Prénom *"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-400"
              />
              <input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Nom *"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-400"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email *"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-400"
              />
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Téléphone"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-400"
              />
            </div>
            <input
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              placeholder="Type d'événement *"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-400"
            />
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Message (optionnel)"
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-5 py-3 text-sm font-semibold shadow-md transition hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: brand.accent, color: brand.accentText }}
            >
              {submitting ? "Envoi..." : "Envoyer la demande"}
            </button>
          </form>
        )}

        <footer className="pt-2 text-center text-xs text-slate-500">
          Propulsé par <span className="font-semibold text-slate-700">Obillz</span>
        </footer>
      </main>
    </div>
  );
}
