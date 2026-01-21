/**
 * Service TMDB pour GOMACASCADE
 * Gère la récupération des films et séries TV
 */

const TMDB_API_KEY = '3130fdf22514d8755fcac361e89739f0';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export const tmdbService = {
  /**
   * Récupère les films tendances
   */
  getTrendingMovies: async () => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=fr-FR`);
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Erreur TMDB Movies:', error);
      return [];
    }
  },

  /**
   * Récupère les séries TV tendances
   */
  getTrendingTV: async () => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&language=fr-FR`);
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Erreur TMDB TV:', error);
      return [];
    }
  },

  /**
   * Récupère les détails d'un film ou d'une série
   */
  getDetails: async (type: 'movie' | 'tv', id: number) => {
    try {
      const response = await fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=fr-FR&append_to_response=videos`);
      return await response.json();
    } catch (error) {
      console.error('Erreur TMDB Details:', error);
      return null;
    }
  },

  /**
   * Retourne l'URL complète d'une image
   */
  getImageUrl: (path: string) => {
    return path ? `${TMDB_IMAGE_BASE_URL}${path}` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop';
  }
};
