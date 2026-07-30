"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ProductSwitcherProps = {
  current: "sport" | "associations";
  theme?: "dark" | "light";
  compact?: boolean;
  align?: "left" | "right";
};

const products = [
  {
    id: "sport" as const,
    name: "Obillz Sport",
    description: "Gestion des clubs sportifs",
    href: "/",
  },
  {
    id: "associations" as const,
    name: "Obillz Associations",
    description: "Musique • Théâtre • Chorales • Associations",
    href: "/associations",
    isNew: true,
  },
];

export default function ProductSwitcher({
  current,
  theme = "dark",
  compact = false,
  align = "left",
}: ProductSwitcherProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const currentProduct = products.find((product) => product.id === current) ?? products[0];
  const isLight = theme === "light";

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`group relative inline-flex h-10 items-center gap-2.5 overflow-hidden rounded-full border py-1 pl-1.5 pr-2.5 text-left text-xs font-bold tracking-[-0.01em] transition-all duration-300 sm:pr-3 ${
          isLight
            ? "border-slate-200/90 bg-white/80 text-slate-900 shadow-[0_3px_12px_rgba(15,23,42,.05),inset_0_1px_0_white] hover:-translate-y-px hover:border-slate-300 hover:shadow-[0_7px_20px_rgba(15,23,42,.09)]"
            : "border-white/20 bg-white/[0.08] text-white shadow-[0_4px_18px_rgba(2,8,23,.16),inset_0_1px_0_rgba(255,255,255,.14)] hover:-translate-y-px hover:border-white/35 hover:bg-white/[0.13]"
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Changer de produit Obillz"
      >
        <span className={`pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ${open ? "translate-x-full" : "-translate-x-full"}`} />
        <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,.2)] ${
          current === "associations" ? "bg-gradient-to-br from-[#ef806b] to-[#c94f3b]" : "bg-gradient-to-br from-[#3348ff] to-[#1019aa]"
        }`}>
          <Image src="/logo-symbole.png" alt="" width={18} height={18} className="h-[17px] w-[17px] object-contain" />
        </span>
        {!compact && <span className="relative hidden whitespace-nowrap sm:inline">{currentProduct.name}</span>}
        <ChevronDown
          className={`relative h-3.5 w-3.5 opacity-60 transition-transform duration-500 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -8, scale: 0.975, filter: "blur(5px)" }
            }
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -5, scale: 0.985, filter: "blur(3px)" }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: [0.22, 1, 0.36, 1],
            }}
            role="menu"
            className={`fixed left-4 right-4 top-[4.25rem] z-[70] overflow-hidden rounded-[1.4rem] border border-white/80 bg-white/[0.9] p-1.5 text-slate-950 shadow-[0_22px_65px_rgba(2,8,23,.18),0_5px_18px_rgba(2,8,23,.07),inset_0_1px_0_white] backdrop-blur-2xl sm:absolute sm:right-auto sm:top-[calc(100%+.7rem)] sm:w-[22rem] ${
              align === "right" ? "sm:left-auto sm:right-0" : "sm:left-0"
            }`}
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: reduceMotion ? 0 : 0.055,
                    delayChildren: 0.025,
                  },
                },
              }}
              className="divide-y divide-slate-200/70"
            >
              {products.map((product) => {
                const active = product.id === current;
                return (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 7 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.3,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      },
                    }}
                    className="py-1"
                  >
                    <Link
                      href={product.href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={`group/item flex items-center gap-3 rounded-[1rem] px-3 py-3 text-left transition-all duration-300 ${
                        active
                          ? "bg-slate-900/[0.045]"
                          : product.id === "sport"
                            ? "hover:-translate-y-px hover:bg-blue-50/75 hover:shadow-[0_8px_22px_rgba(37,99,235,.08)]"
                            : "hover:-translate-y-px hover:bg-[#fff2ee]/80 hover:shadow-[0_8px_22px_rgba(216,98,77,.09)]"
                      }`}
                    >
                      <span
                        className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-[0_5px_13px_rgba(15,23,42,.12),inset_0_1px_0_rgba(255,255,255,.22)] transition-transform duration-300 group-hover/item:scale-105 ${
                          product.id === "sport"
                            ? "bg-gradient-to-br from-[#3348ff] to-[#111a9e]"
                            : "bg-gradient-to-br from-[#ef806b] to-[#bd4936]"
                        }`}
                      >
                        <Image
                          src="/logo-symbole.png"
                          alt=""
                          width={19}
                          height={19}
                          className="h-[18px] w-[18px] object-contain"
                        />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[13px] font-extrabold tracking-[-0.02em]">
                            {product.name}
                          </span>
                          {product.isNew && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] text-amber-700">
                              Nouveau
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[10px] font-medium leading-relaxed text-slate-500">
                          {product.description}
                        </span>
                      </span>

                      {active && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-sm">
                          <Check
                            className="h-3 w-3"
                            strokeWidth={2.7}
                            aria-label="Produit actif"
                          />
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
