import React from "react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatCurrency } from "../../utils/formatCurrency";
import { Clock, Check, CookingPot, FileText } from "lucide-react";

/**
 * OrderCard displays order items, details, and action buttons for status management.
 */
export default function OrderCard({
  order,
  onUpdateStatus,
  onPrintBill,
  onPrintKOT,
  className = "",
  variant = "default",
}) {
  const { id, tableNumber, status, items, grandTotal, createdAt } = order;

  /** Format Firestore timestamp to readable time */
  const formatOrderTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  /** Status-specific configuration for border, badge, and actions */
  const statusConfig = {
    pending: {
      borderColor: "border-l-4 border-l-error",
      badgeVariant: "error",
      badgeLabel: "New",
      actionLabel: "Mark Preparing",
      actionStatus: "preparing",
      actionIcon: CookingPot,
      pulse: "animate-pulse-border border-l-4",
    },
    preparing: {
      borderColor: "border-l-4 border-l-warning",
      badgeVariant: "preparing",
      badgeLabel: "Preparing",
      actionLabel: "Mark Done",
      actionStatus: "done",
      actionIcon: Check,
      pulse: "",
    },
    done: {
      borderColor: "border-l-4 border-l-success",
      badgeVariant: "done",
      badgeLabel: "Done",
      actionLabel: "Mark Billed",
      actionStatus: "billed",
      actionIcon: FileText,
      pulse: "",
    },
    billed: {
      borderColor: "border-l-4 border-l-slate-400 dark:border-l-slate-600",
      badgeVariant: "neutral",
      badgeLabel: "Billed",
      actionLabel: null,
      actionStatus: null,
      actionIcon: null,
      pulse: "",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const cardBorderClass = `${config.borderColor} ${config.pulse} ${className}`;

  /** Total item count across all line items */
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card variant={variant} className={cardBorderClass}>
      <div className="flex flex-col gap-4">

        {/* Header: Table, Time, Status */}
        <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-3">
            <span className="font-syne font-[700] text-[16px] text-[var(--color-text-primary)]">
              Table {tableNumber}
            </span>
            <Badge variant={config.badgeVariant}>
              {config.badgeLabel}
            </Badge>
          </div>

          {createdAt && (
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatOrderTime(createdAt)}</span>
            </div>
          )}
        </div>

        {/* Order Items List */}
        <div className="space-y-2.5 flex-1">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="flex flex-col gap-0.5">
              <div className="flex justify-between text-sm text-[var(--color-text-primary)]">
                <span className="font-inter font-[400] text-[13px]">
                  {item.quantity}x{" "}
                  <span className="font-inter font-[600] text-[var(--color-text-primary)]">
                    {item.name}
                  </span>
                </span>
                <span className="font-inter font-[500] text-[13px] text-[var(--color-text-secondary)]">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>

              {item.note && (
                <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded border border-orange-100/50 dark:border-orange-900/50 italic max-w-max">
                  Note: {item.note}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer: Totals and Actions */}
        <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
              {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
            </span>
            <div className="text-right">
              <span className="text-xs text-[var(--color-text-muted)]">
                Total amount:
              </span>
              <p className="font-syne font-[700] text-[16px] text-[var(--color-text-primary)] leading-none mt-0.5">
                {formatCurrency(grandTotal)}
              </p>
            </div>
          </div>

          {config.actionLabel && typeof onUpdateStatus === "function" && (
            <Button
              variant={status === "pending" ? "primary" : "outline"}
              className={`w-full font-semibold ${status === "preparing" ? "border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800/50 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300" : ""}`}
              size="md"
              icon={config.actionIcon}
              onClick={() => onUpdateStatus(id, config.actionStatus)}
            >
              {config.actionLabel}
            </Button>
          )}

          {typeof onPrintKOT === "function" && (status === "pending" || status === "preparing") && (
            <Button
              variant="outline"
              className="w-full font-semibold border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800/50 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
              size="md"
              icon={FileText}
              onClick={() => onPrintKOT(order)}
            >
              Print KOT
            </Button>
          )}

          {typeof onPrintBill === "function" && (status === "done" || status === "billed") && (
            <Button
              variant="outline"
              className="w-full font-semibold border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-800/50 dark:text-orange-400 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
              size="md"
              icon={FileText}
              onClick={() => onPrintBill(order)}
            >
              Print Bill
            </Button>
          )}
        </div>

      </div>
    </Card>
  );
}
