"use client";

// CheckoutSheet — request checkout. Note field. Submit → AppNotification for RECEPTION.

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, LogOut } from "lucide-react";
import { GuestLocale, t } from "./i18n";
import { apiPost } from "./use-fetch";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  locale: GuestLocale;
  onSubmitted: () => void;
}

export function CheckoutSheet({ open, onClose, locale, onSubmitted }: Props) {
  const isRTL = locale === "ar";
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setNote("");
      setErr(null);
    }
  }, [open]);

  async function handleSubmit() {
    setErr(null);
    setSubmitting(true);
    const res = await apiPost("/api/app/guest/checkout", { note: note.trim() || undefined });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t("toastCheckoutSent", locale));
      onSubmitted();
      onClose();
    } else {
      const errMap: Record<string, string> = {
        alreadyPending: t("errAlreadyPending", locale),
        stayNotCheckedIn: t("errStayNotCheckedIn", locale),
      };
      setErr(errMap[res.error || ""] || t("errGeneric", locale));
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[80dvh] p-0 rounded-t-3xl bg-white flex flex-col"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100 space-y-0">
          <SheetTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <LogOut className="w-5 h-5 text-emerald-600" />
            {t("checkoutTitle", locale)}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">{t("checkoutHint", locale)}</SheetDescription>
        </SheetHeader>

        <div className="px-5 py-4 space-y-4">
          <div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("checkoutNote", locale)}
              className="min-h-[88px] text-sm"
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
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            {t("submitCheckout", locale)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
