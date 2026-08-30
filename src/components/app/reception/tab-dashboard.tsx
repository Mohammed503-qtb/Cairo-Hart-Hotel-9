"use client";

// Dashboard tab — KPIs + arrivals/departures/pending requests short lists.

import * as React from "react";
import { Plane, LogOut, BellRing, Users, LayoutDashboard, ChevronLeft, AlertCircle, RefreshCw } from "lucide-react";
import { useFetch, apiPost } from "./use-fetch";
import { ReceptLocale, t } from "./i18n";
import { StatusBadge, PriorityBadge, Money, DateStr, EmptyState, LoadingSpinner } from "@/components/app/shared";
import { toast } from "sonner";
import { CheckInTarget } from "./checkin-sheet";

interface DashboardData {
  ok: boolean;
  kpis: {
    todayArrivals: number;
    todayDepartures: number;
    inHouseGuests: number;
    pendingRequests: number;
    urgentRequests: number;
  };
  arrivalsList: Array<{
    id: string;
    bookingReference: string;
    status: string;
    paymentStatus: string;
    grandTotal: number;
    paidTotal: number;
    adults: number;
    children: number;
    nights: number;
    guest: { id: string; fullName: string; phone: string };
    roomType: { id: string; slug: string; nameAr: string; nameEn: string } | null;
  }>;
  departuresList: Array<{
    id: string;
    stayNumber: string;
    checkOut: string;
    balance: number;
    adults: number;
    children: number;
    guest: { id: string; fullName: string; phone: string };
    room: {
      id: string;
      roomNumber: string;
      floor: number;
      roomType: { id: string; slug: string; nameAr: string; nameEn: string } | null;
    };
  }>;
  pendingRequestsList: Array<{
    id: string;
    requestNumber: number;
    category: string;
    service: string;
    title: string;
    priority: string;
    status: string;
    createdAt: string;
    assignedTo: string | null;
    guestName: string;
    roomNumber: string;
  }>;
}

type TabKey = "dashboard" | "arrivals" | "inhouse" | "requests";

interface Props {
  locale: ReceptLocale;
  onCheckIn: (target: CheckInTarget) => void;
  onCheckOut: (stayId: string) => void;
  onViewRequest: (id: string) => void;
  onOpenRoomBoard: () => void;
  onNavigate: (tab: TabKey) => void;
}

