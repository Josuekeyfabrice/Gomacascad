import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES, CITIES } from '@/types/database';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Loader2, ArrowLeft } from 'lucide-react';
import { GeolocationPicker } from '@/components/maps/GeolocationPicker';

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    city: '',
    avenue: '',
    address: '',
    phone: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const handleLocationChange = useCallback((lat: number | null, lng: number | null) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  }, []);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    const fetchProduct = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        toast({
          title: 'Erreur',
          description: 'Produit non trouvé',
          variant: 'destructive',
        });
        navigate('/my-products');
        return;
      }

      if (data.seller_id !== user?.id) {
        toast({
          title: 'Accès refusé',
          description: 'Vous ne pouvez modifier que vos propres produits',
          variant: 'destructive',
        });
        navigate('/my-products');
        return;
      }

      setFormData({
        name: data.name,
        description: data.description || '',
        price: data.price.toString(),
        category: data.category || '',
        city: data.city,
        avenue: data.avenue || '',
        address: data.address || '',
        phone: data.phone,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      });
      setExistingImages(data.images || []);
      setLoading(false);
    };

    if (user) {
      fetchProduct();
    }
  }, [id, user, authLoading, navigate, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length - imagesToRemove.length + newImages.length + files.length;
    
    if (totalImages > 5) {
      toast({
        title: 'Limite atteinte',
        description: 'Maximum 5 images par produit',
        variant: 'destructive',
      });
      return;
    }
    setNewImages([...newImages, ...files]);
  };

  const removeExistingImage = (imageUrl: string) => {
    setImagesToRemove([...imagesToRemove, imageUrl]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of newImages) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, image);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload new images
      const newImageUrls = await uploadNewImages();

      // Combine existing images (minus removed ones) with new images
      const finalImages = [
        ...existingImages.filter(img => !imagesToRemove.includes(img)),
        ...newImageUrls,
      ];

      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          city: formData.city,
          avenue: formData.avenue,
          address: formData.address,
          phone: formData.phone,
          images: finalImages,
          latitude: formData.latitude,
          longitude: formData.longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Produit mis à jour avec succès',
      });
      navigate('/my-products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le produit',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayedExistingImages = existingImages.filter(img => !imagesToRemove.includes(img));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/my-products')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Modifier l'annonce</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Photos ({displayedExistingImages.length + newImages.length}/5)
            </label>
            <div className="flex flex-wrap gap-2">
              {displayedExistingImages.map((imageUrl, index) => (
                <div key={`existing-${index}`} className="relative w-20 h-20">
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(imageUrl)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newImages.map((image, index) => (
                <div key={`new-${index}`} className="relative w-20 h-20">
                  <img
                    src={URL.createObjectURL(image)}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {displayedExistingImages.length + newImages.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    multiple
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Titre de l'annonce *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Prix (CDF) *
            </label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              min="0"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Catégorie
            </label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ville *
            </label>
            <Select
              value={formData.city}
              onValueChange={(value) => setFormData({ ...formData, city: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une ville" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Avenue & Address */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Avenue
              </label>
              <Input
                value={formData.avenue}
                onChange={(e) => setFormData({ ...formData, avenue: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Adresse
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Téléphone *
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          {/* Geolocation */}
          <GeolocationPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
          />

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </Button>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default EditProduct;
