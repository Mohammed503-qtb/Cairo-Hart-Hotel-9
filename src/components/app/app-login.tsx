"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, ArrowRight, ArrowLeft, Hotel, AlertCircle, X } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

export function AppLogin() {
  const isRTL = useUIStore((s) => s.locale === "ar");
  const setSession = useAppStore((s) => s.setSession);
  const setSessionLoading = useAppStore((s) => s.setSessionLoading);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 9) {
      setError(isRTL ? "الرمز يجب أن يكون 9 أحرف على الأقل" : "Code must be at least 9 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/app/auth/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMap: Record<string, string> = {
          invalidCode: isRTL ? "رمز الدخول غير صحيح. يرجى التحقق والمحاولة مرة أخرى." : "Invalid access code. Please check and try again.",
          codeExpired: isRTL ? "انتهت صلاحية هذا الرمز. يرجى الاتصال بالاستقبال." : "This access code has expired. Please contact reception.",
          codeRevoked: isRTL ? "تم إلغاء هذا الرمز." : "This access code has been revoked.",
          stayEnded: isRTL ? "انتهت إقامتك. لم يعد بإمكانك الوصول إلى التطبيق." : "Your stay has ended. You can no longer access the app.",
          rateLimited: isRTL ? `محاولات كثيرة. حاول مرة أخرى بعد ${data.retryAfterMinutes || 15} دقيقة.` : `Too many failed attempts. Please try again in ${data.retryAfterMinutes || 15} minutes.`,
          noStayBound: isRTL ? "الرمز غير مربوط بإقامة." : "Code is not bound to a stay.",
          staffInactive: isRTL ? "الحساب غير نشط." : "Staff account is inactive.",
          enterCode: isRTL ? "أدخل الرمز" : "Enter code",
          server_error: isRTL ? "خطأ في الخادم" : "Server error",
        };
        const msg = errMap[data.error] || data.error || (isRTL ? "خطأ" : "Error");
        setError(msg);
        return;
      }
      // Success: fetch session to populate store
      toast.success(isRTL ? "تم تسجيل الدخول بنجاح" : "Logged in successfully");
      const sres = await fetch("/api/app/session", { cache: "no-store" });
      const sdata = await sres.json();
      if (sres.ok && sdata.ok) {
        setSession(sdata);
        setSessionLoading(false);
      } else {
        setError(isRTL ? "تعذّر استرجاع الجلسة" : "Could not fetch session");
      }
    } catch (err) {
      console.error(err);
      setError(isRTL ? "تعذّر الاتصال بالخادم" : "Could not connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-10" dir={isRTL ? "rtl" : "ltr"}>
      {/* Decorative top */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-4">
          <Hotel className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-1">
          {isRTL ? "دار الياسمين الملكي" : "Dar Al-Yasmin Royal"}
        </h1>
        <p className="text-amber-300/80 text-sm mb-8">
          {isRTL ? "تطبيق الفندق" : "Hotel App"}
        </p>

        <Card className="w-full bg-white/95 backdrop-blur border-amber-300/30 shadow-2xl">
          <CardContent className="pt-6 pb-6 px-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-emerald-900">
                {isRTL ? "أدخل رمز الدخول" : "Enter Your Access Code"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="H123456XX"
                  className="text-center text-lg font-mono tracking-widest h-14 bg-emerald-50/50 border-emerald-200 focus:border-amber-400"
                  dir="ltr"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={12}
                />
                <p className="text-xs text-emerald-700/70 mt-1.5 text-center">
                  {isRTL ? "رمز الضيف: H... • الاستقبال: R... • المشرف: A..." : "Guest: H... • Reception: R... • Admin: A..."}
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full h-12 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-base shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isRTL ? "دخول" : "Login"}
                    {isRTL ? <ArrowLeft className="w-5 h-5 ms-2" /> : <ArrowRight className="w-5 h-5 ms-2" />}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-emerald-100 text-center">
              <p className="text-xs text-emerald-700/70">
                {isRTL ? "هل تحتاج مساعدة؟ اتصل بالاستقبال" : "Need help? Contact reception"}
              </p>
              <p className="text-sm font-semibold text-emerald-900 mt-1" dir="ltr">+967 700 000 002</p>
            </div>
          </CardContent>
        </Card>

        <p className="text-emerald-200/60 text-xs mt-6 text-center">
          {isRTL ? "© 2026 فندق دار الياسمين الملكي — عدن، اليمن" : "© 2026 Dar Al-Yasmin Royal Hotel — Aden, Yemen"}
        </p>
      </div>
    </div>
  );
}
