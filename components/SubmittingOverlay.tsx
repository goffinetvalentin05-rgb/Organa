"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

export default function SubmittingOverlay({
  visible,
  message,
}: {
  visible: boolean;
  message: string;
}) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="submitting-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-[4px] pointer-events-auto"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0.9, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0.9, y: 6 }}
            transition={{ duration: 0.25 }}
            className="flex w-[min(92vw,420px)] flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-7 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 8, 0] }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="drop-shadow-[0_0_18px_rgba(26,35,255,0.65)]"
            >
              <Image
                src="/obillz-logo.png"
                alt="Obillz"
                width={140}
                height={40}
                className="h-auto w-[140px] select-none"
                priority
              />
            </motion.div>
            <p className="text-sm font-semibold text-white/90">{message}</p>
            <motion.div
              aria-hidden
              className="h-10 w-10 rounded-full border border-white/15 border-t-white/60"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

