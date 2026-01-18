import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>© 2026 Organa. Développé en Suisse.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/connexion" className="text-slate-500 hover:text-slate-700">
            Connexion
          </Link>
          <span>·</span>
          <Link href="/inscription" className="text-slate-500 hover:text-slate-700">
            Inscription
          </Link>
          <span>·</span>
          <Link href="/mentions-legales" className="text-slate-500 hover:text-slate-700">
            Mentions légales
          </Link>
          <span>·</span>
          <Link href="/politique-confidentialite" className="text-slate-500 hover:text-slate-700">
            Politique de confidentialité
          </Link>
          <span>·</span>
          <Link href="/conditions-utilisation" className="text-slate-500 hover:text-slate-700">
            Conditions d’utilisation
          </Link>
          <span>·</span>
          <Link href="/politique-cookies" className="text-slate-500 hover:text-slate-700">
            Politique de cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}

