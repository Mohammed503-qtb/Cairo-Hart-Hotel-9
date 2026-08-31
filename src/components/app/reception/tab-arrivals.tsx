"use client";

// ArrivalsTab — full arrivals list for today with date selector.

import * as React from "react";
import { AlertCircle, RefreshCw, Plane } from "lucide-react";
import { useFetch } from "./use-fetch";
import { ReceptLocale, t } from "./i18n";
import { StatusBadge, Money, EmptyState, LoadingSpinner } from "@/components/app/shared";
import { CheckInTarget } from "./checkin-sheet";

interface ArrivalsData {
  ok: boolean;
  date: string;
  arrivals: Array<{
    id: string;
    bookingReference: string;
    status: string;
    paymentStatus: string;
    grandTotal: number;
    paidTotal: number;
    adults: number;
    children: number;
    nights: number;
    checkIn: string;
    checkOut: string;
    guest: { id: string; fullName: string; phone: string; email: string | null; countryCode: string };
    items: Array<{
      id: string;
      roomTypeId: string;
      roomType: { id: string; slug: string; nameAr: string; nameEn: string } | null;
      nightlyRate: number;
      subtotal: number;
    }>;
  }>;
}

interface Props {
  locale: ReceptLocale;
  onCheckIn: (target: CheckInTarget) => void;
}

export function ArrivalsTab({ locale, onCheckIn }: Props) {
  const [date, setDate] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const { data, loading, error, refresh } = useFetch<ArrivalsData>(`/api/app/reception/arrivals?date=${date}`, { intervalMs: 30_000 });

  function changeDate(offset: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().slice(0, 10));
  }

  const isToday = date === new Date().toISOString().slice(0, 10);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header with date selector */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-900">{t("tabArrivals", locale)}</h2>
          <button onClick={refresh} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label={t("refresh", locale)}>
            <RefreshCw className={`w-4 h-4 ${loading && data ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-1">
          <button onClick={() => changeDate(-1)} className="px-3 py-1.5 rounded text-sm font-semibold text-slate-700 hover:bg-white">
            ← {locale === "ar" ? "السابق" : "Prev"}
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-800 text-center border-0 outline-none"
            dir="ltr"
          />
          <button onClick={() => changeDate(1)} className="px-3 py-1.5 rounded text-sm font-semibold text-slate-700 hover:bg-white">
            {locale === "ar" ? "التالي" : "Next"} →
          </button>
        </div>
        {isToday && (
          <p className="text-[11px] text-amber-700 font-semibold mt-1.5 text-center">
            {locale === "ar" ? "اليوم" : "Today"} • {data?.arrivals.length || 0} {locale === "ar" ? "وصول" : "arrivals"}
          </p>
        )}
      </div>

      {loading && !data ? (
        <LoadingSpinner label={t("loading", locale)} />
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} action={
          <button onClick={refresh} className="text-amber-700 font-semibold text-sm">{t("retry", locale)}</button>
        } />
      ) : !data ? null : data.arrivals.length === 0 ? (
        <EmptyState icon={<Plane className="w-7 h-7" />} title={t("noArrivals", locale)} />
      ) : (
        <ul className="p-3 space-y-2">
          {data.arrivals.map((a) => {
            const item = a.items[0];
            const roomTypeName = locale === "ar" ? item?.roomType?.nameAr || "—" : item?.roomType?.nameEn || "—";
            return (
              <li key={a.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{a.guest.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate" dir="ltr">{a.guest.countryCode} {a.guest.phone}</p>
                  </div>
                  <StatusBadge status={a.paymentStatus} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 mb-2.5">
                  <div><span className="text-slate-400">{t("bookingRef", locale)}: </span><span className="font-semibold">{a.bookingReference}</span></div>
                  <div><span className="text-slate-400">{t("roomType", locale)}: </span><span className="font-semibold truncate">{roomTypeName}</span></div>
                  <div><span className="text-slate-400">{t("nights", locale)}: </span><span className="font-semibold">{a.nights}</span></div>
                  <div><span className="text-slate-400">{t("guests", locale)}: </span><span className="font-semibold">{a.adults}+{a.children}</span></div>
                  <div className="col-span-2"><span className="text-slate-400">{t("balance", locale)}: </span>
                    <span className="font-semibold text-emerald-700"><Money amount={Math.max(0, a.grandTotal - a.paidTotal)} locale={locale} /></span>
                  </div>
                </div>
                <button
                  onClick={() => onCheckIn({ reservationId: a.id, guestName: a.guest.fullName, roomTypeName })}
                  className="w-full h-10 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm"
                >
                  {t("checkIn", locale)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
