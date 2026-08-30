"use client";

// RequestDetailSheet — full request detail with timeline + Add Message + Cancel (if allowed).

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, CheckCircle2, XCircle, Bell, Send, Sparkles } from "lucide-react";
import { GuestLocale, t } from "./i18n";
import { useFetch, apiPost } from "./use-fetch";
import { StatusBadge, PriorityBadge, DateStr, LoadingSpinner } from "@/components/app/shared";
import { toast } from "sonner";

interface RequestDetail {
  ok: boolean;
  request: {
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
    events: Array<{
      id: string;
      eventType: string;
      fromStatus: string | null;
      toStatus: string | null;
      note: string | null;
      performedBy: string;
      performedByRole: string;
      createdAt: string;
    }>;
  };
}

interface Props {
  requestId: string | null;
  onClose: () => void;
  locale: GuestLocale;
}

export function RequestDetailSheet({ requestId, onClose, locale }: Props) {
  const isRTL = locale === "ar";
  const open = !!requestId;
  const { data, loading, error, refresh } = useFetch<RequestDetail>(requestId ? `/api/app/guest/requests/${requestId}` : "", {
    enabled: !!requestId,
    intervalMs: 10_000,
  });

  const [note, setNote] = React.useState("");
  const [cancelReason, setCancelReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (requestId) {
      setNote("");
      setCancelReason("");
    }
  }, [requestId]);

  async function handleMessage() {
    if (!requestId || !note.trim()) return;
    setSubmitting(true);
    const res = await apiPost(`/api/app/guest/requests/${requestId}/message`, { body: note.trim() });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("toastMessageSent", locale));
      setNote("");
      refresh();
    } else {
      toast.error(t("errGeneric", locale));
    }
  }

  async function handleCancel() {
    if (!requestId) return;
    setSubmitting(true);
    const res = await apiPost(`/api/app/guest/requests/${requestId}/cancel`, {
      reason: cancelReason.trim() || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("toastRequestCancelled", locale));
      setCancelReason("");
      refresh();
    } else {
      const errMap: Record<string, string> = {
        cannotCancel: t("errCannotCancel", locale),
      };
      toast.error(errMap[res.error || ""] || t("errGeneric", locale));
    }
  }

  const status = data?.request.status;
  const canCancel = status === "NEW" || status === "ACKNOWLEDGED";
  const isClosed = status === "COMPLETED" || status === "CANCELLED" || status === "REJECTED";

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-0">
          <SheetTitle className="text-lg font-bold text-slate-900">{t("requestDetail", locale)}</SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            {data?.request ? `#${data.request.requestNumber} • ${t("requestedAt", locale)} ${timeAgo(data.request.createdAt, locale)}` : t("loading", locale)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && !data ? (
            <LoadingSpinner label={t("loading", locale)} />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-none" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : !data ? null : (
            <div className="space-y-4">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge priority={data.request.priority} />
                  <StatusBadge status={data.request.status} />
                </div>
                <h3 className="text-base font-bold text-slate-900">{data.request.title}</h3>
                {data.request.description && <p className="text-sm text-slate-600">{data.request.description}</p>}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                  <div><span className="text-slate-400">{t("category", locale)}: </span><span className="font-semibold">{categoryLabel(data.request.category, locale)}</span></div>
                  {data.request.preferredTime && <div><span className="text-slate-400">{t("preferredTime", locale)}: </span><span className="font-semibold">{data.request.preferredTime}</span></div>}
                  {data.request.assignedTo && <div><span className="text-slate-400">{t("assignedTo", locale)}: </span><span className="font-semibold">{data.request.assignedTo}</span></div>}
                  {data.request.relatedChargeId && <div className="col-span-2"><span className="text-amber-600">● {t("chargeable", locale)}</span></div>}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">{t("timeline", locale)}</h4>
                <ol className="space-y-2">
                  {data.request.events.map((e) => (
                    <li key={e.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-none bg-slate-100">
                        {eventIcon(e.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">
                          {eventLabel(e.eventType, locale)}
                          {e.fromStatus && e.toStatus && ` (${e.fromStatus.replace(/_/g, " ")} → ${e.toStatus.replace(/_/g, " ")})`}
                        </p>
                        {e.note && <p className="text-[11px] text-slate-600 mt-0.5 whitespace-pre-wrap">{e.note}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">{e.performedBy} • <DateStr value={e.createdAt} locale={locale} withTime /></p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Actions */}
              {!isClosed && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{t("addMessage", locale)}</h4>
                  <div className="flex gap-2">
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t("messagePlaceholder", locale)}
                      className="h-10 text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleMessage(); } }}
                    />
                    <Button
                      onClick={handleMessage}
                      disabled={submitting || !note.trim()}
                      className="h-10 px-4 text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {t("send", locale)}
                    </Button>
                  </div>

                  {canCancel && (
                    <div className="pt-2">
                      <Label className="text-xs font-semibold text-slate-700">{t("cancelReason", locale)}</Label>
                      <Input
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder={t("cancelReasonPlaceholder", locale)}
                        className="h-9 text-xs mt-1"
                      />
                      <Button
                        onClick={handleCancel}
                        disabled={submitting}
                        variant="outline"
                        className="h-10 mt-2 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 w-full"
                      >
                        <XCircle className="w-4 h-4" />
                        {t("cancelRequest", locale)}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function eventIcon(type: string): React.ReactNode {
  switch (type) {
    case "CREATED": return <Sparkles className="w-3 h-3 text-slate-600" />;
    case "ACKNOWLEDGED": return <Bell className="w-3 h-3 text-blue-600" />;
    case "ASSIGNED": return <Bell className="w-3 h-3 text-purple-600" />;
    case "IN_PROGRESS": return <Loader2 className="w-3 h-3 text-amber-600" />;
    case "COMPLETED": return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    case "CANCELLED": return <XCircle className="w-3 h-3 text-red-600" />;
    case "REJECTED": return <XCircle className="w-3 h-3 text-red-600" />;
    case "NOTE": return <Send className="w-3 h-3 text-slate-600" />;
    default: return <span className="text-[10px]">•</span>;
  }
}

function eventLabel(type: string, locale: GuestLocale): string {
  const map: Record<string, { ar: string; en: string }> = {
    CREATED: { ar: "تم الإنشاء", en: "Created" },
    ACKNOWLEDGED: { ar: "تم الاستلام", en: "Acknowledged" },
    ASSIGNED: { ar: "تم الإسناد", en: "Assigned" },
    IN_PROGRESS: { ar: "قيد التنفيذ", en: "In Progress" },
    COMPLETED: { ar: "مكتمل", en: "Completed" },
    CANCELLED: { ar: "ملغى", en: "Cancelled" },
    REJECTED: { ar: "مرفوض", en: "Rejected" },
    NOTE: { ar: "ملاحظة", en: "Note" },
  };
  return map[type]?.[locale] || type;
}

function categoryLabel(slug: string, locale: GuestLocale): string {
  const map: Record<string, { ar: string; en: string }> = {
    housekeeping: { ar: "تنظيف الغرف", en: "Housekeeping" },
    maintenance: { ar: "الصيانة", en: "Maintenance" },
    guest_services: { ar: "خدمات الضيافة", en: "Guest Services" },
    reception: { ar: "الاستقبال", en: "Reception" },
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
