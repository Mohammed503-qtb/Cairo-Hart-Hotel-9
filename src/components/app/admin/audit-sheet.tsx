"use client";

// AuditSheet — full-screen bottom sheet listing last 100 audit log entries.

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Loader2, AlertCircle, FileClock } from "lucide-react";
import { AdminLocale, t } from "./i18n";
import { useFetch } from "./use-fetch";
import { EmptyState } from "@/components/app/shared";

interface AuditData {
  ok: boolean;
  logs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    performedBy: string;
    details: unknown;
    createdAt: string;
  }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  locale: AdminLocale;
}

const ACTION_COLORS: Record<string, string> = {
  CODE_GENERATED: "bg-emerald-100 text-emerald-700",
  CODE_REVOKED: "bg-rose-100 text-rose-700",
  STAFF_CREATED: "bg-amber-100 text-amber-700",
  STAFF_UPDATED: "bg-blue-100 text-blue-700",
  HOTEL_SETTINGS_UPDATED: "bg-purple-100 text-purple-700",
  CHECK_IN: "bg-emerald-100 text-emerald-700",
  CHECK_OUT: "bg-slate-100 text-slate-700",
  PAYMENT_RECORDED: "bg-teal-100 text-teal-700",
};

export function AuditSheet({ open, onClose, locale }: Props) {
  const isRTL = locale === "ar";
  const url = open ? "/api/app/admin/audit" : null;
  const { data, loading, error, refresh } = useFetch<AuditData>(url);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 flex-row items-center justify-between space-y-0">
          <div>
            <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileClock className="w-4 h-4 text-amber-600" />
              {t("auditTitle", locale)}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              {data ? `${data.logs.length} ${locale === "ar" ? "سجل" : "entries"}` : t("loading", locale)}
            </SheetDescription>
          </div>
          <button onClick={refresh} className="text-xs font-bold text-amber-700 hover:text-amber-800 px-2 py-1 rounded">
            {t("refresh", locale)}
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : error ? (
            <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} action={
              <button onClick={refresh} className="text-amber-700 font-semibold text-sm">{t("retry", locale)}</button>
            } />
          ) : !data || data.logs.length === 0 ? (
            <EmptyState icon={<FileClock className="w-7 h-7" />} title={t("noAuditLogs", locale)} />
          ) : (
            <ul className="space-y-1.5">
              {data.logs.map((l) => {
                const colorCls = ACTION_COLORS[l.action] || "bg-slate-100 text-slate-700";
                const dateStr = new Date(l.createdAt).toLocaleString(isRTL ? "ar-EG" : "en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                let detailStr = "";
                if (l.details && typeof l.details === "object") {
                  try {
                    detailStr = JSON.stringify(l.details);
                    if (detailStr.length > 200) detailStr = detailStr.slice(0, 200) + "…";
                  } catch {
                    detailStr = String(l.details);
                  }
                } else if (l.details) {
                  detailStr = String(l.details);
                }
                return (
                  <li key={l.id} className="bg-white border border-slate-200 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colorCls}`}>{l.action}</span>
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          {l.entityType} <span className="text-slate-400 font-mono text-[10px]">#{l.entityId.slice(-6)}</span>
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 flex-none text-end" dir="ltr">{dateStr}</p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {t("auditBy", locale)}: <span className="font-semibold text-slate-700">{l.performedBy}</span>
                    </p>
                    {detailStr && (
                      <p className="text-[10px] text-slate-400 font-mono mt-1 break-words" dir="ltr">{detailStr}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
