import { CalendarDays, CheckCircle2, Coffee, QrCode, Wallet } from "lucide-react";
import type { ProductWidgetData } from "@/components/landing/ProductWidget";

/** 4 satellites hero — composition grille dans HeroProductComposition */
export const heroSatelliteWidgets: ProductWidgetData[] = [
  {
    id: "cotisation",
    label: "Cotisation",
    title: "Cotisation envoyée",
    value: "48 membres",
    hint: "Envoi en 2 clics",
    status: "success",
    icon: Wallet,
  },
  {
    id: "paiement",
    label: "Paiement",
    title: "Paiement reçu",
    value: "CHF 120 · Martin L.",
    hint: "Cotisation saison",
    status: "success",
    icon: CheckCircle2,
  },
  {
    id: "inscription",
    label: "Inscription",
    title: "Inscription après-match",
    value: "42 participants",
    hint: "Lien ou QR code",
    icon: QrCode,
  },
  {
    id: "buvette",
    label: "Buvette",
    title: "Buvette réservée",
    value: "Samedi 14h–18h",
    hint: "Créneau confirmé",
    icon: Coffee,
  },
];

/** @deprecated Utiliser heroSatelliteWidgets */
export const heroProductWidgets = heroSatelliteWidgets;
