"use client";

import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@/lib/i18n";

// Helper to build a localized fetcher
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ---- Types (mirrors API responses) ----
export interface HotelData {
  id: string;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  taglineEn: string;
  descriptionAr: string;
  descriptionEn: string;
  storyAr: string | null;
  storyEn: string | null;
  phone: string;
  whatsapp: string | null;
  email: string;
  addressAr: string;
  addressEn: string;
  cityAr: string;
  cityEn: string;
  countryAr: string;
  countryEn: string;
  latitude: number | null;
  longitude: number | null;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  timezone: string;
  defaultLanguage: string;
  heroImageUrl: string | null;
  bookingHorizonDays: number;
  minStayNights: number;
  maxStayNights: number;
  maxAdultsPerRoom: number;
  maxChildrenPerRoom: number;
  taxRatePercent: number;
  serviceChargePercent: number;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
}

export interface AmenityData {
  slug: string;
  nameAr: string;
  nameEn: string;
  iconKey: string | null;
}

export interface RoomTypeData {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  shortDescriptionAr: string;
  shortDescriptionEn: string;
  basePrice: number;
  sizeSqm: number | null;
  bedConfigAr: string;
  bedConfigEn: string;
  maxAdults: number;
  maxChildren: number;
  totalInventory: number;
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  images: { id: string; url: string; altAr: string | null; altEn: string | null; displayOrder: number }[];
  amenities: { amenity: AmenityData }[];
  ratePlan: {
    id: string;
    nameAr: string;
    nameEn: string;
    descriptionAr: string | null;
    descriptionEn: string | null;
    isRefundable: boolean;
    cancellationDays: number;
    prepayPercent: number;
  } | null;
}

export interface FacilityData {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string | null;
  hoursAr: string | null;
  hoursEn: string | null;
  iconKey: string | null;
  displayOrder: number;
}

export interface GalleryItemData {
  id: string;
  url: string;
  altAr: string;
  altEn: string;
  captionAr: string | null;
  captionEn: string | null;
  category: string;
  displayOrder: number;
}

export interface OfferData {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  imageUrl: string | null;
  discountPercent: number | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  termsAr: string | null;
  termsEn: string | null;
}

export interface PolicyData {
  id: string;
  slug: string;
  category: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  displayOrder: number;
}

export interface FaqData {
  id: string;
  category: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  displayOrder: number;
}

export interface ReviewData {
  id: string;
  guestName: string;
  guestCountry: string;
  roomTypeSlug: string | null;
  rating: number;
  titleAr: string | null;
  titleEn: string | null;
  bodyAr: string;
  bodyEn: string;
  stayDate: string | null;
  source: string;
  displayOrder: number;
  createdAt: string;
}

export interface ReviewsSummary {
  avgRating: number;
  totalReviews: number;
  distribution: { star: number; count: number }[];
}

// Pick the localized string field
export function pick(ar: string, en: string, locale: Locale) {
  return locale === "ar" ? ar : en;
}

