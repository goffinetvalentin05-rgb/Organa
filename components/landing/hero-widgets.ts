import {
  CalendarDays,
  Coffee,
  Handshake,
  QrCode,
  Users,
  Wallet,
} from "lucide-react";
import type { ProductWidgetData } from "@/components/landing/ProductWidget";

export const heroProductWidgets: ProductWidgetData[] = [
  {
    id: "cotisation",
    label: "Cotisation",
    title: "Cotisation envoyée",
    value: "Équipe 1 · 48 membres",
    hint: "Envoi en 2 clics",
    status: "success",
    icon: Wallet,
    floatClass:
      "left-[2%] top-[58%] -rotate-6 md:left-[3%] md:top-[52%] lg:left-[4%] lg:top-[50%] animate-float [animation-delay:80ms]",
  },
  {
    id: "buvette",
    label: "Buvette",
    title: "Planning buvette",
    value: "Samedi 14h–18h",
    hint: "Réservation confirmée",
    icon: Coffee,
    floatClass:
      "right-[2%] top-[56%] rotate-5 md:right-[3%] md:top-[50%] lg:right-[4%] lg:top-[48%] animate-float [animation-delay:200ms]",
  },
  {
    id: "inscription",
    label: "Inscriptions",
    title: "Inscription après match",
    value: "42 participants",
    hint: "Lien ou QR code partagé",
    icon: QrCode,
    floatClass:
      "left-[4%] top-[18%] -rotate-3 md:left-[5%] md:top-[14%] lg:left-[6%] lg:top-[12%] animate-float [animation-delay:320ms]",
  },
  {
    id: "sponsoring",
    label: "Sponsoring",
    title: "Partenaire local",
    value: "CHF 2'500 · saison",
    hint: "Suivi du partenariat",
    status: "info",
    icon: Handshake,
    floatClass:
      "right-[4%] top-[16%] rotate-4 md:right-[5%] md:top-[12%] lg:right-[6%] lg:top-[10%] animate-float [animation-delay:440ms]",
  },
  {
    id: "paiement",
    label: "Encaissement",
    title: "Paiement reçu",
    value: "Cotisation · Martin L.",
    hint: "Il y a 12 min",
    status: "success",
    icon: Wallet,
    floatClass:
      "left-[14%] bottom-[4%] rotate-[-2deg] md:left-[16%] md:bottom-[2%] lg:left-[18%] animate-float [animation-delay:560ms]",
  },
  {
    id: "evenement",
    label: "Événement",
    title: "Événement du club",
    value: "Soirée · 8 bénévoles",
    hint: "Organisation simplifiée",
    icon: CalendarDays,
    floatClass:
      "right-[12%] bottom-[4%] rotate-2 md:right-[14%] md:bottom-[2%] lg:right-[16%] animate-float [animation-delay:680ms]",
  },
  {
    id: "membres",
    label: "Membres",
    title: "Base membres",
    value: "284 actifs",
    hint: "Fiches centralisées",
    icon: Users,
    floatClass:
      "left-1/2 top-[2%] -translate-x-1/2 -rotate-1 hidden lg:block animate-float [animation-delay:120ms]",
  },
  {
    id: "reservation",
    label: "Buvette",
    title: "Réservation buvette",
    value: "Créneau validé",
    hint: "Facture générée",
    icon: Coffee,
    floatClass:
      "right-[28%] top-[78%] rotate-[-3deg] hidden xl:block animate-float [animation-delay:800ms]",
  },
];
