"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LandingNav() {
  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo à gauche */}
        <Link href="/" className="group flex items-center gap-3">
          <motion.div 
            className="relative w-12 h-12 md:w-14 md:h-14"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Halo subtil au hover */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            <Image
              src="/organa-logo.png"
              alt="Organa Logo"
              fill
              className="object-contain"
              priority
            />
          </motion.div>
        </Link>
        
        {/* Liens au centre */}
        <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
          {[
            { href: "/#fonctionnalites", label: "Fonctionnalités" },
            { href: "/#comment-ca-marche", label: "Comment ça marche" },
            { href: "/#tarifs", label: "Tarifs" },
          ].map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={link.href}
                className="text-sm font-medium text-white/70 hover:text-white transition-all duration-500 relative group/link"
              >
                <span className="relative z-10">{link.label}</span>
                {/* Ligne de soulignement au hover */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-0 group-hover/link:opacity-100"
                  transition={{ duration: 0.4 }}
                />
              </Link>
            </motion.div>
          ))}
        </div>
        
        {/* CTA à droite */}
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href="/connexion"
              className="text-sm font-medium text-white/70 hover:text-white transition-all duration-500 relative group/link"
            >
              <span className="relative z-10">Connexion</span>
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent opacity-0 group-hover/link:opacity-100"
                transition={{ duration: 0.4 }}
              />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href="/inscription"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-all duration-500 border border-blue-500/30 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-500/40 relative group overflow-hidden"
            >
              {/* Glow au hover */}
              <motion.div 
                className="absolute inset-0 bg-blue-400/30 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10"
              />
              {/* Shine effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
              />
              <span className="relative z-10">Créer un compte</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}
