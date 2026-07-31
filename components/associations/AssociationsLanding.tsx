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
  useTransform,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type SVGProps,
} from "react";
import ObillzFloatingNav from "@/components/ObillzFloatingNav";
import AssociationsFooter from "@/components/associations/AssociationsFooter";
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

const collaborationFeedbacks = [
  { text: "Pouvoir réserver nos salles", x: 8, y: 14, delay: 0, color: "#ed7059" },
  { text: "Il nous manque un suivi du matériel", x: 68, y: 10, delay: 0.35, color: "#6d5efc" },
  { text: "Un rappel automatique des cotisations", x: 4, y: 58, delay: 0.7, color: "#7f9c88" },
  { text: "Partager les documents du comité", x: 70, y: 62, delay: 1.05, color: "#ed7059" },
  { text: "Gérer les répétitions", x: 18, y: 84, delay: 1.4, color: "#6d5efc" },
  { text: "Inviter les bénévoles", x: 58, y: 82, delay: 1.75, color: "#7f9c88" },
];

function CollaborationConstellation({ reduceMotion }: { reduceMotion: boolean | null }) {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setCycle((value) => value + 1), 7200);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className={styles.collaborationVisual} aria-label="Animation des retours associations">
      <div className={styles.collaborationOrbit} aria-hidden />
      <div className={styles.collaborationOrbitOuter} aria-hidden />
      <div className={styles.collaborationRays} aria-hidden />

      {collaborationFeedbacks.map((feedback) => (
        <motion.div
          key={`${feedback.text}-${cycle}`}
          className={styles.feedbackChip}
          style={
            {
              "--chip-x": `${feedback.x}%`,
              "--chip-y": `${feedback.y}%`,
              "--chip-accent": feedback.color,
            } as CSSProperties
          }
          initial={
            reduceMotion
              ? { opacity: 0.85, x: "-50%", y: "-50%", scale: 1 }
              : { opacity: 0, x: "-50%", y: "-50%", scale: 0.9 }
          }
          animate={
            reduceMotion
              ? { opacity: 0.85, x: "-50%", y: "-50%", scale: 1 }
              : {
                  opacity: [0, 1, 1, 0],
                  x: ["-50%", "-50%", "-50%", "-50%"],
                  y: ["-50%", "-50%", "-50%", "-50%"],
                  left: [`${feedback.x}%`, `${feedback.x}%`, "50%", "50%"],
                  top: [`${feedback.y}%`, `${feedback.y}%`, "48%", "48%"],
                  scale: [0.92, 1, 0.88, 0.7],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 5.4,
                  delay: feedback.delay,
                  times: [0, 0.18, 0.72, 1],
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        >
          <span className={styles.feedbackChipDot} />
          {feedback.text}
        </motion.div>
      ))}

      <div className={styles.collaborationCoreAnchor}>
        <motion.div
          className={styles.collaborationCore}
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.04, 1],
                  boxShadow: [
                    "0 28px 70px rgba(23, 33, 29, 0.28), 0 0 0 1.1rem rgba(127, 156, 136, 0.05), 0 0 28px rgba(127, 156, 136, 0.18)",
                    "0 32px 80px rgba(23, 33, 29, 0.3), 0 0 0 1.35rem rgba(127, 156, 136, 0.09), 0 0 48px rgba(237, 112, 89, 0.22)",
                    "0 28px 70px rgba(23, 33, 29, 0.28), 0 0 0 1.1rem rgba(127, 156, 136, 0.05), 0 0 28px rgba(127, 156, 136, 0.18)",
                  ],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {!reduceMotion && (
            <>
              <motion.span
                key={`wave-a-${cycle}`}
                className={styles.collaborationWave}
                initial={{ opacity: 0, scale: 0.55 }}
                animate={{ opacity: [0, 0.45, 0], scale: [0.55, 1.35, 1.7] }}
                transition={{ duration: 2.2, delay: 4.1, ease: "easeOut" }}
              />
              <motion.span
                key={`wave-b-${cycle}`}
                className={styles.collaborationWave}
                initial={{ opacity: 0, scale: 0.55 }}
                animate={{ opacity: [0, 0.28, 0], scale: [0.55, 1.55, 1.95] }}
                transition={{ duration: 2.4, delay: 4.35, ease: "easeOut" }}
              />
            </>
          )}
          <Image
            src="/logo-symbole.png"
            alt="Obillz"
            width={64}
            height={64}
            className={styles.collaborationSymbol}
          />
        </motion.div>
      </div>

      <motion.p
        key={`caption-${cycle}`}
        className={styles.collaborationCaption}
        initial={{ opacity: 0, y: 8 }}
        animate={
          reduceMotion
            ? { opacity: 0.7, y: 0 }
            : { opacity: [0, 0, 0.85, 0.85, 0], y: [8, 8, 0, 0, -4] }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 6.4, times: [0, 0.55, 0.68, 0.88, 1], ease: "easeInOut" }
        }
      >
        Les retours convergent. Le produit évolue.
      </motion.p>
    </div>
  );
}

