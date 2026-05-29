# QRDine — Project Brief for Development

## What Are We Building
A PWA (Progressive Web App) based SaaS platform where restaurant owners can sign up, build a digital menu, generate QR codes for their tables, and receive real-time orders from customers who scan those QR codes on their phones — no app download required on either side.

---

## Tech Stack(using @SKILLS_INVENTTORY.md)
- Frontend: React + Vite (PWA)
- Backend: Firebase (Firestore, Auth, Storage, Functions)
- Real-time: Firebase Firestore real-time listeners
- QR Generation: qrcode.js
- Notifications: Twilio WhatsApp API (for order alerts)
- Payments: Razorpay (add in V2)
- Hosting: Vercel (frontend) + Firebase (backend)
- Styling: Tailwind CSS + GSAP + Three.js

---

## Two Separate Interfaces

### 1. Owner Side (Dashboard PWA)
Restaurant owner logs in and manages everything from here.

### 2. Customer Side (Ordering Interface)
Opens when customer scans QR code. No login required. Works in mobile browser directly and saves their data in their browser/device (if possible by caching).

---

## Database Structure (Firestore)

```
/restaurants/{restaurantId}
  - name
  - logo
  - address
  - ownerId
  - createdAt

/restaurants/{restaurantId}/menu/{itemId}
  - name
  - price
  - category
  - photoUrl
  - available (boolean)
  - stockLimit (number, optional)

/restaurants/{restaurantId}/tables/{tableId}
  - tableNumber
  - qrCodeUrl
  - status (free / occupied / bill-requested)

/restaurants/{restaurantId}/orders/{orderId}
  - tableId
  - tableNumber
  - items (array of itemId, name, price, quantity, modifiers)
  - status (pending / preparing / done)
  - createdAt
  - totalAmount
```

---

## Owner Side — Pages and Features

### Auth
- Signup: owner enters their registered business license number, full name, restaurant name, phone number, and creates a password
- Login: owner enters their business license number and password
- Business license number acts as the unique identifier instead of email
- Forgot password: enter registered phone number, receive OTP on SMS, reset password

### Onboarding Flow (first time setup)
- Step 1: Enter restaurant name, upload logo, enter address
- Step 2: Build menu — add dishes with photo upload, name, price, category
- Step 3: Enter number of tables — QR codes auto-generate for each table
- Step 4: Show all QR codes with download button — owner prints and places on tables

### Dashboard Home
- Total orders today
- Total revenue today
- Active tables count
- Most ordered dish today
- Quick action buttons — View Orders, Manage Menu, View Tables

### Orders Page
- Real-time list of incoming orders
- Each order card shows: table number, items ordered, total amount, time, status
- Owner can update status: Pending → Preparing → Done
- Filter by status

### Menu Management Page
- View all dishes in a grid
- Add new dish — photo upload, name, price, category, stock limit toggle
- Edit existing dish
- Toggle dish availability on/off (marks as unavailable on customer menu)
- When stock hits zero auto-hide dish from customer menu

### Tables Page
- Visual grid of all tables showing status: Free / Occupied / Bill Requested
- Click table to see current order on that table
- Reset table status after customer leaves

### Kitchen Display Page (separate view)
- Simplified real-time order list for kitchen staff
- Shows only item names and quantities
- No prices, no customer details
- Orders auto-appear, staff marks each as done

### Analytics Page
- Daily revenue graph (last 7 days)
- Top 5 dishes this week
- Peak hour heatmap
- Total orders this month

### Settings Page
- Edit restaurant profile
- Change logo
- Add/remove tables
- Change password
- Choose customer interface language: English / Hindi / Gujarati

