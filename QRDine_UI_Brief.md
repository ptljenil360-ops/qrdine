# QRDine — UI/UX Screen Brief
*Screen-by-screen layout reference for Anti Gravity. Use @frontend-design @ui-ux-pro-max @mobile-design @animejs-animation @design-spells @iconsax-library skills for all screens.*

---

## Global Design Tokens

```
Primary Accent:     #F97316  (deep orange)
Accent Dark:        #EA580C
Background Dark:    #0F172A
Sidebar Dark:       #1E293B
Card Background:    #FFFFFF
Border Color:       #E2E8F0
Text Primary:       #1E293B
Text Secondary:     #64748B
Text Muted:         #94A3B8
Success Green:      #22C55E
Warning Yellow:     #EAB308
Error Red:          #EF4444
Pending Orange:     #F97316

Font Family:        Inter (all weights)
Border Radius:      8px cards, 12px modals, 999px pills
Shadow:             0 1px 3px rgba(0,0,0,0.08) cards,
                    0 4px 24px rgba(0,0,0,0.12) modals
Transition:         all 0.2s ease
Min Touch Target:   44px height on all buttons and interactive elements
```

---

## Global Layout — Owner Dashboard Shell

```
┌─────────────────────────────────────────────────────────┐
│                    TOP NAV BAR (64px)                   │
│  [QRDine Logo]          [Restaurant Name]  [Avatar]     │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   SIDEBAR    │           MAIN CONTENT AREA             │
│   (240px)    │           (flex-1, scrollable)           │
│              │                                          │
│  Navigation  │                                          │
│  Items       │                                          │
│  (listed     │                                          │
│   below)     │                                          │
│              │                                          │
│              │                                          │
│  [Plan Badge]│                                          │
│  [Logout]    │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**Sidebar Navigation Items (top to bottom):**
- 🏠 Dashboard (Home icon)
- 📋 Orders (ClipboardList icon) — shows live order count badge in orange
- 🍽️ Menu (UtensilsCrossed icon)
- 🪑 Tables (LayoutGrid icon)
- 🧾 Bills (Receipt icon)
- 📊 Analytics (BarChart2 icon)
- 🍳 Kitchen Display (ChefHat icon) — opens in new tab
- ⚙️ Settings (Settings icon)

**Sidebar behavior:**
- Active item has orange left border and light orange background
- Collapsed to icon-only on screens below 1024px
- Mobile: bottom tab bar instead of sidebar showing only Dashboard, Orders, Menu, Tables, Bills

---

## Screen 1 — Login Page

**Layout:** Centered card on split screen

```
┌────────────────────────────────────────────────────                     ────┐
│                                                                             │
│   LEFT HALF (dark bg #0F172A)    RIGHT HALF (white)                       │
│                                                                             │
│   [QRDine Logo large]            ┌─────────────────                     ┐   │
│   "Smart ordering for            │   Welcome Back                       │   │
│    Indian restaurants"           │                                      │   │
│                                  │ username                             │   │
│   [Subtle food pattern bg]       │ [____________]                       │   │
│                                  │                                      │   │
│                                  │ Password                             │   │
│                                  │ [____________]                       │   │
│                                  │                                      │   │
│                                  │ [Login Button]                       │   │                      
│                                  │    or                                │   │
|                                  | [login using phone number and otp]   │   │
│                                  │ Forgot Password?                     │   │
│                                  │ Don't have                           │   │
│                                  │ account? Signup                      │   │
│                                  └─────────────────                     ┘   │
└──────────────────────────────────────────────────────────────────────     ──┘
```

**Component Details:**
- Left panel: dark bg with subtle diagonal food icon pattern at 5% opacity, large white QRDine wordmark, tagline in muted grey
- Right panel: white, vertically centered form card with 32px padding
- Business License input: text input, placeholder "Enter your license number", info icon tooltip explaining what this is
- Password input: with show/hide toggle eye icon
- Login button: full width, orange background, white text, 48px height, rounded-lg, hover darkens to #EA580C
- Forgot password: small text link below button, right aligned
- Signup link: centered text at very bottom of card
- Form validation: inline red error messages below each field
- Error state: red border on field + error message below
- Loading state: button shows spinner and "Logging in..." text
- Mobile: full screen white, no split, logo at top in orange

---

## Screen 2 — Signup Page

**Layout:** Same split as Login but right side has a stepped progress indicator

```
Right Panel:
┌──────────────────────────────┐
│  Create Your Account         │
│                              │
│  ● ─── ○ ─── ○              │
│  Info  Restaurant  Done      │
│                              │
│  Full Name                   │
│  [____________________]      │
│                              │
│                              |
│                              │
│  Phone Number (+91)          │
│  [____________________]      │
│                              │
│  Password                    │
│  [____________________]      │
│                              │
│  Confirm Password            │
│  [____________________]      │
│                              │
│  [Continue →]                │
│                              │
│  Already have account? Login │
└──────────────────────────────┘
```

**Step 2 — Restaurant Details:**
- Restaurant Name field
- Address textarea (3 rows)
- Logo upload — drag and drop zone with camera icon, "Upload your restaurant logo" text, accepts JPG/PNG, shows preview after upload
- GST Rate selector — toggle between 5% and 18% with explanation text
- Continue button

**Step 3 — Done:**
- Large animated checkmark (green, GSAP draw animation)
- "Your account is ready!" heading
- "Now let's set up your menu and tables" subtext
- "Go to Setup →" button in orange

---

## Screen 3 — Onboarding Flow

*Full screen wizard, replaces dashboard until complete. Progress bar at top showing 3 steps.*

**Step 1 — Menu Builder:**
```
┌─────────────────────────────────────────────────────────┐
│  ████████░░░░  Step 1 of 3 — Build Your Menu           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [+ Add Dish]          Category Filter: [All ▼]        │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ [photo]  │ │ [photo]  │ │  + Add   │               │
│  │ Dish Name│ │ Dish Name│ │  New     │               │
│  │ Rs. 220  │ │ Rs. 180  │ │  Dish    │               │
│  │ [Edit]   │ │ [Edit]   │ │          │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                         │
│                          [Next: Set Up Tables →]        │
└─────────────────────────────────────────────────────────┘
```

**Add Dish Modal (slides up from bottom, 90vh):**
- Photo upload area — large dashed border box 200px tall, camera icon, "Tap to upload dish photo"
- After upload: shows photo preview with "Change Photo" link
- Dish Name — text input
- Category — text input with autocomplete (Starters, Mains, Breads, Desserts, Drinks, or type custom)
- Price — number input with Rs. prefix label
- Stock Limit toggle — off by default, if on shows number input "How many available today?"
- Save button — full width orange
- Cancel — text link

**Step 2 — Table Setup:**
```
┌─────────────────────────────────────────────────────────┐
│  ████████████████░░░░  Step 2 of 3 — Set Up Tables     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  How many tables does your restaurant have?             │
│                                                         │
│         ┌───┐                                           │
│    [−]  │ 8 │  [+]                                     │
│         └───┘                                           │
│                                                         │
│  [Generate QR Codes]                                    │
│                                                         │
│  --- After generation ---                               │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  [QR]   │ │  [QR]   │ │  [QR]   │               │
│  │ Table 1 │ │ Table 2 │ │ Table 3 │               │
│  │[Download]│ │[Download]│ │[Download]│               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                         │
│  [Download All as ZIP]    [Done — Go to Dashboard →]   │
└─────────────────────────────────────────────────────────┘
```

---

## Screen 4 — Dashboard Home

```
┌─────────────────────────────────────────────────────────┐
│  Good evening, [Name] 👋   Today: Saturday 23 May 2026 │
├──────────┬──────────┬──────────┬───────────────────────┤
│ 📋        │ 💰        │ 🪑        │ 🍽️                    │
│ 24        │ Rs.4,820 │ 6/12     │ Paneer Tikka          │
│ Orders    │ Revenue  │ Tables   │ Top Dish              │
│ Today     │ Today    │ Active   │ (18 orders)           │
├──────────┴──────────┴──────────┴───────────────────────┤
│                                                         │
│  LIVE ORDERS (real-time)          [View All Orders →]   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔴 NEW  Table 4 · 3 items · Rs.680 · 2 min ago │   │
│  │ Dal Makhani x1, Naan x2, Lassi x1              │   │
│  │ [Preparing] [Done]                              │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟡 PREP  Table 7 · 2 items · Rs.340 · 8 min   │   │
│  │ Paneer Tikka x2                                 │   │
│  │ [Done]                                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  TABLES AT A GLANCE               [Manage Tables →]    │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                 │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │                 │
│  │ 🟢│ │ 🔴│ │ 🟢│ │ 🔴│ │ 🟡│ │ 🟢│                 │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                 │
│  🟢 Free  🔴 Occupied  🟡 Bill Requested               │
└─────────────────────────────────────────────────────────┘
```

**Stat card details:**
- White card, 16px padding, subtle shadow
- Large bold number on top, label below in muted text
- Icon in top-right corner in light orange circle
- Hover: slight lift with shadow increase

**Order card details:**
- White card with left border — red for NEW, orange for PREPARING, green for DONE
- Status pill badge top-left
- Table number bold, item count and total in muted text
- Item names in smaller grey text on second line
- Action buttons right-aligned — orange outlined buttons
- New orders pulse animation on left border (GSAP)

---

## Screen 5 — Orders Page

```
┌─────────────────────────────────────────────────────────┐
│  Orders                                    [🔴 Live]   │
├─────────────────────────────────────────────────────────┤
│  [All] [Pending] [Preparing] [Done]    Search: [____]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Table 4          🔴 PENDING       8:32 PM       │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  Paneer Tikka x2 .............. Rs. 480         │   │
│  │  Dal Makhani x1 ............... Rs. 220         │   │
│  │  Butter Naan x3 ............... Rs. 150         │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  Total: Rs. 850             [Mark Preparing]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Table 2          🟡 PREPARING     8:18 PM       │   │
│  │  Chicken Biryani x1 ........... Rs. 320         │   │
│  │  Total: Rs. 320               [Mark Done]        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Filter tabs:** pill-shaped, active tab fills orange
**Order card:** full-width white card, itemised breakdown visible by default
**Status badge:** colored pill — red PENDING, orange PREPARING, green DONE
**Action button:** changes based on current status, single primary action always visible
**New order arrival:** card slides in from top with sound notification (subtle chime)

---

## Screen 6 — Menu Management Page

```
┌─────────────────────────────────────────────────────────┐
│  Menu                              [+ Add New Dish]     │
├─────────────────────────────────────────────────────────┤
│  [All] [Starters] [Mains] [Breads] [Drinks] [Desserts] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  [photo] │  │  [photo] │  │  [photo] │             │
│  │          │  │          │  │  LIMITED │  ← orange   │
│  │ Paneer   │  │ Dal      │  │ Chicken  │     badge   │
│  │ Tikka    │  │ Makhani  │  │ Biryani  │             │
│  │ Rs. 240  │  │ Rs. 220  │  │ Rs. 320  │             │
│  │ ●Available│  │ ●Available│  │ Stock: 3 │             │
│  │[Edit][✕] │  │[Edit][✕] │  │[Edit][✕] │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  ┌──────────┐                                          │
│  │  [photo] │                                          │
│  │ UNAVAIL  │  ← greyed out card with overlay          │
│  │ Fish Fry │                                          │
│  │ Rs. 280  │                                          │
│  │ ○Unavail │                                          │
│  │[Edit][✕] │                                          │
│  └──────────┘                                          │
└─────────────────────────────────────────────────────────┘
```

**Dish card details:**
- 160px wide, photo top 100px with object-fit cover
- Name and price below photo
- Availability toggle — green dot AVAILABLE, grey dot UNAVAILABLE
- Unavailable card: photo has grey overlay at 60% opacity, UNAVAILABLE badge
- Limited stock badge: orange pill in top-right of photo
- Edit opens same Add Dish modal pre-filled
- Delete shows confirmation modal before removing

---

## Screen 7 — Tables Page

```
┌─────────────────────────────────────────────────────────┐
│  Tables                          [+ Add Table]          │
├─────────────────────────────────────────────────────────┤
│  🟢 Free: 6   🔴 Occupied: 4   🟡 Bill Requested: 2   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  TABLE 1 │  │  TABLE 2 │  │  TABLE 3 │             │
│  │          │  │ Rs. 680  │  │  🟡BILL  │             │
│  │  🟢 FREE │  │ 🔴 3 items│  │ Rs.1,240 │             │
│  │          │  │          │  │          │             │
│  │  [QR]   │  │[View Ord]│  │[Gen Bill]│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  ┌──────────┐  ┌──────────┐                            │
│  │  TABLE 4 │  │  TABLE 5 │                            │
│  │ Rs. 340  │  │          │                            │
│  │ 🔴 2 items│  │  🟢 FREE │                            │
│  │[View Ord]│  │  [QR]   │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
```

**Table card details:**
- 180px × 160px card, colored top border indicates status
- Table number bold at top
- If free: show QR code thumbnail, click to download QR
- If occupied: show total amount and item count, View Order button
- If bill requested: show BILL badge pulsing in orange, Generate Bill button
- After reset: confirmation toast "Table 3 marked as free"

---

## Screen 8 — Bill Generator Page

```
┌─────────────────────────────────────────────────────────┐
│  Generate Bill — Table 4                    [✕ Close]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         [Restaurant Logo]                       │   │
│  │         Restaurant Name                         │   │
│  │         Address · GST: XXXXXXXXXX               │   │
│  │                                                 │   │
│  │  Table 4           Sat 23 May 2026  8:45 PM    │   │
│  │  Bill #1042                                     │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  Paneer Tikka       x2          Rs.  480        │   │
│  │  Dal Makhani        x1          Rs.  220        │   │
│  │  Butter Naan        x3          Rs.  150        │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  Subtotal                       Rs.  850        │   │
│  │  GST (5%)                       Rs.   42        │   │
│  │  Discount          [____] Rs.   Rs.    0        │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  GRAND TOTAL                    Rs.  892        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [🖨️ Print Bill]              [💬 Send on WhatsApp]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Bill preview details:**
- Renders inside a white card styled exactly like 80mm thermal paper
- Discount field is editable inline — grand total recalculates in real time
- Print button: triggers browser print with @media print CSS hiding everything except bill
- WhatsApp button: only active if customer entered phone number while ordering

---

## Screen 9 — Analytics Page

```
┌─────────────────────────────────────────────────────────┐
│  Analytics          [This Week ▼]   [This Month ▼]      │
├──────────────────────────────────┬──────────────────────┤
│                                  │  TOP DISHES          │
│   REVENUE (last 7 days)          │                      │
│                                  │  1. Paneer Tikka  42 │
│   Rs.4,820                       │  2. Dal Makhani   38 │
│   ▲ 12% vs last week            │  3. Butter Naan   31 │
│                                  │  4. Lassi         28 │
│   [Bar chart — 7 bars]           │  5. Biryani       19 │
│                                  │                      │
├──────────────────────────────────┴──────────────────────┤
│  PEAK HOURS HEATMAP                                     │
│                                                         │
│       12pm  1pm  2pm  7pm  8pm  9pm  10pm              │
│  Mon  ░░░   ███  ██   ░░░  ███  ████  ██               │
│  Tue  ░░░   ██   ░░░  ░░░  ████ ███   ░░               │
│  Wed  ░░░   ███  ███  ░░░  ██   ████  ███              │
│                                                         │
│  (darker = more orders)                                 │
└─────────────────────────────────────────────────────────┘
```

**Chart details:**
- Revenue bar chart: orange bars, hover shows exact amount tooltip
- Heatmap: orange intensity scale, lightest = 0 orders, darkest = peak
- Top dishes: numbered list with orange bar behind each showing relative %
- All charts built with Recharts library

---

## Screen 10 — Kitchen Display Page

*Opens in a new tab. Designed for a tablet mounted in the kitchen.*

```
┌─────────────────────────────────────────────────────────┐
│  🍳 Kitchen Display — [Restaurant Name]    8:47 PM 🔴  │
│  (red dot = live)                                       │
├────────────────────┬────────────────────┬───────────────┤
│  🔴 NEW            │  🟡 PREPARING      │  ✅ DONE      │
│                    │                    │               │
│ ┌────────────────┐ │ ┌────────────────┐ │ (faded cards) │
│ │ TABLE 4        │ │ │ TABLE 2        │ │               │
│ │ 8:45 PM · 3min │ │ │ 8:32 PM        │ │               │
│ │                │ │ │                │ │               │
│ │ Paneer Tikka 2 │ │ │ Chicken        │ │               │
│ │ Dal Makhani  1 │ │ │ Biryani      1 │ │               │
│ │ Butter Naan  3 │ │ │                │ │               │
│ │                │ │ │ [✓ Done]       │ │               │
│ │ [Start Prep]   │ │ └────────────────┘ │               │
│ └────────────────┘ │                    │               │
└────────────────────┴────────────────────┴───────────────┘
```

**Kitchen display details:**
- Dark background (#0F172A) — easier on eyes in kitchen environment
- Three column kanban layout
- Large text — dish names 18px, quantities bold 24px
- Timer shows time since order was placed, turns red after 15 minutes
- New order: card flies in from left with sound notification
- No prices shown — kitchen staff does not need this
- Auto-refresh every 30 seconds as fallback even if WebSocket drops

---

## Screen 11 — Settings Page

```
┌─────────────────────────────────────────────────────────┐
│  Settings                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  RESTAURANT PROFILE                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Logo preview 80px]  [Change Logo]             │   │
│  │  Restaurant Name  [____________________]        │   │
│  │  Address          [____________________]        │   │
│  │  Phone            [+91 ________________]        │   │
│  │  GST Number       [____________________]        │   │
│  │  GST Rate         [5%] [18%]  ← toggle          │   │
│  │                                [Save Changes]   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  CUSTOMER INTERFACE LANGUAGE                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [English ●]  [हिंदी ○]  [ગુજરાતી ○]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  TABLES                                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Current tables: 12    [+ Add Tables]           │   │
│  │  [Manage Individual Tables →]                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  SECURITY                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Change Password →]                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  SUBSCRIPTION                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Current Plan: BASIC   Expires: 24 Jun 2026     │   │
│  │  [Upgrade to Pro →]                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Screen 12 — Customer Ordering Interface

