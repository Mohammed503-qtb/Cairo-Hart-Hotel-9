"use client";

// PaymentSheet — record a payment for a stay.

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, CreditCard } from "lucide-react";
import { ReceptLocale, t } from "./i18n";
import { useFetch, apiPost } from "./use-fetch";
import { LoadingSpinner, Money } from "@/components/app/shared";
import { toast } from "sonner";

interface StayDetail {
  ok: boolean;
  stay: { id: string; stayNumber: string; balance: number; checkIn: string; checkOut: string };
  guest: { id: string; fullName: string; phone: string };
  room: { id: string; roomNumber: string; roomType: { id: string; slug: string; nameAr: string; nameEn: string } | null };
  reservation: { id: string; bookingReference: string; grandTotal: number; paidTotal: number; paymentStatus: string; currency: string } | null;
  financialSummary: { chargesTotal: number; paymentsTotal: number; balance: number };
}

interface Props {
  stayId: string | null;
  onClose: () => void;
  locale: ReceptLocale;
  onDone: () => void;
}

export function PaymentSheet({ stayId, onClose, locale, onDone }: Props) {
  const isRTL = locale === "ar";
  const open = !!stayId;
  const { data, loading } = useFetch<StayDetail>(stayId ? `/api/app/reception/inhouse/${stayId}` : "", {
    enabled: !!stayId,
  });
  const [amount, setAmount] = React.useState<string>("");
  const [method, setMethod] = React.useState<string>("PAY_AT_HOTEL");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (data?.stay.balance) {
      setAmount(String(Math.round(data.stay.balance)));
    }
  }, [data?.stay.balance]);

  async function handleSubmit() {
    if (!stayId) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error(locale === "ar" ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount");
      return;
    }
    setSubmitting(true);
    const res = await apiPost("/api/app/reception/payments", {
      stayId,
      amount: amt,
      method,
      note: note.trim() || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("toastPaymentOk", locale));
      onDone();
    } else {
      const errMap: Record<string, string> = {
        noLinkedReservation: locale === "ar" ? "لا يوجد حجز مرتبط" : "No linked reservation",
        invalidAmount: locale === "ar" ? "مبلغ غير صحيح" : "Invalid amount",
      };
      toast.error(errMap[res.error || ""] || t("errGeneric", locale));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[90dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-0">
          <SheetTitle className="text-lg font-bold text-slate-900">{t("recordPayment", locale)}</SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            {data ? `${data.guest.fullName} • ${t("room", locale)} ${data.room.roomNumber}` : t("loading", locale)}
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 py-4 space-y-4">
          {loading && !data ? (
            <LoadingSpinner label={t("loading", locale)} />
          ) : !data ? null : (
            <>
              {/* Balance summary */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{t("charges", locale)}</span>
                  <span className="font-semibold"><Money amount={data.financialSummary.chargesTotal} locale={locale} /></span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{t("payments", locale)}</span>
                  <span className="font-semibold text-emerald-700"><Money amount={data.financialSummary.paymentsTotal} locale={locale} /></span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-emerald-100">
                  <span className="text-sm font-bold text-slate-700">{t("balance", locale)}</span>
                  <span className="text-base font-bold text-rose-600"><Money amount={data.financialSummary.balance} locale={locale} /></span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700">{t("amount", locale)}</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0"
                  inputMode="decimal"
                  className="mt-1 h-12 text-base text-end"
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700">{t("method", locale)}</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="h-12 text-base w-full mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAY_AT_HOTEL">{t("paymentMethodCash", locale)}</SelectItem>
                    <SelectItem value="CARD">{t("paymentMethodCard", locale)}</SelectItem>
                    <SelectItem value="PAY_ONLINE">{t("paymentMethodOnline", locale)}</SelectItem>
                    <SelectItem value="BANK_TRANSFER">{t("paymentMethodBank", locale)}</SelectItem>
                  </SelectContent>
                </Select>
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

              <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {t("submit", locale)}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
