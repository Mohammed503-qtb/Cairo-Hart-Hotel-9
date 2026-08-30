# HOTEL PLATFORM — MASTER PLAN
## Integrated Hotel Booking, PMS, Guest Journey, Guest App & Reception Operations

> **Document Type:** Master Product & Engineering Plan  
> **Status:** Approved Scope / Execution Baseline  
> **Version:** 1.0  
> **Primary Goal:** Build a coherent hotel operating platform that connects the public hotel website, booking engine, reservation lifecycle, reception/PMS operations, guest application, guest service requests, room lifecycle, billing, notifications, WhatsApp communication, and auditability into one integrated system.

---

# 0. EXECUTIVE DEFINITION

This project is **not** merely a hotel website.

This project is **not** merely an online booking system.

This project is **not** merely a guest mobile application.

This project is an **integrated hotel operating platform** in which the guest experiences one continuous journey:

```text
Discover Hotel
    ↓
Browse Rooms
    ↓
Check Availability
    ↓
Create Reservation
    ↓
Payment / Payment Method
    ↓
Reservation Confirmation
    ↓
WhatsApp Confirmation + Booking File
    ↓
Pre-Arrival Communication
    ↓
Guest Arrives
    ↓
Reception Verifies Guest
    ↓
Check-In
    ↓
Reservation becomes Active Stay
    ↓
Room becomes Occupied
    ↓
Guest Access to Hotel App
    ↓
Guest Uses Room + Hotel Services
    ↓
Requests / Messages / Problems / Housekeeping / Services
    ↓
Reception Receives and Manages Requests
    ↓
Operations Execute Requests
    ↓
Charges / Payments / Adjustments
    ↓
Extension / Room Change / Other Stay Changes
    ↓
Pre-Checkout
    ↓
Checkout
    ↓
Room becomes Dirty
    ↓
Housekeeping / Inspection
    ↓
Room becomes Available
    ↓
Stay Closed
    ↓
Guest Feedback / Post-Stay Communication
```

The platform must maintain a **single source of truth** for the guest, reservation, stay, room, requests, charges, payments, and operational history.

---

# 1. PRODUCT VISION

## 1.1 Vision

Create a hotel platform where the guest can move from discovery to completed stay with minimal friction, while hotel staff can operate reservations, rooms, guest requests, check-in, check-out, billing, and communication from one central operational system.

## 1.2 Core Principle

A guest action must not become an isolated message.

For example:

```text
Guest clicks "Request Cleaning"
```

must become:

```text
Guest
    ↓
Current Stay
    ↓
Room
    ↓
Guest Request
    ↓
Operational Assignment
    ↓
Status Tracking
    ↓
Completion
    ↓
Guest Notification
    ↓
Optional Charge
    ↓
Audit Log
```

The request must remain traceable from creation until closure.

## 1.3 Product Promise

The system must provide:

- Easy booking.
- Accurate room availability.
- Reliable reservation lifecycle.
- Smooth check-in.
- Secure guest access.
- Real-time guest requests.
- Reception-centered operations.
- Clear room status.
- Controlled billing.
- Complete operational history.
- WhatsApp-assisted communication.
- Strong auditability.
- A foundation that can be expanded without breaking existing logic.

---

# 2. SCOPE

## 2.1 IN SCOPE — CORE VERSION

The core system MUST include:

### Public Experience
- Hotel website.
- Hotel information.
- Room listing.
- Room details.
- Facilities and amenities.
- Gallery.
- Policies.
- Contact information.
- Availability search.
- Booking flow.
- Booking confirmation.
- Booking lookup.

### Booking
- Reservation creation.
- Reservation number generation.
- Guest profile creation.
- Room/type selection.
- Date validation.
- Availability checking.
- Price calculation.
- Discounts where configured.
- Payment method selection.
- Payment recording.
- Confirmation document.
- Booking status lifecycle.
- Cancellation handling.
- Modification handling.
- No-show handling.

### Hotel Operations / PMS
- Dashboard.
- Reservations.
- Arrivals.
- Departures.
- In-house guests.
- Rooms.
- Room status.
- Guest profiles.
- Active stays.
- Check-in.
- Check-out.
- Room transfers.
- Extension requests.
- Charges.
- Payments.
- Guest requests.
- Internal notes.
- Audit log.

### Guest App
- Secure guest activation/login.
- Current stay.
- Room information.
- Reservation information.
- Hotel information.
- Guest services.
- Request creation.
- Request tracking.
- Reception communication.
- Extension request.
- Room change request.
- Billing overview.
- Checkout request.
- Notifications.
- Guest feedback.

### Communication
- In-app notifications.
- Operational notifications.
- WhatsApp booking confirmation.
- WhatsApp pre-arrival reminders where configured.
- WhatsApp status/update messaging where supported.
- Booking confirmation file.

### Operational Workflow
- New request.
- Acknowledged.
- Assigned/in progress.
- Completed.
- Guest notified.
- Guest acknowledgment when required.
- Escalation/issue handling.
- Request history.

### Billing
- Room charges.
- Service charges.
- Additional charges.
- Discounts.
- Payments.
- Remaining balance.
- Invoice/final bill.
- Charge history.

### Security / Governance
- Authentication.
- Role-based access control.
- Session management.
- Audit logging.
- Sensitive data protection.
- Action authorization.
- Validation.
- Error handling.

---

# 3. OUT OF SCOPE FOR CORE RELEASE

The following must NOT delay the core release:

- Full restaurant POS.
- Full accounting ERP.
- Spa management.
- Complex loyalty engine.
- Advanced revenue management.
- Channel manager integrations.
- Booking.com/Expedia integrations.
- Corporate contract management.
- Travel-agent portal.
- Multi-property enterprise management.
- Advanced housekeeping mobile application.
- Advanced maintenance mobile application.
- Complex procurement.
- Payroll.
- Full HR.
- Warehouse management.
- Advanced CRM automation.
- AI concierge.
- Dynamic pricing with machine learning.

These can be future modules.

---

# 4. ACTORS AND ROLES

The system should deliberately avoid excessive roles.

## 4.1 ADMIN / OWNER

Primary authority.

Can:
- Configure hotel.
- Manage room types and rooms.
- Manage prices.
- Manage booking rules.
- View reservations.
- Manage guests.
- Manage users.
- View reports.
- Manage services.
- Manage permissions.
- Review audit log.
- Override operational states where authorized.

