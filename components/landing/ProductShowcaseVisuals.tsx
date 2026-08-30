"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calendar, Check, FileText, FolderOpen, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";
import { DashboardBadge, EntityAvatar } from "@/components/ui";
import { getTranslationValue } from "@/lib/i18n";

function useProductPlay(delayMs: number) {
  const reduceMotion = useReducedMotion();
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setPlayed(true);
      return;
    }
    const id = window.setTimeout(() => setPlayed(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs, reduceMotion]);

  return { played, reduceMotion };
}

function CotisationsVisual() {
  const { t } = useI18n();
  const { played, reduceMotion } = useProductPlay(900);
  const collected = played ? 32 : 31;
  const paidLabel = t("marketing.showcases.cotisations.paid");
  const pendingLabel = t("marketing.showcases.cotisations.pending");

  const members = [
    { name: "Léa Martin", paid: true },
    { name: "Noah Berger", paid: played },
    { name: "Luc Girard", paid: false },
  ];

  return (
    <div className="lp-practice-demo" aria-hidden>
      <div className="lp-practice-demo__card">
        <header className="lp-practice-demo__header">
          <div className="min-w-0">
            <p className="lp-practice-demo__kicker">{t("marketing.showcases.cotisations.label")}</p>
            <p className="lp-practice-demo__heading">{t("marketing.showcases.cotisations.season")}</p>
          </div>
          <div className="lp-practice-demo__metric">
            <p className="lp-practice-demo__metric-label">{t("marketing.showcases.cotisations.collected")}</p>
            <p className="lp-practice-demo__metric-value">
              {collected} / 37
            </p>
            <div className="lp-practice-demo__bar">
              <motion.span
                className="lp-practice-demo__bar-fill"
                initial={false}
                animate={{ width: `${(collected / 37) * 100}%` }}
                transition={{ duration: 0.65, ease: easePremium }}
              />
            </div>
          </div>
        </header>

        <ul className="lp-practice-demo__rows">
          {members.map((member) => (
            <li key={member.name} className="lp-practice-demo__row">
              <EntityAvatar label={member.name} size="sm" className="!h-9 !w-9 !rounded-xl !text-xs !shadow-none" />
              <div className="lp-practice-demo__row-copy">
                <p className="lp-practice-demo__row-title">{member.name}</p>
                <p className="lp-practice-demo__row-meta">Seniors · 2025/26</p>
              </div>
              <p className="lp-practice-demo__amount">CHF 250.00</p>
              <span className="lp-practice-demo__status">
                <motion.span
                  key={member.paid ? "paid" : "pending"}
                  initial={reduceMotion || member.name !== "Noah Berger" ? false : { opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, ease: easePremium }}
                  className="inline-flex"
                >
                  <DashboardBadge variant={member.paid ? "success" : "warning"}>
                    {member.paid ? paidLabel : pendingLabel}
                  </DashboardBadge>
                </motion.span>
              </span>
            </li>
          ))}
        </ul>

        <div className="lp-practice-demo__footer">
          <AnimatePresence>
            {played ? (
              <motion.p
                className="lp-practice-demo__toast"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: easePremium }}
              >
                <span className="lp-practice-demo__toast-icon">
                  <Check className="h-3 w-3" strokeWidth={2.6} />
                </span>
                {t("marketing.showcases.cotisations.paymentReceived")}
              </motion.p>
            ) : (
              <span className="lp-practice-demo__toast-spacer" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PlanningsVisual() {
  const { t } = useI18n();
  const { played } = useProductPlay(900);
  const fullLabel = t("marketing.showcases.plannings.full");
  const confirmedLabel = t("marketing.showcases.plannings.confirmed");

  const slots = [
    {
      location: "Buvette",
      time: "09:00 – 12:00",
      people: "Marie Dupont · Jonas Perret",
      status: "full" as const,
    },
    {
      location: "Accueil",
      time: "11:00 – 13:00",
      people: played ? "Clara Morel · Luc Girard" : "Clara Morel",
      status: played ? ("confirmed" as const) : ("open" as const),
      count: played ? "2 / 2" : "1 / 2",
    },
    {
      location: "Caisse",
      time: "14:00 – 17:00",
      people: "Emma Rossi",
      status: "open" as const,
      count: "1 / 2",
    },
  ];

  return (
    <div className="lp-practice-demo" aria-hidden>
      <div className="lp-practice-demo__card">
        <header className="lp-practice-demo__header lp-practice-demo__header--plain">
          <span className="lp-practice-demo__icon">
            <Calendar className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="lp-practice-demo__kicker">{t("marketing.showcases.plannings.label")}</p>
            <p className="lp-practice-demo__heading">{t("marketing.showcases.plannings.day")}</p>
          </div>
        </header>

        <ul className="lp-practice-demo__slots">
          {slots.map((slot) => (
            <li key={slot.location} className="lp-practice-demo__slot">
              <span className="lp-practice-demo__slot-pin">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <div className="lp-practice-demo__slot-copy">
                <div className="lp-practice-demo__slot-top">
                  <p className="lp-practice-demo__row-title">{slot.location}</p>
                  {slot.status === "full" ? (
                    <DashboardBadge variant="success">{fullLabel}</DashboardBadge>
                  ) : slot.status === "confirmed" ? (
                    <DashboardBadge variant="success">{confirmedLabel}</DashboardBadge>
                  ) : (
                    <span className="lp-practice-demo__count">{slot.count}</span>
                  )}
                </div>
                <p className="lp-practice-demo__row-meta">
                  {slot.time} · {slot.people}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type DocumentItem = { name: string; meta: string };

function DocumentsVisual() {
  const { t, locale } = useI18n();
  const { played, reduceMotion } = useProductPlay(900);
  const raw = getTranslationValue(locale, "marketing.showcases.documents.items");
  const items = (Array.isArray(raw) ? raw : []) as DocumentItem[];

  return (
    <div className="lp-practice-demo" aria-hidden>
      <div className="lp-practice-demo__card">
        <header className="lp-practice-demo__header lp-practice-demo__header--plain">
          <span className="lp-practice-demo__icon">
            <FolderOpen className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="lp-practice-demo__kicker">{t("marketing.showcases.documents.label")}</p>
            <p className="lp-practice-demo__heading">{t("marketing.showcases.documents.heading")}</p>
          </div>
        </header>

        <ul className="lp-practice-demo__rows">
          {items.map((item, index) => (
            <li key={item.name} className="lp-practice-demo__row">
              <span className="lp-practice-demo__slot-pin">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <div className="lp-practice-demo__row-copy">
                <p className="lp-practice-demo__row-title">{item.name}</p>
                <p className="lp-practice-demo__row-meta">{item.meta}</p>
              </div>
              <motion.span
                className="inline-flex"
                initial={reduceMotion || index !== 0 ? false : { opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, ease: easePremium }}
              >
                <DashboardBadge variant={index === 0 && played ? "success" : "default"}>
                  {index === 0
                    ? t("marketing.showcases.documents.shared")
                    : t("marketing.showcases.documents.committee")}
                </DashboardBadge>
              </motion.span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OutroVisual() {
  const { t } = useI18n();

  return (
    <div className="lp-practice-outro" aria-hidden>
      <span className="lp-practice-outro__halo" />
      <div className="lp-practice-outro__card">
        <Image
          src="/logo-obillz-bleu.png"
          alt=""
          width={500}
          height={114}
          className="lp-practice-outro__logo"
        />
        <span className="lp-practice-outro__rule" />
        <p className="lp-practice-outro__caption">
          {t("marketing.showcases.outro.visualCaption")}
        </p>
      </div>
    </div>
  );
}

export function PracticeStepVisual({ stepIndex }: { stepIndex: number }) {
  if (stepIndex === 1) return <PlanningsVisual />;
  if (stepIndex === 2) return <DocumentsVisual />;
  if (stepIndex === 3) return <OutroVisual />;
  return <CotisationsVisual />;
}
