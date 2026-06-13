import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTables } from '../../hooks/useTables';
import { useOrders } from '../../hooks/useOrders';
import { addTable, updateTableStatus, updateOrderStatus, deleteTable, resetTableSession } from '../../firebase/firestore';
import { generateQRDataUrl, generateQRBlob } from '../../utils/qrGenerator';
import { useToast } from '../../context/ToastContext';
import TableCard from '../../components/dashboard/TableCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { formatCurrency } from '../../utils/formatCurrency';
import { LayoutGrid, Plus, Download, RefreshCw, X } from 'lucide-react';
import { gsap } from 'gsap';
import JSZip from 'jszip';

export default function TablesPage() {
  const { restaurantId, restaurant } = useAuth();
  const { tables, loading: tablesLoading } = useTables(restaurantId);
  const { orders: activeOrders, loading: ordersLoading } = useOrders(restaurantId, ['pending', 'preparing', 'done']);
  const { showToast } = useToast();

  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [qrUrls, setQrUrls] = useState({});
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsTable, setDetailsTable] = useState(null);

  useEffect(() => {
    if (!tablesLoading) {
      gsap.fromTo('.table-card-item',
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, stagger: 0.03, ease: 'back.out(1.2)' }
      );
    }
  }, [tablesLoading, activeFilter]);

  useEffect(() => {
    const loadQrs = async () => {
      if (tables.length > 0 && restaurantId) {
        const urls = {};
        for (const t of tables) {
          try {
            const url = await generateQRDataUrl(restaurantId, t.id, t.sessionId);
            urls[t.id] = url;
          } catch (err) {
            console.error('QR code URL generation error:', err);
          }
        }
        setQrUrls(urls);
      }
    };
    loadQrs();
  }, [tables, restaurantId]);

  const freeCount = tables.filter((t) => t.status === 'free').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const billCount = tables.filter((t) => t.status === 'bill-requested').length;

  const handleAddTable = async () => {
    setLoading(true);
    try {
      const nextNumber = tables.length > 0 ? Math.max(...tables.map((t) => t.tableNumber)) + 1 : 1;
      await addTable(restaurantId, { tableNumber: nextNumber, status: 'free' });
      showToast(`Table ${nextNumber} added successfully.`, 'success');
    } catch (err) {
      console.error('Add table error:', err);
      showToast('Failed to add table.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSingleQR = async (table) => {
    try {
      const blob = await generateQRBlob(restaurantId, table.id, table.tableNumber, table.sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Table_${table.tableNumber}_QR.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download QR failed:', err);
      showToast('Failed to download QR code.', 'error');
    }
  };

  const handleDownloadAllQRs = async () => {
    if (tables.length === 0) return;
    setLoading(true);
    try {
      const zip = new JSZip();
      for (const t of tables) {
        const blob = await generateQRBlob(restaurantId, t.id, t.tableNumber, t.sessionId);
        zip.file(`Table_${t.tableNumber}_QR.png`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${restaurant?.name || 'Restaurant'}_All_QRs.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('ZIP of QR codes downloaded successfully.', 'success');
    } catch (err) {
      console.error('ZIP generation failed:', err);
      showToast('Failed to generate ZIP.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResetModal = (table) => {
    setSelectedTable(table);
    setResetModalOpen(true);
  };

  const handleOpenDetailsModal = (table) => {
    setDetailsTable(table);
    setDetailsModalOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const tableOrders = activeOrders.filter((o) => o.tableNumber === selectedTable.tableNumber);
      for (const order of tableOrders) {
        await updateOrderStatus(restaurantId, order.id, 'billed');
      }
      await resetTableSession(restaurantId, selectedTable.id);
      showToast(`Table ${selectedTable.tableNumber} is now free. Orders finalized.`, 'success');
      setResetModalOpen(false);
      setSelectedTable(null);
    } catch (err) {
      console.error('Reset table error:', err);
      showToast('Failed to clear table.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = tables.filter((t) => {
    if (activeFilter === 'all') return true;
    return t.status === activeFilter;
  });

  return (
    <div className="space-y-6 font-sans pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className="text-[24px] font-[700] text-[var(--color-text-primary)] mb-[4px]">
            Table Layout
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Monitor occupancy, process bills, and download scan-to-order QR codes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadAllQRs}
            disabled={tables.length === 0}
            icon={Download}
            className="border-[var(--color-border)] text-[var(--color-text-primary)] bg-[var(--color-base-card)] hover:bg-gray-50"
          >
            Download QRs (ZIP)
          </Button>
          <Button
            onClick={handleAddTable}
            icon={Plus}
            className="bg-[#F97316] text-[#FFFFFF] hover:bg-[#EA580C] font-[600] shadow-sm border-none"
          >
            Add Table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="border-l-[4px] border-l-[#22C55E] flex items-center justify-between p-4 shadow-[var(--shadow-card)] border border-[var(--color-border)] bg-[var(--color-base-card)]">
          <div>
            <span className="text-[10px] uppercase font-[700] tracking-wider text-[var(--color-text-secondary)]">Free</span>
            <p className="text-[24px] font-[800] text-[var(--color-text-primary)] mt-1">{freeCount}</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-pulse" />
        </Card>
        <Card className="border-l-[4px] border-l-[#EF4444] flex items-center justify-between p-4 shadow-[var(--shadow-card)] border border-[var(--color-border)] bg-[var(--color-base-card)]">
          <div>
            <span className="text-[10px] uppercase font-[700] tracking-wider text-[var(--color-text-secondary)]">Occupied</span>
            <p className="text-[24px] font-[800] text-[var(--color-text-primary)] mt-1">{occupiedCount}</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
        </Card>
        <Card className="border-l-[4px] border-l-[#EAB308] flex items-center justify-between p-4 shadow-[var(--shadow-card)] border border-[var(--color-border)] bg-[var(--color-base-card)]">
          <div>
            <span className="text-[10px] uppercase font-[700] tracking-wider text-[var(--color-text-secondary)]">Bill Request</span>
            <p className="text-[24px] font-[800] text-[var(--color-text-primary)] mt-1">{billCount}</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] animate-ping" />
        </Card>
      </div>

      <div className="flex gap-1 mb-5">
        {[
          { label: 'All Tables', value: 'all' },
          { label: 'Free Only', value: 'free' },
          { label: 'Occupied', value: 'occupied' },
          { label: 'Bill Requested', value: 'bill-requested' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className={`px-[14px] py-[6px] text-[13px] rounded-[6px] transition-all duration-200 focus:outline-none cursor-pointer ${
              activeFilter === opt.value
                ? 'bg-[#F97316] text-[#FFFFFF] font-[600] shadow-sm'
                : 'bg-transparent text-[var(--color-text-secondary)] font-[500] hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {tablesLoading || ordersLoading ? (
        <div className="flex flex-col items-center justify-center pt-20 pb-12 gap-3 w-full">
          <Spinner size="md" color="primary" className="w-8 h-8" />
          <span className="text-[14px] text-[var(--color-text-muted)] font-[500]">Loading table grid...</span>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center w-full">
          <LayoutGrid className="w-20 h-20 text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-[16px] font-[600] text-[var(--color-text-primary)]">No tables found</h3>
          <p className="text-[14px] text-[var(--color-text-muted)] max-w-sm mx-auto mt-1 mb-4">
            {activeFilter === 'all'
              ? 'Click the Add Table button at the top right to get started.'
              : `There are no tables currently matching the "${activeFilter}" filter.`}
          </p>
          {activeFilter === 'all' && (
            <Button
              onClick={handleAddTable}
              icon={Plus}
              className="bg-[#F97316] text-[#FFFFFF] hover:bg-[#EA580C] font-[600] shadow-sm border-none"
            >
              Add Table
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables
            .sort((a, b) => a.tableNumber - b.tableNumber)
            .map((table) => {
              const tableOrders = activeOrders.filter((o) => o.tableNumber === table.tableNumber);
              return (
                <div key={table.id} className="table-card-item">
                  <TableCard
                    table={table}
                    qrUrl={qrUrls[table.id]}
                    activeOrders={tableOrders}
                    onResetTable={handleOpenResetModal}
                    onDownloadQR={handleDownloadSingleQR}
                    onViewOrder={handleOpenDetailsModal}
                  />
                </div>
              );
            })}
        </div>
      )}

      {/* Reset Table Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title={`Finalize Table ${selectedTable?.tableNumber}`}
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setResetModalOpen(false)}
              disabled={loading}
              className="border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#22C55E] text-[#FFFFFF] hover:bg-[#16A34A] focus-visible:ring-[#22C55E] border-none"
              onClick={handleConfirmReset}
              loading={loading}
            >
              Clear & Free Table
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-[14px] text-[var(--color-text-primary)]">
            Are you sure you want to clear <span className="font-bold">Table {selectedTable?.tableNumber}</span>?
          </p>
          <div className="bg-[var(--color-base-bg)] border border-[var(--color-border)] rounded-[8px] p-4 text-[12px] space-y-1">
            <p className="text-[var(--color-text-secondary)] font-[600]">This action will:</p>
            <ul className="list-disc pl-4 text-[var(--color-text-muted)] space-y-1 mt-1">
              <li>Reset occupancy status to <span className="text-[#22C55E] font-[600]">Free</span></li>
              <li>Mark all live orders from this table as <span className="text-[var(--color-text-secondary)] font-[600]">Billed</span></li>
              <li>Allow new customers to scan and seat themselves at this table</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Table Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={`Active Orders — Table ${detailsTable?.tableNumber}`}
        footer={
          <Button
            variant="outline"
            onClick={() => setDetailsModalOpen(false)}
            className="border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-gray-50"
          >
            Close
          </Button>
        }
      >
        {detailsTable && (
          <div className="space-y-4">
            {activeOrders.filter((o) => o.tableNumber === detailsTable.tableNumber).length === 0 ? (
              <p className="text-center py-6 text-[14px] text-[var(--color-text-muted)]">No active orders placed yet.</p>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {activeOrders
                  .filter((o) => o.tableNumber === detailsTable.tableNumber)
                  .map((order, idx) => (
                    <div key={order.id} className="border border-[var(--color-border)] rounded-[8px] p-4 bg-[var(--color-base-bg)]">
                      <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2 mb-2">
                        <span className="text-[12px] font-[700] text-[var(--color-text-secondary)]">Order Ref: {order.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[12px] font-[600] px-2 py-0.5 rounded-[999px] bg-[#FFF7ED] text-[#F97316] border border-[#FFEDD5] capitalize">
                          {order.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between text-[12px]">
                            <span>
                              {item.quantity}x <span className="font-[600] text-[var(--color-text-primary)]">{item.name}</span>
                            </span>
                            <span className="font-[500]">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-[var(--color-border)] pt-2 mt-2 flex justify-between items-center text-[12px] font-[700] text-[var(--color-text-primary)]">
                        <span>Grand Total:</span>
                        <span>{formatCurrency(order.grandTotal)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}