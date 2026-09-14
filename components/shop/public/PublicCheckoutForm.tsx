"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicShopShell, { notifyCartChanged, useShopBrand } from "@/components/shop/public/PublicShopShell";
import { cn } from "@/components/ui";
import { clearShopCart, getShopCart } from "@/lib/shop/cart";
import { formatChf } from "@/lib/shop/money";
import type { PublicShopCatalog } from "@/lib/shop/types";

type Line = {
  name: string;
  variantLabel: string | null;
  quantity: number;
  lineTotalCents: number;
};

export default function PublicCheckoutForm({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [catalog, setCatalog] = useState<PublicShopCatalog | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (searchParams.get("cancelled") === "1") {
      setError("Paiement annulé. Vous pouvez réessayer.");
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      const cart = getShopCart(slug);
      if (cart.items.length === 0) {
        router.replace(`/boutique/${slug}/panier`);
        return;
      }
      const [catRes, quoteRes] = await Promise.all([
        fetch(`/api/public/shop/${slug}`, { cache: "no-store" }),
        fetch(`/api/public/shop/${slug}/quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart.items }),
        }),
      ]);
      if (catRes.ok) {
        const cat = (await catRes.json()) as PublicShopCatalog;
        setCatalog(cat);
        if (!cat.canCheckout) {
          setError(cat.checkoutBlockedReason || "Paiement indisponible.");
        }
      }
      const quote = await quoteRes.json();
      if (!quoteRes.ok) {
        setError(quote.error || "Panier invalide");
        setReady(true);
        return;
      }
      setLines(quote.lines || []);
      setTotal(quote.totalCents || 0);
      setReady(true);
    })();
  }, [slug, router]);

  if (!ready || !catalog) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F4F7FB] text-sm text-[#64748B]">
        Chargement du checkout…
      </div>
    );
  }

  return (
    <PublicShopShell
      slug={slug}
      clubName={catalog.clubName}
      logoUrl={catalog.logoUrl}
      primaryColor={catalog.primaryColor}
      catalog={catalog}
    >
      <CheckoutBody
        slug={slug}
        catalog={catalog}
        lines={lines}
        total={total}
        error={error}
        setError={setError}
        submitting={submitting}
        setSubmitting={setSubmitting}
        firstName={firstName}
        lastName={lastName}
        email={email}
        phone={phone}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setEmail={setEmail}
        setPhone={setPhone}
      />
    </PublicShopShell>
  );
}

function CheckoutBody({
  slug,
  catalog,
  lines,
  total,
  error,
  setError,
  submitting,
  setSubmitting,
  firstName,
  lastName,
  email,
  phone,
  setFirstName,
  setLastName,
  setEmail,
  setPhone,
}: {
  slug: string;
  catalog: PublicShopCatalog;
  lines: Line[];
  total: number;
  error: string | null;
  setError: (v: string | null) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
}) {
  const { cta, surfaceClass } = useShopBrand();
  const fieldClass =
    "h-12 w-full rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-4 text-sm";

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const cart = getShopCart(slug);
      const res = await fetch(`/api/public/shop/${slug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items,
          firstName,
          lastName,
          email,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout impossible");
      clearShopCart(slug);
      notifyCartChanged();
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Commande</h1>
      {error ? (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <form onSubmit={pay} className="grid gap-6 lg:grid-cols-5 lg:items-start">
        <div className={cn("space-y-4 rounded-[1.25rem] p-5 lg:col-span-3", surfaceClass)}>
          <h2 className="font-semibold">Vos informations</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={fieldClass}
              required
              placeholder="Prénom"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className={fieldClass}
              required
              placeholder="Nom"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <input
            className={fieldClass}
            required
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={fieldClass}
            type="tel"
            placeholder="Téléphone (facultatif)"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div className="rounded-2xl bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
            <p className="font-semibold text-[#0F172A]">Retrait au club</p>
            <p className="mt-1">
              {catalog.pickupInfo || "Les modalités de retrait vous seront confirmées par e-mail."}
            </p>
          </div>
        </div>
        <div className={cn("rounded-[1.25rem] p-5 lg:col-span-2", surfaceClass)}>
          <h2 className="font-semibold">Récapitulatif</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {lines.map((line, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  {line.name}
                  {line.variantLabel ? ` (${line.variantLabel})` : ""} × {line.quantity}
                </span>
                <span className="font-medium">{formatChf(line.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatChf(total)}</span>
          </p>
          <button
            type="submit"
            disabled={submitting || lines.length === 0}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: cta.background, color: cta.color }}
          >
            {submitting ? "Redirection…" : "Payer"}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-[#94A3B8]">
            Le paiement est sécurisé par Stripe. Carte, Apple Pay, Google Pay et TWINT s’affichent
            uniquement s’ils sont activés sur le compte du club.
          </p>
        </div>
      </form>
    </div>
  );
}
