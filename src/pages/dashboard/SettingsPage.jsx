import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateRestaurantProfile } from '../../firebase/firestore';
import { uploadImage } from '../../utils/uploadImage';
import { useToast } from '../../context/ToastContext';
import { sendVerification, deleteUserAccount } from '../../firebase/auth';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { Building, Lock, CreditCard, Upload, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { GST_RATES } from '../../utils/constants';

export default function SettingsPage() {
  const { restaurant, restaurantId } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(auth.currentUser?.emailVerified || false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstRate, setGstRate] = useState(5);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [autoUpdatePwa, setAutoUpdatePwa] = useState(() => {
    return localStorage.getItem('autoUpdatePwa') === 'true';
  });

  const handleToggleAutoUpdate = () => {
    const newVal = !autoUpdatePwa;
    setAutoUpdatePwa(newVal);
    localStorage.setItem('autoUpdatePwa', String(newVal));
    showToast(`Auto Update is now ${newVal ? 'ON' : 'OFF'}`, 'success');
  };

  useEffect(() => {
    if (restaurant) {
      setRestaurantName(restaurant.name || '');
      setOwnerName(restaurant.ownerName || '');
      setEmail(restaurant.email || '');
      setPhone(restaurant.phone || '');
      setAddress(restaurant.address || '');
      setGstNumber(restaurant.gstNumber || '');
      setGstRate(restaurant.gstRate || 5);
      if (restaurant.logo) {
        setLogoPreview(restaurant.logo);
      }
    }
  }, [restaurant]);

  const handleSendVerification = async () => {
    setEmailLoading(true);
    try {
      const sent = await sendVerification();
      if (sent) {
        showToast('Verification email sent! Please check your inbox.', 'success');
      } else {
        showToast('Verification cannot be sent for internal registry accounts.', 'warning');
      }
    } catch (err) {
      console.error('Email verification error:', err);
      showToast('Failed to send verification email.', 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file.', 'error');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!restaurantName.trim()) {
      showToast('Restaurant name is required.', 'error');
      return;
    }
    if (!ownerName.trim()) {
      showToast('Owner name is required.', 'error');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    
    setLoading(true);
    try {
      let logoUrl = restaurant?.logo || '';
      if (logoFile) {
        logoUrl = await uploadImage(`logos/${restaurantId}/logo_${Date.now()}.jpg`, logoFile);
      }
      await updateRestaurantProfile(restaurantId, {
        name: restaurantName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        gstNumber: gstNumber.trim(),
        gstRate: Number(gstRate),
        logo: logoUrl,
      });
      showToast('Restaurant profile updated successfully.', 'success');
      setLogoFile(null);
    } catch (err) {
      console.error('Update profile error:', err);
      showToast('Failed to update profile details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const tempErrors = {};
    if (!newPassword) {
      tempErrors.password = 'New Password is required.';
    } else {
      const hasMinLength = newPassword.length >= 8;
      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasLowercase = /[a-z]/.test(newPassword);
      const hasDigit = /\d/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      if (!hasMinLength) {
        tempErrors.password = 'Password must be at least 8 characters long.';
      } else if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
        tempErrors.password = 'Password must include uppercase, lowercase, number, and special character.';
      }
    }
    if (newPassword !== confirmPassword) {
      tempErrors.confirm = 'Passwords do not match.';
    }
    if (Object.keys(tempErrors).length > 0) {
      setPasswordErrors(tempErrors);
      return;
    }
    
    setPasswordErrors({});
    setSecurityLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        showToast('Password changed successfully!', 'success');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('Please sign in again to change password.', 'error');
      }
      setPasswordErrors({});
    } catch (error) {
      console.error('Password update failed:', error);
      if (error.code === 'auth/requires-recent-login') {
        showToast('Please re-authenticate to change password.', 'error');
      } else {
        setPasswordErrors({ general: 'Failed to update password. Please try again.' });
      }
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and will delete all your restaurant data.')) {
      return;
    }
    const confirmText = window.prompt(`Please type "DELETE" to confirm account deletion.`);
    if (confirmText !== 'DELETE') {
      showToast('Account deletion cancelled.', 'info');
      return;
    }
    
    setDeleteLoading(true);
    try {
      await deleteUserAccount(auth.currentUser);
      showToast('Account deleted successfully.', 'success');
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        showToast('Please log out and log back in to verify your identity before deleting your account.', 'error');
      } else {
        showToast('Failed to delete account. Please try again.', 'error');
      }
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatExpiryDate = (dateVal) => {
    if (!dateVal) return '';
    const date = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Top Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-[4px]">
          Restaurant Settings
        </h1>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          Customize your restaurant profile, billing policies, and login password.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-base-card)] shadow-[var(--shadow-card)] rounded-[16px] p-6">
            <h3 className="text-[13px] font-[600] text-[#696969] uppercase tracking-[0.06em] mb-[12px] flex items-center gap-2">
              <Building className="w-4 h-4" /> General Restaurant Details
            </h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-6 mt-4">
              
              {/* Logo Selection */}
              <div className="flex flex-col gap-2 pb-5 border-b border-[#F0F0F0]">
                <span className="text-[13px] font-[500] text-[#696969]">Restaurant Logo</span>
                <div className="flex items-center gap-5">
                  <div className="relative w-[80px] h-[80px] rounded-[12px] bg-[#F4F4F4] border border-dashed border-[#E8E8E8] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-8 h-8 text-[#696969]" />
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="settings-logo-upload"
                      className="inline-flex items-center bg-[#FFFFFF] border border-[#1C1C1C] rounded-[6px] text-[13px] text-[#1C1C1C] font-medium px-[14px] py-[6px] cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      Change Logo
                    </label>
                    <input
                      id="settings-logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <p className="text-xs text-[#696969] mt-2">
                      Recommended square ratio. Compressed automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="restaurantName" className="text-[13px] font-[500] text-[#696969]">Restaurant Name</label>
                  <input
                    id="restaurantName"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="The Curry Palace"
                    required
                    className="h-[48px] px-[16px] py-[12px] leading-normal rounded-[8px] bg-[#FFFFFF] border border-[#E8E8E8] text-[#1C1C1C] text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ownerName" className="text-[13px] font-[500] text-[#696969]">Owner/Manager Full Name</label>
                  <input
                    id="ownerName"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Rahul Sharma"
                    required
                    className="h-[48px] px-[16px] py-[12px] leading-normal rounded-[8px] bg-[#FFFFFF] border border-[#E8E8E8] text-[#1C1C1C] text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-[13px] font-[500] text-[#696969]">Contact Phone (Verified)</label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    disabled
                    required
                    className="h-[48px] px-[16px] py-[12px] leading-normal rounded-[8px] bg-gray-50 border border-[#E8E8E8] text-[#696969] text-sm cursor-not-allowed opacity-80"
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <label htmlFor="email" className="text-[13px] font-[500] text-[#696969]">Contact Email (Optional)</label>
                  <input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@gmail.com"
                    className="h-[48px] px-[16px] py-[12px] leading-normal rounded-[8px] bg-[#FFFFFF] border border-[#E8E8E8] text-[#1C1C1C] text-sm focus:outline-none focus:border-[#F97316]"
                  />
                  {email && (
                    <div className="flex items-center gap-2 mt-1 px-1">
                      {isEmailVerified ? (
                        <div className="flex items-center gap-1 text-[11px] text-green-600 font-bold uppercase tracking-wider">
                          <CheckCircle className="w-3.5 h-3.5" /> Verified
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold uppercase tracking-wider">
                            <AlertTriangle className="w-3.5 h-3.5" /> Unverified
                          </div>
                          <button
                            type="button"
                            onClick={handleSendVerification}
                            disabled={emailLoading}
                            className="text-[11px] font-bold text-[#F97316] hover:text-[#EA580C] disabled:opacity-50 cursor-pointer"
                          >
                            {emailLoading ? 'Sending...' : 'Send Verification Link'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="gstNumber" className="text-[13px] font-[500] text-[#696969]">GSTIN / FSSAI Registration</label>
                  <input
                    id="gstNumber"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    className="h-[48px] px-[16px] py-[12px] leading-normal rounded-[8px] bg-[#FFFFFF] border border-[#E8E8E8] text-[#1C1C1C] text-sm focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="address" className="text-[13px] font-[500] text-[#696969]">Restaurant Address</label>
                <input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Connaught Place, New Delhi"
                  required
                  className="h-[48px] px-[16px] py-[12px] leading-normal rounded-[8px] bg-[#FFFFFF] border border-[#E8E8E8] text-[#1C1C1C] text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>

              {/* GST rate configuration */}
              <div className="flex flex-col gap-2 pt-5 border-t border-[#F0F0F0]">
                <span className="text-[13px] font-[500] text-[#696969]">Menu Tax Rate (GST)</span>
                <div className="grid grid-cols-2 gap-0 border border-[#E8E8E8] rounded-[8px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setGstRate(5)}
                    className={`h-[48px] text-center font-bold text-sm transition-all cursor-pointer ${
                      gstRate === 5
                        ? 'bg-[#F97316] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] text-[#696969]'
                    }`}
                  >
                    5% (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstRate(18)}
                    className={`h-[48px] text-center font-bold text-sm transition-all cursor-pointer ${
                      gstRate === 18
                        ? 'bg-[#F97316] text-[#FFFFFF]'
                        : 'bg-[#FFFFFF] text-[#696969] border-l border-[#E8E8E8]'
                    }`}
                  >
                    18% (AC/Premium)
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end pt-5 border-t border-[#F0F0F0]">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#F97316] text-[#FFFFFF] font-bold rounded-[8px] h-[48px] px-8 hover:bg-[#EA580C] transition-colors disabled:opacity-70 flex items-center justify-center min-w-[160px]"
                >
                  {loading ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Security & Subscription (Spans 1 column) */}
        <div className="space-y-6">
          
          <div className="bg-[#FFFFFF] border border-[#E8E8E8] rounded-[12px] p-[20px] shadow-sm">
            
            {/* Subscription Section */}
            <div className="mb-6 pb-6 border-b border-[#F0F0F0]">
              <div className="mb-4">
                <span className="text-[11px] font-[600] text-[#696969] tracking-[0.08em] uppercase block">
                  Current Plan
                </span>
                <p className="text-[22px] font-[700] text-[#F97316] mt-1">
                  {restaurant?.plan || 'Trial'}
                </p>
              </div>
              
              <div className="mb-4">
                <span className="text-[11px] font-[600] text-[#696969] tracking-[0.08em] uppercase block">
                  Expires On
                </span>
                <p className="text-[14px] font-[600] text-[#1C1C1C] mt-1">
                  {restaurant?.planExpiry ? formatExpiryDate(restaurant.planExpiry) : 'None'}
                </p>
              </div>
              
              <div className="bg-[#FFF8F0] border border-[#FFE4CC] rounded-[8px] p-[12px]">
                <p className="text-[13px] text-[#F97316]">
                  Subscription billing integrations are currently in closed testing. Trial is free.
                </p>
              </div>
            </div>

            {/* App Preferences */}
            <div className="mb-6 pb-6 border-b border-[#F0F0F0]">
              <h3 className="text-[14px] font-[600] text-[#1C1C1C] mb-[12px] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#F97316]" /> App Preferences
              </h3>
              
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-[8px] border border-[#E8E8E8]">
                <div>
                  <h4 className="text-[13px] font-[600] text-[#1C1C1C]">Auto Update App</h4>
                  <p className="text-[12px] text-[#696969] mt-0.5 max-w-[200px]">
                    Automatically install new versions of RaShoyi in the background.
                  </p>
                </div>
                
                <button
                  onClick={handleToggleAutoUpdate}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoUpdatePwa ? 'bg-[#F97316]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoUpdatePwa ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="mb-6">
              <h3 className="text-[14px] font-[600] text-[#1C1C1C] mb-[12px]">
                Update Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="newPassword" className="text-[13px] font-[500] text-[#696969]">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className={`h-[48px] px-[16px] py-[12px] leading-normal rounded-[8px] bg-[#FFFFFF] border ${passwordErrors.password ? 'border-red-500' : 'border-[#E8E8E8]'} text-[#1C1C1C] text-sm focus:outline-none focus:border-[#F97316]`}
                  />
                  {passwordErrors.password && <span className="text-xs text-red-500">{passwordErrors.password}</span>}
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirmPassword" className="text-[13px] font-[500] text-[#696969]">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    required
                    className={`h-[48px] px-[16px] py-[12px] leading-normal rounded-[8px] bg-[#FFFFFF] border ${passwordErrors.confirm ? 'border-red-500' : 'border-[#E8E8E8]'} text-[#1C1C1C] text-sm focus:outline-none focus:border-[#F97316]`}
                  />
                  {passwordErrors.confirm && <span className="text-xs text-red-500">{passwordErrors.confirm}</span>}
                </div>
                
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="w-full bg-[#F97316] text-[#FFFFFF] font-[600] rounded-[8px] h-[44px] hover:bg-[#EA580C] transition-colors disabled:opacity-70 flex items-center justify-center"
                >
                  {securityLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#FFF5F5] border border-[#FFD5D5] rounded-[12px] p-[16px] mt-[16px]">
              <h3 className="text-[15px] font-[700] text-[#CC0000] mb-1">
                Danger Zone
              </h3>
              <p className="text-[13px] text-[#696969] mb-4">
                Once you delete your account, there is no going back. All data will be permanently removed.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="text-[#CC0000] text-[13px] font-[600] border border-[#CC0000] bg-transparent rounded-[6px] px-[16px] py-[8px] hover:bg-red-50 transition-colors"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
}