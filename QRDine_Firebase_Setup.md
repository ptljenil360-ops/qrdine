# QRDine — Firebase Setup & Function Contracts
*Complete Firebase initialisation, security rules, and API contracts for Anti Gravity. Use @backend-architect @senior-fullstack @clean-code skills throughout.*

---

## 1. Firebase Project Setup

### Services to Enable in Firebase Console
```
✅ Authentication        — Email/Password provider
✅ Firestore Database    — Native mode, region: asia-south1 (Mumbai)
✅ Firebase Storage      — Default bucket
✅ Cloud Functions       — Node.js 18 runtime
✅ Firebase Hosting      — For PWA deployment
```

### .env.example
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Cloud Functions config (set via firebase functions:config:set)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### firebase.js — Client Initialisation
```javascript
import { initializeApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

// Enable offline persistence for customer ordering interface
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('Offline persistence unavailable:', err.code)
})
```

---

## 2. Firestore Security Rules

*Save as firestore.rules in project root*

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── License Registry (public read for login lookup) ──
    match /licenseRegistry/{licenseNumber} {
      allow read: if true;
      allow write: if false; // Written only by Cloud Function on signup
    }

    // ── Restaurant document and all sub-collections ──
    match /restaurants/{restaurantId} {

      // Owner can read and write their own restaurant doc
      allow read, write: if request.auth != null
                         && request.auth.uid == restaurantId;

      // ── Menu — public read, owner write ──
      match /menu/{itemId} {
        allow read: if true;
        allow write: if request.auth != null
                     && request.auth.uid == restaurantId;
      }

      // ── Tables — public read (for QR scan), owner write ──
      match /tables/{tableId} {
        allow read: if true;
        allow write: if request.auth != null
                     && request.auth.uid == restaurantId;
      }

      // ── Orders — customer can create, owner can read/update ──
      match /orders/{orderId} {
        allow create: if true;
        allow read, update: if request.auth != null
                            && request.auth.uid == restaurantId;
        allow delete: if false;
      }

      // ── Bills — owner only ──
      match /bills/{billId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == restaurantId;
      }

      // ── Analytics — owner only ──
      match /analytics/{dateId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == restaurantId;
      }
    }
  }
}
```

---

## 3. Firebase Storage Rules

*Save as storage.rules in project root*

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Restaurant logos — owner write, public read
    match /logos/{restaurantId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == restaurantId
                   && request.resource.size < 2 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Dish photos — owner write, public read
    match /dishes/{restaurantId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == restaurantId
                   && request.resource.size < 2 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // QR codes — owner write, public read
    match /qrcodes/{restaurantId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == restaurantId;
    }

    // Bill PDFs — owner only
    match /bills/{restaurantId}/{fileName} {
      allow read, write: if request.auth != null
                         && request.auth.uid == restaurantId;
    }
  }
}
```

---

## 4. Auth Flow — Business License Implementation

Since Firebase Auth does not natively support license number login, we use a lookup pattern.

### Signup — Client Side
```javascript
// auth.js
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export async function signupWithLicense({
  licenseNumber,
  fullName,
  restaurantName,
  phone,
  password
}) {
  // Step 1 — check license not already registered
  const licenseRef = doc(db, 'licenseRegistry', licenseNumber)
  const licenseSnap = await getDoc(licenseRef)
  if (licenseSnap.exists()) {
    throw new Error('LICENSE_ALREADY_REGISTERED')
  }

  // Step 2 — create Firebase Auth user with internal email
  const internalEmail = `${licenseNumber.toLowerCase()}@qrdine.internal`
  const userCredential = await createUserWithEmailAndPassword(
    auth, internalEmail, password
  )
  const uid = userCredential.user.uid

  // Step 3 — write restaurant document
  await setDoc(doc(db, 'restaurants', uid), {
    name: restaurantName,
    ownerName: fullName,
    phone: phone,
    licenseNumber: licenseNumber,
    address: '',
    logo: '',
    gstNumber: '',
    gstRate: 5,
    language: 'en',
    plan: 'trial',
    planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ownerId: uid,
    createdAt: new Date()
  })

  // Step 4 — write license registry entry
  await setDoc(licenseRef, { uid: uid })

  return userCredential
}
```

