import { useState, useEffect } from 'react';

export type DeviceTier = 'high' | 'mid' | 'low';
export type DeviceBrand = 'samsung' | 'apple' | 'other' | 'unknown';

export function useDevice() {
  const [isMobile, setIsMobile] = useState(false);
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('high');
  const [deviceBrand, setDeviceBrand] = useState<DeviceBrand>('unknown');

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isMob = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth < 1024;
    setIsMobile(isMob);

    let tier: DeviceTier = 'high';
    let brand: DeviceBrand = 'unknown';

    // Simple heuristic detection for modern devices to apply optimizations
    // "após o a13": A14, A15, A24, A34, A54, A55, S23, S24
    if (/SM-A(14|15|24|25|34|35|54|55)/i.test(ua)) {
      brand = 'samsung';
      tier = 'mid'; // Mid-range
    } else if (/SM-S(911|916|918|921|926|928)/i.test(ua) || /S23|S24/i.test(ua)) {
      brand = 'samsung';
      tier = 'high';
    } else if (/SM-A(0|10|11|12|13)/i.test(ua) || /Galaxy A13/i.test(ua)) {
      // Below or equal to A13
      brand = 'samsung';
      tier = 'low';
    } else if (/iPhone/i.test(ua)) {
      brand = 'apple';
      // Basic iPhone generation detection via iOS version or screen size heuristically, 
      // but usually iPhones handle animation well. Let's look for iOS version.
      const match = ua.match(/OS (\d+)_/);
      if (match && parseInt(match[1], 10) >= 16) {
        tier = 'high'; // Probably iPhone 14/15/16
      } else if (match && parseInt(match[1], 10) < 15) {
        tier = 'low';
      } else {
        tier = 'mid';
      }
    } else if (isMob) {
      // Generic fallback - Check logical cores or memory if available
      const cores = navigator.hardwareConcurrency || 4;
      if (cores <= 4) tier = 'low';
      else if (cores <= 6) tier = 'mid';
      else tier = 'high';
    }

    setDeviceBrand(brand);
    setDeviceTier(tier);

    // Apply classes for CSS optimizations
    const root = document.documentElement;
    root.classList.remove('device-tier-low', 'device-tier-mid', 'device-tier-high');
    root.classList.add(`device-tier-${tier}`);
    if (isMob) {
      root.classList.add('is-mobile');
    } else {
      root.classList.remove('is-mobile');
    }
  }, []);

  return { isMobile, deviceTier, deviceBrand };
}
