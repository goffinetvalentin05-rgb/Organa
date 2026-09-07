"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import {
  ActionButton,
  DashboardBadge,
  EmptyState,
  GlassCard,
  PageHeader,
  PageLayout,
  StatCard,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardModalClass,
  dashboardSecondaryButtonClass,
  dashboardTabActiveClass,
  dashboardTabInactiveClass,
  dashboardTextSecondaryClass,
  cn,
} from "@/components/ui";
import { useI18n } from "@/components/I18nProvider";
import { usePermissions } from "@/lib/auth/permissions-client";
import { formatChf } from "@/lib/shop/money";
import type {
  ShopOrder,
  ShopProduct,
  ShopSettings,
  ShopStats,
} from "@/lib/shop/types";
import { SHOP_CATEGORIES, SIZE_PRESETS } from "@/lib/shop/types";
import {
  displayOrderStatus,
  fulfillmentStatusLabel,
  paymentStatusLabel,
} from "@/lib/shop/orders";
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Edit,
  Plus,
  ShoppingBag,
  Trash,
  X,
} from "@/lib/icons";
import { QRCodeSVG } from "qrcode.react";
import ClubPaymentsPanel from "@/components/payments/connect/ClubPaymentsPanel";

type TabId = "produits" | "commandes" | "parametres" | "paiements";

const TABS: Array<{ id: TabId; key: string }> = [
  { id: "produits", key: "dashboard.shop.tabs.products" },
  { id: "commandes", key: "dashboard.shop.tabs.orders" },
  { id: "parametres", key: "dashboard.shop.tabs.settings" },
  { id: "paiements", key: "dashboard.shop.tabs.payments" },
];

type VariantDraft = {
  id?: string;
  label: string;
  stockQuantity: string;
  isActive: boolean;
};

function emptyProductForm(trackStockDefault: boolean): {
  name: string;
  description: string;
  category: string;
  price: string;
  promotionalPrice: string;
  trackStock: boolean;
  stockQuantity: string;
  hasVariants: boolean;
  status: "active" | "hidden";
  variants: VariantDraft[];
} {
  return {
    name: "",
    description: "",
    category: "Maillot",
    price: "",
    promotionalPrice: "",
    trackStock: trackStockDefault,
    stockQuantity: "",
    hasVariants: false,
    status: "hidden",
    variants: [],
  };
}

