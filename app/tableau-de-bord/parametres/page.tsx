"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Parametres } from "@/lib/mock-data";
import { Upload, Trash, Loader, Building2, CheckCircle } from "@/lib/icons";
import { createClient } from "@/lib/supabase/client";

/**
 * Helper pour lire le body d'une Response une seule fois
 * Évite l'erreur "body stream already read"
 * @param response - Response object à parser
 * @returns Promise<any> - Données parsées (JSON ou texte)
 */
async function parseResponseBody(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type");
  
  try {
    if (contentType?.includes("application/json")) {
      return await response.json();
    } else {
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return { error: "Erreur inconnue", details: text };
      }
    }
  } catch (parseError) {
    console.error("[PARAMETRES] Erreur parsing response:", parseError);
    return { error: "Erreur lors de la lecture de la réponse" };
  }
}

function CheckoutHandler({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Vérifier si on revient d'un paiement réussi
    const sessionId = searchParams?.get("session_id");
    if (sessionId) {
      toast.success("Paiement réussi ! Votre compte est maintenant Pro.");
      onSuccess();
      // Nettoyer l'URL
      router.replace("/tableau-de-bord/parametres");
    }

    // Vérifier si le paiement a été annulé
    const canceled = searchParams?.get("canceled");
    if (canceled) {
      toast.error("Paiement annulé");
      router.replace("/tableau-de-bord/parametres");
    }
  }, [searchParams, router, onSuccess]);

  return null;
}

