import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShieldCheck, TrendingUp, Users, Heart, Award } from 'lucide-react';

interface SellerProofCardProps {
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  totalSales: number;
  followers: number;
  responseTime: string;
  successRate: number;
}

export const SellerProofCard = ({
  averageRating,
  totalReviews,
  isVerified,
  totalSales,
  followers,
  responseTime,
  successRate,
}: SellerProofCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {isVerified && (
              <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Vendeur Vérifié
              </Badge>
            )}
            {successRate >= 95 && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1">
                <Award className="h-3 w-3" />
                Vendeur de Confiance
              </Badge>
            )}
            {totalSales >= 100 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Top Vendeur
              </Badge>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rating */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {totalReviews} avis
              </p>
            </div>

            {/* Sales */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-bold text-lg">{totalSales}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                ventes complétées
              </p>
            </div>

            {/* Followers */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-lg">{followers}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                abonnés
              </p>
            </div>

            {/* Success Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-600" />
                <span className="font-bold text-lg">{successRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                taux de satisfaction
              </p>
            </div>
          </div>

          {/* Response Time */}
          <div className="p-3 bg-white/50 rounded-lg border border-primary/10">
            <p className="text-xs text-muted-foreground mb-1">Temps de réponse moyen</p>
            <p className="font-semibold text-sm">{responseTime}</p>
          </div>

          {/* Trust Indicator */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">NIVEAU DE CONFIANCE</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    level <= Math.ceil((successRate / 100) * 5)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
