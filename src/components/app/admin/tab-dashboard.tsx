"use client";

// Admin dashboard tab — KPI cards, recent bookings, active codes summary, alerts.

import * as React from "react";
import { Bed, Users, Building2, Banknote, AlertCircle, RefreshCw, KeyRound, ChevronLeft, Plus } from "lucide-react";
import { useFetch } from "./use-fetch";
import { AdminLocale, t } from "./i18n";
import { StatusBadge, Money, DateStr, EmptyState, LoadingSpinner } from "@/components/app/shared";

export interface DashboardData {
  ok: boolean;
  occupancyRate: number;
  inHouseGuests: number;
  totalRooms: number;
  occupiedRooms: number;
  revenueThisMonth: number;
  totalBookingsThisMonth: number;
  recentBookings: Array<{
    id: string;
    bookingReference: string;
    status: string;
    grandTotal: number;
    paymentStatus: string;
    createdAt: string;
    guestName: string;
    roomTypeName: string | null;
    roomTypeNameEn: string | null;
  }>;
  activeCodesCount: {
    guest: number;
    reception: number;
    admin: number;
  };
  alerts: Array<{ type: string; message: string; count: number }>;
  asOf: string;
}

interface Props {
  locale: AdminLocale;
  onGenerateCode: () => void;
}

export function DashboardTab({ locale, onGenerateCode }: Props) {
  const { data, loading, error, refresh } = useFetch<DashboardData>("/api/app/admin/dashboard", { intervalMs: 30_000 });

  return (
    <div className="h-full overflow-y-auto pb-2">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{t("appTitle", locale)}</p>
            <h2 className="text-lg font-bold text-slate-900">{t("welcome", locale)}</h2>
          </div>
          <button onClick={refresh} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label={t("refresh", locale)}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
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
              icon={<Building2 className="w-5 h-5" />}
              label={t("kpiOccupancy", locale)}
              value={`${data.occupancyRate}%`}
              sub={`${data.occupiedRooms}/${data.totalRooms}`}
              accent="emerald"
            />
            <KpiCard
              icon={<Users className="w-5 h-5" />}
              label={t("kpiInHouse", locale)}
              value={String(data.inHouseGuests)}
              accent="amber"
            />
            <KpiCard
              icon={<Bed className="w-5 h-5" />}
              label={t("kpiTotalRooms", locale)}
              value={String(data.totalRooms)}
              accent="teal"
            />
            <KpiCard
              icon={<Banknote className="w-5 h-5" />}
              label={t("kpiRevenueMonth", locale)}
              value={<Money amount={data.revenueThisMonth} locale={locale} />}
              accent="rose"
            />
          </div>

          {/* Active codes summary card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">{t("activeCodes", locale)}</h3>
              </div>
              <button
                onClick={onGenerateCode}
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Plus className="w-3 h-3" />
                {t("generateCode", locale)}
              </button>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 rtl:divide-x-reverse">
              <CodeCounter label={t("codesGuest", locale)} count={data.activeCodesCount.guest} accent="emerald" />
              <CodeCounter label={t("codesReception", locale)} count={data.activeCodesCount.reception} accent="amber" />
              <CodeCounter label={t("codesAdmin", locale)} count={data.activeCodesCount.admin} accent="rose" />
            </div>
          </div>

          {/* Recent bookings */}
          <SectionCard title={t("recentBookings", locale)}>
            {data.recentBookings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t("noRecentBookings", locale)}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentBookings.map((b) => (
                  <li key={b.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{b.guestName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {b.bookingReference} • {locale === "ar" ? b.roomTypeName || "—" : b.roomTypeNameEn || "—"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <StatusBadge status={b.status} />
                        <StatusBadge status={b.paymentStatus} />
                      </div>
                    </div>
                    <div className="text-end flex-none">
                      <p className="text-sm font-bold text-emerald-700"><Money amount={b.grandTotal} locale={locale} /></p>
                      <p className="text-[10px] text-slate-400"><DateStr value={b.createdAt} locale={locale} /></p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Alerts */}
          <SectionCard title={t("alerts", locale)}>
            {data.alerts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t("noAlerts", locale)}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.alerts.map((a, i) => (
                  <li key={i} className="py-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-none" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{a.message}</p>
                      <p className="text-[11px] text-slate-500">{a.type}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{a.count}</span>
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

const ACCENT_BG: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
};

function KpiCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent: string;
}) {
  return (
    <div className={`flex flex-col items-start gap-1 p-3 rounded-xl border ${ACCENT_BG[accent] || ACCENT_BG.emerald}`}>
      <div className="flex items-center justify-between w-full">
        {icon}
        {sub && <span className="text-[11px] font-bold opacity-70">{sub}</span>}
      </div>
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <p className="text-[11px] font-medium leading-tight">{label}</p>
    </div>
  );
}

function CodeCounter({ label, count, accent }: { label: string; count: number; accent: string }) {
  const cls = accent === "emerald" ? "text-emerald-700" : accent === "amber" ? "text-amber-700" : "text-rose-700";
  return (
    <div className="px-2 py-3 flex flex-col items-center text-center">
      <span className={`text-2xl font-bold tabular-nums ${cls}`}>{count}</span>
      <span className="text-[10px] font-medium text-slate-500 mt-0.5">{label}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="px-3">{children}</div>
    </div>
  );
}
