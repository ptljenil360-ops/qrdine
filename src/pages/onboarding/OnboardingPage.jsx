import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMenu } from '../../hooks/useMenu';
import { useTables } from '../../hooks/useTables';
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addTable,
  deleteTable,
  updateRestaurantProfile
} from '../../firebase/firestore';
import { uploadImage } from '../../utils/uploadImage';
import { generateQRDataUrl, generateQRBlob } from '../../utils/qrGenerator';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_CATEGORIES } from '../../utils/constants';

import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

import {
  Utensils,
  QrCode,
  Plus,
  Trash2,
  Edit2,
  Upload,
  ChevronRight,
  Download,
  Minus,
  Sparkles,
  LayoutGrid,
  ArrowLeft
} from 'lucide-react';
import { gsap } from 'gsap';
import JSZip from 'jszip';

export default function OnboardingPage() {
  const { restaurantId, restaurant } = useAuth();
  const { menu, loading: menuLoading } = useMenu(restaurantId);
  const { tables, loading: tablesLoading } = useTables(restaurantId);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Add/Edit Dish Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [dishPrice, setDishPrice] = useState('');
  const [dishStockLimit, setDishStockLimit] = useState(false);
  const [dishStock, setDishStock] = useState('10');
  const [dishPhotoFile, setDishPhotoFile] = useState(null);
  const [dishPhotoPreview, setDishPhotoPreview] = useState(null);
  const [modalErrors, setModalErrors] = useState({});

  // Table Setup state
  const [tableCount, setTableCount] = useState(5);
  const [qrUrls, setQrUrls] = useState({});
  const [generatingQrs, setGeneratingQrs] = useState(false);

  // Redirect if onboarding already complete
  useEffect(() => {
    if (restaurant && restaurant.onboardingComplete) {
      navigate('/dashboard');
    }
  }, [restaurant, navigate]);

  // Entrance animation for wizard
  useEffect(() => {
    gsap.fromTo(
      '.onboarding-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, [step]);

  // Pre-generate QR data URLs when tables list loads
  useEffect(() => {
    const loadQrs = async () => {
      if (tables.length > 0 && restaurantId) {
        const urls = {};
        for (const t of tables) {
          try {
            const url = await generateQRDataUrl(restaurantId, t.id);
            urls[t.id] = url;
          } catch (err) {
            console.error('QR generation error:', err);
          }
        }
        setQrUrls(urls);
      }
    };
    loadQrs();
  }, [tables, restaurantId]);

  // Handle Photo changes
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'error');
        return;
      }
      setDishPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDishPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setDishName('');
    setDishCategory(DEFAULT_CATEGORIES[0]);
    setDishPrice('');
    setDishStockLimit(false);
    setDishStock('10');
    setDishPhotoFile(null);
    setDishPhotoPreview(null);
    setModalErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setDishName(item.name);
    setDishCategory(item.category);
    setDishPrice(item.price.toString());
    setDishStockLimit(item.stockLimit ?? false);
    setDishStock((item.currentStock ?? 10).toString());
    setDishPhotoFile(null);
    setDishPhotoPreview(item.photoUrl || null);
    setModalErrors({});
    setIsModalOpen(true);
  };

  const validateModal = () => {
    const tempErrors = {};
    if (!dishName.trim()) tempErrors.name = 'Dish Name is required.';
    if (!dishPrice.trim() || isNaN(dishPrice) || Number(dishPrice) <= 0) {
      tempErrors.price = 'Price must be a positive number.';
    }
    if (dishStockLimit && (!dishStock.trim() || isNaN(dishStock) || Number(dishStock) < 0)) {
      tempErrors.stock = 'Stock must be a non-negative number.';
    }
    setModalErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!validateModal()) return;

    setLoading(true);
    try {
      let photoUrl = editingItem?.photoUrl || '';

      // Upload new photo if selected
      if (dishPhotoFile) {
        const fileName = `${Date.now()}_${dishName.trim().replace(/\s+/g, '_')}.jpg`;
        photoUrl = await uploadImage(`menu/${restaurantId}/${fileName}`, dishPhotoFile);
      }

      const dishData = {
        name: dishName.trim(),
        category: dishCategory,
        price: Math.round(Number(dishPrice)),
        photoUrl,
        stockLimit: dishStockLimit,
        currentStock: dishStockLimit ? Math.round(Number(dishStock)) : null,
        available: true,
      };

      if (editingItem) {
        await updateMenuItem(restaurantId, editingItem.id, dishData);
        showToast('Dish updated successfully.', 'success');
      } else {
        await addMenuItem(restaurantId, {
          ...dishData,
          sortOrder: menu.length,
        });
        showToast('Dish added to menu.', 'success');
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving dish:', err);
      showToast('Failed to save dish. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDish = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this dish?')) {
      try {
        await deleteMenuItem(restaurantId, itemId);
        showToast('Dish deleted.', 'success');
      } catch (err) {
        console.error('Delete item error:', err);
        showToast('Failed to delete dish.', 'error');
      }
    }
  };

  const handleGenerateTables = async () => {
    if (tableCount < 1 || tableCount > 50) {
      showToast('Please enter a count between 1 and 50.', 'error');
      return;
    }

    setGeneratingQrs(true);
    try {
      // 1. Delete existing tables
      for (const t of tables) {
        await deleteTable(restaurantId, t.id);
      }

      // 2. Generate new tables
      for (let i = 1; i <= tableCount; i++) {
        await addTable(restaurantId, {
          tableNumber: i,
          status: 'free',
        });
      }

      showToast(`Successfully set up ${tableCount} tables!`, 'success');
    } catch (err) {
      console.error('Table setup error:', err);
      showToast('Failed to generate tables. Please try again.', 'error');
    } finally {
      setGeneratingQrs(false);
    }
  };

  const downloadSingleQR = async (table) => {
    try {
      const blob = await generateQRBlob(restaurantId, table.id, table.tableNumber);
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

  const downloadAllQRs = async () => {
    if (tables.length === 0) return;
    setLoading(true);
    try {
      const zip = new JSZip();
      
      for (const t of tables) {
        const blob = await generateQRBlob(restaurantId, t.id, t.tableNumber);
        zip.file(`Table_${t.tableNumber}_QR.png`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${restaurant?.name || 'Restaurant'}_QR_Codes.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('All QR codes downloaded in ZIP format.', 'success');
    } catch (err) {
      console.error('ZIP generation failed:', err);
      showToast('Failed to generate ZIP file.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    if (tables.length === 0) {
      showToast('Please set up tables and generate QR codes first.', 'error');
      return;
    }
    setLoading(true);
    try {
      await updateRestaurantProfile(restaurantId, {
        onboardingComplete: true,
      });
      showToast('Onboarding complete! Welcome to QRDine.', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding update failed:', err);
      showToast('Failed to complete setup.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', paddingBottom: '40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border" style={{ paddingTop: '24px' }}>
          <div className="flex items-center gap-3">
            <div style={{ padding: '8px', backgroundColor: '#F97316', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.2)' }}>
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{restaurant?.name || 'Restaurant Setup'}</h1>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Set up your QRDine digital system</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: step === 1 ? '700' : '500', color: step === 1 ? '#F97316' : '#94A3B8' }}>
              1. Menu Setup
            </span>
            <ChevronRight style={{ width: '16px', height: '16px', color: '#CBD5E1' }} />
            <span style={{ fontSize: '14px', fontWeight: step === 2 ? '700' : '500', color: step === 2 ? '#F97316' : '#94A3B8' }}>
              2. Tables & QRs
            </span>
          </div>
        </div>

        {/* Wizard Card Body */}
        <div className="onboarding-card opacity-0">
          
          {/* STEP 1: MENU SETUP */}
          {step === 1 && (
            <>
              <Card className="border border-border/60 shadow-md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', paddingBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Your Menu</h2>
                    <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
                      Add the dishes you serve. Customers will see these in real-time.
                    </p>
                  </div>
                  <Button onClick={openAddModal} icon={Plus} className="font-semibold shadow-md">
                    Add Dish
                  </Button>
                </div>

                {menuLoading ? (
                  <div className="flex flex-col justify-center items-center py-16 gap-3">
                    <Spinner size="lg" />
                    <span className="text-sm text-text-secondary">Loading menu...</span>
                  </div>
                ) : menu.length === 0 ? (
                  /* Empty state */
                  <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-[12px] bg-slate-50">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 shadow-inner">
                      <Utensils className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No dishes added yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                      Add starters, mains, breads, drinks or desserts to build your digital menu.
                    </p>
                    <Button onClick={openAddModal} icon={Plus} variant="outline" className="font-semibold">
                      Add Your First Dish
                    </Button>
                  </div>
                ) : (
                  /* Dish grid */
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                    {menu.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: '#fff',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          position: 'relative',
                        }}
                      >
                        {item.stockLimit && (
                          <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10 }}>
                            <Badge variant="warning" className="normal-case text-[10px]">
                              Qty: {item.currentStock}
                            </Badge>
                          </div>
                        )}
                        <div>
                          <div style={{ height: '140px', width: '100%', backgroundColor: '#F1F5F9', position: 'relative', overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
                            {item.photoUrl ? (
                              <img src={item.photoUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                                <Utensils style={{ width: '40px', height: '40px', margin: 'auto' }} />
                              </div>
                            )}
                          </div>
                          <span style={{ backgroundColor: '#FFF0E6', color: '#F97316', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', display: 'inline-block', margin: '10px 12px 4px', textTransform: 'uppercase' }}>
                            {item.category}
                          </span>
                          <h4 style={{ fontWeight: 700, color: '#1E293B', fontSize: '16px', margin: '4px 12px 0', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h4>
                          <p style={{ fontWeight: 700, color: '#F97316', fontSize: '14px', margin: '2px 12px 8px' }}>{formatCurrency(item.price)}</p>
                        </div>
                        
                        {/* Footer with Edit and Delete buttons */}
                        <div style={{ display: 'flex', gap: '8px', padding: '8px 12px', borderTop: '1px solid #F1F1F1', backgroundColor: '#FCFDFE', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            style={{
                              flex: 1,
                              height: '32px',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              color: '#475569',
                              backgroundColor: '#fff',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.2s',
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDish(item.id)}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: '1px solid #FCA5A5',
                              borderRadius: '6px',
                              color: '#EF4444',
                              backgroundColor: '#FEF2F2',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}
                            title="Delete dish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              {menu.length > 0 && !menuLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px', marginBottom: '40px' }}>
                  <Button
                    onClick={() => setStep(2)}
                    icon={ChevronRight}
                    className="font-semibold shadow-md"
                    size="lg"
                  >
                    Next: Set Up Tables
                  </Button>
                </div>
              )}
            </>
          )}

          {/* STEP 2: TABLES & QR SETUP */}
          {step === 2 && (
            <Card className="border border-border/60 shadow-md">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Configure Tables & QR Codes</h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  Set the number of tables in your dining area. We will generate unique scan-to-order QR codes.
                </p>
              </div>

              {/* Input Stepper */}
              <div className="bg-slate-50 border border-border rounded-[12px] p-6 max-w-md mx-auto mb-8 flex flex-col items-center gap-4">
                <span className="text-sm font-bold text-slate-700">Number of Tables</span>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                    className="w-12 h-12 bg-white rounded-full border border-border flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-600"
                    aria-label="Decrease tables"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-4xl font-extrabold text-slate-800 min-w-[60px] text-center">
                    {tableCount}
                  </span>
                  <button
                    onClick={() => setTableCount(Math.min(50, tableCount + 1))}
                    className="w-12 h-12 bg-white rounded-full border border-border flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-600"
                    aria-label="Increase tables"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-text-muted text-center max-w-[280px]">
                  Generates Table 1 to Table {tableCount}. Min 1, Max 50 tables supported for V1.
                </p>

                <Button
                  onClick={handleGenerateTables}
                  loading={generatingQrs}
                  className="mt-2 w-full font-semibold shadow-md"
                  size="lg"
                  icon={QrCode}
                >
                  Generate QR Codes
                </Button>
              </div>

              {/* QR Output grid */}
              {tablesLoading ? (
                <div className="flex flex-col justify-center items-center py-10 gap-3">
                  <Spinner />
                  <span className="text-sm text-text-secondary">Loading tables...</span>
                </div>
              ) : tables.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-orange-50 border border-orange-100 rounded-[8px] p-4">
                    <div className="flex items-center gap-2 text-accent">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-sm font-semibold">{tables.length} Table QR Codes Generated</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadAllQRs}
                      icon={Download}
                      className="border-accent text-accent hover:bg-accent-light font-semibold"
                    >
                      Download All (ZIP)
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {tables.map((t) => (
                      <div
                        key={t.id}
                        className="bg-white border border-border rounded-[8px] p-4 flex flex-col items-center justify-between text-center gap-3 shadow-sm hover:shadow-md transition-all group"
                      >
                        <h4 className="font-bold text-slate-900 text-sm">Table {t.tableNumber}</h4>
                        <div className="w-28 h-28 bg-slate-100 border border-slate-100 rounded flex items-center justify-center overflow-hidden">
                          {qrUrls[t.id] ? (
                            <img src={qrUrls[t.id]} alt={`QR Table ${t.tableNumber}`} className="w-full h-full object-contain" />
                          ) : (
                            <Spinner size="sm" />
                          )}
                        </div>
                        <button
                          onClick={() => downloadSingleQR(t)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 hover:border-accent hover:text-accent transition-all text-slate-500 hover:bg-accent-light active:scale-95"
                          title="Download PNG"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-border mt-8">
                    <Button variant="outline" onClick={() => setStep(1)} icon={ArrowLeft} className="font-semibold">
                      Back to Menu
                    </Button>
                    <Button
                      onClick={handleFinishOnboarding}
                      loading={loading}
                      size="lg"
                      className="font-bold shadow-md animate-bounce-subtle"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          )}

        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? 'Edit Menu Item' : 'Add New Dish'}
          footer={
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSaveDish} loading={loading} className="font-semibold">
                {editingItem ? 'Save Changes' : 'Add Dish'}
              </Button>
            </div>
          }
        >
          <form className="space-y-4">
            <Input
              id="dishName"
              label="Dish Name"
              placeholder="e.g. Butter Chicken"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              error={modalErrors.name}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dishCategory" className="text-sm font-semibold text-text-primary">
                Category
              </label>
              <select
                id="dishCategory"
                value={dishCategory}
                onChange={(e) => setDishCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-border rounded-[8px] text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent min-h-[44px]"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="dishPrice"
              label="Price (Rs.)"
              placeholder="e.g. 290"
              value={dishPrice}
              onChange={(e) => setDishPrice(e.target.value)}
              error={modalErrors.price}
              required
            />

            {/* Photo Upload inside Modal */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-primary">Dish Photo</span>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-[8px] bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  {dishPhotoPreview ? (
                    <img src={dishPhotoPreview} alt="Dish preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <label
                    htmlFor="dish-photo-upload"
                    className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-[8px] text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 cursor-pointer transition-colors shadow-sm"
                  >
                    Select Photo
                  </label>
                  <input
                    id="dish-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    PNG/JPG. Resized to 800px and compressed before uploading.
                  </p>
                </div>
              </div>
            </div>

            {/* Stock Limit controls */}
            <div className="bg-slate-50 border border-slate-100 rounded-[8px] p-4 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-text-primary">Track Stock Limit</span>
                  <p className="text-xs text-text-muted mt-0.5">Automatically mark item as unavailable once sold out</p>
                </div>
                <input
                  type="checkbox"
                  checked={dishStockLimit}
                  onChange={(e) => setDishStockLimit(e.target.checked)}
                  className="rounded text-accent focus:ring-accent border-slate-300 w-4.5 h-4.5 cursor-pointer"
                />
              </label>

              {dishStockLimit && (
                <div className="animate-slide-down">
                  <Input
                    id="dishStock"
                    label="Current Available Stock Quantity"
                    placeholder="e.g. 15"
                    value={dishStock}
                    onChange={(e) => setDishStock(e.target.value)}
                    error={modalErrors.stock}
                    required
                  />
                </div>
              )}
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
}