Admin actions should be permission-controlled and audited.

---

## 4.2 RECEPTION

Reception is the **operational center**.

Can:
- View arrivals.
- View departures.
- Search bookings.
- Confirm reservations when applicable.
- Check guests in.
- Check guests out.
- Assign rooms.
- Transfer rooms.
- Manage stay details.
- Create/modify permitted charges.
- Record payments.
- Receive guest requests.
- Assign/forward requests.
- Communicate with guests.
- Approve extension requests according to policy.
- Update operational statuses.
- View guest information necessary for operation.

Reception MUST NOT automatically receive all administrative privileges.

---

## 4.3 GUEST

Guest can:
- Access active stay.
- View reservation/stay.
- View room.
- Submit requests.
- View request status.
- Contact reception.
- Request extension.
- Request room change.
- View eligible charges/balance.
- Request checkout.
- Send feedback.

Guest MUST never access another guest's data.

---

# 5. CENTRAL DOMAIN MODEL

The system should be built around these major entities:

```text
Hotel
RoomType
Room
RatePlan
Guest
Reservation
Stay
GuestAccess
GuestRequest
RequestMessage
Service
Charge
Payment
Invoice
Notification
Conversation
RoomAssignment
RoomStatusHistory
AuditLog
User
Role
Permission
```

## 5.1 MOST IMPORTANT RELATIONSHIP

The relationship is:

```text
Guest
   ↓
Reservation
   ↓
Stay
   ↓
Room
```

And then:

```text
Stay
 ├── Guest Requests
 ├── Conversations
 ├── Charges
 ├── Payments
 ├── Notifications
 ├── Room Transfers
 └── Audit Events
```

A current stay is the primary operational context for guest actions.

---

# 6. RESERVATION VS STAY

This distinction is mandatory.

## Reservation

Represents a booking before and around arrival.

Example:

```text
Reservation #HTL-2026-000421
Guest: Mohamed Ahmed
Check-in: 2026-09-01
Check-out: 2026-09-04
Room Type: Deluxe Double
Status: Confirmed
```

## Stay

Represents the guest's actual hotel occupancy after successful check-in.

Example:

```text
Stay #ST-2026-000883
Reservation: HTL-2026-000421
Guest: Mohamed Ahmed
Room: 204
Status: In-House
```

### MUST NOT

Do not use Reservation as a substitute for Stay after check-in.

A guest request during an active stay must be linked to the active Stay.

---

# 7. WEBSITE

## 7.1 Home Page

Must include:

- Hotel identity.
- Main value proposition.
- Booking search.
- Featured room types.
- Main amenities.
- Gallery.
- Location.
- Contact.
- Booking CTA.
- Essential policies.

## 7.2 Rooms Page

Each room type should show:

- Name.
- Images.
- Description.
- Bed configuration.
- Occupancy.
- Amenities.
- Size where applicable.
- Price/from-price if configured.
- Availability CTA.

## 7.3 Room Details

Must allow the guest to understand exactly what is being booked.

Include:
- Photo gallery.
- Description.
- Amenities.
- Rules.
- Occupancy.
- Included services.
- Pricing information.
- Availability action.

---

# 8. BOOKING ENGINE

## 8.1 Search

Inputs:

- Check-in date.
- Check-out date.
- Adults.
- Children if supported.
- Room quantity where supported.

Validation:

- Check-out > check-in.
- Dates allowed by hotel policy.
- Occupancy rules.
- Room availability.

## 8.2 Availability Calculation

Availability must consider:

- Existing reservations.
- Active stays.
- Blocked rooms.
- Out-of-order rooms.
- Out-of-service rooms.
- Room inventory.
- Room type inventory.
- Date overlap.

The system MUST NOT sell the same inventory twice.

## 8.3 Price Calculation

Pricing pipeline:

```text
Base Rate
+ Extra Occupancy Charges (if applicable)
+ Applicable Service/Tax
- Discounts
= Total
```

Every calculated amount must be reproducible.

The system should store the booking-time pricing snapshot so later rate changes do not silently alter an existing confirmed reservation.

---

# 9. RESERVATION LIFECYCLE

Suggested states:

```text
Draft
Pending
Confirmed
Cancelled
No-Show
Checked-In
Checked-Out
Completed
```

Rules:

- `Draft` is not inventory-confirmed until appropriate.
- `Confirmed` reserves applicable inventory.
- `Cancelled` releases reserved inventory according to business rules.
- `No-Show` must follow hotel policy.
- `Checked-In` means the guest has entered operational stay.
- `Checked-Out` means stay is closed operationally.
- `Completed` is an optional finalized historical state.

Every state transition must be logged.

---

# 10. BOOKING CONFIRMATION

After successful booking:

System MUST generate:

- Unique reservation number.
- Confirmation record.
- Confirmation message.
- Booking confirmation document/PDF.
- Guest communication event.

Document should contain:

- Hotel identity.
- Reservation number.
- Guest name.
- Contact information where appropriate.
- Room type.
- Number of guests.
- Check-in date.
- Check-out date.
- Number of nights.
- Price.
- Amount paid.
- Amount due.
- Important hotel policies.
- Hotel contact information.
- Location.
- QR/reference code where applicable.

---

# 11. WHATSAPP COMMUNICATION

WhatsApp is a communication channel, NOT the source of truth.

Source of truth:

```text
Hotel Platform Database
```

WhatsApp should communicate events generated by that source.

Possible messages:

### Booking Created
- Reservation number.
- Dates.
- Room type.
- Amount.
- Confirmation.

### Booking Reminder
- Upcoming arrival.
- Reservation reference.
- Hotel information.

### Check-in Information
- Arrival instructions.
- Hotel contact.

### Request Updates
- Request received.
- Request in progress where appropriate.
- Request completed.

### Checkout Reminder
- Departure date/time.
- Outstanding amount when appropriate.

The implementation must respect the capabilities and policies of the selected WhatsApp provider.

---

# 12. CHECK-IN WORKFLOW

## 12.1 Arrival Screen

Reception sees:

- Arrivals today.
- Expected time where provided.
- Reservation number.
- Guest.
- Room type.
- Assigned room.
- Payment status.
- Reservation status.

## 12.2 Check-in Process

Reception:

