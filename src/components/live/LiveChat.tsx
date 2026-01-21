import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Send, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    user_id: string;
    name: string;
    avatar?: string;
    content: string;
    type: 'text' | 'like';
}

interface LiveChatProps {
    sessionId: string;
}

export const LiveChat = ({ sessionId }: LiveChatProps) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        // Charger l'historique des messages
        const loadHistory = async () => {
            const { data, error } = await (supabase
                .from('live_chat_messages' as any)
                .select(`
                    id,
                    user_id,
                    content,
                    message_type,
                    profiles:user_id(full_name, avatar_url)
                `) as any)
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (!error && data) {
                const formattedMessages: Message[] = data.map((m: any) => ({
                    id: m.id,
                    user_id: m.user_id,
                    name: m.profiles?.full_name || 'Utilisateur',
                    avatar: m.profiles?.avatar_url,
                    content: m.content,
                    type: m.message_type as any
                }));
                setMessages(formattedMessages);
            }
        };

        loadHistory();

        const channelName = `live-chat-${sessionId}`;
        const channel = supabase.channel(channelName, {
            config: { broadcast: { self: true } }
        });

        channel
            .on('broadcast', { event: 'message' }, ({ payload }) => {
                setMessages(prev => [...prev, payload]);
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!inputValue.trim() || !user || !channelRef.current) return;

        const newMessage: Message = {
            id: Math.random().toString(36).substring(7),
            user_id: user.id,
            name: user.user_metadata?.full_name || 'Utilisateur',
            avatar: user.user_metadata?.avatar_url,
            content: inputValue,
            type: 'text'
        };

        // Sauvegarder dans la base de données
        await (supabase.from('live_chat_messages' as any) as any).insert({
            session_id: sessionId,
            user_id: user.id,
            content: inputValue,
            message_type: 'text'
        });

        // Diffuser en temps réel
        await channelRef.current.send({
            type: 'broadcast',
            event: 'message',
            payload: newMessage
        });

        setInputValue('');
    };

    const sendLike = async () => {
        if (!user || !channelRef.current) return;

        const likeMessage: Message = {
            id: Math.random().toString(36).substring(7),
            user_id: user.id,
            name: user.user_metadata?.full_name || 'Utilisateur',
            content: '❤️',
            type: 'like'
        };

        // Optionnel: On peut aussi sauvegarder les likes si on veut
        await (supabase.from('live_chat_messages' as any) as any).insert({
            session_id: sessionId,
            user_id: user.id,
            content: '❤️',
            message_type: 'like'
        });

        await channelRef.current.send({
            type: 'broadcast',
            event: 'message',
            payload: likeMessage
        });
    };

    return (
        <div className="flex flex-col h-full bg-black/5 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-sm">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-3"
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.avatar} />
                                <AvatarFallback>{msg.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="bg-white/10 p-2 rounded-2xl rounded-tl-none">
                                <p className="text-[10px] font-bold text-primary/70">{msg.name}</p>
                                <p className="text-sm text-white">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                <Input
                    placeholder="Dites quelque chose..."
                    className="bg-white/10 border-none text-white placeholder:text-white/40 h-11 rounded-2xl"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button
                    size="icon"
                    onClick={sendMessage}
                    className="h-11 w-11 rounded-2xl gradient-primary border-none text-white"
                >
                    <Send className="h-4 w-4" />
                </Button>
                <Button
                    size="icon"
                    variant="outline"
                    onClick={sendLike}
                    className="h-11 w-11 rounded-2xl border-white/10 bg-white/10 text-pink-500 hover:bg-white/20"
                >
                    <Heart className="h-4 w-4 fill-current" />
                </Button>
            </div>
        </div>
    );
};
