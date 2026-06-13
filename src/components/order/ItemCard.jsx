import React from 'react';
import { Plus, Minus, AlertCircle, Utensils } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Premium customer-side ItemCard.
 * Features inline quantity controls, stock indicators, and disabled state for unavailable items.
 */
export default function ItemCard({
  item,
  cartQuantity = 0,
  onAdd,
  onRemove,
}) {
  const { name, price, photoUrl, available, stockLimit, currentStock } = item;

  const isOutOfStock = stockLimit && (currentStock === null || currentStock <= 0);
  const displayAvailable = available && !isOutOfStock;
  const isLimited = stockLimit && currentStock > 0 && currentStock <= 5;

  return (
    <div
      className={`
        flex items-center gap-[12px] p-3
        neumorphic-card
        transition-all duration-300
        ${!displayAvailable ? 'opacity-60 select-none' : ''}
      `}
    >
      {/* Item Image */}
      <div className="w-[84px] h-[84px] bg-[var(--color-base-card)] rounded-[12px] overflow-hidden flex-shrink-0 relative shadow-sm border border-[var(--color-customer-border)]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-500 hover:scale-110 ${!displayAvailable ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            <Utensils className="w-8 h-8" />
          </div>
        )}

        {!displayAvailable && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-white dark:bg-slate-900 text-[var(--color-customer-text)] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-md border border-[var(--color-customer-border)]">
              {isOutOfStock ? 'Sold Out' : 'Unavailable'}
            </span>
          </div>
        )}
      </div>

      {/* Item Info */}
      <div className="flex-1 flex flex-col justify-center py-1">
        <h4 className="font-inter font-[600] text-[15px] text-[var(--color-customer-text)] capitalize leading-tight">
          {name}
        </h4>
        <p className="font-syne font-[700] text-[15px] text-[#F97316] mt-[4px]">
          {formatCurrency(price)}
        </p>
        
        {/* Limited stock warning */}
        {displayAvailable && isLimited && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded border border-orange-100/50 dark:border-orange-900/50 mt-1.5 w-max shadow-sm">
            <AlertCircle className="w-3 h-3" />
            Only {currentStock} left
          </span>
        )}
      </div>

      {/* Action Button: Add or Quantity Controls */}
      <div className="flex-shrink-0 ml-2">
        {!displayAvailable ? (
          <button
            disabled
            className="px-3 h-[36px] bg-[var(--color-base-card)] text-[var(--color-customer-muted)] text-xs font-bold rounded-full border border-[var(--color-customer-border)] cursor-not-allowed shadow-sm"
          >
            Unavailable
          </button>
        ) : cartQuantity > 0 ? (
          /* Zomato-inspired Quantity stepper */
          <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg overflow-hidden h-[36px] border border-emerald-600 dark:border-emerald-500 shadow-sm">
            <button
              onClick={onRemove}
              className="w-[32px] h-full flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-800/50 active:bg-emerald-200 transition-colors focus:outline-none"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-[14px] min-w-[28px] text-center select-none flex items-center justify-center">
              {cartQuantity}
            </span>
            <button
              onClick={onAdd}
              disabled={stockLimit && cartQuantity >= currentStock}
              className="w-[32px] h-full flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-800/50 active:bg-emerald-200 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Zomato-inspired Add button */
          <button
            onClick={onAdd}
            className="px-6 h-[36px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 active:scale-95 text-emerald-700 dark:text-emerald-400 text-[14px] font-extrabold uppercase tracking-wide rounded-lg transition-all focus:outline-none flex items-center justify-center shadow-sm border border-emerald-600 dark:border-emerald-500"
          >
            Add
          </button>
        )}
      </div>

    </div>
  );
}
