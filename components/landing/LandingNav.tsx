"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";
import { easePremium } from "@/components/landing/landing-motion";

const menuItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: 0.06 + i * 0.05, ease: easePremium },
  }),
  exit: { opacity: 0, y: 8, transition: { duration: 0.2, ease: easePremium } },
};

type NavTheme = "dark" | "light";

function useLandingNavTheme(headerRef: RefObject<HTMLElement | null>) {
  const [theme, setTheme] = useState<NavTheme>(() =>
    typeof document !== "undefined" && document.querySelector(".legal-page")
      ? "light"
      : "dark"
  );

  useEffect(() => {
    const update = () => {
      const probe = headerRef.current?.getBoundingClientRect().bottom ?? 72;
      const footerContent = document.querySelector(".footer-content");
      const lightZone = document.querySelector(".landing-light-zone");

      /* Thème sombre dès que les colonnes du footer (zone bleue) arrivent sous la nav. */
      const footerContentTop = footerContent?.getBoundingClientRect().top;
      if (footerContentTop !== undefined && footerContentTop <= probe + 6) {
        setTheme("dark");
        return;
      }

      const lightRect = lightZone?.getBoundingClientRect();
      /* Zone claire + haut du footer (encore blanc) → thème clair. */
      if (lightRect && lightRect.top <= probe + 10) {
        setTheme("light");
        return;
      }

      /* Pages légales — fond clair dès le chargement. */
      if (document.querySelector(".legal-page")) {
        setTheme("light");
        return;
      }

      setTheme("dark");
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headerRef]);

  return theme;
}

export default function LandingNav() {
  const { t } = useI18n();
  const headerRef = useRef<HTMLElement>(null);
  const navTheme = useLandingNavTheme(headerRef);
  const isLight = navTheme === "light";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen, closeMenu]);

  return (
    <div className="landing-nav fixed inset-x-0 top-0 z-50 flex justify-center px-5 pt-7 sm:px-6 sm:pt-5 md:px-8 md:pt-6 lg:pt-7">
      <motion.header
        ref={headerRef}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easePremium }}
        className={`landing-nav-header relative flex h-11 w-full max-w-[min(100%,24rem)] flex-nowrap items-center justify-between gap-2 overflow-hidden rounded-full px-3.5 sm:h-12 sm:max-w-[min(100%,32rem)] sm:gap-3 sm:px-4 md:max-w-[min(100%,48rem)] md:px-5 lg:h-14 lg:max-w-[min(100%,1060px)] lg:gap-4 lg:px-8 xl:max-w-[min(100%,1100px)] ${
          isLight ? "landing-nav-header--light" : "landing-nav-header--dark"
        }`}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center transition hover:opacity-90"
          onClick={closeMenu}
        >
          <Image
            src="/obillz-logo.png"
            alt="Obillz"
            width={200}
            height={48}
            priority
            className={`h-8 w-auto sm:h-8 lg:h-9 ${isLight ? "landing-nav-logo--on-light" : ""}`}
          />
        </Link>

        <div className="landing-nav-actions hidden shrink-0 items-center gap-1.5 sm:gap-2 lg:flex lg:gap-3">
          <LanguageSwitcher compact theme={navTheme} />
          <Link
            href="/connexion"
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition sm:px-3.5 sm:py-1.5 sm:text-[13px] lg:px-5 lg:py-2 lg:text-sm ${
              isLight
                ? "border-slate-200/90 bg-white/70 text-slate-800 shadow-sm hover:border-slate-300 hover:bg-white"
                : "border-white/30 bg-white/[0.06] text-white/90 shadow-[0_0_16px_rgba(37,99,235,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] hover:border-white/45 hover:bg-white/[0.12] hover:shadow-[0_0_24px_rgba(37,99,235,0.16)]"
            }`}
          >
            {t("marketing.nav.login")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition lg:hidden ${
            isLight
              ? "border-slate-200/90 bg-slate-900/[0.04] text-slate-800 hover:bg-slate-900/[0.08]"
              : "border-white/20 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/[0.14]"
          }`}
          aria-expanded={isMenuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <span className="sr-only">{isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
          <span className="relative flex w-4 flex-col gap-1.5" aria-hidden>
            <motion.span
              className="block h-[2px] w-full origin-center rounded-full bg-current"
              animate={
                isMenuOpen
                  ? { y: 4, rotate: 45 }
                  : { y: 0, rotate: 0 }
              }
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: easePremium }}
            />
            <motion.span
              className="block h-[2px] w-full origin-center rounded-full bg-current"
              animate={
                isMenuOpen
                  ? { y: -4, rotate: -45 }
                  : { y: 0, rotate: 0 }
              }
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: easePremium }}
            />
          </span>
        </button>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.3, ease: easePremium }}
              className="fixed inset-0 z-40 bg-[#020617]/55 backdrop-blur-sm lg:hidden"
              aria-label="Fermer le menu"
              onClick={closeMenu}
            />

            <motion.nav
              id="landing-mobile-menu"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.38, ease: easePremium }}
              className="fixed inset-x-4 top-[calc(1rem+2.75rem+0.5rem)] z-50 overflow-hidden rounded-[1.35rem] border border-blue-300/28 bg-gradient-to-b from-white/[0.14] via-[#2563EB]/[0.08] to-[#0A1F4D]/[0.92] p-4 shadow-[0_0_0_1px_rgba(147,197,253,0.12),0_20px_60px_rgba(10,31,77,0.45),0_0_40px_rgba(37,99,235,0.16),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl sm:inset-x-6 sm:top-[calc(1.25rem+3rem+0.5rem)] sm:p-5 md:inset-x-8 md:top-[calc(1.5rem+3rem+0.5rem)] lg:hidden"
              aria-label="Menu mobile"
            >
              <div className="flex flex-col gap-1">
                <motion.div
                  custom={0}
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Link
                    href="/inscription"
                    onClick={closeMenu}
                    className="flex w-full items-center justify-center rounded-full border border-[rgba(37,99,235,0.14)] bg-white px-5 py-3 text-sm font-bold text-[#1D4ED8] shadow-[0_10px_30px_rgba(37,99,235,0.10)] transition active:scale-[0.98]"
                  >
                    {t("marketing.nav.cta")}
                  </Link>
                </motion.div>

                <motion.div
                  custom={1}
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Link
                    href="/connexion"
                    onClick={closeMenu}
                    className="mt-2 flex w-full items-center justify-center rounded-full border border-white/30 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/90 shadow-[0_0_20px_rgba(26,35,255,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] transition active:scale-[0.98]"
                  >
                    {t("marketing.nav.login")}
                  </Link>
                </motion.div>

                <motion.div
                  custom={2}
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mt-3 flex justify-center"
                >
                  <LanguageSwitcher theme="dark" />
                </motion.div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