function WhyAssociationsSection() {
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : 0.78,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <section id="pourquoi" className={styles.collaborationSection}>
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

        <div className={styles.collaborationLayout}>
          <motion.div
            initial={{ opacity: 0, x: reduceMotion ? 0 : -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ ...transition, delay: 0.08 }}
            className={styles.collaborationCopy}
          >
            <span className={styles.collaborationBadge}>
              <HeartHandshake className="h-4 w-4" strokeWidth={1.8} />
              Une vision collaborative
            </span>
            <h3 className="mt-7 text-3xl font-extrabold tracking-[-.05em] text-[#17211d] sm:text-4xl">
              Un logiciel qui grandira avec vous.
            </h3>
            <p className="mt-5 text-sm font-medium leading-relaxed text-[#68756e] sm:text-base">
              Nous écouterons les besoins, les difficultés et les idées des associations
              afin de développer les fonctionnalités qui leur feront réellement gagner du
              temps.
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
                  transition={{ ...transition, delay: 0.2 + index * 0.08 }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>
                    <strong>{title}</strong>
                    {text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ ...transition, delay: 0.16 }}
          >
            <CollaborationConstellation reduceMotion={reduceMotion} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function OurStoryExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 70%", "end 85%"],
  });

  const pathLength = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [0, 1]
  );

  const titleLines = [
    "Parce que la passion",
    "ne devrait jamais rimer",
    "avec administration.",
  ];

  const storySteps = [
    {
      key: "p1",
      side: "left" as const,
      content: (
        <>
          Nous avons commencé par développer Obillz pour les{" "}
          <span className={styles.storyEmphasis}>clubs sportifs</span>, parce que c’est dans cet
          univers que nous avons grandi.
        </>
      ),
    },
    {
      key: "p2",
      side: "right" as const,
      content: (
        <>
          Puis nous avons vu plus large. Chaque semaine, des milliers de personnes donnent leur
          temps pour faire vivre une{" "}
          <span className={styles.storyEmphasis}>société de musique</span>, une{" "}
          <span className={styles.storyEmphasis}>chorale</span>, une{" "}
          <span className={styles.storyEmphasis}>troupe de théâtre</span> ou une association
          locale.
        </>
      ),
    },
    {
      key: "p3",
      side: "left" as const,
      content: (
        <>
          Elles aussi gèrent des membres, des cotisations, des événements, des documents et toute
          une vie administrative — souvent le soir, une fois leur journée terminée.
        </>
      ),
    },
    {
      key: "p4",
      side: "right" as const,
      featured: true,
      content: (
        <>
          Ces <span className={styles.storyEmphasis}>bénévoles</span> méritent eux aussi des{" "}
          <span className={styles.storyEmphasis}>outils modernes</span>.
        </>
      ),
    },
    {
      key: "p5",
      side: "center" as const,
      climax: true,
      content: (
        <>
          C’est pour eux que nous développons aujourd’hui{" "}
          <strong className={styles.storyClimaxBrand}>Obillz Associations.</strong>
        </>
      ),
    },
  ];

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section ref={sectionRef} id="histoire" className={styles.storySection}>
      <div className={styles.noise} style={{ opacity: 0.1, mixBlendMode: "screen" }} />
      <div className={styles.storyHalo} aria-hidden />
      <div className={styles.storyOrbOne} aria-hidden />
      <div className={styles.storyOrbTwo} aria-hidden />
      <div className={styles.storyParticles} aria-hidden>
        {Array.from({ length: 14 }).map((_, index) => (
          <span key={index} style={{ "--particle-index": index } as CSSProperties} />
        ))}
      </div>

      <div className={styles.storyInner}>
        <motion.div
          className={styles.storyIntro}
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: reduceMotion ? 0 : 0.75, ease }}
        >
          <p className={styles.storyEyebrow}>Notre histoire</p>
          <h2 className={styles.storyTitle}>
            {titleLines.map((line, index) => (
              <motion.span
                key={line}
                className="block"
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-12%" }}
                transition={{
                  duration: reduceMotion ? 0 : 0.7,
                  delay: reduceMotion ? 0 : 0.08 + index * 0.1,
                  ease,
                }}
              >
                {line}
              </motion.span>
            ))}
          </h2>
        </motion.div>

        <div className={styles.storyZigzag}>
          <svg className={styles.storyZigzagPath} viewBox="0 0 1000 920" fill="none" aria-hidden>
            <path
              d="M220 60 C 280 120, 720 90, 780 170 C 840 250, 260 280, 220 370 C 180 460, 760 470, 800 560 C 840 650, 280 680, 250 760 C 230 810, 420 850, 500 880"
              stroke="rgba(244,154,136,0.14)"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <motion.path
              d="M220 60 C 280 120, 720 90, 780 170 C 840 250, 260 280, 220 370 C 180 460, 760 470, 800 560 C 840 650, 280 680, 250 760 C 230 810, 420 850, 500 880"
              stroke="rgba(244,154,136,0.72)"
              strokeWidth="1.55"
              strokeLinecap="round"
              style={{ pathLength }}
            />
          </svg>

          {storySteps.map((step, index) => (
            <motion.article
              key={step.key}
              className={`${styles.storyBeat} ${
                step.side === "left"
                  ? styles.storyBeatLeft
                  : step.side === "right"
                    ? styles.storyBeatRight
                    : styles.storyBeatCenter
              } ${step.featured ? styles.storyBeatFeatured : ""} ${
                step.climax ? styles.storyBeatClimax : ""
              }`}
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 36,
                      x: step.side === "left" ? -28 : step.side === "right" ? 28 : 0,
                    }
              }
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true, amount: 0.45, margin: "-8% 0px" }}
              transition={{
                duration: reduceMotion ? 0 : 0.75,
                delay: reduceMotion ? 0 : 0.04,
                ease,
              }}
            >
              <span className={styles.storyBeatMarker} aria-hidden>
                <span className={styles.storyBeatDot} />
                <span className={styles.storyBeatIndex}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </span>
              <p className={styles.storyBeatText}>{step.content}</p>
              {step.climax && <span className={styles.storyClimaxHalo} aria-hidden />}
            </motion.article>
          ))}
        </div>
      </div>

      <div className={styles.storyCurve} aria-hidden />
    </section>
  );
}

