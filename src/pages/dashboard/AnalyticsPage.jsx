import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { formatCurrency } from '../../utils/formatCurrency';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import StatCard from '../../components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, ShoppingBag, Award, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';

export default function AnalyticsPage() {
  const { restaurantId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    revenue7Days: 0,
    orders7Days: 0,
    aov: 0,
    bestCategory: 'None',
  });

  useEffect(() => {
    if (!loading) {
      gsap.fromTo('.analytics-fade-in',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [loading]);

  useEffect(() => {
    if (!restaurantId) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const q = query(
      collection(db, `restaurants/${restaurantId}/orders`),
      where('createdAt', '>=', sevenDaysAgo)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(fetchOrders);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching analytics orders:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [restaurantId]);

  useEffect(() => {
    if (loading) return;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataMap = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - idx);
      return {
        dateString: d.toDateString(),
        dayLabel: days[d.getDay()],
        displayDate: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue: 0,
        orders: 0,
      };
    }).reverse();

    let revenue7Days = 0;
    let orders7Days = 0;
    const dishSales = {};
    const categorySales = {};

    orders.forEach((order) => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const dayMatch = dataMap.find((item) => item.dateString === orderDate.toDateString());
      if (dayMatch) {
        dayMatch.revenue += order.grandTotal || 0;
        dayMatch.orders += 1;
      }
      revenue7Days += order.grandTotal || 0;
      orders7Days += 1;

      order.items?.forEach((item) => {
        const qty = item.quantity || 0;
        dishSales[item.name] = (dishSales[item.name] || 0) + qty;
        
        const category = item.category || 'Other';
        categorySales[category] = (categorySales[category] || 0) + qty;
      });
    });

    setWeeklyRevenue(dataMap);

    const sortedDishes = Object.entries(dishSales)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    setTopDishes(sortedDishes);

    let bestCategory = 'None';
    let maxCatQty = 0;
    Object.entries(categorySales).forEach(([cat, qty]) => {
      if (qty > maxCatQty) {
        maxCatQty = qty;
        bestCategory = cat;
      }
    });

    const aov = orders7Days > 0 ? Math.round(revenue7Days / orders7Days) : 0;
    setSummaryStats({ revenue7Days, orders7Days, aov, bestCategory });
  }, [orders, loading]);

  const formatYAxis = (tick) => {
    if (tick >= 1000) {
      return `Rs.${(tick / 1000).toFixed(1)}k`;
    }
    return `Rs.${tick}`;
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Header */}
      <div className="mb-5">
        <h1 className="text-[24px] font-[700] text-[var(--color-text-primary)] mb-[4px]">
          Performance Analytics
        </h1>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          Review weekly sales patterns, popular dishes, and customer ordering metrics.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center pt-20 pb-12 gap-3 w-full bg-[var(--color-base-card)] shadow-[var(--shadow-card)] rounded-[16px] border border-[var(--color-border)]">
          <Spinner size="md" color="primary" className="w-8 h-8" />
          <span className="text-[14px] text-[var(--color-text-muted)] font-[500]">Generating stats dashboard...</span>
        </div>
      ) : (
        <>
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 analytics-fade-in mb-5">
            <div className="bg-[var(--color-base-card)] shadow-[var(--shadow-card)] border border-[var(--color-border)] rounded-[16px] p-4 transition-transform hover:-translate-y-1">
              <StatCard title="7-Day Revenue" value={summaryStats.revenue7Days} prefix="Rs. " icon={TrendingUp} />
            </div>
            <div className="bg-[var(--color-base-card)] shadow-[var(--shadow-card)] border border-[var(--color-border)] rounded-[16px] p-4 transition-transform hover:-translate-y-1">
              <StatCard title="7-Day Orders" value={summaryStats.orders7Days} icon={ShoppingBag} />
            </div>
            <div className="bg-[var(--color-base-card)] shadow-[var(--shadow-card)] border border-[var(--color-border)] rounded-[16px] p-4 transition-transform hover:-translate-y-1">
              <StatCard title="Avg. Order Value (AOV)" value={summaryStats.aov} prefix="Rs. " icon={BarChart3} />
            </div>
            <div className="bg-[var(--color-base-card)] shadow-[var(--shadow-card)] border border-[var(--color-border)] rounded-[16px] p-4 transition-transform hover:-translate-y-1">
              <StatCard title="Top Category" value={summaryStats.bestCategory} icon={Award} />
            </div>
          </div>

          {/* Chart & Top Dishes Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 analytics-fade-in">
            {/* Weekly Revenue Chart Card */}
            <Card className="lg:col-span-2 bg-[var(--color-base-card)] border border-[var(--color-border)] flex flex-col justify-between shadow-[var(--shadow-card)] p-6 min-h-[420px] rounded-[16px]">
              <div>
                <h3 className="text-[15px] font-[700] text-[var(--color-text-primary)]">WEEKLY REVENUE</h3>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5 mb-6">
                  Sales breakdown for the past 7 days
                </p>
              </div>
              <div className="flex-1 w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyRevenue}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                    <XAxis
                      dataKey="dayLabel"
                      stroke="#696969"
                      fontSize={12}
                      fontWeight="600"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#696969"
                      fontSize={12}
                      fontWeight="600"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip
                      cursor={{ fill: '#F4F4F4', opacity: 0.5 }}
                      contentStyle={{
                        background: 'var(--color-base-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--color-text-primary)',
                        boxShadow: 'var(--shadow-card)',
                      }}
                      formatter={(val) => [formatCurrency(val), 'Revenue']}
                      labelFormatter={(label, items) => {
                        const dateInfo = items[0]?.payload?.displayDate || '';
                        return `${label} (${dateInfo})`;
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#F97316"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Top Dishes List Card */}
            <Card className="bg-[var(--color-base-card)] border border-[var(--color-border)] flex flex-col shadow-[var(--shadow-card)] p-6 justify-between rounded-[16px]">
              <div>
                <h3 className="text-[15px] font-[700] text-[var(--color-text-primary)] uppercase">Top 5 Dishes</h3>
                <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5 mb-6">
                  Most ordered dishes in the last 7 days
                </p>
              </div>
              
              {topDishes.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center text-[var(--color-text-muted)] py-12">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-[14px] font-[600]">No order data yet</p>
                </div>
              ) : (
                <div className="flex-1 space-y-4">
                  {topDishes.map((dish, index) => {
                    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
                    const medalBgColors = [
                      'bg-orange-50 border-orange-100 text-[#F97316]',
                      'bg-[var(--color-base-bg)] border-[var(--color-border)] text-[#1C1C1C]',
                      'bg-amber-50 border-amber-200 text-amber-800',
                      'bg-[var(--color-base-bg)] border-[var(--color-border)] text-[var(--color-text-secondary)]',
                      'bg-[var(--color-base-bg)] border-[var(--color-border)] text-[var(--color-text-secondary)]',
                    ];
                    
                    return (
                      <div
                        key={dish.name}
                        className="flex items-center justify-between p-3.5 bg-[var(--color-base-bg)] border border-[var(--color-border)] rounded-[8px]"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full border flex items-center justify-center font-[700] text-[14px] ${medalBgColors[index] || ''}`}
                          >
                            {medals[index] || `${index + 1}.`}
                          </span>
                          <span className="font-[700] text-[var(--color-text-primary)] text-[14px]">{dish.name}</span>
                        </div>
                        <span className="text-[12px] font-[800] text-[#FFFFFF] bg-[#F97316] px-2.5 py-1 rounded-[999px]">
                          {dish.quantity} sold
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* V2 Hint info bar */}
              <div className="mt-6 bg-[var(--color-base-bg)] border border-[var(--color-border)] rounded-[8px] p-3 text-center flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F97316]" />
                <span className="text-[12px] font-[700] text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Heatmaps & Peak Hours in V2
                </span>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}