"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock3,
  FileText,
  Heart,
  HeartHandshake,
  Landmark,
  MapPin,
  Megaphone,
  Menu,
  Package,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type SVGProps,
} from "react";
import ProductSwitcher from "@/components/ProductSwitcher";
import { associationFeatures } from "@/lib/associations";
import styles from "./associations.module.css";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const featureIcons: IconComponent[] = [
  Users,
  WalletCards,
  Calendar,
  Megaphone,
  FileText,
  Landmark,
  Package,
  MapPin,
  TrendingUp,
  UserCheck,
];

/** Composition libre, équilibrée à la main autour d'une zone centrale protégée. */
const featureFloatLayout = [
  { x: 12, y: 26, size: 78, rotation: -7, duration: 5.8, delay: -1.1, label: "Membres" },
  { x: 32, y: 9, size: 64, rotation: 5, duration: 6.5, delay: -3.2, label: "Cotisations" },
  { x: 73, y: 14, size: 82, rotation: -4, duration: 6.1, delay: -2.3, label: "Événements" },
  { x: 91, y: 33, size: 70, rotation: 7, duration: 7.1, delay: -4.1, label: "Communication" },
  { x: 88, y: 68, size: 78, rotation: -6, duration: 6.3, delay: -0.8, label: "Documents" },
  { x: 70, y: 88, size: 66, rotation: 6, duration: 7.3, delay: -3.7, label: "Comité" },
  { x: 40, y: 91, size: 84, rotation: -8, duration: 6.7, delay: -2.6, label: "Matériel" },
  { x: 17, y: 77, size: 70, rotation: 5, duration: 5.9, delay: -1.8, label: "Locaux" },
  { x: 8, y: 53, size: 76, rotation: -4, duration: 7, delay: -4.5, label: "Finances" },
  { x: 54, y: 6, size: 60, rotation: 4, duration: 6.2, delay: -1.4, label: "Présences" },
];

