// Seed the hotel database with rich, realistic content.
// Run via: bun run src/lib/seed.ts

import { db } from "@/lib/db";

async function main() {
  // Clean slate (dev only)
  await db.notification.deleteMany();
  await db.payment.deleteMany();
  await db.bookingModification.deleteMany();
  await db.reservationPriceSnapshot.deleteMany();
  await db.reservationItem.deleteMany();
  await db.reservation.deleteMany();
  await db.guest.deleteMany();
  await db.roomTypeImage.deleteMany();
  await db.roomTypeAmenity.deleteMany();
  await db.roomType.deleteMany();
  await db.amenity.deleteMany();
  await db.ratePlan.deleteMany();
  await db.facility.deleteMany();
  await db.galleryItem.deleteMany();
  await db.offer.deleteMany();
  await db.policy.deleteMany();
  await db.faq.deleteMany();
  await db.review.deleteMany();
  await db.seasonalRate.deleteMany();
  await db.promoCode.deleteMany();
  await db.newsletter.deleteMany();
  await db.hotel.deleteMany();

  // Hotel
  const hotel = await db.hotel.create({
    data: {
      slug: "dar-al-yasmin",
      nameAr: "فندق دار الياسمين الملكي",
      nameEn: "Dar Al-Yasmin Royal Hotel",
      taglineAr: "حيث يلتقي البحر بالضيافة الأصيلة",
      taglineEn: "Where the sea meets authentic hospitality",
      descriptionAr:
        "منتجع ساحلي فاخر يطل على البحر العربي في قلب عدن التاريخية. يقدم تجربة إقامة استثنائية تجمع بين الأصالة اليمنية والرفاهية العصرية، مع غرف وأجنحة أنيقة، ومرافق متكاملة، وخدمة ضيافة لا تُنسى.",
      descriptionEn:
        "A luxury coastal resort overlooking the Arabian Sea in the heart of historic Aden. It offers an exceptional stay experience that blends Yemeni authenticity with modern luxury, with elegant rooms and suites, comprehensive facilities, and unforgettable hospitality.",
      storyAr:
        "تأسس فندق دار الياسمين الملكي عام 1998 ليكون واحة من الفخامة على ساحل عدن. على مدار أكثر من عقدين، كرسنا أنفسنا لتقديم تجربة ضيافة تجمع بين دفء التقاليد اليمنية الأصيلة ومعايير الرفاهية العالمية. كل ركن في فندقنا يحكي قصة من قصص الضيافة العربية الأصيلة.",
      storyEn:
        "Dar Al-Yasmin Royal Hotel was founded in 1998 to be an oasis of luxury on the Aden coast. For over two decades, we have dedicated ourselves to delivering a hospitality experience that blends the warmth of authentic Yemeni traditions with international luxury standards. Every corner of our hotel tells a story of authentic Arabian hospitality.",
      phone: "+967 2 123 4567",
      whatsapp: "+967771234567",
      email: "info@daralyasmin-hotel.com",
      addressAr: "شارع الكورنيش البحري، خور مكسر",
      addressEn: "Corniche Road, Khormaksar",
      cityAr: "عدن",
      cityEn: "Aden",
      countryAr: "اليمن",
      countryEn: "Yemen",
      latitude: 12.7794,
      longitude: 45.0369,
      checkInTime: "14:00",
      checkOutTime: "12:00",
      currency: "YER",
      timezone: "Asia/Aden",
      defaultLanguage: "ar",
      heroImageUrl: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a6551c36a598.jpg",
      logoUrl: null,
      bookingHorizonDays: 365,
      minStayNights: 1,
      maxStayNights: 30,
      maxAdultsPerRoom: 4,
      maxChildrenPerRoom: 3,
      taxRatePercent: 5.0,
      serviceChargePercent: 2.0,
      whatsappEnabled: true,
      emailEnabled: true,
    },
  });

  // Rate plans
  const flexiblePlan = await db.ratePlan.create({
    data: {
      nameAr: "السعر المرن",
      nameEn: "Flexible Rate",
      descriptionAr: "إلغاء مجاني قبل 3 أيام من الوصول. الدفع في الفندق.",
      descriptionEn: "Free cancellation up to 3 days before arrival. Pay at hotel.",
      isRefundable: true,
      cancellationDays: 3,
      prepayPercent: 0,
      isActive: true,
    },
  });
  const prepaidPlan = await db.ratePlan.create({
    data: {
      nameAr: "السعر المدفوع مسبقاً",
      nameEn: "Prepaid Rate",
      descriptionAr: "خصم 10% عند الدفع المسبق. غير قابل للاسترداد.",
      descriptionEn: "10% discount for prepaid. Non-refundable.",
      isRefundable: false,
      cancellationDays: 0,
      prepayPercent: 100,
      isActive: true,
    },
  });

  // Amenities
  const amenityData = [
    { slug: "wifi", ar: "واي فاي مجاني", en: "Free Wi-Fi", icon: "wifi" },
    { slug: "ac", ar: "تكييف", en: "Air conditioning", icon: "wind" },
    { slug: "tv", ar: "تلفاز ذكي", en: "Smart TV", icon: "tv" },
    { slug: "minibar", ar: "ثلاجة صغيرة", en: "Minibar", icon: "refrigerator" },
    { slug: "safe", ar: "خزنة آمنة", en: "In-room safe", icon: "safe" },
    { slug: "seaview", ar: "إطلالة على البحر", en: "Sea view", icon: "waves" },
    { slug: "cityview", ar: "إطلالة على المدينة", en: "City view", icon: "building" },
    { slug: "bathtub", ar: "بانيو", en: "Bathtub", icon: "bath" },
    { slug: "balcony", ar: "شرفة خاصة", en: "Private balcony", icon: "door-open" },
    { slug: "coffee", ar: "ماكينة قهوة", en: "Coffee machine", icon: "coffee" },
    { slug: "desk", ar: "مكتب عمل", en: "Work desk", icon: "briefcase" },
    { slug: "breakfast", ar: "إفطار مشمول", en: "Breakfast included", icon: "utensils" },
    { slug: "lounge", ar: "صالة جلوس", en: "Living area", icon: "sofa" },
    { slug: "jacuzzi", ar: "جاكوزي", en: "Jacuzzi", icon: "droplets" },
  ];
  const amenities = await Promise.all(
    amenityData.map((a) =>
      db.amenity.create({ data: { slug: a.slug, nameAr: a.ar, nameEn: a.en, iconKey: a.icon } })
    )
  );
  const amenityBySlug = new Map(amenities.map((a) => [a.slug, a]));

  // Room types
  const roomTypesData = [
    {
      slug: "standard-room",
      nameAr: "الغرفة القياسية",
      nameEn: "Standard Room",
      descAr: "غرفة مريحة وأنيقة مزينة بلمسات يمنية أصيلة، مثالية للمسافرين الباحثين عن الراحة والعملية. تتميز بإطلالة على المدينة وكل وسائل الراحة الحديثة.",
      descEn: "A comfortable and elegant room decorated with authentic Yemeni touches, ideal for travelers seeking comfort and practicality. Features city views and all modern amenities.",
      shortAr: "مريحة وعملية بإطلالة على المدينة",
      shortEn: "Comfortable and practical with city views",
      basePrice: 35000,
      sizeSqm: 28,
      bedAr: "سرير مزدوج (160×200)",
      bedEn: "Double bed (160×200)",
      maxAdults: 2,
      maxChildren: 1,
      totalInventory: 12,
      image: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8ecfd54f0b91.jpg",
      featured: false,
      order: 1,
      amenitySlugs: ["wifi", "ac", "tv", "minibar", "safe", "cityview", "desk"],
      ratePlanId: flexiblePlan.id,
      extraImages: ["https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d1a36a804a2b.jpg"],
    },
    {
      slug: "deluxe-sea-view",
      nameAr: "غرفة ديلوكس بإطلالة بحرية",
      nameEn: "Deluxe Sea View Room",
      descAr: "استمتع بإطلالة خلابة على البحر العربي من شرفتك الخاصة. غرفة فسيحة بتصميم أنيق يجمع بين الفخامة العصرية واللمسات اليمنية الأصيلة، مع سرير ملكي مريح وجميع وسائل الرشفاهية.",
      descEn: "Enjoy breathtaking views of the Arabian Sea from your private balcony. A spacious room with elegant design blending modern luxury with authentic Yemeni touches, featuring a comfortable king bed and all amenities.",
      shortAr: "إطلالة بحرية وشرفة خاصة",
      shortEn: "Sea view with private balcony",
      basePrice: 55000,
      sizeSqm: 38,
      bedAr: "سرير ملكي (180×200)",
      bedEn: "King bed (180×200)",
      maxAdults: 2,
      maxChildren: 2,
      totalInventory: 8,
      image: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d829dc34b4f9.jpg",
      featured: true,
      order: 2,
      amenitySlugs: ["wifi", "ac", "tv", "minibar", "safe", "seaview", "bathtub", "balcony", "coffee", "desk", "breakfast"],
      ratePlanId: flexiblePlan.id,
      extraImages: ["https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/af1b2eb5797c.png"],
    },
    {
      slug: "family-suite",
      nameAr: "جناح عائلي",
      nameEn: "Family Suite",
      descAr: "جناح واسع مثالي للعائلات، يضم غرفتي نوم وصالة جلوس منفصلة. مساحة كافية لاستضافة العائلة بأكملها مع الحفاظ على الخصوصية والراحة، مع إطلالة على المدينة.",
      descEn: "A spacious suite ideal for families, featuring two bedrooms and a separate living area. Enough space to host the whole family while maintaining privacy and comfort, with city views.",
      shortAr: "غرفتا نوم وصالة عائلية واسعة",
      shortEn: "Two bedrooms and a spacious family living area",
      basePrice: 85000,
      sizeSqm: 65,
      bedAr: "سرير ملكي + سريرين فرديين",
      bedEn: "King bed + two single beds",
      maxAdults: 4,
      maxChildren: 3,
      totalInventory: 5,
      image: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ec0d43d09626.jpg",
      featured: true,
      order: 3,
      amenitySlugs: ["wifi", "ac", "tv", "minibar", "safe", "cityview", "lounge", "coffee", "desk", "breakfast", "balcony"],
      ratePlanId: flexiblePlan.id,
      extraImages: ["https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/89791028bb2b.jpg"],
    },
    {
      slug: "executive-suite",
      nameAr: "الجناح التنفيذي",
      nameEn: "Executive Suite",
      descAr: "جناح فاخر يطل على البحر، يضم غرفة نوم رئيسية وصالة فسيحة وركن عمل مخصص. تجربة إقامة استثنائية للمسافرين المميزين الذين يبحثون عن أقصى درجات الراحة والفخامة.",
      descEn: "A luxury sea-view suite featuring a master bedroom, spacious living area, and dedicated work corner. An exceptional stay experience for distinguished travelers seeking the utmost comfort and luxury.",
      shortAr: "فخامة بإطلالة بحرية وركن عمل",
      shortEn: "Luxury with sea view and work area",
      basePrice: 120000,
      sizeSqm: 75,
      bedAr: "سرير ملكي (200×220) + صالة",
      bedEn: "King bed (200×220) + living room",
      maxAdults: 3,
      maxChildren: 2,
      totalInventory: 4,
      image: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/534b29077e3b.jpg",
      featured: true,
      order: 4,
      amenitySlugs: ["wifi", "ac", "tv", "minibar", "safe", "seaview", "bathtub", "balcony", "coffee", "desk", "breakfast", "lounge", "jacuzzi"],
      ratePlanId: flexiblePlan.id,
      extraImages: ["https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/aeb328d43b53.jpg"],
    },
  ];

  for (const rt of roomTypesData) {
    const created = await db.roomType.create({
      data: {
        hotelId: hotel.id,
        slug: rt.slug,
        nameAr: rt.nameAr,
        nameEn: rt.nameEn,
        descriptionAr: rt.descAr,
        descriptionEn: rt.descEn,
        shortDescriptionAr: rt.shortAr,
        shortDescriptionEn: rt.shortEn,
        basePrice: rt.basePrice,
        sizeSqm: rt.sizeSqm,
        bedConfigAr: rt.bedAr,
        bedConfigEn: rt.bedEn,
        maxAdults: rt.maxAdults,
        maxChildren: rt.maxChildren,
        totalInventory: rt.totalInventory,
        imageUrl: rt.image,
        isActive: true,
        isFeatured: rt.featured,
        displayOrder: rt.order,
        ratePlanId: rt.ratePlanId,
        images: {
          create: [
            { url: rt.image, altAr: rt.nameAr, altEn: rt.nameEn, displayOrder: 0 },
            ...rt.extraImages.map((url, i) => ({ url, altAr: rt.nameAr, altEn: rt.nameEn, displayOrder: i + 1 })),
          ],
        },
        amenities: {
          create: rt.amenitySlugs.map((slug) => ({ amenityId: amenityBySlug.get(slug)!.id })),
        },
      },
    });
    void created;
  }

  // Facilities
  const facilitiesData = [
    { slug: "pool", ar: "مسبح خارجي", en: "Outdoor Pool", descAr: "مسبح كبير يطل على البحر، مفتوح يومياً من 7 صباحاً حتى 9 مساءً", descEn: "Large pool overlooking the sea, open daily 7am-9pm", img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/0af3339fad62.jpg", hours: "7:00 - 21:00", icon: "waves", order: 1 },
    { slug: "restaurant", ar: "مطعم الياسمين", en: "Jasmine Restaurant", descAr: "مطعم يقدم أشهى الأطباق اليمنية والعالمية على مدار اليوم", descEn: "Restaurant serving delicious Yemeni and international cuisine all day", img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/4eead45bd9e8.jpg", hours: "6:00 - 23:00", icon: "utensils", order: 2 },
    { slug: "spa", ar: "سبا ومراكز عافية", en: "Spa & Wellness", descAr: "سبا فاخر يقدم جلسات تدليك وعلاجات استرخاء متخصصة", descEn: "Luxury spa offering specialized massage and relaxation treatments", img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7179e84a4f99.png", hours: "9:00 - 20:00", icon: "flower", order: 3 },
    { slug: "gym", ar: "صالة رياضية", en: "Fitness Center", descAr: "صالة رياضية مجهزة بأحدث الأجهزة، مفتوحة 24 ساعة", descEn: "Fitness center equipped with the latest machines, open 24 hours", img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/eb9fab299a09.jpg", hours: "24 ساعة", icon: "dumbbell", order: 4 },
    { slug: "lobby", ar: "ردهة فاخرة", en: "Grand Lobby", descAr: "ردهة أنيقة بتصميم معماري يمني أصيل، مثالية للاستراحة والاستقبال", descEn: "Elegant lobby with authentic Yemeni architectural design, perfect for rest and reception", img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3ca4bec76efd.png", hours: "24 ساعة", icon: "building", order: 5 },
    { slug: "rooftop", ar: "تراس السطح", en: "Rooftop Terrace", descAr: "تراس بانورامي يطل على البحر والمدينة، مثالي للاستمتاع بغروب الشمس", descEn: "Panoramic terrace overlooking the sea and city, perfect for enjoying sunset", img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/02f28556decd.jpg", hours: "16:00 - 23:00", icon: "sun", order: 6 },
    { slug: "wifi", ar: "إنترنت عالي السرعة", en: "High-Speed Internet", descAr: "واي فاي مجاني عالي السرعة في جميع أنحاء الفندق", descEn: "Free high-speed Wi-Fi throughout the hotel", img: null, hours: "24 ساعة", icon: "wifi", order: 7 },
    { slug: "parking", ar: "مواقف سيارات", en: "Parking", descAr: "مواقف سيارات مجانية وآمنة للنزلاء", descEn: "Free secure parking for guests", img: null, hours: "24 ساعة", icon: "car", order: 8 },
    { slug: "reception", ar: "استقبال 24 ساعة", en: "24-Hour Reception", descAr: "فريق استقبال متواجد على مدار الساعة لخدمتك", descEn: "Reception team available around the clock to serve you", img: null, hours: "24 ساعة", icon: "concierge-bell", order: 9 },
    { slug: "laundry", ar: "خدمة الغسيل", en: "Laundry Service", descAr: "خدمة غسيل وكي الملابس يومياً", descEn: "Daily laundry and ironing service", img: null, hours: "8:00 - 20:00", icon: "shirt", order: 10 },
  ];
  for (const f of facilitiesData) {
    await db.facility.create({
      data: {
        hotelId: hotel.id,
        slug: f.slug,
        nameAr: f.ar,
        nameEn: f.en,
        descriptionAr: f.descAr,
        descriptionEn: f.descEn,
        imageUrl: f.img,
        hoursAr: f.hours,
        hoursEn: f.hours,
        iconKey: f.icon,
        isActive: true,
        displayOrder: f.order,
      },
    });
  }

  // Gallery
  const galleryData = [
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a6551c36a598.jpg", cat: "exterior", ar: "واجهة الفندق", en: "Hotel exterior" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d95b9d74729e.jpg", cat: "exterior", ar: "إطلالة مسائية", en: "Evening view" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d829dc34b4f9.jpg", cat: "rooms", ar: "غرفة ديلوكس", en: "Deluxe room" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/534b29077e3b.jpg", cat: "rooms", ar: "الجناح التنفيذي", en: "Executive suite" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ec0d43d09626.jpg", cat: "rooms", ar: "الجناح العائلي", en: "Family suite" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8ecfd54f0b91.jpg", cat: "rooms", ar: "الغرفة القياسية", en: "Standard room" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/0af3339fad62.jpg", cat: "facilities", ar: "المسبح", en: "Pool" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/4eead45bd9e8.jpg", cat: "facilities", ar: "المطعم", en: "Restaurant" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7179e84a4f99.png", cat: "facilities", ar: "السبا", en: "Spa" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/eb9fab299a09.jpg", cat: "facilities", ar: "الصالة الرياضية", en: "Gym" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3ca4bec76efd.png", cat: "facilities", ar: "الردهة", en: "Lobby" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/02f28556decd.jpg", cat: "facilities", ar: "تراس السطح", en: "Rooftop terrace" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/cf52704e8750.jpg", cat: "rooms", ar: "حمام فاخر", en: "Luxury bathroom" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/33cd22a0d10b.jpg", cat: "facilities", ar: "إفطار فاخر", en: "Breakfast spread" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/06efbd2f6dd6.jpg", cat: "surroundings", ar: "ساحل عدن", en: "Aden coast" },
    { url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/22d2df3877b9.jpg", cat: "surroundings", ar: "المدينة القديمة", en: "Old city" },
  ];
  for (let i = 0; i < galleryData.length; i++) {
    const g = galleryData[i];
    await db.galleryItem.create({
      data: {
        hotelId: hotel.id,
        url: g.url,
        altAr: g.ar,
        altEn: g.en,
        captionAr: g.ar,
        captionEn: g.en,
        category: g.cat,
        displayOrder: i,
      },
    });
  }

  // Offers
  const now = new Date();
  const offersData = [
    {
      slug: "summer-getaway",
      titleAr: "عرض الصيف — 3 ليالٍ بسعر 2",
      titleEn: "Summer Getaway — 3 nights for 2",
      descAr: "احجز 3 ليالٍ وادفع ثنتين فقط. يشمل الإفطار واستخدام المسبح. صالح للإقامات حتى نهاية الصيف.",
      descEn: "Book 3 nights and pay for only 2. Includes breakfast and pool access. Valid for stays through end of summer.",
      img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/0af3339fad62.jpg",
      discount: 33,
      validFrom: now,
      validTo: new Date(now.getFullYear(), 8, 30), // Sept 30
      termsAr: "عرض غير قابل للاسترداد. يتطلب إقامة 3 ليالٍ متتالية على الأقل.",
      termsEn: "Non-refundable offer. Requires minimum 3 consecutive nights stay.",
    },
    {
      slug: "honeymoon-package",
      titleAr: "باقة شهر العسل",
      titleEn: "Honeymoon Package",
      descAr: "إقامة فاخرة في جناح ديلوكس مع عشاء رومانسي وسبا لشخصين. تجربة لا تُنسى للأزواج الجدد.",
      descEn: "Luxury stay in a deluxe suite with romantic dinner and spa for two. An unforgettable experience for newlyweds.",
      img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7179e84a4f99.png",
      discount: 15,
      validFrom: now,
      validTo: new Date(now.getFullYear(), 11, 31),
      termsAr: "للأزواج فقط. يتطلب إثبات الزواج عند الوصول.",
      termsEn: "Couples only. Requires marriage proof at check-in.",
    },
    {
      slug: "early-bird",
      titleAr: "الحجز المبكر — خصم 15%",
      titleEn: "Early Bird — 15% off",
      descAr: "احجز قبل 30 يوماً من الوصول واحصل على خصم 15% على إقامتك. وفّر أكثر مع التخطيط المسبق.",
      descEn: "Book 30 days before arrival and get 15% off your stay. Save more with advance planning.",
      img: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/02f28556decd.jpg",
      discount: 15,
      validFrom: now,
      validTo: new Date(now.getFullYear() + 1, 5, 30),
      termsAr: "يتطلب الحجز قبل 30 يوماً من تاريخ الوصول. قابل للإلغاء قبل 7 أيام.",
      termsEn: "Requires booking 30 days before arrival. Cancellable up to 7 days before.",
    },
  ];
  for (const o of offersData) {
    await db.offer.create({
      data: {
        hotelId: hotel.id,
        slug: o.slug,
        titleAr: o.titleAr,
        titleEn: o.titleEn,
        descriptionAr: o.descAr,
        descriptionEn: o.descEn,
        imageUrl: o.img,
        discountPercent: o.discount,
        validFrom: o.validFrom,
        validTo: o.validTo,
        isActive: true,
        termsAr: o.termsAr,
        termsEn: o.termsEn,
      },
    });
  }

  // Policies
  const policiesData = [
    { cat: "checkin", titleAr: "تسجيل الوصول", titleEn: "Check-in", bodyAr: "وقت تسجيل الوصول الرسمي هو الساعة 2:00 ظهراً. يمكن طلب تسجيل دخول مبكر بناءً على التوفر دون رسوم إضافية.", bodyEn: "Official check-in time is 2:00 PM. Early check-in can be requested based on availability at no extra charge." },
    { cat: "checkout", titleAr: "تسجيل المغادرة", titleEn: "Check-out", bodyAr: "وقت تسجيل المغادرة هو الساعة 12:00 ظهراً. يمكن طلب تأخير المغادرة بناءً على التوفر، وقد تخضع لرسوم إضافية.", bodyEn: "Check-out time is 12:00 PM. Late check-out can be requested based on availability and may incur extra charges." },
    { cat: "cancellation", titleAr: "سياسة الإلغاء", titleEn: "Cancellation Policy", bodyAr: "إلغاء مجاني حتى 3 أيام قبل تاريخ الوصول. الإلغاء خلال 3 أيام من الوصول يخضع لرسوم ليلة واحدة. عدم الحضور (No-show) يخضع لرسوم الحجز الكامل.", bodyEn: "Free cancellation up to 3 days before arrival. Cancellation within 3 days of arrival incurs one night charge. No-show incurs full booking charge." },
    { cat: "noshow", titleAr: "سياسة عدم الحضور", titleEn: "No-show Policy", bodyAr: "في حال عدم الحضور دون إشعار مسبق، سيتم خصم كامل قيمة الحجز من الضمان أو فرض رسوم الحجز الكامل.", bodyEn: "If you do not arrive without prior notice, the full booking value will be charged from the guarantee or full booking fees will apply." },
    { cat: "payment", titleAr: "سياسة الدفع", titleEn: "Payment Policy", bodyAr: "نقبل الدفع نقداً (ريال يمني / دولار أمريكي)، وبطاقات مدى وفيزا وماستركارد. يمكن الدفع عند الحجز أو عند الوصول حسب نوع السعر المختار.", bodyEn: "We accept cash (Yemeni Rial / USD), mada, Visa and Mastercard. Payment can be made at booking or arrival depending on the rate type chosen." },
    { cat: "children", titleAr: "سياسة الأطفال", titleEn: "Children Policy", bodyAr: "الإقامة مجانية للأطفال تحت 6 سنوات عند استخدام أسرة الموجودة. يمكن طلب سرير إضافي للأطفال مقابل رسوم رمزية. الأطفال فوق 12 سنة يُعتبرون بالغين.", bodyEn: "Children under 6 stay free when using existing beds. Extra bed for children available for a nominal fee. Children over 12 are considered adults." },
    { cat: "smoking", titleAr: "سياسة التدخين", titleEn: "Smoking Policy", bodyAr: "الفندق غير مدخن بالكامل. التدخين مسموح فقط في المناطق المخصصة بالخارج. غرامة 50 دولار على مخالفة هذه السياسة.", bodyEn: "The hotel is entirely non-smoking. Smoking is allowed only in designated outdoor areas. $50 fine for violating this policy." },
    { cat: "pets", titleAr: "سياسة الحيوانات الأليفة", titleEn: "Pets Policy", bodyAr: "نأسف، لا يُسمح بالحيوانات الأليفة داخل الفندق، باستثناء الحيوانات الخدمية المرافقة للأشخاص ذوي الإعاقة.", bodyEn: "We apologize, pets are not allowed inside the hotel, except for service animals accompanying persons with disabilities." },
    { cat: "id", titleAr: "سياسة الهوية", titleEn: "ID Policy", bodyAr: "يتطلب تسجيل الوصول تقديم بطاقة هوية سارية أو جواز سفر ساري لكل نزيل بالغ.", bodyEn: "Check-in requires a valid ID card or valid passport for each adult guest." },
    { cat: "guests", titleAr: "سياسة الزوار", titleEn: "Guests Policy", bodyAr: "الزوار مسموح لهم في المناطق العامة حتى الساعة 10 مساءً. دخول الزوار إلى الغرف يتطلب موافقة الإدارة.", bodyEn: "Visitors are allowed in public areas until 10 PM. Visitor access to rooms requires management approval." },
  ];
  for (let i = 0; i < policiesData.length; i++) {
    const p = policiesData[i];
    await db.policy.create({
      data: {
        hotelId: hotel.id,
        slug: p.cat,
        category: p.cat,
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        bodyAr: p.bodyAr,
        bodyEn: p.bodyEn,
        displayOrder: i,
      },
    });
  }

  // FAQ
  const faqData = [
    { cat: "booking", qAr: "كيف يمكنني حجز غرفة؟", qEn: "How can I book a room?", aAr: "يمكنك الحجز مباشرة من موقعنا الإلكتروني عبر زر «احجز الآن»، أو الاتصال بنا على الرقم +967 2 123 4567، أو عبر البريد الإلكتروني info@daralyasmin-hotel.com.", aEn: "You can book directly from our website via the 'Book Now' button, call us at +967 2 123 4567, or email info@daralyasmin-hotel.com." },
    { cat: "booking", qAr: "هل أحتاج لبطاقة ائتمان للحجز؟", qEn: "Do I need a credit card to book?", aAr: "يعتمد ذلك على نوع السعر. السعر المرن لا يتطلب بطاقة ائتمان ويمكن الدفع في الفندق. السعر المدفوع مسبقاً يتطلب دفعاً إلكترونياً.", aEn: "It depends on the rate type. The flexible rate does not require a credit card and can be paid at the hotel. The prepaid rate requires online payment." },
    { cat: "checkin", qAr: "ما هو وقت تسجيل الوصول والمغادرة؟", qEn: "What are check-in and check-out times?", aAr: "تسجيل الوصول من الساعة 2:00 ظهراً، وتسجيل المغادرة حتى الساعة 12:00 ظهراً. يمكن طلب تسجيل دخول مبكر أو مغادرة متأخرة بناءً على التوفر.", aEn: "Check-in is from 2:00 PM, and check-out is until 12:00 PM. Early check-in or late check-out can be requested based on availability." },
    { cat: "cancellation", qAr: "هل يمكنني إلغاء حجزي؟", qEn: "Can I cancel my booking?", aAr: "نعم، الإلغاء مجاني حتى 3 أيام قبل تاريخ الوصول للسعر المرن. يمكنك إدارة حجزك من خلال صفحة «إدارة الحجز» على موقعنا.", aEn: "Yes, free cancellation up to 3 days before arrival for the flexible rate. You can manage your booking through the 'Manage Booking' page on our website." },
    { cat: "payment", qAr: "ما طرق الدفع المقبولة؟", qEn: "What payment methods are accepted?", aAr: "نقبل النقد (ريال يمني ودولار أمريكي)، وبطاقات مدى وفيزا وماستركارد. الدفع الإلكتروني عبر الموقع متاح لبعض أنواع الأسعار.", aEn: "We accept cash (Yemeni Rial and USD), mada, Visa and Mastercard. Online payment via the website is available for some rate types." },
    { cat: "rooms", qAr: "هل واي فاي مجاني؟", qEn: "Is Wi-Fi free?", aAr: "نعم، نوفر واي فاي عالي السرعة مجاناً في جميع أنحاء الفندق بما في ذلك الغرف.", aEn: "Yes, we provide free high-speed Wi-Fi throughout the hotel including rooms." },
    { cat: "facilities", qAr: "هل يوجد مسبح في الفندق؟", qEn: "Is there a pool at the hotel?", aAr: "نعم، لدينا مسبح خارجي يطل على البحر، مفتوح يومياً من 7 صباحاً حتى 9 مساءً.", aEn: "Yes, we have an outdoor pool overlooking the sea, open daily from 7 AM to 9 PM." },
    { cat: "facilities", qAr: "هل يوجد موقف سيارات؟", qEn: "Is there parking?", aAr: "نعم، نوفر مواقف سيارات مجانية وآمنة لجميع نزلائنا.", aEn: "Yes, we provide free secure parking for all our guests." },
    { cat: "children", qAr: "هل تقبلون الأطفال؟", qEn: "Do you accept children?", aAr: "نعم، الأطفال مرحب بهم. الإقامة مجانية للأطفال تحت 6 سنوات عند استخدام الأسره الموجودة.", aEn: "Yes, children are welcome. Children under 6 stay free when using existing beds." },
    { cat: "general", qAr: "هل الفندق قريب من المطار؟", qEn: "Is the hotel near the airport?", aAr: "يقع الفندق على بعد حوالي 15 دقيقة من مطار عدن الدولي بالسيارة.", aEn: "The hotel is about 15 minutes from Aden International Airport by car." },
    { cat: "general", qAr: "ما هي أوقات تقديم الإفطار؟", qEn: "What are breakfast hours?", aAr: "يُقدم الإفطار يومياً من الساعة 6:30 صباحاً حتى 10:30 صباحاً في مطعم الياسمين.", aEn: "Breakfast is served daily from 6:30 AM to 10:30 AM at Jasmine Restaurant." },
  ];
  for (let i = 0; i < faqData.length; i++) {
    const f = faqData[i];
    await db.faq.create({
      data: {
        hotelId: hotel.id,
        category: f.cat,
        questionAr: f.qAr,
        questionEn: f.qEn,
        answerAr: f.aAr,
        answerEn: f.aEn,
        displayOrder: i,
      },
    });
  }

  // Reviews / Testimonials
  const reviewsData = [
    {
      guestName: "أحمد الشريف",
      guestCountry: "SA",
      roomTypeSlug: "deluxe-sea-view",
      rating: 5,
      titleAr: "إقامة لا تُنسى بإطلالة بحرية ساحرة",
      titleEn: "An unforgettable stay with a stunning sea view",
      bodyAr: "كانت إقامتي في فندق دار الياسمين تجربة استثنائية. الغرفة بإطلالة على البحر العربي كانت نظيفة وأنيقة، والخدمة كانت احترافية للغاية. الاستقبال ودود والإفطار لذيذ. سأعود بالتأكيد في الزيارة القادمة لعدن.",
      bodyEn: "My stay at Dar Al-Yasmin Hotel was an exceptional experience. The room with a view of the Arabian Sea was clean and elegant, and the service was highly professional. Friendly reception and delicious breakfast. I will definitely return on my next visit to Aden.",
      stayDate: new Date(2026, 6, 15),
      source: "GOOGLE",
    },
    {
      guestName: "سارة المطيري",
      guestCountry: "AE",
      roomTypeSlug: "executive-suite",
      rating: 5,
      titleAr: "جناح فاخر يستحق كل ريال",
      titleEn: "Luxury suite worth every riyal",
      bodyAr: "الجناح التنفيذي كان رائعاً بكل المقاييس. مساحة واسعة، تصميم أنيق، وكل التفاصيل مدروسة. طاقم الفندق مهذب ومتعاون. موقع الفندق ممتاز قرب الكورنيش البحري. تجربة فاخرة حقاً.",
      bodyEn: "The executive suite was amazing by all measures. Spacious, elegant design, and every detail is considered. The hotel staff is polite and helpful. The hotel's location is excellent near the sea corniche. A truly luxurious experience.",
      stayDate: new Date(2026, 5, 20),
      source: "BOOKING_COM",
    },
    {
      guestName: "خالد العولقي",
      guestCountry: "YE",
      roomTypeSlug: "family-suite",
      rating: 4.5,
      titleAr: "مثالي للعائلات مع أطفال",
      titleEn: "Ideal for families with children",
      bodyAr: "أقمنا كعائلة في الجناح العائلي وكانت تجربة ممتازة. الغرفة واسعة وتتسع للجميع. الأطفال استمتعوا بالمسبح والتراس. الطعام في المطعم لذيذ ومتنوع. الموقع قريب من المطار. شكراً لطاقم الفندق الرائع.",
      bodyEn: "We stayed as a family in the family suite and it was an excellent experience. The room is spacious and fits everyone. The children enjoyed the pool and terrace. The food at the restaurant is delicious and varied. The location is close to the airport. Thanks to the wonderful hotel staff.",
      stayDate: new Date(2026, 7, 5),
      source: "WEBSITE",
    },
    {
      guestName: "محمد بن علي",
      guestCountry: "OM",
      roomTypeSlug: "standard-room",
      rating: 4,
      titleAr: "غرفة مريحة بسعر مناسب",
      titleEn: "Comfortable room at a fair price",
      bodyAr: "الغرفة القياسية كانت مريحة ونظيفة. الخدمة جيدة والموظفون متعاونون. الإفطار كان متنوعاً. الموقع ممتاز على الكورنيش. أنصح به للباحثين عن إقامة مريحة بسعر مناسب في عدن.",
      bodyEn: "The standard room was comfortable and clean. Good service and helpful staff. Breakfast was varied. Excellent location on the corniche. I recommend it for those seeking comfortable accommodation at a fair price in Aden.",
      stayDate: new Date(2026, 4, 12),
      source: "GOOGLE",
    },
    {
      guestName: "فاطمة الحضرمي",
      guestCountry: "YE",
      roomTypeSlug: "deluxe-sea-view",
      rating: 5,
      titleAr: "خدمة ملكية وضيافة أصيلة",
      titleEn: "Royal service and authentic hospitality",
      bodyAr: "زيارتين لفندق دار الياسمين وكلاهما كانتا رائعتين. الخدمة ملكية بحق، والطاقم يعرف معنى الضيافة العربية الأصيلة. الغرف أنيقة والمسبح رائع. تجربة تستحق التكرار. شكراً لكم على كل شيء.",
      bodyEn: "Two visits to Dar Al-Yasmin Hotel and both were wonderful. The service is truly royal, and the staff knows the meaning of authentic Arabian hospitality. The rooms are elegant and the pool is great. An experience worth repeating. Thank you for everything.",
      stayDate: new Date(2026, 6, 28),
      source: "WEBSITE",
    },
    {
      guestName: "James Anderson",
      guestCountry: "GB",
      roomTypeSlug: "executive-suite",
      rating: 4.5,
      titleAr: "جوهرة على ساحل عدن",
      titleEn: "A gem on the Aden coast",
      bodyAr: "فندق رائع بإطلالة خلابة على البحر. الغرف فاخرة ومجهزة بكل ما تحتاجه. الموظفون ودودون ومحترفون. الإفطار متنوع ولذيذ. سأوصي به لأصدقائي. تجربة لا تُنسى.",
      bodyEn: "A wonderful hotel with a stunning sea view. The rooms are luxurious and equipped with everything you need. The staff are friendly and professional. Breakfast is varied and delicious. I will recommend it to my friends. An unforgettable experience.",
      stayDate: new Date(2026, 3, 10),
      source: "BOOKING_COM",
    },
  ];
  for (let i = 0; i < reviewsData.length; i++) {
    const r = reviewsData[i];
    await db.review.create({
      data: {
        hotelId: hotel.id,
        guestName: r.guestName,
        guestCountry: r.guestCountry,
        roomTypeSlug: r.roomTypeSlug,
        rating: r.rating,
        titleAr: r.titleAr,
        titleEn: r.titleEn,
        bodyAr: r.bodyAr,
        bodyEn: r.bodyEn,
        stayDate: r.stayDate,
        source: r.source,
        isPublished: true,
        isFeatured: true,
        displayOrder: i,
      },
    });
  }

  // Seasonal rates
  const year = new Date().getFullYear();
  const seasonalRatesData = [
    {
      nameAr: "موسم الصيف — ذروة",
      nameEn: "Summer Peak Season",
      roomTypeId: null, // all room types
      ratePlanId: null,
      startDate: new Date(year, 5, 1), // June 1
      endDate: new Date(year, 8, 30), // Sept 30
      adjustmentType: "PERCENTAGE",
      adjustmentValue: 20, // +20%
      weekendAdjustmentType: "PERCENTAGE",
      weekendAdjustmentValue: 10, // +10% on Fri/Sat
      weekendDays: "5,6",
      priority: 10,
      minStayNights: 2, // min 2 nights during summer peak
      maxStayNights: 14, // max 14 nights during summer peak
    },
    {
      nameAr: "موسم الشتاء — خصم",
      nameEn: "Winter Low Season",
      roomTypeId: null,
      ratePlanId: null,
      startDate: new Date(year, 11, 1), // Dec 1
      endDate: new Date(year + 1, 1, 28), // Feb 28
      adjustmentType: "PERCENTAGE",
      adjustmentValue: -15, // -15% discount
      weekendAdjustmentType: "PERCENTAGE",
      weekendAdjustmentValue: 5, // +5% on weekends (still cheaper than peak)
      weekendDays: "5,6",
      priority: 5,
      minStayNights: 1, // no min in winter
      maxStayNights: 30, // allow longer stays in winter
    },
  ];
  for (const sr of seasonalRatesData) {
    await db.seasonalRate.create({
      data: {
        nameAr: sr.nameAr,
        nameEn: sr.nameEn,
        roomTypeId: sr.roomTypeId,
        ratePlanId: sr.ratePlanId,
        startDate: sr.startDate,
        endDate: sr.endDate,
        adjustmentType: sr.adjustmentType,
        adjustmentValue: sr.adjustmentValue,
        weekendAdjustmentType: sr.weekendAdjustmentType,
        weekendAdjustmentValue: sr.weekendAdjustmentValue,
        weekendDays: sr.weekendDays,
        priority: sr.priority,
        minStayNights: sr.minStayNights ?? null,
        maxStayNights: sr.maxStayNights ?? null,
        isActive: true,
      },
    });
  }

  // Promo codes
  const promoNow = new Date();
  const promoCodesData = [
    {
      code: "WELCOME10",
      nameAr: "ترحيب جديد",
      nameEn: "Welcome Offer",
      descriptionAr: "خصم 10% على حجزك الأول",
      descriptionEn: "10% off your first booking",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxUses: 1000,
      usedCount: 0,
      validFrom: promoNow,
      validTo: new Date(promoNow.getFullYear() + 1, 11, 31),
    },
    {
      code: "SUMMER20",
      nameAr: "عرض الصيف",
      nameEn: "Summer Deal",
      descriptionAr: "خصم 20% على إقامات الصيف",
      descriptionEn: "20% off summer stays",
      discountType: "PERCENTAGE",
      discountValue: 20,
      maxUses: 500,
      usedCount: 0,
      validFrom: promoNow,
      validTo: new Date(promoNow.getFullYear(), 8, 30),
    },
    {
      code: "ADEN5000",
      nameAr: "خصم عدن",
      nameEn: "Aden Discount",
      descriptionAr: "خصم 5000 ريال على حجزك",
      descriptionEn: "5000 YER off your booking",
      discountType: "FIXED",
      discountValue: 5000,
      maxUses: 200,
      usedCount: 0,
      validFrom: promoNow,
      validTo: new Date(promoNow.getFullYear() + 1, 5, 30),
    },
  ];
  for (const pc of promoCodesData) {
    await db.promoCode.create({ data: pc });
  }

  void prepaidPlan;
  console.log("✅ Seed completed successfully");
  console.log(`   Hotel: ${hotel.nameEn}`);
  const roomCount = await db.roomType.count();
  const facilityCount = await db.facility.count();
  const galleryCount = await db.galleryItem.count();
  const offerCount = await db.offer.count();
  const policyCount = await db.policy.count();
  const faqCount = await db.faq.count();
  const reviewCount = await db.review.count();
  console.log(`   Room types: ${roomCount}, Facilities: ${facilityCount}, Gallery: ${galleryCount}`);
  console.log(`   Offers: ${offerCount}, Policies: ${policyCount}, FAQs: ${faqCount}, Reviews: ${reviewCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
