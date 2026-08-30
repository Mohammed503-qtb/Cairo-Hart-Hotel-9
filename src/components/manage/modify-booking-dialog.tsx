"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useT, useLocalized } from "@/hooks/use-t";
import { formatMoney, formatDate, calculateNights, fromISODate, toISODate, addDays } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ar } from "date-fns/locale";
import { format as fnsFormat } from "date-fns";
import {
  X,
  Loader2,
  Calendar,
  Users,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export interface ModifyReservationData {
  bookingReference: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  rooms: number;
  grandTotal: number;
  currency: string;
  specialRequest: string | null;
  roomTypeId: string;
  roomTypeNameAr: string;
  roomTypeNameEn: string;
  phone: string; // registered phone for verification
}

export interface ModifyBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: ModifyReservationData | null;
  roomTypes: { id: string; nameAr: string; nameEn: string; basePrice: number; maxAdults: number; maxChildren: number; slug: string }[];
  onModified: () => void;
}

export function ModifyBookingDialog({
  open,
  onOpenChange,
  reservation,
  roomTypes,
  onModified,
}: ModifyBookingDialogProps) {
  const { t, locale } = useT();
  const loc = useLocalized();

  // Form state
  const [newCheckIn, setNewCheckIn] = useState<string>("");
  const [newCheckOut, setNewCheckOut] = useState<string>("");
  const [newAdults, setNewAdults] = useState<number>(2);
  const [newChildren, setNewChildren] = useState<number>(0);
  const [newRooms, setNewRooms] = useState<number>(1);
  const [newRoomTypeId, setNewRoomTypeId] = useState<string>("");
  const [newSpecialRequest, setNewSpecialRequest] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [ciOpen, setCiOpen] = useState(false);
  const [coOpen, setCoOpen] = useState(false);

  // Initialize form when reservation changes
  useEffect(() => {
    if (reservation && open) {
      setNewCheckIn(reservation.checkIn.split("T")[0]);
      setNewCheckOut(reservation.checkOut.split("T")[0]);
      setNewAdults(reservation.adults);
      setNewChildren(reservation.children);
      setNewRooms(reservation.rooms);
      setNewRoomTypeId(reservation.roomTypeId);
      setNewSpecialRequest(reservation.specialRequest || "");
    }
  }, [reservation, open]);

  if (!reservation) return null;

  const currentRoomType = roomTypes.find((r) => r.id === reservation.roomTypeId);
  const targetRoomType = roomTypes.find((r) => r.id === newRoomTypeId) || currentRoomType;
  const newNights =
    newCheckIn && newCheckOut ? calculateNights(fromISODate(newCheckIn), fromISODate(newCheckOut)) : reservation.nights;

  // Compute new price (client-side preview; server will recalculate authoritatively)
  const newSubtotal = targetRoomType ? targetRoomType.basePrice * newNights * newRooms : reservation.grandTotal;
  const newTax = newSubtotal * 0.05; // 5% tax
  const newService = newSubtotal * 0.02; // 2% service
  const newGrandTotal = Math.round((newSubtotal + newTax + newService) * 100) / 100;
  const priceDiff = newGrandTotal - reservation.grandTotal;

  // Determine which changes will be applied
  const changes: string[] = [];
  if (newCheckIn !== reservation.checkIn.split("T")[0] || newCheckOut !== reservation.checkOut.split("T")[0]) {
    changes.push("DATES");
  }
  if (newAdults !== reservation.adults || newChildren !== reservation.children) {
    changes.push("GUESTS");
  }
  if (newRooms !== reservation.rooms) {
    changes.push("ROOMS");
  }
  if (newRoomTypeId !== reservation.roomTypeId) {
    changes.push("ROOM_TYPE");
  }
  if (newSpecialRequest !== (reservation.specialRequest || "")) {
    changes.push("REQUEST");
  }

  const hasChanges = changes.length > 0;

  const handleSubmit = async () => {
    if (!hasChanges) {
      toast.error(t("manage.modifyError.noChanges"));
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        phone: reservation.phone,
      };
      if (changes.includes("DATES")) {
        payload.newCheckIn = newCheckIn;
        payload.newCheckOut = newCheckOut;
      }
      if (changes.includes("GUESTS")) {
        payload.newAdults = newAdults;
        payload.newChildren = newChildren;
      }
      if (changes.includes("ROOMS")) {
        payload.newRooms = newRooms;
      }
      if (changes.includes("ROOM_TYPE")) {
        payload.newRoomTypeId = newRoomTypeId;
      }
      if (changes.includes("REQUEST")) {
        payload.newSpecialRequest = newSpecialRequest;
      }

      const res = await fetch(`/api/booking/${reservation.bookingReference}/modify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("manage.modified"));
        onOpenChange(false);
        onModified();
      } else {
        const errorKey = data.error || "modifyFailed";
        const translationKey = `manage.modifyError.${errorKey}` as keyof typeof import("@/lib/i18n").translations;
        toast.error(t(translationKey) || t("manage.modifyError.modifyFailed"));
      }
    } catch {
      toast.error(t("manage.modifyError.modifyFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const ciDate = fromISODate(newCheckIn);
  const coDate = fromISODate(newCheckOut);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogTitle asChild>
          <VisuallyHidden>{t("manage.modifyTitle")}</VisuallyHidden>
        </DialogTitle>
        <DialogDescription asChild>
          <VisuallyHidden>{t("manage.modifySubtitle")}</VisuallyHidden>
        </DialogDescription>

        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-cream/40 to-background">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                {t("manage.modifyTitle")}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("manage.modifySubtitle")} •{" "}
                <span className="font-mono font-semibold text-gold" dir="ltr">
                  {reservation.bookingReference}
                </span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full h-9 w-9 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scroll p-5 space-y-5">
          {/* Current booking summary */}
          <div className="rounded-xl bg-cream/40 border border-border/50 p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {locale === "ar" ? "الحجز الحالي" : "Current booking"}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-[10px] text-muted-foreground">{t("booking.checkIn")}</div>
                <div className="font-semibold">{formatDate(fromISODate(reservation.checkIn.split("T")[0]), locale)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">{t("booking.checkOut")}</div>
                <div className="font-semibold">{formatDate(fromISODate(reservation.checkOut.split("T")[0]), locale)}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">{t("booking.guests")}</div>
                <div className="font-semibold">
                  {reservation.adults} {locale === "ar" ? "بالغ" : "adults"}
                  {reservation.children > 0 && ` + ${reservation.children}`}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">{t("booking.total")}</div>
                <div className="font-semibold text-gradient-gold">
                  {formatMoney(reservation.grandTotal, reservation.currency, locale)}
                </div>
              </div>
            </div>
          </div>

          {/* Date modification */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold" />
              {t("manage.modifyCheckIn")} / {t("manage.modifyCheckOut")}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">{t("booking.checkIn")}</Label>
                <Popover open={ciOpen} onOpenChange={setCiOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full h-10 rounded-xl border border-input bg-background px-3 text-start text-sm font-medium hover:border-gold/60 transition-colors">
                      {fnsFormat(ciDate, "d MMM yyyy", { locale: locale === "ar" ? ar : undefined })}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={ciDate}
                      locale={locale === "ar" ? ar : undefined}
                      disabled={(d) => d < addDays(new Date(), 0)}
                      onSelect={(d) => {
                        if (!d) return;
                        setNewCheckIn(toISODate(d));
                        if (coDate <= d) {
                          setNewCheckOut(toISODate(addDays(d, 1)));
                        }
                        setCiOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">{t("booking.checkOut")}</Label>
                <Popover open={coOpen} onOpenChange={setCoOpen}>
                  <PopoverTrigger asChild>
                    <button className="w-full h-10 rounded-xl border border-input bg-background px-3 text-start text-sm font-medium hover:border-gold/60 transition-colors">
                      {fnsFormat(coDate, "d MMM yyyy", { locale: locale === "ar" ? ar : undefined })}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={coDate}
                      locale={locale === "ar" ? ar : undefined}
                      disabled={(d) => d <= ciDate}
                      onSelect={(d) => {
                        if (!d) return;
                        setNewCheckOut(toISODate(d));
                        setCoOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-gold" />
              {newNights} {newNights === 1 ? t("booking.night") : t("booking.nights")}
            </div>
          </div>

          {/* Guests & rooms */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-gold" />
              {t("manage.modifyGuests")} / {t("booking.rooms")}
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <GuestStepper label={t("booking.adults")} value={newAdults} min={1} max={4} onChange={setNewAdults} />
              <GuestStepper label={t("booking.children")} value={newChildren} min={0} max={3} onChange={setNewChildren} />
              <GuestStepper label={t("booking.rooms")} value={newRooms} min={1} max={5} onChange={setNewRooms} />
            </div>
          </div>

          {/* Room type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">{t("manage.modifyRoomType")}</Label>
            <Select value={newRoomTypeId} onValueChange={setNewRoomTypeId}>
              <SelectTrigger className="rounded-xl h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {loc(rt.nameAr, rt.nameEn)} — {formatMoney(rt.basePrice, reservation.currency, locale)}/
                    {t("booking.night")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Special request */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t("manage.modifySpecialRequest")}</Label>
            <Textarea
              value={newSpecialRequest}
              onChange={(e) => setNewSpecialRequest(e.target.value)}
              placeholder={t("booking.specialRequestPlaceholder")}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          {/* Summary of changes */}
          {hasChanges && (
            <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 space-y-3">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-gold" />
                {t("manage.changesApplied")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {changes.map((c) => (
                  <Badge key={c} variant="outline" className="bg-gold/10 border-gold/30 text-gold">
                    {t(`manage.changeType.${c}`)}
                  </Badge>
                ))}
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">{t("booking.total")} ({locale === "ar" ? "جديد" : "new"})</div>
                  <div className="font-bold text-gradient-gold">
                    {formatMoney(newGrandTotal, reservation.currency, locale)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("manage.modifyPriceDiff")}</div>
                  <div className={cn("font-bold flex items-center gap-1", priceDiff > 0 ? "text-amber-600" : priceDiff < 0 ? "text-emerald-600" : "text-muted-foreground")}>
                    {priceDiff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : priceDiff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                    {priceDiff >= 0 ? "+" : ""}
                    {formatMoney(priceDiff, reservation.currency, locale)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!hasChanges && (
            <Alert>
              <AlertDescription>{t("manage.modifyError.noChanges")}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-card flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            {t("manage.modifyCancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || submitting}
            className="rounded-full bg-gold-gradient text-gold-foreground font-semibold"
          >
            {submitting && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
            {t("manage.modifyConfirm")}
            {!submitting && <Arrow className="w-4 h-4 ms-2" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GuestStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-input p-3">
      <div className="text-[10px] text-muted-foreground mb-2 text-center">{label}</div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-7 h-7 rounded-full border border-input flex items-center justify-center hover:bg-accent disabled:opacity-40 text-base"
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-bold tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-7 h-7 rounded-full border border-input flex items-center justify-center hover:bg-accent disabled:opacity-40 text-base"
        >
          +
        </button>
      </div>
    </div>
  );
}
