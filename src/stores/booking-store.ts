"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BookingStep =
  | "search"
  | "results"
  | "guest"
  | "review"
  | "payment"
  | "confirmation";

export interface GuestInfo {
  fullName: string;
  phone: string;
  email: string;
  whatsapp: string;
  countryCode: string;
  specialRequest: string;
  agreedPolicies: boolean;
}

export interface SelectedRoom {
  roomTypeId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  imageUrl: string;
  nightlyRate: number;
  basePrice: number;
}

export interface BookingState {
  step: BookingStep;
  setStep: (s: BookingStep) => void;

  // Search params
  checkIn: string; // ISO date
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  setSearchParams: (p: Partial<Pick<BookingState, "checkIn" | "checkOut" | "adults" | "children" | "rooms">>) => void;

  // Selected room (for checkout)
  selectedRoom: SelectedRoom | null;
  setSelectedRoom: (r: SelectedRoom | null) => void;

  // Guest info
  guest: GuestInfo;
  setGuest: (g: Partial<GuestInfo>) => void;

  // Payment
  paymentMethod: "PAY_AT_HOTEL" | "PAY_ONLINE" | "DEPOSIT";
  setPaymentMethod: (m: "PAY_AT_HOTEL" | "PAY_ONLINE" | "DEPOSIT") => void;

  // Promo code
  promoCode: string;
  promoCodeInput: string;
  appliedPromo: { code: string; discountAmount: number; discountType: string; nameAr: string; nameEn: string } | null;
  setPromoCodeInput: (code: string) => void;
  setAppliedPromo: (promo: { code: string; discountAmount: number; discountType: string; nameAr: string; nameEn: string } | null) => void;

  // Confirmed reservation
  bookingReference: string | null;
  reservationId: string | null;
  setConfirmation: (ref: string, id: string) => void;

  // Idempotency key (generated per booking attempt)
  idempotencyKey: string;
  regenerateIdempotencyKey: () => void;

  // Reset
  reset: () => void;
}

const defaultGuest: GuestInfo = {
  fullName: "",
  phone: "",
  email: "",
  whatsapp: "",
  countryCode: "+967",
  specialRequest: "",
  agreedPolicies: false,
};

function defaultDates() {
  const today = new Date();
  const ci = new Date(today);
  ci.setDate(ci.getDate() + 1);
  const co = new Date(today);
  co.setDate(co.getDate() + 3);
  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  return { checkIn: fmt(ci), checkOut: fmt(co) };
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      step: "search",
      setStep: (s) => set({ step: s }),

      ...defaultDates(),
      adults: 2,
      children: 0,
      rooms: 1,
      setSearchParams: (p) => set(p),

      selectedRoom: null,
      setSelectedRoom: (r) => set({ selectedRoom: r }),

      guest: { ...defaultGuest },
      setGuest: (g) => set({ guest: { ...get().guest, ...g } }),

      paymentMethod: "PAY_AT_HOTEL",
      setPaymentMethod: (m) => set({ paymentMethod: m }),

      promoCode: "",
      promoCodeInput: "",
      appliedPromo: null,
      setPromoCodeInput: (code) => set({ promoCodeInput: code }),
      setAppliedPromo: (promo) =>
        set({
          appliedPromo: promo,
          promoCode: promo?.code || "",
        }),

      bookingReference: null,
      reservationId: null,
      setConfirmation: (ref, id) => set({ bookingReference: ref, reservationId: id }),

      idempotencyKey: "",
      regenerateIdempotencyKey: () =>
        set({ idempotencyKey: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}` }),

      reset: () =>
        set({
          step: "search",
          selectedRoom: null,
          guest: { ...defaultGuest },
          paymentMethod: "PAY_AT_HOTEL",
          promoCode: "",
          promoCodeInput: "",
          appliedPromo: null,
          bookingReference: null,
          reservationId: null,
          idempotencyKey: "",
          ...defaultDates(),
          adults: 2,
          children: 0,
          rooms: 1,
        }),
    }),
    {
      name: "dar-yasmin-booking",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
      partialize: (s) => ({
        checkIn: s.checkIn,
        checkOut: s.checkOut,
        adults: s.adults,
        children: s.children,
        rooms: s.rooms,
      }),
      onRehydrateStorage: () => (state) => {
        // If persisted dates are in the past (e.g. user returns next day), reset to fresh defaults
        if (!state) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const ci = new Date(state.checkIn);
        ci.setHours(0, 0, 0, 0);
        if (isNaN(ci.getTime()) || ci.getTime() < today.getTime()) {
          const defaults = defaultDates();
          state.checkIn = defaults.checkIn;
          state.checkOut = defaults.checkOut;
        } else {
          // Also ensure check-out is after check-in
          const co = new Date(state.checkOut);
          co.setHours(0, 0, 0, 0);
          if (co.getTime() <= ci.getTime()) {
            const co2 = new Date(ci);
            co2.setDate(co2.getDate() + 1);
            const fmt = (d: Date) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              return `${y}-${m}-${day}`;
            };
            state.checkOut = fmt(co2);
          }
        }
      },
    }
  )
);
