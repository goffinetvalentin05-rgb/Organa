"use client";

import { motion, type MotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { easePremium } from "@/components/landing/landing-motion";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: boolean;
} & Omit<MotionProps, "children" | "initial" | "whileInView" | "viewport" | "transition">;

export default function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 28,
  scale = false,
  ...rest
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, scale: scale ? 0.96 : 1 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, delay, ease: easePremium }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
