import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Code2,
    Languages,
    Globe2,
    GraduationCap,
    Youtube,
    ExternalLink,
    Laptop,
    Search,
    CheckCircle2,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const STUDY_CATEGORIES = [
    {
        id: 'it',
        title: 'Informatique & Tech',
        icon: <Code2 className="h-6 w-6" />,
        description: 'Apprenez le développement web, mobile, et les bases de la programmation.',
        color: 'bg-blue-500/10 text-blue-500',
        resources: [
            { name: 'MDN Web Docs', type: 'Documentation', link: 'https://developer.mozilla.org', provider: 'Mozilla' },
            { name: 'FreeCodeCamp', type: 'Plateforme', link: 'https://www.freecodecamp.org', provider: 'Communauté' },
            { name: 'Python Basics', type: 'Cours', link: 'https://www.learnpython.org', provider: 'LearnPython' }
        ]
    },
    {
        id: 'languages',
        title: 'Langues (Anglais)',
        icon: <Languages className="h-6 w-6" />,
        description: 'Améliorez votre grammaire, votre vocabulaire et votre aisance orale.',
        color: 'bg-purple-500/10 text-purple-500',
        resources: [
            { name: 'Duolingo', type: 'App', link: 'https://www.duolingo.com', provider: 'Duolingo' },
            { name: 'BBC Learning English', type: 'Cours', link: 'https://www.bbc.co.uk/learningenglish', provider: 'BBC' },
            { name: 'English with Lucy', type: 'Vidéo', link: 'https://www.youtube.com/c/EnglishwithLucy', provider: 'YouTube' }
        ]
    },
    {
        id: 'general',
        title: 'Culture Générale & Autres',
        icon: <Globe2 className="h-6 w-6" />,
        description: 'Explorez divers sujets allant du design au business.',
        color: 'bg-orange-500/10 text-orange-500',
        resources: [
            { name: 'Khan Academy', type: 'Plateforme', link: 'https://fr.khanacademy.org', provider: 'Khan' },
            { name: 'Coursera (Cours gratuits)', type: 'Plateforme', link: 'https://www.coursera.org', provider: 'Plusieurs' },
            { name: 'Canva Design School', type: 'Cours', link: 'https://www.canva.com/designschool/', provider: 'Canva' }
        ]
    }
];

const RESOURCE_HIGHLIGHTS = [
    {
        title: "Devenir Développeur",
        category: "Informatique",
        duration: "6 mois environ",
        students: "500+",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Anglais Professionnel",
        category: "Langues",
        duration: "3 mois intensifs",
        students: "1.2k",
        image: "https://images.unsplash.com/photo-1543165796-5426273ea4d1?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Design UX/UI",
        category: "Design",
        duration: "4 mois",
        students: "800",
        image: "https://images.unsplash.com/photo-1586717791821-3f44a563cc4c?auto=format&fit=crop&q=80&w=800"
    }
];

const Studies = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 gradient-primary">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <div className="container mx-auto px-4 relative">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-3xl"
                        >
                            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                Nouveau
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
                                Élargissez vos horizons avec <span className="underline decoration-white/30 text-white/90">Goma Studies</span>
                            </h1>
                            <p className="text-xl text-white/80 mb-8 leading-relaxed">
                                Apprenez de nouvelles compétences gratuitement grâce à notre sélection de ressources éducatives de haute qualité. Informatique, Langues, Business et bien plus encore.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button size="lg" className="bg-white text-primary hover:bg-white/90 border-none px-8 h-12 text-lg">
                                    Commencer à apprendre
                                </Button>
                                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 px-8 h-12 text-lg">
                                    Voir le catalogue
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="py-20 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl font-display font-bold mb-4">Parcourez nos catégories</h2>
                            <p className="text-muted-foreground italic">Sélectionnées avec soin pour vous offrir les meilleurs contenus gratuits du web.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {STUDY_CATEGORIES.map((category, index) => (
                                <motion.div
                                    key={category.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="h-full border-none shadow-lg hover:shadow-xl transition-all duration-300 group">
                                        <CardHeader>
                                            <div className={`p-3 rounded-xl w-fit mb-4 transition-transform group-hover:scale-110 ${category.color}`}>
                                                {category.icon}
                                            </div>
                                            <CardTitle className="text-2xl">{category.title}</CardTitle>
                                            <CardDescription>{category.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {category.resources.map((res, i) => (
                                                    <a
                                                        key={i}
                                                        href={res.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted transition-colors group/link"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-sm">{res.name}</p>
                                                            <p className="text-xs text-muted-foreground">{res.type} • {res.provider}</p>
                                                        </div>
                                                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover/link:text-primary transition-colors" />
                                                    </a>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Feature Highlights */}
                <section className="py-20 bg-background overflow-hidden">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-display font-bold mb-16">Parcours recommandés</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {RESOURCE_HIGHLIGHTS.map((highlight, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ y: -10 }}
                                    className="relative group cursor-pointer"
                                >
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-xl">
                                        <img
                                            src={highlight.image}
                                            alt={highlight.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    <div className="text-left px-2">
                                        <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">
                                            {highlight.category}
                                        </Badge>
                                        <h3 className="text-xl font-bold mb-1">{highlight.title}</h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Laptop className="h-4 w-4" /> {highlight.duration}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="h-4 w-4" /> {highlight.students}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-20 bg-muted/50">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto gradient-primary p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
                            <div className="absolute right-[-10%] top-[-20%] opacity-10">
                                <Laptop className="h-64 w-64" />
                            </div>
                            <div className="relative z-10 text-center md:text-left">
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6 leading-tight">
                                    Prêt à commencer votre voyage d'apprentissage ?
                                </h2>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-8">
                                    <div className="flex items-center gap-2 text-white/90">
                                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                                        <span>Contenu gratuit</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/90">
                                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                                        <span>Accès illimité</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/90">
                                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                                        <span>Ressources vérifiées</span>
                                    </div>
                                </div>
                                <Button size="lg" className="bg-white text-primary hover:bg-white/90 border-none px-10 h-14 text-lg font-bold">
                                    S'inscrire maintenant
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Studies;