*Public route. Opens on mobile when QR is scanned. Light, warm, food-focused design.*

```
Design tokens for customer side only:
Background:   #FFFBF5  (warm off-white)
Accent:       #F97316  (same orange)
Card:         #FFFFFF
Text:         #1C1917
Muted:        #78716C
Border:       #E7E5E4
```

**Menu Page:**
```
┌─────────────────────────┐
│  [Logo]  Restaurant Name│  ← sticky header
│  ──────────────────────  │
│  [Starters] [Mains] ... │  ← horizontal scroll category tabs
│                          │
│  STARTERS                │  ← section heading
│                          │
│  ┌──────────────────┐   │
│  │[photo 100px wide]│   │
│  │ Paneer Tikka     │   │
│  │ Rs. 240          │   │
│  │           [+ Add]│   │  ← orange button right aligned
│  └──────────────────┘   │
│                          │
│  ┌──────────────────┐   │
│  │[photo]           │   │
│  │ Fish Fry    UNAVL│   │  ← greyed, button disabled
│  │ Rs. 280          │   │
│  └──────────────────┘   │
│                          │
│  ┌─────────────────────┐ │  ← floating cart bar sticky bottom
│  │ 🛒 3 items  Rs.680  │ │
│  │      View Cart →    │ │
│  └─────────────────────┘ │
└─────────────────────────┘
```