// ---- Hooks ----
export function useHotel() {
  return useQuery<HotelData>({
    queryKey: ["hotel"],
    queryFn: () => fetcher<{ hotel: HotelData }>("/api/hotel").then((r) => r.hotel),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRooms() {
  return useQuery<RoomTypeData[]>({
    queryKey: ["rooms"],
    queryFn: () => fetcher<{ rooms: RoomTypeData[] }>("/api/rooms").then((r) => r.rooms),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRoom(slug: string | null) {
  return useQuery<RoomTypeData | null>({
    queryKey: ["room", slug],
    queryFn: async () => {
      if (!slug) return null;
      const res = await fetcher<{ room: RoomTypeData }>(`/api/rooms/${slug}`);
      return res.room;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFacilities() {
  return useQuery<FacilityData[]>({
    queryKey: ["facilities"],
    queryFn: () => fetcher<{ facilities: FacilityData[] }>("/api/facilities").then((r) => r.facilities),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGallery() {
  return useQuery<GalleryItemData[]>({
    queryKey: ["gallery"],
    queryFn: () => fetcher<{ items: GalleryItemData[] }>("/api/gallery").then((r) => r.items),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOffers() {
  return useQuery<OfferData[]>({
    queryKey: ["offers"],
    queryFn: () => fetcher<{ offers: OfferData[] }>("/api/offers").then((r) => r.offers),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePolicies() {
  return useQuery<PolicyData[]>({
    queryKey: ["policies"],
    queryFn: () => fetcher<{ policies: PolicyData[] }>("/api/policies").then((r) => r.policies),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFaqs() {
  return useQuery<FaqData[]>({
    queryKey: ["faqs"],
    queryFn: () => fetcher<{ faqs: FaqData[] }>("/api/faq").then((r) => r.faqs),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReviews() {
  return useQuery<{ reviews: ReviewData[]; summary: ReviewsSummary }>({
    queryKey: ["reviews"],
    queryFn: () => fetcher<{ reviews: ReviewData[]; summary: ReviewsSummary }>("/api/reviews"),
    staleTime: 5 * 60 * 1000,
  });
}

// ---- Availability + booking ----
export interface AvailableRoomResult {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  shortDescriptionAr: string;
  shortDescriptionEn: string;
  imageUrl: string;
  basePrice: number;
  sizeSqm: number | null;
  bedConfigAr: string;
  bedConfigEn: string;
  maxAdults: number;
  maxChildren: number;
  totalInventory: number;
  availableCount: number;
  nightlyRate: number;
  totalPrice: number;
  amenities: AmenityData[];
  isRefundable: boolean;
  cancellationDays: number;
  ratePlanId: string | null;
}

export interface AvailabilityMeta {
  currency: string;
  taxRatePercent: number;
  serviceChargePercent: number;
  checkInTime: string;
  checkOutTime: string;
}

export interface AvailabilityResponse {
  results: AvailableRoomResult[];
  query: { checkIn: string; checkOut: string; adults: number; children: number; rooms: number };
  hotel: AvailabilityMeta;
  error?: string;
}

export function useAvailability(params: {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  enabled: boolean;
}) {
  return useQuery<AvailabilityResponse>({
    queryKey: ["availability", params.checkIn, params.checkOut, params.adults, params.children, params.rooms],
    queryFn: async () => {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "availability_error");
      return data as AvailabilityResponse;
    },
    enabled: params.enabled,
    staleTime: 0,
  });
}

// ---- Availability calendar ----
export interface CalendarDay {
  date: string;
  booked: number;
  available: number;
  totalInventory: number;
  isPast: boolean;
  isToday: boolean;
  inMonth: boolean;
  dayOfWeek: number;
  isWeekend: boolean;
}

export interface CalendarResponse {
  days: CalendarDay[];
  month: string;
  roomTypeId: string | null;
  totalInventory: number;
  checkInTime: string;
  checkOutTime: string;
}

export function useAvailabilityCalendar(month: string | null, roomTypeId: string | null) {
  return useQuery<CalendarResponse>({
    queryKey: ["availability-calendar", month, roomTypeId],
    queryFn: async () => {
      const params = new URLSearchParams({ month: month || "" });
      if (roomTypeId) params.set("roomTypeId", roomTypeId);
      const res = await fetch(`/api/availability/calendar?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "calendar_error");
      return data as CalendarResponse;
    },
    enabled: !!month,
    staleTime: 60 * 1000,
  });
}

// ---- Admin stats ----
export interface AdminStats {
  totals: {
    totalReservations: number;
    confirmedReservations: number;
    cancelledReservations: number;
    pendingReservations: number;
    totalRevenue: number;
    totalCollected: number;
    thisMonthRevenue: number;
    thisMonthReservations: number;
    lastMonthReservations: number;
    monthChange: number;
    upcomingCheckIns: number;
    currentGuests: number;
  };
  statusDistribution: { status: string; count: number; labelAr: string; labelEn: string; color: string }[];
  popularRooms: { nameAr: string; nameEn: string; bookingCount: number; totalRooms: number; inventory: number }[];
  bookingTrend: { date: string; count: number; revenue: number }[];
}

export function useAdminStats(enabled = false) {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error("stats_error");
      return data as AdminStats;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}
