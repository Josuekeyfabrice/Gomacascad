import { Search, MapPin, ArrowRight, Tv, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const Hero = () => {
  return (
    <section className="relative pt-12 pb-20 overflow-hidden bg-background">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold"
          >
            <Zap className="w-4 h-4 fill-current" />
            La Marketplace N°1 à Goma
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] font-display"
          >
            Trouvez ce dont vous avez <br />
            <span className="text-primary relative">
              besoin, près de chez vous
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Des milliers d'annonces à découvrir à Goma. Achetez, vendez et profitez de nos services exclusifs.
          </motion.p>

          {/* Search Bar - Uzaraka Style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative max-w-3xl mx-auto mt-12"
          >
            <div className="flex flex-col md:flex-row gap-3 p-3 bg-card border-2 border-primary/10 rounded-3xl shadow-2xl backdrop-blur-sm">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input 
                  placeholder="Que recherchez-vous ? (ex: iPhone, Voiture...)" 
                  className="h-14 pl-12 border-none bg-transparent text-lg focus-visible:ring-0"
                />
              </div>
              <div className="hidden md:block w-px h-10 bg-border self-center" />
              <div className="flex items-center gap-2 px-4">
                <MapPin className="text-primary h-5 w-5" />
                <span className="font-bold">Goma</span>
              </div>
              <Button className="h-14 px-8 rounded-2xl text-lg font-bold gradient-primary shadow-lg shadow-primary/20">
                Rechercher
              </Button>
            </div>
          </motion.div>

          {/* Quick Links / Services */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 mt-12"
          >
            <Button variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5" asChild>
              <Link to="/live-tv">
                <Tv className="w-4 h-4 text-primary" />
                Live TV
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5" asChild>
              <Link to="/verify-seller">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Vendeurs Vérifiés
              </Link>
            </Button>
            <Button variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5" asChild>
              <Link to="/search">
                <ArrowRight className="w-4 h-4 text-primary" />
                Parcourir tout
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
