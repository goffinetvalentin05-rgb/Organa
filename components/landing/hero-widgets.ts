import { CalendarDays, Coffee, QrCode, Wallet } from "lucide-react";
import type { ProductWidgetData } from "@/components/landing/ProductWidget";

/** Max 4 satellites — positionnés via grille dans HeroProductComposition */
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
    id: "inscription",
    label: "Inscriptions",
    title: "Après-match",
    value: "42 participants",
    hint: "Lien ou QR code",
    icon: QrCode,
  },
  {
    id: "buvette",
    label: "Buvette",
    title: "Créneau validé",
    value: "Samedi 14h–18h",
    hint: "Facture générée",
    icon: Coffee,
  },
  {
    id: "evenement",
    label: "Événement",
    title: "Soirée du club",
    value: "8 bénévoles",
    hint: "Organisation simplifiée",
    icon: CalendarDays,
  },
];

/** @deprecated Utiliser heroSatelliteWidgets */
export const heroProductWidgets = heroSatelliteWidgets;
