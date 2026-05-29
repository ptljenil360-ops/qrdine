import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db, auth } from './config'

/* ═══════════════════════════════════════════════════════
   Restaurant Profile
   ═══════════════════════════════════════════════════════ */

/**
 * Fetch restaurant profile document.
 * @param {string} restaurantId - Firebase Auth UID
 */
export async function getRestaurant(restaurantId) {
  const snap = await getDoc(doc(db, 'restaurants', restaurantId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Update restaurant profile fields.
 * @param {string} restaurantId
 * @param {Object} data - Fields to update
 */
export async function updateRestaurantProfile(restaurantId, data) {
  await updateDoc(doc(db, 'restaurants', restaurantId), data)
}

/* ═══════════════════════════════════════════════════════
   Menu CRUD
   ═══════════════════════════════════════════════════════ */

/**
 * Add a new menu item to a restaurant's menu.
 * @param {string} restaurantId
 * @param {Object} data - MenuItem fields (name, price, category, photoUrl, available, etc.)
 * @returns {string} New document ID
 */
export async function addMenuItem(restaurantId, data) {
  const colRef = collection(db, `restaurants/${restaurantId}/menu`)
  const docRef = await addDoc(colRef, {
    ...data,
    available: data.available ?? true,
    stockLimit: data.stockLimit ?? null,
    currentStock: data.currentStock ?? null,
    sortOrder: data.sortOrder ?? 0,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

/**
 * Update an existing menu item.
 * @param {string} restaurantId
 * @param {string} itemId
 * @param {Object} data - Fields to update
 */
export async function updateMenuItem(restaurantId, itemId, data) {
  await updateDoc(doc(db, `restaurants/${restaurantId}/menu`, itemId), data)
}

/**
 * Delete a menu item.
 * @param {string} restaurantId
 * @param {string} itemId
 */
export async function deleteMenuItem(restaurantId, itemId) {
  await deleteDoc(doc(db, `restaurants/${restaurantId}/menu`, itemId))
}

/* ═══════════════════════════════════════════════════════
   Tables CRUD
   ═══════════════════════════════════════════════════════ */

/**
 * Add a new table to a restaurant.
 * @param {string} restaurantId
 * @param {Object} data - Table fields (tableNumber, qrCodeUrl, status)
 * @returns {string} New document ID
 */
export async function addTable(restaurantId, data) {
  const colRef = collection(db, `restaurants/${restaurantId}/tables`)
  const docRef = await addDoc(colRef, {
    ...data,
    status: 'free',
    lastUpdated: serverTimestamp(),
  })
  return docRef.id
}

/**
 * Update table status (free / occupied / bill-requested).
 * @param {string} restaurantId
 * @param {string} tableId
 * @param {string} status
 */
export async function updateTableStatus(restaurantId, tableId, status) {
  await updateDoc(doc(db, `restaurants/${restaurantId}/tables`, tableId), {
    status,
    lastUpdated: serverTimestamp(),
  })
}

/**
 * Delete a table.
 * @param {string} restaurantId
 * @param {string} tableId
 */
export async function deleteTable(restaurantId, tableId) {
  await deleteDoc(doc(db, `restaurants/${restaurantId}/tables`, tableId))
}

/* ═══════════════════════════════════════════════════════
   Orders
   ═══════════════════════════════════════════════════════ */

/**
 * Create a new order (called from customer side — no auth required).
 * @param {string} restaurantId
 * @param {Object} orderData - Full order object
 * @returns {string} New order document ID
 */
export async function createOrder(restaurantId, orderData) {
  const colRef = collection(db, `restaurants/${restaurantId}/orders`)
  const docRef = await addDoc(colRef, {
    ...orderData,
    status: 'pending',
    createdAt: serverTimestamp(),
    statusHistory: [
      {
        status: 'pending',
        updatedBy: 'customer',
        updatedAt: new Date().toISOString(),
      }
    ]
  })
  return docRef.id
}

/**
 * Update order status (pending → preparing → done → billed).
 * @param {string} restaurantId
 * @param {string} orderId
 * @param {string} status
 */
export async function updateOrderStatus(restaurantId, orderId, status) {
  const currentUid = auth.currentUser?.uid || 'system'
  
  await updateDoc(doc(db, 'restaurants', restaurantId, 'orders', orderId), {
    status,
    lastUpdatedBy: currentUid,
    lastUpdatedAt: serverTimestamp(),
    statusHistory: arrayUnion({
      status: status,
      updatedBy: currentUid,
      updatedAt: new Date().toISOString(),
    })
  })
}

/* ═══════════════════════════════════════════════════════
   Real-time Listeners (used by hooks)
   ═══════════════════════════════════════════════════════ */

/**
 * Subscribe to real-time menu updates.
 * @param {string} restaurantId
 * @param {function} callback - Receives array of MenuItems
 * @returns {function} Unsubscribe function
 */
export function subscribeToMenu(restaurantId, callback) {
  const q = query(
    collection(db, `restaurants/${restaurantId}/menu`),
    orderBy('sortOrder', 'asc')
  )
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(items)
  })
}

/**
 * Subscribe to real-time table status updates.
 * @param {string} restaurantId
 * @param {function} callback - Receives array of Tables
 * @returns {function} Unsubscribe function
 */
export function subscribeToTables(restaurantId, callback) {
  const q = query(collection(db, `restaurants/${restaurantId}/tables`))
  return onSnapshot(q, (snapshot) => {
    const tables = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(tables)
  })
}

/**
 * Subscribe to real-time orders filtered by status.
 * Uses the composite index: status ASC + createdAt DESC.
 *
 * @param {string} restaurantId
 * @param {string[]} statusFilter - e.g. ['pending', 'preparing']
 * @param {function} callback - Receives array of Orders
 * @returns {function} Unsubscribe function
 */
export function subscribeToOrders(restaurantId, statusFilter, callback) {
  const q = query(
    collection(db, `restaurants/${restaurantId}/orders`),
    where('status', 'in', statusFilter),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(orders)
  })
}

/**
 * Subscribe to restaurant profile document.
 * @param {string} restaurantId
 * @param {function} callback - Receives Restaurant object
 * @returns {function} Unsubscribe function
 */
export function subscribeToRestaurant(restaurantId, callback) {
  return onSnapshot(doc(db, 'restaurants', restaurantId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() })
    }
  })
}


