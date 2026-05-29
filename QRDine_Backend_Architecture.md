# QRDine — Backend Architecture & Systems Design
*Internal Technical Reference for SaaS/POS/PWA Platform*

---

## 1. Core Architecture Philosophy

QRDine follows a **serverless-first, event-driven architecture** built entirely on Firebase infrastructure. The system is designed around three fundamental principles:

- **Real-time by default** — every order, status change, and table update propagates to all connected clients within 2 seconds without polling
- **Multi-tenant isolation** — every restaurant's data is completely isolated at the Firestore security rules level, not just by convention
- **Offline resilience** — the customer ordering interface must continue functioning during intermittent Indian mobile network conditions

---

## 2. System Overview

```
Customer Phone (Browser PWA)
        │
        │  HTTPS — Public Route
        ▼
┌─────────────────────────────────────────────────────┐
│              Firebase Hosting (CDN)                 │
│         React PWA — Static Asset Delivery           │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────────┐
│  Firestore DB    │     │   Firebase Auth           │
│  (Real-time)     │     │   (Business License ID)   │
└────────┬─────────┘     └──────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│             Firebase Cloud Functions                 │
│                                                      │
│   onOrderCreated → WhatsApp Alert (Twilio)           │
│   onOrderCreated → KDS Push Notification             │
│   scheduledDailyReport → WhatsApp Summary            │
│   onBillGenerated → Bill Record + GST Calculation    │
│   onDishStockUpdate → Auto-hide Zero Stock Items     │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│              imgdd Storage                        │
│   Dish Photos / Restaurant Logos / Bill PDFs         │
└──────────────────────────────────────────────────────┘
```

---

## 3. Authentication Layer

### Business License Based Auth

Standard email/password auth is replaced with a **business license number as the primary identifier**. This ties every account to a verifiable real-world business entity and prevents throwaway signups.

**Signup Flow:**
1. Owner submits: business license number, full name, restaurant name, phone number, password
2. System checks Firestore `registrations` collection — if license number already exists, reject with duplicate error
3. Firebase Auth creates user with a generated internal email format: `{licenseNumber}@qrdine.internal`
4. Owner profile document written to Firestore under `/restaurants/{uid}`
5. Phone number stored for WhatsApp alert delivery and OTP-based password reset

**Login Flow:**
1. Owner enters business license number and password
2. Backend resolves license number to internal email via Firestore lookup
3. Firebase Auth `signInWithEmailAndPassword` called with resolved credentials
4. On success, JWT token issued — valid for 1 hour, auto-refreshed by Firebase SDK

**Password Reset Flow:**
1. Owner enters registered phone number
2. Firebase Function triggers OTP delivery via Twilio SMS or WhatsApp
3. OTP verified server-side in Firebase Function — not client-side
4. On success, Firebase Auth `generatePasswordResetLink` issued and owner sets new password

### Firestore Security Rules — Auth Enforcement

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Restaurant owner can only read and write their own restaurant
    match /restaurants/{restaurantId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == restaurantId;
    }

    // Customer ordering interface — public read on menu and tables only
    match /restaurants/{restaurantId}/menu/{itemId} {
      allow read: if true;
    }

    // Orders — customer can create, owner can read and update
    match /restaurants/{restaurantId}/orders/{orderId} {
      allow create: if true;
      allow read, update: if request.auth != null
                          && request.auth.uid == restaurantId;
    }
  }
}
```

---

## 4. Database Architecture (Firestore)

### Collection Structure

```
/restaurants/{restaurantId}
    ├── name                  (string)
    ├── logo                  (string — Storage URL)
    ├── address               (string)
    ├── phone                 (string — +91 format)
    ├── licenseNumber         (string — unique index)
    ├── gstNumber             (string — optional)
    ├── gstRate               (number — 5 or 18)
    ├── language              (string — en / hi / gu)
    ├── ownerId               (string — Firebase Auth UID)
    ├── plan                  (string — basic / pro / premium)
    ├── planExpiry            (timestamp)
    └── createdAt             (timestamp)

/restaurants/{restaurantId}/menu/{itemId}
    ├── name                  (string)
    ├── price                 (number — in Rs.)
    ├── category              (string)
    ├── photoUrl              (string — Storage URL)
    ├── available             (boolean)
    ├── stockLimit            (number — null if unlimited)
    ├── currentStock          (number — null if unlimited)
    └── sortOrder             (number — for drag reorder)

