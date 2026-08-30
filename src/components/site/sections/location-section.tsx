"use client";

import { MapPin, Navigation, Plane, Building, Waves } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useHotel } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { useLocalized } from "@/hooks/use-t";
import { Reveal } from "@/components/site/reveal";

const NEARBY = [
  { icon: Plane, ar: "مطار عدن الدولي", en: "Aden International Airport", dist: "15 دقيقة" },
  { icon: Building, ar: "السوق التجاري الرئيسي", en: "Main Commercial Market", dist: "8 دقائق" },
  { icon: Waves, ar: "كورنيش عدن البحري", en: "Aden Sea Corniche", dist: "5 دقائق" },
  { icon: Building, ar: "المدينة القديمة (صيره)", en: "Old City (Sira)", dist: "12 دقيقة" },
];

export function LocationSection() {
  const { t, locale } = useT();
  const loc = useLocalized();
  const { data: hotel } = useHotel();

  const lat = hotel?.latitude ?? 12.7794;
  const lng = hotel?.longitude ?? 45.0369;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.008}%2C${lng + 0.01}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lng}`;
  const directionsUrl = `https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lng}`;

  return (
    <section id="location" className="py-16 lg:py-24 bg-cream/30 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold mb-3">
            <MapPin className="w-3.5 h-3.5" /> {t("nav.location")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">{t("location.title")}</h2>
          <p className="text-muted-foreground text-base lg:text-lg">{t("location.subtitle")}</p>
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Map */}
          <div className="relative rounded-2xl overflow-hidden shadow-luxury min-h-[400px] border border-border/50">
            <iframe
              src={mapUrl}
              className="w-full h-full absolute inset-0"
              style={{ border: 0, minHeight: 400 }}
              loading="lazy"
              title={t("location.title")}
            />
            <div className="absolute top-4 start-4 glass-dark text-white rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 z-10">
              <MapPin className="w-4 h-4 text-gold" />
              {hotel ? loc(hotel.nameAr, hotel.nameEn) : ""}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            {/* Address card */}
            <div className="bg-card rounded-2xl border border-border/50 p-5 lg:p-6 shadow-sm">
              <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gold" />
                {t("location.address")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                {hotel ? loc(hotel.addressAr, hotel.addressEn) : ""}
              </p>
              <p className="text-sm font-medium">
                {hotel ? `${loc(hotel.cityAr, hotel.cityEn)}، ${loc(hotel.countryAr, hotel.countryEn)}` : ""}
              </p>
              <Button
                asChild
                className="mt-4 bg-gold-gradient text-gold-foreground rounded-full font-semibold"
              >
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="w-4 h-4 me-2" />
                  {t("location.getDirections")}
                </a>
              </Button>
            </div>

            {/* Nearby */}
            <div className="bg-card rounded-2xl border border-border/50 p-5 lg:p-6 shadow-sm">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-gold" />
                {t("location.nearby")}
              </h3>
              <ul className="space-y-3">
                {NEARBY.map((n, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 pb-3 border-b border-border/40 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gold-soft flex items-center justify-center shrink-0">
                        <n.icon className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-sm font-medium">{loc(n.ar, n.en)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {locale === "ar" ? `~${n.dist}` : `~${n.dist}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
