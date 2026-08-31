"use client";

// StayTab — full stay details + hotel policies/facilities (fetched from website APIs).

import * as React from "react";
import { BedDouble, Calendar, Users, Receipt, AlertCircle, RefreshCw, MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { GuestLocale, t } from "./i18n";
import { useFetch } from "./use-fetch";
import { StatusBadge, Money, DateStr, EmptyState, LoadingSpinner } from "@/components/app/shared";

interface HomeData {
  ok: boolean;
  stay: {
    id: string;
    stayNumber: string;
    guestName: string;
    roomNumber: string;
    roomTypeName: string;
    roomTypeNameEn: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    adults: number;
    children: number;
    status: string;
    balance: number;
    roomId: string;
  };
  hotel: {
    nameAr: string;
    nameEn: string;
    phone: string;
    whatsapp: string | null;
    email: string;
    addressAr: string;
    addressEn: string;
    checkInTime: string;
    checkOutTime: string;
    currency: string;
  } | null;
  unpaidBalance: number;
}

interface PoliciesData {
  policies: Array<{
    id: string;
    category: string;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
  }>;
}

interface FacilitiesData {
  facilities: Array<{
    id: string;
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    descriptionEn: string;
    hoursAr: string | null;
    hoursEn: string | null;
    iconKey: string | null;
  }>;
}

interface Props {
  locale: GuestLocale;
  onOpenChat: () => void;
}

export function StayTab({ locale, onOpenChat }: Props) {
  const { data, loading, error, refresh } = useFetch<HomeData>("/api/app/guest/home", { intervalMs: 60_000 });
  const { data: policiesData } = useFetch<PoliciesData>("/api/policies", { enabled: !!data });
  const { data: facilitiesData } = useFetch<FacilitiesData>("/api/facilities", { enabled: !!data });

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{t("tabStay", locale)}</h2>
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
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] text-amber-200/80 uppercase tracking-wide">{t("stayNumber", locale)}</p>
                <p className="text-lg font-bold font-mono">{data.stay.stayNumber}</p>
              </div>
              <StatusBadge status={data.stay.status} />
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2.5">
              <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-emerald-900 font-bold text-lg">
                {data.stay.roomNumber}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-amber-200/80">{t("roomNumber", locale)}</p>
                <p className="text-sm font-bold truncate">{locale === "ar" ? data.stay.roomTypeName : data.stay.roomTypeNameEn || data.stay.roomTypeName}</p>
              </div>
            </div>
          </div>

          {/* Stay detail card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-emerald-600" />
              {t("tabStay", locale)}
            </h3>
            <DetailRow icon={<Calendar className="w-4 h-4 text-slate-400" />} label={t("checkIn", locale)} value={<DateStr value={data.stay.checkIn} locale={locale} />} />
            <DetailRow icon={<Calendar className="w-4 h-4 text-slate-400" />} label={t("checkOut", locale)} value={<DateStr value={data.stay.checkOut} locale={locale} />} />
            <DetailRow icon={<Calendar className="w-4 h-4 text-slate-400" />} label={t("nights", locale)} value={String(data.stay.nights)} />
            <DetailRow icon={<Users className="w-4 h-4 text-slate-400" />} label={t("guests", locale)} value={`${data.stay.adults} ${t("adults", locale)}${data.stay.children > 0 ? ` + ${data.stay.children} ${t("children", locale)}` : ""}`} />
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 text-xs">
                <Receipt className="w-4 h-4 text-slate-400" />
                {t("balance", locale)}
              </span>
              {data.unpaidBalance > 0 ? (
                <span className="font-bold text-rose-600"><Money amount={data.unpaidBalance} currency={data.hotel?.currency || "YER"} locale={locale} /></span>
              ) : (
                <span className="text-emerald-700 font-bold text-xs">{t("noBalance", locale)}</span>
              )}
            </div>
          </div>

          {/* Hotel contact card */}
          {data.hotel && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {t("hotelInfo", locale)}
              </h3>
              <p className="text-xs text-slate-700 mb-3 font-semibold">
                {locale === "ar" ? data.hotel.nameAr : data.hotel.nameEn}
              </p>
              <div className="space-y-2 text-xs">
                <a href={`tel:${data.hotel.phone}`} className="flex items-center gap-2 text-slate-700 hover:text-emerald-700">
                  <Phone className="w-4 h-4 text-emerald-600 flex-none" />
                  <span dir="ltr">{data.hotel.phone}</span>
                </a>
                {data.hotel.whatsapp && (
                  <a
                    href={`https://wa.me/${data.hotel.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-slate-700 hover:text-emerald-700"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600 flex-none" />
                    <span dir="ltr">{data.hotel.whatsapp}</span>
                  </a>
                )}
                <a href={`mailto:${data.hotel.email}`} className="flex items-center gap-2 text-slate-700 hover:text-emerald-700">
                  <Mail className="w-4 h-4 text-emerald-600 flex-none" />
                  <span dir="ltr" className="truncate">{data.hotel.email}</span>
                </a>
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-none mt-0.5" />
                  <span>{locale === "ar" ? data.hotel.addressAr : data.hotel.addressEn}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-emerald-600 flex-none" />
                  <span>{t("checkInTime", locale)}: {data.hotel.checkInTime} • {t("checkOutTime", locale)}: {data.hotel.checkOutTime}</span>
                </div>
              </div>
              <button
                onClick={onOpenChat}
                className="w-full mt-3 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {t("chatWithReception", locale)}
              </button>
            </div>
          )}

          {/* Facilities */}
          {facilitiesData && facilitiesData.facilities.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">{t("facilities", locale)}</h3>
              <ul className="space-y-2">
                {facilitiesData.facilities.map((f) => (
                  <li key={f.id} className="border-slate-100 last:border-0 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{locale === "ar" ? f.nameAr : f.nameEn}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{locale === "ar" ? f.descriptionAr : f.descriptionEn}</p>
                      </div>
                      {((locale === "ar" ? f.hoursAr : f.hoursEn) || f.hoursAr || f.hoursEn) && (
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {locale === "ar" ? (f.hoursAr || f.hoursEn) : (f.hoursEn || f.hoursAr)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Policies */}
          {policiesData && policiesData.policies.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">{t("policies", locale)}</h3>
              <ul className="divide-y divide-slate-100">
                {policiesData.policies.map((p) => (
                  <li key={p.id} className="py-2 first:pt-0 last:pb-0">
                    <p className="text-sm font-semibold text-slate-800">{locale === "ar" ? p.titleAr : p.titleEn}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 whitespace-pre-wrap">{locale === "ar" ? p.bodyAr : p.bodyEn}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2 text-slate-500">{icon}{label}</span>
      <span className="font-semibold text-slate-800 text-end">{value}</span>
    </div>
  );
}