const steps = [
  ["01", "Créez votre association.", "Quelques informations suffisent pour préparer votre espace."],
  ["02", "Importez vos membres.", "Retrouvez votre communauté sans tout ressaisir."],
  ["03", "Invitez votre comité.", "Chacun reçoit les accès adaptés à son rôle."],
  ["04", "Gérez simplement.", "Votre association avance depuis un même endroit."],
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const founderWhatsAppUrl = `https://wa.me/41788739065?text=${encodeURIComponent(
  "Bonjour, je souhaite découvrir Obillz Associations et réserver une démo avec le fondateur."
)}`;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function Wordmark() {
  return (
    <Link href="/associations" className="flex items-center transition hover:opacity-90" aria-label="Obillz">
      <Image
        src="/obillz-logo.png"
        alt="Obillz"
        width={200}
        height={48}
        priority
        className="landing-nav-logo--on-light h-8 w-auto max-w-[140px] object-contain object-left sm:h-9 sm:max-w-none"
      />
    </Link>
  );
}

const stepIcons: IconComponent[] = [HeartHandshake, Users, ShieldCheck, Sparkles];

const stepEntrances = [
  { opacity: 0, x: -70, rotate: -3 },
  { opacity: 0, x: 70, rotate: 3 },
  { opacity: 0, y: 60, scale: 0.94 },
  { opacity: 0, y: 20, scale: 0.86 },
];

function HowItWorksJourney() {
  const journeyRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start 72%", "end 42%"],
  });
  const lineProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.4,
  });

  return (
    <motion.section
      id="fonctionnement"
      className={`${styles.softGrid} ${styles.journeySection}`}
      initial={
        reduceMotion
          ? { opacity: 1 }
          : {
              opacity: 0,
              y: 120,
              scale: 0.96,
              boxShadow:
                "0 0 0 rgba(23,33,29,0), 0 0 0 rgba(23,33,29,0), inset 0 1px 0 rgba(255,255,255,0.25)",
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        boxShadow:
          "0 34px 95px rgba(23,33,29,0.13), 0 8px 30px rgba(23,33,29,0.06), inset 0 1px 0 rgba(255,255,255,1)",
      }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: reduceMotion ? 0 : 1.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className={styles.noise} />
      <div className="relative mx-auto max-w-[1120px]">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="mb-4 text-xs font-black uppercase tracking-[.2em] text-[#d35e49]">
            Simple dès le départ
          </p>
          <h2 className={styles.sectionTitle}>Quatre étapes. Et c’est parti.</h2>
        </motion.div>

        <div ref={journeyRef} className={styles.journey}>
          <div className={styles.journeyLine} aria-hidden />
          <motion.div
            className={styles.journeyLineProgress}
            style={reduceMotion ? { scaleY: 1 } : { scaleY: lineProgress }}
            aria-hidden
          />

          {steps.map(([number, title, text], index) => {
            const Icon = stepIcons[index];
            const isLeft = index % 2 === 0;

            return (
              <div key={number} className={styles.journeyRow}>
                <motion.article
                  initial={reduceMotion ? { opacity: 0 } : stepEntrances[index]}
                  whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-90px" }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.78,
                    delay: index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { y: -7, rotate: isLeft ? -0.7 : 0.7, scale: 1.015 }
                  }
                  className={`${styles.journeyCard} ${
                    isLeft ? styles.journeyCardLeft : styles.journeyCardRight
                  }`}
                  style={{ "--step-accent": associationFeatures[index].accent } as CSSProperties}
                >
                  <div className={styles.journeyCardGlow} aria-hidden />
                  <div className="relative flex items-start justify-between gap-5">
                    <div>
                      <span className={styles.journeyStepLabel}>Étape {number}</span>
                      <h3 className="mt-5 text-2xl font-extrabold leading-tight tracking-[-.04em] text-[#17211d]">
                        {title}
                      </h3>
                      <p className="mt-3 max-w-[300px] text-sm font-medium leading-relaxed text-[#717e77]">
                        {text}
                      </p>
                    </div>
                    <span className={styles.journeyIllustration}>
                      <span className={styles.journeyIllustrationRing} />
                      <Icon className="relative z-10 h-6 w-6" strokeWidth={1.8} />
                    </span>
                  </div>
                  <div className={styles.journeyCardLines} aria-hidden>
                    <span />
                    <span />
                    <span />
                  </div>
                </motion.article>

                <div className={styles.journeyNode} aria-hidden>
                  <span>{number}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

export function LegacyWhyAssociationsSection() {
  const reduceMotion = useReducedMotion();
  const enterTransition = {
    duration: reduceMotion ? 0 : 0.78,
    ease: [0.22, 1, 0.36, 1] as const,
  };
  const centralizedItems = [
    "Membres",
    "Cotisations",
    "Événements",
    "Communication",
    "Documents",
    "Matériel",
  ];
  const communities = ["Sociétés de musique", "Théâtres", "Chorales", "Associations locales"];

  return (
    <section className={styles.whySection}>
      <div className={styles.noise} />
      <div className="relative mx-auto max-w-[1180px]">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={enterTransition}
          className="mx-auto max-w-[900px] text-center"
        >
          <p className="mb-5 text-xs font-black uppercase tracking-[.2em] text-[#d35e49]">
            Pourquoi Obillz Associations
          </p>
          <h2 className={styles.whyTitle}>
            Les associations ne cherchent pas un logiciel compliqué.
            <span>Elles veulent simplement récupérer du temps.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed text-[#68756e] sm:text-lg">
            Pensé par des bénévoles, construit avec celles et ceux qui font vivre les
            associations chaque semaine.
          </p>
        </motion.div>

        <div className={styles.whyBento}>
          <motion.article
            initial={{ opacity: 0, x: reduceMotion ? 0 : -45, y: reduceMotion ? 0 : 25 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ ...enterTransition, delay: 0.05 }}
            whileHover={reduceMotion ? undefined : { y: -7, rotate: -0.35, scale: 1.008 }}
            className={`${styles.whyBlock} ${styles.whyTimeBlock}`}
          >
            <div className={styles.whyBlockGlow} aria-hidden />
            <div className="relative z-10">
              <span className={styles.whyNumber}>01</span>
              <h3 className="mt-6 text-3xl font-extrabold tracking-[-.05em] text-[#17211d] sm:text-4xl">
                Gagnez du temps.
              </h3>
              <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-[#68756e] sm:text-base">
                Le plus gros bénéfice d’Obillz n’est pas d’ajouter des fonctionnalités.
                C’est de supprimer des heures d’administratif et de rendre leurs soirées
                aux bénévoles.
              </p>
            </div>
            <div className={styles.timeVisual} aria-hidden>
              <span className={styles.timeOrbitOne} />
              <span className={styles.timeOrbitTwo} />
              <span className={styles.timeHand} />
              <Clock3 className="relative z-10 h-10 w-10" strokeWidth={1.45} />
              <span className={styles.timeLabel}>Temps retrouvé</span>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, x: reduceMotion ? 0 : 45, scale: reduceMotion ? 1 : 0.96 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ ...enterTransition, delay: 0.12 }}
            whileHover={reduceMotion ? undefined : { y: -6, rotate: 0.3, scale: 1.008 }}
            className={`${styles.whyBlock} ${styles.whyCentralBlock}`}
          >
            <div className={styles.whyBlockGlow} aria-hidden />
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4">
                <span className={styles.whyNumber}>02</span>
                <span className={styles.centralPulse}>
                  <Package className="h-4 w-4" strokeWidth={1.8} />
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-extrabold tracking-[-.045em] text-[#17211d] sm:text-3xl">
                Tout au même endroit.
              </h3>
              <p className="mt-4 text-sm font-medium leading-relaxed text-[#68756e]">
                Plus besoin de passer d’un groupe WhatsApp à Excel puis à un Drive. Tout
                est regroupé dans une seule plateforme.
              </p>
              <div className={styles.centralizedCloud}>
                {centralizedItems.map((item, index) => (
                  <motion.span
                    key={item}
                    animate={
                      reduceMotion
                        ? undefined
                        : { y: [0, index % 2 === 0 ? -3 : 3, 0] }
                    }
                    transition={{
                      duration: 3.8 + index * 0.18,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: -index * 0.35,
                    }}
                  >
                    {item}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: reduceMotion ? 0 : 55, scale: reduceMotion ? 1 : 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ ...enterTransition, delay: 0.18 }}
            whileHover={reduceMotion ? undefined : { y: -7, rotate: 0.25, scale: 1.006 }}
            className={`${styles.whyBlock} ${styles.whyTogetherBlock}`}
          >
            <div className={styles.whyBlockGlow} aria-hidden />
            <div className="relative z-10 grid gap-9 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={styles.whyNumber}>03</span>
                  <span className={styles.whyDifference}>Notre plus grande différence</span>
                </div>
                <h3 className="mt-6 text-3xl font-extrabold tracking-[-.05em] text-[#17211d] sm:text-4xl">
                  Construit <span className="text-[#d8624d]">AVEC</span> les associations.
                </h3>
                <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-[#68756e] sm:text-base">
                  Nous échangeons avec elles, nous écoutons leurs besoins et nous
                  développons les fonctionnalités qu’elles utilisent réellement. Le
                  logiciel grandit avec les personnes qui l’utiliseront chaque semaine.
                </p>
              </div>
              <div className={styles.communityVisual}>
                <span className={styles.communityCenter}>
                  <HeartHandshake className="h-7 w-7" strokeWidth={1.7} />
                </span>
                {communities.map((community, index) => (
                  <span
                    key={community}
                    className={styles.communityPill}
                    style={{ "--community-index": index } as CSSProperties}
                  >
                    <span />
                    {community}
                  </span>
                ))}
              </div>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}

function WhyAssociationsSection() {
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : 0.78,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section className={styles.collaborationSection}>
      <div className={styles.noise} />
      <div className="relative mx-auto max-w-[1180px]">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={transition}
          className="mx-auto max-w-[980px] text-center"
        >
          <p className="mb-5 text-xs font-black uppercase tracking-[.2em] text-[#d35e49]">
            Pourquoi Obillz Associations
          </p>
          <h2 className={styles.collaborationTitle}>
            Construit avec les associations.
            <span>Pas seulement pour elles.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-3xl text-base font-medium leading-relaxed text-[#68756e] sm:text-lg">
            Obillz Associations évoluera avec les associations qui l’utiliseront.
            Chaque retour, chaque idée et chaque besoin nous permettront de développer
            un logiciel toujours plus adapté à leur réalité.
          </p>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: reduceMotion ? 0 : 50,
            scale: reduceMotion ? 1 : 0.975,
          }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ ...transition, delay: 0.12 }}
          className={styles.collaborationPanel}
        >
          <div className={styles.collaborationGlow} aria-hidden />
          <div className="relative z-10 grid gap-12 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
            <div>
              <span className={styles.collaborationBadge}>
                <HeartHandshake className="h-4 w-4" strokeWidth={1.8} />
                Une vision collaborative
              </span>
              <h3 className="mt-7 text-3xl font-extrabold tracking-[-.05em] text-[#17211d] sm:text-4xl">
                Un logiciel qui grandira avec vous.
              </h3>
              <p className="mt-5 text-sm font-medium leading-relaxed text-[#68756e] sm:text-base">
                Nous écouterons les besoins, les difficultés et les idées des
                associations afin de développer les fonctionnalités qui leur feront
                réellement gagner du temps.
              </p>

              <div className={styles.collaborationPrinciples}>
                {[
                  ["Écouter", "Chaque retour compte."],
                  ["Comprendre", "Chaque association a sa réalité."],
                  ["Construire", "Les fonctionnalités vraiment utiles."],
                ].map(([title, text], index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, x: reduceMotion ? 0 : -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...transition, delay: 0.24 + index * 0.08 }}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>
                      <strong>{title}</strong>
                      {text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className={styles.collaborationVisual} aria-label="Boucle de co-construction">
              <div className={styles.collaborationGrid} aria-hidden />
              <motion.div
                className={`${styles.feedbackNode} ${styles.feedbackIdea}`}
                animate={
                  reduceMotion ? undefined : { y: [0, -7, 0], rotate: [-2, 0, -2] }
                }
                transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  <strong>Une idée</strong>
                  pour aller plus loin
                </span>
              </motion.div>
              <motion.div
                className={`${styles.feedbackNode} ${styles.feedbackNeed}`}
                animate={
                  reduceMotion ? undefined : { y: [0, 6, 0], rotate: [2, 0, 2] }
                }
                transition={{
                  duration: 6.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: -2,
                }}
              >
                <Megaphone className="h-4 w-4" />
                <span>
                  <strong>Un besoin</strong>
                  issu du quotidien
                </span>
              </motion.div>
              <motion.div
                className={`${styles.feedbackNode} ${styles.feedbackDifficulty}`}
                animate={
                  reduceMotion ? undefined : { x: [0, 5, 0], y: [0, -3, 0] }
                }
                transition={{
                  duration: 5.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: -3,
                }}
              >
                <Users className="h-4 w-4" />
                <span>
                  <strong>Une difficulté</strong>
                  à simplifier
                </span>
              </motion.div>

              <div className={styles.collaborationCore}>
                <span className={styles.collaborationCorePulse} />
                <Image
                  src="/logo-symbole.png"
                  alt=""
                  width={42}
                  height={42}
                  className="relative z-10 h-10 w-10 object-contain"
                />
                <span>Obillz Associations</span>
              </div>

              <motion.div
                className={styles.collaborationOutput}
                animate={reduceMotion ? undefined : { scale: [1, 1.025, 1] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="h-2 w-2 rounded-full bg-[#7f9c88] shadow-[0_0_0_5px_rgba(127,156,136,.12)]" />
                Le produit évolue
              </motion.div>
            </div>
          </div>

          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ ...transition, delay: 0.38 }}
            className={styles.collaborationManifesto}
          >
            Notre objectif n’est pas de créer un outil générique, mais une plateforme
            construite avec celles et ceux qui la feront vivre au quotidien.
          </motion.blockquote>
        </motion.div>
      </div>
    </section>
  );
}

function AssociationsNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [open]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between rounded-[1.35rem] border border-white/70 bg-[#fbfaf6]/85 px-4 shadow-[0_12px_45px_rgba(35,48,41,.09)] backdrop-blur-2xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Wordmark />
          <div className="hidden h-6 w-px bg-[#17211d]/10 md:block" />
          <div className="hidden md:block">
            <ProductSwitcher current="associations" theme="light" />
          </div>
        </div>

        <div className="hidden items-center gap-7 lg:flex">
          <a href="#histoire" className="text-sm font-semibold text-[#65716b] transition hover:text-[#17211d]">Notre histoire</a>
          <a href="#fonctionnalites" className="text-sm font-semibold text-[#65716b] transition hover:text-[#17211d]">Fonctionnalités</a>
          <a href="#fonctionnement" className="text-sm font-semibold text-[#65716b] transition hover:text-[#17211d]">Comment ça marche</a>
          <a
            href="mailto:contact@obillz.com?subject=Démonstration Obillz Associations"
            className="rounded-full bg-[#17211d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(23,33,29,.18)] transition hover:-translate-y-0.5 hover:bg-[#293b33]"
          >
            Réserver une démo
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#17211d]/10 bg-white text-[#17211d] lg:hidden"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-2 max-w-[1180px] rounded-[1.35rem] border border-white/80 bg-[#fbfaf6]/95 p-3 shadow-2xl backdrop-blur-2xl lg:hidden"
          >
            <div className="mb-2 md:hidden"><ProductSwitcher current="associations" theme="light" /></div>
            {[
              ["#histoire", "Notre histoire"],
              ["#fonctionnalites", "Fonctionnalités"],
              ["#fonctionnement", "Comment ça marche"],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-[#3d4943] hover:bg-[#f0ede5]">
                {label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default function AssociationsLanding() {
  const reduceMotion = useReducedMotion();
  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number | null>(null);
  const [hoveredFeatureIndex, setHoveredFeatureIndex] = useState<number | null>(null);
  const activeFeature =
    activeFeatureIndex === null ? null : associationFeatures[activeFeatureIndex];
  const transition = { duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <main className={styles.page}>
      <AssociationsNav />

      <section className={styles.hero}>
        <div className={styles.noise} />
        <motion.div
          className="pointer-events-none absolute left-[8%] top-[22%] h-64 w-64 rounded-full bg-[#ed7059]/15 blur-[75px]"
          animate={reduceMotion ? undefined : { x: [0, 34, 0], y: [0, -20, 0], scale: [1, 1.12, 1], opacity: [0.45, 0.8, 0.45] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute bottom-[12%] right-[7%] h-80 w-80 rounded-full bg-[#7f9c88]/20 blur-[90px]"
          animate={reduceMotion ? undefined : { x: [0, -28, 0], y: [0, 24, 0], scale: [1, 1.1, 1], opacity: [0.4, 0.72, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: -3 }}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-[1060px] items-center justify-center">
          <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }} className="relative z-10 flex w-full flex-col items-center text-center">
            <motion.div variants={fadeUp} transition={transition} className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#ed7059]/20 bg-white/70 px-4 py-2 text-xs font-bold text-[#b84e3a] shadow-sm backdrop-blur">
              <Heart className="h-3.5 w-3.5 fill-current" /> Un nouvel univers Obillz
            </motion.div>
            <motion.h1 variants={fadeUp} transition={transition} className={styles.display}>
              Gérez votre association <span className="relative text-[#ed7059]">sans perdre vos soirées.<svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 520 18" fill="none" aria-hidden><path d="M3 12C135 2 353 3 517 8" stroke="#ed7059" strokeWidth="5" strokeLinecap="round" opacity=".35"/></svg></span>
            </motion.h1>
            <motion.p variants={fadeUp} transition={transition} className="mx-auto mt-8 max-w-[760px] text-base font-medium leading-relaxed text-[#65716b] sm:text-lg">
              Des membres aux cotisations, en passant par les événements, les documents et la communication, Obillz simplifie la gestion des associations et fait gagner des heures aux bénévoles.
            </motion.p>
            <motion.div variants={fadeUp} transition={transition} className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#fonctionnalites" className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#ed7059] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(237,112,89,.27)] transition hover:-translate-y-0.5 hover:bg-[#d85e48]">
                Découvrir Obillz Associations <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>
              <a
                href={founderWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#17211d]/15 bg-white/70 px-6 py-3.5 text-sm font-extrabold text-[#17211d] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                <WhatsAppIcon className="h-[18px] w-[18px] text-[#25D366]" />
                Réserver une démo avec le fondateur
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-[#17211d]/[0.07] bg-white py-4">
        <div className={styles.marquee}>
          {[...Array(2)].flatMap((_, copy) => ["Sociétés de musique", "Chorales", "Théâtres", "Jeunesses", "Associations locales"].map((item) => (
            <span key={`${copy}-${item}`} className="flex items-center gap-7 px-7 text-xs font-black uppercase tracking-[.16em] text-[#7c8882]">{item}<span className="h-1.5 w-1.5 rounded-full bg-[#ed7059]" /></span>
          )))}
        </div>
      </div>

      <section id="histoire" className="relative bg-[#17211d] px-5 py-24 text-white sm:py-32">
        <div className={styles.noise} style={{ opacity: 0.09, mixBlendMode: "screen" }} />
        <div className="relative mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[.8fr_1.2fr]">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} transition={transition}>
            <p className="mb-6 text-xs font-black uppercase tracking-[.2em] text-[#ed8b77]">Notre histoire</p>
            <h2 className={styles.storyTitle}>Parce que la passion ne devrait jamais rimer avec administration.</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} transition={{ staggerChildren: 0.12 }} className="space-y-6 text-lg leading-relaxed text-white/65 sm:text-xl">
            <motion.p variants={fadeUp} transition={transition}>Nous avons commencé par développer Obillz pour les clubs sportifs, parce que c’est dans cet univers que nous avons grandi.</motion.p>
            <motion.p variants={fadeUp} transition={transition}>Puis nous avons vu plus large. Chaque semaine, des milliers de personnes donnent leur temps pour faire vivre une société de musique, une chorale, une troupe de théâtre ou une association locale.</motion.p>
            <motion.p variants={fadeUp} transition={transition}>Elles aussi gèrent des membres, des cotisations, des événements, des documents et toute une vie administrative — souvent le soir, une fois leur journée terminée.</motion.p>
            <motion.p variants={fadeUp} transition={transition} className="font-serif text-2xl italic text-white sm:text-3xl">Ces bénévoles méritent eux aussi des outils modernes.</motion.p>
            <motion.p variants={fadeUp} transition={transition}>C’est pour eux que nous développons aujourd’hui <strong className="font-bold text-[#f49a88]">Obillz Associations.</strong></motion.p>
          </motion.div>
        </div>
      </section>

      <section id="fonctionnalites" className={styles.featuresOrbitSection}>
        <div className={styles.noise} />
        <div className={styles.orbitShell}>
          <div className={styles.orbitStage}>
            <div className={styles.orbitNodes}>
              {associationFeatures.map((feature, index) => {
                const Icon = featureIcons[index];
                const node = featureFloatLayout[index];
                const active = activeFeatureIndex === index;
                const focusIndex = hoveredFeatureIndex ?? activeFeatureIndex;
                const dimmed = focusIndex !== null && focusIndex !== index;
                const nodeStyle = {
                  "--node-x": `${node.x}%`,
                  "--node-y": `${node.y}%`,
                  "--node-size": `${node.size}px`,
                  "--node-rotation": `${node.rotation}deg`,
                  "--node-accent": feature.accent,
                  "--node-soft": `${feature.accent}1f`,
                  "--float-duration": `${node.duration}s`,
                  "--float-delay": `${node.delay}s`,
                } as CSSProperties;

                return (
                  <button
                    key={feature.slug}
                    type="button"
                    onClick={() =>
                      setActiveFeatureIndex((current) => (current === index ? null : index))
                    }
                    onMouseEnter={() => setHoveredFeatureIndex(index)}
                    onMouseLeave={() => setHoveredFeatureIndex(null)}
                    onFocus={() => setHoveredFeatureIndex(index)}
                    onBlur={() => setHoveredFeatureIndex(null)}
                    className={`${styles.orbitNode} ${active ? styles.orbitNodeActive : ""} ${
                      dimmed ? styles.orbitNodeDimmed : ""
                    }`}
                    style={nodeStyle}
                    aria-pressed={active}
                    aria-label={`Découvrir ${feature.title}`}
                  >
                    <span className={styles.orbitNodeIcon}>
                      <span className={styles.orbitNodeIconInner}>
                        <Icon className="h-5 w-5" strokeWidth={1.9} />
                      </span>
                    </span>
                    <span className={styles.orbitNodeLabel}>{node.label}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.orbitCore}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                transition={transition}
                className="w-full"
              >
              <p className="mb-3 text-[10px] font-black uppercase tracking-[.18em] text-[#d35e49]">
                Tout au même endroit
              </p>
              <h2 className={styles.orbitTitle}>
                Les outils qu’une association attendait vraiment.
              </h2>
              <p className={styles.orbitSubtitle}>
                Chaque fonctionnalité répond à une réalité du terrain associatif, sans
                complexité inutile.
              </p>

              <div className={styles.orbitCardSlot}>
                <AnimatePresence mode="wait">
                  {activeFeature && activeFeatureIndex !== null ? (
                    <motion.div
                      key={activeFeature.slug}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.32,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`${styles.selectedFeatureCard} p-4 sm:p-5`}
                      style={
                        { "--selected-accent": activeFeature.accent } as CSSProperties
                      }
                    >
                      <div className="relative flex items-start gap-2.5">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            color: activeFeature.accent,
                            backgroundColor: `${activeFeature.accent}18`,
                          }}
                        >
                          {(() => {
                            const ActiveIcon = featureIcons[activeFeatureIndex];
                            return <ActiveIcon className="h-4 w-4" />;
                          })()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-extrabold tracking-[-.025em] text-[#17211d]">
                            {activeFeature.title}
                          </h3>
                          <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#68756e]">
                            {activeFeature.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveFeatureIndex(null)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#8b9690] transition hover:bg-[#f4f0e7] hover:text-[#17211d]"
                          aria-label="Fermer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="relative mt-3 flex flex-wrap gap-1.5">
                        {activeFeature.highlights.map((highlight) => (
                          <span
                            key={highlight}
                            className="rounded-full border border-[#17211d]/[0.07] bg-[#fbfaf6] px-2.5 py-1 text-[9px] font-bold text-[#68756e]"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/associations/fonctionnalites/${activeFeature.slug}`}
                        className="group relative mt-3.5 inline-flex items-center gap-1.5 text-[10px] font-black text-[#17211d]"
                      >
                        En savoir plus
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="feature-hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[11px] font-semibold text-[#8b9690]"
                    >
                      Cliquez sur un outil
                    </motion.p>
                  )}
                </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <HowItWorksJourney />

      <WhyAssociationsSection />

      <section className="bg-white px-4 pb-4 sm:px-6 sm:pb-6">
        <div className={`${styles.cta} relative mx-auto max-w-[1320px] overflow-hidden rounded-[2rem] px-6 py-20 text-center text-white sm:rounded-[3rem] sm:px-10 sm:py-28`}>
          <div className={styles.noise} style={{ opacity: 0.08, mixBlendMode: "screen" }} />
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={transition} className="relative mx-auto max-w-4xl">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#f19380] ring-1 ring-white/15"><HeartHandshake className="h-6 w-6" /></span>
            <h2 className="mt-8 text-4xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-5xl">Prêt à simplifier la gestion de votre association&nbsp;?</h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">Découvrez comment Obillz peut redonner du temps à votre comité et à vos bénévoles.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><a href="mailto:contact@obillz.com?subject=Démonstration Obillz Associations" className="inline-flex items-center justify-center rounded-full bg-[#ed7059] px-7 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#f17e69]">Réserver une démonstration</a><a href="mailto:contact@obillz.com?subject=Essai Obillz Associations" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15">Essayer gratuitement</a></div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-white px-5 py-10">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-6 border-t border-[#17211d]/[0.08] pt-8 sm:flex-row"><Wordmark /><p className="text-xs font-semibold text-[#7b8780]">© {new Date().getFullYear()} Obillz. Imaginé en Suisse pour les bénévoles.</p><div className="flex gap-5 text-xs font-bold text-[#66736d]"><Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-confidentialite">Confidentialité</Link></div></div>
      </footer>
    </main>
  );
}