export default function ShopDashboardClient() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const { has, loading: permsLoading } = usePermissions();
  const canManage = has("manage_shop");
  const intlLocale = locale === "de" ? "de-CH" : locale === "en" ? "en-GB" : "fr-CH";

  const initialTab = (searchParams.get("tab") as TabId) || "produits";
  const [tab, setTab] = useState<TabId>(
    TABS.some((item) => item.id === initialTab) ? initialTab : "produits"
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [paymentsReady, setPaymentsReady] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [form, setForm] = useState(emptyProductForm(true));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, ordersRes, settingsRes, payRes] = await Promise.all([
        fetch("/api/shop/stats", { cache: "no-store" }),
        fetch("/api/shop/products", { cache: "no-store" }),
        fetch("/api/shop/orders", { cache: "no-store" }),
        fetch("/api/shop/settings", { cache: "no-store" }),
        fetch("/api/shop/payments", { cache: "no-store" }),
      ]);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings);
      }
      if (payRes.ok) {
        const data = await payRes.json();
        setPaymentsReady(Boolean(data.ready));
      }
    } catch {
      toast.error("Impossible de charger la boutique.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permsLoading) loadAll();
  }, [permsLoading, loadAll]);

  useEffect(() => {
    if (searchParams.get("tab") === "paiements") {
      setTab("paiements");
    }
  }, [searchParams]);

  const money = (cents: number) => formatChf(cents, intlLocale);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProductForm(settings?.trackStockDefault ?? true));
    setFormOpen(true);
  };

  const openEdit = (product: ShopProduct) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || "",
      category: product.category || "Autre",
      price: (product.priceCents / 100).toString(),
      promotionalPrice:
        product.promotionalPriceCents != null
          ? (product.promotionalPriceCents / 100).toString()
          : "",
      trackStock: product.trackStock,
      stockQuantity: product.stockQuantity != null ? String(product.stockQuantity) : "",
      hasVariants: product.hasVariants,
      status: product.status === "archived" ? "hidden" : product.status,
      variants: product.variants.map((v) => ({
        id: v.id,
        label: v.label,
        stockQuantity: v.stockQuantity != null ? String(v.stockQuantity) : "",
        isActive: v.isActive,
      })),
    });
    setFormOpen(true);
  };

  const saveProduct = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        price: form.price,
        promotionalPrice: form.promotionalPrice || null,
        trackStock: form.trackStock,
        stockQuantity: form.stockQuantity === "" ? null : Number(form.stockQuantity),
        hasVariants: form.hasVariants,
        status: form.status,
        variants: form.variants.map((v) => ({
          id: v.id,
          label: v.label,
          attributes: { Variante: v.label },
          stockQuantity: v.stockQuantity === "" ? null : Number(v.stockQuantity),
          isActive: v.isActive,
        })),
      };
      const res = await fetch(
        editing ? `/api/shop/products/${editing.id}` : "/api/shop/products",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      toast.success(editing ? "Produit mis à jour" : "Produit créé");
      setFormOpen(false);
      if (!editing && data.product?.id) {
        setEditing(data.product);
        setFormOpen(true);
      }
      await loadAll();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (productId: string, files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/shop/products/${productId}/images`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload impossible");
      }
      toast.success("Photo(s) ajoutée(s)");
      await loadAll();
      const refreshed = await fetch(`/api/shop/products/${productId}`).then((r) => r.json());
      if (refreshed.product) setEditing(refreshed.product);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const duplicateProduct = async (product: ShopProduct) => {
    const res = await fetch(`/api/shop/products/${product.id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      toast.error("Duplication impossible");
      return;
    }
    toast.success("Produit dupliqué");
    loadAll();
  };

  const archiveOrDelete = async (product: ShopProduct, hard: boolean) => {
    const ok = confirm(
      hard
        ? "Supprimer définitivement ce produit ?"
        : "Archiver ce produit ? Il disparaîtra de la boutique publique."
    );
    if (!ok) return;
    if (hard) {
      const res = await fetch(`/api/shop/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) toast.error("Suppression impossible");
      else toast.success("Produit supprimé");
    } else {
      const res = await fetch(`/api/shop/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          category: product.category,
          priceCents: product.priceCents,
          promotionalPriceCents: product.promotionalPriceCents,
          trackStock: product.trackStock,
          stockQuantity: product.stockQuantity,
          hasVariants: product.hasVariants,
          status: "archived",
          variants: product.variants,
        }),
      });
      if (!res.ok) toast.error("Archivage impossible");
      else toast.success("Produit archivé");
    }
    loadAll();
  };

  const saveSettings = async (patch: Record<string, unknown>) => {
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/shop/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enregistrement impossible");
      setSettings(data.settings);
      toast.success("Paramètres enregistrés");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSettingsSaving(false);
    }
  };

  const shopUrl = useMemo(() => {
    if (!settings?.publicUrlPath || typeof window === "undefined") return "";
    return `${window.location.origin}${settings.publicUrlPath}`;
  }, [settings]);

  const copyShopLink = async () => {
    if (!shopUrl) return;
    await navigator.clipboard.writeText(shopUrl);
    toast.success("Lien copié");
  };

  const downloadQr = () => {
    const svg = document.getElementById("shop-qr");
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
      link.download = "boutique-obillz.png";
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const advanceOrder = async (order: ShopOrder) => {
    const res = await fetch(`/api/shop/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "advance" }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Mise à jour impossible");
      return;
    }
    toast.success("Statut mis à jour");
    setSelectedOrder(data.order);
    loadAll();
  };

  if (permsLoading || loading) {
    return (
      <PageLayout>
        <PageHeader title={t("dashboard.shop.title")} subtitle={t("dashboard.shop.subtitle")} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-[1.25rem] border border-[rgba(15,23,42,0.08)] bg-white"
            />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title={t("dashboard.shop.title")}
        subtitle={t("dashboard.shop.subtitle")}
        actions={
          canManage && tab === "produits" ? (
            <DashboardPrimaryButton type="button" size="sm" onClick={openCreate}>
              Nouveau produit
            </DashboardPrimaryButton>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Chiffre d’affaires"
          value={money(stats?.revenueTotalCents || 0)}
          icon={ShoppingBag}
          accent="electric"
          footer={`Ce mois : ${money(stats?.revenueMonthCents || 0)}`}
        />
        <StatCard
          label="Commandes"
          value={stats?.ordersCount ?? 0}
          icon={CheckCircle}
          accent="cyan"
          footer={`Panier moyen : ${money(stats?.averageBasketCents || 0)}`}
        />
        <StatCard
          label="Commandes à préparer"
          value={stats?.ordersToPrepare ?? 0}
          icon={AlertCircle}
          accent="royal"
        />
        <StatCard
          label="Produits vendus"
          value={stats?.unitsSold ?? 0}
          icon={ShoppingBag}
          accent="navy"
          footer={
            stats?.topProducts?.[0]
              ? `Top : ${stats.topProducts[0].name}`
              : "Aucune vente pour l’instant"
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === item.id ? dashboardTabActiveClass : dashboardTabInactiveClass
            )}
          >
            {t(item.key)}
          </button>
        ))}
      </div>

      {tab === "produits" && (
        products.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Aucun produit"
            description="Créez votre premier maillot, training ou accessoire."
            action={
              canManage ? (
                <DashboardPrimaryButton type="button" onClick={openCreate}>
                  Créer un produit
                </DashboardPrimaryButton>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const img = product.images[0]?.publicUrl;
              return (
                <GlassCard key={product.id} padding="sm" className="flex flex-col">
                  <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-[#F1F5F9]">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#94A3B8]">
                        <ShoppingBag className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <DashboardBadge
                        variant={
                          product.status === "active"
                            ? "success"
                            : product.status === "archived"
                              ? "neutral"
                              : "warning"
                        }
                      >
                        {product.status === "active"
                          ? "Actif"
                          : product.status === "archived"
                            ? "Archivé"
                            : "Masqué"}
                      </DashboardBadge>
                    </div>
                  </div>
                  <p className="text-base font-semibold text-[#0F172A]">{product.name}</p>
                  <p className="mt-1 text-sm text-[#64748B]">{product.category || "—"}</p>
                  <p className="mt-2 text-lg font-semibold text-[#1A23FF]">
                    {money(product.promotionalPriceCents ?? product.priceCents)}
                    {product.promotionalPriceCents != null ? (
                      <span className="ml-2 text-sm font-normal text-[#94A3B8] line-through">
                        {money(product.priceCents)}
                      </span>
                    ) : null}
                  </p>
                  {canManage ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <ActionButton variant="surface" onClick={() => openEdit(product)}>
                        <Edit className="h-4 w-4" /> Modifier
                      </ActionButton>
                      <ActionButton variant="ghost" onClick={() => duplicateProduct(product)}>
                        <Copy className="h-4 w-4" /> Dupliquer
                      </ActionButton>
                      <ActionButton variant="ghost" onClick={() => archiveOrDelete(product, false)}>
                        Archiver
                      </ActionButton>
                      <ActionButton variant="dangerSoft" onClick={() => archiveOrDelete(product, true)}>
                        <Trash className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  ) : null}
                </GlassCard>
              );
            })}
          </div>
        )
      )}

      {tab === "commandes" && (
        orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Aucune commande"
            description="Les commandes payées apparaîtront ici automatiquement."
          />
        ) : (
          <GlassCard padding="none">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-[rgba(15,23,42,0.06)] bg-[#FAFBFD] text-[#64748B]">
                  <tr>
                    <th className="px-5 py-3 font-medium">N°</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Produits</th>
                    <th className="px-5 py-3 font-medium">Montant</th>
                    <th className="px-5 py-3 font-medium">Paiement</th>
                    <th className="px-5 py-3 font-medium">Préparation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(15,23,42,0.06)]">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="cursor-pointer hover:bg-[#F8FAFC]"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-5 py-3 font-semibold text-[#0F172A]">{order.orderNumber}</td>
                      <td className="px-5 py-3">
                        {order.customerFirstName} {order.customerLastName}
                      </td>
                      <td className="px-5 py-3 text-[#64748B]">
                        {new Date(order.createdAt).toLocaleDateString(intlLocale)}
                      </td>
                      <td className="px-5 py-3 text-[#64748B]">
                        {order.items.map((i) => `${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""} ×${i.quantity}`).join(", ")}
                      </td>
                      <td className="px-5 py-3 font-semibold">{money(order.totalCents)}</td>
                      <td className="px-5 py-3">
                        <DashboardBadge
                          variant={
                            order.paymentStatus === "paid"
                              ? "success"
                              : order.paymentStatus === "pending"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {paymentStatusLabel(order.paymentStatus)}
                        </DashboardBadge>
                      </td>
                      <td className="px-5 py-3">{fulfillmentStatusLabel(order.fulfillmentStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )
      )}

      {tab === "parametres" && settings && (
        <div className="grid gap-6 lg:grid-cols-5">
          <GlassCard className="lg:col-span-3">
            <h2 className="text-lg font-semibold text-[#0F172A]">Paramètres boutique</h2>
            <div className="mt-5 space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-3">
                <span className="text-sm font-medium text-[#0F172A]">Boutique active</span>
                <input
                  type="checkbox"
                  checked={settings.isEnabled}
                  disabled={!canManage}
                  onChange={(e) => saveSettings({ isEnabled: e.target.checked })}
                />
              </label>
              {!paymentsReady ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Terminez la configuration des paiements avant d’ouvrir les ventes publiques.
                </p>
              ) : null}
              <div>
                <label className={dashboardLabelClass}>Nom affiché</label>
                <input
                  className={dashboardInputClass}
                  defaultValue={settings.displayName}
                  disabled={!canManage}
                  onBlur={(e) => saveSettings({ displayName: e.target.value })}
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>Slug public</label>
                <input
                  className={dashboardInputClass}
                  defaultValue={settings.slug || ""}
                  disabled={!canManage}
                  onBlur={(e) => saveSettings({ slug: e.target.value })}
                />
                <p className={cn("mt-1 text-xs", dashboardTextSecondaryClass)}>
                  Adresse : {settings.publicUrlPath || "—"}
                </p>
              </div>
              <div>
                <label className={dashboardLabelClass}>Texte de présentation</label>
                <textarea
                  className={cn(dashboardInputClass, "min-h-[90px]")}
                  defaultValue={settings.introText}
                  disabled={!canManage}
                  onBlur={(e) => saveSettings({ introText: e.target.value })}
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>Informations de retrait</label>
                <textarea
                  className={cn(dashboardInputClass, "min-h-[90px]")}
                  defaultValue={settings.pickupInfo}
                  disabled={!canManage}
                  onBlur={(e) => saveSettings({ pickupInfo: e.target.value })}
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>E-mail pour les commandes</label>
                <input
                  className={dashboardInputClass}
                  type="email"
                  defaultValue={settings.ordersEmail}
                  disabled={!canManage}
                  onBlur={(e) => saveSettings({ ordersEmail: e.target.value })}
                />
              </div>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC] px-4 py-3">
                <span className="text-sm font-medium text-[#0F172A]">
                  Suivi du stock activé par défaut
                </span>
                <input
                  type="checkbox"
                  checked={settings.trackStockDefault}
                  disabled={!canManage}
                  onChange={(e) => saveSettings({ trackStockDefault: e.target.checked })}
                />
              </label>
              <p className="text-sm text-[#64748B]">Devise : CHF</p>
              {settingsSaving ? <p className="text-sm text-[#64748B]">Enregistrement…</p> : null}
            </div>
          </GlassCard>
          <GlassCard className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-[#0F172A]">QR code de ma boutique</h2>
            <p className="mt-1 text-sm text-[#64748B]">
              À afficher à la buvette, au stade ou sur vos réseaux.
            </p>
            {shopUrl ? (
              <div className="mt-5 flex flex-col items-center gap-4">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <QRCodeSVG id="shop-qr" value={shopUrl} size={180} includeMargin />
                </div>
                <p className="break-all text-center text-xs text-[#64748B]">{shopUrl}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <ActionButton variant="surface" onClick={copyShopLink}>
                    <Copy className="h-4 w-4" /> Copier le lien
                  </ActionButton>
                  <ActionButton variant="surface" onClick={downloadQr}>
                    <Download className="h-4 w-4" /> PNG
                  </ActionButton>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#64748B]">Définissez un slug pour générer le QR code.</p>
            )}
          </GlassCard>
        </div>
      )}

      {tab === "paiements" && <ClubPaymentsPanel variant="shop" />}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#071634]/50 p-4 sm:items-center">
          <div className={cn(dashboardModalClass, "max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6")}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? "Modifier le produit" : "Nouveau produit"}</h2>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={dashboardLabelClass}>Nom</label>
                <input className={dashboardInputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className={dashboardLabelClass}>Description</label>
                <textarea className={cn(dashboardInputClass, "min-h-[80px]")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={dashboardLabelClass}>Catégorie</label>
                  <select className={dashboardInputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {SHOP_CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={dashboardLabelClass}>Statut</label>
                  <select className={dashboardInputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "hidden" })}>
                    <option value="hidden">Masqué</option>
                    <option value="active">Actif</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={dashboardLabelClass}>Prix (CHF)</label>
                  <input className={dashboardInputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="79.00" />
                </div>
                <div>
                  <label className={dashboardLabelClass}>Prix promo (facultatif)</label>
                  <input className={dashboardInputClass} value={form.promotionalPrice} onChange={(e) => setForm({ ...form, promotionalPrice: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={form.trackStock} onChange={(e) => setForm({ ...form, trackStock: e.target.checked })} />
                Suivre le stock
              </label>
              {!form.hasVariants && form.trackStock ? (
                <div>
                  <label className={dashboardLabelClass}>Stock</label>
                  <input className={dashboardInputClass} value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
                </div>
              ) : null}
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.hasVariants}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hasVariants: e.target.checked,
                      variants: e.target.checked && form.variants.length === 0
                        ? SIZE_PRESETS.map((s) => ({ label: s, stockQuantity: "", isActive: true }))
                        : form.variants,
                    })
                  }
                />
                Variantes (taille, couleur, modèle…)
              </label>
              {form.hasVariants ? (
                <div className="space-y-2">
                  {form.variants.map((variant, index) => (
                    <div key={variant.id || index} className="grid grid-cols-[1fr_90px_auto] items-center gap-2">
                      <input
                        className={dashboardInputClass}
                        value={variant.label}
                        onChange={(e) => {
                          const variants = [...form.variants];
                          variants[index] = { ...variant, label: e.target.value };
                          setForm({ ...form, variants });
                        }}
                        placeholder="M / noir / adulte"
                      />
                      {form.trackStock ? (
                        <input
                          className={dashboardInputClass}
                          value={variant.stockQuantity}
                          onChange={(e) => {
                            const variants = [...form.variants];
                            variants[index] = { ...variant, stockQuantity: e.target.value };
                            setForm({ ...form, variants });
                          }}
                          placeholder="Stock"
                        />
                      ) : (
                        <span className="text-xs text-[#94A3B8]">—</span>
                      )}
                      <button
                        type="button"
                        className="text-[#94A3B8]"
                        onClick={() => setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) })}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={dashboardSecondaryButtonClass}
                    onClick={() =>
                      setForm({
                        ...form,
                        variants: [...form.variants, { label: "", stockQuantity: "", isActive: true }],
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> Ajouter une variante
                  </button>
                </div>
              ) : null}

              {editing ? (
                <div>
                  <label className={dashboardLabelClass}>Photos</label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {editing.images.map((img) => (
                      <div key={img.id} className="relative h-20 w-20 overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.publicUrl} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-1"
                          onClick={async () => {
                            await fetch(`/api/shop/products/${editing.id}/images?imageId=${img.id}`, {
                              method: "DELETE",
                            });
                            const refreshed = await fetch(`/api/shop/products/${editing.id}`).then((r) => r.json());
                            if (refreshed.product) setEditing(refreshed.product);
                            loadAll();
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    disabled={uploading}
                    onChange={(e) => uploadImages(editing.id, e.target.files)}
                  />
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">Enregistrez le produit pour ajouter des photos.</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <ActionButton variant="ghost" onClick={() => setFormOpen(false)}>
                  Annuler
                </ActionButton>
                <DashboardPrimaryButton type="button" icon="none" loading={saving} onClick={saveProduct}>
                  Enregistrer
                </DashboardPrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#071634]/50 p-4 sm:items-center">
          <div className={cn(dashboardModalClass, "max-h-[90vh] w-full max-w-lg overflow-y-auto p-6")}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selectedOrder.orderNumber}</h2>
              <button type="button" onClick={() => setSelectedOrder(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-[#64748B]">{displayOrderStatus(selectedOrder)}</p>
            <p className="mt-3 text-sm">
              {selectedOrder.customerFirstName} {selectedOrder.customerLastName}
              <br />
              {selectedOrder.customerEmail}
              {selectedOrder.customerPhone ? (
                <>
                  <br />
                  {selectedOrder.customerPhone}
                </>
              ) : null}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {selectedOrder.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.productName}
                    {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
                  </span>
                  <span className="font-medium">{money(item.lineTotalCents)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-base font-semibold">Total {money(selectedOrder.totalCents)}</p>
            {selectedOrder.pickupInfo ? (
              <p className="mt-3 rounded-2xl bg-[#F8FAFC] p-3 text-sm text-[#64748B]">
                {selectedOrder.pickupInfo}
              </p>
            ) : null}
            {canManage && selectedOrder.paymentStatus === "paid" && selectedOrder.fulfillmentStatus !== "handed_over" ? (
              <DashboardPrimaryButton
                type="button"
                icon="none"
                className="mt-5"
                onClick={() => advanceOrder(selectedOrder)}
              >
                {selectedOrder.fulfillmentStatus === "to_prepare"
                  ? "Marquer prête"
                  : "Marquer remise au client"}
              </DashboardPrimaryButton>
            ) : null}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