### Login — Client Side
```javascript
export async function loginWithLicense({ licenseNumber, password }) {
  // Step 1 — resolve license to uid
  const licenseRef = doc(db, 'licenseRegistry', licenseNumber)
  const licenseSnap = await getDoc(licenseRef)
  if (!licenseSnap.exists()) {
    throw new Error('LICENSE_NOT_FOUND')
  }

  // Step 2 — sign in with internal email
  const internalEmail = `${licenseNumber.toLowerCase()}@qrdine.internal`
  const userCredential = await signInWithEmailAndPassword(
    auth, internalEmail, password
  )
  return userCredential
}
```

### Error Code Map — show these messages to user
```javascript
const AUTH_ERRORS = {
  'LICENSE_ALREADY_REGISTERED': 'This license number is already registered.',
  'LICENSE_NOT_FOUND': 'License number not found. Please check and try again.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/too-many-requests': 'Too many attempts. Please try again after some time.',
  'auth/network-request-failed': 'No internet connection. Please check your network.'
}
```

---

## 5. Cloud Functions — Complete Contracts

*All functions in /functions/index.js. Deploy with: firebase deploy --only functions*

---

### Function 1 — onOrderCreated

```javascript
// Trigger: Firestore onCreate on /restaurants/{restaurantId}/orders/{orderId}
// Input: New order document (auto-provided by trigger)
// Side effects:
//   - Sends WhatsApp alert if plan is pro or premium
//   - Updates table status to occupied
//   - Increments analytics for today

exports.onOrderCreated = functions
  .region('asia-south1')
  .firestore
  .document('restaurants/{restaurantId}/orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data()
    const { restaurantId } = context.params

    // Get restaurant
    const restaurantSnap = await admin.firestore()
      .doc(`restaurants/${restaurantId}`).get()
    const restaurant = restaurantSnap.data()

    // Update table status
    await admin.firestore()
      .doc(`restaurants/${restaurantId}/tables/${order.tableId}`)
      .update({ status: 'occupied', lastUpdated: admin.firestore.FieldValue.serverTimestamp() })

    // Update analytics
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const hour = new Date().getHours().toString()
    const analyticsRef = admin.firestore()
      .doc(`restaurants/${restaurantId}/analytics/${today}`)

    await analyticsRef.set({
      date: today,
      totalOrders: admin.firestore.FieldValue.increment(1),
      totalRevenue: admin.firestore.FieldValue.increment(order.totalAmount),
      [`hourlyBreakdown.${hour}`]: admin.firestore.FieldValue.increment(1)
    }, { merge: true })

    // Update top dishes
    for (const item of order.items) {
      await analyticsRef.set({
        [`topDishes.${item.itemId}`]: admin.firestore.FieldValue.increment(item.quantity)
      }, { merge: true })
    }

    // WhatsApp alert — Pro and Premium only
    if (restaurant.plan === 'pro' || restaurant.plan === 'premium') {
      const itemSummary = order.items
        .map(i => `${i.name} x${i.quantity}`)
        .join(', ')
      await sendWhatsApp(
        restaurant.phone,
        `🍽️ New Order — QRDine\nTable: ${order.tableNumber}\n${itemSummary}\n─────────────\nTotal: Rs.${order.totalAmount}`
      )
    }
  })
```

---

### Function 2 — generateBill (HTTP Callable)

```javascript
// Callable from client via: httpsCallable(functions, 'generateBill')

// Request shape:
{
  restaurantId: string,   // owner's uid
  tableId: string,
  orderId: string,
  discountAmount: number  // flat discount in Rs., default 0
}

// Response shape (success):
{
  success: true,
  billId: string,
  grandTotal: number,
  pdfUrl: string          // Firebase Storage download URL
}

// Response shape (error):
{
  success: false,
  error: string           // human readable error message
}

// Internal logic:
// 1. Verify request.auth.uid === restaurantId (security check)
// 2. Fetch order document
// 3. Fetch restaurant document for GST rate, name, logo
// 4. Calculate: subtotal, gstAmount, grandTotal after discount
// 5. Generate PDF using pdfkit
// 6. Upload PDF to Storage at /bills/{restaurantId}/{billId}.pdf
// 7. Write bill document to /restaurants/{restaurantId}/bills/{billId}
// 8. Update order status to billed
// 9. Return success response with pdfUrl
```

---

### Function 3 — sendOtpForPasswordReset (HTTP Callable)

