import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                <span className="text-xl font-bold text-primary-foreground">G</span>
              </div>
              <span className="font-display text-xl font-bold">
                GOMA<span className="text-primary">CASCADE</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              La marketplace de Goma et ses environs. Achetez et vendez facilement en toute sécurité.
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold">Catégories</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/search?category=Électronique" className="hover:text-primary transition-colors">Électronique</Link></li>
              <li><Link to="/search?category=Véhicules" className="hover:text-primary transition-colors">Véhicules</Link></li>
              <li><Link to="/search?category=Immobilier" className="hover:text-primary transition-colors">Immobilier</Link></li>
              <li><Link to="/search?category=Mode" className="hover:text-primary transition-colors">Mode & Vêtements</Link></li>
            </ul>
          </div>

          {/* Useful Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Liens utiles</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">À propos</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Confidentialité</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Conditions d'utilisation</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Goma, Nord-Kivu, RDC
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                +243 991 291 980
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                +243 893 645 600
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                contact@gomacascade.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} GOMACASCADE. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};
