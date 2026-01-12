import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_COMPANY_SETTINGS, getCompanySettings } from "@/lib/utils/company-settings";

/**
 * API Route pour récupérer les paramètres de l'entreprise
 * GET /api/settings
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[API][settings] GET - Début récupération");
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[API][settings] GET - Erreur auth:", authError);
      return NextResponse.json(
        { error: "Non authentifié", details: authError?.message },
        { status: 401 }
      );
    }

    console.log("[API][settings] GET - User authentifié:", user.id);

    // Récupérer les paramètres depuis profiles - TOUTES les colonnes nécessaires
    let { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, conditions_paiement, email_expediteur, nom_expediteur, resend_api_key")
      .eq("user_id", user.id)
      .maybeSingle();

    // Si le profil n'existe pas, le créer avec valeurs par défaut
    if (!profile) {
      console.log("[API][settings] GET - Profil inexistant, création avec valeurs par défaut...");
      const defaultCurrencySymbol = getCurrencySymbol(DEFAULT_COMPANY_SETTINGS.currency);
      
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          user_id: user.id,
          plan: "free",
          primary_color: DEFAULT_COMPANY_SETTINGS.primary_color,
          currency: DEFAULT_COMPANY_SETTINGS.currency,
          currency_symbol: defaultCurrencySymbol,
        })
        .select("user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, conditions_paiement, email_expediteur, nom_expediteur, resend_api_key")
        .single();

      if (createError) {
        console.error("[API][settings] GET - Erreur création profil:", createError);
        // En cas d'erreur de création, retourner les valeurs par défaut plutôt que de planter
        profile = null;
      } else {
        profile = newProfile as any;
      }
    } else if (fetchError) {
      console.error("[API][settings] GET - Erreur récupération profil:", {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      });
      // En cas d'erreur de récupération, utiliser null pour déclencher les fallbacks
      profile = null;
    }

    // Si profile est toujours null après toutes les tentatives, utiliser des valeurs par défaut
    if (!profile) {
      console.log("[API][settings] GET - Utilisation des valeurs par défaut");
    }

    // Utiliser logo_url depuis la DB si disponible, sinon construire depuis logo_path
    let logoUrl: string | null = null;
    if (profile?.logo_url) {
      // Utiliser logo_url stocké en DB
      logoUrl = profile.logo_url;
      console.log("[API][settings] GET - Logo URL depuis DB:", logoUrl);
    } else if (profile?.logo_path) {
      // Fallback: construire l'URL depuis logo_path si logo_url n'est pas en DB
      const { data: urlData } = supabase.storage
        .from("Logos")
        .getPublicUrl(profile.logo_path);
      logoUrl = urlData.publicUrl;
      console.log("[API][settings] GET - Logo URL construite depuis logo_path:", logoUrl);
    }

    // Calculer currency_symbol si non défini
    const currency = profile?.currency || DEFAULT_COMPANY_SETTINGS.currency;
    const currency_symbol = profile?.currency_symbol || getCurrencySymbol(currency);

    // Formater les données selon les spécifications avec valeurs par défaut robustes
    const rawSettings = {
      primary_color: profile?.primary_color,
      currency: profile?.currency,
      currency_symbol: profile?.currency_symbol,
    };
    
    const companySettings = getCompanySettings(rawSettings);

    const settings = {
      company_name: profile?.company_name || "",
      company_email: profile?.company_email || "",
      company_phone: profile?.company_phone || "",
      company_address: profile?.company_address || "",
      logo_path: profile?.logo_path || null,
      logo_url: logoUrl,
      primary_color: companySettings.primary_color,
      currency: companySettings.currency,
      currency_symbol: currency_symbol,
      iban: profile?.iban || "",
      bank_name: profile?.bank_name || "",
      conditions_paiement: profile?.conditions_paiement || "",
      email_expediteur: profile?.email_expediteur || "",
      nom_expediteur: profile?.nom_expediteur || "",
      resend_api_key: profile?.resend_api_key || "",
    };

    console.log("[API][settings] GET - Settings récupérés avec succès");

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("[API][settings] GET - Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * API Route pour sauvegarder les paramètres de l'entreprise
 * PUT /api/settings
 */
