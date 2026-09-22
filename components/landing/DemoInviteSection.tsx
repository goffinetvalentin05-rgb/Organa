"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

/**
 * URL d’embed du calendrier (Calendly, Cal.com, etc.).
 * Renseigner NEXT_PUBLIC_DEMO_CALENDAR_URL. Aucune URL n’est inventée.
 */
const DEMO_CALENDAR_URL = process.env.NEXT_PUBLIC_DEMO_CALENDAR_URL?.trim() ?? "";

/** Laisser vide tant que la photo n’est pas ajoutée, par exemple "/images/landing/valentin-goffinet.jpg". */
const FOUNDER_PHOTO_SRC = "";

function calendarEmbedSrc(raw: string): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "");
  if (host === "calendly.com" || host.endsWith(".calendly.com")) {
    url.searchParams.set("hide_gdpr_banner", "1");
    url.searchParams.set("hide_event_type_details", "1");
    url.searchParams.set("background_color", "ffffff");
    url.searchParams.set("primary_color", "1a23ff");
    url.searchParams.set("text_color", "0b1220");
  }
  if (host === "cal.com" || host.endsWith(".cal.com")) {
    url.searchParams.set("embed", "true");
    url.searchParams.set("theme", "light");
  }
  return url.toString();
}

export default function DemoInviteSection() {
  const reduceMotion = useReducedMotion();
  const embedSrc = calendarEmbedSrc(DEMO_CALENDAR_URL);

  return (
    <section className="lp-meet" id="demo" aria-labelledby="lp-meet-title">
      <div className="lp-meet__wrap">
        <motion.div
          className="lp-meet__card"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: easePremium }}
        >
          <div className="lp-meet__copy">
            <Image src="/logo-symbole.png" alt="" width={40} height={40} className="lp-meet__mark" />
            <Image src="/logo-symbole.png" alt="" width={180} height={180} className="lp-meet__watermark" aria-hidden />
            <h2 id="lp-meet-title">Parlons de votre club.</h2>
            <p>
              30 minutes pour comprendre votre fonctionnement, vos besoins et voir concrètement ce qu’OBILLZ peut vous apporter.
            </p>
            <div className="lp-meet__profile">
              <span className="lp-meet__avatar">
                {FOUNDER_PHOTO_SRC ? (
                  <Image src={FOUNDER_PHOTO_SRC} alt="" width={72} height={72} />
                ) : (
                  <span aria-hidden>VG</span>
                )}
              </span>
              <span className="lp-meet__identity">
                <strong>Valentin Goffinet</strong>
                <span>Fondateur d’OBILLZ</span>
              </span>
            </div>
          </div>

          <div className="lp-meet__cal">
            {embedSrc ? (
              <iframe
                className="lp-meet__frame"
                src={embedSrc}
                title="Réserver un échange de 30 minutes"
                loading="lazy"
              />
            ) : (
              <div className="lp-meet__slot" role="region" aria-label="Calendrier de réservation">
                <div className="lp-meet__preview" aria-hidden>
                  <div className="lp-meet__preview-month">
                    <div className="lp-meet__preview-head">
                      <span />
                      <i />
                      <span />
                    </div>
                    <div className="lp-meet__preview-week">
                      {Array.from({ length: 7 }, (_, index) => (
                        <i key={index} />
                      ))}
                    </div>
                    <div className="lp-meet__preview-grid">
                      {Array.from({ length: 35 }, (_, index) => (
                        <i key={index} className={index === 16 ? "is-on" : undefined} />
                      ))}
                    </div>
                  </div>
                  <div className="lp-meet__preview-slots">
                    <i />
                    <i className="is-on" />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
