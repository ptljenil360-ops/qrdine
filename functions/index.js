const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

/**
 * Triggered when a new order is created.
 * Calculates the order totals by fetching real prices from the restaurant menu
 * to prevent client-side price spoofing, and stores them in a separate field.
 */
exports.calculateInitialOrderTotals = functions.firestore
  .document("restaurants/{restaurantId}/orders/{orderId}")
  .onCreate(async (snap, context) => {
    const orderData = snap.data();
    const { restaurantId } = context.params;

    const items = orderData.items || [];
    if (items.length === 0) return null;

    try {
      const restaurantSnap = await db.collection("restaurants").doc(restaurantId).get();
      if (!restaurantSnap.exists) return null;
      const gstRate = restaurantSnap.data().gstRate || 0;

      const menuSnap = await db.collection("restaurants").doc(restaurantId).collection("menu").get();
      const menuMap = {};
      menuSnap.forEach((doc) => {
        menuMap[doc.id] = doc.data();
      });

      let subtotal = 0;
      items.forEach((item) => {
        const menuItem = menuMap[item.id];
        const realPrice = menuItem ? Number(menuItem.price) : 0;
        const qty = Number(item.quantity) || 1;
        subtotal += realPrice * qty;
      });

      const gstAmount = (subtotal * gstRate) / 100;
      const grandTotal = subtotal + gstAmount;

      return snap.ref.update({
        serverTotals: {
          subtotal,
          gstRate,
          gstAmount,
          grandTotal,
          calculatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
    } catch (error) {
      console.error("Error calculating initial order totals:", error);
      return null;
    }
  });

/**
 * Triggered when an order is updated.
 * Only recalculates if items have changed, writing to serverTotals.
 */
exports.recalculateOrderTotalsOnUpdate = functions.firestore
  .document("restaurants/{restaurantId}/orders/{orderId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const { restaurantId } = context.params;

    // Only recalculate if items array changed
    if (JSON.stringify(beforeData.items) === JSON.stringify(afterData.items)) {
      return null;
    }

    const items = afterData.items || [];
    if (items.length === 0) return null;

    try {
      const restaurantSnap = await db.collection("restaurants").doc(restaurantId).get();
      if (!restaurantSnap.exists) return null;
      const gstRate = restaurantSnap.data().gstRate || 0;

      const menuSnap = await db.collection("restaurants").doc(restaurantId).collection("menu").get();
      const menuMap = {};
      menuSnap.forEach((doc) => {
        menuMap[doc.id] = doc.data();
      });

      let subtotal = 0;
      items.forEach((item) => {
        const menuItem = menuMap[item.id];
        const realPrice = menuItem ? Number(menuItem.price) : 0;
        const qty = Number(item.quantity) || 1;
        subtotal += realPrice * qty;
      });

      const gstAmount = (subtotal * gstRate) / 100;
      const grandTotal = subtotal + gstAmount;

      return change.after.ref.update({
        serverTotals: {
          subtotal,
          gstRate,
          gstAmount,
          grandTotal,
          calculatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
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
        // Delete from login registry
        await db.collection("loginRegistry").doc(rData.loginId).delete();
      }
    }

    // Recursively delete the restaurant document and all subcollections
    // Node.js Admin SDK provides recursiveDelete natively for db references.
    await db.recursiveDelete(restaurantRef);

    // Delete the Auth user
    await admin.auth().deleteUser(uid);

    return { success: true };
  } catch (error) {
    console.error("Error deleting restaurant account:", error);
    throw new functions.https.HttpsError("internal", "Failed to delete account.", error.message);
  }
});

