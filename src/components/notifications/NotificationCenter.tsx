import { useState } from 'react';
import { Bell, Tag, Zap, UserPlus, ShoppingBag, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'sale',
    title: 'Vente Flash !',
    message: 'L\'iPhone 15 Pro est à -20% pendant 2h seulement.',
    time: 'Il y a 5 min',
    icon: <Tag className="h-4 w-4 text-orange-500" />,
    isRead: false,
  },
  {
    id: 2,
    type: 'follow',
    title: 'Nouvel Abonné',
    message: 'Kivu Shop vient de s\'abonner à votre boutique.',
    time: 'Il y a 1h',
    icon: <UserPlus className="h-4 w-4 text-blue-500" />,
    isRead: false,
  },
  {
    id: 3,
    type: 'boost',
    title: 'Boost Activé',
    message: 'Votre annonce "MacBook Air" est maintenant en Tendances.',
    time: 'Il y a 3h',
    icon: <Zap className="h-4 w-4 text-primary" />,
    isRead: true,
  },
];

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md rounded-l-[2rem]">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <SheetTitle className="text-2xl font-black font-display">Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-primary">
              Tout lire
            </Button>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] py-4">
          <div className="space-y-4">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 rounded-2xl transition-all cursor-pointer ${n.isRead ? 'bg-background' : 'bg-primary/5 border-l-4 border-primary'}`}
              >
                <div className="flex gap-4">
                  <div className="mt-1 p-2 bg-card rounded-xl shadow-sm">
                    {n.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm">{n.title}</h4>
                      <span className="text-[10px] text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-20">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground">Aucune notification pour le moment.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
