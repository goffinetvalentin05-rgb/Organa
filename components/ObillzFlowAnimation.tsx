"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  QrCode,
  UserRound,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { easePremium } from "@/components/landing/landing-motion";

const VIEW_W = 1200;
const VIEW_H = 600;
const HUB = { x: 600, y: 300 };

type FlowIconDef = {
  id: string;
  icon?: LucideIcon;
  color: string;
  left: string;
  top: string;
  pathD: string;
  pathDelay: number;
  staggerDelay: number;
};

const ALL_ICONS: FlowIconDef[] = [
  {
    id: "whatsapp",
    color: "#25D366",
    left: "8%",
    top: "18%",
    pathD: "M 100 108 C 300 108, 400 300, 600 300",
    pathDelay: 0.3,
    staggerDelay: 0,
  },
  {
    id: "member",
    icon: UserRound,
    color: "#3B82F6",
    left: "14%",
    top: "32%",
    pathD: "M 170 192 C 350 192, 450 300, 600 300",
    pathDelay: 0.45,
    staggerDelay: 0.1,
  },
  {
    id: "invoice",
    icon: FileText,
    color: "#8B5CF6",
    left: "7%",
    top: "46%",
    pathD: "M 85 276 C 280 276, 420 300, 600 300",
    pathDelay: 0.6,
    staggerDelay: 0.2,
  },
  {
    id: "payment",
    icon: CreditCard,
    color: "#10B981",
    left: "16%",
    top: "60%",
    pathD: "M 190 360 C 370 360, 460 300, 600 300",
    pathDelay: 0.75,
    staggerDelay: 0.3,
  },
  {
    id: "calendar",
    icon: Calendar,
    color: "#60A5FA",
    left: "8%",
    top: "74%",
    pathD: "M 100 444 C 290 444, 420 300, 600 300",
    pathDelay: 0.9,
    staggerDelay: 0.4,
  },
  {
    id: "qr",
    icon: QrCode,
    color: "#F59E0B",
    left: "20%",
    top: "24%",
    pathD: "M 240 144 C 380 144, 470 300, 600 300",
    pathDelay: 1.05,
    staggerDelay: 0.5,
  },
  {
    id: "documents",
    icon: ClipboardList,
    color: "#EC4899",
    left: "18%",
    top: "68%",
    pathD: "M 215 408 C 390 408, 465 300, 600 300",
    pathDelay: 1.2,
    staggerDelay: 0.6,
  },
];

const MOBILE_ICON_POSITIONS: Record<string, { left: string; top: string }> = {
  whatsapp: { left: "10%", top: "14%" },
  member: { left: "12%", top: "32%" },
  invoice: { left: "8%", top: "50%" },
  payment: { left: "14%", top: "68%" },
};

const MOBILE_PATHS: Record<string, string> = {
  whatsapp: "M 80 90 C 280 90, 420 300, 600 300",
  member: "M 100 190 C 320 190, 440 300, 600 300",
  invoice: "M 70 300 C 300 300, 430 300, 600 300",
  payment: "M 120 410 C 350 410, 460 300, 600 300",
};

const MOBILE_ICON_IDS = new Set(["whatsapp", "member", "invoice", "payment"]);

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);
  return fine;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

function useMouseParallax(strength: number) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set((e.clientX / innerWidth - 0.5) * strength);
      mouseY.set((e.clientY / innerHeight - 0.5) * strength);
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [strength, mouseX, mouseY]);

  return { mouseX, mouseY };
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      />
    </svg>
  );
}

type FloatingIconProps = {
  icon?: LucideIcon;
  color: string;
  delay: number;
  x: string;
  y: string;
  inView: boolean;
  motionOn: boolean;
  isWhatsapp?: boolean;
  parallaxX?: MotionValue<number>;
  parallaxY?: MotionValue<number>;
};