**Cart Page:**
```
┌─────────────────────────┐
│ ← Back       Your Order │
│  ──────────────────────  │
│                          │
│  Paneer Tikka            │
│  [−] 2 [+]    Rs. 480   │
│  Note: [no onions    ]   │
│                          │
│  Dal Makhani             │
│  [−] 1 [+]    Rs. 220   │
│  Note: [extra spicy  ]   │
│                          │
│  ──────────────────────  │
│  Subtotal      Rs. 700   │
│                          │
│  [Confirm Order]         │  ← full width orange button
└─────────────────────────┘
```

**Order Confirmed Page:**
```
┌─────────────────────────┐
│                          │
│       ✅  (animated)     │
│                          │
│   Order Placed!          │
│   Your food is being     │
│   prepared               │
│                          │
│   ──────────────────── │
│   Paneer Tikka x2        │
│   Dal Makhani x1         │
│   ──────────────────── │
│   Total: Rs. 700         │
│                          │
│   [📣 Call Waiter]       │
│   [🧾 Request Bill]      │
│                          │
│   Estimated wait: 15 min │
│                          │
└─────────────────────────┘
```

---

## Error States — All Screens

- **Empty orders list:** Illustration of empty plate + "No orders yet. Waiting for customers..." text in muted grey
- **Empty menu:** Illustration + "Your menu is empty. Add your first dish to get started" + orange Add Dish button
- **Network error:** Toast notification at top — red background — "Connection lost. Reconnecting..." with spinner
- **Form validation error:** Red border on field + red text below field — never use alert() dialogs
- **Dish unavailable on customer side:** Greyed card with UNAVAILABLE badge, Add button disabled
- **QR scan for closed restaurant:** Full screen message "This restaurant is currently not accepting orders"
- **Session expired:** Redirect to login with toast "Session expired. Please log in again"
- **Order submit failure:** Customer sees "Order failed to send. Please try again" with retry button — never lose cart contents

---

## Animations — Use @animejs-animation skill

- **Dashboard stat cards:** count-up animation on number when page loads (0 to final value in 800ms)
- **New order arrival on dashboard:** card slides down from above with spring easing
- **Order status change:** smooth color transition on status badge 300ms
- **Onboarding checkmark:** SVG path draw animation on signup complete
- **Kitchen display new order:** card flies in from left side
- **Page transitions:** fade in 200ms on route change
- **Cart button bounce:** subtle scale bounce when item added to cart
- **Table status change:** color pulse once on status update
- **Loading skeletons:** pulse animation on all loading states — never show blank white

---

## Responsive Breakpoints

```
Mobile:   < 768px   — bottom tab nav, single column, full width cards
Tablet:   768-1024px — sidebar collapses to icons, 2 column grids
Desktop:  > 1024px  — full sidebar, 3-4 column grids, split views
```

---

## Print Styles — Bill Only

```css
@media print {
  /* Hide everything except bill preview card */
  body > *:not(.bill-print-area) { display: none; }
  .bill-print-area {
    width: 80mm;
    font-size: 12px;
    font-family: monospace;
  }
}
```
