"use client";

// GuestDetailSheet — full stay detail: guest info, stay, financial summary, requests, actions.

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AlertCircle, LogOut, MessageCircle, CreditCard, Loader2, User, Phone, Mail, KeyRound } from "lucide-react";
import { ReceptLocale, t } from "./i18n";
import { useFetch, apiPost } from "./use-fetch";
import { StatusBadge, Money, DateStr, LoadingSpinner } from "@/components/app/shared";
import { toast } from "sonner";

interface StayDetail {
  ok: boolean;
  stay: {
    id: string;
    stayNumber: string;
    status: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    adults: number;
    children: number;
    balance: number;
    checkedInAt: string | null;
    checkedOutAt: string | null;
    notes: string | null;
  };
  guest: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    countryCode: string;
    whatsapp: string | null;
  };
  room: {
    id: string;
    roomNumber: string;
    floor: number;
    status: string;
    roomType: { id: string; slug: string; nameAr: string; nameEn: string; bedConfigAr: string; bedConfigEn: string } | null;
  };
  reservation: {
    id: string;
    bookingReference: string;
    grandTotal: number;
    paidTotal: number;
    paymentStatus: string;
    paymentMethod: string | null;
    currency: string;
  } | null;
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
  charges: Array<{
    id: string;
    description: string;
    category: string;
    source: string;
    quantity: number;
    unitPrice: number;
    grossAmount: number;
    discount: number;
    netAmount: number;
    tax: number;
    createdAt: string;
  }>;
  requests: Array<{
    id: string;
    requestNumber: number;
    category: string;
    service: string;
    title: string;
    description: string | null;
    priority: string;
    status: string;
    assignedTo: string | null;
    createdAt: string;
    completedAt: string | null;
    eventsCount: number;
  }>;
  financialSummary: {
    chargesTotal: number;
    paymentsTotal: number;
    balance: number;
  };
}

interface Props {
  stayId: string | null;
  onClose: () => void;
  locale: ReceptLocale;
  onMessage: (stayId: string) => void;
  onPayment: (stayId: string) => void;
  onCheckoutDone: () => void;
}

