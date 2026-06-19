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

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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
        photoUrl = await uploadImage(`dishes/${restaurantId}/${fileName}`, dishPhotoFile);
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

  const confirmDelete = (itemId) => setDeleteConfirmId(itemId);

  const handleDeleteDish = async () => {
    if (deleteConfirmId) {
      try {
        await deleteMenuItem(restaurantId, deleteConfirmId);
        showToast('Dish deleted.', 'success');
      } catch (err) {
        console.error('Delete item error:', err);
        showToast('Failed to delete dish.', 'error');
      } finally {
        setDeleteConfirmId(null);
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
      showToast('Onboarding complete! Welcome to RaShoyi.', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding update failed:', err);
      showToast('Failed to complete setup.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        
        {/* Step Indicator Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-border pt-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.2)]">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold text-slate-900 m-0">{restaurant?.name || 'Restaurant Setup'}</h1>
              <p className="text-xs text-slate-500 m-0">Set up your RaShoyi digital system</p>
            </div>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <button 
              type="button" 
              onClick={() => step === 2 && setStep(1)} 
              className={`text-sm font-semibold transition-colors ${step === 2 ? 'cursor-pointer hover:text-orange-600' : 'cursor-default'} ${step === 1 ? 'text-orange-500 font-bold' : 'text-slate-500'}`}
            >
              1. Menu Setup
            </button>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className={`text-sm font-semibold ${step === 2 ? 'text-orange-500 font-bold' : 'text-slate-500'}`}>
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
                <div className="flex justify-between items-center pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 m-0 flex items-center gap-2">
                      Your Menu
                      {menu.length > 0 && !menuLoading && (
                        <Badge variant="success" className="normal-case text-[10px] bg-green-100 text-green-700">Changes saved automatically</Badge>
                      )}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 mb-0">
                      Add the dishes you serve. Customers will see these in real-time.
                    </p>
                  </div>
                  <Button onClick={openAddModal} icon={Plus} className="font-semibold shadow-md min-h-[44px]">
                    Add Dish
                  </Button>
                </div>

                {menuLoading ? (
                  <div className="flex flex-col justify-center items-center py-16 gap-3">
                    <Spinner size="lg" />
                    <span className="text-sm text-slate-500">Loading menu...</span>
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
                    <Button onClick={openAddModal} icon={Plus} className="font-semibold min-h-[44px]">
                      Add Your First Dish
                    </Button>
                  </div>
                ) : (
                  /* Dish grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {menu.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between shadow-sm relative"
                      >
                        {item.stockLimit && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge variant="warning" className="normal-case text-[10px]">
                              Qty: {item.currentStock}
                            </Badge>
                          </div>
                        )}
                        <div>
                          <div className="h-[140px] w-full bg-slate-100 relative overflow-hidden rounded-t-lg">
                            {item.photoUrl ? (
                              <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Utensils className="w-10 h-10 m-auto" />
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full inline-block m-3 mb-1">
                            {item.category}
                          </span>
                          <h4 title={item.name} className="font-bold text-slate-900 text-base mx-3 mt-1 mb-0 capitalize line-clamp-2 whitespace-normal">{item.name}</h4>
                          <p className="font-bold text-orange-500 text-sm mx-3 mt-0.5 mb-2">{formatCurrency(item.price)}</p>
                        </div>
                        
                        {/* Footer with Edit and Delete buttons */}
                        <div className="flex gap-2 p-2 border-t border-slate-100 bg-slate-50 items-center">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="flex-1 min-h-[40px] border border-slate-300 rounded-md text-slate-600 bg-white text-[13px] font-medium cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all hover:bg-slate-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(item.id)}
                            className="w-10 h-10 min-h-[40px] min-w-[40px] border border-red-300 rounded-md text-red-500 bg-red-50 cursor-pointer inline-flex items-center justify-center transition-all hover:bg-red-100"
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
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 flex justify-end mt-0 sm:mt-8 mb-0 sm:mb-10 z-20">
                  <Button
                    onClick={() => setStep(2)}
                    icon={ChevronRight}
                    className="font-semibold shadow-md w-full sm:w-auto min-h-[44px]"
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
                <h2 className="text-2xl font-bold text-slate-900">Configure Tables & QR Codes</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Set the number of tables in your dining area. We will generate unique scan-to-order QR codes.
                </p>
              </div>

              {/* Input Stepper */}
              <div className="bg-slate-50 border border-border rounded-[12px] p-6 max-w-md mx-auto mb-8 flex flex-col items-center gap-4">
                <span className="text-sm font-semibold text-slate-700">Number of Tables</span>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                    className="w-12 h-12 min-h-[44px] min-w-[44px] bg-white rounded-full border border-border flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-600"
                    aria-label="Decrease tables"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-4xl font-extrabold text-slate-900 min-w-[60px] text-center">
                    {tableCount}
                  </span>
                  <button
                    onClick={() => setTableCount(Math.min(50, tableCount + 1))}
                    className="w-12 h-12 min-h-[44px] min-w-[44px] bg-white rounded-full border border-border flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-600"
                    aria-label="Increase tables"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 text-center max-w-[280px]">
                  Generates Table 1 to Table {tableCount}. Min 1, Max 50 tables supported for V1.
                </p>

                <Button
                  onClick={handleGenerateTables}
                  loading={generatingQrs}
                  className="mt-2 w-full font-semibold shadow-md min-h-[44px]"
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
                  <span className="text-sm text-slate-500">Loading tables...</span>
                </div>
              ) : tables.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-orange-50 border border-orange-100 rounded-[8px] p-4 gap-3">
                    <div className="flex items-center gap-2 text-orange-500">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-sm font-semibold text-orange-700">{tables.length} Table QR Codes Generated</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadAllQRs}
                      icon={Download}
                      className="border-orange-500 text-orange-500 hover:bg-orange-100 font-semibold min-h-[44px] w-full sm:w-auto"
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
                        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-100 border border-slate-100 rounded flex items-center justify-center overflow-hidden">
                          {qrUrls[t.id] ? (
                            <img src={qrUrls[t.id]} alt={`QR Table ${t.tableNumber}`} className="w-full h-full object-contain" />
                          ) : (
                            <Spinner size="sm" />
                          )}
                        </div>
                        <button
                          onClick={() => downloadSingleQR(t)}
                          className="inline-flex items-center justify-center w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border border-slate-200 hover:border-orange-500 hover:text-orange-500 transition-all text-slate-500 hover:bg-orange-50 active:scale-95"
                          title="Download PNG"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-border mt-8 gap-4">
                    <Button variant="outline" onClick={() => setStep(1)} icon={ArrowLeft} className="font-semibold min-h-[44px]">
                      Back to Menu
                    </Button>
                    <Button
                      onClick={handleFinishOnboarding}
                      loading={loading}
                      size="lg"
                      className="font-bold shadow-md animate-bounce-subtle min-h-[44px]"
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
                <div 
                  role="img" 
                  aria-label="Dish photo preview"
                  className="relative w-20 h-20 rounded-[8px] bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center overflow-hidden"
                >
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

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Dish"
          footer={
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="min-h-[44px]">
                Cancel
              </Button>
              <Button onClick={handleDeleteDish} className="font-semibold bg-red-500 hover:bg-red-600 border-red-500 text-white min-h-[44px]">
                Delete
              </Button>
            </div>
          }
        >
          <div className="py-2">
            <p className="text-slate-600 text-sm">Are you sure you want to delete this dish? This action cannot be undone.</p>
          </div>
        </Modal>

      </div>
    </div>
  );
}
