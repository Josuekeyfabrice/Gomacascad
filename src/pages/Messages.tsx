import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { OnlineIndicator } from '@/components/ui/OnlineIndicator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Send, Phone, Video, Loader2, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Message, Profile } from '@/types/database';

interface Conversation {
  partnerId: string;
  partner: Profile;
  lastMessage: Message;
  unreadCount: number;
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const initialUser = searchParams.get('user') || searchParams.get('to');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialUser);
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      setLoading(true);

      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messagesData) {
        setLoading(false);
        return;
      }

      // Group by conversation partner
      const conversationMap = new Map<string, Message[]>();
      messagesData.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, []);
        }
        conversationMap.get(partnerId)!.push(msg as Message);
      });

      // Load partner profiles
      const partnerIds = Array.from(conversationMap.keys());
      if (partnerIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', partnerIds);

      const profilesMap = new Map<string, Profile>();
      profilesData?.forEach((p) => {
        profilesMap.set(p.user_id, p as Profile);
      });

      const convs: Conversation[] = [];
      conversationMap.forEach((msgs, partnerId) => {
        const partner = profilesMap.get(partnerId);
        if (partner) {
          const unreadCount = msgs.filter(m => m.receiver_id === user.id && !m.is_read).length;
          convs.push({
            partnerId,
            partner,
            lastMessage: msgs[0],
            unreadCount,
          });
        }
      });

      setConversations(convs);
      setLoading(false);
    };

    loadConversations();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!user || !selectedConversation) return;

    const loadMessages = async () => {
      // Load partner profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', selectedConversation)
        .single();

      if (profileData) {
        setSelectedPartner(profileData as Profile);
      }

      // If this is a new conversation from product page, check if conversation exists
      const productId = searchParams.get('product');

      // Load messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation}),and(sender_id.eq.${selectedConversation},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData as Message[]);
      }

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', selectedConversation)
        .eq('receiver_id', user.id);
    };

    loadMessages();

    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`conversation-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === user.id && msg.receiver_id === selectedConversation) ||
            (msg.sender_id === selectedConversation && msg.receiver_id === user.id)
          ) {
            setMessages(prev => [...prev, msg]);
            // Mark as read if received
            if (msg.receiver_id === user.id) {
              supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleTyping = () => {
    // Simulate typing indicator logic
    // In a real app, this would send a 'typing' event via Supabase Realtime
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !newMessage.trim()) return;

    setSending(true);

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedConversation,
      content: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } else {
      setNewMessage('');
    }

    setSending(false);
  };

  const initiateCall = async (type: 'voice' | 'video') => {
    if (!user || !selectedConversation) return;
    navigate(`/call/${selectedConversation}?type=${type}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-4">
          <div className="h-[calc(100vh-200px)] flex rounded-lg border bg-background overflow-hidden">
            <div className="w-full md:w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <Skeleton className="h-8 w-32" />
              </div>
              <div className="flex-1 p-4 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:flex flex-1 flex-col">
              <div className="p-4 border-b flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex-1 p-6 space-y-6">
                <div className="flex justify-start">
                  <Skeleton className="h-12 w-64 rounded-2xl rounded-tl-none" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-12 w-48 rounded-2xl rounded-tr-none" />
                </div>
                <div className="flex justify-start">
                  <Skeleton className="h-20 w-80 rounded-2xl rounded-tl-none" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="h-[calc(100vh-200px)] flex rounded-lg border bg-background overflow-hidden">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b">
              <h2 className="font-display text-xl font-bold">Messages</h2>
            </div>
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Aucune conversation
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSelectedConversation(conv.partnerId)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${selectedConversation === conv.partnerId ? 'bg-muted' : ''
                      }`}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={conv.partner.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {conv.partner.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <OnlineIndicator
                        isOnline={conv.partner.is_online}
                        size="sm"
                        className="absolute bottom-0 right-0"
                      />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{conv.partner.full_name || 'Utilisateur'}</span>
                        {conv.unreadCount > 0 && (
                          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation && selectedPartner ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={selectedPartner.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {selectedPartner.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <OnlineIndicator
                      isOnline={selectedPartner.is_online}
                      size="sm"
                      className="absolute bottom-0 right-0"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{selectedPartner.full_name || 'Utilisateur'}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedPartner.is_online ? 'En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => initiateCall('voice')}>
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => initiateCall('video')}>
                    <Video className="h-5 w-5" />
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${msg.sender_id === user.id
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-muted rounded-tl-none'
                              }`}
                          >
                            <p className="text-sm md:text-base">{msg.content}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <p className={`text-[10px] ${msg.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}>
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                              </p>
                              {msg.sender_id === user.id && (
                                msg.is_read ? (
                                  <CheckCheck className="h-3 w-3 text-primary-foreground/90" />
                                ) : (
                                  <Check className="h-3 w-3 text-primary-foreground/70" />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 flex gap-1">
                          <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Votre message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Sélectionnez une conversation
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;
