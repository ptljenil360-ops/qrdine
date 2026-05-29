import React from "react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatCurrency } from "../../utils/formatCurrency";
import { Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";

/**
 * DishCard displays a dish in the owner dashboard Menu tab.
 * Includes availability toggle, edit/delete actions, and stock badges.
 */
export default function DishCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailable,
}) {
  const {
    id,
    name,
    category,
    price,
    photoUrl,
    available,
    stockLimit,
    currentStock,
  } = item;

  const isOutOfStock =
    stockLimit && (currentStock === null || currentStock <= 0);
  const displayAvailable = available && !isOutOfStock;

  return (
    <Card className="flex flex-col justify-between overflow-hidden p-0 relative border-border/60 hover:shadow-md h-full group">

      {/* Stock indicators */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {stockLimit && (
          <Badge
            variant={isOutOfStock ? "error" : "warning"}
            className="normal-case text-[10px]"
          >
            {isOutOfStock ? "Sold Out" : `Stock: ${currentStock}`}
          </Badge>
        )}
      </div>

      {/* Dish Photo */}
      <div className="h-44 bg-[var(--color-base-bg)] relative overflow-hidden flex-shrink-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${!displayAvailable ? "grayscale opacity-60" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-base-bg)] text-[var(--color-text-muted)]">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
              />
            </svg>
          </div>
        )}

        {/* Unavailable overlay text */}
        {!displayAvailable && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-[var(--color-base-card)] text-[var(--color-text-primary)] text-xs font-black tracking-wider uppercase px-3 py-1 rounded-[4px] border border-[var(--color-border)] shadow-md">
              {isOutOfStock ? "Sold Out" : "Unavailable"}
            </span>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex justify-between items-start gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
              {category}
            </span>

            {/* Availability Indicator dot */}
            <button
              onClick={() =>
                typeof onToggleAvailable === "function" &&
                onToggleAvailable(id, available)
              }
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus:outline-none"
              title={available ? "Mark Unavailable" : "Mark Available"}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${available ? "bg-success" : "bg-slate-300"}`}
              />
              <span>{available ? "Active" : "Hidden"}</span>
            </button>
          </div>

          <h4 className="font-extrabold text-[var(--color-text-primary)] text-base mt-2 line-clamp-1 group-hover:text-accent transition-colors">
            {name}
          </h4>
          <p className="font-black text-accent text-base mt-1">
            {formatCurrency(price)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 border-t border-[var(--color-border)] pt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => onEdit(item)}
            icon={Edit2}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-100 hover:bg-red-50 text-error hover:text-red-700 flex-shrink-0"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