/restaurants/{restaurantId}/tables/{tableId}
    ├── tableNumber           (string — Table 1, Table 2 etc.)
    ├── qrCodeUrl             (string — Storage URL of QR PNG)
    ├── status                (string — free / occupied / bill-requested)
    └── lastUpdated           (timestamp)

/restaurants/{restaurantId}/orders/{orderId}
    ├── tableId               (string)
    ├── tableNumber           (string)
    ├── items                 (array)
    │     ├── itemId          (string)
    │     ├── name            (string)
    │     ├── price           (number)
    │     ├── quantity        (number)
    │     └── modifiers       (string — free text note)
    ├── subtotal              (number)
    ├── gstAmount             (number)
    ├── totalAmount           (number)
    ├── discount              (number — flat amount)
    ├── status                (string — pending / preparing / done / billed)
    ├── feedbackRating        (string — happy / sad / null)
    ├── feedbackComment       (string — optional)
    └── createdAt             (timestamp)

/restaurants/{restaurantId}/bills/{billId}
    ├── tableId               (string)
    ├── tableNumber           (string)
    ├── orderId               (string)
    ├── items                 (array — snapshot of ordered items)
    ├── subtotal              (number)
    ├── gstRate               (number)
    ├── gstAmount             (number)
    ├── discount              (number)
    ├── grandTotal            (number)
    ├── pdfUrl                (string — Storage URL of generated bill PDF)
    └── createdAt             (timestamp)

/restaurants/{restaurantId}/analytics/{dateId}
    ├── date                  (string — YYYY-MM-DD)
    ├── totalOrders           (number)
    ├── totalRevenue          (number)
    ├── topDishes             (array of itemId + count)
    └── hourlyBreakdown       (map — hour: orderCount)
```

---

## 5. Cloud Functions Architecture

All server-side business logic runs as **Firebase Cloud Functions**. No separate Node.js or Express server needed. Functions are triggered by Firestore document events or HTTP calls.

### Function: onOrderCreated

```
Trigger:    Firestore onCreate — /restaurants/{restaurantId}/orders/{orderId}
Purpose:    Notify owner, update table status, update analytics

Steps:
1. Read new order document
2. Fetch restaurant document to get owner phone number and plan type
3. If plan is Pro or Premium — fire Twilio WhatsApp alert to owner phone
4. Update table status in /tables/{tableId} → status: occupied
5. Increment today's analytics document — totalOrders +1, totalRevenue + order amount
6. Update hourlyBreakdown map for current hour
7. Update topDishes map with ordered item IDs
```

### Function: onOrderStatusUpdated

```
Trigger:    Firestore onUpdate — /restaurants/{restaurantId}/orders/{orderId}
Purpose:    Handle status transitions cleanly

Steps:
1. Compare previous status vs new status
2. If status changed to done — check if all table orders are done, if yes update table to free
3. If status changed to billed — trigger bill generation function
```

### Function: generateBill (HTTP Callable)

```
Trigger:    HTTPS Callable Function — called from owner dashboard
Purpose:    Generate itemised bill with GST, discount, and save PDF

Steps:
1. Receive restaurantId, tableId, orderId, discountAmount from client
2. Fetch order document and restaurant GST settings
3. Calculate: subtotal, GST amount, apply discount, grand total
4. Generate bill PDF using pdfkit (Node.js library)
5. Upload PDF to Firebase Storage under /bills/{billId}.pdf
6. Write bill document to /restaurants/{restaurantId}/bills/{billId}
7. Update order status to billed
8. Return bill PDF download URL to client
9. If customer phone number available — send bill summary via Twilio WhatsApp
```

### Function: scheduledDailyReport

```
Trigger:    Firebase Scheduled Function — runs every day at 10:00 PM IST
Purpose:    Send daily summary to every active Pro and Premium restaurant owner

Steps:
1. Query all restaurants where plan is pro or premium
2. For each restaurant fetch today's analytics document
3. Compose WhatsApp message:
   "QRDine Daily Report for [Restaurant Name]
    Date: [today]
    Total Orders: [X]
    Total Revenue: Rs.[X]
    Top Dish: [dish name] ordered [X] times
    Busiest Hour: [X]:00"
4. Send via Twilio WhatsApp API to owner phone
```

### Function: onStockUpdated

```
Trigger:    Firestore onUpdate — /restaurants/{restaurantId}/menu/{itemId}
Purpose:    Auto-manage dish availability based on stock

