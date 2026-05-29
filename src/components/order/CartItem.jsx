import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * CartItem component for Customer Cart Page.
 * Displays item totals, note input field, and quantity stepper controls.
 */
export default function CartItem({
  item,
  onAdd,
  onRemove,
  onUpdateNote,
  stockLimit = false,
  maxAvailable = 99,
}) {
  const { name, price, quantity, note = '' } = item;

  return (
    <div className="neumorphic-card p-4 space-y-4">
      
      {/* Item title & price */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="font-bold text-[var(--color-customer-text)] text-base leading-tight">
            {name}
          </h4>
          <p className="font-black text-accent text-sm mt-1">
            {formatCurrency(price)}
          </p>
        </div>
        <span className="font-black text-[var(--color-customer-text)] text-[17px]">
          {formatCurrency(price * quantity)}
        </span>
      </div>

      {/* Stepper & Note Input */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center pt-3 border-t border-[var(--color-customer-border)]">
        
        {/* Note Field */}
        <input
          type="text"
          placeholder="Add note (e.g., extra spicy)..."
          value={note}
          onChange={(e) => onUpdateNote && onUpdateNote(e.target.value)}
          className="flex-1 px-3 py-2 bg-[var(--color-base-card)]/50 border border-[var(--color-customer-border)] rounded-xl text-sm text-[var(--color-customer-text)] placeholder-[var(--color-customer-muted)] focus:bg-[var(--color-base-bg)] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all min-h-[40px]"
        />

        {/* Zomato-inspired Stepper controls */}
        <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg overflow-hidden h-10 self-end sm:self-auto border border-emerald-600 dark:border-emerald-500 shadow-sm">
          <button
            onClick={onRemove}
            className="px-4 h-full flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-800/50 active:bg-emerald-200 transition-colors focus:outline-none"
            aria-label="Decrease quantity"
          >
            {quantity === 1 ? (
              <Trash2 className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
          </button>
          <span className="px-1 font-bold text-[15px] min-w-[28px] text-center select-none h-full flex items-center justify-center">
            {quantity}
          </span>
          <button
            onClick={onAdd}
            disabled={stockLimit && quantity >= maxAvailable}
            className="px-4 h-full flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-800/50 active:bg-emerald-200 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
