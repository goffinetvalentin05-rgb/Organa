import Link from "next/link";
import { requireProductAccess } from "@/lib/auth/require-product-access";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AssociationsEspaceLogoutButton from "./AssociationsEspaceLogoutButton";

/**
 * Espace Associations temporaire (protégé).
 * Le vrai dashboard sera ajouté dans une étape ultérieure.
 */
export default async function AssociationsEspacePage() {
  const access = await requireProductAccess("association");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name, product_type")
    .eq("user_id", access.clubId)
    .maybeSingle();

  if (profile?.product_type && profile.product_type !== "association") {
    redirect("/tableau-de-bord");
  }

  const orgName =
    typeof profile?.company_name === "string" && profile.company_name.trim()
      ? profile.company_name.trim()
      : "Votre association";

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#071634] via-[#102d78] to-[#175dd4] text-white">
      <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-4 py-10 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/70">
              Obillz Associations
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Espace association
            </h1>
          </div>
          <AssociationsEspaceLogoutButton />
        </header>

        <section className="mt-12 flex-1">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-8 shadow-xl backdrop-blur-sm">
            <p className="text-sm text-blue-100/70">Organisation active</p>
            <p className="mt-2 text-xl font-semibold">{orgName}</p>
            <p className="mt-6 text-sm leading-relaxed text-blue-50/85">
              Votre compte Associations est bien isolé d’Obillz Sport. Le tableau de
              bord complet arrive bientôt — cet espace confirme que l’accès produit
              est correctement séparé.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-blue-100/75">
              <li>• Produit : association</li>
              <li>• Rôle : {access.role}</li>
              <li>• Authentification et MFA : actifs</li>
            </ul>
          </div>
        </section>

        <footer className="mt-10 text-center text-xs text-blue-100/50">
          <Link href="/associations" className="underline-offset-2 hover:text-white hover:underline">
            Retour à la landing Associations
          </Link>
        </footer>
      </div>
    </main>
  );
}
