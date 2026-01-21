import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tv as TvIcon,
  Play as PlayIcon,
  Lock as LockIcon,
  Clock as ClockIcon,
  Film as FilmIcon,
  MonitorPlay as MonitorPlayIcon,
  TrendingUp as TrendingUpIcon,
  ChevronRight,
  Star as StarIcon,
  Zap as ZapIcon,
  Check as CheckIcon,
  X as XIcon,
  Info as InfoIcon,
  Volume2,
  Maximize,
  Search as SearchIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { tmdbService } from '@/services/tmdb';
import { iptvService, IPTV_SERVERS, type XtreamCategory, type XtreamStream } from '@/services/iptv';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Hls from 'hls.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const FREE_LIMIT_SECONDS = 23 * 60 * 60; // 23 heures gratuites

const LiveTV = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [timeLeft, setTimeLeft] = useState(FREE_LIMIT_SECONDS);
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState("tv");
  const [movies, setMovies] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasPass, setHasPass] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [premiumCategories, setPremiumCategories] = useState<XtreamCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [premiumChannels, setPremiumChannels] = useState<XtreamStream[]>([]);
  const [isLoadingPremium, setIsLoadingPremium] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('iptv-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const channels = [
    { id: 1, name: "France 24", category: "Infos", url: "https://dash4.antik.sk/live/test_france24_france/playlist.m3u8", color: "bg-blue-600", isYoutube: false },
    { id: 2, name: "Africa 24", category: "Infos", url: "https://africa24.vedge.infomaniak.com/livecast/ik:africa24/manifest.m3u8", color: "bg-yellow-600", isYoutube: false },
    { id: 3, name: "Africanews French", category: "Infos", url: "https://cdn-euronews.akamaized.net/live/eds/africanews-fr/25050/index.m3u8", color: "bg-red-600", isYoutube: false },
    { id: 4, name: "Euronews French", category: "Infos", url: "https://viamotionhsi.netplus.ch/live/eds/euronews/browser-HLS8/euronews.m3u8", color: "bg-blue-800", isYoutube: false },
    { id: 5, name: "France 2", category: "Général", url: "http://69.64.57.208/france2/mono.m3u8", color: "bg-red-500", isYoutube: false },
    { id: 6, name: "France 5", category: "Général", url: "http://69.64.57.208/france5/mono.m3u8", color: "bg-green-500", isYoutube: false },
    { id: 7, name: "Arte HD", category: "Culture", url: "https://dash4.antik.sk/live/test_arte_avc_25p/playlist.m3u8", color: "bg-orange-500", isYoutube: false },
    { id: 8, name: "Africa 24 Sport", category: "Sports", url: "https://africa24.vedge.infomaniak.com/livecast/ik:africa24sport/manifest.m3u8", color: "bg-green-600", isYoutube: false },
    { id: 9, name: "FIFA+ French", category: "Sports", url: "https://37b4c228.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWZyX0ZJRkFQbHVzRnJlbmNoX0hMUw/playlist.m3u8", color: "bg-red-700", isYoutube: false },
    { id: 10, name: "Clubbing TV France", category: "Musique", url: "https://d1j2csarxnwazk.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-uze1m6xh4fiyr-ssai-prd/master.m3u8", color: "bg-purple-600", isYoutube: false },
    { id: 11, name: "DBM TV", category: "Musique", url: "https://dbmtv.vedge.infomaniak.com/livecast/dbmtv/playlist.m3u8", color: "bg-pink-600", isYoutube: false },
    { id: 12, name: "A2i Music", category: "Musique", url: "https://stream.sen-gt.com/A2iMusic/myStream/playlist.m3u8", color: "bg-indigo-600", isYoutube: false },
    { id: 13, name: "Digital Congo TV", category: "Infos", url: "http://51.254.199.122:8080/DigitalCongoTV/index.m3u8", color: "bg-orange-600", isYoutube: false },
    { id: 14, name: "Tele Congo", category: "Général", url: "http://69.64.57.208/telecongo/playlist.m3u8", color: "bg-green-700", isYoutube: false },
    { id: 15, name: "Congo Planet TV", category: "Général", url: "https://radio.congoplanet.com/Congo_Planet_TV.sdp/Congo_Planet_TV/playlist.m3u8", color: "bg-blue-700", isYoutube: false },
    { id: 16, name: "Africa 24 English", category: "Infos", url: "https://edge20.vedge.infomaniak.com/livecast/ik:africa24english/manifest.m3u8", color: "bg-yellow-700", isYoutube: false },
    { id: 17, name: "4 Kurd Music", category: "Musique", url: "https://4kuhls.persiana.live/hls/stream.m3u8", color: "bg-red-400", isYoutube: false },
    { id: 18, name: "Al Jazeera English", category: "Infos", url: "https://live-hls-web-aje.getaj.net/AJE/index.m3u8", color: "bg-orange-800", isYoutube: false },
  ];

  const [currentChannel, setCurrentChannel] = useState(channels[0]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const trendingMovies = await tmdbService.getTrendingMovies();
        const trendingTV = await tmdbService.getTrendingTV();
        setMovies(trendingMovies);
        setSeries(trendingTV);
      } catch (error) {
        console.error("Erreur TMDB:", error);
      }
    };
    loadData();

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsLocked(true);
          setShowPaywall(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Gestion du lecteur HLS pour l'IPTV
  useEffect(() => {
    const isIptvTab = activeTab === "tv" || activeTab === "premium";
    if (videoRef.current && !playerUrl && isIptvTab) {
      const video = videoRef.current;
      const streamUrl = currentChannel.url;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.log("Autoplay blocked"));
        });
        return () => hls.destroy();
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => console.log("Autoplay blocked"));
        });
      }
    }
  }, [currentChannel, playerUrl, activeTab]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const handlePay = (plan: string) => {
    const message = `Bonjour GOMACASCADE, je souhaite acheter le Pass TV/Ciné "${plan}".`;
    window.open(`https://wa.me/243893645600?text=${encodeURIComponent(message)}`, '_blank');
  };

  const playMedia = (media: any, type: 'movie' | 'tv') => {
    if (isLocked && !hasPass) {
      setShowPaywall(true);
      return;
    }
    setSelectedMedia({ ...media, type });

    let baseUrl = "";
    // Utilisation prioritaire de VidFast/VidNest pour une meilleure qualité
    if (type === 'movie') {
      baseUrl = iptvService.getVidFastMovieUrl(media.id);
    } else {
      baseUrl = iptvService.getVidFastTVUrl(media.id, season, episode);
    }

    setPlayerUrl(baseUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Charger les catégories Premium au démarrage
  useEffect(() => {
    const loadPremiumData = async () => {
      try {
        const categories = await iptvService.getLiveCategories();
        setPremiumCategories(categories);
      } catch (err) {
        console.error("Erreur chargement catégories:", err);
      }
    };
    loadPremiumData();
  }, []);

  // Charger les chaînes quand une catégorie est sélectionnée
  useEffect(() => {
    const loadChannels = async () => {
      if (activeTab === 'premium' && selectedCategory !== "all") {
        setIsLoadingPremium(true);
        try {
          const streams = await iptvService.getLiveStreams(selectedCategory);
          setPremiumChannels(streams);
        } catch (err) {
          toast({
            title: "Erreur de chargement",
            description: "Impossible de charger les chaînes pour cette catégorie.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingPremium(false);
        }
      }
    };
    loadChannels();
  }, [activeTab, selectedCategory]);

  const playPremiumChannel = (stream: XtreamStream) => {
    if (isLocked && !hasPass) {
      setShowPaywall(true);
      return;
    }

    const config = IPTV_SERVERS[0];
    const url = iptvService.getStreamUrl(config, stream.stream_id);

    setCurrentChannel({
      id: stream.stream_id,
      name: stream.name,
      category: "Premium",
      url,
      color: "bg-purple-600",
      isYoutube: false
    });
    setPlayerUrl(null); // S'assurer qu'on utilise le lecteur HLS
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = (streamId: number) => {
    setFavorites(prev => {
      const newFavs = prev.includes(streamId)
        ? prev.filter(id => id !== streamId)
        : [...prev, streamId];
      localStorage.setItem('iptv-favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const filteredChannels = premiumChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const favoriteChannels = premiumChannels.filter(channel =>
    favorites.includes(channel.stream_id)
  );

  const togglePiP = async () => {
    try {
      if (videoRef.current && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <Header />

      <main className="flex-1 pb-20">
        {/* Hero Section / Player */}
        <div className="relative aspect-video w-full max-h-[80vh] bg-black overflow-hidden group shadow-2xl">
          {isLocked && !hasPass ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl z-50 p-6 text-center">
              <div className="p-8 bg-primary/20 rounded-full mb-8 animate-bounce">
                <LockIcon className="h-20 w-20 text-primary" />
              </div>
              <h2 className="text-4xl font-black mb-4 font-display tracking-tighter">Votre essai de 23h est terminé !</h2>
              <p className="text-gray-400 max-w-md mb-10 text-lg">
                Pour continuer à profiter du meilleur du cinéma et de la TV à Goma, activez votre accès illimité.
              </p>
              <Button onClick={() => setShowPaywall(true)} className="gradient-primary h-16 rounded-2xl font-bold text-xl px-12 shadow-lg shadow-primary/20">
                Activer mon Pass
              </Button>
            </div>
          ) : (
            <>
              {playerUrl || currentChannel.isYoutube ? (
                <div className="relative w-full h-full">
                  <iframe
                    key={playerUrl || currentChannel.url}
                    src={playerUrl || currentChannel.url}
                    className="w-full h-full border-none"
                    allowFullScreen
                    allow="autoplay; encrypted-media"
                    title="Video Player"
                  ></iframe>
                  {playerUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 bg-black/50 hover:bg-red-600 text-white rounded-full z-20"
                      onClick={() => {
                        setPlayerUrl(null);
                        setSelectedMedia(null);
                      }}
                    >
                      <XIcon className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    muted={false}
                  />
                  {/* PiP Button Overlay */}
                  <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-black/50 hover:bg-primary text-white rounded-full h-12 w-12"
                      onClick={togglePiP}
                      title="Picture-in-Picture"
                    >
                      <Maximize className="h-6 w-6" />
                    </Button>
                  </div>
                  <div className="absolute bottom-10 left-10 z-10 hidden group-hover:block">
                    <h2 className="text-3xl font-black drop-shadow-2xl">{currentChannel.name}</h2>
                    <p className="text-primary font-bold">EN DIRECT • {currentChannel.category}</p>
                  </div>
                </div>
              )}

              {/* Overlay Info */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                <Badge className="bg-red-600 text-white border-none px-4 py-1.5 font-black animate-pulse shadow-lg shadow-red-600/20">
                  • {playerUrl ? "CINÉMA" : "LIVE TV"}
                </Badge>
                <span className="text-sm font-black bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-xl">
                  {playerUrl ? (selectedMedia?.title || selectedMedia?.name) : currentChannel.name}
                </span>
              </div>

              {!hasPass && (
                <div className="absolute top-4 right-16 z-10">
                  <div className="bg-primary/90 backdrop-blur-xl px-5 py-2 rounded-full flex items-center gap-3 border border-white/20 shadow-2xl">
                    <ClockIcon className="h-5 w-5 text-white animate-spin-slow" />
                    <span className="font-mono font-black text-white">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="container mx-auto px-4 mt-10">
          <Tabs defaultValue="tv" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-[2rem] mb-12 max-w-md mx-auto flex">
              <TabsTrigger value="tv" className="rounded-[1.5rem] gap-2 flex-1 py-3 data-[state=active]:bg-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30">
                <TvIcon className="h-5 w-5" /> Live TV
              </TabsTrigger>
              <TabsTrigger value="movies" className="rounded-[1.5rem] gap-2 flex-1 py-3 data-[state=active]:bg-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30">
                <FilmIcon className="h-5 w-5" /> Cinéma
              </TabsTrigger>
              <TabsTrigger value="series" className="rounded-[1.5rem] gap-2 flex-1 py-3 data-[state=active]:bg-primary data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30">
                <MonitorPlayIcon className="h-5 w-5" /> Séries
              </TabsTrigger>
              <TabsTrigger value="premium" className="rounded-[1.5rem] gap-2 flex-1 py-3 data-[state=active]:bg-purple-600 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-600/30">
                <ZapIcon className="h-5 w-5" /> Premium
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tv" className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black font-display tracking-tight">Chaînes IPTV Directes</h3>
                <Badge variant="outline" className="border-white/10 text-gray-400 px-4 py-1">
                  {channels.length} Canaux Stables
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {channels.map((channel) => (
                  <motion.div
                    key={channel.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCurrentChannel(channel);
                      setPlayerUrl(null);
                      if (isLocked) setShowPaywall(true);
                    }}
                    className={`p-6 rounded-[2rem] cursor-pointer border-2 transition-all shadow-xl ${currentChannel.id === channel.id && !playerUrl
                      ? 'border-primary bg-primary/10 shadow-primary/10'
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl ${channel.color}`}>
                        {channel.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-lg">{channel.name}</p>
                        <p className="text-sm text-gray-500 font-medium">{channel.category}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="movies" className="space-y-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                {movies.map((movie) => (
                  <motion.div
                    key={movie.id}
                    className="group cursor-pointer"
                    whileHover={{ y: -10 }}
                    onClick={() => playMedia(movie, 'movie')}
                  >
                    <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden mb-4 shadow-2xl border border-white/5">
                      <img
                        src={tmdbService.getImageUrl(movie.poster_path)}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                          <PlayIcon className="h-7 w-7 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                    <h4 className="font-black text-sm line-clamp-1">{movie.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <StarIcon className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-gray-400">{movie.vote_average.toFixed(1)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="series" className="space-y-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                {series.map((show) => (
                  <motion.div
                    key={show.id}
                    className="group cursor-pointer"
                    whileHover={{ y: -10 }}
                    onClick={() => playMedia(show, 'tv')}
                  >
                    <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden mb-4 shadow-2xl border border-white/5">
                      <img
                        src={tmdbService.getImageUrl(show.poster_path)}
                        alt={show.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                          <PlayIcon className="h-7 w-7 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                    <h4 className="font-black text-sm line-clamp-1">{show.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <StarIcon className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-gray-400">{show.vote_average.toFixed(1)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>





            <TabsContent value="premium" className="space-y-8">
              <div className="flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black font-display tracking-tight text-purple-400">Chaînes Premium Goma</h3>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-300 px-4 py-1">
                    Accès VIP Xtream
                  </Badge>
                </div>

                {/* Sélecteur de Catégories */}
                <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar scroll-smooth">
                  {premiumCategories.map((cat) => (
                    <Button
                      key={cat.category_id}
                      variant={selectedCategory === cat.category_id ? "default" : "outline"}
                      className={`rounded-full whitespace-nowrap ${selectedCategory === cat.category_id
                        ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                        : "border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                        }`}
                      onClick={() => {
                        setSelectedCategory(cat.category_id);
                        setSearchTerm(""); // Reset search when category changes
                      }}
                    >
                      {cat.category_name}
                    </Button>
                  ))}
                </div>

                {/* Barre de Recherche */}
                <div className="relative max-w-xl">
                  <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400/50" />
                  <input
                    type="text"
                    placeholder="Rechercher une chaîne premium..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-purple-900/10 border border-purple-500/20 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-purple-500/50 focus:bg-purple-900/20 transition-all font-medium placeholder:text-purple-400/30"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400/50 hover:text-white"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Section Favoris (si présents) */}
                {favoriteChannels.length > 0 && (
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center gap-3">
                      <StarIcon className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                      <h4 className="text-xl font-black text-yellow-500">Mes Favoris</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {favoriteChannels.map((stream) => (
                        <motion.div
                          key={`fav-${stream.stream_id}`}
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => playPremiumChannel(stream)}
                          className="p-6 rounded-[2rem] cursor-pointer border-2 border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 transition-all shadow-xl group relative"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(stream.stream_id);
                            }}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-yellow-500 transition-colors"
                          >
                            <StarIcon className="h-5 w-5 fill-yellow-500" />
                          </button>
                          <div className="flex items-center gap-5">
                            {stream.stream_icon ? (
                              <img
                                src={stream.stream_icon}
                                alt={stream.name}
                                className="h-16 w-16 rounded-2xl object-cover bg-black/20"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${stream.name}&background=9333ea&color=fff&size=64`;
                                }}
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl bg-purple-600">
                                {stream.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-lg truncate group-hover:text-purple-300 transition-colors">{stream.name}</p>
                              <p className="text-sm text-purple-400 font-medium">FAVORI HD</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="h-px bg-white/5 w-full mt-10" />
                  </div>
                )}

                {/* Liste des chaînes */}
                {isLoadingPremium ? (
                  <div className="flex justify-center py-20">
                    <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : selectedCategory === "all" ? (
                  <div className="text-center py-20 text-gray-500">
                    <ZapIcon className="h-16 w-16 mx-auto mb-4 opacity-50 text-purple-500" />
                    <p className="text-xl">Sélectionnez une catégorie pour voir les chaînes</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredChannels.map((stream) => (
                      <motion.div
                        key={stream.stream_id}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => playPremiumChannel(stream)}
                        className="p-6 rounded-[2rem] cursor-pointer border-2 border-purple-500/10 bg-purple-500/5 hover:bg-purple-500/10 transition-all shadow-xl group relative"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(stream.stream_id);
                          }}
                          className={`absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 transition-colors ${favorites.includes(stream.stream_id) ? 'text-yellow-500' : 'text-white/30 hover:text-white/80'
                            }`}
                        >
                          <StarIcon className={`h-5 w-5 ${favorites.includes(stream.stream_id) ? 'fill-yellow-500' : ''}`} />
                        </button>
                        <div className="flex items-center gap-5">
                          {stream.stream_icon ? (
                            <img
                              src={stream.stream_icon}
                              alt={stream.name}
                              className="h-16 w-16 rounded-2xl object-cover bg-black/20"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${stream.name}&background=9333ea&color=fff&size=64`;
                              }}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xl bg-purple-600">
                              {stream.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-lg truncate group-hover:text-purple-300 transition-colors">{stream.name}</p>
                            <p className="text-sm text-purple-400 font-medium">PREMIUM HD</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {premiumChannels.length === 0 && !isLoadingPremium && selectedCategory !== "all" && (
                  <div className="text-center py-10 text-gray-500">
                    Aucune chaîne trouvée dans cette catégorie.
                  </div>
                )}

                <div className="bg-purple-900/20 border border-purple-500/20 p-6 rounded-[2rem] mt-8">
                  <p className="text-center text-purple-300 font-bold">
                    Note : Les chaînes premium nécessitent un abonnement actif. Contactez le support pour activer votre accès Xtream Codes.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Paywall Dialog */}
        <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
          <DialogContent className="sm:max-w-[550px] rounded-[3rem] bg-[#121212] border-white/10 text-white p-8 shadow-[0_0_50px_rgba(var(--primary),0.2)]">
            <DialogHeader>
              <DialogTitle className="text-4xl font-black text-center flex flex-col items-center gap-6">
                <div className="p-6 bg-primary/20 rounded-full shadow-2xl shadow-primary/20">
                  <ZapIcon className="h-12 w-12 text-primary fill-current animate-pulse" />
                </div>
                GOMACASCADE TV Premium
              </DialogTitle>
              <DialogDescription className="text-center text-xl text-gray-400 mt-4">
                Votre essai de 23h est terminé. Passez en Premium pour un accès illimité à Goma !
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-8">
              {[
                { name: 'Pass Journalier', price: '1$', features: ['24h illimité', 'Films & Séries 1080p', 'Toutes les chaînes TV', 'Support 24/7'] },
                { name: 'Pass Mensuel', price: '5$', features: ['30 jours illimité', 'Films & Séries 1080p', 'Toutes les chaînes TV', 'Sans Publicités', 'Accès Prioritaire'] },
              ].map((plan) => (
                <div key={plan.name} className="p-6 rounded-[2.5rem] border-2 border-white/10 hover:border-primary transition-all group cursor-pointer bg-white/5 hover:bg-white/10 shadow-xl" onClick={() => handlePay(plan.name)}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-2xl">{plan.name}</h3>
                    <span className="text-3xl font-black text-primary">{plan.price}</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                        <CheckIcon className="h-5 w-5 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-8 h-14 rounded-2xl font-black text-lg group-hover:gradient-primary shadow-lg">
                    Activer maintenant
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 font-bold">
              Paiement instantané via M-Pesa, Airtel Money et Orange Money.
            </p>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default LiveTV;