function AssociationsClosingChapter() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const transition = {
    duration: reduceMotion ? 0 : 0.8,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [40, -40]);

  return (
    <section id="cta-final" ref={sectionRef} className={styles.closingChapter}>
      <div className={styles.closingChapterCurve} aria-hidden>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,80 C360,20 720,20 1440,80 L1440,0 L0,0 Z" />
        </svg>
      </div>

      <motion.div className={styles.closingChapterGlow} style={{ y: glowY }} aria-hidden />
      <div className={styles.closingChapterGrain} aria-hidden />

      <div className={styles.closingChapterInner}>
        <motion.blockquote
          className={styles.closingManifesto}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={transition}
        >
          Notre objectif n’est pas de créer un outil générique, mais une plateforme
          construite avec celles et ceux qui la feront vivre au quotidien.
        </motion.blockquote>

        <motion.div
          className={styles.closingConnector}
          aria-hidden
          initial={{ scaleY: 0, opacity: 0 }}
          whileInView={{ scaleY: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ ...transition, duration: reduceMotion ? 0 : 0.9, delay: 0.1 }}
        />

        <motion.div
          className={styles.closingCta}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-12%" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: reduceMotion ? 0 : 0.11,
                delayChildren: reduceMotion ? 0 : 0.08,
              },
            },
          }}
        >
          <motion.p className={styles.finalCtaEyebrow} variants={fadeUp} transition={transition}>
            <HeartHandshake className="h-3.5 w-3.5" strokeWidth={1.9} />
            Une dernière chose
          </motion.p>

          <motion.h2 className={styles.finalCtaTitle} variants={fadeUp} transition={transition}>
            <span>Le temps des bénévoles est précieux.</span>
            <span className={styles.finalCtaTitleAccent}>Ne le gaspillez plus.</span>
          </motion.h2>

          <motion.p className={styles.finalCtaSubtitle} variants={fadeUp} transition={transition}>
            Toute votre association. Enfin réunie au même endroit —
            pour que votre comité retrouve le plaisir d’organiser, pas de jongler.
          </motion.p>

          <motion.div className={styles.finalCtaActions} variants={fadeUp} transition={transition}>
            <Link href="/associations/inscription" className={styles.finalCtaPrimary}>
              Créer un compte
            </Link>
            <Link href="/associations/connexion" className={styles.finalCtaSecondary}>
              Connexion
            </Link>
          </motion.div>

          <motion.p className={styles.finalCtaNote} variants={fadeUp} transition={transition}>
            Sans engagement · Espace dédié aux associations
          </motion.p>
        </motion.div>
      </div>

      <div className={styles.closingChapterBridge} aria-hidden />
    </section>
  );
}

