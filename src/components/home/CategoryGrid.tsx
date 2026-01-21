import { Link } from 'react-router-dom';
import { CATEGORIES } from '@/types/database';
import { motion } from 'framer-motion';
import {
  Smartphone,
  Car,
  Home,
  Shirt,
  Sofa,
  Dumbbell,
  Wrench,
  Briefcase,
  UtensilsCrossed,
  Package,
  Tv,
  PlayCircle
} from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  'Électronique': <Smartphone className="h-6 w-6" />,
  'Véhicules': <Car className="h-6 w-6" />,
  'Immobilier': <Home className="h-6 w-6" />,
  'Mode & Vêtements': <Shirt className="h-6 w-6" />,
  'Maison & Jardin': <Sofa className="h-6 w-6" />,
  'Sports & Loisirs': <Dumbbell className="h-6 w-6" />,
  'Services': <Wrench className="h-6 w-6" />,
  'Emploi': <Briefcase className="h-6 w-6" />,
  'Alimentation': <UtensilsCrossed className="h-6 w-6" />,
  'Netflix': <PlayCircle className="h-6 w-6" />,
  'Live TV': <Tv className="h-6 w-6" />,
  'Autres': <Package className="h-6 w-6" />,
};

const categoryColors: Record<string, string> = {
  'Électronique': 'bg-blue-500/10 text-blue-600',
  'Véhicules': 'bg-red-500/10 text-red-600',
  'Immobilier': 'bg-green-500/10 text-green-600',
  'Mode & Vêtements': 'bg-pink-500/10 text-pink-600',
  'Maison & Jardin': 'bg-amber-500/10 text-amber-600',
  'Sports & Loisirs': 'bg-purple-500/10 text-purple-600',
  'Services': 'bg-cyan-500/10 text-cyan-600',
  'Emploi': 'bg-indigo-500/10 text-indigo-600',
  'Alimentation': 'bg-orange-500/10 text-orange-600',
  'Netflix': 'bg-red-600/10 text-red-600',
  'Live TV': 'bg-blue-600/10 text-blue-600',
  'Autres': 'bg-gray-500/10 text-gray-600',
};

export const CategoryGrid = () => {
  const allCategories = [...CATEGORIES, 'Netflix', 'Live TV'];

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-black">Parcourir par catégorie</h2>
          <p className="text-muted-foreground text-sm">Trouvez rapidement ce que vous cherchez</p>
        </div>
        <Link to="/search" className="text-primary font-bold text-sm hover:underline">
          Voir tout
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-6">
        {allCategories.map((category, index) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={category === 'Live TV' ? '/live-tv' : `/search?category=${encodeURIComponent(category)}`}
              className="group flex flex-col items-center gap-3"
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl ${categoryColors[category]}`}>
                {categoryIcons[category]}
              </div>
              <span className="text-xs md:text-sm font-bold text-center group-hover:text-primary transition-colors">
                {category}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
