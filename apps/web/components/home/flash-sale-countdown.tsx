'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActiveCampaigns } from '@/lib/services/campaign-client';
import type { CampaignInput } from '@bananasbindery/core';

export function FlashSaleCountdown() {
  const { data: campaigns = [] } = useQuery<CampaignInput[]>({
    queryKey: ['active-campaigns'],
    queryFn: () => getActiveCampaigns(),
    refetchInterval: 60000, // Refresh campaign list every minute
  });

  const flashSale = useMemo(() => {
    return campaigns.find((c) => c.type === 'flash_sale');
  }, [campaigns]);

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!flashSale || !flashSale.endsAt) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(flashSale.endsAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(timer);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale]);

  if (!flashSale || !timeLeft) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6460' }}>
        Berakhir dalam
      </span>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: 13,
          color: '#E53935', // Changed to red as per price color mandate
        }}
      >
        {timeLeft}
      </span>
    </div>
  );
}
