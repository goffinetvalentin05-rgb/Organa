/**
 * Preview backfill Stripe → Supabase (LECTURE SEULE par défaut).
 *
 * Usage:
 *   node scripts/billing-backfill-preview.mjs
 *   node scripts/billing-backfill-preview.mjs --apply   # écrit uniquement après validation manuelle
 *
 * Requis (env process ou .env.local rempli) :
 *   STRIPE_SECRET_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Ne crée / ne modifie / ne supprime aucun objet Stripe.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

const CLUB_QUERIES = [
  { key: "porrentruy", label: "FC Porrentruy", namePatterns: ["porrentruy"] },
  { key: "fontenais", label: "FC Fontenais", namePatterns: ["fontenais"] },
];

const APPLY = process.argv.includes("--apply");

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx < 1) continue;
    const k = t.slice(0, idx).trim();
    let v = t.slice(idx + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env) || !process.env[k]) {
      process.env[k] = v;
    }
  }
}

loadEnvLocal();

function requireEnv(name) {
  const v = process.env[name]?.trim();
  if (!v || v.includes("REMPLACEZ")) {
    throw new Error(`Variable manquante ou vide: ${name}`);
  }
  return v;
}

function maskId(id) {
  if (!id || typeof id !== "string") return id;
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function intervalFromPrice(price) {
  const interval = price?.recurring?.interval;
  if (interval === "year") return "yearly";
  if (interval === "month") return "monthly";
  return null;
}

function tierFromPriceAndMeta(priceId, metadata, envPriceMap) {
  const fromEnv = envPriceMap.get(priceId);
  if (fromEnv) return fromEnv;
  const meta = metadata?.subscription_tier;
  if (meta === "team" || meta === "standard") return meta;
  return null;
}

function buildEnvPriceMap() {
  const map = new Map();
  const pairs = [
    ["STRIPE_PRICE_TEAM_MONTHLY", "team", "monthly"],
    ["STRIPE_PRICE_TEAM_YEARLY", "team", "yearly"],
    ["STRIPE_PRICE_STANDARD_MONTHLY", "standard", "monthly"],
    ["STRIPE_PRICE_STANDARD_YEARLY", "standard", "yearly"],
    ["STRIPE_PRICE_MONTHLY", "standard", "monthly"],
    ["STRIPE_PRICE_YEARLY", "standard", "yearly"],
  ];
  for (const [envKey, tier, interval] of pairs) {
    const id = process.env[envKey]?.trim();
    if (id?.startsWith("price_")) map.set(id, { tier, interval });
  }
  // Legacy hardcodés (même logique que lib/billing/stripePrices.ts)
  map.set("price_1TQTaxHvElMyrvJkVltPcQUp", {
    tier: "standard",
    interval: "monthly",
  });
  map.set("price_1TQTbbHvElMyrvJkmsJXnHKW", {
    tier: "standard",
    interval: "yearly",
  });
  return map;
}

function matchesClubName(name, patterns) {
  if (!name) return false;
  const n = name.toLowerCase();
  return patterns.some((p) => n.includes(p));
}

async function listAllActiveSubscriptions(stripe) {
  const out = [];
  for await (const sub of stripe.subscriptions.list({
    status: "active",
    limit: 100,
    expand: ["data.customer", "data.items.data.price"],
  })) {
    out.push(sub);
  }
  for await (const sub of stripe.subscriptions.list({
    status: "trialing",
    limit: 100,
    expand: ["data.customer", "data.items.data.price"],
  })) {
    out.push(sub);
  }
  return out;
}

function customerEmail(customer) {
  if (!customer || typeof customer === "string") return null;
  return customer.email || null;
}

function customerName(customer) {
  if (!customer || typeof customer === "string") return null;
  return customer.name || null;
}

function customerIdOf(sub) {
  if (typeof sub.customer === "string") return sub.customer;
  return sub.customer?.id ?? null;
}

function scoreMatch({ sub, profile, authEmail, club }) {
  const reasons = [];
  let score = 0;
  const customer = typeof sub.customer === "object" ? sub.customer : null;
  const email = customerEmail(customer);
  const cName = customerName(customer);
  const metaUserId = sub.metadata?.user_id || null;

  if (metaUserId && metaUserId === profile.user_id) {
    score += 100;
    reasons.push("metadata.user_id === profiles.user_id");
  }
  if (authEmail && email && authEmail.toLowerCase() === email.toLowerCase()) {
    score += 80;
    reasons.push("email Stripe === email auth.users");
  }
  if (
    profile.company_email &&
    email &&
    profile.company_email.toLowerCase() === email.toLowerCase()
  ) {
    score += 60;
    reasons.push("email Stripe === profiles.company_email");
  }
  if (matchesClubName(cName, club.namePatterns)) {
    score += 40;
    reasons.push("customer.name contient le nom du club");
  }
  if (matchesClubName(profile.company_name, club.namePatterns)) {
    score += 10;
    reasons.push("profiles.company_name match club recherché");
  }
  if (
    profile.stripe_subscription_id &&
    profile.stripe_subscription_id === sub.id
  ) {
    score += 50;
    reasons.push("stripe_subscription_id déjà égal (déjà lié)");
  }

  return { score, reasons, email, customerName: cName, metaUserId };
}

function proposedUpdateFromSub(sub, envPriceMap) {
  const price = sub.items?.data?.[0]?.price ?? null;
  const priceId = typeof price === "string" ? price : price?.id ?? null;
  const intervalFromRecurring = intervalFromPrice(
    typeof price === "object" ? price : null
  );
  const fromMap = tierFromPriceAndMeta(priceId, sub.metadata, envPriceMap);
  const billingCycle =
    fromMap?.interval ||
    intervalFromRecurring ||
    (sub.metadata?.billing_interval === "monthly" ||
    sub.metadata?.billing_interval === "yearly"
      ? sub.metadata.billing_interval
      : null) ||
    "yearly";
  const subscriptionTier =
    fromMap?.tier ||
    (sub.metadata?.subscription_tier === "team" ||
    sub.metadata?.subscription_tier === "standard"
      ? sub.metadata.subscription_tier
      : "standard");

  const now = new Date();
  const endsAt = new Date(now);
  if (billingCycle === "yearly") endsAt.setFullYear(endsAt.getFullYear() + 1);
  else endsAt.setMonth(endsAt.getMonth() + 1);

  // Préférer current_period_end Stripe si disponible
  const periodEndUnix = sub.current_period_end;
  const subscriptionEndsAt = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : endsAt.toISOString();
  const periodStartUnix = sub.current_period_start;
  const subscriptionStartedAt = periodStartUnix
    ? new Date(periodStartUnix * 1000).toISOString()
    : now.toISOString();

  return {
    subscription_status: "active",
    stripe_customer_id: customerIdOf(sub),
    stripe_subscription_id: sub.id,
    billing_cycle: billingCycle,
    subscription_tier: subscriptionTier,
    plan: "pro",
    subscription_started_at: subscriptionStartedAt,
    subscription_ends_at: subscriptionEndsAt,
    _stripe_status: sub.status,
    _stripe_price_id: priceId,
  };
}

async function main() {
  console.log("=== Backfill preview Stripe → Supabase ===");
  console.log(`Mode: ${APPLY ? "APPLY (écriture)" : "PREVIEW (lecture seule)"}`);

  const stripeKey = requireEnv("STRIPE_SECRET_KEY");
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeKey.startsWith("sk_live_") && !stripeKey.startsWith("sk_test_")) {
    throw new Error("STRIPE_SECRET_KEY ne ressemble pas à une clé Stripe");
  }
  if (stripeKey.startsWith("sk_test_")) {
    console.warn(
      "⚠ Clé TEST détectée — pour la prod utilisez sk_live_…"
    );
  }

  const stripe = new Stripe(stripeKey);
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const envPriceMap = buildEnvPriceMap();

  // 1) Profils candidats
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select(
      "user_id, company_name, company_email, subscription_status, subscription_tier, billing_cycle, plan, stripe_customer_id, stripe_subscription_id, subscription_started_at, subscription_ends_at, trial_started_at, created_at"
    );

  if (profilesError) throw profilesError;

  const clubProfiles = {};
  for (const club of CLUB_QUERIES) {
    const matches = (profiles || []).filter((p) =>
      matchesClubName(p.company_name, club.namePatterns)
    );
    clubProfiles[club.key] = { club, matches };
  }

  // 2) Abonnements Stripe actifs / trialing
  const subs = await listAllActiveSubscriptions(stripe);
  console.log(`\nAbonnements Stripe active|trialing: ${subs.length}`);

  const reports = [];

  for (const club of CLUB_QUERIES) {
    const { matches } = clubProfiles[club.key];
    console.log(`\n──────── ${club.label} ────────`);
    console.log(`Profils Supabase match nom: ${matches.length}`);

    if (matches.length === 0) {
      reports.push({
        club: club.label,
        error: "Aucun profil profiles.company_name correspondant",
      });
      continue;
    }
    if (matches.length > 1) {
      console.log(
        "⚠ Plusieurs profils:",
        matches.map((m) => ({
          user_id: m.user_id,
          company_name: m.company_name,
          status: m.subscription_status,
        }))
      );
    }

    // Pour chaque profil candidat, enrichir email auth
    const candidates = [];
    for (const profile of matches) {
      const { data: userData, error: userErr } =
        await admin.auth.admin.getUserById(profile.user_id);
      if (userErr) {
        console.warn("auth getUserById:", userErr.message);
      }
      const authEmail = userData?.user?.email ?? null;

      const scored = [];
      for (const sub of subs) {
        const s = scoreMatch({ sub, profile, authEmail, club });
        if (s.score > 0) {
          scored.push({ sub, ...s });
        }
      }
      scored.sort((a, b) => b.score - a.score);

      candidates.push({ profile, authEmail, scored });
    }

    // Choisir le meilleur couple profil↔sub
    let best = null;
    for (const c of candidates) {
      const top = c.scored[0];
      if (!top) continue;
      if (!best || top.score > best.top.score) {
        best = { ...c, top };
      }
    }

    if (!best?.top) {
      // Afficher aussi les subs dont le customer name/email évoque le club
      const loose = subs
        .map((sub) => {
          const customer =
            typeof sub.customer === "object" ? sub.customer : null;
          return {
            subscription_id: sub.id,
            customer_id: customerIdOf(sub),
            email: customerEmail(customer),
            name: customerName(customer),
            status: sub.status,
            meta_user_id: sub.metadata?.user_id ?? null,
          };
        })
        .filter(
          (row) =>
            matchesClubName(row.name, club.namePatterns) ||
            matchesClubName(row.email, club.namePatterns)
        );

      reports.push({
        club: club.label,
        error: "Aucun match Stripe scoré > 0",
        supabase_profiles: matches,
        stripe_loose_name_matches: loose,
        all_active_subs_summary: subs.map((s) => ({
          id: s.id,
          customer: customerIdOf(s),
          email: customerEmail(
            typeof s.customer === "object" ? s.customer : null
          ),
          name: customerName(
            typeof s.customer === "object" ? s.customer : null
          ),
          meta_user_id: s.metadata?.user_id ?? null,
          status: s.status,
        })),
      });
      continue;
    }

    // Ambiguïté : 2e score proche
    const second = best.scored[1];
    const ambiguous =
      second && best.top.score - second.score < 30 && second.score >= 40;

    const proposed = proposedUpdateFromSub(best.top.sub, envPriceMap);
    const current = {
      user_id: best.profile.user_id,
      company_name: best.profile.company_name,
      company_email: best.profile.company_email,
      auth_email: best.authEmail,
      subscription_status: best.profile.subscription_status,
      subscription_tier: best.profile.subscription_tier,
      billing_cycle: best.profile.billing_cycle,
      plan: best.profile.plan,
      stripe_customer_id: best.profile.stripe_customer_id,
      stripe_subscription_id: best.profile.stripe_subscription_id,
      subscription_started_at: best.profile.subscription_started_at,
      subscription_ends_at: best.profile.subscription_ends_at,
      trial_started_at: best.profile.trial_started_at,
    };

    const updatePayload = {
      subscription_status: proposed.subscription_status,
      stripe_customer_id: proposed.stripe_customer_id,
      stripe_subscription_id: proposed.stripe_subscription_id,
      billing_cycle: proposed.billing_cycle,
      subscription_tier: proposed.subscription_tier,
      plan: proposed.plan,
      subscription_started_at: proposed.subscription_started_at,
      subscription_ends_at: proposed.subscription_ends_at,
    };

    const report = {
      club: club.label,
      match_score: best.top.score,
      match_reasons: best.top.reasons,
      ambiguous,
      ambiguous_runner_up: ambiguous
        ? {
            subscription_id: second.sub.id,
            score: second.score,
            reasons: second.reasons,
          }
        : null,
      stripe: {
        customer_id: proposed.stripe_customer_id,
        subscription_id: proposed.stripe_subscription_id,
        status: proposed._stripe_status,
        email: best.top.email,
        customer_name: best.top.customerName,
        metadata_user_id: best.top.metaUserId,
        price_id: proposed._stripe_price_id,
      },
      supabase_current: current,
      supabase_proposed: updatePayload,
      sql_equivalent: `UPDATE profiles SET
  subscription_status = '${updatePayload.subscription_status}',
  stripe_customer_id = '${updatePayload.stripe_customer_id}',
  stripe_subscription_id = '${updatePayload.stripe_subscription_id}',
  billing_cycle = '${updatePayload.billing_cycle}',
  subscription_tier = '${updatePayload.subscription_tier}',
  plan = '${updatePayload.plan}',
  subscription_started_at = '${updatePayload.subscription_started_at}',
  subscription_ends_at = '${updatePayload.subscription_ends_at}'
WHERE user_id = '${current.user_id}'
  AND company_name ILIKE '%${club.namePatterns[0]}%';`,
      supabase_js: {
        table: "profiles",
        filter: { user_id: current.user_id },
        update: updatePayload,
      },
    };

    reports.push(report);

    console.log(JSON.stringify(report, null, 2));

    if (APPLY) {
      if (ambiguous) {
        console.error(
          `REFUS APPLY pour ${club.label}: match ambigu. Validation manuelle requise.`
        );
        continue;
      }
      if (best.top.score < 80) {
        console.error(
          `REFUS APPLY pour ${club.label}: score ${best.top.score} < 80 (email ou metadata requis).`
        );
        continue;
      }
      if (
        current.stripe_subscription_id &&
        current.stripe_subscription_id !== updatePayload.stripe_subscription_id
      ) {
        console.error(
          `REFUS APPLY pour ${club.label}: stripe_subscription_id déjà présent et différent.`
        );
        continue;
      }

      const { data: updated, error: updErr } = await admin
        .from("profiles")
        .update(updatePayload)
        .eq("user_id", current.user_id)
        .select(
          "user_id, company_name, subscription_status, stripe_customer_id, stripe_subscription_id, billing_cycle, subscription_tier, plan"
        );

      if (updErr) {
        console.error("UPDATE failed:", updErr);
        continue;
      }
      if (!updated?.length) {
        console.error("UPDATE a touché 0 ligne — annulé / à investiguer");
        continue;
      }
      console.log("UPDATE OK:", updated[0]);
    }
  }

  console.log("\n=== RÉSUMÉ ===");
  console.log(
    JSON.stringify(
      reports.map((r) => ({
        club: r.club,
        error: r.error || null,
        score: r.match_score ?? null,
        ambiguous: r.ambiguous ?? null,
        user_id: r.supabase_current?.user_id ?? null,
        from_status: r.supabase_current?.subscription_status ?? null,
        to_status: r.supabase_proposed?.subscription_status ?? null,
        customer: maskId(r.supabase_proposed?.stripe_customer_id),
        subscription: maskId(r.supabase_proposed?.stripe_subscription_id),
      })),
      null,
      2
    )
  );

  if (!APPLY) {
    console.log(
      "\nAucune écriture effectuée. Relancer avec --apply uniquement après validation humaine."
    );
  }
}

main().catch((err) => {
  console.error("\nÉCHEC:", err.message || err);
  process.exit(1);
});
