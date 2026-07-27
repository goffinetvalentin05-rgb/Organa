"use client";

import { useState } from "react";
import { Lock, Shield, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import {
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthFormHeader,
  AuthInput,
  AuthPageMotion,
  AuthBrandPanel,
  AuthSplitFrame,
  AuthSubmitButton,
  AuthTrustList,
} from "@/components/auth/AuthForm";
import { useI18n } from "@/components/I18nProvider";

export default function ConnexionPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;

    setErrorMessage(null);

    if (!email || !email.includes("@")) {
      toast.error(t("auth.login.invalidEmail"));
      return;
    }

    if (!password || password.length < 8) {
      toast.error(t("auth.login.passwordMin"));
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const message = error.message?.toLowerCase().includes("invalid login credentials")
          ? t("auth.login.invalidCredentials")
          : error.message || t("auth.login.error");

        setErrorMessage(message);
        toast.error(message);
        return;
      }

      if (data.user) {
        await supabase.auth.getSession();
        toast.success(t("auth.login.success"));
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.location.href = "/tableau-de-bord";
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("auth.login.error");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <AuthPageMotion>
        <AuthSplitFrame
          brand={
            <AuthBrandPanel
              badge={t("auth.login.badge")}
              title={t("auth.login.title")}
              subtitle={t("auth.login.subtitle")}
            >
              <AuthTrustList
                items={[
                  {
                    label: t("auth.login.secureNote"),
                    icon: <Shield className="h-4 w-4" aria-hidden />,
                  },
                  {
                    label: t("auth.login.trustSsl"),
                    icon: <Lock className="h-4 w-4" aria-hidden />,
                  },
                  {
                    label: t("auth.login.trustAccess"),
                    icon: <ShieldCheck className="h-4 w-4" aria-hidden />,
                  },
                ]}
              />
            </AuthBrandPanel>
          }
        >
          <AuthFormHeader
            title={t("auth.login.cardTitle")}
            subtitle={t("auth.login.cardSubtitle")}
          />

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage ? <AuthError message={errorMessage} /> : null}

            <AuthField id="email" label={t("auth.login.email")}>
              <AuthInput
                id="email"
                type="email"
                placeholder={t("auth.login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </AuthField>

            <AuthField id="password" label={t("auth.login.password")}>
              <AuthInput
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </AuthField>

            <AuthSubmitButton loading={loading} loadingLabel={t("auth.login.loading")}>
              {t("auth.login.submit")}
            </AuthSubmitButton>
          </form>

          <AuthFooterLink
            prompt={t("auth.login.noAccount")}
            linkHref="/inscription"
            linkLabel={t("auth.login.signUpFree")}
          />
        </AuthSplitFrame>
      </AuthPageMotion>
    </AuthPageLayout>
  );
}
