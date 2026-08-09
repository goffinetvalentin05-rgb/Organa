"use client";

import { useState, useEffect, Suspense, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Parametres } from "@/lib/mock-data";
import {
  Upload,
  Trash,
  Loader,
  Building2,
  CheckCircle,
  Users,
  Wallet,
  Shield,
  Settings,
} from "@/lib/icons";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/I18nProvider";
import DashboardPrimaryButton from "@/components/DashboardPrimaryButton";
import SubmittingOverlay from "@/components/SubmittingOverlay";
import DraftAutosaveHint from "@/components/DraftAutosaveHint";
import MemberFieldsSettingsCard from "./MemberFieldsSettingsCard";
import { PageLayout, PageHeader, SectionCard, cn, dashboardInputClass, dashboardSelectLgClass, dashboardLabelClass, dashboardHintClass, dashboardGlassCardClass } from "@/components/ui";
import SettingsAccordion from "./SettingsAccordion";
import UsersAccessCard from "@/components/billing/UsersAccessCard";
import { getErrorMessage } from "@/lib/utils/error-message";
import { TEAM_PRICING } from "@/lib/billing/pricing";
import { useSafeSubmit } from "@/hooks/useSafeSubmit";
import { useAutoDraft } from "@/hooks/useAutoDraft";
import { usePermissions } from "@/lib/auth/permissions-client";
import { idempotentFetch } from "@/lib/api/idempotentFetch";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  clubSettingsDraftStore,
  toClubSettingsDraftPayload,
  type ClubSettingsDraftData,
} from "@/lib/drafts/clubSettingsDraft";