export default function ParametresPage() {
  const router = useRouter();
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
        toast.error("Veuillez vous reconnecter");
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
      toast.error(`Erreur: ${error.message || "Erreur lors du chargement"}`);
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
        alert("Erreur : La réponse n'est pas du JSON valide. Vérifiez la console.");
        return;
      }

      console.log("Stripe checkout response (parsed):", data);

      if (data.url) {
        // Rediriger EXCLUSIVEMENT vers Stripe Checkout
        window.location.href = data.url;
      } else {
        alert("Erreur Stripe : URL manquante. Réponse: " + JSON.stringify(data));
      }
    } catch (error: any) {
      console.error("Erreur lors de l'appel à Stripe:", error);
      alert("Erreur lors de l'ouverture du paiement : " + (error.message || "Erreur inconnue"));
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation frontend
    if (!formData.nomEntreprise || formData.nomEntreprise.trim() === "") {
      toast.error("Le nom de l'entreprise est obligatoire");
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
      if (formData.conditionsPaiement !== undefined) {
        payload.payment_terms = formData.conditionsPaiement.trim();
      }

      // Champs email
      if (formData.emailExpediteur !== undefined) {
        payload.email_sender_email = formData.emailExpediteur.trim();
      }
      if (formData.nomExpediteur !== undefined) {
        payload.email_sender_name = formData.nomExpediteur.trim();
      }
      if (formData.resendApiKey !== undefined) {
        payload.resend_api_key = formData.resendApiKey.trim();
      }

      // Protection finale : supprimer toute clé avec valeur undefined ou null
      // MAIS garder les chaînes vides car elles peuvent être intentionnelles
      const cleanPayload: Record<string, string> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
          cleanPayload[key] = value;
        }
      }

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
        const errorMessage = errorData.error || errorData.message || errorData.details || "Erreur lors de la sauvegarde";
        toast.error(errorMessage);
        return; // Ne pas throw pour éviter l'overlay Next.js
      }
      
      // IMPORTANT : Recharger depuis la DB après UPDATE pour garantir la synchronisation
      console.log("[PARAMETRES] UPDATE réussi, rechargement depuis DB...");
      await loadSettingsFromDB();

      setSaved(true);
      toast.success("Paramètres enregistrés avec succès");
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
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      // Recharger depuis la DB pour synchroniser le state
      console.log("[PARAMETRES] Logo uploadé, rechargement depuis DB...");
      await loadSettingsFromDB();
      
      toast.success("Logo uploadé avec succès !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'upload du logo");
    } finally {
      setUploading(false);
      // Réinitialiser l'input
      e.target.value = "";
    }
  };

  const handleLogoDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer le logo ?")) {
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
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      // Recharger depuis la DB pour synchroniser le state
      console.log("[PARAMETRES] Logo supprimé, rechargement depuis DB...");
      await loadSettingsFromDB();
      
      toast.success("Logo supprimé avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression du logo");
    } finally {
      setDeleting(false);
    }
  };

  if (loadingSettings || !parametres) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-white/70">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <CheckoutHandler onSuccess={fetchUserPlan} />
      </Suspense>
      <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="mt-2 text-white/70">
          Configurez votre entreprise et votre marque
        </p>
      </div>

      {saved && (
        <div className="rounded-lg bg-green-500/20 border border-green-500/50 p-4 text-green-300 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Paramètres enregistrés avec succès
        </div>
      )}

      {/* Section Abonnement */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold mb-4">Abonnement</h2>
        
        {loadingPlan ? (
          <p className="text-white/70">Chargement...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">
                  Plan actuel : <span className="text-[#7C5CFF]">{userPlan === "pro" ? "Pro" : "Gratuit"}</span>
                </p>
                {userPlan === "free" && (
                  <p className="text-sm text-white/70 mt-1">
                    Limite : 2 clients, 3 documents par mois
                  </p>
                )}
                {userPlan === "pro" && (
                  <p className="text-sm text-white/70 mt-1">
                    Accès illimité à toutes les fonctionnalités
                  </p>
                )}
              </div>
              {userPlan === "free" && (
                <button
                  type="button"
                  onClick={handleUpgradeToPro}
                  disabled={loadingCheckout}
                  className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCheckout ? "Chargement..." : "🚀 Passer à Pro"}
                </button>
              )}
              {userPlan === "pro" && (
                <div className="px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-300 rounded-lg font-medium">
                  ✓ Abonné Pro
                </div>
              )}
            </div>
            {userPlan === "free" && (
              <div className="mt-4 p-4 bg-[#7C5CFF]/10 border border-[#7C5CFF]/30 rounded-lg">
                <p className="text-sm text-white/90 font-medium mb-2">Plan Pro - 29 CHF / mois</p>
                <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
                  <li>Clients illimités</li>
                  <li>Documents illimités</li>
                  <li>Toutes les fonctionnalités</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section Marque */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4">Marque</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-2">
              Logo de l'entreprise
            </label>
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 rounded-xl border border-white/20 bg-black/40 flex items-center justify-center overflow-hidden relative group">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo entreprise"
                    width={128}
                    height={128}
                    className="object-contain p-2"
                    unoptimized={logoPreview.includes("supabase.co")}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/50 p-4">
                    <Building2 className="w-12 h-12 mb-2" />
                    <span className="text-xs text-center">Aucun logo</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="inline-block px-4 py-2 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all cursor-pointer flex items-center gap-2">
                    {uploading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Upload en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Choisir un logo
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
                  <p className="text-xs text-white/50 mt-2">
                    Formats acceptés : PNG, JPG, SVG (max 5MB)
                  </p>
                </div>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash className="w-4 h-4" />
                        Supprimer le logo
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Style d'en-tête
            </label>
            <select
              value={formData.styleEnTete ?? "moderne"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  styleEnTete: e.target.value as "simple" | "moderne" | "classique",
                })
              }
              className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            >
              <option value="simple">Simple</option>
              <option value="moderne">Moderne</option>
              <option value="classique">Classique</option>
            </select>
            <p className="text-xs text-white/50 mt-2">
              Style utilisé pour l'affichage des documents (devis, factures)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Couleur principale
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={formData.primaryColor ?? "#6D5EF8"}
                onChange={(e) =>
                  setFormData({ ...formData, primaryColor: e.target.value })
                }
                className="h-12 w-20 rounded-lg border border-white/20 bg-black/40 cursor-pointer"
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
                className="flex-1 rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF] font-mono"
              />
            </div>
            <p className="text-xs text-white/50 mt-2">
              Couleur utilisée pour le nom de l'entreprise et les éléments visuels sur les factures PDF
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Devise de facturation
            </label>
            <select
              value={formData.currency ?? "CHF"}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
            >
              <option value="CHF">CHF - Franc suisse</option>
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - Dollar américain</option>
              <option value="GBP">GBP - Livre sterling</option>
              <option value="CAD">CAD - Dollar canadien</option>
              <option value="AUD">AUD - Dollar australien</option>
              <option value="JPY">JPY - Yen japonais</option>
            </select>
            <p className="text-xs text-white/50 mt-2">
              Devise par défaut utilisée sur les devis et factures
            </p>
          </div>
        </div>

        {/* Section Informations entreprise */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4">Informations entreprise</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Nom de l'entreprise *
              </label>
              <input
                type="text"
                required
                value={formData.nomEntreprise ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, nomEntreprise: e.target.value })
                }
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Adresse *
              </label>
              <textarea
                required
                value={formData.adresse ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, adresse: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telephone ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, telephone: e.target.value })
                  }
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Informations bancaires */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4">Informations bancaires</h2>
          <p className="text-sm text-white/70 mb-4">
            Ces informations seront affichées sur les factures et devis PDF.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                IBAN
              </label>
              <input
                type="text"
                value={formData.iban ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, iban: e.target.value })
                }
                placeholder="CH93 0076 2011 6238 5295 7"
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Nom de la banque
              </label>
              <input
                type="text"
                value={formData.bankName ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="Banque Suisse"
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Conditions de paiement
              </label>
              <textarea
                value={formData.conditionsPaiement ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, conditionsPaiement: e.target.value })
                }
                placeholder="Paiement à réception, délai de paiement : 30 jours"
                rows={3}
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
              <p className="text-xs text-white/50 mt-1">
                Conditions affichées dans le footer des PDF
              </p>
            </div>
          </div>
        </div>

        {/* Section Email */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4">Configuration Email</h2>
          <p className="text-sm text-white/70 mb-4">
            Configurez l'envoi d'emails pour les devis et factures. Utilisez{" "}
            <a
              href="https://resend.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7C5CFF] hover:underline"
            >
              Resend
            </a>{" "}
            pour envoyer des emails.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Nom de l'expéditeur
              </label>
              <input
                type="text"
                value={formData.nomExpediteur ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, nomExpediteur: e.target.value })
                }
                placeholder="Organa"
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
              <p className="text-xs text-white/50 mt-1">
                Nom affiché dans les emails envoyés
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email de l'expéditeur *
              </label>
              <input
                type="email"
                required
                value={formData.emailExpediteur ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, emailExpediteur: e.target.value })
                }
                placeholder="noreply@votredomaine.com"
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
              <p className="text-xs text-white/50 mt-1">
                Doit être un domaine vérifié dans Resend
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Clé API Resend *
              </label>
              <input
                type="password"
                required
                value={formData.resendApiKey ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, resendApiKey: e.target.value })
                }
                placeholder="re_xxxxxxxxxxxxx"
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]"
              />
              <p className="text-xs text-white/50 mt-1">
                Obtenez votre clé API sur{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#7C5CFF] hover:underline"
                >
                  resend.com/api-keys
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bouton sauvegarder */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-[#7C5CFF] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 transition-all"
          >
            💾 Enregistrer les paramètres
          </button>
        </div>
      </form>
    </div>
    </>
  );
}

