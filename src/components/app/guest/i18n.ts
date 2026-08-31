// Shared bilingual strings for the guest app.

export type GuestLocale = "ar" | "en";

export const STR = {
  // App / persona
  appTitle: { ar: "ضيف", en: "Guest" },
  loading: { ar: "جارٍ التحميل…", en: "Loading…" },
  error: { ar: "خطأ", en: "Error" },
  retry: { ar: "إعادة", en: "Retry" },
  close: { ar: "إغلاق", en: "Close" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  confirm: { ar: "تأكيد", en: "Confirm" },
  submit: { ar: "إرسال", en: "Submit" },
  save: { ar: "حفظ", en: "Save" },
  refresh: { ar: "تحديث", en: "Refresh" },
  send: { ar: "إرسال", en: "Send" },
  logout: { ar: "خروج", en: "Logout" },
  closeApp: { ar: "إغلاق", en: "Close" },
  welcome: { ar: "مرحباً", en: "Welcome" },

  // Bottom nav
  tabHome: { ar: "الرئيسية", en: "Home" },
  tabStay: { ar: "الإقامة", en: "Stay" },
  tabServices: { ar: "الخدمات", en: "Services" },
  tabBill: { ar: "الفاتورة", en: "Bill" },

  // Quick actions on home
  requestService: { ar: "طلب خدمة", en: "Request Service" },
  reception: { ar: "الاستقبال", en: "Reception" },
  extension: { ar: "تمديد", en: "Extension" },
  checkout: { ar: "مغادرة", en: "Checkout" },
  myRequests: { ar: "طلباتي", en: "My Requests" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  chatWithReception: { ar: "محادثة الاستقبال", en: "Chat with Reception" },

  // Stay summary
  roomNumber: { ar: "الغرفة", en: "Room" },
  roomType: { ar: "نوع الغرفة", en: "Room Type" },
  checkIn: { ar: "تاريخ الوصول", en: "Check-In" },
  checkOut: { ar: "تاريخ المغادرة", en: "Check-Out" },
  nights: { ar: "الليالي", en: "Nights" },
  adults: { ar: "بالغون", en: "Adults" },
  children: { ar: "أطفال", en: "Children" },
  guests: { ar: "الضيوف", en: "Guests" },
  balance: { ar: "الرصيد المستحق", en: "Balance Due" },
  stayNumber: { ar: "رقم الإقامة", en: "Stay Number" },
  stayStatus: { ar: "حالة الإقامة", en: "Stay Status" },
  noBalance: { ar: "لا يوجد رصيد مستحق", en: "No balance due" },

  // Hotel info
  hotelInfo: { ar: "معلومات الفندق", en: "Hotel Information" },
  phone: { ar: "الهاتف", en: "Phone" },
  email: { ar: "البريد", en: "Email" },
  whatsapp: { ar: "واتساب", en: "WhatsApp" },
  address: { ar: "العنوان", en: "Address" },
  checkInTime: { ar: "موعد الوصول", en: "Check-In Time" },
  checkOutTime: { ar: "موعد المغادرة", en: "Check-Out Time" },
  facilities: { ar: "المرافق", en: "Facilities" },
  policies: { ar: "السياسات", en: "Policies" },
  contact: { ar: "اتصل بنا", en: "Contact" },
  callHotel: { ar: "اتصال بالفندق", en: "Call Hotel" },

  // Requests
  requestsTitle: { ar: "طلباتي", en: "My Requests" },
  noRequests: { ar: "لا توجد طلبات بعد", en: "No requests yet" },
  activeRequests: { ar: "الطلبات النشطة", en: "Active Requests" },
  completedRequests: { ar: "الطلبات المكتملة", en: "Completed Requests" },
  allRequests: { ar: "الكل", en: "All" },
  newRequest: { ar: "طلب جديد", en: "New Request" },
  customRequest: { ar: "طلب مخصص", en: "Custom Request" },
  requestDetail: { ar: "تفاصيل الطلب", en: "Request Detail" },
  createRequest: { ar: "إنشاء طلب", en: "Create Request" },
  requestNumber: { ar: "رقم الطلب", en: "Request No." },
  requestedAt: { ar: "طلب في", en: "Requested at" },
  timeline: { ar: "السجل الزمني", en: "Timeline" },
  assignedTo: { ar: "مُسند إلى", en: "Assigned to" },
  priority: { ar: "الأولوية", en: "Priority" },
  category: { ar: "الفئة", en: "Category" },
  service: { ar: "الخدمة", en: "Service" },
  title: { ar: "العنوان", en: "Title" },
  description: { ar: "الوصف", en: "Description" },
  descriptionPlaceholder: { ar: "اكتب تفاصيل الطلب…", en: "Describe your request…" },
  preferredTime: { ar: "الوقت المفضل", en: "Preferred Time" },
  preferredTimePlaceholder: { ar: "اختياري — مثال: قبل 11 صباحاً", en: "Optional — e.g. before 11 AM" },
  priorityNormal: { ar: "عادية", en: "Normal" },
  priorityUrgent: { ar: "عاجلة", en: "Urgent" },
  cancelRequest: { ar: "إلغاء الطلب", en: "Cancel Request" },
  addMessage: { ar: "إضافة رسالة", en: "Add Message" },
  message: { ar: "رسالة", en: "Message" },
  messagePlaceholder: { ar: "اكتب رسالتك…", en: "Type your message…" },
  cancelReason: { ar: "سبب الإلغاء (اختياري)", en: "Cancellation reason (optional)" },
  cancelReasonPlaceholder: { ar: "سبب الإلغاء", en: "Reason for cancellation" },
  chargeable: { ar: "بتكلفة", en: "Chargeable" },
  expectedResponse: { ar: "استجابة متوقعة", en: "Expected response" },
  minutes: { ar: "دقيقة", en: "min" },

  // Filters
  filterAll: { ar: "الكل", en: "All" },
  filterActive: { ar: "نشطة", en: "Active" },
  filterCompleted: { ar: "مكتملة", en: "Completed" },

  // Services
  servicesTitle: { ar: "خدمات الفندق", en: "Hotel Services" },
  noServices: { ar: "لا توجد خدمات متاحة", en: "No services available" },
  tapToRequest: { ar: "اضغط لطلب الخدمة", en: "Tap to request this service" },

  // Bill
  billTitle: { ar: "الفاتورة", en: "Bill" },
  charges: { ar: "التكاليف", en: "Charges" },
  payments: { ar: "المدفوعات", en: "Payments" },
  totals: { ar: "الإجماليات", en: "Totals" },
  totalCharges: { ar: "إجمالي التكاليف", en: "Total Charges" },
  totalPayments: { ar: "إجمالي المدفوعات", en: "Total Payments" },
  noCharges: { ar: "لا توجد تكاليف", en: "No charges" },
  noPayments: { ar: "لا توجد مدفوعات", en: "No payments" },
  paymentMethod: { ar: "طريقة الدفع", en: "Method" },

  // Conversation
  chat: { ar: "محادثة", en: "Chat" },
  chatPlaceholder: { ar: "اكتب رسالة…", en: "Type a message…" },
  noMessages: { ar: "لا توجد رسائل بعد", en: "No messages yet" },
  receptionTeam: { ar: "فريق الاستقبال", en: "Reception Team" },
  chatHint: { ar: "نحن هنا لمساعدتك على مدار الساعة", en: "We're here for you 24/7" },

  // Notifications
  notificationsTitle: { ar: "الإشعارات", en: "Notifications" },
  noNotifications: { ar: "لا توجد إشعارات", en: "No notifications" },
  markAllRead: { ar: "تعليم الكل كمقروء", en: "Mark all read" },
  markRead: { ar: "تعليم كمقروء", en: "Mark as read" },
  unread: { ar: "غير مقروء", en: "Unread" },

  // Extension
  extensionTitle: { ar: "طلب تمديد الإقامة", en: "Stay Extension Request" },
  extensionHint: { ar: "اختر تاريخ المغادرة الجديد — يجب أن يكون بعد تاريخ المغادرة الحالي.", en: "Pick the new check-out date — must be after the current one." },
  newCheckOut: { ar: "تاريخ المغادرة الجديد", en: "New Check-Out" },
  additionalNights: { ar: "ليالٍ إضافية", en: "Additional Nights" },
  estimatedCost: { ar: "التكلفة التقديرية", en: "Estimated Cost" },
  extensionNote: { ar: "ملاحظة (اختياري)", en: "Note (optional)" },
  submitExtension: { ar: "إرسال طلب التمديد", en: "Submit Extension Request" },

  // Checkout
  checkoutTitle: { ar: "طلب المغادرة", en: "Checkout Request" },
  checkoutHint: { ar: "إرسال طلب مغادرة إلى الاستقبال. سيتم التواصل معك لإتمام الإجراءات.", en: "Send a checkout request to reception. They will contact you to finalize." },
  checkoutNote: { ar: "ملاحظة (اختياري)", en: "Note (optional)" },
  submitCheckout: { ar: "إرسال طلب المغادرة", en: "Submit Checkout Request" },

  // Toasts
  toastRequestCreated: { ar: "تم إنشاء الطلب بنجاح", en: "Request created" },
  toastRequestCancelled: { ar: "تم إلغاء الطلب", en: "Request cancelled" },
  toastMessageSent: { ar: "تم إرسال الرسالة", en: "Message sent" },
  toastChatSent: { ar: "تم إرسال رسالتك", en: "Your message was sent" },
  toastNotificationsCleared: { ar: "تم تعليم الإشعارات كمقروءة", en: "Notifications marked as read" },
  toastExtensionSent: { ar: "تم إرسال طلب التمديد", en: "Extension request sent" },
  toastCheckoutSent: { ar: "تم إرسال طلب المغادرة", en: "Checkout request sent" },
  toastRequestCreatedWithCharge: { ar: "تم إنشاء الطلب وإضافة التكلفة إلى الفاتورة", en: "Request created — charge added to your bill" },

  // Errors
  errGeneric: { ar: "تعذّر إكمال العملية. حاول مرة أخرى.", en: "Could not complete the action. Try again." },
  errTitleRequired: { ar: "العنوان مطلوب", en: "Title is required" },
  errCategoryRequired: { ar: "الفئة مطلوبة", en: "Category is required" },
  errCannotCancel: { ar: "لا يمكن إلغاء هذا الطلب", en: "This request cannot be cancelled" },
  errAlreadyPending: { ar: "يوجد طلب مغادرة معلّق بالفعل", en: "A pending checkout request already exists" },
  errMustBeAfter: { ar: "التاريخ الجديد يجب أن يكون بعد تاريخ المغادرة الحالي", en: "New date must be after current check-out" },
  errStayNotCheckedIn: { ar: "إقامتك غير نشطة حالياً", en: "Your stay is not active" },
} as const;

export type StrKey = keyof typeof STR;

export function t(key: StrKey, locale: GuestLocale): string {
  return STR[key][locale];
}
