import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/home/Hero';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { Stories } from '@/components/home/Stories';
import { Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <Header />
      <main className="flex-1 space-y-12 pb-20">
        <Hero />
        
        <div className="container mx-auto px-4 -mt-12 relative z-10 space-y-12">
          <CategoryGrid />
          
          <section className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-white">
                <Zap className="h-5 w-5 text-primary fill-current" /> Ventes Flash 24h
              </h2>
              <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-3 py-1 rounded-full">GOMA LIVE</span>
            </div>
            <Stories />
          </section>
        </div>

        <div className="container mx-auto px-4 space-y-20">
          <TrendingProducts />
          <FeaturedProducts />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
