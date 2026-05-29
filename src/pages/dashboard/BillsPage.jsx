import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useOrders } from "../../hooks/useOrders";
import { updateOrderStatus } from "../../firebase/firestore";
import { useToast } from "../../context/ToastContext";
import OrderCard from "../../components/dashboard/OrderCard";
import Spinner from "../../components/ui/Spinner";
import Card from "../../components/ui/Card";
import { Receipt, Search, FileText } from "lucide-react";

export default function BillsPage() {
  const { restaurantId } = useAuth();
  const { showToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("done");

  const getStatuses = () => {
    return activeTab === "done" ? ["done"] : ["billed"];
  };

  const { orders, loading, error } = useOrders(restaurantId, getStatuses());

  const handleUpdateStatus = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(restaurantId, orderId, nextStatus);
      showToast(`Order marked as ${nextStatus}.`, "success");
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast("Failed to update order status.", "error");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const tableMatch =
      `table ${order.tableNumber}`.includes(searchTerm.toLowerCase()) ||
      order.tableNumber.toString().includes(searchTerm);
    return tableMatch;
  });

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
        <div>
          <h1 className="text-[24px] font-[700] text-[var(--color-text-primary)] flex items-center gap-2 mb-[4px]">
            <Receipt className="text-[#F97316] w-6 h-6 shrink-0" /> Billing & Receipts
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Manage completed orders and generate bills.
          </p>
        </div>
      </div>

      {/* Tabs and Search Controls Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-5">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("done")}
            className={`px-4 py-2 text-[13px] rounded-full transition-all duration-200 focus:outline-none cursor-pointer border ${
              activeTab === "done"
                ? "bg-[var(--color-text-primary)] text-[var(--color-base-bg)] font-[700] border-[var(--color-text-primary)] shadow-sm"
                : "bg-[var(--color-base-card)] text-[var(--color-text-secondary)] font-[600] border-[var(--color-border)] hover:border-[#F97316] hover:text-[#F97316]"
            }`}
          >
            Ready to Bill (Completed)
          </button>
          <button
            onClick={() => setActiveTab("billed")}
            className={`px-4 py-2 text-[13px] rounded-full transition-all duration-200 focus:outline-none cursor-pointer border ${
              activeTab === "billed"
                ? "bg-[var(--color-text-primary)] text-[var(--color-base-bg)] font-[700] border-[var(--color-text-primary)] shadow-sm"
                : "bg-[var(--color-base-card)] text-[var(--color-text-secondary)] font-[600] border-[var(--color-border)] hover:border-[#F97316] hover:text-[#F97316]"
            }`}
          >
            Past Bills
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-[280px] md:ml-auto">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-[36px] pr-[12px] py-[10px] leading-normal h-[40px] bg-[var(--color-base-card)] border border-[var(--color-border)] rounded-[8px] text-[14px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[#F97316] focus:border-[#F97316] transition-all"
          />
        </div>
      </div>

      {/* Main Order Feed content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center pt-20 pb-12 gap-3 w-full bg-[var(--color-base-card)] shadow-[var(--shadow-card)] rounded-[16px] border border-[var(--color-border)]">
          <Spinner size="md" color="primary" className="w-8 h-8" />
          <span className="text-[14px] text-[var(--color-text-muted)] font-[500]">
            Loading orders...
          </span>
        </div>
      ) : error ? (
        <Card className="text-center py-16 border-red-200 bg-red-50">
          <p className="text-[14px] text-red-600 font-[600]">
            Failed to sync orders: {error}
          </p>
        </Card>
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center w-full bg-[var(--color-base-card)] shadow-[var(--shadow-card)] rounded-[16px] border border-[var(--color-border)]">
          <FileText className="w-16 h-16 text-[var(--color-border)] mb-4" />
          <h3 className="text-[16px] font-[700] text-[var(--color-text-primary)]">
            {activeTab === "done" ? "No orders ready for billing" : "No past bills"}
          </h3>
          <p className="text-[14px] text-[var(--color-text-secondary)] max-w-sm mx-auto mt-2">
            {searchTerm
              ? "We couldn't find any matching tables."
              : activeTab === "done"
              ? "When kitchen completes an order, it will appear here."
              : "Billed orders will appear here."}
          </p>
        </div>
      ) : (
        /* Grid of Order Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