Steps:
1. Check if currentStock field was updated
2. If currentStock equals 0 — set available to false
3. If currentStock was 0 and now above 0 — set available back to true
```

---

## 6. Real-Time Order Flow

The most critical path in the entire system. Must be reliable, fast, and work under Indian mobile network conditions.

```
Customer confirms order on browser PWA
        │
        ▼
Firestore addDoc() called from customer browser
        │
        ▼
New order document created in:
/restaurants/{restaurantId}/orders/{orderId}
        │
        ├──────────────────────────────────┐
        │                                  │
        ▼                                  ▼
onSnapshot listener fires          Cloud Function triggers
on owner dashboard                 WhatsApp alert to owner
        │
        ▼
Order appears on dashboard
in under 2 seconds
        │
        ▼
Kitchen Display page also
listening on same collection
updates simultaneously
```

### Owner Dashboard Listener Setup

```javascript
// Attach once on dashboard load
const unsubscribe = onSnapshot(
  query(
    collection(db, `restaurants/${restaurantId}/orders`),
    where("status", "in", ["pending", "preparing"]),
    orderBy("createdAt", "desc")
  ),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        // New order arrived — play notification sound, show toast
        addOrderToUI(change.doc.data());
      }
      if (change.type === "modified") {
        // Status updated — refresh that order card
        updateOrderInUI(change.doc.id, change.doc.data());
      }
    });
  }
);
```

---

## 7. QR Code Generation & Management

Each table gets a unique permanent URL. The QR code encodes this URL and is generated once at setup time.

**URL Structure:**
```
https://qrdine.app/order/{restaurantId}/{tableId}
```

**Generation Flow:**
1. Owner enters number of tables during onboarding
2. For each table — Firestore document created under `/tables/{tableId}`
3. QR code generated client-side using `qrcode.js` library — no server round trip needed
4. QR PNG uploaded to Firebase Storage under `/qrcodes/{restaurantId}/{tableId}.png`
5. Storage URL written back to table document as `qrCodeUrl`
6. Owner downloads individual PNGs or full ZIP using JSZip library

**QR Code Specs for Thermal Printing:**
```
Size:        500 x 500 px minimum
Error Correction: Level H (30% damage tolerance)
Format:      PNG with white border padding
Include:     Table number text below QR image
Print Size:  Minimum 4cm x 4cm physical size
```

---

## 8. Bill Generation Architecture

### Calculation Logic

```
Subtotal    = sum of (item.price × item.quantity) for all items
GST Amount  = Subtotal × (gstRate / 100)
             where gstRate is set by owner in settings (5% or 18%)
Discount    = flat amount entered by owner before finalising (default 0)
Grand Total = Subtotal + GST Amount - Discount
```

### Bill PDF Structure (pdfkit — Node.js)

```
┌─────────────────────────────────┐
│      [Restaurant Logo]          │
│      Restaurant Name            │
│      Address                    │
│      GST No: XXXXXXXX           │
├─────────────────────────────────┤
│  Table: 4    Date: 23 May 2026  │
│  Bill No: #1042   Time: 8:32 PM │
├──────────────┬──────┬───────────┤
│ Item         │ Qty  │ Amount    │
├──────────────┼──────┼───────────┤
│ Paneer Tikka │  2   │ Rs. 480   │
│ Dal Makhani  │  1   │ Rs. 220   │
│ Butter Naan  │  3   │ Rs. 150   │
├──────────────┴──────┼───────────┤
│            Subtotal │ Rs. 850   │
│         GST (5%)    │ Rs.  42   │
│         Discount    │ Rs.  50   │
│         Grand Total │ Rs. 842   │
└─────────────────────┴───────────┘
│   Thank you for visiting us!    │
│   Powered by QRDine             │
└─────────────────────────────────┘
```

---

## 9. WhatsApp Notification System (Twilio)

All WhatsApp messages are sent via **Twilio WhatsApp Business API** from inside Firebase Cloud Functions. Never called directly from client-side code.

**Message Templates:**

New Order Alert:
```
🍽️ New Order — QRDine
Table: [tableNumber]
[item name] x[qty] — Rs.[price]
[item name] x[qty] — Rs.[price]
─────────────────
Total: Rs.[totalAmount]
```

Daily Report:
```
📊 QRDine Daily Report
[Restaurant Name] — [Date]

Orders Today: [X]
Revenue Today: Rs.[X]
Top Dish: [name] ([X] orders)
Busiest Hour: [X]:00 – [X+1]:00
```

Bill on WhatsApp:
```
🧾 Bill — [Restaurant Name]
Table [X] | [Date] [Time]