### Bill Generator Page
- Owner clicks Generate Bill on any active table
- System pulls all confirmed orders for that table automatically
- Bill shows: restaurant name and logo at top, table number, date and time, itemised list with quantity and price per item, subtotal, GST (5% for restaurants under GST threshold, 18% for above — owner sets this in settings), grand total
- Owner can add manual discount in percentage or flat amount before finalising
- Two options after generating: Print Bill (opens browser print dialog formatted for 80mm thermal printer paper) and Send on WhatsApp (sends itemised bill to customer's WhatsApp number if they entered it while ordering)
- Bill saved in Firestore under that order for record keeping
- Owner can view past bills from analytics page filtered by date and table

---

## Customer Side — Ordering Interface

### How It Opens
- Customer scans QR code on table
- URL format: yourdomain.com/order/{restaurantId}/{tableId}
- Opens directly in mobile browser — zero app install

### Customer Ordering Flow

**Step 1 — Menu Page**
- Show restaurant name and logo at top
- Menu items grouped by category
- Each item shows photo, name, price
- If item is unavailable show greyed out with Unavailable tag
- If item is limited show Limited Available tag
- Add to cart button on each item
- Floating cart button at bottom showing item count and total

**Step 2 — Cart Page**
- List of selected items with quantity controls
- Modifier/note field per item (example: no onions, extra spicy)
- Order summary with total
- Confirm Order button

**Step 3 — Confirmation**
- Order confirmed screen
- Show order summary
- Show estimated wait message
- Two buttons: Call Waiter and Request Bill
- These trigger a notification to owner dashboard instantly

### Customer Interface Rules
- Must be fully mobile optimised
- Must load fast even on slow 4G
- No login or signup required from customer
- Language matches what owner selected in settings

---

## Real-Time Behaviour
- When customer confirms order it must appear on owner dashboard within 2 seconds
- Use Firestore onSnapshot listener on orders collection
- Kitchen display also updates in real time
- Table status updates in real time on owner tables page

---

## WhatsApp Alerts (V2 Feature — build hook now)
- When new order arrives send WhatsApp message to owner's registered number
- Message format: New Order! Table 4 — Paneer Tikka x2, Dal Makhani x1 — Total Rs.480
- Use Twilio WhatsApp API via Firebase Function trigger on new order document

---

## QR Code Logic
- Each table gets a unique URL: yourdomain.com/order/{restaurantId}/{tableId}
- QR code encodes this URL
- Generate using qrcode.js
- Display all QR codes in a grid on owner tables page
- Each QR has a Download PNG button
- All QR codes downloadable as a ZIP file too

---

## PWA Requirements
- Add to Home Screen support
- Service worker for basic offline capability
- App manifest with restaurant-themed icon
- Fast load time — target under 3 seconds on 4G

---

## UI Design Direction
- Clean and minimal
- Dark sidebar for owner dashboard
- White content area
- Accent color: deep orange or green (pick one consistent color)
- Customer ordering interface: light, food-friendly, warm colors
- Large touch targets for mobile — minimum 44px tap areas
- All forms must work perfectly on mobile keyboard
- Use ## 🎨 UI/UX & Design Essentials from @SKILLS_INVENTTORY.md for frontend optimization. 

---

## V1 Scope (Build This First)
- Auth (signup, login)
- Restaurant profile setup
- Menu builder with photo upload
- Table management with QR generation
- Customer ordering PWA interface
- Real-time order dashboard
- Order status management
- Waiter call and bill request buttons

## V2 Scope (After V1 is Working)
- WhatsApp order alerts via Twilio
- Kitchen Display System page
- Table floor map with status
- Dish modifiers and notes
- Inventory / stock limit system
- Customer feedback (happy/sad rating)
- Multilingual customer interface
- Daily WhatsApp report (Firebase scheduled function)
- Razorpay subscription billing

## V3 Scope (Scale Phase)
- Takeaway ordering mode via QR
- Repeat order memory for returning customers
- Advanced analytics dashboard
- Multi-branch support under one account
- Staff roles — manager and waiter accounts
- Referral program
- Offline-first order queuing

---

## Folder Structure

```
/src
  /pages
    /auth         — login, signup
    /onboarding   — setup flow
    /dashboard    — home, orders, menu, tables, analytics, settings
    /kitchen      — kitchen display
    /order        — customer ordering interface (public route)
  /components
    /ui           — buttons, cards, modals, inputs
    /dashboard    — sidebar, navbar, order cards
    /order        — menu grid, cart, item card
  /firebase
    — config.js, auth.js, firestore.js, storage.js
  /hooks
    — useOrders.js, useMenu.js, useTables.js, useRestaurant.js
  /utils
    — qrGenerator.js, whatsappAlert.js, formatCurrency.js
```

---

## Notes for Development
- All amounts in Indian Rupees (Rs.)
- Phone number field must accept Indian format (+91)
- Date and time in IST timezone
- Image uploads compressed before storing to keep Firebase Storage costs low
- Firestore security rules must ensure one restaurant cannot read another restaurant's data
- Customer ordering route must be publicly accessible without auth
- All other routes must require owner login
