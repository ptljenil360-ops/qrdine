import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import { updateOrderStatus } from '../../firebase/firestore';
import { useToast } from '../../context/ToastContext';
import OrderCard from '../../components/dashboard/OrderCard';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import { ChefHat, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import { gsap } from 'gsap';

export default function KitchenPage() {
  const { restaurantId } = useAuth();
  const { showToast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true);

  /** Real-time subscription to pending + preparing orders */
  const { orders, loading, error } = useOrders(restaurantId, ['pending', 'preparing']);

  const knownOrderIds = useRef(new Set());
  const isInitialLoad = useRef(true);

  /** Play notification chime for new orders */
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const chime = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      chime.volume = 0.5;
      chime.play().catch(() => {});
    } catch (e) {
      // Audio playback may be blocked by browser policy
    }
  };

  /** Detect new pending orders and alert kitchen staff */
  useEffect(() => {
    if (loading) return;
    const currentIds = new Set(orders.map((o) => o.id));

    if (isInitialLoad.current) {
      knownOrderIds.current = currentIds;
      isInitialLoad.current = false;
      return;
    }

    let hasNewPending = false;
    orders.forEach((order) => {
      if (order.status === 'pending' && !knownOrderIds.current.has(order.id)) {
        hasNewPending = true;
        showToast(`New order for Table ${order.tableNumber}!`, 'info');
      }
    });

    if (hasNewPending) {
      playChime();
    }

    knownOrderIds.current = currentIds;
  }, [orders, loading]);

  /** GSAP entrance animation for KDS cards */
  useEffect(() => {
    gsap.fromTo(
      '.kds-item',
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'back.out(1.5)' }
    );
  }, [loading]);

  /** Update order status handler */
  const handleUpdateStatus = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(restaurantId, orderId, nextStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update order status.', 'error');
    }
  };

  return (
    <div className="space-y-6 font-sans h-full flex flex-col pb-12">

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div>
          <h1 className="text-[24px] font-bold text-[var(--color-text-primary)] mb-[4px]">
            Kitchen Display System
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Live order feed for preparation.
          </p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus:outline-none cursor-pointer"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" />
              <span>Chime On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" />
              <span>Muted</span>
            </>
          )}
        </button>
      </div>

      {/* Main Order Feed content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-20 pb-12 gap-3 w-full">
            <Spinner size="md" color="primary" className="w-8 h-8" />
            <span className="text-[14px] text-[var(--color-text-muted)] font-medium">
              Connecting to live feed...
            </span>
          </div>
        ) : error ? (
          <Card className="text-center py-16 border-red-100 bg-red-50/50">
            <p className="text-sm text-error font-medium">
              Connection error: {error}
            </p>
          </Card>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center w-full">
            <CheckCircle2 className="w-20 h-20 text-[var(--color-text-muted)] mb-4" />
            <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
              Kitchen is Clear
            </h3>
            <p className="text-[14px] text-[var(--color-text-muted)] mt-1">
              Waiting for new orders to arrive.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="kds-item">
                <OrderCard
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}