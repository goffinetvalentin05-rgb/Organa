"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  FileText,
  ImagePlus,
  MapPin,
  Shield,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { easePremium } from "@/components/landing/landing-motion";

type MockLabels = {
  step1: {
    title: string;
    clubName: string;
    clubNameValue: string;
    sport: string;
    sportValue: string;
    location: string;
    locationValue: string;
    logo: string;
    cta: string;
  };
  step2: {
    title: string;
    fileName: string;
    uploadHint: string;
    importing: string;
    success: string;
  };
  step3: {
    title: string;
    president: string;
    treasurer: string;
    secretary: string;
    fullAccess: string;
    financeAccess: string;
    adminAccess: string;
  };
  step4: {
    title: string;
    members: string;
    membersCount: string;
    cotisations: string;
    cotisationsStatus: string;
    documents: string;
    documentsCount: string;
    events: string;
    eventsCount: string;
    centralized: string;
  };
};

function MockShell({
  children,
  className = "",
  compact = false,
}: {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`how-it-works-mock overflow-hidden border shadow-[0_32px_64px_-20px_rgba(15,23,42,0.14),0_0_0_1px_rgba(15,23,42,0.03)] ${
        compact
          ? "how-it-works-mock--compact rounded-[1.5rem] p-3.5"
          : "how-it-works-mock--desktop rounded-[1.75rem] p-7 sm:rounded-[2rem] sm:p-8 md:p-9"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px] md:text-xs">
      {children}
    </p>
  );
}

function FieldInput({
  value,
  icon,
  compact = false,
}: {
  value: string;
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`mt-1.5 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-2xl ${
        compact ? "px-2.5 py-2" : "px-3.5 py-3 sm:px-4 sm:py-3.5"
      }`}
    >
      {icon ? <span className="how-it-works-blue-icon shrink-0">{icon}</span> : null}
      <span
        className={`min-w-0 truncate font-medium text-slate-800 ${
          compact ? "text-sm" : "text-sm sm:text-[0.975rem]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function ClubCreationMock({
  labels,
  compact = false,
}: {
  labels: MockLabels["step1"];
  compact?: boolean;
}) {
  return (
    <MockShell compact={compact}>
      <p
        className={`font-bold tracking-tight text-slate-900 ${
          compact ? "text-[0.95rem]" : "text-lg sm:text-xl"
        }`}
      >
        {labels.title}
      </p>
      <div className={compact ? "mt-3 space-y-2.5" : "mt-6 space-y-5"}>
        <div>
          <FieldLabel>{labels.clubName}</FieldLabel>
          <FieldInput value={labels.clubNameValue} compact={compact} />
        </div>
        <div className={`grid ${compact ? "grid-cols-2 gap-2.5" : "gap-4 sm:grid-cols-2 sm:gap-5"}`}>
          <div>
            <FieldLabel>{labels.sport}</FieldLabel>
            <FieldInput value={labels.sportValue} compact={compact} />
          </div>
          <div>
            <FieldLabel>{labels.location}</FieldLabel>
            <FieldInput
              value={labels.locationValue}
              compact={compact}
              icon={compact ? undefined : <MapPin className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={2} />}
            />
          </div>
        </div>
        {compact ? null : (
          <div>
            <FieldLabel>{labels.logo}</FieldLabel>
            <div className="mt-1.5 flex items-center gap-3.5 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4">
              <span className="how-it-works-blue-soft flex h-12 w-12 items-center justify-center rounded-xl">
                <ImagePlus className="h-5 w-5" strokeWidth={2} />
              </span>
              <span className="text-sm text-slate-500 sm:text-[0.9375rem]">PNG, JPG · max 2 MB</span>
            </div>
          </div>
        )}
        <button
          type="button"
          className={`how-it-works-blue-fill w-full rounded-xl px-4 text-sm font-semibold text-white transition-transform hover:scale-[1.01] sm:rounded-2xl sm:text-[0.975rem] ${
            compact ? "mt-0.5 py-2.5" : "mt-1.5 py-3.5 sm:py-4"
          }`}
        >
          {labels.cta}
        </button>
      </div>
    </MockShell>
  );
}

export function MemberImportMock({
  labels,
  active,
  compact = false,
}: {
  labels: MockLabels["step2"];
  active: boolean;
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"upload" | "loading" | "done">("upload");

  useEffect(() => {
    if (!active) {
      setPhase("upload");
      return;
    }
    if (reduceMotion) {
      setPhase("done");
      return;
    }
    setPhase("loading");
    const t1 = window.setTimeout(() => setPhase("done"), 1400);
    return () => window.clearTimeout(t1);
  }, [active, reduceMotion]);

  const panelPad = compact ? "p-4" : "p-8 sm:p-10";

  return (
    <MockShell compact={compact}>
      <p
        className={`font-bold tracking-tight text-slate-900 ${
          compact ? "text-[0.95rem]" : "text-lg sm:text-xl"
        }`}
      >
        {labels.title}
      </p>
      <div className={compact ? "mt-3" : "mt-6"}>
        <AnimatePresence mode="wait">
          {phase === "upload" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: easePremium }}
              className={`rounded-2xl border border-dashed border-slate-200 bg-white text-center ${panelPad}`}
            >
              <span
                className={`how-it-works-blue-soft mx-auto flex items-center justify-center rounded-2xl ${
                  compact ? "h-12 w-12" : "h-14 w-14"
                }`}
              >
                <Upload className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={2} />
              </span>
              <p className={`font-semibold text-slate-800 ${compact ? "mt-3 text-sm" : "mt-4 text-base"}`}>
                {labels.fileName}
              </p>
              <p className={`text-slate-500 ${compact ? "mt-1 text-xs" : "mt-1.5 text-sm"}`}>
                {labels.uploadHint}
              </p>
            </motion.div>
          ) : null}

          {phase === "loading" ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: easePremium }}
              className={`rounded-2xl border border-slate-200 bg-white text-center ${panelPad}`}
            >
              <motion.span
                className={`how-it-works-blue-ring mx-auto flex items-center justify-center rounded-full border-2 ${
                  compact ? "h-12 w-12" : "h-14 w-14"
                }`}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />
              <p className={`font-medium text-slate-600 ${compact ? "mt-4 text-sm" : "mt-5 text-base"}`}>
                {labels.importing}
              </p>
            </motion.div>
          ) : null}

          {phase === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: easePremium }}
              className={`rounded-2xl border border-emerald-200/80 bg-emerald-50/60 text-center ${panelPad}`}
            >
              <span
                className={`mx-auto flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] ${
                  compact ? "h-12 w-12" : "h-14 w-14"
                }`}
              >
                <Check className={compact ? "h-6 w-6" : "h-7 w-7"} strokeWidth={2.5} />
              </span>
              <p className={`font-bold text-emerald-800 ${compact ? "mt-3 text-base" : "mt-5 text-xl"}`}>
                {labels.success}
              </p>
              <div className={`flex flex-wrap justify-center gap-2 ${compact ? "mt-3" : "mt-5 gap-2.5"}`}>
                {["MD", "CL", "SR", "AB", "PK"].map((initials) => (
                  <span
                    key={initials}
                    className={`flex items-center justify-center rounded-full bg-white font-bold text-slate-700 shadow-sm ring-1 ring-slate-200/80 ${
                      compact ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"
                    }`}
                  >
                    {initials}
                  </span>
                ))}
                <span
                  className={`how-it-works-blue-fill flex items-center justify-center rounded-full font-bold text-white ${
                    compact ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"
                  }`}
                >
                  +243
                </span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MockShell>
  );
}

