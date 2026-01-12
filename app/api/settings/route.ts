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
      .select("user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key")
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
        .select("user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key")
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
      payment_terms: profile?.payment_terms || "",
      email_sender_email: profile?.email_sender_email || "",
      email_sender_name: profile?.email_sender_name || "",
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
    //                      iban, bank_name, payment_terms,
    //                      email_sender_name, email_sender_email, resend_api_key
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
      'payment_terms',
      'email_sender_name',
      'email_sender_email',
      'resend_api_key',
      'updated_at'
    ] as const;

    // Récupérer le profil existant avec TOUS les champs nécessaires AVANT de construire le payload
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("user_id, plan, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key")
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

    // Construire UN SEUL objet avec TOUS les champs du profil
    // Fusionner les valeurs existantes avec les nouvelles valeurs du body
    const profilePayload: any = {
      user_id: user.id,
      plan: existingProfile?.plan || "free",
      updated_at: new Date().toISOString(),
    };

    // Ajouter TOUS les champs : utiliser la valeur du body si fournie, sinon garder la valeur existante
    profilePayload.company_name = body.company_name !== undefined 
      ? (body.company_name?.trim() || null)
      : (existingProfile?.company_name || null);
    
    profilePayload.company_email = body.company_email !== undefined
      ? (body.company_email?.trim() || null)
      : (existingProfile?.company_email || null);
    
    profilePayload.company_phone = body.company_phone !== undefined
      ? (body.company_phone?.trim() || null)
      : (existingProfile?.company_phone || null);
    
    profilePayload.company_address = body.company_address !== undefined
      ? (body.company_address?.trim() || null)
      : (existingProfile?.company_address || null);
    
    profilePayload.logo_path = existingProfile?.logo_path || null;
    profilePayload.logo_url = existingProfile?.logo_url || null;
    
    // Gérer primary_color avec validation
    if (body.primary_color !== undefined && body.primary_color !== null) {
      const hexColor = String(body.primary_color).trim();
      if (hexColor && /^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
        profilePayload.primary_color = hexColor;
      } else {
        console.warn("[API][settings] PUT - Couleur mal formatée, utilisation de la valeur par défaut:", hexColor);
        profilePayload.primary_color = existingProfile?.primary_color || DEFAULT_COMPANY_SETTINGS.primary_color;
      }
    } else {
      profilePayload.primary_color = existingProfile?.primary_color || DEFAULT_COMPANY_SETTINGS.primary_color;
    }

    // Gérer currency avec validation
    if (body.currency !== undefined && body.currency !== null) {
      const currency = String(body.currency).trim().toUpperCase();
      if (currency && currency.length === 3) {
        profilePayload.currency = currency;
      } else {
        console.warn("[API][settings] PUT - Devise mal formatée, utilisation de la valeur par défaut:", currency);
        profilePayload.currency = existingProfile?.currency || DEFAULT_COMPANY_SETTINGS.currency;
      }
    } else {
      profilePayload.currency = existingProfile?.currency || DEFAULT_COMPANY_SETTINGS.currency;
    }

    // Calculer currency_symbol
    profilePayload.currency_symbol = getCurrencySymbol(profilePayload.currency);

    // Gérer les champs bancaires
    profilePayload.iban = body.iban !== undefined
      ? (body.iban?.trim() || null)
      : (existingProfile?.iban || null);
    
    profilePayload.bank_name = body.bank_name !== undefined
      ? (body.bank_name?.trim() || null)
      : (existingProfile?.bank_name || null);
    
    // Gérer payment_terms - IMPORTANT: Garder les chaînes vides comme strings
    profilePayload.payment_terms = body.payment_terms !== undefined
      ? (body.payment_terms !== null ? String(body.payment_terms).trim() : "")
      : (existingProfile?.payment_terms || "");

    // Gérer les champs email - IMPORTANT: Garder les chaînes vides comme strings
    profilePayload.email_sender_email = body.email_sender_email !== undefined
      ? (body.email_sender_email !== null ? String(body.email_sender_email).trim() : "")
      : (existingProfile?.email_sender_email || "");
    
    profilePayload.email_sender_name = body.email_sender_name !== undefined
      ? (body.email_sender_name !== null ? String(body.email_sender_name).trim() : "")
      : (existingProfile?.email_sender_name || "");
    
    profilePayload.resend_api_key = body.resend_api_key !== undefined
      ? (body.resend_api_key?.trim() || null)
      : (existingProfile?.resend_api_key || null);
    
    console.log("[API][settings] PUT - Payload complet (UN SEUL update):", profilePayload);
    console.log("[API][settings] PUT - Vérification champs spécifiques:", {
      payment_terms: profilePayload.payment_terms,
      email_sender_email: profilePayload.email_sender_email,
      email_sender_name: profilePayload.email_sender_name,
    });

    if (existingProfile) {
      // Le profil existe, faire UN SEUL UPDATE avec TOUS les champs
      console.log("[API][settings] PUT - Mise à jour du profil existant avec TOUS les champs");
      
      // Exclure user_id et plan de l'update (ils ne doivent pas changer)
      const updateData: any = {};
      for (const [key, value] of Object.entries(profilePayload)) {
        if (key !== 'user_id' && key !== 'plan' && allowedFields.includes(key as any)) {
          updateData[key] = value;
        }
      }
      
      const { data: profile, error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id)
        .select("user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key")
        .single();

      dbError = updateError;
      updatedProfile = profile;
    } else {
      // Le profil n'existe pas, le créer avec TOUS les champs
      console.log("[API][settings] PUT - Profil inexistant, création avec TOUS les champs");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert(profilePayload)
        .select("user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key")
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
        profilePayload: profilePayload,
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
      payment_terms: updatedProfile?.payment_terms || "",
      email_sender_email: updatedProfile?.email_sender_email || "",
      email_sender_name: updatedProfile?.email_sender_name || "",
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
