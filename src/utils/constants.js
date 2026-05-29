/**
 * QRDine — Application Constants
 * All enums, error codes, and default values used across the app.
 */

/* ── Order Status ── */
export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  DONE: 'done',
  BILLED: 'billed',
}

export const ORDER_STATUS_LABELS = {
  pending: 'New',
  preparing: 'Preparing',
  done: 'Done',
  billed: 'Billed',
}

export const ORDER_STATUS_COLORS = {
  pending: '#EF4444',      // red
  preparing: '#F97316',    // orange
  done: '#22C55E',         // green
  billed: '#64748B',       // muted
}

/* ── Table Status ── */
export const TABLE_STATUS = {
  FREE: 'free',
  OCCUPIED: 'occupied',
  BILL_REQUESTED: 'bill-requested',
}

export const TABLE_STATUS_COLORS = {
  free: '#22C55E',
  occupied: '#EF4444',
  'bill-requested': '#EAB308',
}

export const TABLE_STATUS_LABELS = {
  free: 'Free',
  occupied: 'Occupied',
  'bill-requested': 'Bill Requested',
}

/* ── Menu Categories ── */
export const DEFAULT_CATEGORIES = [
  'Starters',
  'Mains',
  'Breads',
  'Desserts',
  'Drinks',
]

/* ── GST Rates ── */
export const GST_RATES = [5, 18]

/* ── Sidebar Navigation Items ── */
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Orders', path: '/dashboard/orders', icon: 'ClipboardList', badge: true },
  { label: 'Menu', path: '/dashboard/menu', icon: 'UtensilsCrossed' },
  { label: 'Tables', path: '/dashboard/tables', icon: 'LayoutGrid' },
  { label: 'Bills', path: '/dashboard/bills', icon: 'Receipt' },
  { label: 'Analytics', path: '/dashboard/analytics', icon: 'BarChart2' },
  { label: 'Kitchen Display', path: '/dashboard/kitchen', icon: 'ChefHat' },
  { label: 'Settings', path: '/dashboard/settings', icon: 'Settings' },
]

/* ── Mobile Bottom Tab Items (subset of sidebar) ── */
export const MOBILE_TAB_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Orders', path: '/dashboard/orders', icon: 'ClipboardList', badge: true },
  { label: 'Menu', path: '/dashboard/menu', icon: 'UtensilsCrossed' },
  { label: 'Tables', path: '/dashboard/tables', icon: 'LayoutGrid' },
  { label: 'Settings', path: '/dashboard/settings', icon: 'Settings' },
]
