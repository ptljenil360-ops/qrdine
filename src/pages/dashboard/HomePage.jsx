import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTables } from '../../hooks/useTables';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { formatCurrency } from '../../utils/formatCurrency';
import StatCard from '../../components/dashboard/StatCard';
import OrderCard from '../../components/dashboard/OrderCard';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ClipboardList, IndianRupee, LayoutGrid, TrendingUp, Utensils, ChevronRight, Plus } from 'lucide-react';
import { gsap } from 'gsap';

export default function HomePage() {
  const { restaurant, restaurantId } = useAuth();
  const { tables, loading: tablesLoading } = useTables(restaurantId);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [stats, setStats] = useState({
    ordersCount: 0,
    revenue: 0,
    activeTables: 0,
    topDish: 'None',
  });

  useEffect(() => {
    if (!ordersLoading && !tablesLoading) {
      gsap.fromTo('.home-fade-in',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [ordersLoading, tablesLoading]);

  useEffect(() => {
    if (!restaurantId) return;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const qOrders = query(
      collection(db, `restaurants/${restaurantId}/orders`),
      where('createdAt', '>=', startOfToday)
    );

    const unsubscribe = onSnapshot(
      qOrders,
      (snapshot) => {
        const todayOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(todayOrders);
        setOrdersLoading(false);
      },
      (err) => {
        console.error('Error fetching today\'s orders:', err);
        setOrdersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [restaurantId]);

  useEffect(() => {
    if (ordersLoading || tablesLoading) return;

    const ordersCount = orders.length;
    const revenue = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
    const activeTables = tables.filter((t) => t.status !== 'free').length;
    
    const dishSales = {};
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        dishSales[item.name] = (dishSales[item.name] || 0) + (item.quantity || 0);
      });
    });
    
    let topDish = 'None';
    let maxQty = 0;
    Object.entries(dishSales).forEach(([name, qty]) => {
      if (qty > maxQty) {
        maxQty = qty;
        topDish = `${name} (${qty} sold)`;
      }
    });

    setStats({
      ordersCount,
      revenue,
      activeTables,
      topDish,
    });
  }, [orders, tables, ordersLoading, tablesLoading]);

  const getCurrentDateString = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const activeOrders = orders
    .filter((o) => o.status === 'pending' || o.status === 'preparing')
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Welcome header banner (Mini Hero) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 home-fade-in mb-5 p-6 rounded-2xl bg-[var(--color-base-card)] shadow-[var(--shadow-card)] relative overflow-hidden border border-[var(--color-border)]">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="font-syne font-[700] text-[28px] tracking-[-0.02em] mb-[4px] text-gradient">
            Namaste, {restaurant?.ownerName || 'Owner'}!
          </h1>
          <p className="font-inter font-[400] text-[14px] text-[var(--color-text-secondary)] flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            Here's what's happening at <span className="font-inter font-[600] text-[var(--color-text-primary)]">{restaurant?.name}</span> today, {getCurrentDateString()}
          </p>
        </div>
        
        <div className="flex gap-3 relative z-10">
          <button 
            onClick={() => navigate('/dashboard/menu')}
            className="font-inter font-[600] text-[13px] tracking-[0.02em] flex items-center gap-2 px-4 py-2 border border-[#E8E8E8] bg-[#FFFFFF] text-[#1C1C1C] rounded-[8px] hover:bg-gray-50 transition-colors"
          >
            <Utensils className="w-4 h-4" /> Manage Menu
          </button>
          <button 
            onClick={() => navigate('/dashboard/orders')}
            className="font-inter font-[600] text-[13px] tracking-[0.02em] flex items-center gap-2 px-4 py-2 bg-[#F97316] text-[#FFFFFF] rounded-[8px] hover:bg-[#EA580C] transition-colors"
          >
            <ClipboardList className="w-4 h-4" /> Live Feed
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 home-fade-in">
        <div className="bg-[var(--color-base-card)] rounded-[16px] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 transition-transform hover:-translate-y-1">
          <StatCard title="Revenue Today" value={stats.revenue} prefix="Rs. " icon={IndianRupee} />
        </div>
        <div className="bg-[var(--color-base-card)] rounded-[16px] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 transition-transform hover:-translate-y-1">
          <StatCard title="Orders Today" value={stats.ordersCount} icon={ClipboardList} />
        </div>
        <div className="bg-[var(--color-base-card)] rounded-[16px] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 transition-transform hover:-translate-y-1">
          <StatCard title="Active Tables" value={stats.activeTables} suffix={` / ${tables.length}`} icon={LayoutGrid} />
        </div>
        <div className="bg-[var(--color-base-card)] rounded-[16px] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-5 transition-transform hover:-translate-y-1">
          <StatCard title="Top Selling Dish" value={stats.topDish} icon={TrendingUp} />
        </div>
      </div>

      {/* Grid Layout: Active Orders vs Tables Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 home-fade-in mt-8">
        
        {/* Left Side: Recent Active Orders */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
            <h3 className="font-syne font-[600] text-[14px] tracking-[0.04em] uppercase text-[var(--color-text-primary)]">RECENT LIVE ORDERS</h3>
            <button
              onClick={() => navigate('/dashboard/orders')}
              className="text-[13px] font-[600] text-[#F97316] hover:text-[#EA580C] flex items-center gap-1 transition-colors group"
            >
              See All Live Orders <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {ordersLoading ? (
            <div className="flex flex-col items-center justify-center pt-20 pb-12 gap-3 w-full bg-[var(--color-base-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] rounded-[16px]">
              <Spinner size="md" color="primary" className="w-8 h-8" />
              <span className="text-[14px] text-[var(--color-text-muted)] font-medium">Loading live orders...</span>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center w-full bg-[var(--color-base-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] rounded-[16px] px-4">
              <ClipboardList className="w-20 h-20 text-[var(--color-text-muted)] mb-4 opacity-50" />
              <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">No active orders right now</h3>
              <p className="text-[13px] text-[var(--color-text-secondary)] max-w-sm mx-auto mt-1">
                Orders placed from tables will show up here instantly in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-[var(--color-base-card)] shadow-[var(--shadow-card)] rounded-[16px] border border-[var(--color-border)] p-1">
                  <OrderCard
                    order={order}
                    onUpdateStatus={() => navigate('/dashboard/orders')}
                    variant="glass"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Tables Overview Quick Grid */}
        <div className="space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
            <h3 className="font-syne font-[600] text-[14px] tracking-[0.04em] uppercase text-[var(--color-text-primary)]">TABLES QUICK-VIEW</h3>
            <button
              onClick={() => navigate('/dashboard/tables')}
              className="text-[13px] font-[600] text-[#F97316] hover:text-[#EA580C] flex items-center gap-1 transition-colors group"
            >
              Manage <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {tablesLoading ? (
            <div className="flex flex-col items-center justify-center pt-20 pb-12 gap-3 w-full bg-[var(--color-base-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] rounded-[16px]">
              <Spinner size="md" color="primary" className="w-8 h-8" />
              <span className="text-[14px] text-[var(--color-text-muted)] font-medium">Loading table grid...</span>
            </div>
          ) : tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center w-full bg-[var(--color-base-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] rounded-[16px] px-4">
              <LayoutGrid className="w-16 h-16 text-[var(--color-text-muted)] mb-4 opacity-50" />
              <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">No tables configured</h3>
              <p className="text-[13px] text-[var(--color-text-secondary)] max-w-sm mx-auto mt-1 mb-4">
                Please set up your dining room layout to generate QR codes.
              </p>
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="flex items-center gap-1.5 bg-[#F97316] text-white px-4 py-2 rounded-[8px] text-[13px] font-semibold hover:bg-[#EA580C] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Tables
              </button>
            </div>
          ) : (
            <Card className="p-5 shadow-[var(--shadow-card)] border-[var(--color-border)] bg-[var(--color-base-card)] rounded-[16px]">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 gap-3.5">
                {tables
                  .sort((a, b) => a.tableNumber - b.tableNumber)
                  .map((t) => {
                    const statusColors = {
                      free: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] hover:bg-[#DCFCE7]',
                      occupied: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] hover:bg-[#FEE2E2]',
                      'bill-requested': 'bg-[#FEFCE8] text-[#854D0E] border-[#FEF08A] hover:bg-[#FEF9C3] animate-pulse',
                    };
                    const colorClass = statusColors[t.status] || 'bg-[var(--color-base-bg)] text-[var(--color-text-primary)] border-[var(--color-border)]';
                    
                    return (
                      <button
                        key={t.id}
                        onClick={() => navigate('/dashboard/tables')}
                        className={`font-syne font-[700] text-[16px] tracking-[-0.01em] aspect-square rounded-[12px] border flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-md ${colorClass}`}
                        title={`Table ${t.tableNumber}: ${t.status}`}
                      >
                        <span>T{t.tableNumber}</span>
                      </button>
                    );
                  })}
              </div>
              
              {/* Grid Legend */}
              <div className="flex flex-wrap gap-4 mt-6 border-t border-[var(--color-border)] pt-4 text-[11px] uppercase tracking-wider font-[600] text-[var(--color-text-secondary)] justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                  <span>Free</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] animate-pulse" />
                  <span>Bill Req</span>
                </div>
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}