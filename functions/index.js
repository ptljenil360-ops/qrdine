const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

/**
 * Triggered when a new order is created or updated.
 * Recalculates the order totals by fetching real prices from the restaurant menu
 * to prevent client-side price spoofing.
 */
exports.recalculateOrderTotals = functions.firestore
  .document("restaurants/{restaurantId}/orders/{orderId}")
  .onWrite(async (change, context) => {
    // If the document was deleted, do nothing
    if (!change.after.exists) {
      return null;
    }

    const orderData = change.after.data();
    const { restaurantId } = context.params;

    // Check if it's an update and items haven't changed to prevent infinite loops
    if (change.before.exists) {
      const beforeData = change.before.data();
      // Fast deep compare for items to avoid unnecessary recalculations
      if (
        JSON.stringify(beforeData.items) === JSON.stringify(orderData.items) &&
        orderData.serverCalculated === true
      ) {
        return null;
      }
    }

    const items = orderData.items || [];
    if (items.length === 0) return null;

    try {
      // 1. Fetch the restaurant profile to get the accurate GST rate
      const restaurantSnap = await db.collection("restaurants").doc(restaurantId).get();
      if (!restaurantSnap.exists) {
        console.error("Restaurant not found:", restaurantId);
        return null;
      }
      const gstRate = restaurantSnap.data().gstRate || 0;

      // 2. Fetch the entire menu for this restaurant (to get trusted prices)
      const menuSnap = await db.collection("restaurants").doc(restaurantId).collection("menu").get();
      const menuMap = {};
      menuSnap.forEach((doc) => {
        menuMap[doc.id] = doc.data();
      });

      // 3. Recalculate totals
      let subtotal = 0;
      const verifiedItems = items.map((item) => {
        const menuItem = menuMap[item.id];
        // If item doesn't exist in DB anymore, use 0 to avoid billing for non-existent items
        const realPrice = menuItem ? Number(menuItem.price) : 0;
        const qty = Number(item.quantity) || 1;
        
        subtotal += realPrice * qty;
        
        return {
          ...item,
          price: realPrice // Enforce server-side price
        };
      });

      const gstAmount = (subtotal * gstRate) / 100;
      const grandTotal = subtotal + gstAmount;

      // 4. Update the order with calculated, trusted totals
      return change.after.ref.update({
        items: verifiedItems,
        subtotal: subtotal,
        gstRate: gstRate,
        gstAmount: gstAmount,
        grandTotal: grandTotal,
        serverCalculated: true,
        recalculatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error("Error recalculating order totals:", error);
      return null;
    }
  });
