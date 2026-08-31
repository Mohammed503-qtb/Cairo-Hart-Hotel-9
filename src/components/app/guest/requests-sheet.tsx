"use client";

// RequestsSheet — "My Requests" sheet listing the guest's requests with status filter.
// Tap a request → opens RequestDetailSheet (managed by the parent).

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertCircle, RefreshCw, BellRing, ChevronLeft } from "lucide-react";
import { GuestLocale, t } from "./i18n";
import { useFetch } from "./use-fetch";
import { StatusBadge, PriorityBadge, EmptyState, LoadingSpinner } from "@/components/app/shared";

interface RequestsData {
  ok: boolean;
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
    preferredTime: string | null;
    relatedChargeId: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
    eventsCount: number;
  }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  locale: GuestLocale;
  onView: (id: string) => void;
}

const FILTERS = [
  { key: "all", labelKey: "filterAll" as const },
  { key: "active", labelKey: "filterActive" as const },
  { key: "completed", labelKey: "filterCompleted" as const },
];

export function RequestsSheet({ open, onClose, locale, onView }: Props) {
  const isRTL = locale === "ar";
  const [filter, setFilter] = React.useState<string>("all");
  const url = open ? `/api/app/guest/requests?status=${filter}` : "";
  const { data, loading, error, refresh } = useFetch<RequestsData>(url, {
    enabled: open,
    intervalMs: 15_000,
  });

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[88dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-bold text-slate-900">{t("requestsTitle", locale)}</SheetTitle>
              <SheetDescription className="text-xs text-slate-500">
                {data ? `${data.requests.length}` : ""} {t("requestsTitle", locale).toLowerCase()}
              </SheetDescription>
            </div>
            <button onClick={refresh} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label={t("refresh", locale)}>
              <RefreshCw className={`w-4 h-4 ${loading && data ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex gap-1 mt-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  filter === f.key
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t(f.labelKey, locale)}
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
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
                      {r.relatedChargeId && <span className="text-[10px] text-amber-600 font-bold">● {t("chargeable", locale)}</span>}
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                    {r.description && <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{r.description}</p>}
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[11px] text-slate-500">#{r.requestNumber} • {categoryLabel(r.category, locale)}</p>
                      <p className="text-[10px] text-slate-400 whitespace-nowrap">{timeAgo(r.createdAt, locale)}</p>
                    </div>
                    <div className="flex items-center justify-end mt-1.5 text-amber-700">
                      <span className="text-[11px] font-semibold">{t("requestDetail", locale)}</span>
                      <ChevronLeft className="w-3 h-3 rtl:rotate-180" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function categoryLabel(slug: string, locale: GuestLocale): string {
  const map: Record<string, { ar: string; en: string }> = {
    housekeeping: { ar: "تنظيف", en: "Housekeeping" },
    maintenance: { ar: "صيانة", en: "Maintenance" },
    guest_services: { ar: "ضيافة", en: "Guest Services" },
    reception: { ar: "استقبال", en: "Reception" },
    other: { ar: "أخرى", en: "Other" },
  };
  return map[slug]?.[locale] || slug;
}

function timeAgo(iso: string, locale: GuestLocale): string {
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
