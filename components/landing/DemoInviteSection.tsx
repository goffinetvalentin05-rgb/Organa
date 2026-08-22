"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { easePremium, viewportOnce } from "@/components/landing/landing-motion";

function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function DemoInviteSection() {
  const { t } = useI18n();
  const demoUrl = buildWhatsAppUrl(
    t("marketing.askChatGpt.whatsappPhone"),
    t("marketing.demoInvite.whatsappMessage")
  );

  return (
    <section className="lp-demo-invite" id="demo">
      <div className="lp-wrap">
        <motion.div
          className="lp-demo-invite__stage"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.55, ease: easePremium }}
        >
          <div className="lp-demo-invite__panel">
            <div className="lp-demo-invite__atmosphere" aria-hidden>
              <div className="lp-demo-invite__dots" />
              <div className="lp-demo-invite__halo lp-demo-invite__halo--a" />
              <div className="lp-demo-invite__halo lp-demo-invite__halo--b" />
            </div>

            <div className="lp-demo-invite__grid">
              <div className="lp-demo-invite__copy">
                <p className="lp-eyebrow">{t("marketing.demoInvite.label")}</p>
                <h2 className="lp-title">{t("marketing.demoInvite.title")}</h2>
                <p className="lp-lead">{t("marketing.demoInvite.description")}</p>

                <div className="lp-demo-invite__actions">
                  <a
                    href={demoUrl}
                    className="lp-demo-invite__cta"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("marketing.demoInvite.cta")}
                    <span className="lp-demo-invite__cta-icon" aria-hidden>
                      <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                    </span>
                  </a>
                  <Link href="/inscription" className="lp-demo-invite__secondary">
                    {t("marketing.demoInvite.ctaSecondary")}
                  </Link>
                </div>
              </div>

              <div className="lp-demo-invite__spacer" aria-hidden />
            </div>

            <div className="lp-demo-invite__visual lp-demo-invite__visual--mobile">
              <Image
                src="/images/landing/iphone-whatsapp-hand.png"
                alt={t("marketing.demoInvite.imageAlt")}
                width={862}
                height={1018}
                className="lp-demo-invite__photo"
                sizes="(max-width: 899px) 70vw, 1px"
                priority={false}
              />
            </div>
          </div>

          <div className="lp-demo-invite__visual lp-demo-invite__visual--desktop">
            <Image
              src="/images/landing/iphone-whatsapp-hand.png"
              alt={t("marketing.demoInvite.imageAlt")}
              width={862}
              height={1018}
              className="lp-demo-invite__photo"
              sizes="42vw"
              priority={false}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