export async function PUT(request: NextRequest) {
  try {
    console.log("[API][settings] PUT - Début sauvegarde");
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[API][settings] PUT - Erreur auth:", authError);
      return NextResponse.json(
        { error: "Non authentifié", details: authError?.message },
        { status: 401 }
      );
    }

    console.log("[API][settings] PUT - User authentifié:", user.id);

    // Parser et valider le body
    let body: any;
    try {
      body = await request.json();
      console.log("[API][settings] PUT - Body reçu:", body);
      
      // Validation basique : body doit être un objet
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json(
          { error: "Format de données invalide", details: "Le body doit être un objet JSON" },
          { status: 400 }
        );
      }
    } catch (parseError: any) {
      console.error("[API][settings] PUT - Erreur parsing JSON:", parseError);
      return NextResponse.json(
        { error: "Format de données invalide", details: parseError.message || "JSON invalide" },
        { status: 400 }
      );
    }

    // Définir les champs autorisés - UNIQUEMENT ceux qui existent dans la table profiles
    // Colonnes existantes : user_id, plan, stripe_customer_id, stripe_subscription_id,
    //                      created_at, updated_at, company_name, company_email, company_phone,
    //                      company_address, logo_path, logo_url, primary_color, currency,
    //                      iban, bank_name, conditions_paiement,
    //                      email_expediteur, nom_expediteur, resend_api_key
    const allowedFields = [
      'user_id',
      'plan',
      'company_name',
      'company_email', 
      'company_phone',
      'company_address',
      'primary_color',
      'currency',
      'logo_url',
      'iban',
      'bank_name',
      'conditions_paiement',
      'email_expediteur',
      'nom_expediteur',
      'resend_api_key',
      'updated_at'
    ] as const;

    // Construire un payload whitelisté explicite depuis le body
    // Ne jamais accepter created_at, updated_at, id, user_id depuis le body
    const upsertData: any = {
      user_id: user.id, // Toujours défini côté serveur
      plan: "free", // Toujours défini côté serveur
      updated_at: new Date().toISOString(),
    };

    // Ajouter uniquement les champs autorisés depuis le body
    if (body.company_name !== undefined) {
      upsertData.company_name = body.company_name?.trim() || null;
    }
    if (body.company_email !== undefined) {
      upsertData.company_email = body.company_email?.trim() || null;
    }
    if (body.company_phone !== undefined) {
      upsertData.company_phone = body.company_phone?.trim() || null;
    }
    if (body.company_address !== undefined) {
      upsertData.company_address = body.company_address?.trim() || null;
    }

    // Gérer primary_color avec validation
    if (body.primary_color !== undefined && body.primary_color !== null) {
      const hexColor = String(body.primary_color).trim();
      if (hexColor && /^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
        upsertData.primary_color = hexColor;
      } else {
        console.warn("[API][settings] PUT - Couleur mal formatée, utilisation de la valeur par défaut:", hexColor);
        upsertData.primary_color = DEFAULT_COMPANY_SETTINGS.primary_color;
      }
    }

    // Gérer currency avec validation
    if (body.currency !== undefined && body.currency !== null) {
      const currency = String(body.currency).trim().toUpperCase();
      if (currency && currency.length === 3) {
        upsertData.currency = currency;
      } else {
        console.warn("[API][settings] PUT - Devise mal formatée, utilisation de la valeur par défaut:", currency);
        upsertData.currency = DEFAULT_COMPANY_SETTINGS.currency;
      }
    }

    // Gérer les champs bancaires
    if (body.iban !== undefined) {
      upsertData.iban = body.iban?.trim() || null;
    }
    if (body.bank_name !== undefined) {
      upsertData.bank_name = body.bank_name?.trim() || null;
    }
    if (body.conditions_paiement !== undefined) {
      upsertData.conditions_paiement = body.conditions_paiement?.trim() || null;
    }

    // Gérer les champs email
    if (body.email_expediteur !== undefined) {
      upsertData.email_expediteur = body.email_expediteur?.trim() || null;
    }
    if (body.nom_expediteur !== undefined) {
      upsertData.nom_expediteur = body.nom_expediteur?.trim() || null;
    }
    if (body.resend_api_key !== undefined) {
      upsertData.resend_api_key = body.resend_api_key?.trim() || null;
    }

    // PROTECTION ANTI-COLONNE INVALIDE
    // Filtrer strictement pour ne garder que les champs autorisés
    // Accepter les chaînes vides car elles peuvent être intentionnelles
    // Ne jamais envoyer une colonne si elle n'a pas été validée
    const finalUpsertData: any = {};
    for (const [key, value] of Object.entries(upsertData)) {
      // Vérifier que la clé est autorisée
      if (allowedFields.includes(key as any)) {
        // Pour les strings, accepter même si vides (peut être intentionnel)
        if (typeof value === 'string') {
          finalUpsertData[key] = value;
        } else if (value !== undefined && value !== null) {
          // Pour les autres types (dates, etc.), accepter directement
          finalUpsertData[key] = value;
        }
      }
    }

    console.log("[API][settings] PUT - Données UPDATE (finales, nettoyées):", finalUpsertData);

    // Vérifier d'abord si le profil existe
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("[API][settings] PUT - Erreur vérification profil:", {
        code: checkError.code,
        message: checkError.message,
        details: checkError.details,
        hint: checkError.hint,
      });
      return NextResponse.json(
        { 
          error: "Erreur lors de la vérification du profil", 
          details: checkError.message,
          code: checkError.code,
          hint: checkError.hint,
        },
        { status: 500 }
      );
    }

    let updatedProfile: any;
    let dbError: any = null;

    // Préparer les données pour la mise à jour (sans user_id et plan qui ne doivent pas être mis à jour)
    const updateData: any = {};
    for (const [key, value] of Object.entries(finalUpsertData)) {
      // Exclure user_id et plan de la mise à jour (ils ne doivent pas changer)
      if (key !== 'user_id' && key !== 'plan' && allowedFields.includes(key as any)) {
        updateData[key] = value;
      }
    }

    if (existingProfile) {
      // Le profil existe, faire une mise à jour
      console.log("[API][settings] PUT - Mise à jour du profil existant");
      const { data: profile, error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id)
        .select("user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, conditions_paiement, email_expediteur, nom_expediteur, resend_api_key")
        .single();

      dbError = updateError;
      updatedProfile = profile;
    } else {
      // Le profil n'existe pas, le créer
      console.log("[API][settings] PUT - Profil inexistant, création...");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert(finalUpsertData)
        .select("user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, conditions_paiement, email_expediteur, nom_expediteur, resend_api_key")
        .single();

      dbError = createError;
      updatedProfile = newProfile;
    }

    if (dbError) {
      // LOGS DÉVELOPPEUR COMPLETS
      // Logger TOUTES les infos Supabase
      console.error("[API][settings] PUT - Erreur DB complète:", {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        updateData: existingProfile ? updateData : finalUpsertData,
        allowedFields: allowedFields,
        operation: existingProfile ? "UPDATE" : "INSERT",
      });
      
      // Afficher le message d'erreur exact de Supabase
      return NextResponse.json(
        { 
          error: dbError.message || "Erreur lors de la sauvegarde des paramètres",
          details: dbError.details || "",
          hint: dbError.hint || "",
          code: dbError.code,
        },
        { status: 500 }
      );
    }

    if (!updatedProfile) {
      console.error("[API][settings] PUT - Aucun profil retourné après opération DB");
      return NextResponse.json(
        { 
          error: "Erreur lors de la sauvegarde des paramètres", 
          details: "Le profil n'a pas pu être sauvegardé",
        },
        { status: 500 }
      );
    }

    console.log("[API][settings] PUT - Profil sauvegardé avec succès via UPDATE/INSERT");

    // Utiliser logo_url depuis la DB si disponible, sinon construire depuis logo_path
    let logoUrl: string | null = null;
    if (updatedProfile?.logo_url) {
      logoUrl = updatedProfile.logo_url;
    } else if (updatedProfile?.logo_path) {
      const { data: urlData } = supabase.storage
        .from("Logos")
        .getPublicUrl(updatedProfile.logo_path);
      logoUrl = urlData.publicUrl;
    }

    // Calculer currency_symbol si non défini
    const currency = updatedProfile?.currency || DEFAULT_COMPANY_SETTINGS.currency;
    const currency_symbol = (updatedProfile as any)?.currency_symbol || getCurrencySymbol(currency);

    // Formater la réponse avec valeurs par défaut robustes
    const rawSettings = {
      primary_color: updatedProfile?.primary_color,
      currency: updatedProfile?.currency,
      currency_symbol: (updatedProfile as any)?.currency_symbol,
    };
    
    const companySettings = getCompanySettings(rawSettings);

    const settings = {
      company_name: updatedProfile?.company_name || "",
      company_email: updatedProfile?.company_email || "",
      company_phone: updatedProfile?.company_phone || "",
      company_address: updatedProfile?.company_address || "",
      logo_path: updatedProfile?.logo_path || null,
      logo_url: logoUrl,
      primary_color: companySettings.primary_color,
      currency: companySettings.currency,
      currency_symbol: currency_symbol,
      iban: updatedProfile?.iban || "",
      bank_name: updatedProfile?.bank_name || "",
      conditions_paiement: updatedProfile?.conditions_paiement || "",
      email_expediteur: updatedProfile?.email_expediteur || "",
      nom_expediteur: updatedProfile?.nom_expediteur || "",
      resend_api_key: updatedProfile?.resend_api_key || "",
    };

    console.log("[API][settings] PUT - Settings sauvegardés avec succès");

    return NextResponse.json({ settings });
  } catch (error: any) {
    // Logger TOUTES les infos de l'erreur
    console.error("[API][settings] PUT - Erreur inattendue:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      fullError: error,
    });
    
    // Construire un message lisible pour l'utilisateur
    const errorMessage = error.message || "Erreur lors de la sauvegarde des paramètres";
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la sauvegarde des paramètres",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
