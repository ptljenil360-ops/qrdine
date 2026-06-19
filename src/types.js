/**
 * @typedef {Object} Restaurant
 * @property {string} name - Name of the restaurant
 * @property {string} ownerName - Name of the owner
 * @property {string} phone - Contact phone number
 * @property {string} email - Contact email
 * @property {string} username - Username for login
 * @property {string} loginId - Login ID
 * @property {string} [gstNumber] - GST IN number
 * @property {number} [gstRate] - GST rate (e.g. 5)
 * @property {string} [logo] - URL to logo image
 * @property {string} plan - Current subscription plan
 * @property {Object} planExpiry - Firestore Timestamp
 * @property {string} [licenseNumber] - License number
 * @property {string} [address] - Physical address
 * @property {string} language - Interface language
 * @property {string} ownerId - ID of the owner
 * @property {boolean} onboardingComplete - Has completed onboarding
 * @property {Object} createdAt - Firestore Timestamp
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id - The ID of the menu item
 * @property {string} name - Name of the menu item
 * @property {number} price - Price per unit
 * @property {number} quantity - Quantity ordered
 * @property {string} [notes] - Optional special instructions
 */

/**
 * @typedef {Object} Order
 * @property {string} id - Unique order ID
 * @property {string} restaurantId - ID of the restaurant
 * @property {string|number} tableNumber - The table number
 * @property {string} tableId - The table ID document reference
 * @property {string} status - ORDER_STATUS value
 * @property {OrderItem[]} items - Array of items ordered
 * @property {number} subtotal - Order subtotal
 * @property {number} gstRate - GST rate applied (e.g. 5)
 * @property {number} gstAmount - Calculated GST
 * @property {number} grandTotal - Final amount including GST
 * @property {string} [customerPhone] - Phone number (if captured)
 * @property {string} [waiterId] - Waiter who took the order (optional)
 * @property {Object} createdAt - Firestore Timestamp
 * @property {Object} [updatedAt] - Firestore Timestamp
 * @property {boolean} [paymentReceived] - Whether payment was received
 * @property {string} [paymentMethod] - Method of payment
 */

/**
 * @typedef {Object} Bill
 * @property {string} orderId - ID of the associated order
 * @property {OrderItem[]} items - Array of items billed
 * @property {number} subtotal - Bill subtotal
 * @property {number} gstAmount - Calculated GST
 * @property {number} grandTotal - Final amount including GST
 * @property {string} paymentMethod - Method of payment
 * @property {Object} billedAt - Firestore Timestamp
 * @property {string|number} tableNumber - The table number
 */

/**
 * @typedef {Object} Table
 * @property {string} id - Unique table ID
 * @property {string|number} number - Table number
 * @property {string} status - TABLE_STATUS value
 * @property {number} capacity - Seating capacity
 * @property {string} [currentSessionId] - Active session ID if occupied
 * @property {number} [sessionStartTime] - Unix timestamp of session start
 * @property {string} [assignedWaiter] - Waiter ID assigned
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id - The ID of the menu item
 * @property {string} name - Name of the menu item
 * @property {number} price - Price per unit
 * @property {number} quantity - Quantity in cart
 * @property {string} [notes] - Optional special instructions
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} id - Unique menu item ID
 * @property {string} name - Name of the dish
 * @property {number} price - Price
 * @property {string} category - Category (e.g. Starters)
 * @property {string} [description] - Dish description
 * @property {string} [image] - URL to dish image (Firebase Storage)
 * @property {boolean} isAvailable - Whether the dish is in stock
 * @property {boolean} isVeg - Veg/Non-Veg marker
 */
