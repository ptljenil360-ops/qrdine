import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import { updateOrderStatus } from '../../firebase/firestore';
import { useToast } from '../../context/ToastContext';
import OrderCard from '../../components/dashboard/OrderCard';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import { ClipboardList, Search, BellRing, Volume2, VolumeX } from 'lucide-react';
import { gsap } from 'gsap';

export default function OrdersPage() {
  const { restaurantId } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('live');
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const getFilterStatuses = (tab) => {
    switch (tab) {
      case 'live':
        return ['pending', 'preparing'];
      case 'pending':
        return ['pending'];
      case 'preparing':
        return ['preparing'];
      case 'done':
        return ['done'];
      case 'billed':
        return ['billed'];
      case 'all':
      default:
        return ['pending', 'preparing', 'done', 'billed'];
    }
  };

  const { orders, loading, error } = useOrders(restaurantId, getFilterStatuses(activeTab));
  
  const knownOrderIds = useRef(new Set());
  const isInitialLoad = useRef(true);

  const playChime = () => {
    if (!soundEnabled) return;
    const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    chime.play().catch(e => console.log('Audio play failed', e));
  };

  useEffect(() => {
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
        showToast(`New order received from Table ${order.tableNumber}!`, 'info');
      }
    });
    
    if (hasNewPending) {
      playChime();
    }
    
    knownOrderIds.current = currentIds;
  }, [orders, loading]);

  useEffect(() => {
    if (!loading && orders.length > 0) {
      gsap.fromTo('.order-feed-item',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [loading, activeTab]);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(restaurantId, orderId, nextStatus);
      showToast(`Order status updated successfully.`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update order status.', 'error');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const tableMatch = `table ${order.tableNumber}`.includes(searchTerm.toLowerCase()) || 
                       order.tableNumber.toString().includes(searchTerm);
    const itemMatch = order.items.some((item) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return tableMatch || itemMatch;
  });

  const tabs = [
    { label: 'Live Feed', value: 'live' },
    { label: 'New (Pending)', value: 'pending' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Completed', value: 'done' },
    { label: 'Billed', value: 'billed' },
    { label: 'All History', value: 'all' },
  ];

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div>
          <h1 className="font-syne font-[700] text-[28px] tracking-[-0.02em] text-[var(--color-text-primary)] flex items-center gap-2 mb-[4px]">
            Orders Feed
            <span className="relative flex h-3 w-3" title="Live status feed">
              <span className="absolute inline-flex h-full w-full rounded-full bg-error animate-pulse-dot"></span>
            </span>
          </h1>
          <p className="font-inter font-[400] text-[14px] text-[var(--color-text-secondary)]">
            Manage incoming orders and update preparation status in real-time.
          </p>
        </div>
        
        {/* Sound toggle control */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="font-inter font-[600] text-[13px] tracking-[0.02em] flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus:outline-none cursor-pointer glass-card px-3 py-1.5 rounded-full"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 shrink-0 text-accent" />
              <span>Sound Alerts Active</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" />
              <span>Chime Muted</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs and Search Controls Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-5">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-[var(--color-base-card)]/50 p-1 rounded-[8px] border border-[var(--color-border)] backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                isInitialLoad.current = true;
              }}
              className={`font-inter text-[13px] px-[14px] py-[6px] rounded-[6px] transition-all duration-200 focus:outline-none cursor-pointer ${
                activeTab === tab.value
                  ? 'bg-accent text-white font-[600] shadow-sm tracking-[0.02em]'
                  : 'bg-transparent text-[var(--color-text-secondary)] font-[500] hover:bg-[var(--color-base-bg)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Search input */}
        <div className="relative w-full md:w-[240px] md:ml-auto">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search table or dish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="font-inter font-[400] w-full pl-[36px] pr-[12px] py-[10px] leading-normal h-[38px] bg-[var(--color-base-card)]/80 backdrop-blur-sm border border-[var(--color-border)] rounded-[8px] text-[14px] focus:outline-none focus:border-accent transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Main Order Feed content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center pt-20 pb-12 gap-3 w-full glass-card rounded-2xl">
          <Spinner size="md" color="primary" className="w-8 h-8" />
          <span className="text-[14px] text-[var(--color-text-muted)] font-medium">Syncing live orders...</span>
        </div>
      ) : error ? (
        <Card className="text-center py-16 border-red-100 bg-red-50/50">
          <p className="text-sm text-error font-medium">Failed to sync orders: {error}</p>
        </Card>
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center w-full glass-card rounded-2xl px-4">
          <ClipboardList className="w-20 h-20 text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-[16px] font-semibold text-[var(--color-text-secondary)]">No orders found</h3>
          <p className="text-[14px] text-[var(--color-text-muted)] max-w-sm mx-auto mt-1">
            {searchTerm ? "We couldn't find any orders matching your search query." : 'There are no active orders under this category right now.'}
          </p>
        </div>
      ) : (
        /* Grid of Order Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => (
            <div key={order.id} className="order-feed-item neumorphic-card p-1">
              <OrderCard
                order={order}
                onUpdateStatus={handleUpdateStatus}
                variant="glass"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}