export function DashboardTab({ locale, onCheckIn, onCheckOut, onViewRequest, onOpenRoomBoard, onNavigate }: Props) {
  const { data, loading, error, refresh } = useFetch<DashboardData>("/api/app/reception/dashboard", { intervalMs: 30_000 });

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
          ? `الرصيد المستحق ${data.balance} هل تريد المغادرة القسرية؟`
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
    <div className="h-full overflow-y-auto pb-2">
      {/* Header strip with quick actions */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{t("welcome", locale)}</p>
            <h2 className="text-lg font-bold text-slate-900">{t("appTitle", locale)}</h2>
          </div>
          <button onClick={refresh} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label={t("refresh", locale)}>
            <RefreshCw className={cn5("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <QuickAction icon={<Plane className="w-4 h-4" />} label={t("quickCheckIn", locale)} onClick={() => onNavigate("arrivals")} />
          <QuickAction icon={<LogOut className="w-4 h-4" />} label={t("quickCheckOut", locale)} onClick={() => onNavigate("inhouse")} />
          <QuickAction icon={<LayoutDashboard className="w-4 h-4" />} label={t("quickRoomStatus", locale)} onClick={onOpenRoomBoard} />
          <QuickAction icon={<BellRing className="w-4 h-4" />} label={t("tabRequests", locale)} onClick={() => onNavigate("requests")} />
        </div>
      </div>

      {loading && !data ? (
        <LoadingSpinner label={t("loading", locale)} />
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} action={
          <button onClick={refresh} className="text-amber-700 font-semibold text-sm">{t("retry", locale)}</button>
        } />
      ) : !data ? null : (
        <div className="p-3 space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-2">
            <KpiCard
              icon={<Plane className="w-5 h-5" />}
              label={t("kpiTodayArrivals", locale)}
              value={data.kpis.todayArrivals}
              accent="amber"
              onClick={() => onNavigate("arrivals")}
            />
            <KpiCard
              icon={<LogOut className="w-5 h-5" />}
              label={t("kpiTodayDepartures", locale)}
              value={data.kpis.todayDepartures}
              accent="teal"
              onClick={() => onNavigate("inhouse")}
            />
            <KpiCard
              icon={<Users className="w-5 h-5" />}
              label={t("kpiInHouse", locale)}
              value={data.kpis.inHouseGuests}
              accent="emerald"
              onClick={() => onNavigate("inhouse")}
            />
            <KpiCard
              icon={<BellRing className="w-5 h-5" />}
              label={t("kpiPendingRequests", locale)}
              value={data.kpis.pendingRequests}
              accent="rose"
              extra={data.kpis.urgentRequests > 0 ? `${data.kpis.urgentRequests} ${t("kpiUrgent", locale)}` : undefined}
              onClick={() => onNavigate("requests")}
            />
          </div>

          {/* Arrivals list */}
          <SectionCard title={t("arrivalsList", locale)} seeAllLabel={locale === "ar" ? "الكل" : "All"} onSeeAll={() => onNavigate("arrivals")}>
            {data.arrivalsList.length === 0 ? (
              <EmptyRow label={t("noArrivals", locale)} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.arrivalsList.map((a) => (
                  <li key={a.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.guest.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {a.bookingReference} • {locale === "ar" ? a.roomType?.nameAr || "—" : a.roomType?.nameEn || "—"} • {a.nights} {t("nights", locale)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <StatusBadge status={a.paymentStatus} />
                      </div>
                    </div>
                    <button
                      onClick={() => onCheckIn({ reservationId: a.id, guestName: a.guest.fullName, roomTypeName: locale === "ar" ? a.roomType?.nameAr || "" : a.roomType?.nameEn || "" })}
                      className="text-xs font-bold px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm whitespace-nowrap"
                    >
                      {t("checkIn", locale)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Departures list */}
          <SectionCard title={t("departuresList", locale)} seeAllLabel={locale === "ar" ? "الكل" : "All"} onSeeAll={() => onNavigate("inhouse")}>
            {data.departuresList.length === 0 ? (
              <EmptyRow label={t("noDepartures", locale)} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.departuresList.map((s) => (
                  <li key={s.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{s.guest.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {t("room", locale)} {s.room.roomNumber} • <DateStr value={s.checkOut} locale={locale} />
                      </p>
                      {s.balance > 0 && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                          {t("balance", locale)}: <Money amount={s.balance} locale={locale} />
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleQuickCheckOut(s.id)}
                      className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm whitespace-nowrap"
                    >
                      {t("checkOut", locale)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Pending requests list */}
          <SectionCard title={t("pendingRequests", locale)} seeAllLabel={locale === "ar" ? "الكل" : "All"} onSeeAll={() => onNavigate("requests")}>
            {data.pendingRequestsList.length === 0 ? (
              <EmptyRow label={t("noPendingRequests", locale)} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.pendingRequestsList.map((r) => (
                  <li key={r.id} className="py-2.5 flex items-center justify-between gap-2">
                    <button onClick={() => onViewRequest(r.id)} className="min-w-0 flex-1 text-start">
                      <div className="flex items-center gap-2 mb-0.5">
                        <PriorityBadge priority={r.priority} />
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 truncate">{r.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {t("room", locale)} {r.roomNumber} • {r.guestName}
                      </p>
                    </button>
                    <ChevronButton onClick={() => onViewRequest(r.id)} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}

function cn5(...xs: (string | false | undefined)[]) { return xs.filter(Boolean).join(" "); }

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-slate-50 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 transition text-slate-700"
    >
      {icon}
      <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
    </button>
  );
}

const ACCENT_BG: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
};

function KpiCard({ icon, label, value, accent, extra, onClick }: { icon: React.ReactNode; label: string; value: number; accent: string; extra?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1 p-3 rounded-xl border ${ACCENT_BG[accent] || ACCENT_BG.emerald} text-start`}
    >
      <div className="flex items-center justify-between w-full">
        {icon}
        <span className="text-2xl font-bold tabular-nums">{value}</span>
      </div>
      <p className="text-[11px] font-medium leading-tight">{label}</p>
      {extra && <p className="text-[10px] font-bold text-rose-600">{extra}</p>}
    </button>
  );
}

function SectionCard({ title, seeAllLabel, onSeeAll, children }: { title: string; seeAllLabel?: string; onSeeAll?: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {onSeeAll && seeAllLabel && (
          <button onClick={onSeeAll} className="flex items-center text-[11px] font-semibold text-amber-700 hover:text-amber-800">
            {seeAllLabel}
            <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
          </button>
        )}
      </div>
      <div className="px-3">{children}</div>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-slate-400 text-center py-4">{label}</p>;
}

function ChevronButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-1.5 -m-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
    </button>
  );
}
