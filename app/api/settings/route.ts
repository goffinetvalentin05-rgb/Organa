import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_COMPANY_SETTINGS, getCompanySettings } from "@/lib/utils/company-settings";
import { requirePermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getErrorMessage } from "@/lib/utils/error-message";
import { resolveClubLogoUrlForClient } from "@/lib/club/resolveClubLogoUrl";

type SettingsPutBody = Partial<{
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  primary_color: string;
  currency: string;
  logo_url: string;
  iban: string;
  bank_name: string;
  payment_terms: string;
  email_sender_name: string;
  email_sender_email: string;
  resend_api_key: string;
  email_custom_enabled: boolean;
  // Swiss QR Bill
  qr_creditor_name: string;
  qr_creditor_street: string;
  qr_creditor_building_num: string;
  qr_creditor_zip: string;
  qr_creditor_city: string;
  qr_creditor_country: string;
}>;

  type ProfileSettingsRow = {
  user_id?: string;
  plan?: string;
  company_name?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_address?: string | null;
  logo_path?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  currency?: string | null;
  currency_symbol?: string | null;
  iban?: string | null;
  bank_name?: string | null;
  payment_terms?: string | null;
  email_sender_name?: string | null;
  email_sender_email?: string | null;
  resend_api_key?: string | null;
  email_custom_enabled?: boolean | null;
  // Swiss QR Bill
  qr_creditor_name?: string | null;
  qr_creditor_street?: string | null;
  qr_creditor_building_num?: string | null;
  qr_creditor_zip?: string | null;
  qr_creditor_city?: string | null;
  qr_creditor_country?: string | null;
};

type SupabaseOpError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

/**
 * API Route pour rÃ©cupÃ©rer les paramÃ¨tres de l'entreprise
 * GET /api/settings
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[API][settings] GET - DÃ©but rÃ©cupÃ©ration");
    const guard = await requirePermission(PERMISSIONS.ACCESS_SETTINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const clubId = guard.clubId;
    const actorId = guard.userId;

    console.log("[API][settings] GET - club:", clubId, "actor:", actorId);

    // Profil Â« entreprise Â» du club = ligne profiles.user_id = propriÃ©taire du club
    let { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select(
        "user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled, qr_creditor_name, qr_creditor_street, qr_creditor_building_num, qr_creditor_zip, qr_creditor_city, qr_creditor_country"
      )
      .eq("user_id", clubId)
      .maybeSingle();

    // CrÃ©ation auto du profil : uniquement pour son propre compte-club (pas pour un invitÃ©)
    if (!profile) {
      if (clubId === actorId) {
        console.log("[API][settings] GET - Profil inexistant, crÃ©ation avec valeurs par dÃ©faut...");
        const defaultCurrencySymbol = getCurrencySymbol(DEFAULT_COMPANY_SETTINGS.currency);

        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            user_id: actorId,
            plan: "free",
            primary_color: DEFAULT_COMPANY_SETTINGS.primary_color,
            currency: DEFAULT_COMPANY_SETTINGS.currency,
            currency_symbol: defaultCurrencySymbol,
          })
          .select(
            "user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled, qr_creditor_name, qr_creditor_street, qr_creditor_building_num, qr_creditor_zip, qr_creditor_city, qr_creditor_country"
          )
          .single();

        if (createError) {
          console.error("[API][settings] GET - Erreur crÃ©ation profil:", createError);
          profile = null;
        } else {
          profile = newProfile;
        }
      } else {
        console.log(
          "[API][settings] GET - Pas de profil pour ce club (hors crÃ©ation auto invitÃ©)"
        );
      }
    } else if (fetchError) {
      console.error("[API][settings] GET - Erreur rÃ©cupÃ©ration profil:", {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
      });
      // En cas d'erreur de rÃ©cupÃ©ration, utiliser null pour dÃ©clencher les fallbacks
      profile = null;
    }

    // Si profile est toujours null aprÃ¨s toutes les tentatives, utiliser des valeurs par dÃ©faut
    if (!profile) {
      console.log("[API][settings] GET - Utilisation des valeurs par dÃ©faut");
    }

    const logoUrl = await resolveClubLogoUrlForClient(supabase, profile, clubId);
    if (logoUrl) {
      console.log("[API][settings] GET - Logo URL rÃ©solue:", logoUrl);
    }

    // Calculer currency_symbol si non dÃ©fini
    const currency = profile?.currency || DEFAULT_COMPANY_SETTINGS.currency;
    const currency_symbol = profile?.currency_symbol || getCurrencySymbol(currency);

    // Formater les donnÃ©es selon les spÃ©cifications avec valeurs par dÃ©faut robustes
    const rawSettings = {
      primary_color: profile?.primary_color,
      currency: profile?.currency,
      currency_symbol: profile?.currency_symbol,
    };
    
    const companySettings = getCompanySettings(rawSettings);

    const hasResendKey = Boolean(
      profile?.resend_api_key && String(profile.resend_api_key).trim()
    );
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
      email_custom_enabled: profile?.email_custom_enabled === true,
      resend_key_configured: hasResendKey,
      // Swiss QR Bill
      qr_creditor_name: profile?.qr_creditor_name || "",
      qr_creditor_street: profile?.qr_creditor_street || "",
      qr_creditor_building_num: profile?.qr_creditor_building_num || "",
      qr_creditor_zip: profile?.qr_creditor_zip || "",
      qr_creditor_city: profile?.qr_creditor_city || "",
      qr_creditor_country: profile?.qr_creditor_country || "CH",
    };

    console.log("[API][settings] GET - Settings rÃ©cupÃ©rÃ©s avec succÃ¨s");

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    console.error("[API][settings] GET - Erreur inattendue:", error);
    return NextResponse.json(
      { error: "Erreur lors de la rÃ©cupÃ©ration des paramÃ¨tres", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * API Route pour sauvegarder les paramÃ¨tres de l'entreprise
 * PUT /api/settings
 */