```javascript
// Request shape:
{
  phone: string    // +91XXXXXXXXXX format
}

// Response shape (success):
{
  success: true,
  message: 'OTP sent to your registered number'
}

// Response shape (error):
{
  success: false,
  error: 'PHONE_NOT_FOUND' | 'SMS_FAILED'
}

// Internal logic:
// 1. Search Firestore restaurants collection for matching phone number
// 2. If not found return PHONE_NOT_FOUND error
// 3. Generate 6-digit OTP
// 4. Store OTP in Firestore /otpStore/{phone} with 10-minute expiry timestamp
// 5. Send OTP via Twilio SMS to phone number
// 6. Return success
```

---

### Function 4 — verifyOtpAndResetPassword (HTTP Callable)

```javascript
// Request shape:
{
  phone: string,
  otp: string,
  newPassword: string
}

// Response shape (success):
{
  success: true,
  message: 'Password reset successfully'
}

// Response shape (error):
{
  success: false,
  error: 'OTP_INVALID' | 'OTP_EXPIRED' | 'RESET_FAILED'
}

// Internal logic:
// 1. Fetch /otpStore/{phone} document
// 2. If not found or expired — return OTP_INVALID
// 3. Compare provided OTP with stored OTP
// 4. If mismatch — return OTP_INVALID
// 5. Find restaurant with matching phone, get uid
// 6. Use Firebase Admin SDK to generate password reset and set new password
// 7. Delete /otpStore/{phone} document
// 8. Return success
```

---

### Function 5 — onOrderStatusUpdated

```javascript
// Trigger: Firestore onUpdate on /restaurants/{restaurantId}/orders/{orderId}
// Input: before and after snapshots

// Internal logic:
// 1. Get previous status and new status
// 2. If new status is done:
//    a. Check if all orders for this table are done
//    b. If yes — update table status to free
// 3. If new status is billed:
//    a. Update table status to free
//    b. No further action (bill already generated separately)
```

---

### Function 6 — scheduledDailyReport

```javascript
// Trigger: Firebase Scheduled Function
// Schedule: every day 22:00 IST (16:30 UTC)
// Cron: '30 16 * * *'

// Internal logic:
// 1. Query all restaurants where plan is pro or premium
// 2. For each restaurant:
//    a. Get today's date string YYYY-MM-DD
//    b. Fetch /analytics/{today} document
//    c. Find top dish name from topDishes map
//    d. Find busiest hour from hourlyBreakdown map
//    e. Compose and send WhatsApp message to restaurant.phone
// 3. Log success/failure count
```

---

### Function 7 — onDishStockUpdated

```javascript
// Trigger: Firestore onUpdate on /restaurants/{restaurantId}/menu/{itemId}
// Input: before and after snapshots

// Internal logic:
// 1. Get previous currentStock and new currentStock
// 2. If new currentStock equals 0:
//    a. Set available = false on the dish document
// 3. If previous currentStock was 0 and new currentStock > 0:
//    a. Set available = true on the dish document
```

---

### Function 8 — checkExpiredPlans

```javascript
// Trigger: Firebase Scheduled Function
// Schedule: every day at midnight IST
// Cron: '30 18 * * *'

// Internal logic:
// 1. Query all restaurants where planExpiry < now
// 2. For each expired restaurant:
//    a. Update plan to basic
//    b. Send WhatsApp to owner: "Your QRDine trial has expired. Upgrade to continue Pro features."
```

---

## 6. Firestore Indexes Required

*Add to firestore.indexes.json*

```json
{
  "indexes": [
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tableId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bills",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tableId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 7. React Hooks — Contracts

*Exact function signatures Anti Gravity must implement*

```javascript
// useOrders.js
// Returns live orders filtered by status
useOrders(restaurantId, statusFilter)
// Returns: { orders: Order[], loading: boolean, error: string | null }

// useMenu.js
// Returns full menu for a restaurant (used on both owner and customer side)
useMenu(restaurantId)
// Returns: { menu: MenuItem[], loading: boolean, error: string | null }

// useTables.js
// Returns live table statuses
useTables(restaurantId)
// Returns: { tables: Table[], loading: boolean, error: string | null }

// useRestaurant.js
// Returns restaurant profile document
useRestaurant(restaurantId)
// Returns: { restaurant: Restaurant | null, loading: boolean, error: string | null }

