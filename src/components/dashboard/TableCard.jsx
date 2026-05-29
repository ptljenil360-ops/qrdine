import React from "react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatCurrency } from "../../utils/formatCurrency";
import { Download, QrCode, User, FileText, RefreshCw } from "lucide-react";
import {
  TABLE_STATUS_LABELS,
  TABLE_STATUS_COLORS,
} from "../../utils/constants";

/**
 * TableCard displays table occupancy, bill requests, active totals, and QR downloads.
 */
export default function TableCard({
  table,
  qrUrl,
  activeOrders = [],
  onResetTable,
  onDownloadQR,
  onViewOrder,
}) {
  const { id, tableNumber, status } = table;

  /** Compute total amount across active orders for this table */
  const totalAmount = activeOrders.reduce(
    (sum, order) => sum + (order.grandTotal || 0),
    0,
  );

  const totalItemCount = activeOrders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );

  /** Top border color based on table status */
  const topBorderClass =
    {
      free: "border-t-4 border-t-success",
      occupied: "border-t-4 border-t-error",
      "bill-requested": "border-t-4 border-t-warning animate-pulse-border",
    }[status] || "border-t-4 border-t-slate-200";

  const badgeVariants = {
    free: "success",
    occupied: "error",
    "bill-requested": "warning",
  };

  return (
    <Card
      className={`flex flex-col justify-between p-5 min-h-[220px] ${topBorderClass}`}
    >
      <div className="flex flex-col gap-3">

        {/* Header: Number and Status Badge */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-black text-[var(--color-text-primary)]">
            Table {tableNumber}
          </span>
          <Badge variant={badgeVariants[status] || "neutral"}>
            {TABLE_STATUS_LABELS[status]}
          </Badge>
        </div>

        {/* Dynamic Body Content */}
        <div className="flex-1 flex flex-col justify-center py-2">
          {status === "free" ? (
            /* Free table: show QR code thumbnail */
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-[var(--color-base-bg)] border border-[var(--color-border)] rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`QR Table ${tableNumber}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="w-8 h-8 text-[var(--color-text-muted)]" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                  QR code ready
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  Scan to view menu & order
                </p>
              </div>
            </div>
          ) : (
            /* Occupied or Bill Requested table: show active stats */
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                <User className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                <span>
                  {totalItemCount}{" "}
                  {totalItemCount === 1 ? "item ordered" : "items ordered"}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xs text-[var(--color-text-muted)]">
                  Current Due:
                </span>
                <span className="text-lg font-black text-[var(--color-text-primary)] leading-none">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Action Buttons */}
      <div className="border-t border-[var(--color-border)] pt-3 mt-2 flex gap-2">
        {status === "free" ? (
          /* Download QR action for Free Table */
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold"
            icon={Download}
            onClick={() => onDownloadQR && onDownloadQR(table)}
          >
            Download QR
          </Button>
        ) : status === "occupied" ? (
          /* View order for occupied table */
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold"
            icon={FileText}
            onClick={() => onViewOrder && onViewOrder(table)}
          >
            View Orders
          </Button>
        ) : (
          /* Bill requested table: Generate bill / reset table */
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs font-semibold border-orange-200 text-accent hover:bg-orange-50"
              icon={FileText}
              onClick={() => onViewOrder && onViewOrder(table)}
            >
              Details
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1 text-xs font-semibold bg-success hover:bg-emerald-600 focus-visible:ring-success"
              icon={RefreshCw}
              onClick={() => onResetTable && onResetTable(table)}
            >
              Clear Table
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
