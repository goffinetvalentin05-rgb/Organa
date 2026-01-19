"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Parametres } from "@/lib/mock-data";
import { Upload, Trash, Loader, Building2, CheckCircle } from "@/lib/icons";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/I18nProvider";

function CheckoutHandler({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  useEffect(() => {
    // Vérifier si on revient d'un paiement réussi
    const sessionId = searchParams?.get("session_id");
    if (sessionId) {
      toast.success(t("dashboard.settings.notifications.paymentSuccess"));
      onSuccess();
      // Nettoyer l'URL
      router.replace("/tableau-de-bord/parametres");
    }

    // Vérifier si le paiement a été annulé
    const canceled = searchParams?.get("canceled");
    if (canceled) {
      toast.error(t("dashboard.settings.notifications.paymentCanceled"));
      router.replace("/tableau-de-bord/parametres");
    }
  }, [searchParams, router, onSuccess, t]);

  return null;
}

export default function ParametresPage() {
  const router = useRouter();
  const { t, tList } = useI18n();
  const [parametres, setParametres] = useState<Parametres | null>(null);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  // State initial vide - sera hydraté depuis la DB
  const [formData, setFormData] = useState({
    nomEntreprise: "",
    adresse: "",
    email: "",
    telephone: "",
    styleEnTete: "moderne" as "simple" | "moderne" | "classique",
    emailExpediteur: "",
    nomExpediteur: "",
    resendApiKey: "",
    iban: "",
    bankName: "",
    conditionsPaiement: "",
    primaryColor: "",
    currency: "",
    invoiceColor: "",
    branding: "",
  });
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  /**
   * Helper pour lire le body d'une Response une seule fois
   * Évite l'erreur "body stream already read"
   * @param response - Response object à parser
   * @returns Promise<any> - Données parsées (JSON ou texte)
   */
  const parseResponseBody = async (response: Response): Promise<any> => {
    const contentType = response.headers.get("content-type");

    try {
      if (contentType?.includes("application/json")) {
        return await response.json();
      } else {
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          return { error: t("dashboard.settings.notifications.unknownError"), details: text };
        }
      }
    } catch (parseError) {
      console.error("[PARAMETRES] Erreur parsing response:", parseError);
      return { error: t("dashboard.settings.notifications.readResponseError") };
    }
  };

  // Fonction pour charger les paramètres directement depuis Supabase
  const loadSettingsFromDB = async () => {
    try {
      setLoadingSettings(true);
      console.log("[PARAMETRES] Chargement direct depuis Supabase profiles");
      
      const supabase = createClient();
      
      // 1. Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("[PARAMETRES] Erreur auth:", authError);
        toast.error(t("dashboard.settings.notifications.authReconnect"));
        router.push("/connexion");
        return;
      }

      console.log("[PARAMETRES] User authentifié:", user.id);

      // 2. Charger le profil depuis la table profiles - SELECT EXPLICITE pour garantir tous les champs
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("user_id, company_name, company_email, company_phone, company_address, logo_path, logo_url, primary_color, currency, currency_symbol, iban, bank_name, payment_terms, email_sender_name, email_sender_email, resend_api_key")
        .eq("user_id", user.id)
        .single();

      if (fetchError) {
        // Si le profil n'existe pas, ce n'est pas une erreur critique
        if (fetchError.code === "PGRST116") {
          console.log("[PARAMETRES] Profil inexistant, utilisation des valeurs par défaut");
        } else {
          console.error("[PARAMETRES] Erreur chargement profil:", {
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
          });
          toast.error(`Erreur lors du chargement: ${fetchError.message}`);
          return;
        }
      }

      console.log("[PARAMETRES] Profil chargé depuis DB:", profile);

      // 3. Construire l'URL du logo si logo_path existe mais pas logo_url
      let logoUrl: string | null = null;
      if (profile?.logo_url) {
        logoUrl = profile.logo_url;
      } else if (profile?.logo_path) {
        const { data: urlData } = supabase.storage
          .from("Logos")
          .getPublicUrl(profile.logo_path);
        logoUrl = urlData.publicUrl;
      }

      // 4. Hydrater le state avec les données DB (PAS de valeurs par défaut qui écrasent)
      const normalizedSettings = {
        company_name: profile?.company_name ?? "",
        company_address: profile?.company_address ?? "",
        company_email: profile?.company_email ?? "",
        company_phone: profile?.company_phone ?? "",
        primary_color: profile?.primary_color ?? "#6D5EF8",
        currency: profile?.currency ?? "CHF",
        logo_url: logoUrl ?? null,
        // Champs bancaires
        iban: profile?.iban ?? "",
        bank_name: profile?.bank_name ?? "",
        payment_terms: profile?.payment_terms ?? "",
        // Champs email
        email_sender_email: profile?.email_sender_email ?? "",
        email_sender_name: profile?.email_sender_name ?? "",
        resend_api_key: profile?.resend_api_key ?? "",
      };

      // Formater les données pour correspondre à l'interface Parametres
      const params: Parametres = {
        nomEntreprise: normalizedSettings.company_name,
        adresse: normalizedSettings.company_address,
        email: normalizedSettings.company_email,
        telephone: normalizedSettings.company_phone,
        logo: normalizedSettings.logo_url || undefined,
        styleEnTete: "moderne",
        emailExpediteur: normalizedSettings.email_sender_email,
        nomExpediteur: normalizedSettings.email_sender_name,
        resendApiKey: normalizedSettings.resend_api_key,
        iban: normalizedSettings.iban,
        bankName: normalizedSettings.bank_name,
        conditionsPaiement: normalizedSettings.payment_terms,
      };

      setParametres(params);
      
      // Hydrater formData avec les données DB (PAS de valeurs par défaut qui écrasent)
      setFormData({
        nomEntreprise: normalizedSettings.company_name,
        adresse: normalizedSettings.company_address,
        email: normalizedSettings.company_email,
        telephone: normalizedSettings.company_phone,
        styleEnTete: "moderne",
        emailExpediteur: normalizedSettings.email_sender_email,
        nomExpediteur: normalizedSettings.email_sender_name,
        resendApiKey: normalizedSettings.resend_api_key,
        iban: normalizedSettings.iban,
        bankName: normalizedSettings.bank_name,
        conditionsPaiement: normalizedSettings.payment_terms,
        primaryColor: normalizedSettings.primary_color,
        currency: normalizedSettings.currency,
        invoiceColor: normalizedSettings.primary_color,
        branding: "",
      });

      // Charger le logo
      if (normalizedSettings.logo_url) {
        setLogoPreview(normalizedSettings.logo_url);
      } else {
        setLogoPreview(null);
      }

      console.log("[PARAMETRES] State hydraté avec données DB:", {
        nomEntreprise: normalizedSettings.company_name,
        email: normalizedSettings.company_email,
        primary_color: normalizedSettings.primary_color,
        currency: normalizedSettings.currency,
      });
    } catch (error: any) {
      console.error("[PARAMETRES] Erreur catch loadSettingsFromDB:", error);
      toast.error(
        t("dashboard.settings.notifications.loadError", {
          message: error.message || t("dashboard.common.unknownError"),
        })
      );
    } finally {
      setLoadingSettings(false);
    }
  };

  // Charger les paramètres au montage et après navigation
  useEffect(() => {
    loadSettingsFromDB();
    fetchUserPlan();
  }, []); // Charger uniquement au montage

  const fetchUserPlan = async () => {
    try {
      setLoadingPlan(true);
      const response = await fetch("/api/me");
      if (response.ok) {
        const data = await parseResponseBody(response);
        setUserPlan(data.user?.plan || "free");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du plan", error);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleUpgradeToPro = async () => {
    try {
      setLoadingCheckout(true);
      
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      // Lire d'abord le texte brut pour debug
      const text = await res.text();
      console.log("RAW STRIPE RESPONSE:", text);

      // Parser le JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError);
        console.error("Réponse reçue (premiers 500 caractères):", text.substring(0, 500));
        alert(t("dashboard.settings.notifications.stripeInvalidJson"));
        return;
      }

      console.log("Stripe checkout response (parsed):", data);

      if (data.url) {
        // Rediriger EXCLUSIVEMENT vers Stripe Checkout
        window.location.href = data.url;
      } else {
        alert(
          t("dashboard.settings.notifications.stripeMissingUrl", {
            response: JSON.stringify(data),
          })
        );
      }
    } catch (error: any) {
      console.error("Erreur lors de l'appel à Stripe:", error);
      alert(
        t("dashboard.settings.notifications.stripeOpenError", {
          message: error.message || t("dashboard.common.unknownError"),
        })
      );
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation frontend
    if (!formData.nomEntreprise || formData.nomEntreprise.trim() === "") {
      toast.error(t("dashboard.settings.validation.companyNameRequired"));
      return;
    }

    try {
      // PAYLOAD MANUEL - TOUS LES CHAMPS QUI EXISTENT DANS LA TABLE PROFILES
      // Colonnes existantes : company_name, company_email, company_phone, company_address,
      //                      logo_path, logo_url, primary_color, currency,
      //                      iban, bank_name, payment_terms,
      //                      email_sender_name, email_sender_email, resend_api_key
      // Ne JAMAIS envoyer : created_at, updated_at, id, user_id, undefined, null
      
      const payload: Record<string, string> = {};

      // company_name
      if (formData.nomEntreprise && formData.nomEntreprise.trim()) {
        payload.company_name = formData.nomEntreprise.trim();
      }
      
      // company_email
      if (formData.email && formData.email.trim()) {
        payload.company_email = formData.email.trim();
      }
      
      // company_phone
      if (formData.telephone && formData.telephone.trim()) {
        payload.company_phone = formData.telephone.trim();
      }
      
      // company_address
      if (formData.adresse && formData.adresse.trim()) {
        payload.company_address = formData.adresse.trim();
      }
      
      // primary_color
      if (formData.primaryColor && formData.primaryColor.trim()) {
        const primaryColor = formData.primaryColor.trim();
        // Valider le format hex color
        if (/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
          payload.primary_color = primaryColor;
        }
      }
      
      // currency
      if (formData.currency && formData.currency.trim()) {
        const currency = formData.currency.trim().toUpperCase();
        if (currency.length === 3) {
          payload.currency = currency;
        }
      }

      // Champs bancaires
      if (formData.iban !== undefined) {
        payload.iban = formData.iban.trim();
      }
      if (formData.bankName !== undefined) {
        payload.bank_name = formData.bankName.trim();
      }
      // IMPORTANT: Toujours inclure payment_terms même si vide
      if (formData.conditionsPaiement !== undefined) {
        payload.payment_terms = formData.conditionsPaiement.trim();
      }

      // Champs email
      // IMPORTANT: Toujours inclure email_sender_email même si vide
      if (formData.emailExpediteur !== undefined) {
        payload.email_sender_email = formData.emailExpediteur.trim();
      }
      // IMPORTANT: Toujours inclure email_sender_name même si vide
      if (formData.nomExpediteur !== undefined) {
        payload.email_sender_name = formData.nomExpediteur.trim();
      }
      if (formData.resendApiKey !== undefined) {
        payload.resend_api_key = formData.resendApiKey.trim();
      }

      // Protection finale : garder toutes les valeurs (y compris chaînes vides)
      // pour permettre la mise à jour des champs même s'ils sont vides
      const cleanPayload: Record<string, string> = {};
      for (const [key, value] of Object.entries(payload)) {
        // Accepter toutes les valeurs sauf undefined et null explicites
        if (value !== undefined && value !== null) {
          cleanPayload[key] = value;
        }
      }
      
      console.log("[PARAMETRES] Payload final avec champs spécifiques:", {
        payment_terms: cleanPayload.payment_terms,
        email_sender_email: cleanPayload.email_sender_email,
        email_sender_name: cleanPayload.email_sender_name,
        fullPayload: cleanPayload
      });

      console.log("[PARAMETRES] Envoi du payload (champs existants uniquement):", cleanPayload);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanPayload),
      });

      console.log("[PARAMETRES] Réponse status:", response.status, response.statusText);

      // Lire le body UNE SEULE FOIS avec le helper
      const result = await parseResponseBody(response);

      if (!response.ok) {
        // Utiliser le body déjà parsé
        const errorData = result;
        
        // LOGS DÉVELOPPEUR COMPLETS
        console.error("[PARAMETRES] Erreur backend complète:", {
          status: response.status,
          statusText: response.statusText,
          code: errorData.code,
          message: errorData.message,
          error: errorData.error,
          details: errorData.details,
          hint: errorData.hint,
          fullResponse: errorData,
        });
        
        // Afficher le message d'erreur exact de Supabase
        const errorMessage =
          errorData.error ||
          errorData.message ||
          errorData.details ||
          t("dashboard.settings.notifications.saveError");
        toast.error(errorMessage);
        return; // Ne pas throw pour éviter l'overlay Next.js
      }
      
      // IMPORTANT : Recharger depuis la DB après UPDATE pour garantir la synchronisation
      console.log("[PARAMETRES] UPDATE réussi, rechargement depuis DB...");
      await loadSettingsFromDB();

      setSaved(true);
      toast.success(t("dashboard.settings.saveSuccess"));
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      // Ne pas afficher de toast ici car on l'a déjà fait dans le if (!response.ok)
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });

      // Lire le body UNE SEULE FOIS avec le helper
      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.error || t("dashboard.settings.notifications.uploadError"));
      }

      // Recharger depuis la DB pour synchroniser le state
      console.log("[PARAMETRES] Logo uploadé, rechargement depuis DB...");
      await loadSettingsFromDB();

      toast.success(t("dashboard.settings.notifications.logoUploaded"));
    } catch (error: any) {
      toast.error(error.message || t("dashboard.settings.notifications.uploadLogoError"));
    } finally {
      setUploading(false);
      // Réinitialiser l'input
      e.target.value = "";
    }
  };

  const handleLogoDelete = async () => {
    if (!confirm(t("dashboard.settings.confirm.deleteLogo"))) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch("/api/upload/logo", {
        method: "DELETE",
      });

      // Lire le body UNE SEULE FOIS avec le helper
      const data = await parseResponseBody(response);

      if (!response.ok) {
        throw new Error(data.error || t("dashboard.settings.notifications.deleteError"));
      }

      // Recharger depuis la DB pour synchroniser le state
      console.log("[PARAMETRES] Logo supprimé, rechargement depuis DB...");
      await loadSettingsFromDB();

      toast.success(t("dashboard.settings.notifications.logoDeleted"));
    } catch (error: any) {
      toast.error(error.message || t("dashboard.settings.notifications.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  if (loadingSettings || !parametres) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-secondary">{t("dashboard.settings.loadingPage")}</p>
      </div>
    );
  }

  const planLabel =
    userPlan === "pro"
      ? t("dashboard.settings.subscription.planPro")
      : t("dashboard.settings.subscription.planFree");
  const proFeatures = tList("dashboard.settings.subscription.proFeatures");

  return (
    <>
      <Suspense fallback={null}>
        <CheckoutHandler onSuccess={fetchUserPlan} />
      </Suspense>
      <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.settings.title")}</h1>
        <p className="mt-2 text-secondary">
          {t("dashboard.settings.subtitle")}
        </p>
      </div>

      {saved && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-700 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {t("dashboard.settings.saveSuccess")}
        </div>
      )}

      {/* Section Abonnement */}
      <div className="rounded-xl border border-subtle bg-surface p-6">
        <h2 className="text-xl font-semibold mb-4">{t("dashboard.settings.subscription.title")}</h2>
        
        {loadingPlan ? (
          <p className="text-secondary">{t("dashboard.common.loading")}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">
                  {t("dashboard.settings.subscription.currentPlan")}{" "}
                  <span className="accent">{planLabel}</span>
                </p>
                {userPlan === "free" && (
                  <p className="text-sm text-secondary mt-1">
                    {t("dashboard.settings.subscription.freeLimit", {
                      clients: 2,
                      documents: 3,
                    })}
                  </p>
                )}
                {userPlan === "pro" && (
                  <p className="text-sm text-secondary mt-1">
                    {t("dashboard.settings.subscription.unlimitedAccess")}
                  </p>
                )}
              </div>
              {userPlan === "free" && (
                <button
                  type="button"
                  onClick={handleUpgradeToPro}
                  disabled={loadingCheckout}
                  className="px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCheckout
                    ? t("dashboard.common.loading")
                    : t("dashboard.settings.subscription.upgrade")}
                </button>
              )}
              {userPlan === "pro" && (
                <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium">
                  {t("dashboard.settings.subscription.proBadge")}
                </div>
              )}
            </div>
            {userPlan === "free" && (
              <div className="mt-4 p-4 accent-bg-light accent-border rounded-lg border">
                <p className="text-sm text-primary font-medium mb-2">
                  {t("dashboard.settings.subscription.proOfferTitle")}
                </p>
                <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
                  {proFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Marque */}
        <div className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="text-xl font-semibold mb-4">{t("dashboard.settings.branding.title")}</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.settings.branding.logoLabel")}
            </label>
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 rounded-xl border border-subtle-hover bg-surface flex items-center justify-center overflow-hidden relative group">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt={t("dashboard.settings.branding.logoAlt")}
                    width={128}
                    height={128}
                    className="object-contain p-2"
                    unoptimized={logoPreview.includes("supabase.co")}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-tertiary p-4">
                    <Building2 className="w-12 h-12 mb-2" />
                    <span className="text-xs text-center">{t("dashboard.settings.branding.noLogo")}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="inline-block px-4 py-2 accent-bg text-white font-medium rounded-lg transition-all cursor-pointer flex items-center gap-2">
                    {uploading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        {t("dashboard.settings.branding.uploading")}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {t("dashboard.settings.branding.upload")}
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-tertiary mt-2">
                    {t("dashboard.settings.branding.formats")}
                  </p>
                </div>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        {t("dashboard.settings.branding.deleting")}
                      </>
                    ) : (
                      <>
                        <Trash className="w-4 h-4" />
                        {t("dashboard.settings.branding.delete")}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.settings.branding.headerStyleLabel")}
            </label>
            <select
              value={formData.styleEnTete ?? "moderne"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  styleEnTete: e.target.value as "simple" | "moderne" | "classique",
                })
              }
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            >
              <option value="simple">{t("dashboard.settings.branding.headerStyles.simple")}</option>
              <option value="moderne">{t("dashboard.settings.branding.headerStyles.moderne")}</option>
              <option value="classique">{t("dashboard.settings.branding.headerStyles.classique")}</option>
            </select>
            <p className="text-xs text-tertiary mt-2">
              {t("dashboard.settings.branding.headerStyleHelp")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.settings.branding.primaryColorLabel")}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={formData.primaryColor ?? "#6D5EF8"}
                onChange={(e) =>
                  setFormData({ ...formData, primaryColor: e.target.value })
                }
                className="h-12 w-20 rounded-lg border border-subtle-hover bg-surface cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor ?? "#6D5EF8"}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === "") {
                    setFormData({ ...formData, primaryColor: value || "#6D5EF8" });
                  }
                }}
                placeholder="#6D5EF8"
                className="flex-1 rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] font-mono"
              />
            </div>
            <p className="text-xs text-tertiary mt-2">
              {t("dashboard.settings.branding.primaryColorHelp")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t("dashboard.settings.branding.currencyLabel")}
            </label>
            <select
              value={formData.currency ?? "CHF"}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            >
              <option value="CHF">{t("dashboard.settings.branding.currencies.CHF")}</option>
              <option value="EUR">{t("dashboard.settings.branding.currencies.EUR")}</option>
              <option value="USD">{t("dashboard.settings.branding.currencies.USD")}</option>
              <option value="GBP">{t("dashboard.settings.branding.currencies.GBP")}</option>
              <option value="CAD">{t("dashboard.settings.branding.currencies.CAD")}</option>
              <option value="AUD">{t("dashboard.settings.branding.currencies.AUD")}</option>
              <option value="JPY">{t("dashboard.settings.branding.currencies.JPY")}</option>
            </select>
            <p className="text-xs text-tertiary mt-2">
              {t("dashboard.settings.branding.currencyHelp")}
            </p>
          </div>
        </div>

        {/* Section Informations entreprise */}
        <div className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="text-xl font-semibold mb-4">{t("dashboard.settings.companyInfo.title")}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.settings.companyInfo.nameLabel")}
              </label>
              <input
                type="text"
                required
                value={formData.nomEntreprise ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, nomEntreprise: e.target.value })
                }
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.settings.companyInfo.addressLabel")}
              </label>
              <textarea
                required
                value={formData.adresse ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, adresse: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t("dashboard.settings.companyInfo.emailLabel")}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t("dashboard.settings.companyInfo.phoneLabel")}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telephone ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, telephone: e.target.value })
                  }
                  className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Informations bancaires */}
        <div className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="text-xl font-semibold mb-4">{t("dashboard.settings.billing.title")}</h2>
          <p className="text-sm text-secondary mb-4">
            {t("dashboard.settings.billing.subtitle")}
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.settings.billing.ibanLabel")}
              </label>
              <input
                type="text"
                value={formData.iban ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, iban: e.target.value })
                }
                placeholder={t("dashboard.settings.billing.ibanPlaceholder")}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.settings.billing.bankNameLabel")}
              </label>
              <input
                type="text"
                value={formData.bankName ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder={t("dashboard.settings.billing.bankNamePlaceholder")}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.settings.billing.paymentTermsLabel")}
              </label>
              <textarea
                value={formData.conditionsPaiement ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, conditionsPaiement: e.target.value })
                }
                placeholder={t("dashboard.settings.billing.paymentTermsPlaceholder")}
                rows={3}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
              <p className="text-xs text-tertiary mt-1">
                {t("dashboard.settings.billing.paymentTermsHelp")}
              </p>
            </div>
          </div>
        </div>

        {/* Section Email */}
        <div className="rounded-xl border border-subtle bg-surface p-6">
          <h2 className="text-xl font-semibold mb-4">{t("dashboard.settings.email.title")}</h2>
          <p className="text-sm text-secondary mb-4">
            {t("dashboard.settings.email.subtitleBefore")}{" "}
            <a
              href="https://resend.com"
              target="_blank"
              rel="noopener noreferrer"
              className="accent hover:underline"
            >
              Resend
            </a>{" "}
            {t("dashboard.settings.email.subtitleAfter")}
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.settings.email.senderNameLabel")}
              </label>
              <input
                type="text"
                value={formData.nomExpediteur ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, nomExpediteur: e.target.value })
                }
                placeholder={t("dashboard.settings.email.senderNamePlaceholder")}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
              <p className="text-xs text-tertiary mt-1">
                {t("dashboard.settings.email.senderNameHelp")}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.settings.email.senderEmailLabel")}
              </label>
              <input
                type="email"
                required
                value={formData.emailExpediteur ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, emailExpediteur: e.target.value })
                }
                placeholder={t("dashboard.settings.email.senderEmailPlaceholder")}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
              <p className="text-xs text-tertiary mt-1">
                {t("dashboard.settings.email.senderEmailHelp")}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {t("dashboard.settings.email.apiKeyLabel")}
              </label>
              <input
                type="password"
                required
                value={formData.resendApiKey ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, resendApiKey: e.target.value })
                }
                placeholder={t("dashboard.settings.email.apiKeyPlaceholder")}
                className="w-full rounded-lg bg-surface border border-subtle-hover px-4 py-2 text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
              <p className="text-xs text-tertiary mt-1">
                {t("dashboard.settings.email.apiKeyHelpBefore")}{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="accent hover:underline"
                >
                  resend.com/api-keys
                </a>
                {t("dashboard.settings.email.apiKeyHelpAfter")}
              </p>
            </div>
          </div>
        </div>

        {/* Bouton sauvegarder */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all"
          >
            {t("dashboard.settings.saveButton")}
          </button>
        </div>
      </form>
    </div>
    </>
  );
}