1. Searches reservation.
2. Verifies guest identity according to hotel policy.
3. Confirms reservation.
4. Assigns room if needed.
5. Records required guest data.
6. Records deposit/payment if applicable.
7. Confirms check-in.
8. Creates/activates Stay.
9. Sets room to Occupied.
10. Creates guest access.
11. Sends/prints guest access information.

## 12.3 Check-in Result

Before:

```text
Reservation = Confirmed
Room = Reserved / Available according to setup
```

After:

```text
Reservation = Checked-In
Stay = Active
Room = Occupied
Guest Access = Active
```

---

# 13. GUEST ACCESS / UNIQUE CODE

The unique access code is not a normal hotel-wide password.

It should be an **activation credential tied to a specific guest stay**.

## 13.1 Requirements

- Unique enough to prevent guessing.
- Time/validity controlled.
- Can be revoked.
- Can be regenerated.
- Must not expose internal IDs.
- Must be rate-limited.
- Must not be reusable indefinitely.
- Must be tied to the correct stay or approved activation context.

## 13.2 Activation

Guest opens app:

```text
Enter Hotel Access Code
```

System validates:

```text
Code
↓
Validity
↓
Hotel
↓
Stay
↓
Guest
↓
Current Room
```

Then creates a normal authenticated session/token for the guest.

The raw access code must not be treated as the permanent authentication credential.

---

# 14. GUEST APP

## 14.1 Home

Show:

- Guest name.
- Hotel name.
- Current room.
- Check-out date.
- Current stay status.
- Important notifications.
- Quick service actions.

Example:

```text
Welcome, Mohamed

Room 204
Stay until 4 September

[Request Service]
[Reception]
[My Stay]
[My Bill]
[Extend Stay]
```

---

# 15. GUEST SERVICE CATALOG

Initial categories:

### Housekeeping
- Clean room.
- Towels.
- Linens.
- Toiletries.
- Other room supplies.

### Maintenance
- Air conditioning issue.
- Water issue.
- Electricity issue.
- TV issue.
- Wi-Fi issue.
- Other maintenance.

### Guest Services
- Extra pillow.
- Extra blanket.
- General assistance.
- Special request.

### Reception
- General inquiry.
- Extension request.
- Room change.
- Checkout request.

The catalog must be configurable.

---

# 16. CUSTOM REQUEST

Guest must be able to submit a request not covered by predefined options.

Fields:

- Title/category.
- Description.
- Optional attachment.
- Preferred time.
- Urgency if supported.

Example:

```text
I need an extra blanket and two bottles of water.
```

The system creates a formal request.

---

# 17. REQUEST WORKFLOW

Every request must be stateful.

Recommended states:

```text
NEW
ACKNOWLEDGED
ASSIGNED
IN_PROGRESS
WAITING
COMPLETED
CANCELLED
REJECTED
REOPENED
```

## 17.1 Lifecycle

```text
Guest Creates Request
        ↓
NEW
        ↓
Reception Receives
        ↓
ACKNOWLEDGED
        ↓
Assigned / In Progress
        ↓
COMPLETED
        ↓
Guest Notified
        ↓
Guest Confirms / Reopens if necessary
```

## 17.2 Request Object Must Store

- Request ID.
- Stay ID.
- Guest ID.
- Room ID.
- Category.
- Service.
- Description.
- Priority.
- Created time.
- Assigned user/team.
- Status.
- Completion time.
- Notes.
- Attachments.
- Related charge if any.
- Audit history.

---

# 18. RECEPTION REQUEST CENTER

Reception needs a live operational queue.

Columns/filters:

- New.
- Acknowledged.
- In Progress.
- Waiting.
- Completed.
- Urgent.
- By room.
- By category.
- By time.

Example:

```text
#982  Room 204  Cleaning      NEW
#983  Room 305  Towels        IN_PROGRESS
#984  Room 211  Maintenance   NEW
```

Reception must be able to open a request and immediately understand:

- Who requested it.
- Which room.
- Which stay.
- What was requested.
- When it was requested.
- Current status.
- Who is responsible.

---

# 19. RECEPTION COMMUNICATION

The guest should have a direct in-app channel to reception.

This is not necessarily a complex social chat.

It can be a structured support conversation.

Each conversation should be linked to:

- Guest.
- Stay.
- Room.
- Conversation ID.
- Messages.
- Status.

Possible statuses:

```text
OPEN
WAITING
RESOLVED
CLOSED
```

Reception may convert a conversation into a formal request when appropriate.

Example:

```text
Guest:
The AC is not cooling.

Reception:
Creates Maintenance Request #1082

Conversation
    ↕
Request #1082
```

---

# 20. ROOM MANAGEMENT

Each room must contain:

- Room number/code.
- Room type.
- Floor.
- Capacity.
- Active/inactive state.
- Current operational status.
- Current guest/stay where applicable.
- Maintenance condition.
- Operational history.

## 20.1 Room Status

Core statuses:

```text
AVAILABLE
RESERVED
OCCUPIED
DIRTY
CLEANING
CLEAN
INSPECTED
OUT_OF_ORDER
OUT_OF_SERVICE
```

Not every implementation needs every state on day one, but the domain model must be able to support them.

---

# 21. ROOM STATE RULES

Example after checkout:

```text
OCCUPIED
   ↓
DIRTY
   ↓
CLEANING
   ↓
CLEAN
   ↓
INSPECTED (optional)
   ↓
AVAILABLE
```

If a problem is discovered:

```text
CLEANING / CLEAN
   ↓
OUT_OF_ORDER
```

Room availability must reflect actual operational state.

---

# 22. ROOM TRANSFER

A room change is a formal event.

It must record:

- Stay.
- Guest.
- Old room.
- New room.
- Reason.
- Requested by.
- Approved by.
- Date/time.
- Charges/price adjustment if any.

After transfer:

```text
Old Room → Properly Released
New Room → Occupied
Stay → New Room
Guest App → New Room
```

All future requests must target the new active room.

Historical requests remain linked to the room context in effect when they were created.

---

# 23. STAY MANAGEMENT

Active stay must track:

- Guest.
- Reservation.
- Room.
- Check-in.
- Expected checkout.
- Actual checkout.
- Current stay status.
- Current balance.
- Notes.
- Related requests.
- Related charges.
- Payments.

Possible stay states:

```text
EXPECTED
CHECKED_IN
IN_HOUSE
EXTENSION_PENDING
CHECKOUT_PENDING
CHECKED_OUT
CLOSED
```

