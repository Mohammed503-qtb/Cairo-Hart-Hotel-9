"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { AmenityIcon } from "@/components/shared/amenity-icon";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/use-t";
import { useBookingStore, type BookingStep } from "@/stores/booking-store";
import { useUIStore } from "@/stores/ui-store";
import {
  useAvailability,
  useHotel,
  type AvailableRoomResult,
  type AvailabilityResponse,
} from "@/hooks/use-data";
import {
  formatMoney,
  formatDate,
  calculateNights,
  fromISODate,
  toISODate,
  addDays,
} from "@/lib/format";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  BedDouble,
  CreditCard,
  Wallet,
  Banknote,
  Lock,
  ShieldCheck,
  Download,
  Copy,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Star,
  Info,
  Tag,
  AlertCircle,
  Loader2,
  MessageCircle,
  Mail,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------
const STEP_ORDER: BookingStep[] = [
  "search",
  "guest",
  "review",
  "payment",
  "confirmation",
];

const STEP_KEYS: Record<BookingStep, string> = {
  search: "booking.step.search",
  results: "booking.step.results",
  guest: "booking.step.guest",
  review: "booking.step.review",
  payment: "booking.step.payment",
  confirmation: "booking.step.confirmation",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function BookingFlow() {
  const { t, locale } = useT();
  const isRTL = locale === "ar";
  const bookingOpen = useUIStore((s) => s.bookingOpen);
  const closeBooking = useUIStore((s) => s.closeBooking);
  const openManage = useUIStore((s) => s.openManage);
  const { data: hotel } = useHotel();

  const step = useBookingStore((s) => s.step);
  const setStep = useBookingStore((s) => s.setStep);
  const reset = useBookingStore((s) => s.reset);

  const currency = hotel?.currency ?? "YER";
  const taxRatePercent = hotel?.taxRatePercent ?? 0;
  const serviceChargePercent = hotel?.serviceChargePercent ?? 0;

  // Ensure step starts at "search" when the dialog opens
  React.useEffect(() => {
    if (bookingOpen && step === "confirmation") {
      // keep confirmation step if user just finished a booking
    } else if (bookingOpen && (step === "guest" || step === "review" || step === "payment")) {
      // resume from current step (e.g. user minimized and re-opened)
    } else if (bookingOpen) {
      setStep("search");
    }
     
  }, [bookingOpen]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // If on confirmation, reset state after closing animation
      if (step === "confirmation") {
        setTimeout(() => reset(), 200);
      }
      closeBooking();
    }
  };

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;
  const ForwardIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <Dialog open={bookingOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[100vw] sm:max-w-5xl w-full h-[100dvh] sm:h-[92vh] sm:max-h-[92vh] p-0 gap-0 flex flex-col rounded-none sm:rounded-2xl overflow-hidden border-gold/30 shadow-luxury bg-background"
      >
        <VisuallyHidden>
          <DialogTitle>{t("booking.title")}</DialogTitle>
          <DialogDescription>{t("booking.title")}</DialogDescription>
        </VisuallyHidden>

        {/* ---------- Sticky header ---------- */}
        <header className="sticky top-0 z-30 border-b border-gold/20 bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {t("booking.title")}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
              className="rounded-full hover:bg-accent"
              aria-label={t("common.close")}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <StepProgress step={step} />
        </header>

        {/* ---------- Scrollable body ---------- */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 bg-cream/30">
          {step === "search" && <SearchStep />}
          {step === "guest" && <GuestStep />}
          {step === "review" && (
            <ReviewStep
              currency={currency}
              taxRatePercent={taxRatePercent}
              serviceChargePercent={serviceChargePercent}
            />
          )}
          {step === "payment" && (
            <PaymentStep
              currency={currency}
              taxRatePercent={taxRatePercent}
              serviceChargePercent={serviceChargePercent}
              openManage={openManage}
              closeBooking={closeBooking}
            />
          )}
          {step === "confirmation" && <ConfirmationStep />}
        </div>

        {/* ---------- Sticky footer ---------- */}
        {step !== "confirmation" && <BookingFooter BackIcon={BackIcon} ForwardIcon={ForwardIcon} />}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Step progress (header)
// ---------------------------------------------------------------------------
function StepProgress({ step }: { step: BookingStep }) {
  const { t, locale } = useT();
  const currentIdx = STEP_ORDER.indexOf(step === "results" ? "search" : step);

  return (
    <div className="px-4 sm:px-6 pb-3">
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
        {STEP_ORDER.map((s, i) => {
          const isCurrent = i === currentIdx;
          const isDone = i < currentIdx;
          return (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold border transition-all",
                    isCurrent && "bg-gold text-gold-foreground border-gold shadow-md",
                    isDone && "bg-primary text-primary-foreground border-primary",
                    !isCurrent && !isDone && "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs sm:text-sm font-medium whitespace-nowrap",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {t(STEP_KEYS[s])}
                </span>
              </div>
              {i < STEP_ORDER.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 min-w-4 sm:min-w-6 rounded-full transition-all",
                    i < currentIdx ? "bg-gold" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Search + Available rooms
// ---------------------------------------------------------------------------
function SearchStep() {
  const { t, locale } = useT();
  const {
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    setSearchParams,
    setSelectedRoom,
    setStep,
    step,
  } = useBookingStore();
  const bookingOpen = useUIStore((s) => s.bookingOpen);

  const enabled = bookingOpen && (step === "search" || step === "results");
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useAvailability({
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    enabled,
  });

  const results = data?.results ?? [];
  const currency = data?.hotel?.currency ?? "YER";

  const [checkInOpen, setCheckInOpen] = React.useState(false);
  const [checkOutOpen, setCheckOutOpen] = React.useState(false);
  const [guestsOpen, setGuestsOpen] = React.useState(false);

  const ciDate = fromISODate(checkIn);
  const coDate = fromISODate(checkOut);
  const nights = Math.max(0, calculateNights(ciDate, coDate));

  const maxAdults = 6;
  const maxChildren = 5;
  const maxRooms = 5;

  const handleSelectRoom = (room: AvailableRoomResult) => {
    setSelectedRoom({
      roomTypeId: room.id,
      slug: room.slug,
      nameAr: room.nameAr,
      nameEn: room.nameEn,
      imageUrl: room.imageUrl,
      nightlyRate: room.nightlyRate,
      basePrice: room.basePrice,
    });
    setStep("guest");
  };

  const guestSummary =
    locale === "ar"
      ? `${adults} ${adults === 1 ? "بالغ" : "بالغين"}${
          children > 0 ? ` • ${children} ${children === 1 ? "طفل" : "أطفال"}` : ""
        } • ${rooms} ${rooms === 1 ? "غرفة" : "غرف"}`
      : `${adults} ${adults === 1 ? "adult" : "adults"}${
          children > 0 ? ` • ${children} ${children === 1 ? "child" : "children"}` : ""
        } • ${rooms} ${rooms === 1 ? "room" : "rooms"}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ---- Editable search params ---- */}
      <Card className="border-gold/20 bg-card/80 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Check-in */}
            <div className="md:col-span-3">
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" /> {t("booking.checkIn")}
              </Label>
              <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full h-10 rounded-lg border border-input bg-background px-3 text-start text-sm font-medium hover:border-gold/60 transition-colors flex items-center justify-between">
                    <span className="truncate">
                      {formatDate(ciDate, locale)}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={ciDate}
                    locale={locale === "ar" ? ar : undefined}
                    disabled={(d) => d < addDays(new Date(), -1)}
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
                <CalendarIcon className="w-3.5 h-3.5" /> {t("booking.checkOut")}
              </Label>
              <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full h-10 rounded-lg border border-input bg-background px-3 text-start text-sm font-medium hover:border-gold/60 transition-colors flex items-center justify-between">
                    <span className="truncate">
                      {formatDate(coDate, locale)}
                    </span>
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
                      setSearchParams({ checkOut: toISODate(d) });
                      setCheckOutOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Guests + rooms */}
            <div className="md:col-span-4">
              <Label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {t("booking.guests")}
              </Label>
              <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full h-10 rounded-lg border border-input bg-background px-3 text-start text-sm font-medium hover:border-gold/60 transition-colors flex items-center justify-between">
                    <span className="truncate">{guestSummary}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4" align="start">
                  <div className="space-y-4">
                    <GuestStepper
                      label={t("booking.adults")}
                      value={adults}
                      min={1}
                      max={maxAdults * rooms}
                      onChange={(v) => setSearchParams({ adults: v })}
                    />
                    <GuestStepper
                      label={t("booking.children")}
                      value={children}
                      min={0}
                      max={maxChildren * rooms}
                      onChange={(v) => setSearchParams({ children: v })}
                    />
                    <GuestStepper
                      label={t("booking.rooms")}
                      value={rooms}
                      min={1}
                      max={maxRooms}
                      onChange={(v) => setSearchParams({ rooms: v })}
                    />
                    <Button
                      size="sm"
                      className="w-full bg-gold-gradient text-gold-foreground hover:opacity-95"
                      onClick={() => setGuestsOpen(false)}
                    >
                      {t("common.close")}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Nights summary */}
            <div className="md:col-span-2">
              <div className="flex flex-col items-center justify-center h-10 rounded-lg bg-gold/10 border border-gold/30">
                <span className="text-base font-bold text-gold tabular-nums">
                  {nights}
                </span>
                <span className="text-[10px] text-muted-foreground -mt-0.5">
                  {nights === 1 ? t("booking.night") : t("booking.nights")}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Available rooms ---- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold">
            {t("booking.availableRooms")}
          </h3>
          {isLoading && (
            <Badge variant="secondary" className="text-xs">
              {t("common.loading")}
            </Badge>
          )}
          {data && results.length > 0 && (
            <Badge variant="outline" className="text-xs border-gold/40">
              {results.length} {locale === "ar" ? "خيار" : "options"}
            </Badge>
          )}
        </div>

        {isLoading && <RoomCardSkeletonList />}

        {!isLoading && isError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 text-center">
              <Info className="w-8 h-8 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-muted-foreground mb-3">
                {t("common.error")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                {t("common.retry")}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && results.length === 0 && (
          <Card className="border-gold/20 bg-card">
            <CardContent className="p-8 sm:p-12 text-center">
              <BedDouble className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t("booking.noResults")}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          !isError &&
          results.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              nights={nights}
              currency={currency}
              locale={locale}
              onSelect={() => handleSelectRoom(room)}
            />
          ))}
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
          className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="decrease"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-input flex items-center justify-center hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="increase"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function RoomCardSkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-gold/10">
          <div className="flex flex-col sm:flex-row">
            <Skeleton className="w-full sm:w-56 h-40 sm:h-44 rounded-none" />
            <div className="flex-1 p-4 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function RoomCard({
  room,
  nights,
  currency,
  locale,
  onSelect,
}: {
  room: AvailableRoomResult;
  nights: number;
  currency: string;
  locale: "ar" | "en";
  onSelect: () => void;
}) {
  const { t } = useT();
  const isAvailable = room.availableCount >= 1;
  const name = locale === "ar" ? room.nameAr : room.nameEn;
  const desc = locale === "ar" ? room.shortDescriptionAr : room.shortDescriptionEn;
  const bedConfig = locale === "ar" ? room.bedConfigAr : room.bedConfigEn;

  const showAmenities = room.amenities.slice(0, 5);

  return (
    <Card
      className={cn(
        "overflow-hidden border-gold/15 hover:border-gold/40 transition-all hover:shadow-md group",
        !isAvailable && "opacity-60"
      )}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="relative w-full sm:w-56 h-40 sm:h-auto shrink-0 overflow-hidden bg-muted">
          { }
          <img
            src={room.imageUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {room.isRefundable && (
            <Badge className="absolute top-2 start-2 bg-emerald-600/90 text-white border-0 text-[10px]">
              <ShieldCheck className="w-3 h-3 me-1" />
              {locale === "ar" ? "قابل للاسترداد" : "Refundable"}
            </Badge>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-bold text-base sm:text-lg leading-tight truncate">
                {name}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {desc}
              </p>
            </div>
            {room.sizeSqm && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                {room.sizeSqm} {locale === "ar" ? "م²" : "m²"}
              </Badge>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              {bedConfig}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {room.maxAdults} {locale === "ar" ? "بالغ" : "adults"}
              {room.maxChildren > 0 &&
                ` + ${room.maxChildren} ${
                  locale === "ar" ? "طفل" : "children"
                }`}
            </span>
          </div>

          {/* Amenities */}
          {showAmenities.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
              {showAmenities.map((a) => (
                <span
                  key={a.slug}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                >
                  <AmenityIcon
                    iconKey={a.iconKey}
                    className="w-3.5 h-3.5 text-gold"
                  />
                  {locale === "ar" ? a.nameAr : a.nameEn}
                </span>
              ))}
            </div>
          )}

          {/* Footer of card */}
          <div className="mt-auto pt-4 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-gradient-gold">
                  {formatMoney(room.nightlyRate, currency, locale)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("booking.perNight")}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {nights} {nights === 1 ? t("booking.night") : t("booking.nights")}{" "}
                •{" "}
                <span className="font-semibold text-foreground">
                  {formatMoney(room.totalPrice, currency, locale)}
                </span>
              </div>
              {room.availableCount <= 3 && isAvailable && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                  {locale === "ar"
                    ? `${room.availableCount} ${t("booking.roomsLeft")}`
                    : `${room.availableCount} ${t("booking.roomsLeft")}`}
                </span>
              )}
            </div>
            <Button
              onClick={onSelect}
              disabled={!isAvailable}
              className="bg-gold-gradient text-gold-foreground hover:opacity-95 font-semibold shadow-sm"
            >
              {t("booking.selectRoom")}
              {(locale === "ar" ? true : false) ? (
                <ArrowLeft className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Guest information
// ---------------------------------------------------------------------------
function GuestStep() {
  const { t, locale } = useT();
  const { guest, setGuest } = useBookingStore();
  const [touched, setTouched] = React.useState({
    fullName: false,
    phone: false,
    email: false,
  });

  const fullNameError =
    guest.fullName.trim().length < 3 ? t("booking.fillGuestInfo") : "";
  const phoneDigits = guest.phone.replace(/\D/g, "");
  const phoneError = phoneDigits.length < 6 ? t("booking.validPhone") : "";
  const emailError =
    guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)
      ? t("booking.validEmail")
      : "";

  const isValid =
    !fullNameError && !phoneError && !emailError && guest.agreedPolicies;

  React.useEffect(() => {
    // expose validity for footer continue button via store-like ref
    (window as unknown as Record<string, unknown>).__bookingGuestValid = isValid;
    return () => {
      delete (window as unknown as Record<string, unknown>).__bookingGuestValid;
    };
  }, [isValid]);

  const countryCodes = [
    { code: "+967", label: locale === "ar" ? "🇾🇪 اليمن (+967)" : "🇾🇪 Yemen (+967)" },
    { code: "+966", label: locale === "ar" ? "🇸🇦 السعودية (+966)" : "🇸🇦 Saudi Arabia (+966)" },
    { code: "+971", label: locale === "ar" ? "🇦🇪 الإمارات (+971)" : "🇦🇪 UAE (+971)" },
    { code: "+968", label: locale === "ar" ? "🇴🇲 عُمان (+968)" : "🇴🇲 Oman (+968)" },
    { code: "+974", label: locale === "ar" ? "🇶🇦 قطر (+974)" : "🇶🇦 Qatar (+974)" },
    { code: "+965", label: locale === "ar" ? "🇰🇼 الكويت (+965)" : "🇰🇼 Kuwait (+965)" },
    { code: "+973", label: locale === "ar" ? "🇧🇭 البحرين (+973)" : "🇧🇭 Bahrain (+973)" },
    { code: "+1", label: locale === "ar" ? "🇺🇸 الولايات المتحدة (+1)" : "🇺🇸 USA (+1)" },
    { code: "+44", label: locale === "ar" ? "🇬🇧 المملكة المتحدة (+44)" : "🇬🇧 UK (+44)" },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-bold mb-1">{t("booking.guestInfo")}</h3>
        <p className="text-sm text-muted-foreground">
          {locale === "ar"
            ? "أدخل بيانات الضيف الرئيسي. ستُستخدم هذه البيانات للتواصل معك بخصوص حجزك."
            : "Enter the primary guest information. We'll use this to contact you about your booking."}
        </p>
      </div>

      <Card className="border-gold/20 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-sm font-semibold">
              {t("booking.fullName")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              value={guest.fullName}
              onChange={(e) => setGuest({ fullName: e.target.value })}
              onBlur={() => setTouched((s) => ({ ...s, fullName: true }))}
              placeholder={locale === "ar" ? "الاسم الكامل" : "Full name"}
              aria-invalid={!!fullNameError && touched.fullName}
              className="h-10"
            />
            {touched.fullName && fullNameError && (
              <p className="text-xs text-destructive">{fullNameError}</p>
            )}
          </div>

          {/* Phone with country code */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-semibold">
              {t("booking.phone")} <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Select
                value={guest.countryCode}
                onValueChange={(v) => setGuest({ countryCode: v })}
              >
                <SelectTrigger className="w-[180px] h-10 shrink-0">
                  <SelectValue placeholder={t("booking.countryCode")} />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phone"
                value={guest.phone}
                onChange={(e) => setGuest({ phone: e.target.value })}
                onBlur={() => setTouched((s) => ({ ...s, phone: true }))}
                placeholder={locale === "ar" ? "7XXXXXXXX" : "7XXXXXXXX"}
                inputMode="tel"
                aria-invalid={!!phoneError && touched.phone}
                className="flex-1 h-10"
                dir="ltr"
              />
            </div>
            {touched.phone && phoneError && (
              <p className="text-xs text-destructive">{phoneError}</p>
            )}
          </div>

          {/* Email + whatsapp (optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">
                {t("booking.email")}{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  ({t("common.optional")})
                </span>
              </Label>
              <Input
                id="email"
                type="email"
                value={guest.email}
                onChange={(e) => setGuest({ email: e.target.value })}
                onBlur={() => setTouched((s) => ({ ...s, email: true }))}
                placeholder="you@example.com"
                aria-invalid={!!emailError && touched.email}
                className="h-10"
                dir="ltr"
              />
              {touched.email && emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp" className="text-sm font-semibold">
                {t("booking.whatsapp")}{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  ({t("common.optional")})
                </span>
              </Label>
              <Input
                id="whatsapp"
                value={guest.whatsapp}
                onChange={(e) => setGuest({ whatsapp: e.target.value })}
                placeholder={locale === "ar" ? "رقم واتساب" : "WhatsApp number"}
                inputMode="tel"
                className="h-10"
                dir="ltr"
              />
            </div>
          </div>

          <Separator />

          {/* Special requests */}
          <div className="space-y-1.5">
            <Label htmlFor="specialRequest" className="text-sm font-semibold">
              {t("booking.specialRequest")}
            </Label>
            <Textarea
              id="specialRequest"
              value={guest.specialRequest}
              onChange={(e) => setGuest({ specialRequest: e.target.value })}
              placeholder={t("booking.specialRequestPlaceholder")}
              rows={3}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Policies agreement */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            <Checkbox
              id="policies"
              checked={guest.agreedPolicies}
              onCheckedChange={(checked) =>
                setGuest({ agreedPolicies: checked === true })
              }
              className="mt-0.5"
            />
            <Label
              htmlFor="policies"
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              {t("booking.agreePolicies")}
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Review
// ---------------------------------------------------------------------------
function ReviewStep({
  currency,
  taxRatePercent,
  serviceChargePercent,
}: {
  currency: string;
  taxRatePercent: number;
  serviceChargePercent: number;
}) {
  const { t, locale } = useT();
  const {
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    selectedRoom,
    guest,
    appliedPromo,
  } = useBookingStore();

  const ciDate = fromISODate(checkIn);
  const coDate = fromISODate(checkOut);
  const nights = Math.max(0, calculateNights(ciDate, coDate));
  const nightlyRate = selectedRoom?.nightlyRate ?? 0;
  const subtotal = nightlyRate * nights * rooms;
  const promoDiscount = appliedPromo?.discountAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - promoDiscount);
  const taxTotal = afterDiscount * (taxRatePercent / 100);
  const serviceChargeTotal = afterDiscount * (serviceChargePercent / 100);
  const grandTotal = afterDiscount + taxTotal + serviceChargeTotal;

  const roomName = selectedRoom
    ? locale === "ar"
      ? selectedRoom.nameAr
      : selectedRoom.nameEn
    : "";

  if (!selectedRoom) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          {t("booking.selectRoomFirst")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-bold mb-1">{t("booking.yourStay")}</h3>
        <p className="text-sm text-muted-foreground">
          {locale === "ar"
            ? "راجع تفاصيل حجزك قبل المتابعة."
            : "Review your booking details before continuing."}
        </p>
      </div>

      {/* Summary card */}
      <Card className="overflow-hidden border-gold/20 shadow-sm">
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-48 h-36 sm:h-auto shrink-0 overflow-hidden bg-muted">
            { }
            <img
              src={selectedRoom.imageUrl}
              alt={roomName}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <CardContent className="flex-1 p-4 sm:p-5 space-y-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {t("booking.roomType")}
              </span>
              <h4 className="font-bold text-base sm:text-lg">{roomName}</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">
                  {t("booking.checkIn")}
                </span>
                <span className="font-medium">{formatDate(ciDate, locale)}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  {t("booking.checkOut")}
                </span>
                <span className="font-medium">{formatDate(coDate, locale)}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  {t("booking.totalNights")}
                </span>
                <span className="font-medium">
                  {nights}{" "}
                  {nights === 1 ? t("booking.night") : t("booking.nights")}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  {t("booking.guests")}
                </span>
                <span className="font-medium">
                  {adults}{" "}
                  {locale === "ar" ? "بالغ" : "adults"}
                  {children > 0 &&
                    ` • ${children} ${
                      locale === "ar" ? "طفل" : "children"
                    }`}{" "}
                  • {rooms}{" "}
                  {rooms === 1
                    ? locale === "ar"
                      ? "غرفة"
                      : "room"
                    : locale === "ar"
                    ? "غرف"
                    : "rooms"}
                </span>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Price breakdown */}
      <Card className="border-gold/20 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <h4 className="font-bold text-base mb-4">
            {t("booking.priceBreakdown")}
          </h4>
          <div className="space-y-3 text-sm">
            <PriceRow
              label={`${t("booking.subtotal")} · ${nights} ${
                nights === 1 ? t("booking.night") : t("booking.nights")
              } × ${rooms} ${locale === "ar" ? "غرف" : "rooms"}`}
              value={formatMoney(subtotal, currency, locale)}
            />
            {appliedPromo && appliedPromo.discountAmount > 0 && (
              <PriceRow
                label={`${locale === "ar" ? "خصم كود" : "Promo discount"} (${appliedPromo.code})`}
                value={`- ${formatMoney(appliedPromo.discountAmount, currency, locale)}`}
                className="text-emerald-600"
              />
            )}
            <PriceRow
              label={`${t("booking.taxes")} (${taxRatePercent}%)`}
              value={formatMoney(taxTotal, currency, locale)}
            />
            <PriceRow
              label={`${t("booking.serviceCharge")} (${serviceChargePercent}%)`}
              value={formatMoney(serviceChargeTotal, currency, locale)}
            />
            <Separator />
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold text-base">{t("booking.total")}</span>
              <span className="font-bold text-xl text-gradient-gold">
                {formatMoney(grandTotal, currency, locale)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promo code input */}
      <PromoCodeInput subtotal={subtotal} currency={currency} />

      {/* Cancellation policy */}
      <Card className="border-gold/20 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm mb-1">
                {t("manage.cancellationPolicy")}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {locale === "ar"
                  ? "يمكنك الإلغاء مجاناً قبل 3 أيام من تاريخ الوصول. بعد ذلك، قد يتم تطبيق رسوم إلغاء. يعتمد الإلغاء على سياسة الفندق وتوافر الغرف."
                  : "You can cancel for free up to 3 days before your check-in date. After that, cancellation fees may apply. Cancellation is subject to hotel policy and room availability."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guest summary */}
      <Card className="border-gold/20 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm">{t("booking.guestInfo")}</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">
                {t("booking.fullName")}
              </span>
              <span className="font-medium">{guest.fullName}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                {t("booking.phone")}
              </span>
              <span className="font-medium" dir="ltr">
                {guest.countryCode} {guest.phone}
              </span>
            </div>
            {guest.email && (
              <div>
                <span className="text-xs text-muted-foreground block">
                  {t("booking.email")}
                </span>
                <span className="font-medium" dir="ltr">
                  {guest.email}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PriceRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-muted-foreground", className)}>{label}</span>
      <span className={cn("font-medium tabular-nums", className)}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Promo code input
// ---------------------------------------------------------------------------
function PromoCodeInput({ subtotal, currency }: { subtotal: number; currency: string }) {
  const { t, locale } = useT();
  const { promoCodeInput, setPromoCodeInput, appliedPromo, setAppliedPromo } = useBookingStore();
  const [validating, setValidating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleApply = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    setValidating(true);
    setError(null);
    try {
      const res = await fetch("/api/promo-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedPromo({
          code: data.code,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          nameAr: data.nameAr,
          nameEn: data.nameEn,
        });
        setError(null);
      } else {
        const errKey = data.error || "invalid_code";
        setError(
          errKey === "expired_code"
            ? locale === "ar" ? "انتهت صلاحية الكود" : "Code expired"
            : errKey === "max_uses_reached"
            ? locale === "ar" ? "تم استخدام الكود بالكامل" : "Code usage limit reached"
            : locale === "ar" ? "كود غير صحيح" : "Invalid code"
        );
        setAppliedPromo(null);
      }
    } catch {
      setError(locale === "ar" ? "تعذر التحقق. حاول مرة أخرى." : "Could not verify. Try again.");
    } finally {
      setValidating(false);
    }
  };

  const handleRemove = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setError(null);
  };

  return (
    <Card className="border-gold/20 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-gold" />
          <h4 className="font-bold text-sm">
            {locale === "ar" ? "كود الخصم" : "Promo code"}
          </h4>
        </div>
        {appliedPromo ? (
          <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-700">
                  {appliedPromo.code}
                </div>
                <div className="text-[10px] text-emerald-600">
                  {locale === "ar" ? appliedPromo.nameAr : appliedPromo.nameEn} • -{formatMoney(appliedPromo.discountAmount, currency, locale)}
                </div>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-xs text-emerald-700 hover:text-destructive transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              {locale === "ar" ? "إزالة" : "Remove"}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              placeholder={locale === "ar" ? "أدخل الكود (مثل WELCOME10)" : "Enter code (e.g. WELCOME10)"}
              className="flex-1 h-10 rounded-xl border border-input bg-background px-3 text-sm font-mono font-semibold tracking-wider dir-ltr"
              dir="ltr"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApply();
                }
              }}
            />
            <Button
              onClick={handleApply}
              disabled={validating || !promoCodeInput.trim()}
              size="sm"
              className="bg-gold-gradient text-gold-foreground rounded-xl font-semibold px-4"
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : locale === "ar" ? "تطبيق" : "Apply"}
            </Button>
          </div>
        )}
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
        {!appliedPromo && !error && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            {locale === "ar" ? "جرّب: WELCOME10 (10% خصم) أو SUMMER20 (20% خصم)" : "Try: WELCOME10 (10% off) or SUMMER20 (20% off)"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Payment
// ---------------------------------------------------------------------------
type PaymentMethod = "PAY_AT_HOTEL" | "PAY_ONLINE" | "DEPOSIT";

function PaymentStep({
  currency,
  taxRatePercent,
  serviceChargePercent,
  openManage,
  closeBooking,
}: {
  currency: string;
  taxRatePercent: number;
  serviceChargePercent: number;
  openManage: () => void;
  closeBooking: () => void;
}) {
  const { t, locale } = useT();
  const {
    paymentMethod,
    setPaymentMethod,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    selectedRoom,
    guest,
    idempotencyKey,
    regenerateIdempotencyKey,
    setConfirmation,
    setStep,
    appliedPromo,
  } = useBookingStore();

  const [submitting, setSubmitting] = React.useState(false);
  const [confirmedData, setConfirmedData] = React.useState<{
    bookingReference: string;
    reservationId: string;
    grandTotal: number;
  } | null>(null);

  const ciDate = fromISODate(checkIn);
  const coDate = fromISODate(checkOut);
  const nights = Math.max(0, calculateNights(ciDate, coDate));
  const nightlyRate = selectedRoom?.nightlyRate ?? 0;
  const subtotal = nightlyRate * nights * rooms;
  const promoDiscount = appliedPromo?.discountAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - promoDiscount);
  const taxTotal = afterDiscount * (taxRatePercent / 100);
  const serviceChargeTotal = afterDiscount * (serviceChargePercent / 100);
  const grandTotal = afterDiscount + taxTotal + serviceChargeTotal;

  // Pre-confirm on submit
  const handleConfirm = React.useCallback(async () => {
    if (submitting) return;
    if (!selectedRoom) {
      toast.error(t("booking.selectRoomFirst"));
      return;
    }
    if (!guest.agreedPolicies) {
      toast.error(t("booking.acceptPolicies"));
      return;
    }

    setSubmitting(true);
    try {
      // Ensure fresh idempotency key for each submission attempt
      if (!idempotencyKey) {
        regenerateIdempotencyKey();
      }
      const key =
        useBookingStore.getState().idempotencyKey ||
        `bk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn,
          checkOut,
          adults,
          children,
          rooms,
          roomTypeId: selectedRoom.roomTypeId,
          guest: {
            fullName: guest.fullName,
            phone: guest.phone,
            email: guest.email,
            whatsapp: guest.whatsapp,
            countryCode: guest.countryCode,
          },
          specialRequest: guest.specialRequest,
          paymentMethod,
          idempotencyKey: key,
          acceptPolicies: guest.agreedPolicies,
          promoCode: appliedPromo?.code || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errorKey = data?.error || "creationFailed";
        const translated = t(`booking.${errorKey}`) || t("booking.creationFailed");
        toast.error(translated);
        return;
      }

      // Success
      setConfirmation(data.bookingReference, data.reservationId);
      setConfirmedData({
        bookingReference: data.bookingReference,
        reservationId: data.reservationId,
        grandTotal: data.grandTotal ?? grandTotal,
      });
      setStep("confirmation");
      toast.success(t("booking.confirmed"));
    } catch (err) {
      console.error("[booking/create] error", err);
      toast.error(t("booking.creationFailed"));
    } finally {
      setSubmitting(false);
    }
     
  }, [
    submitting,
    selectedRoom,
    guest,
    paymentMethod,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    idempotencyKey,
  ]);

  // Expose confirm handler + state for the footer to use
  React.useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__bookingConfirm = handleConfirm;
    w.__bookingSubmitting = submitting;
    return () => {
      delete w.__bookingConfirm;
      delete w.__bookingSubmitting;
    };
  }, [handleConfirm, submitting]);

  void openManage;
  void closeBooking;
  void confirmedData;
  void currency;

  const methods: {
    id: PaymentMethod;
    label: string;
    desc: string;
    icon: React.ReactNode;
    disabled?: boolean;
    badge?: string;
    highlight?: boolean;
  }[] = [
    {
      id: "PAY_AT_HOTEL",
      label: t("booking.payAtHotel"),
      desc: t("booking.payAtHotelDesc"),
      icon: <Banknote className="w-5 h-5" />,
      highlight: true,
    },
    {
      id: "PAY_ONLINE",
      label: t("booking.payOnline"),
      desc: t("booking.payOnlineDesc"),
      icon: <CreditCard className="w-5 h-5" />,
      disabled: true,
      badge: locale === "ar" ? "قريباً" : "Soon",
    },
    {
      id: "DEPOSIT",
      label: t("booking.deposit"),
      desc: t("booking.depositDesc"),
      icon: <Wallet className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-bold mb-1">{t("booking.paymentMethod")}</h3>
        <p className="text-sm text-muted-foreground">
          {locale === "ar"
            ? "اختر طريقة الدفع المناسبة لك."
            : "Choose your preferred payment method."}
        </p>
      </div>

      <RadioGroup
        value={paymentMethod}
        onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
        className="gap-3"
      >
        {methods.map((m) => (
          <label
            key={m.id}
            htmlFor={`pay-${m.id}`}
            className={cn(
              "relative flex items-start gap-4 p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all",
              paymentMethod === m.id
                ? "border-gold bg-gold/5 shadow-sm"
                : "border-border hover:border-gold/40",
              m.disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <RadioGroupItem
              id={`pay-${m.id}`}
              value={m.id}
              disabled={m.disabled}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "shrink-0",
                      paymentMethod === m.id ? "text-gold" : "text-muted-foreground"
                    )}
                  >
                    {m.icon}
                  </span>
                  <span className="font-semibold text-sm sm:text-base">
                    {m.label}
                  </span>
                </div>
                {m.badge && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-muted text-muted-foreground"
                  >
                    {m.badge}
                  </Badge>
                )}
                {m.highlight && !m.badge && (
                  <Badge className="text-[10px] bg-gold text-gold-foreground border-0">
                    <Star className="w-3 h-3 me-1 fill-current" />
                    {locale === "ar" ? "موصى به" : "Recommended"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {m.desc}
              </p>
            </div>
          </label>
        ))}
      </RadioGroup>

      {/* Price summary mini */}
      <Card className="border-gold/20 bg-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t("booking.total")}</span>
            <span className="text-xl font-bold text-gradient-gold">
              {formatMoney(grandTotal, currency, locale)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {paymentMethod === "PAY_AT_HOTEL" &&
              (locale === "ar"
                ? "تدفع المبلغ كاملاً عند الوصول للفندق."
                : "Pay the full amount upon arrival at the hotel.")}
            {paymentMethod === "DEPOSIT" &&
              (locale === "ar"
                ? "تدفع 30% الآن والباقي عند الوصول."
                : "Pay 30% now and the rest at arrival.")}
          </p>
        </CardContent>
      </Card>

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
        <Lock className="w-3.5 h-3.5" />
        <span>
          {locale === "ar"
            ? "جميع المعاملات آمنة ومحمية."
            : "All transactions are secure and protected."}
        </span>
      </div>

      {/* Inline processing overlay (when submitting) */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-gold/30 shadow-luxury">
            <div className="w-10 h-10 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-sm font-medium">{t("booking.processing")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Confirmation
// ---------------------------------------------------------------------------
function ConfirmationStep() {
  const { t, locale } = useT();
  const {
    bookingReference,
    reservationId,
    selectedRoom,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    guest,
    paymentMethod,
    reset,
  } = useBookingStore();
  const closeBooking = useUIStore((s) => s.closeBooking);
  const openManage = useUIStore((s) => s.openManage);
  const [copied, setCopied] = React.useState(false);

  const ciDate = fromISODate(checkIn);
  const coDate = fromISODate(checkOut);
  const nights = Math.max(0, calculateNights(ciDate, coDate));
  const roomName = selectedRoom
    ? locale === "ar"
      ? selectedRoom.nameAr
      : selectedRoom.nameEn
    : "";

  const handleCopyRef = async () => {
    if (!bookingReference) return;
    try {
      await navigator.clipboard.writeText(bookingReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(
        locale === "ar" ? "تم نسخ رقم الحجز" : "Booking reference copied"
      );
    } catch {
      toast.error(locale === "ar" ? "تعذر النسخ" : "Could not copy");
    }
  };

  const handleDownload = () => {
    if (!bookingReference) return;
    // Open the server-generated professional confirmation document
    // It auto-triggers the browser print dialog (which allows Save as PDF)
    const phoneDigits = guest.phone.replace(/\D/g, "");
    const url = `/api/booking/${bookingReference}/confirmation?phone=${encodeURIComponent(phoneDigits)}&locale=${locale}`;
    window.open(url, "_blank");
  };

  const handleBookAnother = () => {
    reset();
    closeBooking();
  };

  const handleManage = () => {
    closeBooking();
    setTimeout(() => openManage(), 200);
  };

  const handleWhatsAppShare = () => {
    if (!bookingReference) return;
    const message =
      locale === "ar"
        ? `تم تأكيد حجزي في فندق دار الياسمين الملكي!\n\nرقم الحجز: ${bookingReference}\nالغرفة: ${roomName}\nالوصول: ${checkIn}\nالمغادرة: ${checkOut}\nالليالي: ${nights}\n\nنتطلع لاستقبالكم!`
        : `My booking at Dar Al-Yasmin Royal Hotel is confirmed!\n\nBooking: ${bookingReference}\nRoom: ${roomName}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nNights: ${nights}\n\nLooking forward to welcoming you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleEmailShare = () => {
    if (!bookingReference) return;
    const subject =
      locale === "ar"
        ? `تأكيد حجز - ${bookingReference} - فندق دار الياسمين الملكي`
        : `Booking Confirmation - ${bookingReference} - Dar Al-Yasmin Royal Hotel`;
    const body =
      locale === "ar"
        ? `مرحباً،\n\nتم تأكيد حجزي في فندق دار الياسمين الملكي.\n\nرقم الحجز: ${bookingReference}\nالغرفة: ${roomName}\nتاريخ الوصول: ${checkIn}\nتاريخ المغادرة: ${checkOut}\nعدد الليالي: ${nights}\nعدد الضيوف: ${adults} بالغ${children > 0 ? ` + ${children} أطفال` : ""}\n\nلعرض تأكيد الحجز الكامل، يرجى زيارة الموقع.\n\nشكراً لكم،\n${guest.fullName}`
        : `Hello,\n\nMy booking at Dar Al-Yasmin Royal Hotel is confirmed.\n\nBooking Reference: ${bookingReference}\nRoom: ${roomName}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nNights: ${nights}\nGuests: ${adults} adults${children > 0 ? ` + ${children} children` : ""}\n\nTo view the full confirmation document, please visit our website.\n\nThank you,\n${guest.fullName}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  void reservationId;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success hero */}
      <div className="text-center pt-4">
        <div className="relative inline-flex">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-scale-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <Sparkles className="w-5 h-5 text-gold absolute -top-1 -end-1" />
        </div>
        <h3 className="text-2xl font-bold mt-4 text-gradient-gold">
          {t("booking.confirmed")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {locale === "ar"
            ? "تم استلام حجزك بنجاح. أرسلنا تفاصيل الحجز إلى بريدك الإلكتروني."
            : "Your booking has been received successfully. We've sent the booking details to your email."}
        </p>
      </div>

      {/* Booking reference card */}
      <Card className="border-gold/30 shadow-luxury overflow-hidden">
        <div className="bg-gold-gradient h-1.5 w-full" />
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide block">
              {t("booking.reference")}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xl sm:text-2xl font-bold tracking-wide">
                {bookingReference}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleCopyRef}
                aria-label="copy reference"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Booking details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">
                {t("booking.fullName")}
              </span>
              <span className="font-medium">{guest.fullName}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                {t("booking.roomType")}
              </span>
              <span className="font-medium">{roomName}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                {t("booking.checkIn")}
              </span>
              <span className="font-medium">{formatDate(ciDate, locale)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                {t("booking.checkOut")}
              </span>
              <span className="font-medium">{formatDate(coDate, locale)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                {t("booking.totalNights")}
              </span>
              <span className="font-medium">
                {nights}{" "}
                {nights === 1 ? t("booking.night") : t("booking.nights")}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">
                {t("booking.guests")}
              </span>
              <span className="font-medium">
                {adults}{" "}
                {locale === "ar" ? "بالغ" : "adults"}
                {children > 0 &&
                  ` • ${children} ${
                    locale === "ar" ? "طفل" : "children"
                  }`}{" "}
                • {rooms}{" "}
                {rooms === 1
                  ? locale === "ar"
                    ? "غرفة"
                    : "room"
                  : locale === "ar"
                  ? "غرف"
                  : "rooms"}
              </span>
            </div>
          </div>

          <Separator />

          {/* What next */}
          <div className="rounded-lg bg-muted/40 p-3">
            <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-gold" />
              {t("booking.whatNext")}
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-gold">•</span>
                <span>
                  {locale === "ar"
                    ? "احتفظ برقم الحجز للمرجعية المستقبلية."
                    : "Keep your booking reference for future reference."}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold">•</span>
                <span>
                  {locale === "ar"
                    ? "تواصل معنا على رقم الاستقبال عند الحاجة لأي تعديلات."
                    : "Contact our reception for any modifications."}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-gold">•</span>
                <span>
                  {paymentMethod === "PAY_AT_HOTEL"
                    ? locale === "ar"
                      ? "ادفع المبلغ كاملاً عند الوصول للفندق."
                      : "Pay the full amount upon arrival."
                    : locale === "ar"
                    ? "اتبع تعليمات الدفع المرسلة إليك."
                    : "Follow the payment instructions sent to you."}
                </span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1 border-gold/40 hover:bg-gold/5"
            >
              <Download className="w-4 h-4" />
              {t("booking.downloadConfirmation")}
            </Button>
            <Button
              onClick={handleManage}
              variant="outline"
              className="flex-1"
            >
              {t("booking.manageBooking")}
            </Button>
            <Button
              onClick={handleBookAnother}
              className="flex-1 bg-gold-gradient text-gold-foreground hover:opacity-95"
            >
              {t("booking.anotherBooking")}
            </Button>
          </div>

          {/* Share actions */}
          <div className="pt-3 border-t border-border/30">
            <div className="text-xs text-muted-foreground mb-2 text-center">
              {locale === "ar" ? "شارك تأكيد حجزك:" : "Share your booking confirmation:"}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25D366] text-white text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </button>
              <button
                onClick={handleEmailShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border text-foreground text-xs font-medium hover:bg-accent transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-gold" />
                {locale === "ar" ? "بريد إلكتروني" : "Email"}
              </button>
              <button
                onClick={handleCopyRef}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border text-foreground text-xs font-medium hover:bg-accent transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-gold" />}
                {copied ? (locale === "ar" ? "تم النسخ" : "Copied") : (locale === "ar" ? "نسخ الرقم" : "Copy ref")}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer (sticky bottom)
// ---------------------------------------------------------------------------
function BookingFooter({
  BackIcon,
  ForwardIcon,
}: {
  BackIcon: React.ElementType;
  ForwardIcon: React.ElementType;
}) {
  const { t, locale } = useT();
  const {
    step,
    setStep,
    selectedRoom,
    checkIn,
    checkOut,
    rooms,
    guest,
    paymentMethod,
  } = useBookingStore();
  const closeBooking = useUIStore((s) => s.closeBooking);

  const ciDate = fromISODate(checkIn);
  const coDate = fromISODate(checkOut);
  const nights = Math.max(0, calculateNights(ciDate, coDate));
  const currency = "YER";

  // Compute total (approx) — exact value is re-computed by API on submit
  const nightlyRate = selectedRoom?.nightlyRate ?? 0;
  const subtotal = nightlyRate * nights * rooms;

  const roomName = selectedRoom
    ? locale === "ar"
      ? selectedRoom.nameAr
      : selectedRoom.nameEn
    : "";

  const handleBack = () => {
    if (step === "guest") setStep("search");
    else if (step === "review") setStep("guest");
    else if (step === "payment") setStep("review");
  };

  const handleContinue = () => {
    if (step === "search") {
      if (!selectedRoom) {
        toast.error(t("booking.selectRoomFirst"));
        return;
      }
      setStep("guest");
    } else if (step === "guest") {
      // Validate guest info
      if (guest.fullName.trim().length < 3) {
        toast.error(t("booking.fillGuestInfo"));
        return;
      }
      if (guest.phone.replace(/\D/g, "").length < 6) {
        toast.error(t("booking.validPhone"));
        return;
      }
      if (
        guest.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)
      ) {
        toast.error(t("booking.validEmail"));
        return;
      }
      if (!guest.agreedPolicies) {
        toast.error(t("booking.acceptPolicies"));
        return;
      }
      setStep("review");
    } else if (step === "review") {
      setStep("payment");
    } else if (step === "payment") {
      // Trigger confirm via exposed handler from PaymentStep
      const w = window as unknown as Record<string, unknown>;
      const confirm = w.__bookingConfirm as (() => void) | undefined;
      const submitting = w.__bookingSubmitting as boolean | undefined;
      if (submitting) return;
      if (confirm) confirm();
    }
  };

  if (step === "search") {
    // No footer on search step (room selection advances to next step)
    return null;
  }

  const isPayment = step === "payment";
  const w = window as unknown as Record<string, unknown>;
  const submitting = !!w.__bookingSubmitting;

  return (
    <footer className="sticky bottom-0 z-30 border-t border-gold/20 bg-background/95 backdrop-blur-md">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: room + price summary */}
        <div className="min-w-0 flex-1">
          {selectedRoom && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground truncate">
                {roomName} · {nights}{" "}
                {nights === 1 ? t("booking.night") : t("booking.nights")}
                {rooms > 1 && ` · ${rooms} ${locale === "ar" ? "غرف" : "rooms"}`}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-base sm:text-lg font-bold text-gradient-gold">
                  {formatMoney(subtotal, currency, locale)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("booking.subtotal")}
                </span>
              </div>
            </div>
          )}
          {!selectedRoom && (
            <span className="text-sm text-muted-foreground">
              {t("booking.selectRoomFirst")}
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {step !== "guest" && (
            <Button variant="outline" onClick={handleBack} className="h-10">
              <BackIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t("booking.back")}</span>
            </Button>
          )}
          {step === "guest" && (
            <Button
              variant="ghost"
              onClick={closeBooking}
              className="h-10 text-muted-foreground"
            >
              {t("common.close")}
            </Button>
          )}

          {!isPayment && (
            <Button
              onClick={handleContinue}
              className="h-10 bg-gold-gradient text-gold-foreground hover:opacity-95 font-semibold shadow-sm"
              disabled={!selectedRoom}
            >
              {t("booking.continue")}
              <ForwardIcon className="w-4 h-4" />
            </Button>
          )}
          {isPayment && (
            <Button
              onClick={handleContinue}
              disabled={submitting || paymentMethod === "PAY_ONLINE"}
              className="h-10 bg-gold-gradient text-gold-foreground hover:opacity-95 font-semibold shadow-sm min-w-40"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t("booking.processing")}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t("booking.confirmBooking")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Confirmation HTML builder
// ---------------------------------------------------------------------------
function buildConfirmationHtml(opts: {
  bookingReference: string;
  guestName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  rooms: number;
  paymentMethod: string;
  locale: "ar" | "en";
}): string {
  const {
    bookingReference,
    guestName,
    roomName,
    checkIn,
    checkOut,
    nights,
    adults,
    children,
    rooms,
    paymentMethod,
    locale,
  } = opts;
  const isRTL = locale === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const lang = isRTL ? "ar" : "en";

  const title = isRTL ? "تأكيد حجز - فندق دار الياسمين الملكي" : "Booking Confirmation - Dar Al-Yasmin Royal Hotel";
  const paymentLabel =
    paymentMethod === "PAY_AT_HOTEL"
      ? isRTL
        ? "الدفع في الفندق"
        : "Pay at hotel"
      : paymentMethod === "DEPOSIT"
      ? isRTL
        ? "دفع عربون"
        : "Deposit"
      : paymentMethod === "PAY_ONLINE"
      ? isRTL
        ? "الدفع الإلكتروني"
        : "Pay online"
      : paymentMethod;

  const rows = [
    [isRTL ? "رقم الحجز" : "Booking reference", bookingReference],
    [isRTL ? "الاسم" : "Guest name", guestName],
    [isRTL ? "نوع الغرفة" : "Room type", roomName],
    [isRTL ? "تاريخ الوصول" : "Check-in", checkIn],
    [isRTL ? "تاريخ المغادرة" : "Check-out", checkOut],
    [isRTL ? "عدد الليالي" : "Nights", String(nights)],
    [
      isRTL ? "الضيوف" : "Guests",
      `${adults} ${isRTL ? "بالغ" : "adults"}${
        children > 0 ? ` + ${children} ${isRTL ? "طفل" : "children"}` : ""
      } • ${rooms} ${isRTL ? "غرف" : "rooms"}`,
    ],
    [isRTL ? "طريقة الدفع" : "Payment method", paymentLabel],
  ];

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px; font-family: 'Cairo', 'Segoe UI', system-ui, sans-serif; background: #faf7f0; color: #1a1a1a; }
  .container { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.08); border: 1px solid #e5d9b6; }
  .header { background: linear-gradient(135deg, #0f5132 0%, #0a7c5a 100%); color: #fff; padding: 32px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
  .header .ref { margin-top: 8px; font-size: 14px; opacity: 0.9; }
  .header .ref strong { font-family: 'Courier New', monospace; font-size: 18px; letter-spacing: 1px; display: inline-block; margin-top: 4px; padding: 4px 12px; background: rgba(255,255,255,0.15); border-radius: 8px; }
  .body { padding: 32px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 12px 0; border-bottom: 1px solid #f0e8d0; font-size: 14px; vertical-align: top; }
  td:first-child { color: #6b6b6b; width: 40%; }
  td:last-child { font-weight: 600; color: #1a1a1a; }
  .footer { padding: 24px 32px; background: #faf7f0; text-align: center; color: #6b6b6b; font-size: 12px; border-top: 1px solid #f0e8d0; }
  .check { display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: #d1fae5; margin-bottom: 12px; position: relative; }
  .check:after { content: ''; position: absolute; left: 18px; top: 12px; width: 16px; height: 28px; border-right: 4px solid #059669; border-bottom: 4px solid #059669; transform: rotate(45deg); }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="check"></div>
      <h1>${title}</h1>
      <div class="ref">${isRTL ? "رقم الحجز" : "Booking reference"}<br/><strong>${bookingReference}</strong></div>
    </div>
    <div class="body">
      <table>
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td>${k}</td><td>${v}</td></tr>`
          )
          .join("\n        ")}
      </table>
    </div>
    <div class="footer">
      ${isRTL ? "فندق دار الياسمين الملكي — عدن، اليمن" : "Dar Al-Yasmin Royal Hotel — Aden, Yemen"}
      <br/>${
        isRTL
          ? "يرجى تقديم رقم الحجز عند الوصول."
          : "Please present your booking reference upon arrival."
      }
    </div>
  </div>
</body>
</html>`;
}
