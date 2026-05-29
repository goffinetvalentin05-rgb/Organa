"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Calendar } from "@/lib/icons";
import type { PublicClubEvent } from "@/lib/public-page/types";

export default function PublicClubEventsClient({
  slug,
  clubTitle,
  primaryColor,
}: {
  slug: string;
  clubTitle: string;
  primaryColor: string;
}) {
  const [events, setEvents] = useState<PublicClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/club/${slug}/events`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Impossible de charger les événements");
      setEvents(data.events || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const formatDate = (start: string, end: string | null) => {
    const d = new Date(`${start}T12:00:00`);
    if (Number.isNaN(d.getTime())) return start;
    const label = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (end && end !== start) {
      const e = new Date(`${end}T12:00:00`);
      if (!Number.isNaN(e.getTime())) {
        return `${label} → ${e.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
      }
    }
    return label;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header
        className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6"
        style={{ borderBottomColor: `${primaryColor}22` }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href={`/p/${slug}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {clubTitle}
            </p>
            <h1 className="text-lg font-bold text-slate-900">Prochains événements</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        {loading ? (
          <p className="text-center text-sm text-slate-600">Chargement…</p>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600">
            Aucun événement à venir pour le moment.
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-slate-900">{event.name}</h2>
                    {event.eventTypeName ? (
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        {event.eventTypeName}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(event.startDate, event.endDate)}
                    </p>
                    {event.description?.trim() ? (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {event.description.trim()}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
