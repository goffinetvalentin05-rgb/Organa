"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import ClubPaymentsPanel from "@/components/payments/connect/ClubPaymentsPanel";
import PremiumSwitch from "@/components/public-page/PremiumSwitch";
import {
  ActionButton,
  BodyPortal,
  CheckboxRow,
  DashboardBadge,
  EmptyState,
  GlassCard,
  PageHeader,
  PageLayout,
  StatCard,
  TableCard,
  cn,
  dashboardDataTableClass,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardModalClass,
  dashboardSelectClass,
  dashboardTabActiveClass,
  dashboardTabInactiveClass,
  dashboardTextSecondaryClass,
} from "@/components/ui";
import { usePermissions } from "@/lib/auth/permissions-client";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Edit,
  Heart,
  Plus,
  Trash,
  Users,
  Wallet,
  X,
} from "@/lib/icons";
import { QRCodeSVG } from "qrcode.react";
import { formatChf } from "@/lib/shop/money";
import { durationLabel, formatSupporterNumberLabel, formatSwissDate } from "@/lib/supporters/format";
import { supporterDisplayStatus } from "@/lib/supporters/status";
import type {
  Supporter,
  SupporterDurationType,
  SupporterOffer,
  SupporterStats,
  SupporterStatus,
} from "@/lib/supporters/types";

type TabId = "offres" | "supporters" | "parametres";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "offres", label: "Offres" },
  { id: "supporters", label: "Supporters" },
  { id: "parametres", label: "Paramètres" },
];

type OfferForm = {
  name: string;
  description: string;
  price: string;
  durationType: SupporterDurationType;
  startDate: string;
  endDate: string;
  maxSupporters: string;
  isActive: boolean;
  isFeatured: boolean;
  showSupporterCount: boolean;
  benefits: string[];
};

function defaultSeasonDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 6) {
    return { start: `${year}-07-01`, end: `${year + 1}-06-30` };
  }
  return { start: `${year - 1}-07-01`, end: `${year}-06-30` };
}

function emptyOfferForm(): OfferForm {
  const season = defaultSeasonDates();
  return {
    name: "",
    description: "",
    price: "",
    durationType: "season",
    startDate: season.start,
    endDate: season.end,
    maxSupporters: "",
    isActive: true,
    isFeatured: false,
    showSupporterCount: true,
    benefits: [""],
  };
}

function formFromOffer(offer: SupporterOffer): OfferForm {
  return {
    name: offer.name,
    description: offer.description || "",
    price: (offer.priceCents / 100).toFixed(2),
    durationType: offer.durationType,
    startDate: offer.startDate || defaultSeasonDates().start,
    endDate: offer.endDate || defaultSeasonDates().end,
    maxSupporters: offer.maxSupporters ? String(offer.maxSupporters) : "",
    isActive: offer.isActive,
    isFeatured: offer.isFeatured,
    showSupporterCount: offer.showSupporterCount,
    benefits: offer.benefits.length ? offer.benefits.map((b) => b.label) : [""],
  };
}

function statusBadge(status: ReturnType<typeof supporterDisplayStatus>) {
  if (status === "active") return <DashboardBadge variant="success">Actif</DashboardBadge>;
  if (status === "pending") return <DashboardBadge variant="warning">En attente</DashboardBadge>;
  if (status === "expired") return <DashboardBadge variant="neutral">Expiré</DashboardBadge>;
  return <DashboardBadge variant="danger">Annulé</DashboardBadge>;
}

