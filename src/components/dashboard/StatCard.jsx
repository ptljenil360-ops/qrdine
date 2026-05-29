import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Card from '../ui/Card';

/**
 * StatCard for Dashboard Home Page with GSAP Count-Up animation.
 */
export default function StatCard({ title, value, icon: Icon, prefix = '', suffix = '', duration = 0.8, className = '' }) {
  const [displayValue, setDisplayValue] = useState(typeof value === 'number' ? 0 : value);
  const countRef = useRef({ val: 0 });

  useEffect(() => {
    if (typeof value === 'number') {
      gsap.to(countRef.current, {
        val: value,
        duration: duration,
        ease: 'power2.out',
        onUpdate: () => setDisplayValue(Math.floor(countRef.current.val)),
      });
    } else {
      setDisplayValue(value);
    }
  }, [value, duration]);

  const formattedValue = typeof value === 'number' 
    ? `${prefix}${displayValue.toLocaleString('en-IN')}${suffix}` 
    : value;

  return (
    <Card hoverable className={`relative overflow-hidden ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="font-inter font-[500] text-[12px] tracking-[0.06em] uppercase text-[var(--color-text-secondary)]">
            {title}
          </span>
          <h3 className="font-syne font-[700] text-[32px] tracking-[-0.03em] text-[var(--color-text-primary)] mt-2 select-none">
            {formattedValue}
          </h3>
        </div>
        {Icon && (
          <div className="p-3 bg-orange-50 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-500/30 rounded-full text-accent flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </Card>
  );
}