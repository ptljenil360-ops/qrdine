import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { updateTableStatus } from '../../firebase/firestore';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Check, Bell, Receipt, ShoppingBag } from 'lucide-react';
import { gsap } from 'gsap';

export default function ConfirmationPage() {
  const { restaurantId, tableId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // Retrieve state passed from the Cart page redirect
  const { orderId, grandTotal, items } = location.state || {
    orderId: 'Unknown',
    grandTotal: 0,
    items: [],
  };

  // Entrance animations
  useEffect(() => {
    gsap.fromTo(
      '.confirm-anim',
      { scale: 0.95, opacity: 0, y: 10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.2)' }
    );
  }, []);

  // Call Waiter handler
  const handleCallWaiter = () => {
    // Shows user-facing feedback immediately.
    // In V1, we show a success toast.
    showToast('Waiter has been called to your table!', 'success');
  };

  // Request Bill handler
  const handleRequestBill = async () => {
    try {
      // Updates table status to 'bill-requested' so the TableCard in the dashboard flashes yellow
      await updateTableStatus(restaurantId, tableId, 'bill-requested');
      showToast('Bill request sent to host! Please wait.', 'success');
    } catch (err) {
      console.error('Request bill failed:', err);
      showToast('Failed to request bill. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-customer-bg)] font-sans py-10 px-4 flex flex-col justify-center items-center overflow-hidden text-[var(--color-customer-text)]">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-500/10 dark:bg-green-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Placed Card */}
        <Card variant="glass" className="p-8 text-center space-y-6 confirm-anim border border-green-500/20 dark:border-green-500/30">
          {/* Animated checkmark */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30 relative">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
            </svg>
          </div>

          <div>
            <h2 className="text-3xl font-black text-[var(--color-customer-text)] mb-2">Order Sent!</h2>
            <p className="text-[15px] text-[var(--color-customer-muted)] leading-relaxed max-w-[250px] mx-auto">
              Your order <span className="font-black text-[var(--color-customer-text)] px-1 bg-[var(--color-base-card)] rounded">#{orderId.slice(-6).toUpperCase()}</span> is currently being prepared by the kitchen.
            </p>
          </div>

          <div className="bg-[var(--color-base-card)]/50 backdrop-blur-sm border border-[var(--color-customer-border)] rounded-2xl p-5 text-center shadow-inner">
            <p className="text-[var(--color-customer-muted)] text-sm mb-1 font-medium">Grand Total</p>
            <p className="text-3xl font-black text-accent">{formatCurrency(grandTotal)}</p>
          </div>
        </Card>

        {/* Order Summary (Items List) */}
        {items.length > 0 && (
          <Card variant="neumorphic" className="p-6 space-y-4 confirm-anim">
            <h3 className="font-black text-text-primary dark:text-slate-200 text-sm uppercase tracking-widest border-b border-border dark:border-slate-800 pb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-accent" />
              Order Details
            </h3>

            <div className="space-y-3.5 max-h-[30vh] overflow-y-auto pr-2 scrollbar-thin">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm text-text-secondary dark:text-slate-300 font-medium">
                  <span className="flex-1 pr-4">
                    <span className="font-bold text-accent mr-1.5">{item.quantity}x</span> 
                    <span className="font-bold text-text-primary dark:text-slate-100">{item.name}</span>
                  </span>
                  <span className="font-bold text-text-primary dark:text-slate-200">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border dark:border-slate-800 pt-4 flex justify-between items-baseline">
              <span className="text-sm font-black text-text-primary dark:text-slate-200 uppercase tracking-wide">Amount Paid/Due</span>
              <span className="text-xl font-black text-accent">{formatCurrency(grandTotal)}</span>
            </div>
          </Card>
        )}

        {/* Services & Actions */}
        <div className="space-y-4 confirm-anim">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCallWaiter}
              icon={Bell}
              className="bg-[var(--color-customer-bg)]/80 backdrop-blur-md border-[var(--color-customer-border)] text-[var(--color-customer-text)] font-bold shadow-sm"
              size="lg"
            >
              Call Waiter
            </Button>
            <Button
              variant="outline"
              onClick={handleRequestBill}
              icon={Receipt}
              className="bg-[var(--color-customer-bg)]/80 backdrop-blur-md border-[var(--color-customer-border)] text-[var(--color-customer-text)] font-bold shadow-sm"
              size="lg"
            >
              Request Bill
            </Button>
          </div>

          <Button
            onClick={() => navigate(`/order/${restaurantId}/${tableId}`)}
            className="w-full font-black text-[16px] h-14 shadow-lg shadow-orange-500/30 bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0 hover:scale-[1.02] transition-transform"
            size="lg"
            icon={ShoppingBag}
          >
            Order More Food
          </Button>
        </div>

      </div>
    </div>
  );
}
