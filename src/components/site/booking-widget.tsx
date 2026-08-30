"use client";

import { useState } from "react";
import { Search, Users, BedDouble, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useT } from "@/hooks/use-t";
import { useBookingStore } from "@/stores/booking-store";
import { useUIStore } from "@/stores/ui-store";
import { useHotel } from "@/hooks/use-data";
import { addDays, fromISODate, toISODate } from "@/lib/format";
import { format as fnsFormat } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function BookingWidget({ variant = "hero" }: { variant?: "hero" | "section" }) {
  const { t, locale } = useT();
  const { checkIn, checkOut, adults, children, rooms, setSearchParams } = useBookingStore();
  const openBooking = useUIStore((s) => s.openBooking);
  const { data: hotel } = useHotel();

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  const maxAdults = hotel?.maxAdultsPerRoom ?? 4;
  const maxChildren = hotel?.maxChildrenPerRoom ?? 3;
  const maxRooms = 5;
  const maxGuests = 10;

  const ciDate = fromISODate(checkIn);
  const coDate = fromISODate(checkOut);
  const nights = Math.max(1, Math.round((coDate.getTime() - ciDate.getTime()) / 86400000));

  const handleSearch = () => {
    if (nights < 1) {
      toast.error(t("booking.invalidDates"));
      return;
    }
    openBooking();
  };

  const guestSummary = locale === "ar"
    ? `${adults} ${adults === 1 ? "بالغ" : "بالغين"}${children > 0 ? ` • ${children} ${children === 1 ? "طفل" : "أطفال"}` : ""} • ${rooms} ${rooms === 1 ? "غرفة" : "غرف"}`
    : `${adults} ${adults === 1 ? "adult" : "adults"}${children > 0 ? ` • ${children} ${children === 1 ? "child" : "children"}` : ""} • ${rooms} ${rooms === 1 ? "room" : "rooms"}`;

  return (
    <div
      className={cn(
        "rounded-2xl bg-card/95 backdrop-blur-xl shadow-luxury border border-gold/30 p-4 sm:p-6",
        variant === "hero" ? "glass" : ""
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-3 items-end">
        {/* Check-in */}
        <div className="md:col-span-3">
          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> {t("booking.checkIn")}
          </Label>
          <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
            <PopoverTrigger asChild>
              <button className="w-full h-11 rounded-xl border border-input bg-background px-3 text-start text-sm font-medium hover:border-gold/60 transition-colors flex items-center justify-between">
                <span className="truncate">{fnsFormat(ciDate, locale === "ar" ? "d MMM yyyy" : "d MMM yyyy", { locale: locale === "ar" ? ar : undefined })}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={ciDate}
                locale={locale === "ar" ? ar : undefined}
                disabled={(d) => d < addDays(new Date(), 0) || d > addDays(new Date(), hotel?.bookingHorizonDays ?? 365)}
                onSelect={(d) => {
                  if (!d) return;
                  const iso = toISODate(d);
                  setSearchParams({ checkIn: iso });
                  if (coDate <= d) {
                    setSearchParams({ checkOut: toISODate(addDays(d, 1)) });
                  }
                  setCheckInOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Check-out */}
        <div className="md:col-span-3">
          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> {t("booking.checkOut")}
          </Label>
          <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
            <PopoverTrigger asChild>
              <button className="w-full h-11 rounded-xl border border-input bg-background px-3 text-start text-sm font-medium hover:border-gold/60 transition-colors flex items-center justify-between">
                <span className="truncate">{fnsFormat(coDate, locale === "ar" ? "d MMM yyyy" : "d MMM yyyy", { locale: locale === "ar" ? ar : undefined })}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={coDate}
                locale={locale === "ar" ? ar : undefined}
                disabled={(d) => d <= ciDate || d > addDays(new Date(), (hotel?.bookingHorizonDays ?? 365) + 30)}
                onSelect={(d) => {
                  if (!d) return;
                  setSearchParams({ checkOut: toISODate(d) });
                  setCheckOutOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guests + rooms */}
        <div className="md:col-span-3">
          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {t("booking.guests")}
          </Label>
          <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
            <PopoverTrigger asChild>
              <button className="w-full h-11 rounded-xl border border-input bg-background px-3 text-start text-sm font-medium hover:border-gold/60 transition-colors flex items-center justify-between">
                <span className="truncate">{guestSummary}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="start">
              <div className="space-y-4">
                <GuestStepper
                  label={t("booking.adults")}
                  value={adults}
                  min={1}
                  max={Math.min(maxAdults * rooms, maxGuests)}
                  onChange={(v) => setSearchParams({ adults: v })}
                />
                <GuestStepper
                  label={t("booking.children")}
                  value={children}
                  min={0}
                  max={Math.min(maxChildren * rooms, maxGuests)}
                  onChange={(v) => setSearchParams({ children: v })}
                />
                <GuestStepper
                  label={t("booking.rooms")}
                  value={rooms}
                  min={1}
                  max={maxRooms}
                  onChange={(v) => setSearchParams({ rooms: v })}
                />
                <Button size="sm" className="w-full bg-gold-gradient text-gold-foreground" onClick={() => setGuestsOpen(false)}>
                  {t("common.close")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search button */}
        <div className="md:col-span-3">
          <Button
            onClick={handleSearch}
            className="w-full h-11 bg-luxury-gradient text-primary-foreground rounded-xl font-semibold shadow-lg hover:opacity-95"
          >
            <Search className="w-4 h-4 me-2" />
            {t("booking.search")}
          </Button>
        </div>
      </div>

      {/* Quick info bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BedDouble className="w-3.5 h-3.5" />
          {nights} {nights === 1 ? t("booking.night") : t("booking.nights")}
        </span>
        {nights < 1 && (
          <span className="flex items-center gap-1.5 text-destructive">
            <AlertCircle className="w-3.5 h-3.5" />
            {t("booking.invalidDates")}
          </span>
        )}
      </div>
    </div>
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
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed text-lg"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed text-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}