---

# 24. EXTENSION

Guest requests:

```text
Current checkout: Sep 4
Requested checkout: Sep 6
```

System:

1. Checks availability.
2. Calculates additional cost.
3. Displays cost.
4. Creates extension request.
5. Reception reviews.
6. Approves or rejects.
7. Updates reservation/stay dates.
8. Updates room inventory.
9. Updates pricing/charges.
10. Notifies guest.
11. Audits the change.

Never simply overwrite the date without preserving history.

---

# 25. CANCELLATION

Cancellation must:

- Update reservation state.
- Apply cancellation policy.
- Release applicable inventory.
- Handle applicable refund/forfeit logic.
- Notify guest.
- Record reason.
- Audit the action.

---

# 26. NO-SHOW

No-show must be a controlled workflow.

Reception/Admin can mark:

```text
Reservation → NO_SHOW
```

System must then follow configured policy for:

- Inventory release.
- Charges.
- Deposit.
- Notification.
- Reporting.

---

# 27. BILLING MODEL

Billing is part of the core operating model.

Use a ledger-like structure rather than storing a single mutable total.

## 27.1 Charges

Examples:

- Room charge.
- Service.
- Extra bed.
- Laundry.
- Additional guest fee.
- Other approved charge.
- Adjustment.
- Discount.

Each charge should contain:

- Charge ID.
- Stay ID.
- Description.
- Category.
- Quantity.
- Unit price.
- Gross amount.
- Discount.
- Net amount.
- Tax if applicable.
- Date/time.
- Source.
- Created by.

## 27.2 Payments

Each payment stores:

- Payment ID.
- Stay/reservation.
- Method.
- Amount.
- Date/time.
- Reference.
- Recorded by.
- Status.

## 27.3 Balance

Conceptually:

```text
Total Charges
+ Adjustments
- Payments
= Outstanding Balance
```

Never manually edit the balance as a number without corresponding ledger entries.

---

# 28. BILL / INVOICE

Guest should see a readable billing summary:

```text
Room
Services
Extra Charges
Discounts
Payments

Total
Paid
Remaining
```

Reception should have the detailed version with operational references.

Final invoice should be generated at checkout or according to hotel workflow.

---

# 29. CHECKOUT WORKFLOW

## Guest Initiated

Guest presses:

```text
Request Checkout
```

System creates checkout request.

Reception reviews:

- Outstanding balance.
- Pending requests.
- Room status.
- Extra charges.

Then confirms checkout.

## Staff Initiated

Reception can perform checkout directly when authorized.

After successful checkout:

```text
Stay = CHECKED_OUT
Room = DIRTY
Guest Access = Deactivated / Post-Stay State
```

Any allowed post-stay access must be explicitly designed, not accidental.

---

# 30. NOTIFICATION SYSTEM

Notifications should be event-driven.

## Guest Notifications

- Reservation created.
- Reservation confirmed.
- Reservation modified.
- Reservation cancelled.
- Pre-arrival reminder.
- Check-in completed.
- Guest access activated.
- Request received.
- Request status changed.
- Request completed.
- Extension approved/rejected.
- Room changed.
- Checkout reminder.
- Invoice ready.
- Checkout completed.

## Staff Notifications

- New reservation.
- Cancellation.
- Arrival.
- Request.
- Urgent request.
- Guest message.
- Extension request.
- Checkout request.
- Operational alert.

---

# 31. CHANNELS

Notification system should abstract delivery channels:

```text
Notification Event
      ↓
Notification Service
      ├── In-App
      ├── Push
      ├── WhatsApp
      └── Email (optional)
```

Do not hard-code business logic into one notification provider.

---

# 32. ADMIN DASHBOARD

Dashboard should answer operational questions immediately.

## KPIs

- Occupied rooms.
- Available rooms.
- Arrivals today.
- Departures today.
- In-house guests.
- Pending requests.
- Requests in progress.
- Outstanding balances.
- Today's bookings.
- Cancellations.
- No-shows.

## Operational widgets

- Arrivals list.
- Departures list.
- Room status board.
- Request queue.
- Recent reservations.
- Alerts.

---

# 33. RECEPTION DASHBOARD

Reception screen should prioritize speed.

Primary actions:

```text
Search Reservation
Check In
Check Out
Assign Room
Transfer Room
Guest Requests
Guest Messages
New Reservation
Guest Profile
Current Stays
Payments
```

The user should not be forced through deep navigation for common front-desk tasks.

---

# 34. GUEST PROFILE

Each guest should have a stable profile.

Fields may include:

- Guest ID.
- Full name.
- Phone.
- WhatsApp.
- Email.
- Identification data according to local/legal requirements.
- Nationality where required.
- Contact preferences.
- Reservation history.
- Stay history.
- Notes.
- Current stay.

Sensitive fields require restricted access.

---

# 35. SEARCH

Reception must be able to search by:

- Reservation number.
- Guest name.
- Phone.
- Room number.
- Stay ID.
- Booking reference.

Search results must clearly distinguish:

- Past reservations.
- Current stays.
- Future reservations.
- Cancelled reservations.

---

# 36. AUDIT LOG

Audit logging is mandatory for sensitive operations.

Audit events include:

- Reservation creation.
- Reservation modification.
- Reservation cancellation.
- Rate changes.
- Check-in.
- Check-out.
- Room transfer.
- Extension approval.
- Charge creation.
- Charge adjustment.
- Payment recording.
- Guest profile changes.
- Access code generation/revocation.
- Request status changes.
- User role/permission changes.

Audit fields:

```text
Audit ID
Actor
Role
Action
Entity Type
Entity ID
Previous Value / Summary
New Value / Summary
Timestamp
Reason (when required)
```

Audit records must be append-oriented and protected from normal operational deletion.

---

# 37. SECURITY MODEL

## MUST

- Secure authentication.
- Role-based authorization.
- Server-side authorization checks.
- Guest-to-stay ownership checks.
- Rate limiting for access-code entry.
- Secure token/session handling.
- HTTPS in production.
- Input validation.
- Output encoding where applicable.
- Secure file access.
- Least-privilege permissions.
- Audit logging.
- Secret management.
- Backup/recovery procedures.

## MUST NOT

