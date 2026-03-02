import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function UnsubscribePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createAdminClient();

  let success = false;
  let message = "Lien de désinscription invalide.";

  if (token) {
    const { data: recipient } = await supabase
      .from("marketing_campaign_recipients")
      .select("id, club_id, email, contact_id")
      .eq("unsubscribe_token", token)
      .maybeSingle();

    if (recipient) {
      if (recipient.contact_id) {
        await supabase
          .from("marketing_contacts")
          .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
          .eq("id", recipient.contact_id)
          .eq("club_id", recipient.club_id);
      } else {
        await supabase
          .from("marketing_contacts")
          .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
          .eq("club_id", recipient.club_id)
          .eq("email", recipient.email.toLowerCase());
      }

      success = true;
      message = "Vous êtes désinscrit des communications du club";
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">
          {success ? "Désinscription confirmée" : "Désinscription"}
        </h1>
        <p className="text-slate-600 mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: "var(--obillz-hero-blue)" }}
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}

