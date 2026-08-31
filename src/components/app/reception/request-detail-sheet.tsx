"use client";

// RequestDetailSheet — full request detail with timeline + action buttons.

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, CheckCircle2, XCircle, User, Bell, Send } from "lucide-react";
import { ReceptLocale, t } from "./i18n";
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
    completedAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
    stay: {
      id: string;
      stayNumber: string;
      guest: { id: string; fullName: string; phone: string } | null;
      room: { id: string; roomNumber: string } | null;
    } | null;
    room: { id: string; roomNumber: string; floor: number } | null;
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
  locale: ReceptLocale;
}

export function RequestDetailSheet({ requestId, onClose, locale }: Props) {
  const isRTL = locale === "ar";
  const open = !!requestId;
  const { data, loading, error, refresh } = useFetch<RequestDetail>(requestId ? `/api/app/reception/requests/${requestId}` : "", {
    enabled: !!requestId,
    intervalMs: 15_000,
  });

  const [assignTo, setAssignTo] = React.useState("");
  const [note, setNote] = React.useState("");
  const [cancelReason, setCancelReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Reset state when request changes
  React.useEffect(() => {
    if (requestId) {
      setAssignTo("");
      setNote("");
      setCancelReason("");
    }
  }, [requestId]);

  async function handleAction(action: "acknowledge" | "assign" | "progress" | "complete" | "cancel" | "message") {
    if (!requestId) return;
    setSubmitting(true);
    let body: Record<string, unknown> = {};
    if (action === "assign") {
      body.assignedTo = assignTo.trim();
      if (!body.assignedTo) { setSubmitting(false); toast.error(locale === "ar" ? "أدخل اسم الموظف" : "Enter staff name"); return; }
    }
    if (action === "progress" || action === "complete") body.note = note.trim() || undefined;
    if (action === "cancel") {
      body.reason = cancelReason.trim();
      if (!body.reason) { setSubmitting(false); toast.error(locale === "ar" ? "أدخل السبب" : "Enter reason"); return; }
    }
    if (action === "message") {
      body.body = note.trim();
      if (!body.body) { setSubmitting(false); toast.error(locale === "ar" ? "أدخل رسالة" : "Enter message"); return; }
    }
    const res = await apiPost(`/api/app/reception/requests/${requestId}/${action}`, body);
    setSubmitting(false);
    const toastMap: Record<string, string> = {
      acknowledge: t("toastAckOk", locale),
      assign: t("toastAssignOk", locale),
      progress: t("toastProgressOk", locale),
      complete: t("toastCompleteOk", locale),
      cancel: t("toastCancelOk", locale),
      message: t("toastMessageSent", locale),
    };
    if (res.ok) {
      toast.success(toastMap[action]);
      setNote("");
      setCancelReason("");
      setAssignTo("");
      refresh();
    } else {
      toast.error(t("errGeneric", locale));
    }
  }

  const status = data?.request.status;
  const isClosed = status === "COMPLETED" || status === "CANCELLED" || status === "REJECTED";

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[90dvh] p-0 rounded-t-3xl bg-white flex flex-col"
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
                  <div><span className="text-slate-400">{t("room", locale)}: </span><span className="font-semibold">{data.request.room?.roomNumber || "—"}</span></div>
                  <div><span className="text-slate-400">{t("guestName", locale)}: </span><span className="font-semibold">{data.request.stay?.guest?.fullName || "—"}</span></div>
                  {data.request.assignedTo && <div><span className="text-slate-400">{t("assignedTo", locale)}: </span><span className="font-semibold">{data.request.assignedTo}</span></div>}
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
                          {e.fromStatus && e.toStatus && ` (${e.fromStatus} → ${e.toStatus})`}
                        </p>
                        {e.note && <p className="text-[11px] text-slate-600 mt-0.5">{e.note}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">{e.performedBy} • <DateStr value={e.createdAt} locale={locale} withTime /></p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Actions */}
              {!isClosed && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{t("quickActions", locale)}</h4>

                  {/* Status transition buttons */}
                  <div className="flex flex-wrap gap-2">
                    {data.request.status === "NEW" && (
                      <Button onClick={() => handleAction("acknowledge")} disabled={submitting} className="h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700">
                        <Bell className="w-3.5 h-3.5" /> {t("acknowledge", locale)}
                      </Button>
                    )}
                    {(data.request.status === "ACKNOWLEDGED" || data.request.status === "NEW") && (
                      <Button onClick={() => handleAction("progress")} disabled={submitting} className="h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700">
                        <Loader2 className={`w-3.5 h-3.5 ${submitting ? "animate-spin" : ""}`} /> {t("inProgress", locale)}
                      </Button>
                    )}
                    {data.request.status !== "COMPLETED" && (
                      <Button onClick={() => handleAction("complete")} disabled={submitting} className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t("complete", locale)}
                      </Button>
                    )}
                    <Button onClick={() => handleAction("cancel")} disabled={submitting} variant="outline" className="h-9 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50">
                      <XCircle className="w-3.5 h-3.5" /> {t("cancelRequest", locale)}
                    </Button>
                  </div>

                  {/* Assign to */}
                  {data.request.status !== "COMPLETED" && data.request.status !== "CANCELLED" && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">{t("assignTo", locale)}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={assignTo}
                          onChange={(e) => setAssignTo(e.target.value)}
                          placeholder={t("assignToPlaceholder", locale)}
                          className="h-9 text-xs"
                        />
                        <Button
                          onClick={() => handleAction("assign")}
                          disabled={submitting || !assignTo.trim()}
                          className="h-9 text-xs font-bold bg-purple-600 hover:bg-purple-700"
                        >
                          <User className="w-3.5 h-3.5" /> {t("assign", locale)}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Note / message */}
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">{t("addNote", locale)}</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t("note", locale)}
                        className="h-9 text-xs"
                      />
                      <Button
                        onClick={() => handleAction("message")}
                        disabled={submitting || !note.trim()}
                        className="h-9 text-xs font-bold bg-slate-700 hover:bg-slate-800"
                      >
                        <Send className="w-3.5 h-3.5" /> {t("send", locale)}
                      </Button>
                    </div>
                  </div>

                  {/* Cancel reason (if needed) */}
                  {data.request.status !== "CANCELLED" && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">{t("reason", locale)}</Label>
                      <Input
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder={t("reasonPlaceholder", locale)}
                        className="h-9 text-xs mt-1"
                      />
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
    case "CREATED": return <Bell className="w-3 h-3 text-slate-600" />;
    case "ACKNOWLEDGED": return <Bell className="w-3 h-3 text-blue-600" />;
    case "ASSIGNED": return <User className="w-3 h-3 text-purple-600" />;
    case "IN_PROGRESS": return <Loader2 className="w-3 h-3 text-amber-600" />;
    case "COMPLETED": return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    case "CANCELLED": return <XCircle className="w-3 h-3 text-red-600" />;
    case "REJECTED": return <XCircle className="w-3 h-3 text-red-600" />;
    case "NOTE": return <Send className="w-3 h-3 text-slate-600" />;
    default: return <span className="text-[10px]">•</span>;
  }
}

function eventLabel(type: string, locale: ReceptLocale): string {
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
