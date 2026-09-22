"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";
import { useI18n } from "@/components/I18nProvider";

const FOUNDER_PHOTO_SRC = "/images/landing/valentin-goffinet.jpg";
const WHATSAPP_MESSAGE =
  "Bonjour Valentin, je voudrais en savoir plus sur OBILLZ pour mon club.";

const SHOTS = [
  {
    src: "/images/landing/club-growth-shop.png",
    width: 923,
    height: 520,
    className: "lp-meet__shot lp-meet__shot--shop",
    delay: 0.12,
    rotate: -1.5,
  },
  {
    src: "/images/landing/club-growth-supporter.jpg",
    width: 768,
    height: 1024,
    className: "lp-meet__shot lp-meet__shot--pass",
    delay: 0.2,
    rotate: -7,
  },
  {
    src: "/images/landing/club-growth-sale.png",
    width: 984,
    height: 373,
    className: "lp-meet__shot lp-meet__shot--sale",
    delay: 0.28,
    rotate: 4,
  },
] as const;

function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function DemoInviteSection() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const whatsappUrl = buildWhatsAppUrl(
    t("marketing.askChatGpt.whatsappPhone"),
    WHATSAPP_MESSAGE
  );

  return (
    <section className="lp-meet" id="demo" aria-labelledby="lp-meet-title">
      <div className="lp-meet__stage">
        <div className="lp-meet__panel">
          <div className="lp-meet__shots" aria-hidden>
            {SHOTS.map((shot) => (
              <motion.div
                key={shot.src}
                className={shot.className}
                initial={reduceMotion ? false : { opacity: 0, y: 28, rotate: shot.rotate }}
                whileInView={{ opacity: 1, y: 0, rotate: shot.rotate }}
                viewport={viewportOnce}
                transition={{ duration: 0.8, delay: shot.delay, ease: easePremium }}
              >
                <Image src={shot.src} alt="" width={shot.width} height={shot.height} />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="lp-meet__copy"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, ease: easePremium }}
          >
            <h2 id="lp-meet-title">
              <span>Vous avez vu ce qu’OBILLZ peut changer.</span>
              Parlons de votre club.
            </h2>
            <p>
              Un échange direct avec{" "}
              <span className="lp-meet__who">
                <Image
                  src={FOUNDER_PHOTO_SRC}
                  alt=""
                  width={28}
                  height={28}
                />
                Valentin
              </span>
              , fondateur d’OBILLZ, pour voir comment la plateforme peut s’adapter à votre club.
            </p>
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-meet__cta"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.22, ease: easePremium }}
            >
              Parler au fondateur
              <ArrowUpRight strokeWidth={2.25} aria-hidden />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
