"use client";

// CheckInSheet — 4-step bottom sheet for the reception check-in workflow.
//   Step 1: Verify identity (ID input)
//   Step 2: Confirm reservation (read-only summary)
//   Step 3: Assign room (dropdown of available rooms of matching type)
//   Step 4: Success screen with access code (copy + WhatsApp share)

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Copy, MessageCircle, Loader2, AlertCircle, ArrowRight, ArrowLeft, KeyRound, Hotel } from "lucide-react";
import { ReceptLocale, t } from "./i18n";
import { apiPost } from "./use-fetch";
import { StatusBadge, Money, DateStr } from "@/components/app/shared";
import { toast } from "sonner";

export interface CheckInTarget {
  reservationId: string;
  guestName: string;
  roomTypeName?: string;
}

interface Props {
  target: CheckInTarget | null;
  onClose: () => void;
  locale: ReceptLocale;
  onSuccess: () => void;
}

interface ReservationDetail {
  ok: boolean;
  arrivals: Array<{
    id: string;
    bookingReference: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    grandTotal: number;
    paidTotal: number;
    adults: number;
    children: number;
    nights: number;
    rooms: number;
    checkIn: string;
    checkOut: string;
    guest: { id: string; fullName: string; phone: string; email: string | null; countryCode: string };
    items: Array<{
      id: string;
      roomTypeId: string;
      quantity: number;
      nights: number;
      nightlyRate: number;
      subtotal: number;
      roomType: { id: string; slug: string; nameAr: string; nameEn: string } | null;
    }>;
  }>;
}

interface RoomListResp {
  ok: boolean;
  floors: Array<{
    floor: number;
    rooms: Array<{
      id: string;
      roomNumber: string;
      floor: number;
      status: string;
      roomType: { id: string; slug: string; nameAr: string; nameEn: string } | null;
    }>;
  }>;
}

interface CheckinResult {
  ok: boolean;
  stayId?: string;
  stayNumber?: string;
  accessCode?: string;
  roomNumber?: string;
  guestName?: string;
  error?: string;
  data?: unknown;
}

