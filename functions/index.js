const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
admin.initializeApp();

const db = admin.firestore();

/**
 * Shared helper to calculate totals for an order based on current menu prices.
 */
async function calculateTotals(restaurantId, items) {
  if (!items || items.length === 0) return null;

  const restaurantSnap = await db.collection("restaurants").doc(restaurantId).get();
  if (!restaurantSnap.exists) return null;
  const gstRate = restaurantSnap.data().gstRate || 0;

  // Use getAll() for specifically ordered items instead of reading the whole menu
  const menuRefs = [...new Set(items.map(item => item.id))]
    .map(id => db.collection("restaurants").doc(restaurantId).collection("menu").doc(id));
  
  let menuMap = {};
  if (menuRefs.length > 0) {
    const menuSnaps = await db.getAll(...menuRefs);
    menuSnaps.forEach(snap => {
      if (snap.exists) {
        menuMap[snap.id] = snap.data();
      }
    });
  }

  let subtotal = 0;
  items.forEach((item) => {
    const menuItem = menuMap[item.id];
    const realPrice = menuItem ? Number(menuItem.price) : 0;
    const qty = Number(item.quantity) || 1;
    subtotal += realPrice * qty;
  });

  const gstAmount = (subtotal * gstRate) / 100;
  const grandTotal = subtotal + gstAmount;

  return {
    subtotal,
    gstRate,
    gstAmount,
    grandTotal,
    calculatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

/**
 * Triggered when a new order is created.
 */
exports.calculateInitialOrderTotals = functions.firestore
  .document("restaurants/{restaurantId}/orders/{orderId}")
  .onCreate(async (snap, context) => {
    const orderData = snap.data();
    const { restaurantId } = context.params;

    try {
      const serverTotals = await calculateTotals(restaurantId, orderData.items);
      if (serverTotals) {
        return snap.ref.update({ serverTotals });
      }
      return null;
    } catch (error) {
      console.error("Error calculating initial order totals:", error);
      return null;
    }
  });

/**
 * Triggered when an order is updated.
 */
exports.recalculateOrderTotalsOnUpdate = functions.firestore
  .document("restaurants/{restaurantId}/orders/{orderId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const { restaurantId } = context.params;

    if (JSON.stringify(beforeData.items) === JSON.stringify(afterData.items)) {
      return null;
    }

    try {
      const serverTotals = await calculateTotals(restaurantId, afterData.items);
      if (serverTotals) {
        return change.after.ref.update({ serverTotals });
      }
      return null;
    } catch (error) {
      console.error("Error recalculating order totals on update:", error);
      return null;
    }
  });

/**
 * Callable function to fully delete a restaurant account and all data.
 */
exports.deleteRestaurantAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }
  
  const uid = context.auth.uid;

  try {
    const restaurantRef = db.collection("restaurants").doc(uid);
    const restaurantSnap = await restaurantRef.get();
    
    if (restaurantSnap.exists) {
      const rData = restaurantSnap.data();
      if (rData.loginId) {
        // ATK-11: Validate loginId ownership before deleting
        const loginSnap = await db.collection("loginRegistry").doc(rData.loginId).get();
        if (loginSnap.exists && loginSnap.data().uid === uid) {
          await db.collection("loginRegistry").doc(rData.loginId).delete();
        }
      }
    }

    await db.recursiveDelete(restaurantRef);
    await admin.auth().deleteUser(uid);

    return { success: true };
  } catch (error) {
    console.error("Error deleting restaurant account:", error);
    throw new functions.https.HttpsError("internal", "Failed to delete account.", error.message);
  }
});

/**
 * ATK-3: Callable function to claim host status. 
 * Validates the PIN server-side.
 */
exports.claimHost = functions.https.onCall(async (data, context) => {
  const { restaurantId, tableId, pin } = data;

  if (!restaurantId || !tableId || !pin) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
  }

  try {
    const pinDocRef = db.doc(`restaurants/${restaurantId}/tables/${tableId}/private/pin`);
    const pinSnap = await pinDocRef.get();

    if (!pinSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Table PIN not found.");
    }

    const { hostPinHash } = pinSnap.data();
    
    // Hash the incoming PIN (SHA-256)
    const incomingHash = crypto.createHash('sha256').update(pin).digest('hex');

    if (incomingHash !== hostPinHash) {
      throw new functions.https.HttpsError("permission-denied", "Incorrect PIN.");
    }

    const guestUid = context.auth ? context.auth.uid : "anonymous";

    await db.doc(`restaurants/${restaurantId}/tables/${tableId}`).update({
      hostUid: guestUid
    });

    return { success: true, hostUid: guestUid };
  } catch (error) {
    console.error("Error claiming host:", error);
    throw new functions.https.HttpsError("internal", "Failed to claim host.", error.message);
  }
});
