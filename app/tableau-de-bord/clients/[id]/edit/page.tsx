import Link from "next/link";
import { AlertTriangle } from "@/lib/icons";
import I18nText from "@/components/I18nText";

interface EditClientPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-12 text-center space-y-4">
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-50 p-6 mb-6">
          <p className="text-yellow-700 text-lg font-medium mb-2 flex items-center gap-2 justify-center">
            <AlertTriangle className="w-5 h-5" />
            <I18nText id="dashboard.clients.editDisabledTitle" />
          </p>
          <p className="text-secondary text-sm">
            <I18nText id="dashboard.clients.editDisabledDetail" />
          </p>
        </div>
        <p className="text-primary mb-6">
          <I18nText id="dashboard.clients.editDisabledInstruction" />
        </p>
        <Link
          href="/tableau-de-bord/clients"
          className="inline-block px-6 py-3 accent-bg text-white font-medium rounded-lg transition-all"
        >
          <I18nText id="dashboard.clients.backToList" />
        </Link>
      </div>
    </div>
  );
}



