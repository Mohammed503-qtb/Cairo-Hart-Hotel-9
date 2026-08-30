"use client";

import { Clock, Ban, CreditCard, Baby, Cigarette, PawPrint, UserCheck, IdCard, Users, LogIn } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { usePolicies } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalized } from "@/hooks/use-t";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

const CATEGORY_META: Record<string, { icon: typeof Clock; labelKey: string; color: string }> = {
  checkin: { icon: LogIn, labelKey: "policies.checkin", color: "bg-emerald-50 text-emerald-700" },
  checkout: { icon: Clock, labelKey: "policies.checkout", color: "bg-amber-50 text-amber-700" },
  cancellation: { icon: Ban, labelKey: "policies.cancellation", color: "bg-rose-50 text-rose-700" },
  noshow: { icon: Ban, labelKey: "policies.noshow", color: "bg-red-50 text-red-700" },
  payment: { icon: CreditCard, labelKey: "policies.payment", color: "bg-sky-50 text-sky-700" },
  children: { icon: Baby, labelKey: "policies.children", color: "bg-pink-50 text-pink-700" },
  smoking: { icon: Cigarette, labelKey: "policies.smoking", color: "bg-orange-50 text-orange-700" },
  pets: { icon: PawPrint, labelKey: "policies.pets", color: "bg-purple-50 text-purple-700" },
  guests: { icon: Users, labelKey: "policies.guests", color: "bg-teal-50 text-teal-700" },
  id: { icon: IdCard, labelKey: "policies.id", color: "bg-indigo-50 text-indigo-700" },
};

export function PoliciesSection() {
  const { t } = useT();
  const loc = useLocalized();
  const { data: policies, isLoading } = usePolicies();

  return (
    <section id="policies" className="py-16 lg:py-24 bg-background scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold mb-3">
            <UserCheck className="w-3.5 h-3.5" /> {t("nav.policies")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">{t("policies.title")}</h2>
          <p className="text-muted-foreground text-base lg:text-lg">{t("policies.subtitle")}</p>
        </Reveal>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {(policies || []).map((p) => {
              const meta = CATEGORY_META[p.category] || { icon: Clock, labelKey: "policies.title", color: "bg-muted text-muted-foreground" };
              const Icon = meta.icon;
              return (
                <div
                  key={p.id}
                  className="group p-5 rounded-2xl bg-card border border-border/50 hover:border-gold/40 hover:shadow-luxury transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", meta.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-sm">{t(meta.labelKey)}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {loc(p.bodyAr, p.bodyEn)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
