"use client";

// NotificationsSheet — lists guest notifications, with mark-as-read on tap.

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bell, BellOff, CheckCheck } from "lucide-react";
import { GuestLocale, t } from "./i18n";
import { useFetch, apiPost } from "./use-fetch";
import { LoadingSpinner, DateStr } from "@/components/app/shared";
import { toast } from "sonner";

interface NotificationsData {
  ok: boolean;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    type: string;
    isRead: boolean;
    requestId: string | null;
    stayId: string | null;
    createdAt: string;
  }>;
  unreadCount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  locale: GuestLocale;
}

export function NotificationsSheet({ open, onClose, locale }: Props) {
  const isRTL = locale === "ar";
  const { data, loading, error, refresh } = useFetch<NotificationsData>(open ? "/api/app/guest/notifications" : "", {
    enabled: open,
  });

  async function handleMarkAll() {
    const res = await apiPost("/api/app/guest/notifications", { all: true });
    if (res.ok) {
      toast.success(t("toastNotificationsCleared", locale));
      refresh();
    } else {
      toast.error(t("errGeneric", locale));
    }
  }

  async function handleMarkOne(id: string) {
    const res = await apiPost("/api/app/guest/notifications", { id });
    if (res.ok) {
      refresh();
    } else {
      toast.error(t("errGeneric", locale));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[80dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-0 flex-row items-center justify-between">
          <div>
            <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              {t("notificationsTitle", locale)}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              {data ? `${data.unreadCount} ${t("unread", locale)}` : t("loading", locale)}
            </SheetDescription>
          </div>
          {data && data.unreadCount > 0 && (
            <Button onClick={handleMarkAll} variant="outline" size="sm" className="h-8 text-xs">
              <CheckCheck className="w-3.5 h-3.5" />
              {t("markAllRead", locale)}
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && !data ? (
            <LoadingSpinner label={t("loading", locale)} />
          ) : error ? (
            <div className="m-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-none" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : !data ? null : data.notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BellOff className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">{t("noNotifications", locale)}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => !n.isRead && handleMarkOne(n.id)}
                    className={`w-full text-start px-4 py-3 hover:bg-slate-50 transition ${!n.isRead ? "bg-amber-50/40" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-none ${n.isRead ? "bg-transparent" : "bg-amber-500 animate-pulse"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.isRead ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>{n.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-wrap">{n.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          <DateStr value={n.createdAt} locale={locale} withTime />
                        </p>
                      </div>
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