- Trust a guest-provided room number.
- Trust a guest-provided reservation ID alone for access.
- Expose another guest's booking.
- Use predictable permanent access codes.
- Put sensitive secrets in client code.
- Treat UI restrictions as authorization.
- Allow price/balance manipulation from client-side values.

---

# 38. GUEST DATA ISOLATION

For every guest request:

```text
Authenticated Guest
      ↓
Current Session
      ↓
Current Guest Identity
      ↓
Current Active Stay
      ↓
Authorized Request / Reservation
```

The backend must validate this chain.

A guest cannot simply change:

```text
stayId=883
```

to:

```text
stayId=884
```

and gain another guest's information.

Authorization is mandatory at data access level.

---

# 39. FILES AND DOCUMENTS

Possible documents:

- Booking confirmation.
- Invoice.
- Guest registration document where legally appropriate.
- Other hotel-generated files.

Documents must have:

- Ownership context.
- Access control.
- Secure storage.
- Expiration rules where appropriate.
- Auditability.

Public URLs to sensitive guest documents should be avoided.

---

# 40. CONFIGURATION

Hotel should be configurable without rewriting application logic.

Configuration categories:

### Hotel
- Name.
- Logo.
- Contact.
- Address.
- Check-in time.
- Check-out time.
- Policies.

### Rooms
- Room types.
- Rooms.
- Amenities.
- Capacity.

### Pricing
- Rates.
- Discounts.
- Taxes/fees if configured.
- Minimum stays where supported.

### Services
- Categories.
- Service names.
- Availability.
- Whether chargeable.
- Price.
- Expected response time.

### Guest Requests
- Status workflow.
- Priority levels.
- Assignment groups.

---

# 41. DATABASE DESIGN PRINCIPLES

The database should be normalized around actual business entities.

Avoid:

- Giant table containing everything.
- Mutable denormalized totals as sole source of truth.
- Guest data duplicated across requests.
- Room number copied without room identity.
- Reservation data copied as independent text everywhere.
- Charges stored only as a final sum.
- Payment stored only as a balance adjustment.

Prefer stable IDs and relationships.

---

# 42. SUGGESTED CORE TABLES

```text
hotels
users
roles
permissions
role_permissions
user_roles

guests

room_types
rooms
room_amenities
room_type_amenities
room_status_history

rate_plans
room_rates

reservations
reservation_guests
reservation_rooms
reservation_status_history

stays
stay_rooms
stay_status_history

guest_access
guest_sessions

services
service_categories

guest_requests
guest_request_events
guest_request_assignments
guest_request_messages

conversations
conversation_messages

charges
charge_items
payments
payment_allocations
invoices

notifications
notification_deliveries

room_transfers

audit_logs

files
```

Exact schema should be refined during implementation based on the selected stack/database.

---

# 43. API / BACKEND DOMAIN RULES

Business rules must live in a backend/domain layer rather than being duplicated inside screens.

Examples:

```text
CreateReservation
CheckAvailability
ConfirmReservation
CancelReservation
CheckInGuest
CreateStay
AssignRoom
TransferRoom
CreateGuestRequest
AcknowledgeRequest
AssignRequest
CompleteRequest
CreateExtensionRequest
ApproveExtension
AddCharge
RecordPayment
CheckoutGuest
CloseStay
```

Each use case must validate business rules.

---

# 44. EVENT-DRIVEN THINKING

Important business events should be represented explicitly.

Examples:

```text
ReservationCreated
ReservationConfirmed
ReservationCancelled
GuestCheckedIn
StayCreated
RoomAssigned
RoomTransferred
GuestRequestCreated
GuestRequestAcknowledged
GuestRequestCompleted
ExtensionRequested
ExtensionApproved
ChargeCreated
PaymentRecorded
GuestCheckedOut
RoomMarkedDirty
RoomMarkedAvailable
```

Events may later drive notifications, integrations, reporting, and analytics.

---

# 45. CORE BUSINESS INVARIANTS

These are non-negotiable.

## Reservation / Inventory

- A room cannot be double-booked.
- An unavailable room cannot be assigned without an authorized override.
- Cancelled reservations must not continue blocking inventory.

## Stay

- A stay requires a valid guest.
- A stay requires valid reservation context where applicable.
- An active stay must have a valid room assignment unless the workflow explicitly allows an unassigned state.
- A checked-out stay cannot continue receiving normal in-house requests.

## Guest App

- Guest only sees authorized current/historical information.
- Guest requests must belong to an authorized stay.
- Access must not persist incorrectly after checkout.

## Billing

- Every charge must have a source.
- Every payment must be auditable.
- Balance must be derivable from transactions.
- Client cannot directly set final balance.

## Room

- Room state transitions must be valid.
- Room cannot simultaneously be active in conflicting stays.

---

# 46. GUEST JOURNEY — COMPLETE SCENARIO

## Step 1: Discovery

Guest enters website.

## Step 2: Exploration

Guest views:

- Rooms.
- Amenities.
- Policies.
- Photos.
- Location.

## Step 3: Search

Guest selects:

```text
Arrival
Departure
Guests
```

## Step 4: Availability

System calculates available inventory.

## Step 5: Selection

Guest selects room type.

## Step 6: Booking

Guest enters information.

## Step 7: Payment

Guest chooses payment flow.

## Step 8: Confirmation

System creates reservation.

## Step 9: Communication

WhatsApp + confirmation document.

## Step 10: Pre-arrival

Reminder and relevant instructions.

## Step 11: Arrival

Guest reaches hotel.

## Step 12: Reception

Reception finds reservation.

## Step 13: Verification

Guest identity/details verified.

## Step 14: Check-in

Stay becomes active.

## Step 15: Room assignment

Room becomes occupied.

## Step 16: Guest activation

Access code/activation method generated.

## Step 17: Guest App

Guest enters app.

## Step 18: Current Stay

App displays room and stay.

## Step 19: Service Request

Guest requests cleaning.

## Step 20: Reception

Request appears immediately.

## Step 21: Processing

Request acknowledged and assigned.

## Step 22: Execution

Operational staff perform task.

## Step 23: Completion

Request becomes completed.

## Step 24: Guest Notification

Guest is informed.

## Step 25: Billing

If chargeable, charge is added to stay.

## Step 26: Extension

Guest can request additional nights.

## Step 27: Approval

Reception checks availability and approves.

## Step 28: Update

Stay and reservation dates update with history.

## Step 29: Checkout

Guest requests or performs checkout.