function RoleBadge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "blue" | "emerald" | "amber";
}) {
  const styles = {
    blue: "how-it-works-blue-soft border",
    emerald: "bg-emerald-500/[0.1] text-emerald-700 border-emerald-500/20",
    amber: "bg-amber-500/[0.1] text-amber-700 border-amber-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${styles[variant]}`}>
      <Shield className="h-3 w-3" strokeWidth={2.5} />
      {children}
    </span>
  );
}

export function CommitteeMock({
  labels,
  compact = false,
}: {
  labels: MockLabels["step3"];
  compact?: boolean;
}) {
  const members = [
    { name: labels.president, role: labels.fullAccess, initials: "PD", gradient: "from-[#37b9ed] to-[#175dd4]", badge: "blue" as const },
    { name: labels.treasurer, role: labels.financeAccess, initials: "TR", gradient: "from-emerald-500 to-teal-500", badge: "emerald" as const },
    { name: labels.secretary, role: labels.adminAccess, initials: "SC", gradient: "from-amber-500 to-orange-500", badge: "amber" as const },
  ];

  return (
    <MockShell compact={compact}>
      <p
        className={`font-bold tracking-tight text-slate-900 ${
          compact ? "text-[0.95rem]" : "text-lg sm:text-xl"
        }`}
      >
        {labels.title}
      </p>
      <ul className={compact ? "mt-3 space-y-2" : "mt-6 space-y-3.5"}>
        {members.map((member) => (
          <li
            key={member.name}
            className={`flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:rounded-2xl ${
              compact ? "px-2.5 py-2.5" : "px-4 py-3.5 sm:px-5 sm:py-4"
            }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white shadow-md ${member.gradient} ${
                compact ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"
              }`}
            >
              {member.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`truncate font-bold text-slate-900 ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
                {member.name}
              </p>
              <div className="mt-1.5">
                <RoleBadge variant={member.badge}>{member.role}</RoleBadge>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </MockShell>
  );
}

export function CentralizedMock({
  labels,
  compact = false,
}: {
  labels: MockLabels["step4"];
  compact?: boolean;
}) {
  const tiles = [
    { icon: Users, label: labels.members, value: labels.membersCount, color: "how-it-works-blue-icon", bg: "how-it-works-blue-soft" },
    { icon: Wallet, label: labels.cotisations, value: labels.cotisationsStatus, color: "text-emerald-600", bg: "bg-emerald-500/[0.08]" },
    { icon: FileText, label: labels.documents, value: labels.documentsCount, color: "text-violet-600", bg: "bg-violet-500/[0.08]" },
    { icon: CalendarDays, label: labels.events, value: labels.eventsCount, color: "text-sky-600", bg: "bg-sky-500/[0.08]" },
  ];

  return (
    <MockShell compact={compact}>
      <p
        className={`font-bold tracking-tight text-slate-900 ${
          compact ? "text-[0.95rem]" : "text-lg sm:text-xl"
        }`}
      >
        {labels.title}
      </p>
      <div className={`grid grid-cols-2 ${compact ? "mt-3 gap-2" : "mt-6 gap-3.5 sm:gap-4"}`}>
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className={`rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:rounded-2xl ${
                compact ? "p-2.5" : "p-4 sm:p-5"
              }`}
            >
              <span
                className={`flex items-center justify-center rounded-xl ${tile.bg} ${tile.color} ${
                  compact ? "h-8 w-8" : "h-10 w-10"
                }`}
              >
                <Icon className={compact ? "h-3.5 w-3.5" : "h-5 w-5"} strokeWidth={2} />
              </span>
              <p
                className={`truncate font-semibold uppercase tracking-wide text-slate-500 ${
                  compact ? "mt-2 text-[10px]" : "mt-3.5 text-[11px]"
                }`}
              >
                {tile.label}
              </p>
              <p
                className={`mt-0.5 truncate font-bold text-slate-900 ${
                  compact ? "text-sm" : "text-sm sm:text-base"
                }`}
              >
                {tile.value}
              </p>
            </div>
          );
        })}
      </div>
      <div
        className={`how-it-works-blue-soft flex min-w-0 items-center justify-center gap-2.5 rounded-xl border px-3 sm:rounded-2xl sm:px-4 ${
          compact ? "mt-2.5 py-2.5" : "mt-5 py-3.5 sm:py-4"
        }`}
      >
        <span
          className={`how-it-works-blue-fill flex shrink-0 items-center justify-center rounded-full text-white ${
            compact ? "h-6 w-6" : "h-7 w-7"
          }`}
        >
          <Check className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.5} />
        </span>
        <p
          className={`how-it-works-blue-icon min-w-0 text-center font-semibold leading-snug ${
            compact ? "text-sm" : "text-sm sm:text-[0.975rem]"
          }`}
        >
          {labels.centralized}
        </p>
      </div>
    </MockShell>
  );
}

export type { MockLabels };
