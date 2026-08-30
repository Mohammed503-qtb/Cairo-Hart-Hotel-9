"use client";

import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { ConfidenceSection } from "@/components/site/sections/confidence-section";
import { FeaturedRooms } from "@/components/site/sections/featured-rooms";
import { FacilitiesSection } from "@/components/site/sections/facilities-section";
import { GallerySection } from "@/components/site/sections/gallery-section";
import { OffersSection } from "@/components/site/sections/offers-section";
import { AboutSection } from "@/components/site/sections/about-section";
import { ReviewsSection } from "@/components/site/sections/reviews-section";
import { AvailabilityCalendarSection } from "@/components/site/sections/availability-calendar-section";
import { RoomComparisonSection } from "@/components/site/sections/room-comparison-section";
import { RecentlyViewedSection } from "@/components/site/sections/recently-viewed-section";
import { FavoritesSection } from "@/components/site/sections/favorites-section";
import { LocationSection } from "@/components/site/sections/location-section";
import { ContactSection } from "@/components/site/sections/contact-section";
import { FaqSection } from "@/components/site/sections/faq-section";
import { PoliciesSection } from "@/components/site/sections/policies-section";
import { BookingFlow } from "@/components/booking/booking-flow";
import { RoomDetailDialog } from "@/components/site/room-detail-dialog";
import { ManageBookingDialog } from "@/components/manage/manage-booking-dialog";
import { FloatingActions } from "@/components/site/floating-actions";
import { AdminPanel } from "@/components/site/admin-panel";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <FeaturedRooms />
        <FavoritesSection />
        <RecentlyViewedSection />
        <RoomComparisonSection />
        <ConfidenceSection />
        <FacilitiesSection />
        <GallerySection />
        <OffersSection />
        <AvailabilityCalendarSection />
        <ReviewsSection />
        <AboutSection />
        <LocationSection />
        <ContactSection />
        <FaqSection />
        <PoliciesSection />
      </main>
      <Footer />

      {/* Overlays */}
      <BookingFlow />
      <RoomDetailDialog />
      <ManageBookingDialog />
      <FloatingActions />
      <AdminPanel />
    </div>
  );
}
