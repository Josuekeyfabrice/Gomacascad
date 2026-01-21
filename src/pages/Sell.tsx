import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES, CITIES } from '@/types/database';
import { Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GeolocationPicker } from '@/components/maps/GeolocationPicker';

const Sell = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFlashSale = searchParams.get('type') === 'flash';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    city: 'Goma',
    avenue: '',
    address: '',
    phone: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const handleLocationChange = useCallback((lat: number | null, lng: number | null) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez vous connecter pour publier une annonce",
        variant: "destructive",
      });
      navigate('/auth?mode=signup&redirect=/sell');
    }
  }, [user, authLoading, navigate, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast({
        title: "Maximum 5 images",
        description: "Vous ne pouvez pas ajouter plus de 5 images",
        variant: "destructive",
      });
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setImageUrls(prev => [...prev, url]);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (images.length === 0) {
      toast({
        title: "Images requises",
        description: "Ajoutez au moins une image de votre produit",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const uploadedImages = await uploadImages();

      if (isFlashSale) {
        // Create a Story for Flash Sale
        const { error: storyError } = await supabase.from('stories').insert({
          user_id: user.id,
          image_url: uploadedImages[0],
          product_name: formData.name,
          price: `${formData.price}$`,
          is_live: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

        if (storyError) throw storyError;

        toast({
          title: "Vente Flash publiée !",
          description: "Votre story est maintenant visible par tous pendant 24h.",
        });
        
        navigate('/');
      } else {
        // Regular product listing
        const { error } = await supabase.from('products').insert({
          seller_id: user.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          city: formData.city,
          avenue: formData.avenue,
          address: formData.address,
          phone: formData.phone,
          images: uploadedImages,
          latitude: formData.latitude,
          longitude: formData.longitude,
        });

        if (error) throw error;

        toast({
          title: "Annonce publiée",
          description: "Votre annonce a été publiée avec succès",
        });

        navigate('/my-products');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de publier l'annonce",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl font-bold mb-2">
            {isFlashSale ? 'Créer une Vente Flash' : 'Publier une annonce'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isFlashSale 
              ? 'Votre offre sera affichée en haut de la page d\'accueil pendant 24 heures.' 
              : 'Remplissez les détails ci-dessous pour mettre votre produit en vente.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images */}
            <div className="space-y-2">
              <Label>{isFlashSale ? 'Photo de la Story *' : 'Photos du produit *'}</Label>
              <div className="grid grid-cols-3 gap-4">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mt-2">Ajouter</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Titre de l'annonce *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: iPhone 14 Pro Max 256GB"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre produit en détail..."
                rows={4}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Prix (USD) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label>Ville *</Label>
              <Select
                value={formData.city}
                onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une ville" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Avenue */}
            <div className="space-y-2">
              <Label htmlFor="avenue">Avenue</Label>
              <Input
                id="avenue"
                value={formData.avenue}
                onChange={(e) => setFormData(prev => ({ ...prev, avenue: e.target.value }))}
                placeholder="Ex: Avenue du Lac"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Ex: Quartier Himbi, N°25"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+243..."
                required
              />
            </div>

            {/* Geolocation */}
            <GeolocationPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={handleLocationChange}
            />

            <Button
              type="submit" 
              className="w-full gradient-primary text-primary-foreground h-12 text-lg font-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publication...
                </>
              ) : (
                isFlashSale ? 'Lancer la Vente Flash' : 'Publier l\'annonce'
              )}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Sell;
