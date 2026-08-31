"use client";

// InHouseTab — list of in-house stays with View / Check-Out / Message buttons.

import * as React from "react";
import { AlertCircle, RefreshCw, Users, MessageCircle, LogOut, Eye } from "lucide-react";
import { useFetch, apiPost } from "./use-fetch";
import { ReceptLocale, t } from "./i18n";
import { Money, DateStr, EmptyState, LoadingSpinner } from "@/components/app/shared";
import { toast } from "sonner";

interface InHouseData {
  ok: boolean;
  inhouse: Array<{
    id: string;
    stayNumber: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    adults: number;
    children: number;
    balance: number;
    checkedInAt: string | null;
    activeRequestsCount: number;
    guest: { id: string; fullName: string; phone: string; email: string | null };
    room: {
      id: string;
      roomNumber: string;
      floor: number;
      roomType: { id: string; slug: string; nameAr: string; nameEn: string } | null;
    };
  }>;
}

interface Props {
  locale: ReceptLocale;
  onView: (stayId: string) => void;
  onCheckOut: (stayId: string) => void;
  onMessage: (stayId: string) => void;
}

export function InHouseTab({ locale, onView, onCheckOut, onMessage }: Props) {
  const { data, loading, error, refresh } = useFetch<InHouseData>("/api/app/reception/inhouse", { intervalMs: 30_000 });

  async function handleQuickCheckOut(stayId: string) {
    const ok = confirm(locale === "ar" ? "هل تريد تأكيد المغادرة؟" : "Confirm checkout?");
    if (!ok) return;
    const res = await apiPost(`/api/app/reception/inhouse/${stayId}/checkout`, { forceBalance: false });
    if (res.ok) {
      toast.success(t("toastCheckOutOk", locale));
      refresh();
    } else {
      const data = res.data as { balance?: number } | undefined;
      if (res.error === "balanceDue" && data && typeof data.balance === "number") {
        const force = confirm(locale === "ar"
          ? `الرصيد المستحق ${data.balance}. هل تريد المغادرة القسرية؟`
          : `Balance due: ${data.balance}. Force checkout?`);
        if (!force) return;
        const res2 = await apiPost(`/api/app/reception/inhouse/${stayId}/checkout`, { forceBalance: true });
        if (res2.ok) { toast.success(t("toastCheckOutOk", locale)); refresh(); }
        else toast.error(t("errGeneric", locale));
      } else {
        toast.error(t("errGeneric", locale));
      }
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{t("tabInhouse", locale)}</h2>
        <div className="flex items-center gap-2">
          {data && <span className="text-xs font-semibold text-slate-500">{data.inhouse.length}</span>}
          <button onClick={refresh} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label={t("refresh", locale)}>
            <RefreshCw className={`w-4 h-4 ${loading && data ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <LoadingSpinner label={t("loading", locale)} />
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} action={
          <button onClick={refresh} className="text-amber-700 font-semibold text-sm">{t("retry", locale)}</button>
        } />
      ) : !data ? null : data.inhouse.length === 0 ? (
        <EmptyState icon={<Users className="w-7 h-7" />} title={t("noInHouse", locale)} />
      ) : (
        <ul className="p-3 space-y-2">
          {data.inhouse.map((s) => (
            <li key={s.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <button onClick={() => onView(s.id)} className="min-w-0 flex-1 text-start">
                  <p className="text-sm font-bold text-slate-900 truncate">{s.guest.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {t("room", locale)} {s.room.roomNumber} • {locale === "ar" ? s.room.roomType?.nameAr || "—" : s.room.roomType?.nameEn || "—"}
                  </p>
                </button>
                <div className="flex flex-col items-end gap-1">
                  {s.balance > 0 && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      <Money amount={s.balance} locale={locale} />
                    </span>
                  )}
                  {s.activeRequestsCount > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                      {s.activeRequestsCount} {t("requests", locale)}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 mb-2.5">
                <div><span className="text-slate-400">{t("stayNumber", locale)}: </span><span className="font-semibold">{s.stayNumber}</span></div>
                <div><span className="text-slate-400">{t("nights", locale)}: </span><span className="font-semibold">{s.nights}</span></div>
                <div className="col-span-2"><span className="text-slate-400">{t("kpiTodayDepartures", locale)}: </span>
                  <span className="font-semibold"><DateStr value={s.checkOut} locale={locale} /></span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ActionBtn onClick={() => onView(s.id)} icon={<Eye className="w-3.5 h-3.5" />} label={t("view", locale)} variant="ghost" />
                <ActionBtn onClick={() => onMessage(s.id)} icon={<MessageCircle className="w-3.5 h-3.5" />} label={t("message", locale)} variant="ghost" />
                <ActionBtn onClick={() => handleQuickCheckOut(s.id)} icon={<LogOut className="w-3.5 h-3.5" />} label={t("checkOut", locale)} variant="emerald" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionBtn({ onClick, icon, label, variant }: { onClick: () => void; icon: React.ReactNode; label: string; variant: "ghost" | "emerald" }) {
  const cls = variant === "emerald"
    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
    : "bg-slate-50 hover:bg-slate-100 text-slate-700";
  return (
    <button onClick={onClick} className={`flex items-center justify-center gap-1 h-9 rounded-lg text-xs font-bold ${cls}`}>
      {icon}
      {label}
    </button>
  );
}
