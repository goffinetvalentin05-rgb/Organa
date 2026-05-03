"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { localeToIntl } from "@/lib/i18n";
import { calculerTotalTTC } from "@/lib/utils/calculations";
import { CreditCard, FileText, Receipt, CheckCircle } from "@/lib/icons";
import { PageLayout, PageHeader, TableCard, EmptyState, DataCard, dashboardListRowClass, cn } from "@/components/ui";

interface DocumentClient {
  nom?: string;
}

interface DocumentItem {
  id: string;
  numero: string;
  type: "quote" | "invoice";
  statut: string;
  dateCreation: string;
  datePaiement?: string | null;
  lignes: any[];
  totalTTC?: number;
  client?: DocumentClient;
}

interface PaymentItem {
  id: string;
  date: string;
  member: string;
  type: "membership" | "invoice";
  documentNumber: string;
  amount: number;
  documentId: string;
  documentType: string;
}

export default function PaiementsPage() {
  const { t, locale } = useI18n();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const res = await fetch("/api/documents", { cache: "no-store" });
        if (!res.ok) {
          console.error("Erreur lors du chargement des documents");
          return;
        }

        const data = await res.json();
        const documents: DocumentItem[] = data.documents || [];

        // Filtrer les documents payés
        const paidDocuments = documents.filter(
          (doc) => doc.statut === "paye" || doc.statut === "accepte"
        );

        // Transformer en liste de paiements
        const paymentsList: PaymentItem[] = paidDocuments.map((doc) => ({
          id: doc.id,
          date: doc.datePaiement || doc.dateCreation,
          member: doc.client?.nom || t("dashboard.common.unknownClient"),
          type: doc.type === "quote" ? "membership" : "invoice",
          documentNumber: doc.numero,
          amount: doc.totalTTC ?? calculerTotalTTC(doc.lignes || []),
          documentId: doc.id,
          documentType: doc.type === "quote" ? "devis" : "factures",
        }));

        // Trier par date décroissante
        paymentsList.sort((a, b) => b.date.localeCompare(a.date));

        setPayments(paymentsList);
      } catch (error) {
        console.error("[Paiements] Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadPayments();
  }, [t]);

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat(localeToIntl[locale], {
      style: "currency",
      currency: "CHF",
    }).format(montant);
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(localeToIntl[locale]);
  };

  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const membershipPayments = payments.filter((p) => p.type === "membership");
  const invoicePayments = payments.filter((p) => p.type === "invoice");

  return (
    <PageLayout maxWidth="7xl" className="space-y-6">
      <PageHeader title={t("dashboard.payments.title")} subtitle={t("dashboard.payments.subtitle")} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DataCard padding="lg" className="border-emerald-100/80">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/90">
              <CreditCard className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">{t("dashboard.payments.stats.totalReceived")}</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">
            {loading ? "-" : formatMontant(totalPayments)}
          </div>
        </DataCard>

        <DataCard padding="lg" className="border-blue-100/80">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100/90">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">{t("dashboard.payments.stats.membershipsCount")}</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">
            {loading ? "-" : membershipPayments.length}
          </div>
        </DataCard>

        <DataCard padding="lg" className="border-purple-100/80">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100/90">
              <Receipt className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-slate-500">{t("dashboard.payments.stats.invoicesCount")}</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900">
            {loading ? "-" : invoicePayments.length}
          </div>
        </DataCard>
      </div>

      <TableCard bodyClassName="p-0">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            {t("dashboard.common.loading")}
          </div>
        ) : payments.length === 0 ? (
          <div className="p-6">
            <EmptyState embedded icon={CreditCard} title={t("dashboard.payments.emptyState")} />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <a
                key={payment.id}
                href={`/tableau-de-bord/${payment.documentType}/${payment.documentId}`}
                className={cn(dashboardListRowClass, "flex items-center justify-between gap-4")}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    payment.type === "membership" 
                      ? "bg-blue-100" 
                      : "bg-purple-100"
                  }`}>
                    {payment.type === "membership" ? (
                      <FileText className={`w-5 h-5 ${
                        payment.type === "membership" 
                          ? "text-blue-600" 
                          : "text-purple-600"
                      }`} />
                    ) : (
                      <Receipt className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{payment.member}</p>
                    <p className="text-sm text-slate-500">
                      {payment.type === "membership" 
                        ? t("dashboard.payments.types.membership") 
                        : t("dashboard.payments.types.invoice")
                      } • {payment.documentNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatMontant(payment.amount)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(payment.date)}
                    </p>
                  </div>
                  <span className="badge-obillz badge-success flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {t("dashboard.payments.status.paid")}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </TableCard>
    </PageLayout>
  );
}
