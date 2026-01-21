import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Message {
    role: 'assistant' | 'user';
    content: string;
}

const APP_INFO = {
    name: "Goma Cascade",
    features: {
        marketplace: "Achetez et vendez des produits localement ou à distance.",
        liveShopping: "Participez à des ventes en direct avec vidéo et chat en temps réel.",
        liveTV: "Regardez des chaînes de télévision en direct via IPTV Premium.",
        wallet: "Gérez votre argent et effectuez des transactions sécurisées.",
        calls: "Passez des appels audio et vidéo de haute qualité avec vos contacts.",
        studies: "Apprenez l'informatique, l'anglais et plus encore via notre nouvelle page d'études en ligne."
    }
};

export const AIChatAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `Bonjour ! Je suis l'assistant IA de Goma Cascade. Comment puis-je vous aider aujourd'hui ? Je peux vous parler du Marketplace, du Live Shopping, de l'IPTV ou même de nos cours en ligne.`
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setIsLoading(true);

        // Simulate AI thinking
        setTimeout(() => {
            let response = "Désolé, je ne suis pas sûr de comprendre. Pourriez-vous reformuler ? Je peux vous aider avec le Marketplace, la TV en direct ou le Live Shopping.";

            const lowerLowerMessage = userMessage.toLowerCase();

            if (lowerLowerMessage.includes("vendre") || lowerLowerMessage.includes("acheter") || lowerLowerMessage.includes("marketplace") || lowerLowerMessage.includes("produit")) {
                response = `${APP_INFO.features.marketplace} Vous pouvez cliquer sur le bouton 'Vendre' pour ajouter vos propres articles.`;
            } else if (lowerLowerMessage.includes("live shopping") || lowerLowerMessage.includes("direct") || lowerLowerMessage.includes("streaming")) {
                response = `${APP_INFO.features.liveShopping} C'est un excellent moyen de voir les produits en action avant de les acheter.`;
            } else if (lowerLowerMessage.includes("tele") || lowerLowerMessage.includes("tv") || lowerLowerMessage.includes("iptv") || lowerLowerMessage.includes("chaine")) {
                response = `${APP_INFO.features.liveTV} Allez dans la section 'IPTV Premium' pour commencer à regarder.`;
            } else if (lowerLowerMessage.includes("argent") || lowerLowerMessage.includes("wallet") || lowerLowerMessage.includes("payer") || lowerLowerMessage.includes("portefeuille")) {
                response = `${APP_INFO.features.wallet} Vous pouvez consulter votre solde dans la section 'Mon Portefeuille'.`;
            } else if (lowerLowerMessage.includes("appel") || lowerLowerMessage.includes("video") || lowerLowerMessage.includes("camera")) {
                response = `${APP_INFO.features.calls} Vous pouvez appeler vos amis directement depuis vos discussions.`;
            } else if (lowerLowerMessage.includes("etude") || lowerLowerMessage.includes("cours") || lowerLowerMessage.includes("apprendre") || lowerLowerMessage.includes("anglais") || lowerLowerMessage.includes("informatique")) {
                response = `${APP_INFO.features.studies} Nous proposons des ressources pour l'informatique, l'anglais et d'autres matières.`;
            } else if (lowerLowerMessage.includes("salut") || lowerLowerMessage.includes("bonjour")) {
                response = "Bonjour ! Quel plaisir de vous voir. Que voulez-vous savoir sur Goma Cascade ?";
            }

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[60]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[350px] sm:w-[400px]"
                    >
                        <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 gradient-primary text-primary-foreground rounded-t-xl">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Bot className="h-5 w-5" />
                                    Assistant Goma Cascade
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="text-primary-foreground hover:bg-white/20"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                                    <div className="space-y-4">
                                        {messages.map((message, index) => (
                                            <div
                                                key={index}
                                                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'
                                                    }`}
                                            >
                                                <div
                                                    className={`flex gap-2 max-w-[80%] ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'
                                                        }`}
                                                >
                                                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                        {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                                    </div>
                                                    <div
                                                        className={`rounded-2xl px-4 py-2 text-sm ${message.role === 'assistant'
                                                                ? 'bg-muted text-foreground rounded-tl-none'
                                                                : 'gradient-primary text-primary-foreground rounded-tr-none'
                                                            }`}
                                                    >
                                                        {message.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-muted rounded-2xl px-4 py-2 rounded-tl-none flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                    <span className="text-sm text-muted-foreground italic">L'assistant réfléchit...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="flex w-full items-center gap-2"
                                >
                                    <Input
                                        placeholder="Posez votre question..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        disabled={isLoading}
                                        className="flex-1"
                                    />
                                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="gradient-primary">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <Button
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-2xl gradient-primary relative"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                    {!isOpen && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground animate-bounce">
                            1
                        </Badge>
                    )}
                </Button>
            </motion.div>
        </div>
    );
};
