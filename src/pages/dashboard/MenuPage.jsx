import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMenu } from '../../hooks/useMenu';
import { addMenuItem, updateMenuItem, deleteMenuItem } from '../../firebase/firestore';
import { uploadImage } from '../../utils/uploadImage';
import { formatCurrency } from '../../utils/formatCurrency';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_CATEGORIES } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import DishCard from '../../components/dashboard/DishCard';
import { Utensils, Plus, Upload } from 'lucide-react';
import { gsap } from 'gsap';

export default function MenuPage() {
  const { restaurantId } = useAuth();
  const { menu, loading, error } = useMenu(restaurantId);
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('All');
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [dishPrice, setDishPrice] = useState('');
  const [dishStockLimit, setDishStockLimit] = useState(false);
  const [dishStock, setDishStock] = useState('10');
  
  const [dishPhotoFile, setDishPhotoFile] = useState(null);
  const [dishPhotoPreview, setDishPhotoPreview] = useState(null);
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!loading) {
      gsap.fromTo('.dish-grid-item',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: 'power2.out' }
      );
    }
  }, [loading, activeTab]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error');
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
    setErrors({});
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
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const tempErrors = {};
    if (!dishName.trim()) tempErrors.name = 'Dish Name is required.';
    if (!dishPrice.trim() || isNaN(dishPrice) || Number(dishPrice) <= 0) {
      tempErrors.price = 'Price must be a positive number.';
    }
    if (dishStockLimit && (!dishStock.trim() || isNaN(dishStock) || Number(dishStock) < 0)) {
      tempErrors.stock = 'Stock must be a non-negative number.';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSaveLoading(true);
    try {
      let photoUrl = editingItem?.photoUrl || '';
      
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
      };

      if (editingItem) {
        await updateMenuItem(restaurantId, editingItem.id, dishData);
        showToast('Dish updated successfully.', 'success');
      } else {
        await addMenuItem(restaurantId, {
          ...dishData,
          available: true,
          sortOrder: menu.length,
        });
        showToast('New dish added to your menu.', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving dish:', err);
      showToast('Failed to save dish. Please try again.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteDish = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this dish?')) {
      try {
        await deleteMenuItem(restaurantId, itemId);
        showToast('Dish deleted successfully.', 'success');
      } catch (err) {
        console.error('Delete item error:', err);
        showToast('Failed to delete dish.', 'error');
      }
    }
  };

  const handleToggleAvailable = async (itemId, currentStatus) => {
    try {
      await updateMenuItem(restaurantId, itemId, { available: !currentStatus });
      showToast(`Dish marked as ${!currentStatus ? 'available' : 'unavailable'}.`, 'success');
    } catch (err) {
      console.error('Toggle availability error:', err);
      showToast('Failed to update availability status.', 'error');
    }
  };

  const filteredMenu = menu.filter((item) => {
    if (activeTab === 'All') return true;
    return item.category === activeTab;
  });

  const filterTabs = ['All', ...DEFAULT_CATEGORIES];

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h1 className="text-[24px] font-[700] text-[var(--color-text-primary)] mb-[4px]">
            Menu Manager
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Build and update your restaurant's digital menu in real-time.
          </p>
        </div>
        <Button
          onClick={openAddModal}
          icon={Plus}
          className="bg-[#F97316] text-[#FFFFFF] hover:bg-[#EA580C] font-[700] border-none shadow-md"
        >
          Add New Dish
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 text-[13px] rounded-full transition-all duration-200 focus:outline-none cursor-pointer border
              ${activeTab === tab 
                ? 'bg-[var(--color-text-primary)] text-[var(--color-base-bg)] font-[700] border-[var(--color-text-primary)] shadow-sm' 
                : 'bg-[var(--color-base-card)] text-[var(--color-text-secondary)] font-[600] border-[var(--color-border)] hover:border-[#F97316] hover:text-[#F97316]'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center pt-20 pb-12 gap-3 w-full bg-[var(--color-base-card)] shadow-[var(--shadow-card)] rounded-[16px] border border-[var(--color-border)]">
          <Spinner size="md" color="primary" className="w-8 h-8" />
          <span className="text-[14px] text-[var(--color-text-muted)] font-[500]">Loading digital menu...</span>
        </div>
      ) : error ? (
        <Card className="text-center py-16 border-red-200 bg-red-50">
          <p className="text-[14px] text-red-600 font-[600]">Failed to load menu: {error}</p>
        </Card>
      ) : filteredMenu.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center w-full bg-[var(--color-base-card)] shadow-[var(--shadow-card)] rounded-[16px] border border-[var(--color-border)]">
          <Utensils className="w-16 h-16 text-[var(--color-border)] mb-4" />
          <h3 className="text-[16px] font-[700] text-[var(--color-text-primary)]">No dishes in this category</h3>
          <p className="text-[14px] text-[var(--color-text-secondary)] max-w-sm mx-auto mt-2 mb-6">
            Add starters, mains, breads, drinks or desserts to populate your menu.
          </p>
          <Button
            onClick={openAddModal}
            icon={Plus}
            className="bg-[#F97316] text-[#FFFFFF] hover:bg-[#EA580C] font-[700] border-none shadow-md"
          >
            Add New Dish
          </Button>
        </div>
      ) : (
        /* Dish Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMenu.map((item) => (
            <div key={item.id} className="dish-grid-item">
              <DishCard
                item={item}
                onEdit={openEditModal}
                onDelete={handleDeleteDish}
                onToggleAvailable={handleToggleAvailable}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Dish Details' : 'Create New Menu Item'}
        footer={
          <div className="flex gap-3 w-full sm:w-auto sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saveLoading}
              className="flex-1 sm:flex-none border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-base-bg)] font-[600]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDish}
              loading={saveLoading}
              className="flex-1 sm:flex-none bg-[#F97316] text-[#FFFFFF] hover:bg-[#EA580C] font-[700] border-none"
            >
              {editingItem ? 'Save Changes' : 'Create Dish'}
            </Button>
          </div>
        }
      >
        <form className="space-y-5">
          <Input
            id="dishName"
            label="Dish Name"
            placeholder="e.g. Garlic Naan"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            error={errors.name}
            required
            className="bg-[var(--color-base-card)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
          />
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dishCategory" className="text-[13px] font-[600] text-[var(--color-text-secondary)] uppercase tracking-wide">
              Category
            </label>
            <select
              id="dishCategory"
              value={dishCategory}
              onChange={(e) => setDishCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-[var(--color-base-card)] border border-[var(--color-border)] rounded-[8px] text-[15px] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[#F97316] focus:border-[#F97316] min-h-[44px] transition-colors shadow-sm"
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
            placeholder="e.g. 80"
            value={dishPrice}
            onChange={(e) => setDishPrice(e.target.value)}
            error={errors.price}
            required
            className="bg-[var(--color-base-card)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
          />
          
          {/* Photo upload inside Modal */}
          <div className="flex flex-col gap-1.5 pt-2">
            <span className="text-[13px] font-[600] text-[var(--color-text-secondary)] uppercase tracking-wide">Dish Photo</span>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-[8px] bg-[var(--color-base-bg)] border border-dashed border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                {dishPhotoPreview ? (
                  <img src={dishPhotoPreview} alt="Dish preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-[var(--color-text-muted)]" />
                )}
              </div>
              <div>
                <label
                  htmlFor="dish-photo-upload"
                  className="inline-flex items-center px-4 py-2 border border-[var(--color-border)] rounded-[8px] text-[14px] font-[600] text-[var(--color-text-primary)] bg-[var(--color-base-card)] hover:bg-[var(--color-base-bg)] cursor-pointer transition-colors shadow-sm"
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
                <p className="text-[12px] text-[var(--color-text-muted)] mt-2">
                  PNG/JPG. Resized to 800px and compressed before uploading.
                </p>
              </div>
            </div>
          </div>
          
          {/* Stock tracking control */}
          <div className="bg-[var(--color-base-bg)] border border-[var(--color-border)] rounded-[12px] p-4 space-y-3 mt-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-[14px] font-[700] text-[var(--color-text-primary)]">Track Stock Limit</span>
                <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">Automatically mark item as sold out when stock hits zero</p>
              </div>
              <input
                type="checkbox"
                checked={dishStockLimit}
                onChange={(e) => setDishStockLimit(e.target.checked)}
                className="rounded text-[#F97316] focus:ring-[#F97316] border-[var(--color-border)] w-5 h-5 cursor-pointer"
              />
            </label>
            
            {dishStockLimit && (
              <div className="animate-slide-down pt-2">
                <Input
                  id="dishStock"
                  label="Current Available Stock"
                  placeholder="e.g. 20"
                  value={dishStock}
                  onChange={(e) => setDishStock(e.target.value)}
                  error={errors.stock}
                  required
                  className="bg-[var(--color-base-card)] text-[var(--color-text-primary)] border-[var(--color-border)] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
                />
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}