export function GuestDetailSheet({ stayId, onClose, locale, onMessage, onPayment, onCheckoutDone }: Props) {
  const isRTL = locale === "ar";
  const open = !!stayId;
  const { data, loading, error, refresh } = useFetch<StayDetail>(stayId ? `/api/app/reception/inhouse/${stayId}` : "", {
    enabled: !!stayId,
    intervalMs: 30_000,
  });
  const [submitting, setSubmitting] = React.useState(false);

  async function handleCheckOut() {
    if (!stayId || !data) return;
    if (data.stay.balance > 0.01) {
      const ok = confirm(locale === "ar"
        ? `الرصيد المستحق ${data.stay.balance}. هل تريد المغادرة القسرية؟`
        : `Balance due: ${data.stay.balance}. Force checkout?`);
      if (!ok) return;
      await doCheckOut(true);
    } else {
      await doCheckOut(false);
    }
  }

  async function doCheckOut(force: boolean) {
    if (!stayId) return;
    setSubmitting(true);
    const res = await apiPost(`/api/app/reception/inhouse/${stayId}/checkout`, { forceBalance: force });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("toastCheckOutOk", locale));
      onCheckoutDone();
    } else {
      toast.error(t("errGeneric", locale));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-0">
          <SheetTitle className="text-lg font-bold text-slate-900">{t("guestDetail", locale)}</SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            {data?.stay.stayNumber ? `${t("stayNumber", locale)}: ${data.stay.stayNumber}` : t("loading", locale)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && !data ? (
            <LoadingSpinner label={t("loading", locale)} />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-none" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : !data ? null : (
            <div className="space-y-4">
              {/* Guest info */}
              <Section title={t("guestName", locale)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-none">
                    <User className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900">{data.guest.fullName}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5" dir="ltr">
                      <Phone className="w-3 h-3" /> {data.guest.countryCode} {data.guest.phone}
                    </p>
                    {data.guest.email && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {data.guest.email}
                      </p>
                    )}
                  </div>
                </div>
              </Section>

              {/* Stay details */}
              <Section title={t("room", locale)}>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Field label={t("room", locale)} value={`${data.room.roomNumber} (${locale === "ar" ? data.room.roomType?.nameAr || "—" : data.room.roomType?.nameEn || "—"})`} />
                  <Field label={t("status", locale)} value={<StatusBadge status={data.room.status} />} />
                  <Field label={t("nights", locale)} value={`${data.stay.nights}`} />
                  <Field label={t("guests", locale)} value={`${data.stay.adults} ${t("adults", locale)}${data.stay.children ? ` + ${data.stay.children} ${t("children", locale)}` : ""}`} />
                  <Field label={locale === "ar" ? "تسجيل الدخول" : "Check-in"} value={<DateStr value={data.stay.checkIn} locale={locale} />} />
                  <Field label={locale === "ar" ? "تسجيل الخروج" : "Check-out"} value={<DateStr value={data.stay.checkOut} locale={locale} />} />
                </div>
                {data.stay.notes && (
                  <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">{data.stay.notes}</p>
                )}
              </Section>

              {/* Financial summary */}
              <Section title={t("financialSummary", locale)}>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("charges", locale)}</span>
                    <span className="font-semibold"><Money amount={data.financialSummary.chargesTotal} locale={locale} /></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("payments", locale)}</span>
                    <span className="font-semibold text-emerald-700">- <Money amount={data.financialSummary.paymentsTotal} locale={locale} /></span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <span className="font-bold text-slate-700">{t("balance", locale)}</span>
                    <span className={`font-bold ${data.financialSummary.balance > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      <Money amount={data.financialSummary.balance} locale={locale} />
                    </span>
                  </div>
                </div>
                {/* Payment history */}
                {data.payments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 mb-1.5">{t("paymentHistory", locale)}</p>
                    <ul className="space-y-1">
                      {data.payments.map((p) => (
                        <li key={p.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">{p.method} • <DateStr value={p.createdAt} locale={locale} /></span>
                          <span className="font-semibold text-emerald-700"><Money amount={p.amount} locale={locale} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>

              {/* Requests */}
              <Section title={t("requests", locale)}>
                {data.requests.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">{t("noRequests", locale)}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {data.requests.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg p-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{r.title}</p>
                          <p className="text-[10px] text-slate-500">#{r.requestNumber} • {timeAgo(r.createdAt, locale)}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* Charges breakdown */}
              <Section title={t("charges", locale)}>
                <ul className="space-y-1">
                  {data.charges.map((c) => (
                    <li key={c.id} className="flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 truncate">{c.description}</p>
                        <p className="text-[10px] text-slate-400">{c.category} • x{c.quantity}</p>
                      </div>
                      <span className="font-semibold"><Money amount={c.netAmount + c.tax} locale={locale} /></span>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {data && data.stay.status === "CHECKED_IN" && (
          <div className="flex-none px-5 py-3 border-t border-slate-200 bg-white grid grid-cols-3 gap-2">
            <Button onClick={() => onMessage(data.stay.id)} variant="outline" className="h-11 text-xs font-bold">
              <MessageCircle className="w-4 h-4" /> {t("message", locale)}
            </Button>
            <Button onClick={() => onPayment(data.stay.id)} variant="outline" className="h-11 text-xs font-bold">
              <CreditCard className="w-4 h-4" /> {t("recordPayment", locale)}
            </Button>
            <Button onClick={handleCheckOut} disabled={submitting} className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} {t("checkOut", locale)}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">{title}</h3>
      <div className="bg-white border border-slate-200 rounded-xl p-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
      <div className="font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function timeAgo(iso: string, locale: ReceptLocale): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return locale === "ar" ? "الآن" : "now";
  if (m < 60) return locale === "ar" ? `قبل ${m} د` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return locale === "ar" ? `قبل ${h} س` : `${h}h ago`;
  const days = Math.floor(h / 24);
  return locale === "ar" ? `قبل ${days} ي` : `${days}d ago`;
}
