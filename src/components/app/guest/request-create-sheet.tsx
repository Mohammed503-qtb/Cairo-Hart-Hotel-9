"use client";

// RequestCreateSheet — bottom sheet for creating a new guest request.
// Pre-filled when tapping a service from the catalog, OR open as a custom request.

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { GuestLocale, t } from "./i18n";
import { apiPost } from "./use-fetch";
import { toast } from "sonner";

export interface CreateRequestTarget {
  // If preset for a service:
  serviceId?: string;
  categorySlug?: string;
  serviceNameAr?: string;
  serviceNameEn?: string;
  isChargeable?: boolean;
  price?: number;
  expectedResponseMinutes?: number;
  // If custom:
  custom?: boolean;
}

interface Props {
  target: CreateRequestTarget | null;
  onClose: () => void;
  locale: GuestLocale;
  onCreated: (requestId: string) => void;
}

export function RequestCreateSheet({ target, onClose, locale, onCreated }: Props) {
  const isRTL = locale === "ar";
  const open = !!target;

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<"NORMAL" | "URGENT">("NORMAL");
  const [preferredTime, setPreferredTime] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Reset when target changes
  React.useEffect(() => {
    if (target) {
      const presetName = locale === "ar" ? target.serviceNameAr : target.serviceNameEn || target.serviceNameAr || "";
      setTitle(presetName || "");
      setDescription("");
      setPriority("NORMAL");
      setPreferredTime("");
      setErr(null);
    }
  }, [target, locale]);

  async function handleSubmit() {
    if (!target) return;
    if (!title.trim()) {
      setErr(t("errTitleRequired", locale));
      return;
    }
    setErr(null);
    setSubmitting(true);
    const category = target.custom ? "other" : target.categorySlug || "other";
    const service = target.custom ? "custom" : target.serviceId || "custom";
    const res = await apiPost("/api/app/guest/requests", {
      category,
      service,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      preferredTime: preferredTime.trim() || undefined,
      serviceId: target.serviceId || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      const data = res.data as { request?: { id: string } };
      const isChargeable = !!target.isChargeable && (target.price || 0) > 0;
      toast.success(isChargeable ? t("toastRequestCreatedWithCharge", locale) : t("toastRequestCreated", locale));
      onCreated(data.request?.id || "");
    } else {
      const errMap: Record<string, string> = {
        stayNotCheckedIn: t("errStayNotCheckedIn", locale),
        serviceNotFound: locale === "ar" ? "الخدمة غير موجودة" : "Service not found",
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
            <Sparkles className="w-5 h-5 text-amber-500" />
            {target?.custom ? t("customRequest", locale) : t("createRequest", locale)}
          </SheetTitle>
          <SheetDescription className="text-xs text-slate-500">
            {target && !target.custom && target.expectedResponseMinutes
              ? `${t("expectedResponse", locale)}: ${target.expectedResponseMinutes} ${t("minutes", locale)}`
              : t("requestDetail", locale)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Chargeable notice */}
          {target && target.isChargeable && (target.price || 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-none mt-0.5" />
              <p className="text-xs text-amber-800">
                {t("chargeable", locale)} — {t("estimatedCost", locale)}:{" "}
                <span className="font-bold" dir="ltr">
                  {target.price?.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} YER
                </span>
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">{t("title", locale)}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={locale === "ar" ? "عنوان الطلب" : "Request title"}
              className="mt-1 h-12 text-base"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">{t("description", locale)}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder", locale)}
              className="mt-1 min-h-[88px] text-sm"
            />
          </div>

          {/* Priority */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">{t("priority", locale)}</Label>
            <RadioGroup
              value={priority}
              onValueChange={(v) => setPriority(v as "NORMAL" | "URGENT")}
              className="grid grid-cols-2 gap-2 mt-2"
            >
              <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${priority === "NORMAL" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                <RadioGroupItem value="NORMAL" id="pri-normal" />
                <span className="text-sm font-semibold text-slate-700">{t("priorityNormal", locale)}</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition ${priority === "URGENT" ? "border-red-500 bg-red-50" : "border-slate-200 bg-white"}`}>
                <RadioGroupItem value="URGENT" id="pri-urgent" />
                <span className="text-sm font-semibold text-red-700">{t("priorityUrgent", locale)}</span>
              </label>
            </RadioGroup>
          </div>

          {/* Preferred time */}
          <div>
            <Label className="text-sm font-semibold text-slate-700">{t("preferredTime", locale)}</Label>
            <Input
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              placeholder={t("preferredTimePlaceholder", locale)}
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
          <Button onClick={handleSubmit} disabled={submitting || !title.trim()} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {t("submit", locale)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
