
import { supabase } from '@/integrations/supabase/client';

export interface XtreamConfig {
  url: string;
  username: string;
  password: string;
}

export const IPTV_SERVERS: XtreamConfig[] = [
  { url: 'http://7smartvplayers.top:8080', username: '52546757', password: '746465877' },
  { url: 'http://7smartvplayers.top:8080', username: '0mpyvcix', password: '0uovsen8' },
  { url: 'http://7smartvplayers.top:8080', username: 'claudia0064', password: 'ccd506941' },
  { url: 'http://7smartvplayers.top:8080', username: '08588258823', password: '746465877' }
];

// Interface pour les données de l'API Xtream
export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export const iptvService = {
  // Obtenir l'URL de streaming pour une chaîne Xtream Codes
  getStreamUrl: (config: XtreamConfig, streamId: string | number, extension: string = 'm3u8') => {
    return `${config.url}/live/${config.username}/${config.password}/${streamId}.${extension}`;
  },

  // Récupérer les catégories de chaînes Live
  getLiveCategories: async (config: XtreamConfig = IPTV_SERVERS[0]): Promise<XtreamCategory[]> => {
    try {
      const url = `${config.url}/player_api.php?username=${config.username}&password=${config.password}&action=get_live_categories`;
      // Utiliser un proxy CORS pour éviter les problèmes Mixed Content sur Vercel
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return JSON.parse(data.contents);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Essayer le serveur suivant en cas d'erreur
      const currentIndex = IPTV_SERVERS.indexOf(config);
      if (currentIndex < IPTV_SERVERS.length - 1) {
        return iptvService.getLiveCategories(IPTV_SERVERS[currentIndex + 1]);
      }
      return [];
    }
  },

  // Récupérer les chaînes d'une catégorie spécifique
  getLiveStreams: async (categoryId: string, config: XtreamConfig = IPTV_SERVERS[0]): Promise<XtreamStream[]> => {
    try {
      const url = `${config.url}/player_api.php?username=${config.username}&password=${config.password}&action=get_live_streams&category_id=${categoryId}`;
      // Utiliser un proxy CORS pour éviter les problèmes Mixed Content sur Vercel
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return JSON.parse(data.contents);
    } catch (error) {
      console.error('Error fetching streams:', error);
      // Essayer le serveur suivant en cas d'erreur
      const currentIndex = IPTV_SERVERS.indexOf(config);
      if (currentIndex < IPTV_SERVERS.length - 1) {
        return iptvService.getLiveStreams(categoryId, IPTV_SERVERS[currentIndex + 1]);
      }
      return [];
    }
  },

  // Récupérer toutes les chaînes (Attention: lourd)
  getAllLiveStreams: async (config: XtreamConfig = IPTV_SERVERS[0]): Promise<XtreamStream[]> => {
    try {
      const response = await fetch(
        `${config.url}/player_api.php?username=${config.username}&password=${config.password}&action=get_live_streams`
      );
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error fetching all streams:', error);
      return [];
    }
  },

  // Obtenir l'URL d'intégration VidFast pour un film
  getVidFastMovieUrl: (tmdbId: string) => {
    return `https://vidfast.pro/movie/${tmdbId}`;
  },

  // Obtenir l'URL d'intégration VidFast pour une série
  getVidFastTVUrl: (tmdbId: string, season: number, episode: number) => {
    return `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}`;
  },

  // Obtenir l'URL d'intégration VidNest pour un film
  getVidNestMovieUrl: (tmdbId: string, server: string = 'gama') => {
    return `https://vidnest.fun/movie/${tmdbId}?server=${server}`;
  },

  // Obtenir l'URL d'intégration VidNest pour une série
  getVidNestTVUrl: (tmdbId: string, season: number, episode: number, server: string = 'alfa') => {
    return `https://vidnest.fun/tv/${tmdbId}/${season}/${episode}?server=${server}`;
  }
};