type ApiErrorBody = {
  error?: string;
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

type MeApiBody = {
  subscription?: SubscriptionInfo | null;
  product?: { canManageTeamAccess?: boolean };
};

type SimpleMessageBody = {
  error?: string;
};

// Types pour les infos d'abonnement
interface SubscriptionInfo {
  status: "trial" | "active" | "expired";
  billingCycle: "monthly" | "yearly" | null;
  trialDaysRemaining: number;
  trialEndsAt: string | null;
  isTrialExpired: boolean;
  canWrite: boolean;
  subscriptionEndsAt: string | null;
}

function CheckoutHandler({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  useEffect(() => {
    // Vérifier si on revient d'un paiement réussi
    const checkoutStatus = searchParams?.get("checkout");
    if (checkoutStatus === "success") {
      toast.success(t("dashboard.settings.subscriptionActivated"));
      onSuccess();
      // Nettoyer l'URL
      router.replace("/tableau-de-bord/parametres");
    }

    // Vérifier si le paiement a été annulé (ancien paramètre)
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
  const { t } = useI18n();
  const { clubId, loading: clubLoading } = usePermissions();
  const [parametres, setParametres] = useState<Parametres | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [canManageTeamAccess, setCanManageTeamAccess] = useState(false);
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
    emailCustomEnabled: false,
    resendKeyConfigured: false,
    resendApiKeyTouched: false,
    iban: "",
    bankName: "",
    conditionsPaiement: "",
    primaryColor: "",
    currency: "",
    invoiceColor: "",
    branding: "",
    // Swiss QR Bill — créancier structuré
    qrCreditorName: "",
    qrCreditorStreet: "",
    qrCreditorBuildingNum: "",
    qrCreditorZip: "",
    qrCreditorCity: "",
    qrCreditorCountry: "CH",
  });
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const {
    isSubmitting: isSubmittingSettings,
    showOverlay: showSettingsOverlay,
    run: runSettingsSave,
  } = useSafeSubmit({ overlayDelayMs: 450 });
  const [saveSuccessPulse, setSaveSuccessPulse] = useState(false);
  const initialFormSignatureRef = useRef<string | null>(null);

  const draftData = useMemo(
    () => toClubSettingsDraftPayload(formData),
    [formData]
  );

  const applyDraftData = useCallback((data: ClubSettingsDraftData) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
      // Ne jamais restaurer de secrets depuis localStorage
      resendApiKey: "",
      resendApiKeyTouched: false,
      resendKeyConfigured: prev.resendKeyConfigured,
    }));
  }, []);

  const { clearDraft, showDraftStatus, draftStatusLabel } = useAutoDraft({
    store: clubSettingsDraftStore,
    clubId,
    clubLoading,
    data: draftData,
    enabled: !loadingSettings,
    onRestore: applyDraftData,
  });

  /**
   * Helper pour lire le body d'une Response une seule fois
   * Évite l'erreur "body stream already read"
   * @param response - Response object à parser
   * @returns Promise<any> - Données parsées (JSON ou texte)
   */
  const parseResponseBody = async (response: Response): Promise<unknown> => {
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

  const buildSettingsSignature = (data: typeof formData) =>
    JSON.stringify({
      nomEntreprise: data.nomEntreprise,
      adresse: data.adresse,
      email: data.email,
      telephone: data.telephone,
      primaryColor: data.primaryColor,
      currency: data.currency,
      iban: data.iban,
      bankName: data.bankName,
      conditionsPaiement: data.conditionsPaiement,
      emailCustomEnabled: data.emailCustomEnabled,
      emailExpediteur: data.emailExpediteur,
      nomExpediteur: data.nomExpediteur,
      resendApiKeyTouched: data.resendApiKeyTouched,
      resendApiKey: data.resendApiKey,
      qrCreditorName: data.qrCreditorName,
      qrCreditorStreet: data.qrCreditorStreet,
      qrCreditorBuildingNum: data.qrCreditorBuildingNum,
      qrCreditorZip: data.qrCreditorZip,
      qrCreditorCity: data.qrCreditorCity,
      qrCreditorCountry: data.qrCreditorCountry,
    });

  const hasChanges =
    initialFormSignatureRef.current === null
      ? true
      : buildSettingsSignature(formData) !== initialFormSignatureRef.current;

  /** Chargement via l’API (pas de clé Resend côté client). */
  const loadSettingsFromDB = async () => {
    try {
      setLoadingSettings(true);
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("[PARAMETRES] Erreur auth:", authError);
        toast.error(t("dashboard.settings.notifications.authReconnect"));
        router.push("/connexion");
        return;
      }

      const response = await fetch("/api/settings");
      const data = await parseResponseBody(response);
      if (!response.ok) {
        toast.error(
          (data as { error?: string })?.error ||
            t("dashboard.settings.notifications.loadError", { message: "" })
        );
        return;
      }

      const s = (data as { settings: Record<string, unknown> }).settings;
      if (!s) {
        toast.error(t("dashboard.settings.notifications.loadError", { message: "settings" }));
        return;
      }

      const primaryColor = (s.primary_color as string) || "#6D5EF8";
      const logoUrl = (s.logo_url as string | null) || null;
      const emailCustom = s.email_custom_enabled === true;
      const resendConfigured = s.resend_key_configured === true;

      const normalizedSettings = {
        company_name: (s.company_name as string) ?? "",
        company_address: (s.company_address as string) ?? "",
        company_email: (s.company_email as string) ?? "",
        company_phone: (s.company_phone as string) ?? "",
        primary_color: primaryColor,
        currency: (s.currency as string) ?? "CHF",
        logo_url: logoUrl,
        iban: (s.iban as string) ?? "",
        bank_name: (s.bank_name as string) ?? "",
        payment_terms: (s.payment_terms as string) ?? "",
        email_sender_email: (s.email_sender_email as string) ?? "",
        email_sender_name: (s.email_sender_name as string) ?? "",
        qr_creditor_name: (s.qr_creditor_name as string) ?? "",
        qr_creditor_street: (s.qr_creditor_street as string) ?? "",
        qr_creditor_building_num: (s.qr_creditor_building_num as string) ?? "",
        qr_creditor_zip: (s.qr_creditor_zip as string) ?? "",
        qr_creditor_city: (s.qr_creditor_city as string) ?? "",
        qr_creditor_country: (s.qr_creditor_country as string) ?? "CH",
      };

      const params: Parametres = {
        nomEntreprise: normalizedSettings.company_name,
        adresse: normalizedSettings.company_address,
        email: normalizedSettings.company_email,
        telephone: normalizedSettings.company_phone,
        logo: normalizedSettings.logo_url || undefined,
        styleEnTete: "moderne",
        emailExpediteur: normalizedSettings.email_sender_email,
        nomExpediteur: normalizedSettings.email_sender_name,
        resendApiKey: "",
        emailCustomEnabled: emailCustom,
        resendKeyConfigured: resendConfigured,
        iban: normalizedSettings.iban,
        bankName: normalizedSettings.bank_name,
        conditionsPaiement: normalizedSettings.payment_terms,
      };

      setParametres(params);
      setFormData({
        nomEntreprise: normalizedSettings.company_name,
        adresse: normalizedSettings.company_address,
        email: normalizedSettings.company_email,
        telephone: normalizedSettings.company_phone,
        styleEnTete: "moderne",
        emailExpediteur: normalizedSettings.email_sender_email,
        nomExpediteur: normalizedSettings.email_sender_name,
        resendApiKey: "",
        emailCustomEnabled: emailCustom,
        resendKeyConfigured: resendConfigured,
        resendApiKeyTouched: false,
        iban: normalizedSettings.iban,
        bankName: normalizedSettings.bank_name,
        conditionsPaiement: normalizedSettings.payment_terms,
        primaryColor,
        currency: normalizedSettings.currency,
        invoiceColor: primaryColor,
        branding: "",
        qrCreditorName: normalizedSettings.qr_creditor_name,
        qrCreditorStreet: normalizedSettings.qr_creditor_street,
        qrCreditorBuildingNum: normalizedSettings.qr_creditor_building_num,
        qrCreditorZip: normalizedSettings.qr_creditor_zip,
        qrCreditorCity: normalizedSettings.qr_creditor_city,
        qrCreditorCountry: normalizedSettings.qr_creditor_country,
      });

      // Signature de référence pour le “dirty check” du bouton Enregistrer.
      initialFormSignatureRef.current = JSON.stringify({
        nomEntreprise: normalizedSettings.company_name,
        adresse: normalizedSettings.company_address,
        email: normalizedSettings.company_email,
        telephone: normalizedSettings.company_phone,
        primaryColor,
        currency: normalizedSettings.currency,
        iban: normalizedSettings.iban,
        bankName: normalizedSettings.bank_name,
        conditionsPaiement: normalizedSettings.payment_terms,
        emailCustomEnabled: emailCustom,
        emailExpediteur: normalizedSettings.email_sender_email,
        nomExpediteur: normalizedSettings.email_sender_name,
        resendApiKeyTouched: false,
        resendApiKey: "",
        qrCreditorName: normalizedSettings.qr_creditor_name,
        qrCreditorStreet: normalizedSettings.qr_creditor_street,
        qrCreditorBuildingNum: normalizedSettings.qr_creditor_building_num,
        qrCreditorZip: normalizedSettings.qr_creditor_zip,
        qrCreditorCity: normalizedSettings.qr_creditor_city,
        qrCreditorCountry: normalizedSettings.qr_creditor_country,
      });

      if (logoUrl) {
        setLogoPreview(logoUrl);
      } else {
        setLogoPreview(null);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("dashboard.common.unknownError");
      console.error("[PARAMETRES] loadSettingsFromDB:", error);
      toast.error(
        t("dashboard.settings.notifications.loadError", {
          message,
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
        const data = (await parseResponseBody(response)) as MeApiBody;
        setSubscription(data.subscription || null);
        setCanManageTeamAccess(
          data.product?.canManageTeamAccess === true
        );
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingInterval: "yearly", plan: "team" }),
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
    } catch (error: unknown) {
      console.error("Erreur lors de l'appel à Stripe:", error);
      alert(
        t("dashboard.settings.notifications.stripeOpenError", {
          message: getErrorMessage(error),
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

    if (!hasChanges) return;
    if (isSubmittingSettings) return;
    setSaveSuccessPulse(false);

    await runSettingsSave(async (idempotencyKey) => {
      try {
      // PAYLOAD MANUEL - TOUS LES CHAMPS QUI EXISTENT DANS LA TABLE PROFILES
      // Colonnes existantes : company_name, company_email, company_phone, company_address,
      //                      logo_path, logo_url, primary_color, currency,
      //                      iban, bank_name, payment_terms,
      //                      email_sender_name, email_sender_email, resend_api_key
      // Ne JAMAIS envoyer : created_at, updated_at, id, user_id, undefined, null
      
      const payload: Record<string, string | boolean> = {};

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

      // Swiss QR Bill — créancier structuré
      payload.qr_creditor_name = formData.qrCreditorName?.trim() || "";
      payload.qr_creditor_street = formData.qrCreditorStreet?.trim() || "";
      payload.qr_creditor_building_num = formData.qrCreditorBuildingNum?.trim() || "";
      payload.qr_creditor_zip = formData.qrCreditorZip?.trim() || "";
      payload.qr_creditor_city = formData.qrCreditorCity?.trim() || "";
      payload.qr_creditor_country = formData.qrCreditorCountry?.trim() || "CH";

      // Champs email (clé Resend uniquement si l’utilisateur la saisit ou l’efface explicitement)
      payload.email_custom_enabled = formData.emailCustomEnabled;
      if (formData.emailExpediteur !== undefined) {
        payload.email_sender_email = formData.emailExpediteur.trim();
      }
      if (formData.nomExpediteur !== undefined) {
        payload.email_sender_name = formData.nomExpediteur.trim();
      }
      if (formData.resendApiKeyTouched) {
        const v = formData.resendApiKey.trim();
        payload.resend_api_key = v.length > 0 ? v : "";
      }

      // Protection finale : garder toutes les valeurs (y compris chaînes vides)
      // pour permettre la mise à jour des champs même s'ils sont vides
      const cleanPayload: Record<string, string | boolean> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
          cleanPayload[key] = value;
        }
      }

      const logSafe = { ...cleanPayload };
      if (typeof logSafe.resend_api_key === "string" && logSafe.resend_api_key.length > 0) {
        logSafe.resend_api_key = "[nouvelle clé]";
      }
      console.log("[PARAMETRES] Payload (paramètres email, clé masquée):", logSafe);

      const response = await idempotentFetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        idempotencyKey,
        body: JSON.stringify(cleanPayload),
      });

      console.log("[PARAMETRES] Réponse status:", response.status, response.statusText);

      // Lire le body UNE SEULE FOIS avec le helper
      const result = await parseResponseBody(response);

      if (!response.ok) {
        // Utiliser le body déjà parsé
        const errorData = result as ApiErrorBody;
        
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
        notifyError(errorMessage, "settings-save");
        return; // Ne pas throw pour éviter l'overlay Next.js
      }
      
      // IMPORTANT : Recharger depuis la DB après UPDATE pour garantir la synchronisation
      console.log("[PARAMETRES] UPDATE réussi, rechargement depuis DB...");
      clearDraft();
      await loadSettingsFromDB();

      setSaved(true);
      setSaveSuccessPulse(true);
      notifySuccess(t("dashboard.settings.saveSuccess"), "settings-save");
      setTimeout(() => setSaved(false), 3000);
      setTimeout(() => setSaveSuccessPulse(false), 2000);
      } catch (error: unknown) {
      console.error("Erreur lors de la sauvegarde:", error);
      // Ne pas afficher de toast ici car on l'a déjà fait dans le if (!response.ok)
      }
    });
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
      const data = (await parseResponseBody(response)) as SimpleMessageBody;

      if (!response.ok) {
        throw new Error(data.error || t("dashboard.settings.notifications.uploadError"));
      }

      // Recharger depuis la DB pour synchroniser le state
      console.log("[PARAMETRES] Logo uploadé, rechargement depuis DB...");
      await loadSettingsFromDB();

      toast.success(t("dashboard.settings.notifications.logoUploaded"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || t("dashboard.settings.notifications.uploadLogoError"));
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
      const data = (await parseResponseBody(response)) as SimpleMessageBody;

      if (!response.ok) {
        throw new Error(data.error || t("dashboard.settings.notifications.deleteError"));
      }

      // Recharger depuis la DB pour synchroniser le state
      console.log("[PARAMETRES] Logo supprimé, rechargement depuis DB...");
      await loadSettingsFromDB();

      toast.success(t("dashboard.settings.notifications.logoDeleted"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || t("dashboard.settings.notifications.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  if (loadingSettings || !parametres) {
    return (
      <PageLayout maxWidth="5xl">
        <div className="flex items-center gap-3 text-[#64748B]">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{t("dashboard.settings.loadingPage")}</span>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <SubmittingOverlay
        visible={showSettingsOverlay}
        message="Enregistrement en cours…"
      />
      <Suspense fallback={null}>
        <CheckoutHandler onSuccess={fetchUserPlan} />
      </Suspense>
      <PageLayout maxWidth="5xl">
        <PageHeader title={t("dashboard.settings.title")} subtitle={t("dashboard.settings.subtitle")} />
        <DraftAutosaveHint show={showDraftStatus} label={draftStatusLabel} />

        {saved && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/95 p-4 text-emerald-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <CheckCircle className="h-5 w-5 shrink-0" />
            {t("dashboard.settings.saveSuccess")}
          </div>
        )}

        <UsersAccessCard
          canManageTeamAccess={canManageTeamAccess}
          loading={loadingPlan}
        />
        <SectionCard
          icon={Users}
          title={t("dashboard.settings.layout.sections.members")}
          description={t("dashboard.settings.layout.sectionDescriptions.members")}
          bodyClassName="space-y-3.5 sm:space-y-4"
        >
          <SettingsAccordion
            title={t("dashboard.settings.layout.accordions.memberFields")}
            defaultOpen
          >
            <MemberFieldsSettingsCard embedded />
          </SettingsAccordion>
          <SettingsAccordion title={t("dashboard.settings.layout.accordions.memberCategories")}>
            <p className="text-sm leading-relaxed text-[#64748B] sm:text-[0.9375rem]">
              {t("dashboard.settings.layout.memberCategories.body")}
            </p>
          </SettingsAccordion>
        </SectionCard>

        <form onSubmit={handleSubmit} className="space-y-9 sm:space-y-11 lg:space-y-12">
          <SectionCard
            icon={Building2}
            title={t("dashboard.settings.layout.sections.clubInfo")}
            description={t("dashboard.settings.layout.sectionDescriptions.clubInfo")}
            bodyClassName="space-y-3.5 sm:space-y-4"
          >
            <SettingsAccordion title={t("dashboard.settings.layout.accordions.visualIdentity")}>
              <div className="space-y-6">
                <div>
                  <label className={`mb-2 block ${dashboardLabelClass}`}>
                    {t("dashboard.settings.branding.logoLabel")}
                  </label>
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[#F8FAFC]">
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
                        <div className="flex flex-col items-center justify-center p-4 text-[#94A3B8]">
                          <Building2 className="mb-2 h-12 w-12" />
                          <span className="text-center text-xs">{t("dashboard.settings.branding.noLogo")}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div>
                        <label
                          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#1A23FF] to-[#151dd9] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(26,35,255,0.22)] transition duration-250 hover:opacity-95"
                        >
                          {uploading ? (
                            <>
                              <Loader className="h-4 w-4 animate-spin" />
                              {t("dashboard.settings.branding.uploading")}
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
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
                        <p className={dashboardHintClass}>{t("dashboard.settings.branding.formats")}</p>
                      </div>
                      {logoPreview ? (
                        <button
                          type="button"
                          onClick={handleLogoDelete}
                          disabled={deleting}
                          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-medium text-rose-700 transition-all duration-250 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deleting ? (
                            <>
                              <Loader className="h-4 w-4 animate-spin" />
                              {t("dashboard.settings.branding.deleting")}
                            </>
                          ) : (
                            <>
                              <Trash className="h-4 w-4" />
                              {t("dashboard.settings.branding.delete")}
                            </>
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`mb-2 block ${dashboardLabelClass}`}>
                    {t("dashboard.settings.branding.primaryColorLabel")}
                  </label>
                  <div className="flex flex-wrap items-center gap-4">
                    <input
                      type="color"
                      value={formData.primaryColor ?? "#6D5EF8"}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="h-12 w-20 cursor-pointer rounded-xl border border-[rgba(15,23,42,0.12)] bg-white"
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
                      className={cn(dashboardInputClass, "min-w-[8rem] flex-1 font-mono")}
                    />
                  </div>
                  <p className={dashboardHintClass}>{t("dashboard.settings.branding.primaryColorHelp")}</p>
                </div>

                <div>
                  <label className={`mb-2 block ${dashboardLabelClass}`}>
                    {t("dashboard.settings.branding.currencyLabel")}
                  </label>
                  <select
                    value={formData.currency ?? "CHF"}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className={dashboardSelectLgClass}
                  >
                    <option value="CHF">{t("dashboard.settings.branding.currencies.CHF")}</option>
                    <option value="EUR">{t("dashboard.settings.branding.currencies.EUR")}</option>
                    <option value="USD">{t("dashboard.settings.branding.currencies.USD")}</option>
                    <option value="GBP">{t("dashboard.settings.branding.currencies.GBP")}</option>
                    <option value="CAD">{t("dashboard.settings.branding.currencies.CAD")}</option>
                    <option value="AUD">{t("dashboard.settings.branding.currencies.AUD")}</option>
                    <option value="JPY">{t("dashboard.settings.branding.currencies.JPY")}</option>
                  </select>
                  <p className={dashboardHintClass}>{t("dashboard.settings.branding.currencyHelp")}</p>
                </div>
              </div>
            </SettingsAccordion>

            <SettingsAccordion title={t("dashboard.settings.layout.accordions.contactDetails")}>
              <div className="space-y-4">
                <div>
                  <label className={`mb-2 block ${dashboardLabelClass}`}>
                    {t("dashboard.settings.companyInfo.nameLabel")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomEntreprise ?? ""}
                    onChange={(e) => setFormData({ ...formData, nomEntreprise: e.target.value })}
                    className={dashboardInputClass}
                  />
                </div>

                <div>
                  <label className={`mb-2 block ${dashboardLabelClass}`}>
                    {t("dashboard.settings.companyInfo.addressLabel")}
                  </label>
                  <textarea
                    required
                    value={formData.adresse ?? ""}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    rows={3}
                    className={dashboardInputClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={`mb-2 block ${dashboardLabelClass}`}>
                      {t("dashboard.settings.companyInfo.emailLabel")}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email ?? ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={dashboardInputClass}
                    />
                  </div>

                  <div>
                    <label className={`mb-2 block ${dashboardLabelClass}`}>
                      {t("dashboard.settings.companyInfo.phoneLabel")}
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.telephone ?? ""}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className={dashboardInputClass}
                    />
                  </div>
                </div>
              </div>
            </SettingsAccordion>
          </SectionCard>

          <SectionCard
            icon={Wallet}
            title={t("dashboard.settings.layout.sections.finances")}
            description={t("dashboard.settings.layout.sectionDescriptions.finances")}
            bodyClassName="space-y-3.5 sm:space-y-4"
          >
            <SettingsAccordion title={t("dashboard.settings.layout.accordions.subscription")}>
              {loadingPlan ? (
                <p className="text-sm text-slate-500">{t("dashboard.common.loading")}</p>
              ) : (
                <div className="space-y-4">
                  {subscription ? (
                    <div
                      className={`rounded-xl border-2 p-4 ${
                        subscription.status === "active"
                          ? "border-green-500 bg-green-50"
                          : subscription.status === "trial"
                            ? "border-blue-500 bg-blue-50"
                            : "border-red-500 bg-red-50"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          {subscription.status === "active" ? (
                            <>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-green-800">Abonnement actif</p>
                                <p className="text-sm text-green-700">
                                  {subscription.billingCycle === "yearly" ? "Annuel" : "Mensuel"} – Accès complet
                                </p>
                              </div>
                            </>
                          ) : subscription.status === "trial" ? (
                            <>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-blue-800">
                                  Période d&apos;essai – {subscription.trialDaysRemaining} jour
                                  {subscription.trialDaysRemaining > 1 ? "s" : ""} restant
                                  {subscription.trialDaysRemaining > 1 ? "s" : ""}
                                </p>
                                <p className="text-sm text-blue-700">Profitez de toutes les fonctionnalités</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="font-semibold text-red-800">Essai terminé</p>
                                <p className="text-sm text-red-700">Abonnez-vous pour continuer</p>
                              </div>
                            </>
                          )}
                        </div>
                        {subscription.status !== "active" ? (
                          <Link
                            href="/tableau-de-bord/abonnement"
                            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
                          >
                            {subscription.status === "trial"
                              ? t("dashboard.settings.viewPricing")
                              : t("dashboard.settings.subscribe")}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {subscription && subscription.status !== "active" ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-3 text-sm font-medium text-slate-900">Tarifs</p>
                      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                        <div className="flex-1 rounded-lg border border-slate-200 bg-white p-3">
                          <p className="mb-1 text-xs text-slate-500">Mensuel</p>
                          <p className="text-lg font-bold text-slate-900">
                            {TEAM_PRICING.monthly.amount} CHF<span className="text-sm font-normal text-slate-500">/mois</span>
                          </p>
                        </div>
                        <div className="relative flex-1 rounded-lg border-2 border-indigo-500 bg-white p-3">
                          <span className="absolute -top-2 right-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            {TEAM_PRICING.yearly.savings}
                          </span>
                          <p className="mb-1 text-xs text-slate-500">Annuel</p>
                          <p className="text-lg font-bold text-slate-900">
                            {TEAM_PRICING.yearly.amount} CHF<span className="text-sm font-normal text-slate-500">/an</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </SettingsAccordion>

            <SettingsAccordion title={t("dashboard.settings.layout.accordions.banking")}>
              <p className="mb-4 text-sm text-slate-500">{t("dashboard.settings.billing.subtitle")}</p>
              <div className="space-y-4">
                <div>
                  <label className={`mb-2 block ${dashboardLabelClass}`}>
                    {t("dashboard.settings.billing.ibanLabel")}
                  </label>
                  <input
                    type="text"
                    value={formData.iban ?? ""}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder={t("dashboard.settings.billing.ibanPlaceholder")}
                    className={dashboardInputClass}
                  />
                </div>

                <div>
                  <label className={`mb-2 block ${dashboardLabelClass}`}>
                    {t("dashboard.settings.billing.bankNameLabel")}
                  </label>
                  <input
                    type="text"
                    value={formData.bankName ?? ""}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder={t("dashboard.settings.billing.bankNamePlaceholder")}
                    className={dashboardInputClass}
                  />
                </div>

                <div>
                  <label className={`mb-2 block ${dashboardLabelClass}`}>
                    {t("dashboard.settings.billing.paymentTermsLabel")}
                  </label>
                  <textarea
                    value={formData.conditionsPaiement ?? ""}
                    onChange={(e) => setFormData({ ...formData, conditionsPaiement: e.target.value })}
                    placeholder={t("dashboard.settings.billing.paymentTermsPlaceholder")}
                    rows={3}
                    className={dashboardInputClass}
                  />
                  <p className={dashboardHintClass}>{t("dashboard.settings.billing.paymentTermsHelp")}</p>
                </div>
              </div>
            </SettingsAccordion>

            {/* ── Swiss QR Bill ── */}
            <SettingsAccordion title="QR-facture suisse (Swiss QR Bill)">
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-sm font-medium text-blue-900">QR-facture conforme SIX Group</p>
                <p className="mt-1 text-xs text-blue-700">
                  Ces informations sont utilisées pour générer automatiquement la zone de paiement Swiss QR Bill
                  sur toutes vos factures et cotisations PDF. Elles doivent correspondre exactement à votre compte bancaire suisse.
                </p>
              </div>

              <div className="space-y-4">
                {/* Nom du bénéficiaire */}
                <div>
                  <label className={`mb-2 block ${dashboardLabelClass}`}>
                    Nom du bénéficiaire
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.qrCreditorName ?? ""}
                    onChange={(e) => setFormData({ ...formData, qrCreditorName: e.target.value })}
                    placeholder={formData.nomEntreprise || "Nom de votre association / club"}
                    className={dashboardInputClass}
                    maxLength={70}
                  />
                  <p className={dashboardHintClass}>Laissez vide pour utiliser le nom du club. Max 70 caractères.</p>
                </div>

                {/* Adresse */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className={`mb-2 block ${dashboardLabelClass}`}>
                      Rue
                    </label>
                    <input
                      type="text"
                      value={formData.qrCreditorStreet ?? ""}
                      onChange={(e) => setFormData({ ...formData, qrCreditorStreet: e.target.value })}
                      placeholder="Rue de la Paix"
                      className={dashboardInputClass}
                      maxLength={70}
                    />
                  </div>
                  <div>
                    <label className={`mb-2 block ${dashboardLabelClass}`}>
                      N°
                    </label>
                    <input
                      type="text"
                      value={formData.qrCreditorBuildingNum ?? ""}
                      onChange={(e) => setFormData({ ...formData, qrCreditorBuildingNum: e.target.value })}
                      placeholder="12"
                      className={dashboardInputClass}
                      maxLength={16}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`mb-2 block ${dashboardLabelClass}`}>
                      NPA
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.qrCreditorZip ?? ""}
                      onChange={(e) => setFormData({ ...formData, qrCreditorZip: e.target.value })}
                      placeholder="1000"
                      className={dashboardInputClass}
                      maxLength={16}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={`mb-2 block ${dashboardLabelClass}`}>
                      Ville
                      <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.qrCreditorCity ?? ""}
                      onChange={(e) => setFormData({ ...formData, qrCreditorCity: e.target.value })}
                      placeholder="Lausanne"
                      className={dashboardInputClass}
                      maxLength={35}
                    />
                  </div>
                </div>

                {/* Pays */}
                <div>
                  <label className={`mb-2 block ${dashboardLabelClass}`}>
                    Pays
                  </label>
                  <select
                    value={formData.qrCreditorCountry ?? "CH"}
                    onChange={(e) => setFormData({ ...formData, qrCreditorCountry: e.target.value })}
                    className={dashboardSelectLgClass}
                  >
                    <option value="CH">🇨🇭 Suisse (CH)</option>
                    <option value="LI">🇱🇮 Liechtenstein (LI)</option>
                    <option value="FR">🇫🇷 France (FR)</option>
                    <option value="DE">🇩🇪 Allemagne (DE)</option>
                    <option value="AT">🇦🇹 Autriche (AT)</option>
                    <option value="IT">🇮🇹 Italie (IT)</option>
                  </select>
                </div>

                {/* Indicateur de configuration */}
                {formData.iban && formData.qrCreditorZip && formData.qrCreditorCity ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Configuration QR-facture complète — vos PDF incluront automatiquement la zone de paiement.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.293 5.293a1 1 0 011.414 0l7 7a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 010-1.414l7-7z" />
                    </svg>
                    <span>
                      Pour activer la QR-facture :{" "}
                      {!formData.iban && <strong>IBAN manquant</strong>}
                      {formData.iban && !formData.qrCreditorZip && <strong>NPA manquant</strong>}
                      {formData.iban && formData.qrCreditorZip && !formData.qrCreditorCity && <strong>Ville manquante</strong>}
                    </span>
                  </div>
                )}
              </div>
            </SettingsAccordion>
          </SectionCard>

          <SectionCard
            icon={Shield}
            title={t("dashboard.settings.layout.sections.security")}
            description={t("dashboard.settings.layout.sectionDescriptions.security")}
            bodyClassName="space-y-3.5 sm:space-y-4"
          >
            <SettingsAccordion title={t("dashboard.settings.layout.accordions.email")}>
              <p className="mb-4 text-sm text-slate-600">{t("dashboard.settings.email.introDefault")}</p>

              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{t("dashboard.settings.email.customToggle")}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{t("dashboard.settings.email.customToggleHelp")}</p>
                </div>
                <label className="inline-flex shrink-0 cursor-pointer items-center self-start sm:self-center">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.emailCustomEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emailCustomEnabled: e.target.checked,
                        resendApiKeyTouched: false,
                      })
                    }
                  />
                  <span
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      formData.emailCustomEnabled ? "bg-[#2563EB]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        formData.emailCustomEnabled ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </span>
                </label>
              </div>

              {!formData.emailCustomEnabled ? (
                <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-slate-600">
                  {t("dashboard.settings.email.obillzInfo")}
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {t("dashboard.settings.email.resendDomainHelp")}
                  </p>
                  <div>
                    <label className={`mb-2 block ${dashboardLabelClass}`}>
                      {t("dashboard.settings.email.customSenderLabel")}
                    </label>
                    <input
                      type="email"
                      value={formData.emailExpediteur ?? ""}
                      onChange={(e) => setFormData({ ...formData, emailExpediteur: e.target.value })}
                      placeholder={t("dashboard.settings.email.senderEmailPlaceholder")}
                      className={dashboardInputClass}
                    />
                  </div>
                  <div>
                    <label className={`mb-2 block ${dashboardLabelClass}`}>
                      {t("dashboard.settings.email.apiKeyLabel")}
                    </label>
                    <input
                      type="password"
                      value={formData.resendApiKey ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          resendApiKey: e.target.value,
                          resendApiKeyTouched: true,
                        })
                      }
                      placeholder={
                        formData.resendKeyConfigured
                          ? t("dashboard.settings.email.apiKeyUnchangedHint")
                          : t("dashboard.settings.email.apiKeyPlaceholder")
                      }
                      autoComplete="off"
                      className={dashboardInputClass}
                    />
                    <p className={dashboardHintClass}>
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
              )}
            </SettingsAccordion>
          </SectionCard>

          <SectionCard
            icon={Settings}
            title={t("dashboard.settings.layout.sections.advanced")}
            description={t("dashboard.settings.layout.sectionDescriptions.advanced")}
            bodyClassName="space-y-3.5 sm:space-y-4"
          >
            <SettingsAccordion title={t("dashboard.settings.layout.accordions.pdfHeader")}>
              <div>
                <label className={`mb-2 block ${dashboardLabelClass}`}>
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
                  className={dashboardSelectLgClass}
                >
                  <option value="simple">{t("dashboard.settings.branding.headerStyles.simple")}</option>
                  <option value="moderne">{t("dashboard.settings.branding.headerStyles.moderne")}</option>
                  <option value="classique">{t("dashboard.settings.branding.headerStyles.classique")}</option>
                </select>
                <p className={dashboardHintClass}>{t("dashboard.settings.branding.headerStyleHelp")}</p>
              </div>
            </SettingsAccordion>
          </SectionCard>

          <div
            className={cn(
              dashboardGlassCardClass,
              "flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6"
            )}
          >
            <p className="text-sm leading-relaxed text-[#64748B]">{t("dashboard.settings.layout.saveBarHint")}</p>
            <DashboardPrimaryButton
              type="submit"
              icon="none"
              disabled={!hasChanges}
              loading={isSubmittingSettings}
              loadingLabel={t("dashboard.common.saving")}
              success={saveSuccessPulse}
              successLabel="Modifications enregistrées ✓"
              className="w-full justify-center sm:w-auto"
            >
              {!hasChanges ? "Aucune modification à enregistrer" : t("dashboard.settings.saveButton")}
            </DashboardPrimaryButton>
          </div>
      </form>
    </PageLayout>
    </>
  );
}





