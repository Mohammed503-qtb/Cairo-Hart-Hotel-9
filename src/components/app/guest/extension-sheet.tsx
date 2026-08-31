"use client";

// ExtensionSheet — request to extend the stay (pick a new check-out date).

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, CalendarPlus } from "lucide-react";
import { GuestLocale, t } from "./i18n";
import { apiPost } from "./use-fetch";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  locale: GuestLocale;
  currentCheckOut: string; // ISO string
  basePrice?: number;
  onSubmitted: () => void;
}

export function ExtensionSheet({ open, onClose, locale, currentCheckOut, basePrice = 0, onSubmitted }: Props) {
  const isRTL = locale === "ar";
  const [newCheckOut, setNewCheckOut] = React.useState("");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setNewCheckOut("");
      setNote("");
      setErr(null);
    }
  }, [open]);

  const currentCheckOutDate = new Date(currentCheckOut);
  const minDate = new Date(currentCheckOutDate.getTime() + 24 * 60 * 60 * 1000);
  const minDateStr = minDate.toISOString().slice(0, 10);
  const today = new Date(currentCheckOut);

  // Compute preview cost
  const additionalNights = React.useMemo(() => {
    if (!newCheckOut) return 0;
    const req = new Date(newCheckOut);
    if (isNaN(req.getTime())) return 0;
    const diff = req.getTime() - today.getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  }, [newCheckOut, today]);

  const estimatedCost = React.useMemo(() => {
    return Math.round(additionalNights * basePrice * 1.07); // approx incl. tax+service
  }, [additionalNights, basePrice]);

  async function handleSubmit() {
    if (!newCheckOut) {
      setErr(locale === "ar" ? "اختر تاريخ المغادرة الجديد" : "Pick a new check-out date");
      return;
    }
    setErr(null);
    setSubmitting(true);
    const res = await apiPost("/api/app/guest/extension", {
      requestedCheckOut: newCheckOut,
      note: note.trim() || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("toastExtensionSent", locale));
      onSubmitted();
      onClose();
    } else {
      const errMap: Record<string, string> = {
        mustBeAfterCurrent: t("errMustBeAfter", locale),
        stayNotCheckedIn: t("errStayNotCheckedIn", locale),
        invalidDate: locale === "ar" ? "تاريخ غير صالح" : "Invalid date",
      };
      setErr(errMap[res.error || ""] || t("errGeneric", locale));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[92dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-0">
          <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-emerald-600" />
            {t("extensionTitle", locale)}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">{t("extensionHint", locale)}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Current checkout info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <p className="text-xs text-slate-500">{t("checkOut", locale)}</p>
            <p className="text-base font-bold text-slate-800">
              {currentCheckOutDate.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* New checkout picker */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">{t("newCheckOut", locale)}</Label>
            <Input
              type="date"
              value={newCheckOut}
              min={minDateStr}
              onChange={(e) => setNewCheckOut(e.target.value)}
              className="mt-1 h-12 text-base"
              dir="ltr"
            />
          </div>

          {/* Estimated cost preview */}
          {newCheckOut && additionalNights > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{t("additionalNights", locale)}</span>
                <span className="font-bold text-slate-800">{additionalNights}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{t("estimatedCost", locale)}</span>
                <span className="font-bold text-emerald-700" dir="ltr">
                  {estimatedCost.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} YER
                </span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                {locale === "ar" ? "تشمل الضريبة والرسوم — التقدير نهائي عند الموافقة." : "Includes taxes & service charges — finalized upon approval."}
              </p>
            </div>
          )}

          {/* Note */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">{t("extensionNote", locale)}</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={locale === "ar" ? "ملاحظة اختيارية للاستقبال" : "Optional note for reception"}
              className="mt-1 h-11 text-sm"
            />
          </div>

          {err && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-none mt-0.5" />
              <p className="text-sm text-red-700">{err}</p>
            </div>
          )}
        </div>

        <div className="flex-none border-t border-slate-200 p-3 bg-white flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 h-12 text-base font-bold">
            {t("cancel", locale)}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !newCheckOut} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarPlus className="w-5 h-5" />}
            {t("submitExtension", locale)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
