"use client";

// HomeTab — guest home dashboard:
//   - Welcome header (guest name + room + check-out date)
//   - Quick actions grid (4 buttons: Request Service / Reception / Extension / Checkout)
//   - Stay summary card
//   - Recent notifications (top 3)
//   - Hotel info links

import * as React from "react";
import {
  BellRing,
  ConciergeBell,
  CalendarPlus,
  LogOut,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Bell,
} from "lucide-react";
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
  recentNotifications: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    requestId: string | null;
    stayId: string | null;
    createdAt: string;
  }>;
  activeRequestsCount: number;
  unpaidBalance: number;
}

interface Props {
  locale: GuestLocale;
  onOpenRequests: () => void;
  onOpenNotifications: () => void;
  onOpenServices: () => void;
  onOpenChat: () => void;
  onOpenExtension: () => void;
  onOpenCheckout: () => void;
  refreshKey: number;
}

export function HomeTab({ locale, onOpenRequests, onOpenNotifications, onOpenServices, onOpenChat, onOpenExtension, onOpenCheckout, refreshKey }: Props) {
  const { data, loading, error, refresh } = useFetch<HomeData>("/api/app/guest/home", { intervalMs: 30_000 });

  // External refresh trigger (e.g. after a request was created)
  React.useEffect(() => {
    if (refreshKey > 0) refresh();
  }, [refreshKey, refresh]);

  return (
    <div className="h-full overflow-y-auto pb-4">
      {/* Top header strip */}
      <div className="sticky top-0 z-10 bg-gradient-to-l from-emerald-900 to-emerald-800 text-white px-4 py-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] text-amber-200/80 font-medium uppercase tracking-wide">{t("welcome", locale)}</p>
            <h2 className="text-lg font-bold leading-tight">{data?.stay?.guestName || "—"}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onOpenNotifications} className="relative p-2 rounded-lg hover:bg-white/10 transition" aria-label={t("notifications", locale)}>
              <Bell className="w-5 h-5" />
              {data && data.recentNotifications.some((n) => !n.isRead) && (
                <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
            <button onClick={refresh} className="p-2 rounded-lg hover:bg-white/10 transition" aria-label={t("refresh", locale)}>
              <RefreshCw className={`w-4 h-4 ${loading && data ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        {data?.stay && (
          <div className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2">
            <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-emerald-900 font-bold">
              {data.stay.roomNumber}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-amber-200/80">{t("roomNumber", locale)}</p>
              <p className="text-sm font-bold truncate">{locale === "ar" ? data.stay.roomTypeName : data.stay.roomTypeNameEn || data.stay.roomTypeName}</p>
            </div>
            <div className="text-end">
              <p className="text-[11px] text-amber-200/80">{t("checkOut", locale)}</p>
              <p className="text-xs font-bold"><DateStr value={data.stay.checkOut} locale={locale} /></p>
            </div>
          </div>
        )}
      </div>

      {loading && !data ? (
        <LoadingSpinner label={t("loading", locale)} />
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} action={
          <button onClick={refresh} className="text-amber-700 font-semibold text-sm">{t("retry", locale)}</button>
        } />
      ) : !data ? null : (
        <div className="p-3 space-y-4">
          {/* Quick actions grid */}
          <div className="grid grid-cols-4 gap-2">
            <QuickAction
              icon={<ConciergeBell className="w-5 h-5" />}
              label={t("requestService", locale)}
              onClick={onOpenServices}
              accent
            />
            <QuickAction
              icon={<MessageCircle className="w-5 h-5" />}
              label={t("reception", locale)}
              onClick={onOpenChat}
            />
            <QuickAction
              icon={<CalendarPlus className="w-5 h-5" />}
              label={t("extension", locale)}
              onClick={onOpenExtension}
            />
            <QuickAction
              icon={<LogOut className="w-5 h-5" />}
              label={t("checkout", locale)}
              onClick={onOpenCheckout}
            />
          </div>

          {/* Active requests row */}
          <button
            onClick={onOpenRequests}
            className="w-full bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-amber-300 transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="text-start">
                <p className="text-sm font-bold text-slate-900">{t("myRequests", locale)}</p>
                <p className="text-[11px] text-slate-500">
                  {data.activeRequestsCount > 0
                    ? `${data.activeRequestsCount} ${t("activeRequests", locale)}`
                    : t("noRequests", locale)}
                </p>
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-slate-400 rtl:rotate-180" />
          </button>

          {/* Stay summary card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">{t("stayNumber", locale)}: <span className="font-mono">{data.stay.stayNumber}</span></h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400">{t("checkIn", locale)}</p>
                <p className="font-semibold text-slate-800"><DateStr value={data.stay.checkIn} locale={locale} /></p>
              </div>
              <div>
                <p className="text-slate-400">{t("checkOut", locale)}</p>
                <p className="font-semibold text-slate-800"><DateStr value={data.stay.checkOut} locale={locale} /></p>
              </div>
              <div>
                <p className="text-slate-400">{t("nights", locale)}</p>
                <p className="font-semibold text-slate-800">{data.stay.nights}</p>
              </div>
              <div>
                <p className="text-slate-400">{t("guests", locale)}</p>
                <p className="font-semibold text-slate-800">{data.stay.adults} {t("adults", locale)}{data.stay.children > 0 ? ` + ${data.stay.children} ${t("children", locale)}` : ""}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400">{t("stayStatus", locale)}</p>
                <StatusBadge status={data.stay.status} />
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">{t("balance", locale)}</span>
                {data.unpaidBalance > 0 ? (
                  <span className="font-bold text-rose-600"><Money amount={data.unpaidBalance} currency={data.hotel?.currency || "YER"} locale={locale} /></span>
                ) : (
                  <span className="text-emerald-700 font-bold text-xs">{t("noBalance", locale)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Recent notifications */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">{t("notifications", locale)}</h3>
              <button onClick={onOpenNotifications} className="flex items-center text-[11px] font-semibold text-amber-700 hover:text-amber-800">
                {t("notifications", locale)}
                <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
              </button>
            </div>
            {data.recentNotifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t("noNotifications", locale)}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentNotifications.slice(0, 3).map((n) => (
                  <li key={n.id} className="px-3 py-2.5 flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-none ${n.isRead ? "bg-transparent" : "bg-amber-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${n.isRead ? "font-medium text-slate-600" : "font-bold text-slate-900"}`}>{n.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{n.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Hotel info */}
          {data.hotel && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {t("hotelInfo", locale)}
              </h3>
              <p className="text-xs text-slate-600 mb-3">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label, onClick, accent }: { icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl border transition text-slate-700 ${
        accent
          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-md"
          : "bg-white border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold leading-tight text-center">{label}</span>
    </button>
  );
}
