'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import PromoSection from '@/components/PromoSection';
import OrderForm from '@/components/OrderForm';
import Footer from '@/components/Footer';
import HistoryModal from '@/components/HistoryModal';
import MiniGameModal from '@/components/MiniGameModal';

export default function Home() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [miniGameOpen, setMiniGameOpen] = useState(false);

  return (
    <main>
      <Header
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenMiniGame={() => setMiniGameOpen(true)}
      />
      <HeroSection />
      <PromoSection />
      <OrderForm />
      <Footer />

      <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      <MiniGameModal isOpen={miniGameOpen} onClose={() => setMiniGameOpen(false)} />
    </main>
  );
}