[item] x[qty] — Rs.[X]
[item] x[qty] — Rs.[X]

Subtotal: Rs.[X]
GST ([X]%): Rs.[X]
Discount: Rs.[X]
Total: Rs.[X]

Thank you!
```

---

## 10. Firebase Storage Structure

```
/logos/{restaurantId}/logo.jpg
/dishes/{restaurantId}/{itemId}.jpg
/qrcodes/{restaurantId}/{tableId}.png
/bills/{restaurantId}/{billId}.pdf
```

**Image Compression Rules:**
- All dish photos compressed to max 800x800px and 200KB before upload
- Compression handled client-side using `browser-image-compression` npm package
- Reduces Firebase Storage costs and improves menu load speed on slow connections

---

## 11. Offline Resilience Strategy

Critical for Indian mobile network conditions where 4G drops mid-session.

**Firestore Offline Persistence:**
```javascript
// Enable on app init — Firestore caches recent reads locally
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open — offline mode unavailable
  }
});
```

**Order Queue for Offline Scenarios:**
- If customer submits order and network is unavailable, order is written to Firestore local cache
- Firestore SDK automatically syncs to server when connection restores
- Customer sees a "Order submitted — syncing" message instead of error
- Owner dashboard receives order as soon as sync completes

---

## 12. Multi-Tenant Data Isolation

Every restaurant is completely isolated. No shared collections exist between restaurants.

**Isolation enforced at three levels:**

1. **Firestore Security Rules** — Auth UID must match restaurantId on every read/write
2. **Cloud Functions** — All functions validate restaurantId from Auth context, never from client-provided parameters
3. **Client SDK** — All Firestore queries scoped under `/restaurants/{restaurantId}/` path only

This means even a compromised client cannot access another restaurant's orders, menu, or revenue data.

---

## 13. Subscription and Plan Gating

Feature access is gated by the `plan` field on the restaurant document.

```
Basic  (Rs. 299/mo) — menu, QR codes, orders dashboard, waiter call
Pro    (Rs. 499/mo) — Basic + WhatsApp alerts, KDS, floor map, inventory
Premium(Rs. 799/mo) — Pro + multilingual, daily reports, feedback, modifiers
```

**Enforcement in Cloud Functions:**
```javascript
// Inside onOrderCreated function
const restaurant = await getDoc(doc(db, 'restaurants', restaurantId));
const plan = restaurant.data().plan;

if (plan === 'pro' || plan === 'premium') {
  await sendWhatsAppAlert(restaurant.data().phone, orderData);
}

if (plan === 'premium') {
  await triggerDailyReportFlag(restaurantId);
}
```

Plan expiry is checked daily via a scheduled function. Expired plans are downgraded to Basic automatically.

---

## 14. Folder Structure

```
/functions
  ├── index.js                  — exports all functions
  ├── onOrderCreated.js
  ├── onOrderStatusUpdated.js
  ├── generateBill.js
  ├── scheduledDailyReport.js
  ├── onStockUpdated.js
  ├── /utils
  │     ├── twilioClient.js     — Twilio WhatsApp helper
  │     ├── billGenerator.js    — pdfkit bill builder
  │     ├── gstCalculator.js    — GST and discount logic
  │     └── analyticsUpdater.js — daily stats writer

/firestore.rules                — all security rules
/storage.rules                  — storage access rules

/src (Frontend)
  ├── /firebase
  │     ├── config.js
  │     ├── auth.js
  │     └── firestore.js
  ├── /hooks
  │     ├── useOrders.js        — real-time order listener
  │     ├── useMenu.js
  │     ├── useTables.js
  │     └── useRestaurant.js
  └── /utils
        ├── qrGenerator.js
        ├── imageCompressor.js
        └── formatCurrency.js   — always formats as Rs.XX
```

---

## 15. Environment Variables

Never hardcode secrets. All sensitive keys stored in Firebase Functions config.

```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER
RAZORPAY_KEY_ID          (V2)
RAZORPAY_KEY_SECRET      (V2)
```

Set via:
```bash
firebase functions:config:set twilio.account_sid="XXXX"
firebase functions:config:set twilio.auth_token="XXXX"
firebase functions:config:set twilio.whatsapp_number="whatsapp:+14155238886"
```

---

*QRDine Backend Architecture — Internal Reference — Jenil Patel — 2026*
