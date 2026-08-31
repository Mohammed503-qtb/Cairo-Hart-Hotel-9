"use client";

// Reports tab — date range selector, occupancy bar chart, revenue / requests / reservations summaries.
// [Audit Log] button opens the Audit sheet (controlled from parent).

import * as React from "react";
import { BarChart3, Calendar, FileClock, AlertCircle, RefreshCw, TrendingUp, Clock, CheckCircle2, XCircle, Banknote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFetch } from "./use-fetch";
import { AdminLocale, t } from "./i18n";
import { LoadingSpinner, EmptyState, Money } from "@/components/app/shared";

interface ReportsData {
  ok: boolean;
  range: { from: string; to: string; days: number };
  occupancy: Array<{ date: string; occupancyRate: number }>;
  revenue: {
    totalRevenue: number;
    roomRevenue: number;
    serviceRevenue: number;
    paymentsCollected: number;
  };
  requests: {
    total: number;
    byStatus: Record<string, number>;
    avgResponseMinutes: number;
    avgCompletionMinutes: number;
  };
  reservations: {
    total: number;
    confirmed: number;
    cancelled: number;
    noShow: number;
  };
}

interface Props {
  locale: AdminLocale;
  onOpenAudit: () => void;
}

type RangeKey = "7" | "30" | "90";

export function ReportsTab({ locale, onOpenAudit }: Props) {
  const [range, setRange] = React.useState<RangeKey>("30");

  // Compute from/to
  const url = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = parseInt(range, 10);
    const from = new Date(today);
    from.setDate(from.getDate() - (days - 1));
    const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
    const toStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return `/api/app/admin/reports?from=${fromStr}&to=${toStr}`;
  }, [range]);

  const { data, loading, error, refresh } = useFetch<ReportsData>(url, { intervalMs: 60_000 });
  const isRTL = locale === "ar";

  // Compress occupancy data if too many points (e.g. show every nth)
  const occupancyData = React.useMemo(() => {
    if (!data?.occupancy) return [];
    if (data.occupancy.length <= 14) return data.occupancy;
    const step = Math.ceil(data.occupancy.length / 14);
    const out: typeof data.occupancy = [];
    for (let i = 0; i < data.occupancy.length; i += step) {
      out.push(data.occupancy[i]);
    }
    // Always include last
    if (out[out.length - 1] !== data.occupancy[data.occupancy.length - 1]) {
      out.push(data.occupancy[data.occupancy.length - 1]);
    }
    return out;
  }, [data]);

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">{t("tabReports", locale)}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={refresh} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onOpenAudit}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <FileClock className="w-3.5 h-3.5" />
              {t("auditLog", locale)}
            </button>
          </div>
        </div>

        {/* Range selector */}
        <div className="grid grid-cols-3 gap-2">
          {(["7", "30", "90"] as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex items-center justify-center gap-1.5 h-10 rounded-lg text-sm font-bold transition ${
                range === r
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {r === "7" ? t("range7", locale) : r === "30" ? t("range30", locale) : t("range90", locale)}
            </button>
          ))}
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
          {/* Occupancy chart */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                {t("occupancyChart", locale)}
              </h3>
              <span className="text-[10px] text-slate-500">
                {data.range.from} → {data.range.to} ({data.range.days}d)
              </span>
            </div>
            <div className="p-3 h-56">
              {occupancyData.length === 0 ? (
                <EmptyState title={locale === "ar" ? "لا توجد بيانات" : "No data"} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(d: string) => {
                        const dt = new Date(d);
                        return `${dt.getMonth() + 1}/${dt.getDate()}`;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      domain={[0, 100]}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(245, 158, 11, 0.1)" }}
                      contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                      formatter={(value: number) => [`${value}%`, t("kpiOccupancy", locale)]}
                      labelFormatter={(d: string) => new Date(d).toLocaleDateString(isRTL ? "ar-EG" : "en-US")}
                    />
                    <Bar dataKey="occupancyRate" radius={[4, 4, 0, 0]}>
                      {occupancyData.map((entry, idx) => {
                        const v = entry.occupancyRate;
                        const color = v >= 80 ? "#10b981" : v >= 50 ? "#f59e0b" : v >= 20 ? "#f97316" : "#ef4444";
                        return <Cell key={idx} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Revenue summary */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">{t("revenueSummary", locale)}</h3>
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              <Metric label={t("totalRevenue", locale)} value={<Money amount={data.revenue.totalRevenue} locale={locale} />} accent="emerald" />
              <Metric label={t("roomRevenue", locale)} value={<Money amount={data.revenue.roomRevenue} locale={locale} />} accent="amber" />
              <Metric label={t("serviceRevenue", locale)} value={<Money amount={data.revenue.serviceRevenue} locale={locale} />} accent="teal" />
              <Metric label={t("paymentsCollected", locale)} value={<Money amount={data.revenue.paymentsCollected} locale={locale} />} accent="rose" />
            </div>
          </div>

          {/* Requests summary */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">{t("requestsSummary", locale)}</h3>
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              <Metric label={t("totalRequests", locale)} value={String(data.requests.total)} accent="emerald" />
              <Metric label={t("avgResponse", locale)} value={data.requests.avgResponseMinutes > 0 ? `${data.requests.avgResponseMinutes} ${t("minutes", locale)}` : "—"} accent="amber" />
              <Metric label={t("avgCompletion", locale)} value={data.requests.avgCompletionMinutes > 0 ? `${data.requests.avgCompletionMinutes} ${t("minutes", locale)}` : "—"} accent="teal" />
              <div className="bg-white p-3">
                <p className="text-[10px] font-semibold text-slate-500 mb-1">{locale === "ar" ? "بالحالة" : "By status"}</p>
                {Object.keys(data.requests.byStatus).length === 0 ? (
                  <p className="text-xs text-slate-400">—</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(data.requests.byStatus).map(([k, v]) => (
                      <span key={k} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {k.replace(/_/g, " ")}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reservations summary */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">{t("reservationsSummary", locale)}</h3>
            </div>
            <div className="grid grid-cols-4 gap-px bg-slate-100">
              <Metric label={t("totalReservations", locale)} value={String(data.reservations.total)} accent="emerald" />
              <Metric label={t("confirmedReservations", locale)} value={String(data.reservations.confirmed)} accent="teal" />
              <Metric label={t("cancelledReservations", locale)} value={String(data.reservations.cancelled)} accent="rose" />
              <Metric label={t("noShowReservations", locale)} value={String(data.reservations.noShow)} accent="amber" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ACCENT_TEXT: Record<string, string> = {
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  teal: "text-teal-700",
  rose: "text-rose-700",
};

function Metric({ label, value, accent }: { label: string; value: React.ReactNode; accent: string }) {
  return (
    <div className="bg-white p-3">
      <p className="text-[10px] font-semibold text-slate-500 mb-0.5">{label}</p>
      <p className={`text-base font-bold tabular-nums ${ACCENT_TEXT[accent] || ACCENT_TEXT.emerald}`}>{value}</p>
    </div>
  );
}
