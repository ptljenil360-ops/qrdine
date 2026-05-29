import React, { useEffect, useState } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Sticky Bottom Cart Bar for Customer Menu Page.
 * Features a subtle bounce animation when the itemCount changes.
 */
export default function FloatingCartBar({
  itemCount,
  totalAmount,
  onClick,
}) {
  const [shouldBounce, setShouldBounce] = useState(false);

  // Trigger bounce animation on itemCount change
  useEffect(() => {
    if (itemCount > 0) {
      setShouldBounce(true);
      const timer = setTimeout(() => setShouldBounce(false), 300);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 max-w-xl mx-auto px-4 pointer-events-none">
      <button
        onClick={onClick}
        className={`
          w-full 
          min-h-[64px]
          flex items-center justify-between 
          gradient-accent
          active:scale-[0.98] 
          text-white 
          px-5 py-3
          rounded-2xl
          shadow-[0_8px_32px_rgba(249,115,22,0.3)]
          transition-all duration-300 
          focus:outline-none pointer-events-auto
          border border-orange-400/30
          ${shouldBounce ? 'animate-bounce-subtle' : ''}
        `}
      >
        {/* Left: Count and Icon */}
        <div className="flex items-center gap-3.5">
          <div className="relative p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
            <ShoppingBag className="w-5 h-5 text-white" />
            <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 text-[11px] font-black rounded-full w-[20px] h-[20px] flex items-center justify-center shadow-md">
              {itemCount}
            </span>
          </div>
          <div className="text-left flex flex-col justify-center">
            <p className="text-[12px] text-orange-50 font-semibold leading-none mb-1.5 tracking-wide uppercase">Your Order</p>
            <p className="font-syne font-[700] text-[18px] text-white leading-none tracking-tight">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {/* Right: View Cart Call to action */}
        <div className="font-syne font-[700] flex items-center gap-2 text-[15px] text-white bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 transition-colors hover:bg-white/20">
          <span>View Cart</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
}
