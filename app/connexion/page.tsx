"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import {
  AuthCard,
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthInput,
  AuthPageMotion,
  AuthSubmitButton,
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
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">
            {t("auth.login.badge")}
          </p>
          <h1 className="mt-3 text-balance text-2xl font-black text-white md:text-3xl">
            {t("auth.login.title")}
          </h1>
          <p className="mt-3 text-sm text-blue-100/75 md:text-base">{t("auth.login.subtitle")}</p>
        </div>

        <div className="mt-8">
          <AuthCard>
            <div className="text-center">
              <h2 className="text-lg font-bold text-white">{t("auth.login.cardTitle")}</h2>
              <p className="mt-1 text-sm text-blue-100/65">{t("auth.login.cardSubtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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
          </AuthCard>

          <div className="mt-5 flex items-center justify-center gap-2 text-blue-100/55">
            <Shield className="h-4 w-4 shrink-0 text-blue-300/70" aria-hidden />
            <span className="text-xs">{t("auth.login.secureNote")}</span>
          </div>

          <p className="mt-4 text-center sm:hidden">
            <Link href="/" className="text-xs text-blue-100/50 hover:text-white">
              {t("auth.login.backHome")}
            </Link>
          </p>
        </div>
      </AuthPageMotion>
    </AuthPageLayout>
  );
}
