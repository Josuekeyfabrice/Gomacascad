import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, X, ShoppingCart, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const Stories = () => {
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate('/sell?type=flash');
  };

  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
        {/* Add Story Button */}
        <div 
          className="flex-none flex flex-col items-center gap-2 cursor-pointer"
          onClick={handleAddStory}
        >
          <div className="relative h-20 w-20 rounded-full bg-white/5 border-2 border-dashed border-gray-600 flex items-center justify-center group hover:border-primary transition-colors">
            <Plus className="h-8 w-8 text-gray-400 group-hover:text-primary" />
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 border-2 border-[#0a0a0a]">
              <Zap className="h-3 w-3 text-white fill-current" />
            </div>
          </div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Ma Story</span>
        </div>

        {/* Real Stories from Supabase */}
        {loading ? (
          <div className="flex items-center justify-center h-20 w-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          stories.map((story) => (
            <div 
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className="flex-none flex flex-col items-center gap-2 cursor-pointer"
            >
              <div className={`h-20 w-20 rounded-full p-1 border-2 ${story.is_live ? 'border-primary animate-pulse' : 'border-gray-700'}`}>
                <div className="h-full w-full rounded-full overflow-hidden border-2 border-[#0a0a0a]">
                  <img 
                    src={story.image_url} 
                    alt={story.profiles?.full_name} 
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[10px] font-black text-white uppercase tracking-tighter line-clamp-1 w-20 text-center">
                {story.profiles?.full_name || 'Vendeur'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Full Screen Story Viewer - Custom Implementation for better reliability */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black p-0 sm:p-4"
          >
            <div className="relative h-full w-full max-w-[450px] bg-black overflow-hidden aspect-[9/16] sm:rounded-[2rem] shadow-2xl">
              {/* Progress Bar */}
              <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
                <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    onAnimationComplete={() => setSelectedStory(null)}
                    className="h-full bg-white"
                  />
                </div>
              </div>

              {/* Header */}
              <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-2 border-primary p-0.5">
                    <img src={selectedStory.profiles?.avatar_url || ''} className="h-full w-full rounded-full object-cover" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm">{selectedStory.profiles?.full_name || 'Vendeur'}</p>
                    <p className="text-white/60 text-[10px] font-bold uppercase">En direct de Goma</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStory(null);
                  }}
                  className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-8 w-8" />
                </button>
              </div>

              {/* Main Image */}
              <img 
                src={selectedStory.image_url} 
                className="h-full w-full object-cover"
                alt="Story"
              />

              {/* Footer / Action */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-32">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-white font-black text-2xl tracking-tighter">{selectedStory.product_name}</h3>
                    <p className="text-primary font-black text-3xl">{selectedStory.price}</p>
                  </div>
                  <div className="bg-primary text-white px-4 py-1.5 rounded-full font-black text-xs animate-pulse">
                    VENTE FLASH
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      if (selectedStory.product_id) {
                        navigate(`/product/${selectedStory.product_id}`);
                        setSelectedStory(null);
                      }
                    }}
                    className="flex-1 gradient-primary h-16 rounded-2xl font-black text-lg gap-2 shadow-lg shadow-primary/20"
                  >
                    <ShoppingCart className="h-6 w-6" /> Voir l'offre
                  </Button>
                  <Button 
                    onClick={() => {
                      navigate(`/messages?to=${selectedStory.user_id}`);
                      setSelectedStory(null);
                    }}
                    variant="outline" 
                    className="h-16 w-16 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    <MessageCircle className="h-7 w-7" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
