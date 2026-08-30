"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, MessageCircle, Facebook, Instagram, Twitter, Send } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useHotel } from "@/hooks/use-data";
import { useUIStore } from "@/stores/ui-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Footer() {
  const { t, locale } = useT();
  const { data: hotel } = useHotel();
  const openBooking = useUIStore((s) => s.openBooking);
  const [subscribing, setSubscribing] = useState(false);

  if (!hotel) {
    return <footer className="mt-auto bg-deep text-white py-12" />;
  }

  const name = locale === "ar" ? hotel.nameAr : hotel.nameEn;
  const address = locale === "ar" ? hotel.addressAr : hotel.addressEn;
  const city = locale === "ar" ? hotel.cityAr : hotel.cityEn;

  const navTo = (href: string) => document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    if (!email) return;

    setSubscribing(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.already_subscribed) {
          toast.success(locale === "ar" ? "أنت مشترك بالفعل! شكراً لك." : "You're already subscribed! Thank you.");
        } else if (data.reactivated) {
          toast.success(locale === "ar" ? "تم إعادة تفعيل اشتراكك!" : "Your subscription has been reactivated!");
        } else {
          toast.success(locale === "ar" ? "تم اشتراكك بنجاح! ترقب عروضنا الحصرية." : "Subscribed successfully! Watch for our exclusive offers.");
        }
        form.reset();
      } else {
        toast.error(locale === "ar" ? "بريد إلكتروني غير صحيح" : "Invalid email");
      }
    } catch {
      toast.error(locale === "ar" ? "تعذر الاشتراك. حاول مرة أخرى." : "Could not subscribe. Try again.");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="mt-auto bg-deep text-white relative overflow-hidden">
      {/* Pattern */}
      <div className="absolute inset-0 opacity-5 section-pattern" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gold-gradient flex items-center justify-center shadow-lg">
                <span className="font-display text-xl font-bold text-gold-foreground">ي</span>
              </div>
              <div>
                <div className="font-display font-bold text-base leading-tight">{name}</div>
                <div className="text-[10px] text-gold-soft uppercase tracking-wider">Aden • Yemen</div>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              {locale === "ar" ? hotel.taglineAr : hotel.taglineEn}
            </p>
            <div className="flex gap-2">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground flex items-center justify-center transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display font-bold text-sm mb-4 text-gold">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: t("nav.rooms"), href: "#rooms" },
                { label: t("nav.facilities"), href: "#facilities" },
                { label: t("nav.gallery"), href: "#gallery" },
                { label: t("nav.offers"), href: "#offers" },
                { label: t("nav.about"), href: "#about" },
                { label: t("nav.faq"), href: "#faq" },
              ].map((item) => (
                <li key={item.href}>
                  <button onClick={() => navTo(item.href)} className="text-white/70 hover:text-gold transition-colors text-start">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-bold text-sm mb-4 text-gold">{t("footer.contact")}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <span className="text-white/70">{address}, {city}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <a href={`tel:${hotel.phone}`} dir="ltr" className="text-white/70 hover:text-gold transition-colors">{hotel.phone}</a>
              </li>
              {hotel.whatsapp && (
                <li className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-gold shrink-0" />
                  <a href={`https://wa.me/${hotel.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" dir="ltr" className="text-white/70 hover:text-gold transition-colors">{hotel.whatsapp}</a>
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <a href={`mailto:${hotel.email}`} className="text-white/70 hover:text-gold transition-colors break-all">{hotel.email}</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-display font-bold text-sm mb-4 text-gold">{t("footer.newsletter")}</h3>
            <p className="text-sm text-white/70 mb-3">{t("footer.newsletterDesc")}</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                required
                placeholder={t("footer.emailPlaceholder")}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:border-gold"
              />
              <Button type="submit" size="icon" disabled={subscribing} className="bg-gold-gradient text-gold-foreground hover:opacity-90 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <Button
              onClick={openBooking}
              variant="outline"
              className="mt-4 w-full border-gold/40 text-gold hover:bg-gold hover:text-gold-foreground rounded-full"
            >
              {t("nav.bookNow")}
            </Button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50 text-center sm:text-start">
            © {new Date().getFullYear()} {name}. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
            <button onClick={() => navTo("#policies")} className="hover:text-gold transition-colors">{t("footer.privacy")}</button>
            <button onClick={() => navTo("#policies")} className="hover:text-gold transition-colors">{t("footer.terms")}</button>
            <button onClick={() => navTo("#policies")} className="hover:text-gold transition-colors">{t("footer.bookingTerms")}</button>
            <button onClick={() => navTo("#policies")} className="hover:text-gold transition-colors">{t("footer.cancellation")}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
