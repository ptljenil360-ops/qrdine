import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useMenu } from '../../hooks/useMenu';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useTables } from '../../hooks/useTables';
import { useToast } from '../../context/ToastContext';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../../firebase/config';

import ItemCard from '../../components/order/ItemCard';
import FloatingCartBar from '../../components/order/FloatingCartBar';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import { DEFAULT_CATEGORIES } from '../../utils/constants';
import { Utensils, Sparkles, MapPin } from 'lucide-react';
import { gsap } from 'gsap';

async function generatePinHash(pin) {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function CustomerMenuPage() {
  const { restaurantId, tableId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { menu, loading: menuLoading } = useMenu(restaurantId);
  const { restaurant, loading: restaurantLoading } = useRestaurant(restaurantId);
  const { tables, loading: tablesLoading } = useTables(restaurantId);

  const table = tables.find(t => t.id === tableId);
  const displayTableNumber = table ? table.tableNumber : '...';

  const [activeCategory, setActiveCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [isScrolled, setIsScrolled] = useState(false);

  const [searchParams] = useSearchParams();
  const sessionToken = searchParams.get('session');
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [customerRole, setCustomerRole] = useState(null); // 'host' | 'guest'
  const [claimPinInput, setClaimPinInput] = useState('');
  const [showClaimInput, setShowClaimInput] = useState(false);

  // Handle scroll for sticky header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Validate session & assign roles
  useEffect(() => {
    if (!table && !tablesLoading) {
      setIsSessionValid(false);
      return;
    }
    if (!table || !sessionToken) return;

    if (table.sessionId !== sessionToken) {
      setIsSessionValid(false);
      return;
    }

    const initRole = async () => {
      try {
        const userCred = await signInAnonymously(auth);
        const uid = userCred.user.uid;

        if (!table.hostUid) {
          // Race-lock attempt
          const pin = Math.floor(1000 + Math.random() * 9000).toString();
          try {
            const batch = writeBatch(db);
            const tableRef = doc(db, 'restaurants', restaurantId, 'tables', tableId);
            const pinRef = doc(db, 'restaurants', restaurantId, 'tables', tableId, 'private', 'pin');
            
            batch.update(tableRef, { hostUid: uid });
            
            const hostPinHash = await generatePinHash(pin);
            batch.set(pinRef, { hostPinHash });
            
            await batch.commit();
            
            // We store it in session storage so the user can see it during this session
            sessionStorage.setItem(`rashoyi_host_pin_${tableId}`, pin);
            
            setCustomerRole('host');
          } catch (err) {
            setCustomerRole('guest');
          }
        } else if (table.hostUid === uid) {
          setCustomerRole('host');
        } else {
          setCustomerRole('guest');
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initRole();
  }, [table, sessionToken, restaurantId, tableId, tablesLoading]);

  const handleClaimHost = async () => {
    try {
      const claimFn = httpsCallable(functions, 'claimHost');
      await claimFn({ restaurantId, tableId, pin: claimPinInput });
      setCustomerRole('host');
      setShowClaimInput(false);
      showToast('You are now the Host', 'success');
    } catch (err) {
      const msg = err?.code === 'functions/permission-denied' ? 'Incorrect PIN' : 'Failed to claim host';
      showToast(msg, 'error');
    }
  };

  const cart = table?.cart || [];

  // Persist cart changes to Firestore
  const saveCart = async (newCart) => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId, 'tables', tableId), {
        cart: newCart
      });
    } catch (err) {
      console.warn('Failed to save cart to Firestore:', err);
      showToast('Failed to sync cart', 'error');
    }
  };

  // Entrance animations
  useEffect(() => {
    if (!menuLoading && !restaurantLoading) {
      gsap.fromTo(
        '.customer-item-anim',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.03, ease: 'power1.out' }
      );
    }
  }, [menuLoading, restaurantLoading]);

  // Add item to cart
  const handleAddToCart = (item) => {
    const existing = cart.find((cartItem) => cartItem.id === item.id);
    let newCart;
    if (existing) {
      // Check stock limits
      if (item.stockLimit && existing.quantity >= item.currentStock) {
        showToast(`Cannot add more. Only ${item.currentStock} items in stock.`, 'warning');
        return;
      }
      newCart = cart.map((cartItem) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      newCart = [...cart, { ...item, quantity: 1, note: '' }];
    }
    saveCart(newCart);
  };

  // Remove item or decrement quantity
  const handleRemoveFromCart = (item) => {
    const existing = cart.find((cartItem) => cartItem.id === item.id);
    if (!existing) return;

    let newCart;
    if (existing.quantity === 1) {
      newCart = cart.filter((cartItem) => cartItem.id !== item.id);
    } else {
      newCart = cart.map((cartItem) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      );
    }
    saveCart(newCart);
  };

  // Calculate cart summaries
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Smooth scroll to category group
  const scrollToCategory = (category) => {
    setActiveCategory(category);
    const element = document.getElementById(`category-section-${category}`);
    if (element) {
      const offset = 120; // sticky header + category tabs offset
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const isPageLoading = menuLoading || restaurantLoading || tablesLoading || !customerRole;

  const categoriesInMenu = DEFAULT_CATEGORIES.filter((cat) =>
    menu.some((item) => item.category === cat)
  );

  if (!isSessionValid) {
    return (
      <div className="min-h-screen bg-[var(--color-customer-bg)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
          <Utensils className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[var(--color-customer-text)] mb-2">Session Expired</h2>
        <p className="text-[var(--color-customer-muted)]">This QR code is no longer active. Please ask the staff for a new QR code if you are still seated at this table.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-customer-bg)] font-sans pb-[100px] text-[var(--color-customer-text)]">
      {isPageLoading ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-3">
          <Spinner size="lg" />
          <span className="text-sm text-text-muted font-bold">Syncing fresh menu...</span>
        </div>
      ) : (
        <>
          {/* Top Sticky Nav (Glassmorphism) */}
          <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${isScrolled ? 'bg-[var(--color-customer-bg)]/80 backdrop-blur-md shadow-sm border-b border-[var(--color-customer-border)]' : 'bg-transparent'}`}>
            <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {restaurant?.logo ? (
                  <img src={restaurant.logo} alt={restaurant.name} className="w-9 h-9 rounded-[10px] object-cover shadow-sm border border-[var(--color-customer-border)]" />
                ) : (
                  <div className="w-9 h-9 rounded-[10px] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-sm">
                    <Utensils className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h1 className={`font-syne font-[700] text-[20px] tracking-[-0.02em] leading-tight capitalize transition-colors duration-300 ${isScrolled ? 'text-[var(--color-customer-text)]' : 'text-[var(--color-customer-text)]'}`}>
                    {restaurant?.name || 'Restaurant'}
                  </h1>
                  <p className={`text-[10px] font-bold tracking-wide uppercase transition-colors duration-300 ${isScrolled ? 'text-accent' : 'text-[var(--color-customer-muted)]'}`}>
                    Table {displayTableNumber}
                  </p>
                </div>
              </div>
              
              {/* Host / Guest Status */}
              <div className="text-right">
                {customerRole === 'host' ? (
                  <div className="bg-accent/10 border border-accent/20 rounded-md px-2 py-1 text-center">
                    <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Table Host</p>
                    {sessionStorage.getItem(`rashoyi_host_pin_${tableId}`) && (
                      <p className="text-[12px] font-bold text-[var(--color-customer-text)] tracking-widest">
                        PIN: {sessionStorage.getItem(`rashoyi_host_pin_${tableId}`)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-[var(--color-customer-muted)] uppercase tracking-wider px-2 py-1 bg-[var(--color-base-card)] rounded-md border border-[var(--color-customer-border)]">Guest</span>
                    {showClaimInput ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          maxLength={4}
                          value={claimPinInput}
                          onChange={(e) => setClaimPinInput(e.target.value)}
                          placeholder="PIN"
                          className="w-16 h-6 text-xs text-center border border-accent/30 bg-[var(--color-base-bg)] text-[var(--color-customer-text)] rounded outline-none"
                        />
                        <button onClick={handleClaimHost} className="bg-accent text-white h-6 px-2 text-[10px] font-bold rounded">Claim</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowClaimInput(true)} className="text-[10px] text-accent font-bold hover:underline">Claim Host</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <div className="relative pt-24 pb-12 px-4 overflow-hidden max-w-xl mx-auto">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/2 pointer-events-none" />
            
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-bold uppercase tracking-wider mb-4 border border-accent/20">
                <Sparkles className="w-3 h-3" /> Welcome
              </span>
              <h2 className="text-4xl font-black text-[var(--color-customer-text)] mb-2 leading-tight">
                Hungry? <br/>
                <span className="text-gradient">Let's order.</span>
              </h2>
              <p className="text-[var(--color-customer-muted)] text-sm font-medium flex items-center gap-1.5 mt-3">
                <MapPin className="w-4 h-4" /> Dine-in menu for Table {displayTableNumber}
              </p>
            </div>
          </div>

          {/* Sticky Category Scroll Bar */}
          <div className="sticky top-16 z-20 bg-[var(--color-customer-bg)]/90 backdrop-blur-md border-b border-[var(--color-customer-border)] shadow-sm transition-all">
            <div className="max-w-xl mx-auto">
              <div className="flex px-4 py-3 gap-2.5 overflow-x-auto scrollbar-none whitespace-nowrap">
                {categoriesInMenu.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className={`
                      px-4 py-2
                      text-[13px] font-bold 
                      rounded-full 
                      transition-all duration-300
                      cursor-pointer border
                      ${activeCategory === cat
                        ? 'bg-accent text-white border-accent shadow-sm'
                        : 'bg-[var(--color-base-card)] text-[var(--color-customer-muted)] border-[var(--color-customer-border)] hover:border-[var(--color-text-secondary)]'
                      }
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Menu List */}
          <main className="max-w-xl mx-auto px-[16px] py-[24px] space-y-[32px]">
            {menu.length === 0 ? (
              <Card variant="glass" className="text-center py-16">
                <Utensils className="w-12 h-12 text-[var(--color-customer-muted)] mx-auto mb-4" />
                <h4 className="font-bold text-[var(--color-customer-text)]">Menu is empty</h4>
                <p className="text-sm text-[var(--color-customer-muted)] mt-1">This restaurant hasn't uploaded any dishes yet.</p>
              </Card>
            ) : (
              categoriesInMenu.map((category) => (
                <section
                  key={category}
                  id={`category-section-${category}`}
                  className="scroll-mt-32"
                >
                  <h3 className="font-syne font-[600] text-[13px] tracking-[0.08em] uppercase text-[#78716C] mb-4 px-1">
                    {category}
                  </h3>
                  
                  <div className="flex flex-col gap-4">
                    {menu
                      .filter((item) => item.category === category)
                      .map((item) => {
                        const cartItem = cart.find((c) => c.id === item.id);
                        const quantity = cartItem ? cartItem.quantity : 0;

                        return (
                          <div key={item.id} className="customer-item-anim opacity-0">
                            <ItemCard
                              item={item}
                              cartQuantity={quantity}
                              onAdd={() => handleAddToCart(item)}
                              onRemove={() => handleRemoveFromCart(item)}
                            />
                          </div>
                        );
                      })}
                  </div>
                </section>
              ))
            )}
          </main>

          {/* Bottom Sticky cart bar */}
          <FloatingCartBar
            itemCount={totalItemCount}
            totalAmount={totalAmount}
            onClick={() => navigate(`/order/${restaurantId}/${tableId}/cart?session=${sessionToken}`)}
          />
        </>
      )}
    </div>
  );
}
