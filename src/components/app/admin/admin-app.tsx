"use client";

// AdminApp — main mobile app component for the Admin persona.
// Bottom navigation: Dashboard / Setup / Guests / Reports.
// Sheets: CodeSheet (generate access code), AuditSheet (audit log), StaffSheet (created via GuestsTab).
//
// The Admin persona is a staff member with role ADMIN or MASTER_ADMIN.
// They can: see KPIs, generate access codes (GUEST/RECEPTION/ADMIN), manage staff,
// update hotel settings, view reservations/guests/reports, and audit logs.

import * as React from "react";
import { LayoutDashboard, Settings, Users, BarChart3, LogOut, X, ShieldCheck } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { AdminLocale, t } from "./i18n";
import { DashboardTab } from "./tab-dashboard";
import { SetupTab } from "./tab-setup";
import { GuestsTab } from "./tab-guests";
import { ReportsTab } from "./tab-reports";
import { CodeSheet } from "./code-sheet";
import { AuditSheet } from "./audit-sheet";

type TabKey = "dashboard" | "setup" | "guests" | "reports";

interface Props {
  onLogout: () => void;
  onClose: () => void;
  standalone?: boolean;
}

export function AdminApp({ onLogout, onClose, standalone = false }: Props) {
  const locale = (useUIStore((s) => s.locale) as "ar" | "en") || "ar";
  const isRTL = locale === "ar";
  const session = useAppStore((s) => s.session);
  const [activeTab, setActiveTab] = React.useState<TabKey>("dashboard");

  // Shared sheet state
  const [codeSheetOpen, setCodeSheetOpen] = React.useState(false);
  const [codeSheetType, setCodeSheetType] = React.useState<"GUEST" | "RECEPTION" | "ADMIN">("GUEST");
  const [auditSheetOpen, setAuditSheetOpen] = React.useState(false);

  const staffName = session?.staff?.fullName || "—";
  const role = session?.staff?.role || "ADMIN";
  const roleLabel = role === "MASTER_ADMIN" ? t("roleMaster", locale) : role === "ADMIN" ? t("roleAdmin", locale) : t("roleReception", locale);

  function openCodeSheet(type?: "GUEST" | "RECEPTION" | "ADMIN") {
    if (type) setCodeSheetType(type);
    else setCodeSheetType("GUEST");
    setCodeSheetOpen(true);
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="relative h-full w-full flex flex-col bg-cream/40 overflow-hidden">
      {/* Top bar */}
      <header className="flex-none h-14 px-4 flex items-center justify-between bg-gradient-to-l from-emerald-900 to-emerald-800 text-white shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[11px] leading-tight text-amber-200/90">{t("appTitle", locale)} • {roleLabel}</p>
            <p className="text-sm font-bold leading-tight">{staffName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label={t("logout", locale)}
          >
            <LogOut className="w-5 h-5 rtl:rotate-180" />
          </button>
          {!standalone && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              aria-label={t("closeApp", locale)}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "dashboard" && (
          <DashboardTab locale={locale} onGenerateCode={() => openCodeSheet()} />
        )}
        {activeTab === "setup" && <SetupTab locale={locale} />}
        {activeTab === "guests" && <GuestsTab locale={locale} />}
        {activeTab === "reports" && (
          <ReportsTab locale={locale} onOpenAudit={() => setAuditSheetOpen(true)} />
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="flex-none h-16 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] flex items-stretch">
        <TabButton
          active={activeTab === "dashboard"}
          icon={<LayoutDashboard className="w-5 h-5" />}
          label={t("tabDashboard", locale)}
          onClick={() => setActiveTab("dashboard")}
        />
        <TabButton
          active={activeTab === "setup"}
          icon={<Settings className="w-5 h-5" />}
          label={t("tabSetup", locale)}
          onClick={() => setActiveTab("setup")}
        />
        <TabButton
          active={activeTab === "guests"}
          icon={<Users className="w-5 h-5" />}
          label={t("tabGuests", locale)}
          onClick={() => setActiveTab("guests")}
        />
        <TabButton
          active={activeTab === "reports"}
          icon={<BarChart3 className="w-5 h-5" />}
          label={t("tabReports", locale)}
          onClick={() => setActiveTab("reports")}
        />
      </nav>

      {/* Sheets */}
      <CodeSheet
        open={codeSheetOpen}
        onClose={() => setCodeSheetOpen(false)}
        locale={locale}
        initialType={codeSheetType}
      />
      <AuditSheet
        open={auditSheetOpen}
        onClose={() => setAuditSheetOpen(false)}
        locale={locale}
      />
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
        active ? "text-amber-600" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <span className={cn("transition-transform", active && "scale-110")}>{icon}</span>
      <span className={cn("text-[10px] font-medium", active && "font-bold")}>{label}</span>
    </button>
  );
}

export type { AdminLocale };
