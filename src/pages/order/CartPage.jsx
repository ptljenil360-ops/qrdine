import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRestaurant } from '../../hooks/useRestaurant';
import { createOrder, updateTableStatus } from '../../firebase/firestore';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { formatCurrency, calculateBill } from '../../utils/formatCurrency';
import { useToast } from '../../context/ToastContext';
import CartItem from '../../components/order/CartItem';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { ArrowLeft, ClipboardCheck, ShoppingBag, Receipt, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';

export default function CartPage() {
  const { restaurantId, tableId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { restaurant, loading: restaurantLoading } = useRestaurant(restaurantId);

  const [cart, setCart] = useState([]);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const sessionToken = searchParams.get('session');
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [customerRole, setCustomerRole] = useState(null);

  // Load cart on mount and subscribe to table updates... wait, we need real-time cart updates!
  // To avoid rewriting to onSnapshot here, we can just use the table state if we use a real-time hook.
  // We don't have a real-time hook for a single table yet, so let's import useTables.

  // Load cart on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load cart:', err);
    }
  }, [cartKey]);

  // Fetch Table details to resolve Table Number
  useEffect(() => {
    if (!restaurantId || !tableId) return;

    const fetchTable = async () => {
      try {
        const snap = await getDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId));
        if (snap.exists()) {
          setTable({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.warn('Failed to fetch table:', err);
      } finally {
        setTableLoading(false);
      }
    };

    fetchTable();
  }, [restaurantId, tableId]);

  // Entrance animations
  useEffect(() => {
    if (!tablesLoading && !restaurantLoading) {
      gsap.fromTo(
        '.cart-fade-in',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [tablesLoading, restaurantLoading]);

  // Persist cart helper
  const saveCart = async (newCart) => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId), {
        cart: newCart
      });
    } catch (err) {
      console.warn('Failed to save cart:', err);
      showToast('Failed to update shared cart', 'error');
    }
  };

  // Adjust item quantity
  const handleUpdateQty = (itemId, change) => {
    const existing = cart.find((item) => item.id === itemId);
    if (!existing) return;

    const newQty = existing.quantity + change;
    let newCart;

    if (newQty <= 0) {
      newCart = cart.filter((item) => item.id !== itemId);
    } else {
      // If adding, check stock limits
      if (change > 0 && existing.stockLimit && existing.quantity >= existing.currentStock) {
        showToast(`Cannot add more. Only ${existing.currentStock} items in stock.`, 'warning');
        return;
      }
      newCart = cart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQty } : item
      );
    }
    saveCart(newCart);
  };

  // Update item instructions/notes
  const handleUpdateNote = (itemId, noteText) => {
    const newCart = cart.map((item) =>
      item.id === itemId ? { ...item, note: noteText } : item
    );
    saveCart(newCart);
  };

  // Compute bill details
  const gstRate = restaurant?.gstRate || 5;
  const bill = calculateBill(cart, gstRate);

  const handleSubmitOrder = async () => {
    if (loading) return;

    if (cart.length === 0) {
      showToast('Your cart is empty.', 'error');
      return;
    }

    // Client-side rate limiting throttle: 10 second cooldown between orders
    const lastOrderTime = localStorage.getItem('qrdine_last_order_time');
    if (lastOrderTime && Date.now() - Number(lastOrderTime) < 10000) {
      showToast('Please wait a few seconds before placing another order.', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Helper to strip HTML and limit size to 200 characters to prevent injection/XSS
      const sanitizeNote = (text) => {
        if (!text) return '';
        return text.replace(/<[^>]*>/g, '').trim().substring(0, 200);
      };

      const orderItems = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: sanitizeNote(item.note),
        category: item.category || 'Other',
      }));

      // Submit Order document to Firestore
      const orderId = await createOrder(restaurantId, {
        tableId: tableId,
        tableNumber: table?.tableNumber || Number(tableId) || 0,
        items: orderItems,
        subtotal: bill.subtotal,
        gstRate: bill.gstRate,
        gstAmount: bill.gstAmount,
        grandTotal: bill.grandTotal,
      });

      // Update table occupancy status to 'occupied'
      await updateTableStatus(restaurantId, tableId, 'occupied');

      // Set last order timestamp for throttling
      localStorage.setItem('qrdine_last_order_time', Date.now().toString());

      // Clear local cart logic replaced by shared cart clearance
      saveCart([]);

      showToast('Order placed successfully!', 'success');
      navigate(`/order/${restaurantId}/${tableId}/confirmed`, {
        state: { orderId, grandTotal: bill.grandTotal, items: orderItems },
      });
    } catch (err) {
      console.error('Submit order error:', err);
      showToast('Failed to place order. Please check your network and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isPageLoading = restaurantLoading || tablesLoading;

  if (!isSessionValid) {
    return (
      <div className="min-h-screen bg-[var(--color-customer-bg)] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-[var(--color-customer-text)] mb-2">Session Expired</h2>
        <p className="text-[var(--color-customer-muted)]">This QR code is no longer active.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-customer-bg)] text-[var(--color-customer-text)] font-sans pb-12">
      {/* Sticky Header with Glassmorphism */}
      <header className="sticky top-0 bg-[var(--color-customer-bg)]/80 backdrop-blur-md border-b border-[var(--color-customer-border)] z-30 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate(`/order/${restaurantId}/${tableId}?session=${sessionToken}`)}
          className="p-1 hover:bg-[var(--color-base-card)] rounded-full transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--color-customer-text)]"
          aria-label="Back to menu"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-black text-[var(--color-customer-text)] text-base leading-tight">Your Cart</h1>
          <p className="text-[10px] text-accent font-bold uppercase mt-0.5 tracking-wide">
            Table {table?.tableNumber || '...'} • {restaurant?.name}
          </p>
        </div>
      </header>

      {isPageLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Spinner size="lg" />
          <span className="text-sm text-text-muted font-bold">Reviewing items...</span>
        </div>
      ) : cart.length === 0 ? (
        /* Empty Cart State */
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-[var(--color-base-card)] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--color-customer-muted)] shadow-inner">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-[var(--color-customer-text)]">Your cart is empty</h3>
          <p className="text-sm text-[var(--color-customer-muted)] mt-2 mb-8 max-w-[250px] mx-auto">
            Go back to the digital menu to select delicious dishes.
          </p>
          <Button
            onClick={() => navigate(`/order/${restaurantId}/${tableId}?session=${sessionToken}`)}
            className="w-full font-bold shadow-md bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0"
            size="lg"
            icon={ArrowLeft}
          >
            Back to Digital Menu
          </Button>
        </div>
      ) : (
        /* Cart Page Content */
        <main className="max-w-xl mx-auto px-4 py-6 space-y-8">
          
          {/* Cart Items List */}
          <div className="space-y-4 cart-fade-in opacity-0">
            <h3 className="font-black text-[var(--color-customer-text)] text-[15px] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Selected Dishes
            </h3>
            <div className="space-y-3">
              {cart.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onAdd={() => handleUpdateQty(item.id, 1)}
                  onRemove={() => handleUpdateQty(item.id, -1)}
                  onUpdateNote={(note) => handleUpdateNote(item.id, note)}
                  stockLimit={item.stockLimit}
                  maxAvailable={item.currentStock}
                />
              ))}
            </div>
          </div>

          {/* Pricing breakdown card */}
          <Card variant="neumorphic" className="p-6 space-y-4 cart-fade-in opacity-0">
            <h3 className="font-black text-[var(--color-customer-text)] text-[15px] uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-[var(--color-customer-border)]">
              <Receipt className="w-4 h-4 text-accent" />
              Bill Summary
            </h3>

            <div className="space-y-3 text-sm text-[var(--color-customer-muted)] font-medium">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-[var(--color-customer-text)]">{formatCurrency(bill.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST ({gstRate}%)</span>
                <span className="font-bold text-[var(--color-customer-text)]">{formatCurrency(bill.gstAmount)}</span>
              </div>
              
              <div className="border-t border-[var(--color-customer-border)] pt-4 flex justify-between items-baseline">
                <span className="font-syne font-[700] text-[16px] text-[var(--color-customer-text)] uppercase tracking-wide">Grand Total</span>
                <span className="font-syne font-[700] text-[24px] text-accent">{formatCurrency(bill.grandTotal)}</span>
              </div>
            </div>
          </Card>

          {/* Place order CTA */}
          <div className="pt-2 cart-fade-in opacity-0">
            {customerRole === 'host' ? (
              <>
                <Button
                  onClick={handleSubmitOrder}
                  loading={loading}
                  className="font-syne font-[700] w-full text-[16px] h-14 shadow-lg shadow-emerald-600/30 bg-emerald-600 text-white border-0 hover:bg-emerald-700 hover:scale-[1.02] transition-transform"
                  size="lg"
                  icon={ClipboardCheck}
                >
                  Place Order (Host)
                </Button>
                <p className="text-[11px] text-[var(--color-customer-muted)] font-medium text-center mt-4 px-4 leading-relaxed">
                  Confirming will instantly alert the kitchen. You can call service or request a printed bill once seated.
                </p>
              </>
            ) : (
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-center">
                <p className="text-[13px] font-bold text-orange-600 dark:text-orange-400 mb-1">Waiting for Host</p>
                <p className="text-[11px] text-[var(--color-customer-muted)] font-medium">
                  Only the Table Host can send the final order to the kitchen.
                </p>
              </div>
            )}
          </div>

        </main>
      )}
    </div>
  );
}