export default function SupportersDashboardClient() {
  const searchParams = useSearchParams();
  const { has, loading: permsLoading } = usePermissions();
  const canManage = has("manage_supporters");

  const initialTab = (searchParams.get("tab") as TabId) || "offres";
  const [tab, setTab] = useState<TabId>(
    TABS.some((item) => item.id === initialTab) ? initialTab : "offres"
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SupporterStats | null>(null);
  const [offers, setOffers] = useState<SupporterOffer[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [publicPath, setPublicPath] = useState<string | null>(null);
  const [paymentsReady, setPaymentsReady] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"all" | SupporterStatus>("all");
  const [offerFilter, setOfferFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupporterOffer | null>(null);
  const [form, setForm] = useState<OfferForm>(emptyOfferForm());
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Supporter | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [publishedNotice, setPublishedNotice] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, offersRes, membersRes, linkRes] = await Promise.all([
        fetch("/api/supporters/stats", { cache: "no-store" }),
        fetch("/api/supporters/offers", { cache: "no-store" }),
        fetch("/api/supporters", { cache: "no-store" }),
        fetch("/api/supporters/public-link", { cache: "no-store" }),
      ]);
      if (!statsRes.ok || !offersRes.ok || !membersRes.ok) {
        toast.error("Impossible de charger les supporters");
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (offersRes.ok) {
        const data = await offersRes.json();
        setOffers(data.offers || []);
      }
      if (membersRes.ok) {
        const data = await membersRes.json();
        setSupporters(data.supporters || []);
      }
      if (linkRes.ok) {
        const data = await linkRes.json();
        setPublicPath(data.publicPath);
        setPaymentsReady(Boolean(data.paymentsReady));
      }
    } catch {
      toast.error("Impossible de charger les supporters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permsLoading) void loadAll();
  }, [permsLoading, loadAll]);

  const publicUrl = useMemo(() => {
    if (!publicPath || typeof window === "undefined") return "";
    return `${window.location.origin}${publicPath}`;
  }, [publicPath]);

  const filteredSupporters = useMemo(() => {
    const q = query.trim().toLowerCase();
    return supporters.filter((s) => {
      const display = supporterDisplayStatus(s);
      if (statusFilter === "active" && display !== "active") return false;
      if (statusFilter === "expired" && display !== "expired") return false;
      if (statusFilter === "pending" && s.status !== "pending") return false;
      if (statusFilter === "cancelled" && s.status !== "cancelled") return false;
      if (offerFilter !== "all" && s.offerId !== offerFilter) return false;
      if (!q) return true;
      return (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    });
  }, [supporters, statusFilter, offerFilter, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyOfferForm());
    setFormOpen(true);
    setPublishedNotice(false);
  };

  const openEdit = (offer: SupporterOffer) => {
    setEditing(offer);
    setForm(formFromOffer(offer));
    setFormOpen(true);
    setPublishedNotice(false);
  };

  const saveOffer = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: form.price,
        durationType: form.durationType,
        startDate: form.startDate,
        endDate: form.endDate,
        maxSupporters: form.maxSupporters || null,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        showSupporterCount: form.showSupporterCount,
        benefits: form.benefits.filter((b) => b.trim()),
      };
      const res = await fetch(
        editing ? `/api/supporters/offers/${editing.id}` : "/api/supporters/offers",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      toast.success(editing ? "Offre modifiée" : "Offre créée");
      setFormOpen(false);
      setPublishedNotice(!editing);
      await loadAll();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (offer: SupporterOffer) => {
    if (!window.confirm(`Désactiver l’offre « ${offer.name} » ?`)) return;
    const res = await fetch(`/api/supporters/offers/${offer.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Impossible de retirer l’offre");
      return;
    }
    toast.success("Offre retirée");
    await loadAll();
  };

  const copyLink = async () => {
    if (!publicUrl) {
      toast.error("Configurez d’abord le slug de la page publique du club.");
      return;
    }
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Lien copié");
  };

  const downloadQr = () => {
    const svg =
      document.getElementById("supporters-public-qr") ||
      document.getElementById("supporters-notice-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "supporters-obillz.png";
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const openDetail = async (row: Supporter) => {
    setSelected(row);
    setCardUrl(null);
    const res = await fetch(`/api/supporters/${row.id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setSelected(data.supporter);
      setCardUrl(data.cardUrl);
    }
  };

  const patchSupporter = async (id: string, body: Record<string, unknown>, okMsg: string) => {
    const res = await fetch(`/api/supporters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Action impossible");
      return;
    }
    toast.success(okMsg);
    setSelected(data.supporter);
    setCardUrl(data.cardUrl);
    await loadAll();
  };

  const needsDates = form.durationType !== "year";

  return (
    <PageLayout>
      <PageHeader
        title="Supporters"
        subtitle="Créez une communauté autour de votre club et développez une nouvelle source de revenus."
        actions={
          canManage ? (
            <DashboardPrimaryButton onClick={openCreate}>Nouvelle offre</DashboardPrimaryButton>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenus supporters"
          value={formatChf(stats?.revenueCents || 0)}
          icon={Wallet}
          accent="electric"
        />
        <StatCard
          label="Supporters actifs"
          value={stats?.activeCount ?? "—"}
          icon={Users}
          accent="cyan"
        />
        <StatCard
          label="Ce mois"
          value={`+${stats?.newThisMonth ?? 0}`}
          icon={Heart}
          accent="royal"
        />
        <StatCard
          label="Offre principale"
          value={stats?.topOfferName || "—"}
          icon={CheckCircle}
          accent="navy"
        />
      </div>

      {publishedNotice && publicUrl ? (
        <GlassCard className="p-5">
          <p className="font-semibold">Votre offre est en ligne.</p>
          <p className={cn("mt-1 text-sm", dashboardTextSecondaryClass)}>
            Lien : {publicUrl.replace(/^https?:\/\//, "")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="rounded-xl border border-[rgba(15,23,42,0.08)] bg-white p-2">
              <QRCodeSVG id="supporters-notice-qr" value={publicUrl} size={112} includeMargin />
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionButton variant="surface" onClick={copyLink}>
                <Copy className="h-4 w-4" /> Copier le lien
              </ActionButton>
              <ActionButton variant="surface" onClick={downloadQr}>
                <Download className="h-4 w-4" /> Télécharger le QR
              </ActionButton>
            </div>
          </div>
        </GlassCard>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              tab === item.id ? dashboardTabActiveClass : dashboardTabInactiveClass
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white" />
      ) : null}

      {!loading && tab === "offres" ? (
        offers.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Créez votre première offre Supporter"
            description="Transformez votre communauté en véritable soutien pour le club. Une offre se crée en moins de deux minutes."
            action={
              canManage ? (
                <DashboardPrimaryButton onClick={openCreate}>Créer une offre</DashboardPrimaryButton>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {offers.map((offer) => (
              <GlassCard key={offer.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{offer.name}</h3>
                      {offer.isFeatured ? (
                        <DashboardBadge variant="info">Mise en avant</DashboardBadge>
                      ) : null}
                      {!offer.isActive ? (
                        <DashboardBadge variant="neutral">Inactive</DashboardBadge>
                      ) : (
                        <DashboardBadge variant="success">En ligne</DashboardBadge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[#64748B]">
                      {formatChf(offer.priceCents)} · {durationLabel(offer)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-[#1A23FF]">
                    {offer.activeCount ?? 0} actif{(offer.activeCount || 0) > 1 ? "s" : ""}
                  </p>
                </div>
                {offer.description ? (
                  <p className="mt-3 text-sm text-[#64748B]">{offer.description}</p>
                ) : null}
                <ul className="mt-4 space-y-1.5 text-sm">
                  {offer.benefits.map((b) => (
                    <li key={b.id} className="flex gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>{b.label}</span>
                    </li>
                  ))}
                </ul>
                {canManage ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <ActionButton variant="surface" onClick={() => openEdit(offer)}>
                      <Edit className="h-4 w-4" /> Modifier
                    </ActionButton>
                    <ActionButton variant="ghost" onClick={() => deleteOffer(offer)}>
                      <Trash className="h-4 w-4" /> Retirer
                    </ActionButton>
                  </div>
                ) : null}
              </GlassCard>
            ))}
          </div>
        )
      ) : null}

      {!loading && tab === "supporters" ? (
        supporters.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun supporter pour le moment."
            description="Créez votre première offre et partagez-la avec votre communauté."
            action={
              canManage ? (
                <DashboardPrimaryButton onClick={openCreate}>Créer une offre</DashboardPrimaryButton>
              ) : null
            }
          />
        ) : (
          <TableCard
            title="Adhésions"
            toolbar={
              <div className="flex flex-wrap gap-2">
                <select
                  className={dashboardSelectClass}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                >
                  <option value="all">Tous</option>
                  <option value="active">Actifs</option>
                  <option value="pending">En attente</option>
                  <option value="expired">Expirés</option>
                  <option value="cancelled">Annulés</option>
                </select>
                <select
                  className={dashboardSelectClass}
                  value={offerFilter}
                  onChange={(e) => setOfferFilter(e.target.value)}
                >
                  <option value="all">Toutes les offres</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <input
                  className={cn(dashboardInputClass, "min-w-[180px]")}
                  placeholder="Rechercher prénom, nom, e-mail"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className={dashboardDataTableClass}>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Offre</th>
                    <th>Montant</th>
                    <th>Début</th>
                    <th>Expiration</th>
                    <th>Statut</th>
                    <th>Visibilité publique</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupporters.map((row) => (
                    <tr
                      key={row.id}
                      className="cursor-pointer hover:bg-[#F8FAFC]"
                      onClick={() => void openDetail(row)}
                    >
                      <td className="font-medium">
                        {row.firstName} {row.lastName}
                      </td>
                      <td>{row.offerName || "—"}</td>
                      <td>{row.amountPaidCents != null ? formatChf(row.amountPaidCents) : "—"}</td>
                      <td>{formatSwissDate(row.startDate) || "—"}</td>
                      <td>{formatSwissDate(row.endDate) || "—"}</td>
                      <td>{statusBadge(supporterDisplayStatus(row))}</td>
                      <td>{row.publicNameEnabled ? "Oui" : "Non"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>
        )
      ) : null}

      {!loading && tab === "parametres" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-5">
            <h2 className="text-base font-semibold">Lien public</h2>
            <p className={cn("mt-1 text-sm", dashboardTextSecondaryClass)}>
              Partagez cette page dans la buvette, sur des affiches, Instagram ou pendant les matchs.
            </p>
            {publicUrl ? (
              <>
                <p className="mt-4 break-all rounded-xl bg-[#F8FAFC] px-4 py-3 text-sm">{publicUrl}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton variant="surface" onClick={copyLink}>
                    <Copy className="h-4 w-4" /> Copier le lien
                  </ActionButton>
                  <ActionButton variant="surface" onClick={downloadQr}>
                    <Download className="h-4 w-4" /> Télécharger le QR
                  </ActionButton>
                </div>
                <div className="mt-6 flex justify-center rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white p-4">
                  <QRCodeSVG id="supporters-public-qr" value={publicUrl} size={180} includeMargin />
                </div>
              </>
            ) : (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Définissez le slug de la page publique du club pour obtenir un lien partageable.
              </p>
            )}
          </GlassCard>
          <div className="space-y-4">
            {!paymentsReady ? (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                Configurez Stripe pour encaisser les adhésions directement sur le compte du club.
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                Les paiements supporters arrivent directement sur le compte Stripe du club. Obillz ne
                prélève aucune commission supplémentaire.
              </div>
            )}
            <ClubPaymentsPanel variant="shop" />
          </div>
        </div>
      ) : null}

      <BodyPortal open={formOpen}>
        <div className="pointer-events-auto flex h-full min-h-full items-end justify-center bg-[#071634]/50 p-4 sm:items-center">
          <div className={cn(dashboardModalClass, "max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6")}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? "Modifier l’offre" : "Nouvelle offre"}
              </h2>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={dashboardLabelClass}>Nom de l’offre</label>
                <input
                  className={dashboardInputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Supporter+"
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>Courte description</label>
                <textarea
                  className={cn(dashboardInputClass, "min-h-[72px]")}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Soutenez le club tout au long de la saison."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={dashboardLabelClass}>Prix (CHF)</label>
                  <input
                    className={dashboardInputClass}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className={dashboardLabelClass}>Durée</label>
                  <select
                    className={dashboardSelectClass}
                    value={form.durationType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        durationType: e.target.value as SupporterDurationType,
                      })
                    }
                  >
                    <option value="season">Saison</option>
                    <option value="year">1 année</option>
                    <option value="custom">Période personnalisée</option>
                  </select>
                </div>
              </div>
              {needsDates ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={dashboardLabelClass}>Date de début</label>
                    <input
                      type="date"
                      className={dashboardInputClass}
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={dashboardLabelClass}>Date de fin</label>
                    <input
                      type="date"
                      className={dashboardInputClass}
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>
              ) : null}
              <div>
                <label className={dashboardLabelClass}>Nombre maximum de supporters (optionnel)</label>
                <input
                  className={dashboardInputClass}
                  value={form.maxSupporters}
                  onChange={(e) => setForm({ ...form, maxSupporters: e.target.value })}
                  placeholder="Illimité"
                />
              </div>
              <div className="space-y-1">
                <p className={dashboardLabelClass}>Avantages</p>
                {form.benefits.map((label, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      className={dashboardInputClass}
                      value={label}
                      onChange={(e) => {
                        const next = [...form.benefits];
                        next[index] = e.target.value;
                        setForm({ ...form, benefits: next });
                      }}
                      placeholder="Nom sur le mur des supporters"
                    />
                    <button
                      type="button"
                      className="rounded-xl px-2 text-[#94A3B8] hover:text-[#0F172A]"
                      onClick={() => {
                        if (index === 0) return;
                        const next = [...form.benefits];
                        [next[index - 1], next[index]] = [next[index], next[index - 1]];
                        setForm({ ...form, benefits: next });
                      }}
                      aria-label="Monter"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded-xl px-2 text-[#94A3B8] hover:text-[#0F172A]"
                      onClick={() => {
                        if (index >= form.benefits.length - 1) return;
                        const next = [...form.benefits];
                        [next[index + 1], next[index]] = [next[index], next[index + 1]];
                        setForm({ ...form, benefits: next });
                      }}
                      aria-label="Descendre"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded-xl px-2 text-[#94A3B8] hover:text-rose-600"
                      onClick={() =>
                        setForm({
                          ...form,
                          benefits: form.benefits.filter((_, i) => i !== index),
                        })
                      }
                      aria-label="Supprimer"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <ActionButton
                  variant="ghost"
                  onClick={() => setForm({ ...form, benefits: [...form.benefits, ""] })}
                >
                  <Plus className="h-4 w-4" /> Ajouter un avantage
                </ActionButton>
              </div>
              <div className="space-y-2 rounded-2xl bg-[#F8FAFC] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Offre active</span>
                  <PremiumSwitch
                    checked={form.isActive}
                    onChange={(v) => setForm({ ...form, isActive: v })}
                    aria-label="Offre active"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Mettre l’offre en avant</span>
                  <PremiumSwitch
                    checked={form.isFeatured}
                    onChange={(v) => setForm({ ...form, isFeatured: v })}
                    aria-label="Mettre en avant"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Afficher le nombre de supporters</span>
                  <PremiumSwitch
                    checked={form.showSupporterCount}
                    onChange={(v) => setForm({ ...form, showSupporterCount: v })}
                    aria-label="Afficher le nombre"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <ActionButton variant="ghost" onClick={() => setFormOpen(false)}>
                  Annuler
                </ActionButton>
                <DashboardPrimaryButton
                  icon="none"
                  loading={saving}
                  onClick={() => void saveOffer()}
                >
                  {editing ? "Enregistrer" : "Publier"}
                </DashboardPrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </BodyPortal>

      <BodyPortal open={Boolean(selected)}>
        <div
          className="pointer-events-auto flex h-full min-h-full justify-end bg-[#071634]/40"
          onClick={() => setSelected(null)}
        >
          {selected ? (
            <div
              className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {selected.firstName} {selected.lastName}
                </h2>
                <button type="button" onClick={() => setSelected(null)} aria-label="Fermer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[#94A3B8]">E-mail</dt>
                  <dd>{selected.email}</dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Téléphone</dt>
                  <dd>{selected.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Offre</dt>
                  <dd>
                    {selected.offerName}{" "}
                    {selected.amountPaidCents != null ? `· ${formatChf(selected.amountPaidCents)}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Statut</dt>
                  <dd>{statusBadge(supporterDisplayStatus(selected))}</dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Numéro</dt>
                  <dd>{formatSupporterNumberLabel(selected.supporterNumber) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Début</dt>
                  <dd>{formatSwissDate(selected.startDate) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[#94A3B8]">Expiration</dt>
                  <dd>{formatSwissDate(selected.endDate) || "—"}</dd>
                </div>
              </dl>
              {canManage ? (
                <div className="mt-6 space-y-3">
                  {cardUrl ? (
                    <ActionButton variant="premiumInline" href={cardUrl} className="w-full">
                      Voir la carte
                    </ActionButton>
                  ) : null}
                  <CheckboxRow
                    checked={selected.publicNameEnabled}
                    onChange={(next) =>
                      void patchSupporter(
                        selected.id,
                        { publicNameEnabled: next },
                        next ? "Visibilité publique activée" : "Visibilité publique désactivée"
                      )
                    }
                    label="Apparaître sur le mur des supporters"
                  />
                  {supporterDisplayStatus(selected) === "active" ? (
                    <ActionButton
                      variant="dangerSoft"
                      className="w-full"
                      onClick={() =>
                        void patchSupporter(selected.id, { action: "disable" }, "Carte désactivée")
                      }
                    >
                      Désactiver la carte
                    </ActionButton>
                  ) : selected.status === "cancelled" ? (
                    <ActionButton
                      variant="surface"
                      className="w-full"
                      onClick={() =>
                        void patchSupporter(selected.id, { action: "enable" }, "Carte réactivée")
                      }
                    >
                      Réactiver la carte
                    </ActionButton>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </BodyPortal>
    </PageLayout>
  );
}