function FloatingIcon({
  icon: Icon,
  color,
  delay,
  x,
  y,
  inView,
  motionOn,
  isWhatsapp,
  parallaxX,
  parallaxY,
}: FloatingIconProps) {
  const zero = useMotionValue(0);
  const layerX = useTransform(parallaxX ?? zero, (v) => v);
  const layerY = useTransform(parallaxY ?? zero, (v) => v);

  return (
    <motion.div
      className="absolute z-[12] will-change-transform"
      style={{
        left: x,
        top: y,
        x: parallaxX ? layerX : 0,
        y: parallaxY ? layerY : 0,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
      transition={{ delay, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        className="relative will-change-transform"
        animate={
          motionOn
            ? { y: [0, -6, 0], rotate: [-1, 1, -1] }
            : { y: 0, rotate: 0 }
        }
        transition={
          motionOn
            ? { duration: 3 + delay, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: `0 0 20px ${color}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          {isWhatsapp ? (
            <WhatsAppIcon />
          ) : Icon ? (
            <Icon size={22} color={color} strokeWidth={1.5} aria-hidden />
          ) : null}
        </div>
        <div
          className="absolute inset-0 -z-10 rounded-xl blur-md"
          style={{ background: `${color}15` }}
          aria-hidden
        />
      </motion.div>
    </motion.div>
  );
}

type FlowPathProps = {
  d: string;
  delay: number;
  color?: string;
  inView: boolean;
  motionOn: boolean;
  reduceMotion: boolean;
  pathId: string;
  dotFilterId: string;
};

function FlowPath({
  d,
  delay,
  color = "#3B82F6",
  inView,
  motionOn,
  reduceMotion,
  pathId,
  dotFilterId,
}: FlowPathProps) {
  return (
    <g>
      <motion.path
        id={pathId}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: inView ? 1 : 0,
          opacity: inView ? (reduceMotion ? 0.28 : motionOn ? 0.35 : 0.28) : 0,
        }}
        transition={{
          pathLength: reduceMotion
            ? { duration: 0 }
            : { delay, duration: 1.5, ease: "easeInOut" },
          opacity: { delay, duration: 0.5 },
        }}
      />
      {motionOn && !reduceMotion ? (
        <>
          <circle r={2.5} fill={color} opacity={0.9} filter={`url(#${dotFilterId})`}>
            <animateMotion
              dur="2.8s"
              repeatCount="indefinite"
              path={d}
              begin={`${delay + 0.5}s`}
            />
          </circle>
          <circle r={1.5} fill="#a5b4fc" opacity={0.55}>
            <animateMotion
              dur="2.8s"
              repeatCount="indefinite"
              path={d}
              begin={`${delay + 1.2}s`}
            />
          </circle>
        </>
      ) : null}
    </g>
  );
}

type CentralHubProps = {
  inView: boolean;
  motionOn: boolean;
  compact?: boolean;
};

function CentralHub({ inView, motionOn, compact }: CentralHubProps) {
  const size = compact ? "h-20 w-20" : "h-32 w-32";

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 z-[15] -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
      transition={{ delay: 0.5, duration: 0.8, ease: easePremium }}
    >
      <div className={`relative ${size}`}>
        {motionOn ? (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, #3B82F6, #8B5CF6, #3B82F6)",
              filter: "blur(24px)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        ) : (
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{
              background: "conic-gradient(from 0deg, #3B82F6, #8B5CF6, #3B82F6)",
              filter: "blur(24px)",
            }}
            aria-hidden
          />
        )}

        <motion.div
          className={`absolute inset-0 rounded-full border border-blue-500/20 ${compact ? "" : ""}`}
          animate={
            motionOn ? { scale: [1, 1.08, 1], opacity: [0.4, 0.2, 0.4] } : undefined
          }
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />

        {!compact ? (
          <div className="absolute inset-4 rounded-full border border-violet-500/30" aria-hidden />
        ) : null}

        <motion.div
          className={`absolute rounded-full ${compact ? "inset-2" : "inset-8"}`}
          style={{
            background: "radial-gradient(circle, #6366F1 0%, #3B82F6 50%, #1E3A5F 100%)",
            boxShadow: "0 0 40px #3B82F640, 0 0 80px #8B5CF620",
          }}
          animate={motionOn ? { scale: [1, 1.04, 1] } : undefined}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex h-full w-full items-center justify-center">
            <span
              className={`font-bold tracking-tight text-white ${compact ? "text-base" : "text-xl"}`}
            >
              O
            </span>
          </div>
        </motion.div>

        {motionOn && !compact
          ? [0, 60, 120, 180, 240, 300].map((start, i) => (
              <motion.div
                key={start}
                className="absolute inset-0 will-change-transform"
                style={{ transformOrigin: "50% 50%" }}
                animate={{ rotate: start + 360 }}
                initial={{ rotate: start }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.5,
                }}
                aria-hidden
              >
                <span
                  className="absolute left-1/2 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-blue-400"
                  style={{ marginLeft: compact ? 36 : 52 }}
                />
              </motion.div>
            ))
          : null}
      </div>
    </motion.div>
  );
}

type ObillzDashboardPreviewProps = {
  inView: boolean;
  motionOn: boolean;
  simplified?: boolean;
  parallaxX?: MotionValue<number>;
  parallaxY?: MotionValue<number>;
};

function ObillzDashboardPreview({
  inView,
  motionOn,
  simplified,
  parallaxX,
  parallaxY,
}: ObillzDashboardPreviewProps) {
  const zero = useMotionValue(0);
  const layerX = useTransform(parallaxX ?? zero, (v) => v);
  const layerY = useTransform(parallaxY ?? zero, (v) => v);

  const stats = [
    { label: "Membres", value: "247", color: "#3B82F6" },
    { label: "Cotisations", value: "94%", color: "#10B981" },
    { label: "Événements", value: "8", color: "#8B5CF6" },
  ];

  const members = [
    { name: "Lucas Bernard", badge: "Senior", color: "#3B82F6" },
    { name: "Emma Jacquet", badge: "Junior", color: "#8B5CF6" },
    { name: "Thomas Müller", badge: "Senior", color: "#3B82F6" },
  ];

  return (
    <motion.div
      className="absolute right-2 top-1/2 z-[18] w-[240px] -translate-y-1/2 will-change-transform sm:right-4 md:right-8 md:w-[340px]"
      style={{ x: parallaxX ? layerX : 0, y: parallaxY ? layerY : 0 }}
      initial={{ opacity: 0, x: 40 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
      transition={{ delay: 2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute -inset-4 rounded-2xl bg-blue-600/5 blur-xl" aria-hidden />

      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: "rgba(13, 20, 37, 0.9)",
          border: "1px solid rgba(59,130,246,0.2)",
          boxShadow:
            "0 0 40px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-xs font-medium tracking-wide text-white/70">
            Obillz Dashboard
          </span>
          <div className="ml-auto flex gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
            <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
            <div className="h-1.5 w-1.5 rounded-full bg-blue-400/60" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 p-4 pb-3">
          {stats.map(({ label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={{ delay: 2.4 + i * 0.15, duration: 0.5 }}
              className="rounded-lg p-2 text-center"
              style={{ background: `${color}12`, border: `1px solid ${color}25` }}
            >
              <div className="text-lg font-semibold leading-tight text-white">{value}</div>
              <div className="mt-0.5 text-[10px] text-white/40">{label}</div>
            </motion.div>
          ))}
        </div>

        {!simplified ? (
          <>
            <div className="space-y-2 px-4 pb-3">
              <div className="mb-2 text-[10px] uppercase tracking-widest text-white/30">
                Membres récents
              </div>
              {members.map(({ name, badge, color }, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: 12 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
                  transition={{ delay: 2.7 + i * 0.12, duration: 0.4 }}
                  className="flex items-center gap-2.5"
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
                    style={{ background: `${color}30` }}
                  >
                    {name.charAt(0)}
                  </div>
                  <span className="flex-1 truncate text-xs text-white/60">{name}</span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px]"
                    style={{ background: `${color}20`, color }}
                  >
                    {badge}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="px-4 pb-4">
              <div className="mb-1.5 flex justify-between text-[10px] text-white/30">
                <span>Paiements reçus</span>
                <span className="text-emerald-400">CHF 12 840</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                  initial={{ width: "0%" }}
                  animate={inView ? { width: "78%" } : { width: "0%" }}
                  transition={{ delay: 3, duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
          </>
        ) : null}

        {motionOn ? (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, #3B82F6, #8B5CF6, transparent)",
            }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            aria-hidden
          />
        ) : (
          <div
            className="absolute bottom-0 left-0 right-0 h-px opacity-60"
            style={{
              background:
                "linear-gradient(90deg, transparent, #3B82F6, #8B5CF6, transparent)",
            }}
            aria-hidden
          />
        )}
      </div>
    </motion.div>
  );
}

function FlowBackground() {
  return (
    <div className="absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-[#080C18] via-[#0D1425] to-[#080C18]" />
      <div className="absolute left-[10%] top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-blue-600/[0.08] blur-[80px]" />
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="absolute right-[10%] top-1/2 h-[350px] w-[350px] -translate-y-1/2 rounded-full bg-blue-500/[0.08] blur-[80px]" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03]">
        <filter id="obillz-flow-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves={3}
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#obillz-flow-noise)" />
      </svg>
    </div>
  );
}

export default function ObillzFlowAnimation() {
  const uid = useId().replace(/:/g, "");
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.15 });
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const finePointer = useFinePointer();

  const motionOn = inView && !prefersReducedMotion;
  const parallaxOn = motionOn && !isMobile && finePointer;

  const { mouseX, mouseY } = useMouseParallax(8);
  const iconsParallaxX = useTransform(mouseX, (v) => (parallaxOn ? v : 0));
  const iconsParallaxY = useTransform(mouseY, (v) => (parallaxOn ? v : 0));

  const dashParallaxX = useTransform(mouseX, (v) => (parallaxOn ? v * -0.625 : 0));
  const dashParallaxY = useTransform(mouseY, (v) => (parallaxOn ? v * -0.625 : 0));

  const visibleIcons = useMemo(
    () =>
      isMobile
        ? ALL_ICONS.filter((ic) => MOBILE_ICON_IDS.has(ic.id))
        : ALL_ICONS,
    [isMobile],
  );

  const flowPaths = useMemo(
    () =>
      visibleIcons.map((ic) => ({
        id: ic.id,
        d: isMobile ? (MOBILE_PATHS[ic.id] ?? ic.pathD) : ic.pathD,
        delay: ic.pathDelay,
        color: ic.color,
      })),
    [visibleIcons, isMobile],
  );

  const hubToDashboardPath = `M ${HUB.x} ${HUB.y} C 720 300, 880 300, 980 300`;

  return (
    <section
      ref={sectionRef}
      aria-hidden
      className="relative w-full overflow-x-hidden bg-[#080C18] py-24 md:py-32"
    >
      <FlowBackground />

      <div className="relative mx-auto min-h-[420px] w-full max-w-[1200px] px-4 sm:min-h-[520px] md:min-h-[600px]">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <filter
              id={`dotGlow-${uid}`}
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={`hubLine-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {flowPaths.map((p) => (
            <FlowPath
              key={p.id}
              pathId={`path-${uid}-${p.id}`}
              dotFilterId={`dotGlow-${uid}`}
              d={p.d}
              delay={p.delay}
              color={p.color}
              inView={inView}
              motionOn={motionOn}
              reduceMotion={!!prefersReducedMotion}
            />
          ))}

          <FlowPath
            pathId={`path-${uid}-hub-dash`}
            dotFilterId={`dotGlow-${uid}`}
            d={hubToDashboardPath}
            delay={1.4}
            color="#6366F1"
            inView={inView}
            motionOn={motionOn}
            reduceMotion={!!prefersReducedMotion}
          />
        </svg>

        {visibleIcons.map((ic) => {
          const pos = isMobile
            ? (MOBILE_ICON_POSITIONS[ic.id] ?? { left: ic.left, top: ic.top })
            : { left: ic.left, top: ic.top };

          return (
            <FloatingIcon
              key={ic.id}
              icon={ic.icon}
              color={ic.color}
              delay={ic.staggerDelay}
              x={pos.left}
              y={pos.top}
              inView={inView}
              motionOn={motionOn}
              isWhatsapp={ic.id === "whatsapp"}
              parallaxX={parallaxOn ? iconsParallaxX : undefined}
              parallaxY={parallaxOn ? iconsParallaxY : undefined}
            />
          );
        })}

        <CentralHub inView={inView} motionOn={motionOn} compact={isMobile} />

        <ObillzDashboardPreview
          inView={inView}
          motionOn={motionOn}
          simplified={isMobile}
          parallaxX={parallaxOn ? dashParallaxX : undefined}
          parallaxY={parallaxOn ? dashParallaxY : undefined}
        />
      </div>
    </section>
  );
}
