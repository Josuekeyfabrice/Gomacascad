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
        marketplace: "Achetez et vendez des produits localement ou à distance. Cliquez sur 'Vendre' pour ajouter un article.",
        liveShopping: "Assistez à des ventes en direct. Pour participer, allez dans 'Live Shopping', choisissez une session et interagissez avec le vendeur en temps réel.",
        liveTV: "Regardez des chaînes premium via IPTV. Accédez à la section 'IPTV' pour voir la liste des chaînes disponibles.",
        wallet: "Gérez votre solde. Pour payer, utilisez votre portefeuille Goma Wallet lors de la validation de commande ou via QR code.",
        calls: "Appels audio et vidéo gratuits. Ouvrez une conversation avec un contact et cliquez sur l'icône caméra ou téléphone.",
        studies: "Formations gratuites. Visitez la page 'Études' pour accéder aux cours d'informatique, d'anglais et de business."
    },
    guides: {
        payment: "Pour effectuer un paiement : 1. Rechargez votre Wallet. 2. Choisissez un produit. 3. Sélectionnez 'Goma Wallet' comme mode de paiement au checkout.",
        selling: "Pour vendre : 1. Cliquez sur le bouton 'Vendre' en haut de l'écran. 2. Prenez des photos. 3. Ajoutez une description et un prix.",
        streaming: "Pour lancer un Live Shopping : Vous devez être un vendeur vérifié. Allez dans votre tableau de bord vendeur et cliquez sur 'Démarrer le Direct'."
    }
};

export const AIChatAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `Bonjour ! Je suis l'assistant IA de Goma Cascade. Voici les services que je peux vous présenter :
- 🛒 **Marketplace** : Acheter et vendre
- 🎥 **Live Shopping** : Ventes en direct interactives
- 📺 **IPTV Premium** : Chaînes de télé en direct
- 💳 **Goma Wallet** : Paiements sécurisés
- 📞 **Appels & Vidéo** : Communication gratuite
- 📚 **Goma Studies** : Cours en ligne gratuits

Comment puis-je vous aider précisément ?`
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
            let response = "Je n'ai pas bien compris votre demande. Je peux vous renseigner sur le Marketplace, le Live Shopping, l'IPTV, le Wallet, les Appels ou les Études. Que souhaitez-vous savoir ?";

            const msg = userMessage.toLowerCase();

            if (msg.includes("vendre") || msg.includes("vendeur")) {
                response = APP_INFO.guides.selling;
            } else if (msg.includes("payer") || msg.includes("paiement") || msg.includes("acheter") || msg.includes("argent")) {
                response = `${APP_INFO.features.wallet} ${APP_INFO.guides.payment}`;
            } else if (msg.includes("live shopping") || msg.includes("direct") || msg.includes("streaming") || msg.includes("stream")) {
                response = `${APP_INFO.features.liveShopping} ${APP_INFO.guides.streaming}`;
            } else if (msg.includes("tele") || msg.includes("tv") || msg.includes("iptv") || msg.includes("chaine")) {
                response = APP_INFO.features.liveTV;
            } else if (msg.includes("appel") || msg.includes("video") || msg.includes("camera") || msg.includes("téléphone")) {
                response = APP_INFO.features.calls;
            } else if (msg.includes("etude") || msg.includes("cours") || msg.includes("apprendre") || msg.includes("anglais") || msg.includes("informatique") || msg.includes("formé") || msg.includes("formation")) {
                response = APP_INFO.features.studies;
            } else if (msg.includes("marketplace") || msg.includes("produit") || msg.includes("article")) {
                response = APP_INFO.features.marketplace;
            } else if (msg.includes("+") || msg.includes("-") || msg.includes("*") || msg.includes("/") || msg.includes("combien font") || msg.includes("calculer")) {
                response = "Je peux vous aider pour des calculs simples ! Pour des opérations complexes, je vous recommande d'utiliser une calculatrice dédiée ou de suivre nos cours d'informatique.";
                // Simple math evaluator simulator
                try {
                    const mathMatch = userMessage.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
                    if (mathMatch) {
                        const [_, n1, op, n2] = mathMatch;
                        const num1 = parseFloat(n1);
                        const num2 = parseFloat(n2);
                        let res = 0;
                        if (op === '+') res = num1 + num2;
                        if (op === '-') res = num1 - num2;
                        if (op === '*') res = num1 * num2;
                        if (op === '/') res = num1 / num2;
                        response = `Le résultat de ${n1} ${op} ${n2} est ${res}.`;
                    }
                } catch (e) {
                    response = "Je n'ai pas pu calculer cela, essayez une opération simple comme '2 + 2'.";
                }
            } else if (msg.includes("histoire") || msg.includes("qui a") || msg.includes("quand") || msg.includes("fondé") || msg.includes("goma")) {
                if (msg.includes("goma")) {
                    response = "Goma est la capitale de la province du Nord-Kivu en République démocratique du Congo. C'est une ville dynamique située au bord du lac Kivu.";
                } else {
                    response = "C'est une excellente question historique ! Vous trouverez de nombreuses ressources sur l'histoire et la géographie dans notre section 'Goma Studies'.";
                }
            } else if (msg.includes("salut") || msg.includes("bonjour") || msg.includes("hello")) {
                response = "Bonjour ! Je suis prêt à vous guider à travers les fonctionnalités de Goma Cascade. Par quoi voulez-vous commencer ?";
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
