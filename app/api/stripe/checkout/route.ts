import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // TOUJOURS retourner du JSON, JAMAIS de HTML
  try {
    // DEBUG: Vérifier l'accès aux variables d'environnement
    console.log("=== DEBUG ENV VARIABLES ===");
    console.log("process.env.STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✅ ENV OK" : "❌ ENV MISSING");
    console.log("process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO:", process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ? `✅ ENV OK (${process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO})` : "❌ ENV MISSING");
    console.log("process.env.NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL ? `✅ ENV OK (${process.env.NEXT_PUBLIC_APP_URL})` : "❌ ENV MISSING");
    console.log("=== END DEBUG ===");

    // 1. Vérifier les variables d'environnement au démarrage
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Liste des variables manquantes
    const missing: string[] = [];

    // Vérifier STRIPE_SECRET_KEY (OBLIGATOIRE - arrêter immédiatement si manquante)
    if (!stripeSecretKey || stripeSecretKey.includes("REMPLACEZ")) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("🚨 ERREUR CRITIQUE: STRIPE_SECRET_KEY manquante ou non configurée");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("📝 ACTIONS REQUISES:");
      console.error("   1. Ouvrez votre fichier .env.local à la racine du projet");
      console.error("   2. Remplacez 'sk_test_REMPLACEZ_PAR_VOTRE_CLE_SECRETE_STRIPE'");
      console.error("   3. Par votre vraie clé secrète Stripe (sk_test_...)");
      console.error("   4. Obtenez votre clé sur: https://dashboard.stripe.com/apikeys");
      console.error("   5. REDÉMARREZ le serveur Next.js (npm run dev)");
      console.error("═══════════════════════════════════════════════════════════");
      
      return NextResponse.json(
        {
          error: "ENV_MISSING",
          missing: ["STRIPE_SECRET_KEY"],
          message: "STRIPE_SECRET_KEY n'est pas configurée. Consultez les logs serveur pour les instructions.",
          help: "Vérifiez votre fichier .env.local et redémarrez le serveur Next.js",
          critical: true,
        },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      console.log("[API][stripe/checkout] ✅ STRIPE_SECRET_KEY configurée");
    }

    // Vérifier NEXT_PUBLIC_STRIPE_PRICE_PRO
    if (!priceId) {
      missing.push("NEXT_PUBLIC_STRIPE_PRICE_PRO");
      console.error("❌ NEXT_PUBLIC_STRIPE_PRICE_PRO manquante dans .env.local");
      console.error("   Ajoutez: NEXT_PUBLIC_STRIPE_PRICE_PRO=price_1SgRipHvElMyrvJkrgMDLt2w");
    } else {
      console.log(`[API][stripe/checkout] ✅ NEXT_PUBLIC_STRIPE_PRICE_PRO: ${priceId}`);
    }

    // Vérifier NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      missing.push("NEXT_PUBLIC_APP_URL");
      console.error("❌ NEXT_PUBLIC_APP_URL manquante dans .env.local");
      console.error("   Ajoutez: NEXT_PUBLIC_APP_URL=http://localhost:3000");
    } else {
      console.log(`[API][stripe/checkout] ✅ NEXT_PUBLIC_APP_URL: ${appUrl}`);
    }

    // Si des variables manquent (sauf STRIPE_SECRET_KEY déjà gérée), retourner une erreur JSON claire
    if (missing.length > 0) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error(`🚨 Variables d'environnement manquantes: ${missing.join(", ")}`);
      console.error("📝 Ajoutez les variables manquantes dans .env.local et redémarrez le serveur");
      console.error("═══════════════════════════════════════════════════════════");
      
      return NextResponse.json(
        {
          error: "ENV_MISSING",
          missing: missing,
          message: `Variables manquantes: ${missing.join(", ")}. Consultez les logs serveur.`,
          help: "Vérifiez votre fichier .env.local et redémarrez le serveur Next.js",
        },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Initialiser Stripe (stripeSecretKey est garanti non-undefined ici)
    let stripe;
    try {
      stripe = new Stripe(stripeSecretKey!, {
        apiVersion: "2025-12-15.clover",
      });
    } catch (stripeInitError: any) {
      console.error("[API][stripe/checkout] Erreur initialisation Stripe:", stripeInitError);
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_FAILED", details: "Erreur initialisation Stripe" },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Créer le client Supabase
    let supabase;
    try {
      supabase = await createClient();
    } catch (supabaseError: any) {
      console.error("[API][stripe/checkout] Erreur création client Supabase:", supabaseError);
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_FAILED", details: "Erreur configuration Supabase" },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Vérifier l'authentification
    let user;
    let authError;
    try {
      const authResult = await supabase.auth.getUser();
      user = authResult.data.user;
      authError = authResult.error;
    } catch (authCheckError: any) {
      console.error("[API][stripe/checkout] Erreur vérification auth:", authCheckError);
      return NextResponse.json(
        { error: "NOT_AUTHENTICATED" },
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Si l'utilisateur n'est pas authentifié, retourner du JSON
    if (authError || !user || !user.id) {
      console.log("[API][stripe/checkout] Utilisateur non authentifié");
      return NextResponse.json(
        { error: "NOT_AUTHENTICATED" },
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 5. Créer la session Stripe Checkout
    console.log("[API][stripe/checkout] Création de la session Stripe Checkout...", {
      price_id: priceId,
      user_id: user.id,
      user_email: user.email,
    });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId!,
            quantity: 1,
          },
        ],
        customer_email: user.email || undefined,
        client_reference_id: user.id,
        success_url: `${appUrl}/tableau-de-bord?checkout=success`,
        cancel_url: `${appUrl}/tarifs`,
        metadata: {
          user_id: user.id,
        },
      });
      
      console.log("[API][stripe/checkout] ✅ Session Stripe créée avec succès", {
        session_id: session.id,
        session_url: session.url ? "✅ URL présente" : "❌ URL manquante",
      });
    } catch (stripeError: any) {
      console.error("[API][stripe/checkout] Erreur Stripe Checkout:", stripeError);
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_FAILED", details: stripeError.message },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 6. Vérifier que l'URL de la session existe
    if (!session || !session.url) {
      console.error("[API][stripe/checkout] Session créée mais URL manquante", {
        session_id: session?.id,
      });
      return NextResponse.json(
        { error: "STRIPE_CHECKOUT_FAILED", details: "URL de session manquante" },
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 7. Succès - Retourner l'URL
    console.log("[API][stripe/checkout] Session créée avec succès", {
      session_id: session.id,
      user_id: user.id,
    });

    return NextResponse.json(
      { url: session.url },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    // Catch toutes les erreurs non gérées
    console.error("[API][stripe/checkout] Erreur inattendue:", error);
    return NextResponse.json(
      {
        error: "STRIPE_CHECKOUT_FAILED",
        details: error.message || "Erreur inconnue",
      },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