function AssociationsNav() {
  return (
    <ObillzFloatingNav
      product="associations"
      homeHref="/associations"
      links={[
        { href: "#histoire", label: "Notre histoire" },
        { href: "#fonctionnalites", label: "Fonctionnalités" },
        { href: "#fonctionnement", label: "Comment ça marche" },
        { href: "/associations/connexion", label: "Connexion" },
      ]}
      cta={{
        href: "/associations/inscription",
        label: "Créer un compte",
      }}
    />
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
              <Link
                href="/associations/inscription"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#ed7059] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(237,112,89,.27)] transition hover:-translate-y-0.5 hover:bg-[#d85e48]"
              >
                Créer un compte <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/associations/connexion"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#17211d]/15 bg-white/70 px-6 py-3.5 text-sm font-extrabold text-[#17211d] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                Connexion
              </Link>
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

      <OurStoryExperience />

      <motion.section
        id="fonctionnalites"
        className={styles.featuresOrbitSection}
        initial={
          reduceMotion
            ? { opacity: 1 }
            : {
                opacity: 0,
                y: 88,
                scale: 0.965,
                boxShadow: "0 0 0 rgba(23,33,29,0)",
              }
        }
        whileInView={{
          opacity: 1,
          y: 0,
          scale: 1,
          boxShadow: "0 -28px 80px rgba(23,33,29,0.12), 0 18px 50px rgba(23,33,29,0.04)",
        }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{
          duration: reduceMotion ? 0 : 1.05,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
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
      </motion.section>

      <HowItWorksJourney />

      <WhyAssociationsSection />

      <AssociationsClosingChapter />

      <AssociationsFooter />
    </main>
  );
}
