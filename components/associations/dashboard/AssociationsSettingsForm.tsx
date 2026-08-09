"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  ImageIcon,
  Loader2,
  MapPin,
  Palette,
  Phone,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";
import { formatIbanDisplay } from "@/lib/associations/settings-validation";
import DraftAutosaveHint from "@/components/DraftAutosaveHint";
import { useAutoDraft } from "@/hooks/useAutoDraft";
import {
  associationSettingsDraftStore,
  type AssociationSettingsDraftData,
} from "@/lib/drafts/associationSettingsDraft";
import styles from "./associations-dashboard.module.css";

type SettingsFormState = {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_address_line2: string;
  company_postal_code: string;
  company_city: string;
  company_region: string;
  company_country: string;
  website: string;
  description: string;
  iban: string;
  bank_name: string;
  logo_url: string | null;
};

const SECTIONS = [
  { id: "generales", label: "Informations générales" },
  { id: "identite", label: "Identité visuelle" },
  { id: "coordonnees", label: "Coordonnées" },
  { id: "adresse", label: "Adresse" },
  { id: "paiement", label: "Informations de paiement" },
  { id: "sensible", label: "Zone sensible" },
] as const;

type AssociationsSettingsFormProps = {
  clubId: string;
  initialSettings: SettingsFormState;
  roleLabel: string;
  canEdit: boolean;
};