## Step 30: Final Billing

Balance finalized.

## Step 31: Room Release

Room becomes dirty.

## Step 32: Housekeeping

Room cleaned.

## Step 33: Availability

Room becomes available again.

## Step 34: Stay Closure

Stay becomes closed.

## Step 35: Post-stay

Feedback / thank-you communication may be sent.

---

# 47. RECEPTION JOURNEY — COMPLETE SCENARIO

Reception opens dashboard.

Sees:

```text
ARRIVALS: 6
DEPARTURES: 4
IN-HOUSE: 27
PENDING REQUESTS: 8
```

Reception processes arrivals.

For each arrival:

```text
Search → Verify → Assign → Check-In → Activate Guest Access
```

During the day:

```text
Request arrives
↓
Reception acknowledges
↓
Routes request
↓
Monitors
↓
Closes request
```

For departures:

```text
Departure → Balance Check → Checkout → Room Dirty → Follow-up
```

The reception dashboard is therefore an **operational command center**, not merely a booking list.

---

# 48. GUEST APP SCREEN MAP

## Authentication / Activation

- Welcome.
- Enter Access Code.
- Verification.
- Session established.

## Main

- Home.
- My Stay.
- My Room.

## Services

- Services.
- Service Details.
- Create Request.
- My Requests.
- Request Details.

## Communication

- Reception.
- Conversation.
- Notifications.

## Stay Management

- Extension.
- Room Change.
- Checkout Request.

## Billing

- Current Bill.
- Charges.
- Payments.
- Invoice.

## Hotel

- Hotel Info.
- Amenities.
- Policies.
- Contact.

## Feedback

- Rate Service.
- Submit Feedback.

---

# 49. RECEPTION SCREEN MAP

- Login.
- Dashboard.
- Reservations.
- Reservation Details.
- Calendar/Availability.
- Arrivals.
- Departures.
- In-House.
- Guests.
- Guest Details.
- Rooms.
- Room Details.
- Check-In.
- Check-Out.
- Room Transfer.
- Guest Requests.
- Request Details.
- Conversations.
- Billing.
- Payments.
- Invoices.
- Notifications.
- Audit Log (permission controlled).
- Settings (permission controlled).

---

# 50. ADMIN SCREEN MAP

- Admin Dashboard.
- Hotel Settings.
- Room Types.
- Rooms.
- Amenities.
- Rates.
- Services.
- Service Categories.
- Booking Rules.
- Users.
- Roles.
- Permissions.
- Reservations.
- Guests.
- Reports.
- Audit Log.
- Notification Settings.
- Integration Settings.

---

# 51. REPORTING

Core reports:

### Occupancy
- Current occupancy.
- Daily occupancy.
- Room status.

### Reservations
- Upcoming.
- Confirmed.
- Cancelled.
- No-show.

### Guests
- In-house.
- Arrivals.
- Departures.

### Requests
- By category.
- By status.
- By response time.
- By room.

### Revenue / Billing
- Charges.
- Payments.
- Outstanding balances.
- Invoices.

### Operations
- Room turnover.
- Request completion.
- Room status changes.

Reports must derive from transactional data rather than manually entered totals.

---

# 52. ERROR HANDLING

Every layer must have predictable error handling.

Example categories:

```text
VALIDATION_ERROR
AUTHENTICATION_ERROR
AUTHORIZATION_ERROR
NOT_FOUND
CONFLICT
AVAILABILITY_CONFLICT
PAYMENT_ERROR
INTEGRATION_ERROR
FILE_ERROR
RATE_LIMITED
INTERNAL_ERROR
```

User-facing errors should be understandable.

Developer logs should contain diagnostic information without exposing secrets.

---

# 53. LOGGING

Logging should capture:

- Request IDs.
- User IDs where appropriate.
- Business operation.
- Outcome.
- Error class.
- Relevant entity ID.
- Timing.

Never log:

- Passwords.
- Access tokens.
- Secret keys.
- Sensitive payment credentials.
- Raw personal information beyond operational need.

---

# 54. BACKUP AND RECOVERY

Production systems must have:

- Automated backups.
- Defined retention.
- Restore procedure.
- Backup monitoring.
- Failure recovery procedure.

A backup is not considered successful merely because a file exists; restoreability must be tested.

---

# 55. OBSERVABILITY

Production deployment should monitor:

- Errors.
- API latency.
- Failed notifications.
- Booking failures.
- Payment failures.
- Database availability.
- Queue failures if queues are used.
- Background task failures.

---

# 56. ARCHITECTURE PRINCIPLES

The implementation must preserve separation between:

```text
Presentation
↓
Application / Use Cases
↓
Domain
↓
Infrastructure
↓
Database / External Services
```

A practical structure may use:

```text
features/
  auth/
  reservations/
  rooms/
  guests/
  stays/
  guest_requests/
  billing/
  notifications/
  reception/
  guest_app/

core/
  routing/
  networking/
  security/
  logging/
  errors/
  configuration/
  shared/
```

Exact folder structure may evolve, but domain boundaries must remain clear.

---

# 57. FLUTTER REQUIREMENT

Where Flutter is selected for the client applications:

- Use Flutter consistently.
- Keep business rules outside widgets.
- Use responsive layouts.
- Support Arabic RTL.
- Support localization.
- Support light/dark themes.
- Use reusable design components.
- Avoid duplicate business logic between screens.

The web and mobile experiences may have different layouts while sharing the same product rules and backend contracts.

---

# 58. RESPONSIVE DESIGN

The public website and operational dashboard should be usable on:

- Desktop.
- Tablet.
- Mobile where appropriate.

The guest experience must be optimized for mobile first.

Reception screens should prioritize:

- Speed.
- Visibility.
- Large touch targets.
- Quick filtering.
- Quick state changes.
- Minimal navigation depth.

---

# 59. ARABIC / RTL

Arabic is a first-class requirement.

Must support:

- RTL.
- Arabic numerals policy as configured.
- Arabic labels.
- Date formatting.
- Time formatting.
- Mixed Arabic/English text.
- Proper RTL forms.
- RTL tables/layouts.
- Localized validation messages.

The UI must not merely reverse layout; text alignment, icons, navigation, tables, dialogs, and form semantics must be tested.

---

# 60. TESTING STRATEGY

Testing must cover more than compilation.

## Unit Tests

For:

- Pricing.
- Availability.
- State transitions.
- Billing.
- Permissions.
- Code validation.
- Extension rules.

## Integration Tests

For:

- Reservation → Check-in.
- Check-in → Stay.
- Stay → Guest Access.
- Guest Request → Reception.
- Request → Completion.
- Charge → Payment.
- Checkout → Room release.

## End-to-End Tests

Complete journeys:

### Journey A
Website → Booking → Confirmation.

### Journey B
Reservation → Arrival → Check-in → Guest App.

### Journey C
Guest Request → Reception → Completion.

### Journey D
Extension → Approval → Updated Stay.

### Journey E
Checkout → Final Bill → Room Dirty → Availability.

## Security Tests

- Unauthorized access.
- Cross-guest access.
- Invalid codes.
- Rate limiting.
- Permission bypass.
- Token/session abuse.

---

# 61. ACCEPTANCE CRITERIA

The product is NOT considered core-complete until:

## Booking

- Guest can successfully search and book a room.
- Inventory is correctly reserved.
- Booking confirmation is generated.
- Booking is visible to reception.
- Duplicate inventory booking is prevented.

## Check-in

- Reception can find reservation.
- Reception can assign room.
- Check-in creates active stay.
- Room becomes occupied.
- Guest access can be activated.

## Guest App

- Guest can authenticate through approved activation.
- Guest can view only their stay.
- Guest can see room information.
- Guest can submit requests.
- Guest can track request status.

## Operations

- Reception receives requests.
- Requests have lifecycle states.
- Requests can be assigned/managed.
- Completion notifies guest.

## Extension

- Guest can request extension.
- System checks availability.
- Reception can approve/reject.
- Approved extension updates dates and charges.

## Billing

- Charges are recorded.
- Payments are recorded.
- Balance is derived correctly.
- Checkout handles outstanding balance according to policy.
- Final invoice is available.

## Checkout

- Stay closes.
- Guest access state is handled correctly.
- Room becomes dirty/needs turnover.
- Room can later return to available state.

## Audit

- Sensitive changes create audit records.

---

# 62. MUST / SHOULD / MUST NOT

## MUST

- Maintain one source of truth.
- Separate Reservation and Stay.
- Protect guest data.
- Validate availability transactionally.
- Use formal request workflows.
- Use transaction-based billing.
- Audit sensitive actions.
- Support Arabic RTL.
- Handle errors gracefully.
- Test complete business journeys.
- Keep provider integrations behind service abstractions.

## SHOULD

- Use event-driven internal notifications.
- Maintain historical state changes.
- Use configurable services.
- Use a shared design system.
- Use feature/domain boundaries.
- Support PDF confirmation/invoices.
- Support multiple communication providers through abstractions.

## MUST NOT

- Build each screen as an isolated feature.
- Store only a mutable total for billing.
- Let guests select arbitrary room/stay IDs as authority.
- Treat WhatsApp as the primary data source.
- Put business logic directly in UI widgets.
- Mark a request complete without history.
- Change room assignment without recording transfer history.
- Overwrite important historical values without audit/history.
- Add large future modules before core workflows are stable.
- Declare production-ready merely because the app compiles.

---

# 63. PHASED IMPLEMENTATION

## PHASE 1 — FOUNDATION

Build:

- Project structure.
- Environment configuration.
- Authentication foundations.
- Database foundations.
- Logging.
- Error handling.
- Navigation.
- Localization / RTL.
- Theme.
- Core UI system.

Deliverable:

Stable foundation with no domain duplication.

---

## PHASE 2 — HOTEL MASTER DATA

Build:

- Hotel configuration.
- Room types.
- Rooms.
- Amenities.
- Services.
- Basic rates.

Deliverable:

Hotel can model its physical inventory and service catalog.

---

## PHASE 3 — RESERVATIONS / BOOKING

Build:

- Public website.
- Availability.
- Booking flow.
- Reservation model.
- Confirmation.
- Booking file/PDF.
- Reservation states.
- Booking search.

Deliverable:

A real guest can complete a booking.

---

## PHASE 4 — RECEPTION / PMS CORE

Build:

- Reception dashboard.
- Arrivals.
- Departures.
- Reservations.
- Guests.
- Rooms.
- Check-in.
- Stay creation.
- Room assignment.
- Room states.

Deliverable:

Reception can operate arriving guests.

---

## PHASE 5 — GUEST APP

Build:

- Guest activation.
- Stay view.
- Room view.
- Notifications.
- Guest profile context.

Deliverable:

Checked-in guest can access their current stay.

---

## PHASE 6 — GUEST SERVICES

Build:

- Service catalog.
- Request creation.
- Request lifecycle.
- Reception request center.
- Assignment.
- Completion.
- Guest updates.

Deliverable:

Guest requests become operational work items.

---

## PHASE 7 — COMMUNICATION

Build:

- Guest-reception conversation.
- Notification engine.
- WhatsApp integration.
- Booking confirmation messaging.
- Pre-arrival messaging.

Deliverable:

Communication follows system events.

---

## PHASE 8 — BILLING

Build:

- Charges.
- Payments.
- Balance.
- Invoice.
- Service charging.
- Checkout billing.

Deliverable:

The active stay has coherent financial tracking.

---

## PHASE 9 — EXTENSION / ROOM TRANSFER / CHECKOUT

Build:

- Extension.
- Room transfer.
- Checkout requests.
- Final checkout.
- Room turnover.

Deliverable:

The complete stay lifecycle is operational.

---

## PHASE 10 — REPORTING / HARDENING

Build:

- Reports.
- Audit log UI.
- Security hardening.
- Backup.
- Observability.
- Performance.
- Full end-to-end testing.

Deliverable:

Production readiness.

---

# 64. DEPENDENCY ORDER

Implementation should follow this dependency order:

```text
Foundation
    ↓
Hotel Master Data
    ↓
Room Inventory
    ↓
Reservations
    ↓
Reception
    ↓
Stay
    ↓
Guest Access
    ↓
Guest App
    ↓
Guest Requests
    ↓
Notifications
    ↓
Billing
    ↓
Extension / Transfer
    ↓
Checkout
    ↓
Reporting
    ↓
Hardening
```

Do not implement dependent features before their domain dependencies exist.

---

# 65. BUILD RULES FOR AI CODING AGENTS

If this PLAN.md is given to an AI coding agent:

