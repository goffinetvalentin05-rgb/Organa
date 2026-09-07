"use client";

import type { CartItemInput } from "./types";

const keyFor = (slug: string) => `obillz-shop-cart:${slug}`;

export type ShopCart = {
  items: CartItemInput[];
};

function read(slug: string): ShopCart {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = sessionStorage.getItem(keyFor(slug));
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as ShopCart;
    if (!Array.isArray(parsed.items)) return { items: [] };
    return {
      items: parsed.items.filter(
        (item) =>
          item &&
          typeof item.productId === "string" &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
      ),
    };
  } catch {
    return { items: [] };
  }
}

function write(slug: string, cart: ShopCart) {
  sessionStorage.setItem(keyFor(slug), JSON.stringify(cart));
}

export function getShopCart(slug: string): ShopCart {
  return read(slug);
}

export function setShopCart(slug: string, cart: ShopCart) {
  write(slug, cart);
}

export function addToShopCart(slug: string, item: CartItemInput): ShopCart {
  const cart = read(slug);
  const idx = cart.items.findIndex(
    (i) => i.productId === item.productId && (i.variantId || null) === (item.variantId || null)
  );
  if (idx >= 0) {
    cart.items[idx] = {
      ...cart.items[idx],
      quantity: Math.min(99, cart.items[idx].quantity + item.quantity),
    };
  } else {
    cart.items.push({ ...item, quantity: Math.min(99, item.quantity) });
  }
  write(slug, cart);
  return cart;
}

export function updateShopCartQty(
  slug: string,
  productId: string,
  variantId: string | null,
  quantity: number
): ShopCart {
  const cart = read(slug);
  if (quantity <= 0) {
    cart.items = cart.items.filter(
      (i) => !(i.productId === productId && (i.variantId || null) === variantId)
    );
  } else {
    cart.items = cart.items.map((i) =>
      i.productId === productId && (i.variantId || null) === variantId
        ? { ...i, quantity: Math.min(99, quantity) }
        : i
    );
  }
  write(slug, cart);
  return cart;
}

export function clearShopCart(slug: string) {
  write(slug, { items: [] });
}

export function cartCount(cart: ShopCart): number {
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}