export function CheckInSheet({ target, onClose, locale, onSuccess }: Props) {
  const isRTL = locale === "ar";
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [idNumber, setIdNumber] = React.useState("");
  const [note, setNote] = React.useState("");
  const [reservation, setReservation] = React.useState<ReservationDetail["arrivals"][number] | null>(null);
  const [availableRooms, setAvailableRooms] = React.useState<RoomListResp["floors"][number]["rooms"]>([]);
  const [selectedRoomId, setSelectedRoomId] = React.useState<string>("");
  const [loadingRes, setLoadingRes] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<CheckinResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const open = !!target;

  // Reset when target changes
  React.useEffect(() => {
    if (target) {
      setStep(1);
      setIdNumber("");
      setNote("");
      setReservation(null);
      setAvailableRooms([]);
      setSelectedRoomId("");
      setResult(null);
      setError(null);
      // Fetch the reservation details + room list
      (async () => {
        setLoadingRes(true);
        try {
          const arrRes = await fetch(`/api/app/reception/arrivals?date=${new Date().toISOString().slice(0,10)}`, { cache: "no-store" });
          const arrJson: ReservationDetail = await arrRes.json();
          const found = arrJson.arrivals?.find((a) => a.id === target.reservationId) || null;
          if (!found) {
            setError(locale === "ar" ? "تعذّر العثور على الحجز" : "Reservation not found");
            setStep(2);
            return;
          }
          setReservation(found);
          // Fetch rooms
          const roomsRes = await fetch("/api/app/reception/rooms", { cache: "no-store" });
          const roomsJson: RoomListResp = await roomsRes.json();
          const roomTypeId = found.items[0]?.roomTypeId;
          const allRooms = roomsJson.floors?.flatMap((f) => f.rooms) || [];
          const matching = allRooms.filter((r) => r.roomType?.id === roomTypeId && ["AVAILABLE", "RESERVED"].includes(r.status));
          setAvailableRooms(matching);
          if (matching.length === 1) setSelectedRoomId(matching[0].id);
        } catch {
          setError(locale === "ar" ? "خطأ في الاتصال" : "Network error");
        } finally {
          setLoadingRes(false);
        }
      })();
    }
  }, [target, locale]);

  function handleClose() {
    onClose();
  }

  async function handleConfirmCheckIn() {
    if (!reservation || !selectedRoomId) return;
    setSubmitting(true);
    setError(null);
    const res = await apiPost(`/api/app/reception/arrivals/${reservation.id}/checkin`, {
      roomId: selectedRoomId,
      idNumber: idNumber.trim() || undefined,
      note: note.trim() || undefined,
    });
    setSubmitting(false);
    const r = res as unknown as CheckinResult;
    if (res.ok) {
      setResult(r);
      setStep(4);
      toast.success(t("toastCheckInOk", locale));
    } else {
      const errMap: Record<string, string> = {
        roomNotAvailable: locale === "ar" ? "الغرفة غير متاحة" : "Room not available",
        roomTypeMismatch: locale === "ar" ? "نوع الغرفة لا يطابق" : "Room type mismatch",
        checkInNotToday: locale === "ar" ? "موعد تسجيل الدخول ليس اليوم" : "Check-in date is not today",
        invalidReservationStatus: locale === "ar" ? "حالة الحجز غير صالحة" : "Invalid reservation status",
      };
      setError(errMap[res.error || ""] || t("errGeneric", locale));
    }
  }

  function copyAccessCode() {
    if (!result?.accessCode) return;
    navigator.clipboard?.writeText(result.accessCode).then(() => toast.success(t("copied", locale))).catch(() => {});
  }

  function shareWhatsApp() {
    if (!result?.accessCode || !reservation) return;
    const phone = reservation.guest.countryCode + reservation.guest.phone.replace(/[^0-9]/g, "");
    const body = locale === "ar"
      ? `مرحباً ${reservation.guest.fullName}! رمز دخولك إلى تطبيق الفندق هو: ${result.accessCode}. استمتع بإقامتك في دار الياسمين الملكي.`
      : `Hello ${reservation.guest.fullName}! Your hotel app access code is: ${result.accessCode}. Enjoy your stay at Dar Al-Yasmin Royal.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 flex-row items-center justify-between space-y-0">
          <div>
            <SheetTitle className="text-lg font-bold text-slate-900">{t("checkInTitle", locale)}</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              {reservation ? `${t("bookingRef", locale)}: ${reservation.bookingReference}` : t("loading", locale)}
            </SheetDescription>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-1.5 rounded-full transition-all ${step === n ? "w-6 bg-amber-500" : step > n ? "w-4 bg-emerald-500" : "w-4 bg-slate-200"}`}
              />
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loadingRes ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <p className="text-sm text-slate-500 mt-2">{t("loading", locale)}</p>
            </div>
          ) : error && step !== 4 ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-none" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : step === 1 ? (
            <Step1
              locale={locale}
              reservation={reservation}
              idNumber={idNumber}
              setIdNumber={setIdNumber}
              onNext={() => setStep(2)}
            />
          ) : step === 2 ? (
            <Step2
              locale={locale}
              reservation={reservation}
              note={note}
              setNote={setNote}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          ) : step === 3 ? (
            <Step3
              locale={locale}
              reservation={reservation}
              availableRooms={availableRooms}
              selectedRoomId={selectedRoomId}
              setSelectedRoomId={setSelectedRoomId}
              submitting={submitting}
              onBack={() => setStep(2)}
              onSubmit={handleConfirmCheckIn}
            />
          ) : step === 4 && result ? (
            <Step4
              locale={locale}
              result={result}
              onCopy={copyAccessCode}
              onWhatsApp={shareWhatsApp}
              onDone={onSuccess}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Step1({ locale, reservation, idNumber, setIdNumber, onNext }: {
  locale: ReceptLocale;
  reservation: ReservationDetail["arrivals"][number] | null;
  idNumber: string;
  setIdNumber: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1">{t("stepVerify", locale)}</h3>
        <p className="text-sm text-slate-500 mb-3">
          {locale === "ar" ? "تحقق من هوية النزيل وأدخل رقمها للمحفوظات." : "Verify the guest's identity and record the ID number."}
        </p>
      </div>
      {reservation && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
          <p className="text-base font-bold text-emerald-900">{reservation.guest.fullName}</p>
          <p className="text-xs text-emerald-700">{t("phone", locale)}: {reservation.guest.countryCode} {reservation.guest.phone}</p>
          {reservation.guest.email && <p className="text-xs text-emerald-700">{t("email", locale)}: {reservation.guest.email}</p>}
        </div>
      )}
      <div>
        <Label className="text-sm font-semibold text-slate-700">{t("idNumber", locale)}</Label>
        <Input
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          placeholder={t("idNumberPlaceholder", locale)}
          className="mt-1 h-12 text-base"
          dir="ltr"
        />
      </div>
      <Button onClick={onNext} disabled={!reservation} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base">
        {t("next", locale)}
        {locale === "ar" ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
      </Button>
    </div>
  );
}

function Step2({ locale, reservation, note, setNote, onBack, onNext }: {
  locale: ReceptLocale;
  reservation: ReservationDetail["arrivals"][number] | null;
  note: string;
  setNote: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  if (!reservation) return null;
  const item = reservation.items[0];
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1">{t("stepConfirm", locale)}</h3>
        <p className="text-sm text-slate-500">{locale === "ar" ? "راجع تفاصيل الحجز قبل تسجيل الدخول." : "Review the reservation before check-in."}</p>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-sm">
        <Row label={t("bookingRef", locale)} value={reservation.bookingReference} />
        <Row label={t("guestName", locale)} value={reservation.guest.fullName} />
        <Row label={t("phone", locale)} value={`${reservation.guest.countryCode} ${reservation.guest.phone}`} />
        <Row label={t("roomType", locale)} value={locale === "ar" ? item?.roomType?.nameAr || "—" : item?.roomType?.nameEn || "—"} />
        <Row label={t("nights", locale)} value={`${reservation.nights} (${locale === "ar" ? "من" : "from"} ${new Date(reservation.checkIn).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")} ${locale === "ar" ? "إلى" : "to"} ${new Date(reservation.checkOut).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")})`} />
        <Row label={t("guests", locale)} value={`${reservation.adults} ${t("adults", locale)}${reservation.children ? ` + ${reservation.children} ${t("children", locale)}` : ""}`} />
        <Row label={t("paymentStatus", locale)} value={<StatusBadge status={reservation.paymentStatus} />} />
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <span className="text-slate-500">{t("balance", locale)}</span>
          <span className="font-bold text-emerald-700"><Money amount={Math.max(0, reservation.grandTotal - reservation.paidTotal)} locale={locale} /></span>
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold text-slate-700">{t("note", locale)}</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={locale === "ar" ? "ملاحظة اختيارية" : "Optional note"}
          className="mt-1 h-11"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12 text-base font-bold">
          {locale === "ar" ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          {t("back", locale)}
        </Button>
        <Button onClick={onNext} className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base">
          {t("next", locale)}
          {locale === "ar" ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}

function Step3({ locale, reservation, availableRooms, selectedRoomId, setSelectedRoomId, submitting, onBack, onSubmit }: {
  locale: ReceptLocale;
  reservation: ReservationDetail["arrivals"][number] | null;
  availableRooms: RoomListResp["floors"][number]["rooms"];
  selectedRoomId: string;
  setSelectedRoomId: (v: string) => void;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  if (!reservation) return null;
  const roomType = reservation.items[0]?.roomType;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1">{t("stepAssign", locale)}</h3>
        <p className="text-sm text-slate-500">
          {locale === "ar"
            ? `اختر غرفة متاحة من نوع ${roomType?.nameAr || ""}.`
            : `Pick an available room of type ${roomType?.nameEn || ""}.`}
        </p>
      </div>
      {availableRooms.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-none" />
          <p className="text-sm text-amber-700">{t("noRoomsAvailable", locale)}</p>
        </div>
      ) : (
        <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
          <SelectTrigger className="h-12 text-base w-full">
            <SelectValue placeholder={t("selectRoom", locale)} />
          </SelectTrigger>
          <SelectContent>
            {availableRooms.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <span className="font-bold">{r.roomNumber}</span>
                <span className="text-slate-400 ms-1">• {t("floor", locale)} {r.floor}</span>
                <span className="ms-2"><StatusBadge status={r.status} /></span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex gap-2 pt-2">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12 text-base font-bold" disabled={submitting}>
          {locale === "ar" ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          {t("back", locale)}
        </Button>
        <Button onClick={onSubmit} disabled={!selectedRoomId || submitting} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
            <Hotel className="w-4 h-4" /> {t("checkIn", locale)}
          </>}
        </Button>
      </div>
    </div>
  );
}

function Step4({ locale, result, onCopy, onWhatsApp, onDone }: {
  locale: ReceptLocale;
  result: CheckinResult;
  onCopy: () => void;
  onWhatsApp: () => void;
  onDone: () => void;
}) {
  return (
    <div className="space-y-5 flex flex-col items-center text-center pt-4">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900">{t("checkInSuccess", locale)}</h3>
        <p className="text-sm text-slate-500 mt-1">
          {t("stayNumber", locale)}: <span className="font-bold text-slate-700">{result.stayNumber}</span> • {t("room", locale)} {result.roomNumber}
        </p>
      </div>
      <div className="w-full bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-dashed border-amber-300 rounded-2xl p-4">
        <div className="flex items-center gap-2 text-amber-700 mb-2">
          <KeyRound className="w-4 h-4" />
          <p className="text-xs font-bold uppercase tracking-wide">{t("accessCode", locale)}</p>
        </div>
        <p className="text-3xl font-mono font-bold text-emerald-900 tracking-wider" dir="ltr">{result.accessCode}</p>
        <p className="text-[11px] text-amber-700 mt-2">{t("accessCodeHint", locale)}</p>
      </div>
      <div className="w-full space-y-2">
        <Button onClick={onCopy} variant="outline" className="w-full h-12 text-base font-bold">
          <Copy className="w-4 h-4" /> {t("copy", locale)}
        </Button>
        <Button onClick={onWhatsApp} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base">
          <MessageCircle className="w-4 h-4" /> {t("sendWhatsapp", locale)}
        </Button>
      </div>
      <Button onClick={onDone} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base">
        {t("done", locale)}
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 text-end">{value}</span>
    </div>
  );
}
