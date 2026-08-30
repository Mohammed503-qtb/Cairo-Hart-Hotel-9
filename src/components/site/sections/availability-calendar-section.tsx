"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, BedDouble, Info } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useRooms, useAvailabilityCalendar, type CalendarDay } from "@/hooks/use-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalized } from "@/hooks/use-t";
import { useBookingStore } from "@/stores/booking-store";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { fromISODate, toISODate, addDays } from "@/lib/format";

const WEEKDAYS_AR = ["سبت", "أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"];
const WEEKDAYS_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function AvailabilityCalendarSection() {
  const { t, locale } = useT();
  const loc = useLocalized();
  const { data: rooms } = useRooms();
  const [selectedRoomType, setSelectedRoomType] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDates, setSelectedDates] = useState<{ checkIn: string | null; checkOut: string | null }>({
    checkIn: null,
    checkOut: null,
  });

  const roomTypeId = selectedRoomType === "all" ? null : selectedRoomType;
  const { data: calendarData, isLoading } = useAvailabilityCalendar(selectedMonth, roomTypeId);

  const weekdays = locale === "ar" ? WEEKDAYS_AR : WEEKDAYS_EN;
  const months = locale === "ar" ? MONTHS_AR : MONTHS_EN;

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthLabel = `${months[month - 1]} ${year}`;

  const navigateMonth = (direction: "prev" | "next") => {
    const d = new Date(year, month - 1, 1);
    if (direction === "prev") {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.isPast || !day.inMonth) return;
    if (day.available === 0) return;

    const { checkIn, checkOut } = selectedDates;
    if (!checkIn || (checkIn && checkOut)) {
      // Start new selection
      setSelectedDates({ checkIn: day.date, checkOut: null });
    } else if (checkIn && !checkOut) {
      // Set check-out (must be after check-in)
      if (day.date > checkIn) {
        setSelectedDates({ checkIn, checkOut: day.date });
      } else {
        // Clicked before check-in, restart
        setSelectedDates({ checkIn: day.date, checkOut: null });
      }
    }
  };

  const { setSearchParams } = useBookingStore();
  const openBooking = useUIStore((s) => s.openBooking);

  const handleBookSelected = () => {
    if (selectedDates.checkIn && selectedDates.checkOut) {
      setSearchParams({
        checkIn: selectedDates.checkIn,
        checkOut: selectedDates.checkOut,
      });
      openBooking();
    }
  };

  const isDaySelected = (day: CalendarDay) => {
    return selectedDates.checkIn === day.date || selectedDates.checkOut === day.date;
  };
  const isDayInRange = (day: CalendarDay) => {
    if (!selectedDates.checkIn || !selectedDates.checkOut) return false;
    return day.date > selectedDates.checkIn && day.date < selectedDates.checkOut;
  };

  const dayStatus = (day: CalendarDay): "available" | "limited" | "soldOut" | "past" | "outOfMonth" => {
    if (!day.inMonth) return "outOfMonth";
    if (day.isPast) return "past";
    if (day.available === 0) return "soldOut";
    if (day.available <= 2) return "limited";
    return "available";
  };

  return (
    <section id="calendar" className="py-16 lg:py-24 bg-cream/30 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold mb-3">
            <Calendar className="w-3.5 h-3.5" /> {t("calendar.title")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            {t("calendar.title")}
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg">{t("calendar.subtitle")}</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
              <SelectTrigger className="rounded-xl sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("calendar.allRooms")}</SelectItem>
                {rooms?.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {loc(rt.nameAr, rt.nameEn)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Month navigation */}
            <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2 sm:ms-auto">
              <button
                onClick={() => navigateMonth("prev")}
                className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
                aria-label={t("calendar.prevMonth")}
              >
                {locale === "ar" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <span className="font-display font-bold text-sm min-w-[140px] text-center">{monthLabel}</span>
              <button
                onClick={() => navigateMonth("next")}
                className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
                aria-label={t("calendar.nextMonth")}
              >
                {locale === "ar" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-6 shadow-sm">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {weekdays.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider py-2",
                    i >= 5 ? "text-gold" : "text-muted-foreground"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: 42 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarData?.days.map((day, i) => {
                  const status = dayStatus(day);
                  const selected = isDaySelected(day);
                  const inRange = isDayInRange(day);
                  const dayNum = fromISODate(day.date).getDate();

                  return (
                    <button
                      key={i}
                      onClick={() => handleDayClick(day)}
                      disabled={status === "past" || status === "soldOut" || status === "outOfMonth"}
                      className={cn(
                        "relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs sm:text-sm font-medium transition-all",
                        status === "outOfMonth" && "opacity-30 cursor-default",
                        status === "past" && "opacity-40 cursor-not-allowed line-through",
                        status === "soldOut" && "bg-red-50 text-red-400 cursor-not-allowed",
                        status === "available" && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:scale-105",
                        status === "limited" && "bg-amber-50 text-amber-700 hover:bg-amber-100 hover:scale-105",
                        selected && "bg-gold-gradient text-gold-foreground ring-2 ring-gold ring-offset-2 scale-105 shadow-lg",
                        inRange && "bg-gold/20 text-gold-foreground ring-1 ring-gold/40"
                      )}
                      title={
                        status === "outOfMonth"
                          ? ""
                          : `${day.date} • ${day.available}/${day.totalInventory} ${t("calendar.availableCount")}`
                      }
                    >
                      <span className="font-bold">{dayNum}</span>
                      {day.inMonth && status !== "past" && status !== "outOfMonth" && (
                        <span className="text-[8px] sm:text-[9px] opacity-80 leading-none mt-0.5">
                          {day.available > 0 ? day.available : status === "soldOut" ? "—" : ""}
                        </span>
                      )}
                      {day.isToday && (
                        <span className="absolute top-0.5 end-0.5 w-1.5 h-1.5 rounded-full bg-gold" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <span className="font-semibold text-muted-foreground">{t("calendar.legend")}:</span>
              <LegendItem color="bg-emerald-50 border-emerald-200" label={t("calendar.available")} />
              <LegendItem color="bg-amber-50 border-amber-200" label={t("calendar.limited")} />
              <LegendItem color="bg-red-50 border-red-200" label={t("calendar.soldOut")} />
              <LegendItem color="bg-gold-gradient" label={t("calendar.selected")} />
            </div>
          </div>

          {/* Selection summary + book button */}
          {selectedDates.checkIn && (
            <div className="mt-4 p-4 rounded-2xl bg-card border border-gold/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">{t("calendar.checkIn")}</div>
                  <div className="font-bold">{selectedDates.checkIn}</div>
                </div>
                {selectedDates.checkOut && (
                  <>
                    <ChevronLeft className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
                    <div>
                      <div className="text-xs text-muted-foreground">{t("calendar.checkOut")}</div>
                      <div className="font-bold">{selectedDates.checkOut}</div>
                    </div>
                  </>
                )}
              </div>
              {selectedDates.checkOut && (
                <button
                  onClick={handleBookSelected}
                  className="bg-gold-gradient text-gold-foreground px-6 py-2.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <BedDouble className="w-4 h-4" />
                  {t("nav.bookNow")}
                </button>
              )}
            </div>
          )}

          {/* Info note */}
          <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
            <p>
              {locale === "ar"
                ? "اختر تاريخ الوصول ثم تاريخ المغادرة للبحث عن الغرف المتاحة. الأرقام تمثل الغرف المتاحة لكل يوم."
                : "Select a check-in date then a check-out date to search available rooms. Numbers represent rooms available per day."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-3 h-3 rounded border", color)} />
      <span>{label}</span>
    </div>
  );
}