// useAnalytics.js
// Returns analytics for a date range
useAnalytics(restaurantId, startDate, endDate)
// Returns: { analytics: Analytics[], loading: boolean, error: string | null }
```

---

## 8. TypeScript Interfaces — All Data Shapes

```typescript
interface Restaurant {
  id: string
  name: string
  ownerName: string
  phone: string             // +91XXXXXXXXXX
  licenseNumber: string
  address: string
  logo: string              // Storage URL
  gstNumber: string
  gstRate: 5 | 18
  language: 'en' | 'hi' | 'gu'
  plan: 'trial' | 'basic' | 'pro' | 'premium'
  planExpiry: Timestamp
  ownerId: string
  createdAt: Timestamp
}

interface MenuItem {
  id: string
  name: string
  price: number             // in Rs., no decimals
  category: string
  photoUrl: string
  available: boolean
  stockLimit: number | null
  currentStock: number | null
  sortOrder: number
}

interface Table {
  id: string
  tableNumber: string       // "Table 1", "Table 2"
  qrCodeUrl: string
  status: 'free' | 'occupied' | 'bill-requested'
  lastUpdated: Timestamp
}

interface OrderItem {
  itemId: string
  name: string
  price: number
  quantity: number
  modifiers: string         // free text, can be empty string
}

interface Order {
  id: string
  tableId: string
  tableNumber: string
  items: OrderItem[]
  subtotal: number
  gstAmount: number
  totalAmount: number
  discount: number
  status: 'pending' | 'preparing' | 'done' | 'billed'
  customerPhone: string     // optional, empty string if not provided
  feedbackRating: 'happy' | 'sad' | null
  feedbackComment: string
  createdAt: Timestamp
}

interface Bill {
  id: string
  tableId: string
  tableNumber: string
  orderId: string
  items: OrderItem[]
  subtotal: number
  gstRate: number
  gstAmount: number
  discount: number
  grandTotal: number
  pdfUrl: string
  createdAt: Timestamp
}

interface Analytics {
  date: string              // YYYY-MM-DD
  totalOrders: number
  totalRevenue: number
  topDishes: Record<string, number>    // itemId: count
  hourlyBreakdown: Record<string, number>  // hour: count
}

interface OtpStore {
  otp: string
  uid: string
  expiresAt: Timestamp
}

interface LicenseRegistry {
  uid: string
}
```

---

## 9. Customer Side — Local Storage Schema

*Persisted in browser localStorage to remember cart and customer data across sessions*

```javascript
// Key: qrdine_cart_{restaurantId}_{tableId}
{
  items: OrderItem[],
  lastUpdated: string       // ISO timestamp
}

// Key: qrdine_customer_phone
{
  phone: string             // if customer chose to save their number
}
```

---

## 10. GST Calculation Utility

```javascript
// utils/gstCalculator.js
export function calculateBill(items, gstRate, discountAmount = 0) {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  )
  const gstAmount = Math.round(subtotal * (gstRate / 100))
  const grandTotal = subtotal + gstAmount - discountAmount

  return {
    subtotal,
    gstRate,
    gstAmount,
    discountAmount,
    grandTotal: Math.max(grandTotal, 0)   // never negative
  }
}
```

---

## 11. Deployment Checklist

```
Before deploying to production:

□ Firebase project created in asia-south1 region
□ All .env variables filled in
□ Firestore rules deployed: firebase deploy --only firestore:rules
□ Storage rules deployed: firebase deploy --only storage
□ Firestore indexes deployed: firebase deploy --only firestore:indexes
□ Cloud Functions config set:
    firebase functions:config:set twilio.account_sid="XX"
    firebase functions:config:set twilio.auth_token="XX"
    firebase functions:config:set twilio.whatsapp_number="whatsapp:+XXXXX"
□ Cloud Functions deployed: firebase deploy --only functions
□ Frontend built: npm run build
□ PWA manifest.json present with correct icons
□ Service worker registered
□ Frontend deployed: firebase deploy --only hosting
□ Test signup with dummy license number
□ Test full order flow: scan QR → order → appears on dashboard
□ Test bill generation and print
□ Test offline — disable network and place order — confirm it syncs on reconnect
```

---

*QRDine Firebase Setup & Function Contracts — Internal Reference — Jenil Patel — 2026*
