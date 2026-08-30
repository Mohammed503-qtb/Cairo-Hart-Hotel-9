"use client";

import {
  Wifi,
  Wind,
  Tv,
  Refrigerator,
  Lock,
  Waves,
  Building2,
  Bath,
  DoorOpen,
  Coffee,
  Briefcase,
  Utensils,
  Sofa,
  Droplets,
  Dumbbell,
  Flower,
  Sun,
  Car,
  ConciergeBell,
  Shirt,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  wifi: Wifi,
  wind: Wind,
  tv: Tv,
  refrigerator: Refrigerator,
  safe: Lock,
  waves: Waves,
  building: Building2,
  bath: Bath,
  "door-open": DoorOpen,
  coffee: Coffee,
  briefcase: Briefcase,
  utensils: Utensils,
  sofa: Sofa,
  droplets: Droplets,
  dumbbell: Dumbbell,
  flower: Flower,
  sun: Sun,
  car: Car,
  "concierge-bell": ConciergeBell,
  shirt: Shirt,
};

export function AmenityIcon({ iconKey, className }: { iconKey: string | null; className?: string }) {
  const Icon = (iconKey && MAP[iconKey]) || Wifi;
  return <Icon className={className} />;
}
