"use client";

// BillTab — charges list, payments list, totals, balance.

import * as React from "react";
import { AlertCircle, RefreshCw, Receipt, CreditCard, Wallet } from "lucide-react";
import { GuestLocale, t } from "./i18n";
import { useFetch } from "./use-fetch";
import { Money, DateStr, EmptyState, LoadingSpinner } from "@/components/app/shared";

interface BillData {
  ok: boolean;
  stay: {
    id: string;
    stayNumber: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomNumber: string;
    roomTypeName: string;
    roomTypeNameEn: string;
    balance: number;
    currency: string;
  };
  charges: Array<{
    id: string;
    description: string;
    category: string;
    quantity: number;
    unitPrice: number;
    grossAmount: number;
    discount: number;
    netAmount: number;
    tax: number;
    source: string;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    completedAt: string | null;
    createdAt: string;
  }>;
  totals: {
    totalCharges: number;
    totalPayments: number;
    balance: number;
  };
}

interface Props {
  locale: GuestLocale;
}

const METHOD_LABEL: Record<string, { ar: string; en: string }> = {
  PAY_AT_HOTEL: { ar: "نقداً عند الفندق", en: "Pay at Hotel" },
  PAY_ONLINE: { ar: "أونلاين", en: "Online" },
  DEPOSIT: { ar: "دفعة مقدمة", en: "Deposit" },
  CASH: { ar: "نقداً", en: "Cash" },
  CARD: { ar: "بطاقة", en: "Card" },
  BANK_TRANSFER: { ar: "تحويل بنكي", en: "Bank Transfer" },
};

export function BillTab({ locale }: Props) {
  const { data, loading, error, refresh } = useFetch<BillData>("/api/app/guest/bill", { intervalMs: 30_000 });

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{t("billTitle", locale)}</h2>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label={t("refresh", locale)}>
          <RefreshCw className={`w-4 h-4 ${loading && data ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !data ? (
        <LoadingSpinner label={t("loading", locale)} />
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} action={
          <button onClick={refresh} className="text-amber-700 font-semibold text-sm">{t("retry", locale)}</button>
        } />
      ) : !data ? null : (
        <div className="p-3 space-y-4">
          {/* Stay header */}
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[11px] text-amber-200/80 uppercase tracking-wide">{t("stayNumber", locale)}</p>
                <p className="text-lg font-bold font-mono">{data.stay.stayNumber}</p>
              </div>
              <div className="text-end">
                <p className="text-[11px] text-amber-200/80">{t("roomNumber", locale)}</p>
                <p className="text-lg font-bold">{data.stay.roomNumber}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-100">
              <DateStr value={data.stay.checkIn} locale={locale} /> → <DateStr value={data.stay.checkOut} locale={locale} /> • {data.stay.nights} {t("nights", locale)}
            </p>
          </div>

          {/* Totals summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              {t("totals", locale)}
            </h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{t("totalCharges", locale)}</span>
              <span className="font-bold text-slate-800"><Money amount={data.totals.totalCharges} currency={data.stay.currency} locale={locale} /></span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{t("totalPayments", locale)}</span>
              <span className="font-bold text-emerald-700"><Money amount={data.totals.totalPayments} currency={data.stay.currency} locale={locale} /></span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-sm font-bold text-slate-700">{t("balance", locale)}</span>
              {data.totals.balance > 0 ? (
                <span className="text-base font-bold text-rose-600"><Money amount={data.totals.balance} currency={data.stay.currency} locale={locale} /></span>
              ) : (
                <span className="text-emerald-700 font-bold text-sm">{t("noBalance", locale)}</span>
              )}
            </div>
          </div>

          {/* Charges list */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-slate-50/60">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">{t("charges", locale)}</h3>
              <span className="ms-auto text-[10px] text-slate-400">{data.charges.length}</span>
            </div>
            {data.charges.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t("noCharges", locale)}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.charges.map((c) => (
                  <li key={c.id} className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.description}</p>
                        <p className="text-[10px] text-slate-400">
                          {c.quantity > 1 ? `${c.quantity} × ` : ""}<Money amount={c.unitPrice} currency={data.stay.currency} locale={locale} />
                          {c.source && c.source !== "MANUAL" && <span className="ms-1">• {c.source}</span>}
                          {" • "}<DateStr value={c.createdAt} locale={locale} />
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 text-sm whitespace-nowrap"><Money amount={c.netAmount + c.tax} currency={data.stay.currency} locale={locale} /></span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Payments list */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-slate-50/60">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">{t("payments", locale)}</h3>
              <span className="ms-auto text-[10px] text-slate-400">{data.payments.length}</span>
            </div>
            {data.payments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t("noPayments", locale)}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.payments.map((p) => (
                  <li key={p.id} className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {METHOD_LABEL[p.method]?.[locale] || p.method}
                          <span className="ms-2 text-[10px] text-slate-400 uppercase">{p.status}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {p.completedAt ? <DateStr value={p.completedAt} locale={locale} /> : <DateStr value={p.createdAt} locale={locale} />}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-700 text-sm whitespace-nowrap"><Money amount={p.amount} currency={p.currency} locale={locale} /></span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
