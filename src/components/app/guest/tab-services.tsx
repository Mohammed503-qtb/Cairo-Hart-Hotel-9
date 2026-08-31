"use client";

// ServicesTab — service catalog grouped by category. Tap a service → opens CreateRequest sheet.
// Custom Request button at the top.

import * as React from "react";
import {
  AlertCircle,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  Wrench,
  BellRing,
  ConciergeBell,
  ShowerHead,
  SprayCan,
  BedDouble,
  AirVent,
  Droplets,
  PlugZap,
  Tv,
  Wifi,
  HandHelping,
  UtensilsCrossed,
  Shirt,
  MessageCircleQuestion,
  CalendarPlus,
  DoorOpen,
  LogOut as LogOutIcon,
} from "lucide-react";
import { GuestLocale, t } from "./i18n";
import { useFetch } from "./use-fetch";
import { EmptyState, LoadingSpinner } from "@/components/app/shared";
import { CreateRequestTarget } from "./request-create-sheet";

interface ServicesData {
  ok: boolean;
  categories: Array<{
    id: string;
    slug: string;
    nameAr: string;
    nameEn: string;
    iconKey: string | null;
    services: Array<{
      id: string;
      slug: string;
      nameAr: string;
      nameEn: string;
      iconKey: string | null;
      isChargeable: boolean;
      price: number;
      expectedResponseMinutes: number;
    }>;
  }>;
}

interface Props {
  locale: GuestLocale;
  onCreate: (target: CreateRequestTarget) => void;
}

export function ServicesTab({ locale, onCreate }: Props) {
  const { data, loading, error, refresh } = useFetch<ServicesData>("/api/app/guest/services", { intervalMs: 60_000 });

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{t("servicesTitle", locale)}</h2>
        <button onClick={refresh} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label={t("refresh", locale)}>
          <RefreshCw className={`w-4 h-4 ${loading && data ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Custom request button */}
      <div className="p-3">
        <button
          onClick={() => onCreate({ custom: true })}
          className="w-full bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl p-3 shadow-md flex items-center justify-between transition"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <div className="text-start">
              <p className="text-sm font-bold">{t("customRequest", locale)}</p>
              <p className="text-[11px] text-emerald-100">{t("newRequest", locale)}</p>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
        </button>
      </div>

      {loading && !data ? (
        <LoadingSpinner label={t("loading", locale)} />
      ) : error ? (
        <EmptyState icon={<AlertCircle className="w-7 h-7" />} title={t("error", locale)} subtitle={error} action={
          <button onClick={refresh} className="text-amber-700 font-semibold text-sm">{t("retry", locale)}</button>
        } />
      ) : !data ? null : data.categories.length === 0 ? (
        <EmptyState icon={<Sparkles className="w-7 h-7" />} title={t("noServices", locale)} />
      ) : (
        <div className="px-3 pb-3 space-y-4">
          {data.categories.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-slate-50/60">
                <CategoryIcon iconKey={c.iconKey} />
                <h3 className="text-sm font-bold text-slate-900">{locale === "ar" ? c.nameAr : c.nameEn}</h3>
                <span className="ms-auto text-[10px] text-slate-400">{c.services.length}</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {c.services.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => onCreate({
                        serviceId: s.id,
                        categorySlug: c.slug,
                        serviceNameAr: s.nameAr,
                        serviceNameEn: s.nameEn,
                        isChargeable: s.isChargeable,
                        price: s.price,
                        expectedResponseMinutes: s.expectedResponseMinutes,
                      })}
                      className="w-full text-start px-3 py-3 hover:bg-emerald-50/40 transition flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-none">
                        <ServiceIcon iconKey={s.iconKey} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{locale === "ar" ? s.nameAr : s.nameEn}</p>
                        <p className="text-[11px] text-slate-500">
                          {s.expectedResponseMinutes > 0 && (
                            <span>~{s.expectedResponseMinutes} {t("minutes", locale)}</span>
                          )}
                          {s.isChargeable && s.price > 0 && (
                            <span className="ms-2 text-amber-600 font-bold" dir="ltr">
                              {s.price.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} YER
                            </span>
                          )}
                        </p>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-300 rtl:rotate-180" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Map iconKey string to a Lucide icon. Falls back to a Sparkles icon.

function ServiceIcon({ iconKey }: { iconKey: string | null }) {
  const map: Record<string, React.ReactNode> = {
    Sparkles: <Sparkles className="w-4 h-4" />,
    Wrench: <Wrench className="w-4 h-4" />,
    BellRing: <BellRing className="w-4 h-4" />,
    ConciergeBell: <ConciergeBell className="w-4 h-4" />,
    ShowerHead: <ShowerHead className="w-4 h-4" />,
    Pump: <SprayCan className="w-4 h-4" />,
    BedDouble: <BedDouble className="w-4 h-4" />,
    AirVent: <AirVent className="w-4 h-4" />,
    Droplets: <Droplets className="w-4 h-4" />,
    PlugZap: <PlugZap className="w-4 h-4" />,
    Tv: <Tv className="w-4 h-4" />,
    Wifi: <Wifi className="w-4 h-4" />,
    HandHelping: <HandHelping className="w-4 h-4" />,
    UtensilsCrossed: <UtensilsCrossed className="w-4 h-4" />,
    Shirt: <Shirt className="w-4 h-4" />,
    MessageCircleQuestion: <MessageCircleQuestion className="w-4 h-4" />,
    CalendarPlus: <CalendarPlus className="w-4 h-4" />,
    DoorOpen: <DoorOpen className="w-4 h-4" />,
    LogOut: <LogOutIcon className="w-4 h-4" />,
  };
  return <>{map[iconKey || ""] || <Sparkles className="w-4 h-4" />}</>;
}

function CategoryIcon({ iconKey }: { iconKey: string | null }) {
  return (
    <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700">
      <ServiceIcon iconKey={iconKey} />
    </div>
  );
}
