import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import PromoSection from '@/components/PromoSection';
import OrderForm from '@/components/OrderForm';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Header />
      <HeroSection />
      <PromoSection />
      <OrderForm />
      <Footer />
    </main>
  );
}
