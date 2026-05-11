"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Clock, MapPin, UserCheck, Users } from "@/lib/icons";
import {
  PUBLIC_PLANNING_CONFIRM_STORAGE_KEY,
  type PublicPlanningConfirmationPayload,
} from "@/lib/planning/publicPlanningConfirmationPayload";
import {
  buildGoogleCalendarUrl,
  buildPublicPlanningSignupIcs,
} from "@/lib/planning/publicSignupCalendar";

function buildIcsFilename(payload: PublicPlanningConfirmationPayload) {
  const base = payload.eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "evenement"}-obillz.ics`;
}

export default function PublicPlanningConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";

  const [payload, setPayload] = useState<PublicPlanningConfirmationPayload | null>(null);
  const [icsHref, setIcsHref] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    try {
      const raw = sessionStorage.getItem(PUBLIC_PLANNING_CONFIRM_STORAGE_KEY);
      if (!raw) {
        router.replace(`/p/${token}`);
        return;
      }
      const parsed = JSON.parse(raw) as PublicPlanningConfirmationPayload;
      if (!parsed?.assignmentId || !parsed?.slotDate) {
        router.replace(`/p/${token}`);
        return;
      }
      setPayload(parsed);
    } catch {
      router.replace(`/p/${token}`);
    }
  }, [token, router]);

  const googleUrl = useMemo(() => {
    if (!payload?.slotDate) return "";
    const descParts = [
      `Poste / créneau : ${payload.slotLocation}`,
      payload.slotDateLabel ? `Date : ${payload.slotDateLabel}` : "",
      `Horaire : ${payload.startTime} – ${payload.endTime}`,
      `Participant : ${payload.participantName}`,
      `Club : ${payload.clubName}`,
      payload.planningDescription ? `\n${payload.planningDescription}` : "",
    ].filter(Boolean);
    return buildGoogleCalendarUrl({
      title: payload.eventName,
      description: descParts.join("\n"),
      location: payload.slotLocation,
      dateYmd: payload.slotDate,
      startTimeHm: payload.startTime,
      endTimeHm: payload.endTime,
    });
  }, [payload]);

  const buildIcs = useCallback(() => {
    if (!payload?.slotDate) return "";
    const descLines = [
      `Poste / créneau : ${payload.slotLocation}`,
      payload.slotDateLabel ? `Date : ${payload.slotDateLabel}` : "",
      `Horaire : ${payload.startTime} – ${payload.endTime}`,
      `Participant : ${payload.participantName}`,
      `Club : ${payload.clubName}`,
      payload.planningDescription || "",
    ].filter(Boolean);
    return buildPublicPlanningSignupIcs({
      uid: `planning-${payload.planningId}-assignment-${payload.assignmentId}@obillz`,
      summary: payload.eventName,
      description: descLines.join("\n"),
      location: payload.slotLocation,
      dateYmd: payload.slotDate,
      startTimeHm: payload.startTime,
      endTimeHm: payload.endTime,
    });
  }, [payload]);

  useEffect(() => {
    if (!payload?.slotDate) {
      setIcsHref(null);
      return;
    }
    const ics = buildIcs();
    if (!ics) {
      setIcsHref(null);
      return;
    }
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setIcsHref(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [payload, buildIcs]);

  const downloadIcs = () => {
    if (!payload || !icsHref) return;
    const a = document.createElement("a");
    a.href = icsHref;
    a.download = buildIcsFilename(payload);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!token || !payload) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-lg mx-auto text-center text-slate-600 text-sm">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Inscription confirmée</h1>
          <p className="mt-3 text-slate-600">
            Merci, votre inscription a bien été enregistrée.
          </p>

          <div className="mt-8 space-y-4 text-sm text-slate-700 border-t border-slate-100 pt-6">
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 shrink-0 text-slate-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Événement
                </p>
                <p className="font-medium text-slate-900">{payload.eventName}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 shrink-0 text-slate-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Poste / créneau
                </p>
                <p className="font-medium text-slate-900">{payload.slotLocation}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 shrink-0 text-slate-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</p>
                <p className="font-medium text-slate-900">
                  {payload.slotDateLabel || payload.slotDate || "—"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="w-5 h-5 shrink-0 text-slate-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Horaire
                </p>
                <p className="font-medium text-slate-900">
                  {payload.startTime} – {payload.endTime}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <UserCheck className="w-5 h-5 shrink-0 text-slate-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Participant
                </p>
                <p className="font-medium text-slate-900">{payload.participantName}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="w-5 h-5 shrink-0 text-slate-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Club organisateur
                </p>
                <p className="font-medium text-slate-900">{payload.clubName}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ajouter au calendrier
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {googleUrl ? (
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  Google Calendar
                </a>
              ) : (
                <span className="inline-flex justify-center items-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                  Google Calendar (date indisponible)
                </span>
              )}
              <button
                type="button"
                onClick={downloadIcs}
                disabled={!icsHref}
                className="inline-flex justify-center items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Apple Calendar (.ics)
              </button>
              <button
                type="button"
                onClick={downloadIcs}
                disabled={!icsHref}
                className="inline-flex justify-center items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 sm:col-span-2"
              >
                Outlook (.ics)
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <Link
              href={`/p/${token}`}
              className="inline-flex w-full justify-center items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Retour à l&apos;événement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
