"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Status badge component for app views
const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700 border-slate-200",
  ACKNOWLEDGED: "bg-blue-100 text-blue-700 border-blue-200",
  ASSIGNED: "bg-purple-100 text-purple-700 border-purple-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  WAITING: "bg-orange-100 text-orange-700 border-orange-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  // Reservation statuses
  CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PAYMENT_PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  // Stay statuses
  EXPECTED: "bg-blue-100 text-blue-700 border-blue-200",
  CHECKED_IN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CHECKED_OUT: "bg-slate-100 text-slate-700 border-slate-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
  // Room statuses
  AVAILABLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  OCCUPIED: "bg-red-100 text-red-700 border-red-200",
  RESERVED: "bg-blue-100 text-blue-700 border-blue-200",
  DIRTY: "bg-orange-100 text-orange-700 border-orange-200",
  CLEANING: "bg-amber-100 text-amber-700 border-amber-200",
  CLEAN: "bg-teal-100 text-teal-700 border-teal-200",
  OUT_OF_ORDER: "bg-slate-200 text-slate-600 border-slate-300",
  OUT_OF_SERVICE: "bg-slate-200 text-slate-600 border-slate-300",
  // Payment statuses
  UNPAID: "bg-amber-100 text-amber-700 border-amber-200",
  PARTIAL: "bg-blue-100 text-blue-700 border-blue-200",
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const cls = STATUS_STYLES[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border", cls, className)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// Priority badge
export function PriorityBadge({ priority }: { priority: string }) {
  const isUrgent = priority === "URGENT";
  return (
    <span className={cn(
      "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold",
      isUrgent ? "bg-red-100 text-red-700 animate-pulse" : "bg-slate-100 text-slate-600"
    )}>
      {isUrgent ? "🔴" : "🟡"} {priority}
    </span>
  );
}

// Format helpers using existing lib/format
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";

export function Money({ amount, currency = "YER", locale = "ar" as const }: { amount: number; currency?: string; locale?: "ar" | "en" }) {
  return <span>{formatMoney(amount, currency, locale)}</span>;
}

export function DateStr({ value, locale = "ar" as const, withTime = false }: { value: string | Date; locale?: "ar" | "en"; withTime?: boolean }) {
  const d = typeof value === "string" ? new Date(value) : value;
  return <span>{withTime ? formatDateTime(d, locale) : formatDate(d, locale)}</span>;
}

// Section header for app screens
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 -ms-1">
            <svg className="w-5 h-5 text-slate-700 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-base font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

// Empty state
export function EmptyState({ icon, title, subtitle, action }: { icon?: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">{icon}</div>}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Loading spinner
export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      {label && <p className="text-sm text-slate-500 mt-2">{label}</p>}
    </div>
  );
}