export default function AssociationsSettingsForm({
  clubId,
  initialSettings,
  roleLabel,
  canEdit,
}: AssociationsSettingsFormProps) {
  const router = useRouter();
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<SettingsFormState>(initialSettings);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [logoNeedsReselect, setLogoNeedsReselect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const draftData = useMemo<AssociationSettingsDraftData>(
    () => ({
      company_name: form.company_name,
      company_email: form.company_email,
      company_phone: form.company_phone,
      company_address: form.company_address,
      company_address_line2: form.company_address_line2,
      company_postal_code: form.company_postal_code,
      company_city: form.company_city,
      company_region: form.company_region,
      company_country: form.company_country,
      website: form.website,
      description: form.description,
      iban: form.iban,
      bank_name: form.bank_name,
      logo_url: form.logo_url,
      logoPendingReselect: Boolean(pendingFile) || logoNeedsReselect,
    }),
    [form, pendingFile, logoNeedsReselect]
  );

  const applyDraftData = useCallback((data: AssociationSettingsDraftData) => {
    setForm({
      company_name: data.company_name,
      company_email: data.company_email,
      company_phone: data.company_phone,
      company_address: data.company_address,
      company_address_line2: data.company_address_line2,
      company_postal_code: data.company_postal_code,
      company_city: data.company_city,
      company_region: data.company_region,
      company_country: data.company_country,
      website: data.website,
      description: data.description,
      iban: data.iban,
      bank_name: data.bank_name,
      logo_url: data.logo_url,
    });
    setPendingFile(null);
    setLogoNeedsReselect(Boolean(data.logoPendingReselect));
  }, []);

  const { clearDraft, showDraftStatus, draftStatusLabel, draftRestored } =
    useAutoDraft({
      store: associationSettingsDraftStore,
      clubId,
      data: draftData,
      enabled: canEdit,
      onRestore: applyDraftData,
    });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const update =
    (key: keyof SettingsFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      setSuccess(null);
      setError(null);
      setFieldError(null);
    };

  const displayLogo = previewUrl || form.logo_url;

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFieldError("Formats acceptés : PNG, JPEG ou WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldError("Le logo ne doit pas dépasser 5 Mo.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPendingFile(file);
    setLogoNeedsReselect(false);
    setFieldError(null);
    setSuccess(null);
    setError(null);
  };

  const uploadPendingLogo = async (): Promise<string | null> => {
    if (!pendingFile) return form.logo_url;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      const res = await fetch("/api/associations/logo", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        logoUrl?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Échec de l’envoi du logo");
      }
      const nextUrl = data.logoUrl ?? null;
      setForm((prev) => ({ ...prev, logo_url: nextUrl }));
      setPendingFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return nextUrl;
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!canEdit || removingLogo) return;
    setRemovingLogo(true);
    setError(null);
    setSuccess(null);
    try {
      if (pendingFile || previewUrl) {
        setPendingFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setRemovingLogo(false);
        return;
      }
      if (!form.logo_url) {
        setRemovingLogo(false);
        return;
      }
      const res = await fetch("/api/associations/logo", { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Impossible de supprimer le logo");
      }
      setForm((prev) => ({ ...prev, logo_url: null }));
      setSuccess("Logo supprimé.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de suppression");
    } finally {
      setRemovingLogo(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    setFieldError(null);

    try {
      if (pendingFile) {
        await uploadPendingLogo();
      }

      const res = await fetch("/api/associations/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name,
          company_email: form.company_email,
          company_phone: form.company_phone,
          company_address: form.company_address,
          company_address_line2: form.company_address_line2,
          company_postal_code: form.company_postal_code,
          company_city: form.company_city,
          company_region: form.company_region,
          company_country: form.company_country,
          website: form.website,
          description: form.description,
          iban: form.iban,
          bank_name: form.bank_name,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        settings?: Partial<SettingsFormState>;
      };

      if (!res.ok) {
        throw new Error(data.error || "Enregistrement impossible");
      }

      if (data.settings) {
        setForm((prev) => ({
          ...prev,
          company_name: data.settings?.company_name ?? prev.company_name,
          company_email: data.settings?.company_email ?? prev.company_email,
          company_phone: data.settings?.company_phone ?? prev.company_phone,
          company_address: data.settings?.company_address ?? prev.company_address,
          company_address_line2:
            data.settings?.company_address_line2 ?? prev.company_address_line2,
          company_postal_code:
            data.settings?.company_postal_code ?? prev.company_postal_code,
          company_city: data.settings?.company_city ?? prev.company_city,
          company_region: data.settings?.company_region ?? prev.company_region,
          company_country: data.settings?.company_country ?? prev.company_country,
          website: data.settings?.website ?? prev.website,
          description: data.settings?.description ?? prev.description,
          iban: data.settings?.iban ?? prev.iban,
          bank_name: data.settings?.bank_name ?? prev.bank_name,
        }));
      }

      clearDraft();
      setLogoNeedsReselect(false);
      setSuccess("Modifications enregistrées.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || uploading || removingLogo;

  return (
    <div className={styles.settingsPage}>
      <header className={styles.settingsHeader}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-[-0.04em] text-[#17211d] sm:text-3xl">
              Paramètres de l’association
            </h2>
            <span className={styles.roleBadge}>{roleLabel}</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm font-medium text-[#66736d] sm:text-base">
            Gérez les informations générales et l’identité de votre association.
          </p>
          <DraftAutosaveHint
            show={showDraftStatus}
            label={draftStatusLabel}
            className="mt-3 mb-0 flex items-center gap-2 text-xs font-medium tracking-wide text-[#66736d]"
          />
          {draftRestored && logoNeedsReselect ? (
            <p className="mt-2 text-xs font-medium text-[#66736d]">
              Le fichier logo n’est pas conservé localement — resélectionnez-le si
              besoin.
            </p>
          ) : null}
        </div>
      </header>

      <nav className={styles.settingsToc} aria-label="Sections des paramètres">
        {SECTIONS.map((section) => (
          <a key={section.id} href={`#${section.id}`} className={styles.settingsTocLink}>
            {section.label}
          </a>
        ))}
      </nav>

      {!canEdit ? (
        <div className={styles.settingsAlert} role="status">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          <p>
            Vous pouvez consulter ces informations, mais seuls les administrateurs
            peuvent les modifier.
          </p>
        </div>
      ) : null}

      <form id={formId} onSubmit={onSubmit} className="space-y-6" noValidate>
        <section id="generales" className={`${styles.card} ${styles.settingsSection}`}>
          <div className={styles.settingsSectionHead}>
            <span className={styles.settingsSectionIcon}>
              <Building2 className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3>Informations générales</h3>
              <p>Nom et présentation de votre association.</p>
            </div>
          </div>

          <div className={styles.settingsGrid}>
            <div className={styles.field}>
              <label htmlFor={`${formId}-name`}>Nom de l’association *</label>
              <input
                id={`${formId}-name`}
                name="company_name"
                value={form.company_name}
                onChange={update("company_name")}
                required
                maxLength={120}
                disabled={!canEdit || busy}
                autoComplete="organization"
              />
              <p className={styles.fieldHint}>Affiché dans la barre latérale et l’accueil.</p>
            </div>

            <div className={`${styles.field} sm:col-span-2`}>
              <label htmlFor={`${formId}-description`}>Description</label>
              <textarea
                id={`${formId}-description`}
                name="description"
                value={form.description}
                onChange={update("description")}
                rows={4}
                maxLength={2000}
                disabled={!canEdit || busy}
              />
              <p className={styles.fieldHint}>
                Courte présentation de votre association (optionnel).
              </p>
            </div>
          </div>
        </section>

        <section id="identite" className={`${styles.card} ${styles.settingsSection}`}>
          <div className={styles.settingsSectionHead}>
            <span className={styles.settingsSectionIcon}>
              <Palette className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3>Identité visuelle</h3>
              <p>Logo utilisé dans l’espace Associations.</p>
            </div>
          </div>

          <div className={styles.logoRow}>
            <div className={styles.logoPreview} aria-live="polite">
              {displayLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayLogo} alt={`Logo de ${form.company_name || "l’association"}`} />
              ) : (
                <span className={styles.logoPlaceholder}>
                  <ImageIcon className="h-7 w-7" aria-hidden />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm font-medium text-[#66736d]">
                PNG, JPEG ou WEBP · 5 Mo maximum. Prévisualisation avant enregistrement.
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={!canEdit || busy}
                  onChange={onPickFile}
                />
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={!canEdit || busy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" aria-hidden />
                  Choisir une image
                </button>
                {(displayLogo || pendingFile) && canEdit ? (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={busy}
                    onClick={() => void removeLogo()}
                  >
                    {removingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden />
                    )}
                    Supprimer le logo
                  </button>
                ) : null}
              </div>
              {fieldError ? (
                <p className={styles.fieldError} role="alert">
                  {fieldError}
                </p>
              ) : null}
              {pendingFile ? (
                <p className="text-xs font-semibold text-[#4f6b58]">
                  Nouveau logo prêt — cliquez sur « Enregistrer les modifications ».
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section id="coordonnees" className={`${styles.card} ${styles.settingsSection}`}>
          <div className={styles.settingsSectionHead}>
            <span className={styles.settingsSectionIcon}>
              <Phone className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3>Coordonnées</h3>
              <p>Contacts publics de l’association (pas votre compte personnel).</p>
            </div>
          </div>

          <div className={styles.settingsGrid}>
            <div className={styles.field}>
              <label htmlFor={`${formId}-email`}>Email de contact</label>
              <input
                id={`${formId}-email`}
                name="company_email"
                type="email"
                value={form.company_email}
                onChange={update("company_email")}
                maxLength={160}
                disabled={!canEdit || busy}
                autoComplete="email"
              />
              <p className={styles.fieldHint}>
                Ne modifie pas l’email de connexion de votre compte.
              </p>
            </div>
            <div className={styles.field}>
              <label htmlFor={`${formId}-phone`}>Téléphone</label>
              <input
                id={`${formId}-phone`}
                name="company_phone"
                type="tel"
                value={form.company_phone}
                onChange={update("company_phone")}
                maxLength={40}
                disabled={!canEdit || busy}
                autoComplete="tel"
                placeholder="+41 22 000 00 00"
              />
            </div>
            <div className={`${styles.field} sm:col-span-2`}>
              <label htmlFor={`${formId}-website`}>Site internet</label>
              <input
                id={`${formId}-website`}
                name="website"
                type="text"
                value={form.website}
                onChange={update("website")}
                maxLength={300}
                disabled={!canEdit || busy}
                placeholder="www.mon-association.ch"
                autoComplete="url"
              />
              <p className={styles.fieldHint}>
                Un domaine sans https:// est accepté et normalisé automatiquement.
              </p>
            </div>
          </div>
        </section>

        <section id="adresse" className={`${styles.card} ${styles.settingsSection}`}>
          <div className={styles.settingsSectionHead}>
            <span className={styles.settingsSectionIcon}>
              <MapPin className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3>Adresse</h3>
              <p>
                Ces informations pourront être utilisées sur vos documents et
                communications.
              </p>
            </div>
          </div>

          <div className={styles.settingsGrid}>
            <div className={`${styles.field} ${styles.fieldSpanFull}`}>
              <label htmlFor={`${formId}-address`}>Rue et numéro</label>
              <input
                id={`${formId}-address`}
                name="company_address"
                value={form.company_address}
                onChange={update("company_address")}
                maxLength={500}
              />
            </div>

            <div className={`${styles.field} ${styles.fieldSpanFull}`}>
              <label htmlFor={`${formId}-address2`}>Complément d’adresse</label>
              <input
                id={`${formId}-address2`}
                name="company_address_line2"
                value={form.company_address_line2}
                onChange={update("company_address_line2")}
                maxLength={200}
                disabled={!canEdit || busy}
                placeholder="Bâtiment, étage, case postale…"
                autoComplete="address-line2"
              />
            </div>

            <div className={`${styles.addressNpaCity} ${styles.fieldSpanFull}`}>
              <div className={styles.field}>
                <label htmlFor={`${formId}-postal`}>NPA / Code postal</label>
                <input
                  id={`${formId}-postal`}
                  name="company_postal_code"
                  value={form.company_postal_code}
                  onChange={update("company_postal_code")}
                  maxLength={20}
                  disabled={!canEdit || busy}
                  placeholder="2800"
                  autoComplete="postal-code"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor={`${formId}-city`}>Localité</label>
                <input
                  id={`${formId}-city`}
                  name="company_city"
                  value={form.company_city}
                  onChange={update("company_city")}
                  maxLength={120}
                  disabled={!canEdit || busy}
                  placeholder="Delémont"
                  autoComplete="address-level2"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor={`${formId}-region`}>Canton / Région</label>
              <input
                id={`${formId}-region`}
                name="company_region"
                value={form.company_region}
                onChange={update("company_region")}
                maxLength={120}
                disabled={!canEdit || busy}
                placeholder="Jura"
                autoComplete="address-level1"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor={`${formId}-country`}>Pays</label>
              <input
                id={`${formId}-country`}
                name="company_country"
                value={form.company_country}
                onChange={update("company_country")}
                maxLength={120}
                disabled={!canEdit || busy}
                placeholder="Suisse"
                autoComplete="country-name"
              />
            </div>
          </div>
        </section>

        <section id="paiement" className={`${styles.card} ${styles.settingsSection}`}>
          <div className={styles.settingsSectionHead}>
            <span className={styles.settingsSectionIcon}>
              <CreditCard className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3>Informations de paiement</h3>
              <p>
                Cet IBAN pourra servir plus tard pour les cotisations et documents de
                paiement. Aucun prélèvement n’est activé pour l’instant.
              </p>
            </div>
          </div>

          <div className={styles.settingsGrid}>
            <div className={styles.field}>
              <label htmlFor={`${formId}-iban`}>IBAN</label>
              <input
                id={`${formId}-iban`}
                name="iban"
                value={formatIbanDisplay(form.iban) || form.iban}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    iban: e.target.value.replace(/\s+/g, "").toUpperCase(),
                  }));
                  setSuccess(null);
                  setError(null);
                }}
                maxLength={42}
                disabled={!canEdit || busy}
                autoComplete="off"
                spellCheck={false}
                placeholder="CH93 0076 2011 6238 5295 7"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor={`${formId}-bank`}>Nom de la banque</label>
              <input
                id={`${formId}-bank`}
                name="bank_name"
                value={form.bank_name}
                onChange={update("bank_name")}
                maxLength={120}
                disabled={!canEdit || busy}
              />
            </div>
          </div>
        </section>

        <section id="sensible" className={`${styles.card} ${styles.settingsSection}`}>
          <div className={styles.settingsSectionHead}>
            <span className={`${styles.settingsSectionIcon} ${styles.settingsSectionIconWarn}`}>
              <ShieldAlert className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3>Zone sensible</h3>
              <p>
                Les actions sensibles liées à la suppression ou au transfert de
                l’association seront disponibles ultérieurement.
              </p>
            </div>
          </div>
        </section>

        <div className={styles.settingsActions} aria-live="polite">
          {error ? (
            <p className={styles.settingsError} role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}
          {success ? (
            <p className={styles.settingsSuccess} role="status">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              {success}
            </p>
          ) : null}
          {canEdit ? (
            <button
              type="submit"
              className={`${styles.primaryButton} w-full sm:w-auto`}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