### RULE 1
Read the entire PLAN.md before changing code.

### RULE 2
Do not rewrite unrelated modules.

### RULE 3
Do not invent a different business model.

### RULE 4
Do not collapse Reservation and Stay.

### RULE 5
Do not create fake implementations where a real integration is required.

### RULE 6
Do not declare a feature complete if only the UI exists.

### RULE 7
For every feature, implement:

```text
UI
+
Use Case
+
Validation
+
Persistence
+
Authorization
+
Error Handling
+
Tests
```

when applicable.

### RULE 8
When changing a domain model, inspect all dependent use cases and screens.

### RULE 9
Preserve data integrity.

### RULE 10
Do not create duplicate sources of truth.

### RULE 11
Do not silently change business rules.

### RULE 12
Before marking a phase complete, run relevant tests and verify the full user workflow.

---

# 66. PRODUCTION READINESS CHECKLIST

Before production:

## Product
- All core journeys work.
- No critical dead ends.
- Guest experience is understandable.

## Data
- No duplicate reservations.
- No broken stay links.
- Billing reconciles.
- Room states reconcile.

## Security
- Permissions tested.
- Guest isolation tested.
- Session handling tested.
- Secrets secured.

## Reliability
- Backups configured.
- Restore tested.
- Error monitoring configured.
- Failed notifications visible.

## Operations
- Reception can process arrivals.
- Reception can process requests.
- Reception can process departures.
- Admin can recover from common mistakes.

## Communication
- WhatsApp messaging tested.
- Notification failures do not break core booking flow.
- Retries/idempotency considered.

## Mobile
- Guest app tested on real devices.
- Network loss handled gracefully.

## Web
- Booking flow tested on desktop/mobile.
- Responsive UI verified.
- RTL verified.

---

# 67. FUTURE MODULES

After the core platform is stable, possible additions include:

```text
Restaurant POS
Laundry
Spa
Minibar
Room Service
Housekeeping App
Maintenance App
Advanced Accounting
Corporate Accounts
Loyalty
OTA / Channel Manager
Booking.com
Expedia
Travel Agencies
Multiple Properties
Advanced CRM
Revenue Management
AI Concierge
Digital Room Key
Online Check-in
Payment Gateways
```

These must be added as isolated modules integrated through stable domain contracts.

---

# 68. FINAL SYSTEM MAP

```text
                         PUBLIC INTERNET
                               │
                               ▼
                   ┌───────────────────────┐
                   │    HOTEL WEBSITE      │
                   │ Rooms / Info / Booking│
                   └───────────┬───────────┘
                               │
                               ▼
                   ┌───────────────────────┐
                   │    BOOKING ENGINE     │
                   └───────────┬───────────┘
                               │
                         Reservation
                               │
                               ▼
             ┌──────────────────────────────────┐
             │         HOTEL CORE / PMS          │
             │                                  │
             │ Guests                           │
             │ Reservations                     │
             │ Stays                            │
             │ Rooms                            │
             │ Billing                          │
             │ Requests                         │
             │ Notifications                    │
             │ Audit                            │
             └───────┬──────────────┬───────────┘
                     │              │
                     │              │
                     ▼              ▼
             ┌──────────────┐  ┌───────────────┐
             │  RECEPTION   │  │   WHATSAPP    │
             │ Operations   │  │ Communication │
             └──────┬───────┘  └───────────────┘
                    │
                    │
                    ▼
            ┌────────────────┐
            │ GUEST REQUESTS │
            │ Cleaning       │
            │ Maintenance    │
            │ Services       │
            └────────┬───────┘
                     │
                     ▼
              Operational Work
                     │
                     ▼
             Completion / Charge
                     │
                     ▼
                Guest Notify

                     ▲
                     │
             ┌───────┴────────┐
             │   GUEST APP    │
             │                │
             │ Current Stay   │
             │ Room           │
             │ Services       │
             │ Requests       │
             │ Reception      │
             │ Extension     │
             │ Billing        │
             │ Checkout       │
             └────────────────┘
```

---

# 69. THE NON-NEGOTIABLE BUSINESS STORY

The following story must remain valid throughout development:

> A guest discovers the hotel on the public website, reviews available rooms and books without friction. The reservation is stored centrally and a confirmation is generated and communicated through the configured channels, including WhatsApp where enabled.
>
> When the guest arrives, reception finds the reservation, verifies the guest, completes check-in, assigns the room, creates the active stay, and activates the guest's secure access to the hotel application.
>
> The guest opens the application and is automatically connected to the correct hotel, guest identity, current stay, and current room. The guest can request housekeeping, supplies, maintenance, other services, or contact reception. Each action creates a real operational record connected to the guest's stay and room.
>
> Reception receives the request, acknowledges it, assigns or handles it, updates progress, and closes it when completed. The guest is notified of relevant status changes.
>
> During the stay, the guest can view their stay, request an extension, request a room change, communicate with reception, and view applicable charges and payments. Any change must update the correct business entities and preserve historical traceability.
>
> When the stay ends, the system calculates the final outstanding amount from charges and payments, reception or the approved workflow completes checkout, the stay is closed, guest access is handled according to policy, and the room enters the turnover cycle before becoming available again.
>
> Every important operation remains auditable.

This story is the **product's canonical end-to-end workflow**.

---

# 70. DEFINITION OF DONE

A phase is complete only when:

1. The database/domain model exists.
2. Business rules are implemented.
3. Authorization exists.
4. UI is implemented.
5. Error handling exists.
6. Persistence is connected.
7. Notifications are connected where applicable.
8. Audit/history exists where required.
9. Tests cover important paths.
10. The real workflow has been executed successfully.
11. No known critical integrity issue remains.
12. The implementation still matches this PLAN.md.

---

# 71. FINAL PRINCIPLE

The project must always be treated as:

```text
ONE HOTEL SYSTEM
```

not:

```text
Website + Separate Booking App + Separate Reception App + Separate Guest App
```

The interfaces may be different, but the business reality is one.

The central chain is:

```text
Guest
 ↓
Reservation
 ↓
Stay
 ↓
Room
 ↓
Requests
 ↓
Charges
 ↓
Payments
 ↓
Checkout
```

Every user interface must respect that chain.

Every future module must integrate into that chain.

Every major operation must leave a trace.

And every release must preserve the complete guest journey from:

**"I found your hotel"**

to:

**"I completed my stay."**