export async function PUT(request: NextRequest) {
  try {
    console.log("[API][settings] PUT - DÃ©but sauvegarde");
    const guard = await requirePermission(PERMISSIONS.ACCESS_SETTINGS);
    if ("error" in guard) return guard.error;

    const supabase = await createClient();
    const clubId = guard.clubId;
    const actorId = guard.userId;

    console.log("[API][settings] PUT - club:", clubId, "actor:", actorId);

    // Parser et valider le body
    let body: SettingsPutBody;
    try {
      body = (await request.json()) as SettingsPutBody;
      console.log("[API][settings] PUT - Body reÃ§u:", body);
      
      // Validation basique : body doit Ãªtre un objet
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json(
          { error: "Format de donnÃ©es invalide", details: "Le body doit Ãªtre un objet JSON" },
          { status: 400 }
        );
      }
    } catch (parseError: unknown) {
      console.error("[API][settings] PUT - Erreur parsing JSON:", parseError);
      return NextResponse.json(
        {
          error: "Format de donnÃ©es invalide",
          details: getErrorMessage(parseError) || "JSON invalide",
        },
        { status: 400 }
      );
    }

    // DÃ©finir les champs autorisÃ©s - UNIQUEMENT ceux qui existent dans la table profiles
    // Colonnes existantes : user_id, plan, stripe_customer_id, stripe_subscription_id,
    //                      created_at, updated_at, company_name, company_email, company_phone,
    //                      company_address, logo_path, logo_url, primary_color, currency,
    //                      iban, bank_name, payment_terms,
    //                      email_sender_name, email_sender_email, resend_api_key, email_custom_enabled
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
      'email_custom_enabled',
      'updated_at',
      // Swiss QR Bill
      'qr_creditor_name',
      'qr_creditor_street',
      'qr_creditor_building_num',
      'qr_creditor_zip',
      'qr_creditor_city',
      'qr_creditor_country',
    ] as const;

    // RÃ©cupÃ©rer le profil existant avec TOUS les champs nÃ©cessaires AVANT de construire le payload
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select(
        "user_id, plan, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled, qr_creditor_name, qr_creditor_street, qr_creditor_building_num, qr_creditor_zip, qr_creditor_city, qr_creditor_country"
      )
      .eq("user_id", clubId)
      .maybeSingle();

    if (checkError) {
      console.error("[API][settings] PUT - Erreur vÃ©rification profil:", {
        code: checkError.code,
        message: checkError.message,
        details: checkError.details,
        hint: checkError.hint,
      });
      return NextResponse.json(
        { 
          error: "Erreur lors de la vÃ©rification du profil", 
          details: checkError.message,
          code: checkError.code,
          hint: checkError.hint,
        },
        { status: 500 }
      );
    }

    let updatedProfile: ProfileSettingsRow | null = null;
    let dbError: SupabaseOpError | null = null;

    // Construire UN SEUL objet avec TOUS les champs du profil
    // Fusionner les valeurs existantes avec les nouvelles valeurs du body
    const profilePayload: Record<string, unknown> = {
      user_id: clubId,
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
    
    // GÃ©rer primary_color avec validation
    if (body.primary_color !== undefined && body.primary_color !== null) {
      const hexColor = String(body.primary_color).trim();
      if (hexColor && /^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
        profilePayload.primary_color = hexColor;
      } else {
        console.warn("[API][settings] PUT - Couleur mal formatÃ©e, utilisation de la valeur par dÃ©faut:", hexColor);
        profilePayload.primary_color = existingProfile?.primary_color || DEFAULT_COMPANY_SETTINGS.primary_color;
      }
    } else {
      profilePayload.primary_color = existingProfile?.primary_color || DEFAULT_COMPANY_SETTINGS.primary_color;
    }

    // GÃ©rer currency avec validation
    if (body.currency !== undefined && body.currency !== null) {
      const currency = String(body.currency).trim().toUpperCase();
      if (currency && currency.length === 3) {
        profilePayload.currency = currency;
      } else {
        console.warn("[API][settings] PUT - Devise mal formatÃ©e, utilisation de la valeur par dÃ©faut:", currency);
        profilePayload.currency = existingProfile?.currency || DEFAULT_COMPANY_SETTINGS.currency;
      }
    } else {
      profilePayload.currency = existingProfile?.currency || DEFAULT_COMPANY_SETTINGS.currency;
    }

    // Calculer currency_symbol
    profilePayload.currency_symbol = getCurrencySymbol(
      typeof profilePayload.currency === "string" ? profilePayload.currency : undefined
    );

    // GÃ©rer les champs bancaires
    profilePayload.iban = body.iban !== undefined
      ? (body.iban?.trim() || null)
      : (existingProfile?.iban || null);
    
    profilePayload.bank_name = body.bank_name !== undefined
      ? (body.bank_name?.trim() || null)
      : (existingProfile?.bank_name || null);
    
    // GÃ©rer payment_terms - IMPORTANT: Garder les chaÃ®nes vides comme strings
    profilePayload.payment_terms = body.payment_terms !== undefined
      ? (body.payment_terms !== null ? String(body.payment_terms).trim() : "")
      : (existingProfile?.payment_terms || "");

    // GÃ©rer les champs email - IMPORTANT: Garder les chaÃ®nes vides comme strings
    profilePayload.email_sender_email = body.email_sender_email !== undefined
      ? (body.email_sender_email !== null ? String(body.email_sender_email).trim() : "")
      : (existingProfile?.email_sender_email || "");
    
    profilePayload.email_sender_name = body.email_sender_name !== undefined
      ? (body.email_sender_name !== null ? String(body.email_sender_name).trim() : "")
      : (existingProfile?.email_sender_name || "");
    
    if (body.resend_api_key !== undefined) {
      const v = body.resend_api_key;
      if (v === null || v === "") {
        profilePayload.resend_api_key = null;
      } else if (typeof v === "string") {
        profilePayload.resend_api_key = v.trim() || null;
      } else {
        profilePayload.resend_api_key = existingProfile?.resend_api_key || null;
      }
    } else {
      profilePayload.resend_api_key = existingProfile?.resend_api_key || null;
    }

    profilePayload.email_custom_enabled =
      body.email_custom_enabled !== undefined
        ? Boolean(body.email_custom_enabled)
        : Boolean(existingProfile?.email_custom_enabled);

    // Swiss QR Bill — créancier structuré
    profilePayload.qr_creditor_name = body.qr_creditor_name !== undefined
      ? (body.qr_creditor_name !== null ? String(body.qr_creditor_name).trim() : "")
      : (existingProfile?.qr_creditor_name || "");
    profilePayload.qr_creditor_street = body.qr_creditor_street !== undefined
      ? (body.qr_creditor_street !== null ? String(body.qr_creditor_street).trim() : "")
      : (existingProfile?.qr_creditor_street || "");
    profilePayload.qr_creditor_building_num = body.qr_creditor_building_num !== undefined
      ? (body.qr_creditor_building_num !== null ? String(body.qr_creditor_building_num).trim() : "")
      : (existingProfile?.qr_creditor_building_num || "");
    profilePayload.qr_creditor_zip = body.qr_creditor_zip !== undefined
      ? (body.qr_creditor_zip !== null ? String(body.qr_creditor_zip).trim() : "")
      : (existingProfile?.qr_creditor_zip || "");
    profilePayload.qr_creditor_city = body.qr_creditor_city !== undefined
      ? (body.qr_creditor_city !== null ? String(body.qr_creditor_city).trim() : "")
      : (existingProfile?.qr_creditor_city || "");
    profilePayload.qr_creditor_country = body.qr_creditor_country !== undefined
      ? (body.qr_creditor_country !== null ? String(body.qr_creditor_country).trim() : "CH")
      : (existingProfile?.qr_creditor_country || "CH");

    const { resend_api_key: _omit, ...logSafePayload } = profilePayload;
    console.log("[API][settings] PUT - Payload (hors clÃ© Resend):", {
      ...logSafePayload,
      resend_api_key: profilePayload.resend_api_key ? "[prÃ©sent]" : null,
    });
    console.log("[API][settings] PUT - VÃ©rification champs spÃ©cifiques:", {
      payment_terms: profilePayload.payment_terms,
      email_sender_email: profilePayload.email_sender_email,
      email_sender_name: profilePayload.email_sender_name,
    });

    if (existingProfile) {
      // Le profil existe, faire UN SEUL UPDATE avec TOUS les champs
      console.log("[API][settings] PUT - Mise Ã  jour du profil existant avec TOUS les champs");
      
      // Exclure user_id et plan de l'update (ils ne doivent pas changer)
      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(profilePayload)) {
        if (
          key !== "user_id" &&
          key !== "plan" &&
          (allowedFields as readonly string[]).includes(key)
        ) {
          updateData[key] = value;
        }
      }
      
      const { data: profile, error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", clubId)
        .select(
          "user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled, qr_creditor_name, qr_creditor_street, qr_creditor_building_num, qr_creditor_zip, qr_creditor_city, qr_creditor_country"
        )
        .single();

      dbError = updateError;
      updatedProfile = profile;
    } else {
      // Le profil n'existe pas, le crÃ©er avec TOUS les champs
      console.log("[API][settings] PUT - Profil inexistant, crÃ©ation avec TOUS les champs");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert(profilePayload)
        .select(
          "user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key, email_custom_enabled, qr_creditor_name, qr_creditor_street, qr_creditor_building_num, qr_creditor_zip, qr_creditor_city, qr_creditor_country"
        )
        .single();

      dbError = createError;
      updatedProfile = newProfile;
    }

    if (dbError) {
      // LOGS DÃ‰VELOPPEUR COMPLETS
      // Logger TOUTES les infos Supabase
      const { resend_api_key: _e, ...safePayload } = profilePayload;
      console.error("[API][settings] PUT - Erreur DB complÃ¨te:", {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        profilePayload: { ...safePayload, resend_api_key: profilePayload.resend_api_key ? "[prÃ©sent]" : null },
        allowedFields: allowedFields,
        operation: existingProfile ? "UPDATE" : "INSERT",
      });
      
      // Afficher le message d'erreur exact de Supabase
      return NextResponse.json(
        { 
          error: dbError.message || "Erreur lors de la sauvegarde des paramÃ¨tres",
          details: dbError.details || "",
          hint: dbError.hint || "",
          code: dbError.code,
        },
        { status: 500 }
      );
    }

    if (!updatedProfile) {
      console.error("[API][settings] PUT - Aucun profil retournÃ© aprÃ¨s opÃ©ration DB");
      return NextResponse.json(
        { 
          error: "Erreur lors de la sauvegarde des paramÃ¨tres", 
          details: "Le profil n'a pas pu Ãªtre sauvegardÃ©",
        },
        { status: 500 }
      );
    }

    console.log("[API][settings] PUT - Profil sauvegardÃ© avec succÃ¨s via UPDATE/INSERT");

    const logoUrl = await resolveClubLogoUrlForClient(
      supabase,
      updatedProfile,
      clubId
    );

    // Calculer currency_symbol si non dÃ©fini
    const currency = updatedProfile?.currency || DEFAULT_COMPANY_SETTINGS.currency;
    const currency_symbol =
      updatedProfile?.currency_symbol || getCurrencySymbol(currency);

    // Formater la rÃ©ponse avec valeurs par dÃ©faut robustes
    const rawSettings = {
      primary_color: updatedProfile?.primary_color,
      currency: updatedProfile?.currency,
      currency_symbol: updatedProfile?.currency_symbol,
    };
    
    const companySettings = getCompanySettings(rawSettings);

    const putHasResendKey = Boolean(
      (updatedProfile as { resend_api_key?: string | null })?.resend_api_key &&
        String((updatedProfile as { resend_api_key?: string | null }).resend_api_key).trim()
    );
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
      email_custom_enabled: (updatedProfile as { email_custom_enabled?: boolean | null })
        ?.email_custom_enabled === true,
      resend_key_configured: putHasResendKey,
      // Swiss QR Bill
      qr_creditor_name: (updatedProfile as ProfileSettingsRow)?.qr_creditor_name || "",
      qr_creditor_street: (updatedProfile as ProfileSettingsRow)?.qr_creditor_street || "",
      qr_creditor_building_num: (updatedProfile as ProfileSettingsRow)?.qr_creditor_building_num || "",
      qr_creditor_zip: (updatedProfile as ProfileSettingsRow)?.qr_creditor_zip || "",
      qr_creditor_city: (updatedProfile as ProfileSettingsRow)?.qr_creditor_city || "",
      qr_creditor_country: (updatedProfile as ProfileSettingsRow)?.qr_creditor_country || "CH",
    };

    console.log("[API][settings] PUT - Settings sauvegardÃ©s avec succÃ¨s");

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    // Logger TOUTES les infos de l'erreur
    console.error("[API][settings] PUT - Erreur inattendue:", {
      message: getErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      fullError: error,
    });
    
    // Construire un message lisible pour l'utilisateur
    const errorMessage = getErrorMessage(error);
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la sauvegarde des paramÃ¨tres",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

