"use client";

// RequestsTab — request queue with status filters.

import * as React from "react";
import { AlertCircle, RefreshCw, BellRing, ChevronLeft } from "lucide-react";
import { useFetch } from "./use-fetch";
import { ReceptLocale, t } from "./i18n";
import { StatusBadge, PriorityBadge, EmptyState, LoadingSpinner } from "@/components/app/shared";

interface RequestsData {
  ok: boolean;
  requests: Array<{
    id: string;
    requestNumber: number;
    category: string;
    service: string;
    title: string;
    priority: string;
    status: string;
    assignedTo: string | null;
    createdAt: string;
    completedAt: string | null;
    cancelledAt: string | null;
    guestName: string;
    guestId: string;
    stayId: string;
    roomNumber: string;
  }>;
}

interface Props {
  locale: ReceptLocale;
  onView: (id: string) => void;
}

const FILTER_TABS = [
  { key: "all", labelKey: "all" as const },
  { key: "NEW", labelKey: "new" as const },
  { key: "IN_PROGRESS", labelKey: "inProgress" as const },
  { key: "COMPLETED", labelKey: "completed" as const },
];

export function RequestsTab({ locale, onView }: Props) {
  const [filter, setFilter] = React.useState<string>("all");
  const url = filter === "all" ? "/api/app/reception/requests" : `/api/app/reception/requests?status=${filter}`;
  const { data, loading, error, refresh } = useFetch<RequestsData>(url, { intervalMs: 15_000 });

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-900">{t("tabRequests", locale)}</h2>
          <button onClick={refresh} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label={t("refresh", locale)}>
            <RefreshCw className={`w-4 h-4 ${loading && data ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                filter === tab.key
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t(tab.labelKey, locale)}
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
      ) : !data ? null : data.requests.length === 0 ? (
        <EmptyState icon={<BellRing className="w-7 h-7" />} title={t("noRequests", locale)} />
      ) : (
        <ul className="p-3 space-y-2">
          {data.requests.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => onView(r.id)}
                className="w-full bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-amber-300 transition text-start"
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                  {r.assignedTo && <span className="text-[10px] text-slate-500">• {r.assignedTo}</span>}
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-slate-500 truncate">
                    {t("room", locale)} {r.roomNumber} • {r.guestName}
                  </p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">
                    {timeAgo(r.createdAt, locale)}
                  </p>
                </div>
                <div className="flex items-center justify-end mt-1.5 text-amber-700">
                  <span className="text-[11px] font-semibold">{t("view", locale)}</span>
                  <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
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
