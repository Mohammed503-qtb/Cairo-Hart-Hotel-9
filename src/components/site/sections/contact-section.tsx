"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, MessageCircle, Clock, Send } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useHotel } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocalized } from "@/hooks/use-t";
import { Reveal } from "@/components/site/reveal";

export function ContactSection() {
  const { t, locale } = useT();
  const loc = useLocalized();
  const { data: hotel } = useHotel();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      message: String(formData.get("message") || ""),
    };
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(t("contact.formSuccess"));
        form.reset();
      } else {
        toast.error(locale === "ar" ? "تعذر إرسال الرسالة. حاول مرة أخرى." : "Could not send message. Try again.");
      }
    } catch {
      toast.error(locale === "ar" ? "تعذر إرسال الرسالة. تحقق من اتصالك." : "Could not send message. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const contacts = [
    { icon: Phone, label: t("contact.phone"), value: hotel?.phone || "", href: `tel:${hotel?.phone}`, ltr: true },
    { icon: MessageCircle, label: t("contact.whatsapp"), value: hotel?.whatsapp || "", href: hotel?.whatsapp ? `https://wa.me/${hotel.whatsapp.replace(/\D/g, "")}` : "#", ltr: true },
    { icon: Mail, label: t("contact.email"), value: hotel?.email || "", href: `mailto:${hotel?.email}`, ltr: false },
    { icon: MapPin, label: t("contact.address"), value: hotel ? loc(hotel.addressAr + "، " + hotel.cityAr, hotel.addressEn + ", " + hotel.cityEn) : "", href: "#location", ltr: false },
  ];

  return (
    <section id="contact" className="py-16 lg:py-24 bg-background scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold mb-3">
            <MessageCircle className="w-3.5 h-3.5" /> {t("nav.contact")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">{t("contact.title")}</h2>
          <p className="text-muted-foreground text-base lg:text-lg">{t("contact.subtitle")}</p>
        </Reveal>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Contact cards */}
          <div className="lg:col-span-2 space-y-4">
            {contacts.map((c, i) => (
              <a
                key={i}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                onClick={(e) => c.href === "#location" && e.preventDefault()}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-gold/40 hover:shadow-luxury transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gold-soft flex items-center justify-center shrink-0 group-hover:bg-gold transition-colors">
                  <c.icon className="w-5 h-5 text-gold group-hover:text-gold-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground mb-0.5">{c.label}</div>
                  <div className="text-sm font-semibold truncate" dir={c.ltr ? "ltr" : undefined}>{c.value}</div>
                </div>
              </a>
            ))}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-cream/40 border border-border/50">
              <div className="w-12 h-12 rounded-full bg-gold-soft flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">{t("contact.reception")}</div>
                <div className="text-sm font-semibold">{t("contact.responseTime")}</div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border/50 p-5 lg:p-8 shadow-sm space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("contact.formName")}</Label>
                  <Input id="name" name="name" required placeholder={locale === "ar" ? "اسمك الكريم" : "Your name"} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("contact.formEmail")}</Label>
                  <Input id="email" name="email" type="email" required placeholder="you@example.com" dir="ltr" className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t("contact.formMessage")}</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder={locale === "ar" ? "كيف يمكننا مساعدتك؟" : "How can we help you?"}
                  className="rounded-xl resize-none"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto bg-gold-gradient text-gold-foreground rounded-full font-semibold px-8">
                <Send className="w-4 h-4 me-2" />
                {submitting ? t("common.loading") : t("contact.formSubmit")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
