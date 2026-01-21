import { supabase } from "@/integrations/supabase/client";

export interface LiveSession {
    id: string;
    seller_id: string;
    title: string;
    description: string | null;
    status: 'scheduled' | 'live' | 'ended';
    start_time: string;
    stream_key: string | null;
    thumbnail_url: string | null;
    viewers_count: number;
    likes_count: number;
    featured_products: string[];
    created_at: string;
}

export const liveStreamService = {
    /**
     * Récupère les sessions en direct
     */
    getLiveSessions: async () => {
        const { data, error } = await supabase
            .from('live_sessions')
            .select(`
        *,
        seller:profiles(full_name, avatar_url)
      `)
            .eq('status', 'live')
            .order('viewers_count', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Récupère les sessions programmées
     */
    getScheduledSessions: async () => {
        const { data, error } = await supabase
            .from('live_sessions')
            .select(`
        *,
        seller:profiles(full_name, avatar_url)
      `)
            .eq('status', 'scheduled')
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Crée une nouvelle session de live
     */
    createSession: async (sellerId: string, title: string, description: string) => {
        const { data, error } = await supabase
            .from('live_sessions')
            .insert({
                seller_id: sellerId,
                title,
                description,
                status: 'live', // Directement en live pour ce test
                start_time: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Ajoute un like à une session
     */
    addLike: async (sessionId: string) => {
        const { data } = await supabase.from('live_sessions').select('likes_count').eq('id', sessionId).single();
        await supabase.from('live_sessions').update({ likes_count: (data?.likes_count || 0) + 1 }).eq('id', sessionId);
    },

    /**
     * Termine une session
     */
    endSession: async (sessionId: string) => {
        const { error } = await supabase
            .from('live_sessions')
            .update({ status: 'ended' })
            .eq('id', sessionId);

        if (error) throw error;
    }
};
