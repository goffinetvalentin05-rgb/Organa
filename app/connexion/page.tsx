"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import AuthPageLayout from "@/components/auth/AuthPageLayout";
import {
  AuthCard,
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthFormHeader,
  AuthInput,
  AuthPageMotion,
  AuthSubmitButton,
} from "@/components/auth/AuthForm";
import { useI18n } from "@/components/I18nProvider";

async function resolveSportHome(): Promise<
  | { ok: true; home: string }
  | { ok: false; message: string }
> {
  const res = await fetch("/api/auth/post-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intendedProduct: "sport" }),
  });
  const data = (await res.json().catch(() => null)) as {
    home?: string;
    error?: string;
  } | null;

  if (!res.ok) {
    return {
      ok: false,
      message:
        data?.error || "Aucun espace Obillz Sport n’est associé à ce compte.",
    };
  }

  if (typeof data?.home === "string" && data.home.startsWith("/tableau-de-bord")) {
    return { ok: true, home: data.home };
  }

  return {
    ok: false,
    message: "Aucun espace Obillz Sport n’est associé à ce compte.",
  };
}

export default function ConnexionPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wrongProduct, setWrongProduct] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;

    setErrorMessage(null);
    setWrongProduct(false);

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
        const dest = await resolveSportHome();

        if (!dest.ok) {
          setWrongProduct(true);
          setErrorMessage(dest.message);
          toast.error(dest.message);
          await supabase.auth.signOut();
          return;
        }

        toast.success(t("auth.login.success"));
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.location.href = dest.home;
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
        <div className="mx-auto w-full max-w-[560px]">
          <AuthCard>
            <AuthFormHeader
              badge={
                <div className="relative inline-flex">
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.28),transparent_68%)] blur-xl"
                    aria-hidden
                  />
                  <Image
                    src="/logo-symbole.png"
                    alt="Symbole Obillz"
                    width={64}
                    height={64}
                    className="relative h-14 w-14 object-contain"
                    priority
                  />
                </div>
              }
              title={t("auth.login.title")}
              subtitle={t("auth.login.cardSubtitle")}
            />

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage ? <AuthError message={errorMessage} /> : null}

              {wrongProduct ? (
                <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-blue-100/80">
                  <p>
                    Ce compte semble lié à Obillz Associations.{" "}
                    <Link
                      href="/associations/connexion"
                      className="font-semibold text-white underline-offset-2 hover:underline"
                    >
                      Connexion Associations
                    </Link>
                  </p>
                </div>
              ) : null}

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
        </div>
      </AuthPageMotion>
    </AuthPageLayout>
  );
}
