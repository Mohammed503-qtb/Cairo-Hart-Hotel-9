"use client";

// RoomStatusBoard — full-screen sheet with floor selector + grid of room tiles.

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { ReceptLocale, t } from "./i18n";
import { useFetch, apiPost } from "./use-fetch";
import { LoadingSpinner } from "@/components/app/shared";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RoomBoardData {
  ok: boolean;
  floors: Array<{
    floor: number;
    rooms: Array<{
      id: string;
      roomNumber: string;
      floor: number;
      status: string;
      notes: string | null;
      roomType: { id: string; slug: string; nameAr: string; nameEn: string } | null;
      currentStay: {
        id: string;
        stayNumber: string;
        checkIn: string;
        checkOut: string;
        guestName: string;
        guestId: string;
      } | null;
    }>;
  }>;
  statusCounts: Record<string, number>;
  total: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  locale: ReceptLocale;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700 border-emerald-300",
  RESERVED: "bg-blue-100 text-blue-700 border-blue-300",
  OCCUPIED: "bg-rose-100 text-rose-700 border-rose-300",
  DIRTY: "bg-orange-100 text-orange-700 border-orange-300",
  CLEANING: "bg-amber-100 text-amber-700 border-amber-300",
  CLEAN: "bg-teal-100 text-teal-700 border-teal-300",
  INSPECTED: "bg-cyan-100 text-cyan-700 border-cyan-300",
  OUT_OF_ORDER: "bg-slate-200 text-slate-600 border-slate-400",
  OUT_OF_SERVICE: "bg-slate-300 text-slate-700 border-slate-500",
};

// Allowed transitions per current status (mirrors backend)
const ALLOWED_NEXT: Record<string, string[]> = {
  AVAILABLE: ["RESERVED", "OCCUPIED", "OUT_OF_ORDER", "OUT_OF_SERVICE"],
  RESERVED: ["AVAILABLE", "OCCUPIED", "OUT_OF_ORDER", "OUT_OF_SERVICE"],
  OCCUPIED: ["DIRTY", "OUT_OF_ORDER"],
  DIRTY: ["CLEANING", "OUT_OF_ORDER", "OUT_OF_SERVICE"],
  CLEANING: ["CLEAN", "DIRTY"],
  CLEAN: ["INSPECTED", "DIRTY"],
  INSPECTED: ["AVAILABLE", "DIRTY"],
  OUT_OF_ORDER: ["DIRTY"],
  OUT_OF_SERVICE: ["DIRTY"],
};

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  AVAILABLE: { ar: "متاحة", en: "Available" },
  RESERVED: { ar: "محجوزة", en: "Reserved" },
  OCCUPIED: { ar: "مشغولة", en: "Occupied" },
  DIRTY: { ar: "متسخة", en: "Dirty" },
  CLEANING: { ar: "تنظف", en: "Cleaning" },
  CLEAN: { ar: "نظيفة", en: "Clean" },
  INSPECTED: { ar: "تم فحصها", en: "Inspected" },
  OUT_OF_ORDER: { ar: "خارج الخدمة", en: "Out of Order" },
  OUT_OF_SERVICE: { ar: "صيانة", en: "Out of Service" },
};

export function RoomStatusBoard({ open, onClose, locale }: Props) {
  const isRTL = locale === "ar";
  const { data, loading, error, refresh } = useFetch<RoomBoardData>("/api/app/reception/rooms", { enabled: open, intervalMs: 20_000 });
  const [selectedRoom, setSelectedRoom] = React.useState<RoomBoardData["floors"][number]["rooms"][number] | null>(null);
  const [pendingStatus, setPendingStatus] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  function selectRoom(r: NonNullable<RoomBoardData["floors"][number]["rooms"][number]>) {
    setSelectedRoom(r);
    setPendingStatus("");
  }

  async function submitStatus() {
    if (!selectedRoom || !pendingStatus) return;
    setSubmitting(true);
    const res = await apiPost(`/api/app/reception/rooms/${selectedRoom.id}/status`, { status: pendingStatus });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("toastRoomStatusOk", locale));
      setSelectedRoom(null);
      setPendingStatus("");
      refresh();
    } else {
      const errMap: Record<string, string> = {
        adminRequired: locale === "ar" ? "يتطلب صلاحيات مشرف" : "Admin required",
        transitionNotAllowed: locale === "ar" ? "الانتقال غير مسموح" : "Transition not allowed",
      };
      toast.error(errMap[res.error || ""] || t("errGeneric", locale));
    }
  }

  const allowedStatuses = selectedRoom ? (ALLOWED_NEXT[selectedRoom.status] || []) : [];

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] p-0 rounded-t-3xl bg-cream/40 flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-200 space-y-0">
          <SheetTitle className="text-lg font-bold text-slate-900">{t("roomStatusBoard", locale)}</SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            {data ? `${data.total} ${locale === "ar" ? "غرفة" : "rooms"}` : t("loading", locale)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && !data ? (
            <LoadingSpinner label={t("loading", locale)} />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-none" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : !data ? null : (
            <>
              {/* Status legend */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Object.entries(data.statusCounts).map(([s, count]) => (
                  <span key={s} className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", STATUS_COLORS[s] || "bg-slate-100 text-slate-600 border-slate-200")}>
                    {STATUS_LABELS[s]?.[locale] || s} • {count}
                  </span>
                ))}
              </div>

              {/* Floors grid */}
              <div className="space-y-4">
                {data.floors.map((floor) => (
                  <div key={floor.floor}>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">{t("floor", locale)} {floor.floor}</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {floor.rooms.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => selectRoom(r)}
                          className={cn(
                            "aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1.5 text-center transition hover:scale-105",
                            STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          <span className="text-base font-bold leading-tight">{r.roomNumber}</span>
                          {r.currentStay && (
                            <span className="text-[9px] font-medium leading-tight mt-0.5 truncate w-full">
                              {r.currentStay.guestName.split(" ")[0]}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Room detail / change status sheet */}
        {selectedRoom && (
          <div className="flex-none bg-white border-t-2 border-slate-200 px-5 py-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">{t("room", locale)} {selectedRoom.roomNumber}</h4>
                <p className="text-[11px] text-slate-500">
                  {t("floor", locale)} {selectedRoom.floor} • {locale === "ar" ? selectedRoom.roomType?.nameAr || "—" : selectedRoom.roomType?.nameEn || "—"}
                </p>
              </div>
              <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full border", STATUS_COLORS[selectedRoom.status])}>
                {STATUS_LABELS[selectedRoom.status]?.[locale] || selectedRoom.status}
              </span>
            </div>

            {selectedRoom.currentStay && (
              <div className="bg-slate-50 rounded-lg p-2 text-[11px]">
                <p className="font-semibold text-slate-700">{selectedRoom.currentStay.guestName}</p>
                <p className="text-slate-500">{selectedRoom.currentStay.stayNumber}</p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold text-slate-700 mb-1.5">{t("changeStatus", locale)}</p>
              <Select value={pendingStatus} onValueChange={setPendingStatus}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder={locale === "ar" ? "اختر الحالة" : "Select status"} /></SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]?.[locale] || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => { setSelectedRoom(null); setPendingStatus(""); }} variant="outline" className="flex-1 h-10 text-sm font-bold">
                {t("cancel", locale)}
              </Button>
              <Button onClick={submitStatus} disabled={!pendingStatus || submitting} className="flex-1 h-10 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t("confirm", locale)}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
