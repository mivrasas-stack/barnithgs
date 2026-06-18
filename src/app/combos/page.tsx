
"use client";

import { useState, useRef, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart, Product } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Flame, Zap, Music, Volume2, VolumeX } from 'lucide-react';

const COMBOS: Product[] = [
  { id: 'c5', name: 'Combo "Me Bebí Tu Recuerdo"', price: 195000, category: 'Combos VIP', image: 'https://picsum.photos/seed/despecho/400/500' },
  { id: 'c1', name: 'Combo Pre-Copeo VIP', price: 480000, category: 'Combos', image: 'https://picsum.photos/seed/combo1/400/500' },
  { id: 'c2', name: 'Jack Daniels + 2 Cocas', price: 185000, category: 'Combos', image: 'https://picsum.photos/seed/combo2/400/500' },
  { id: 'c3', name: 'Pack Parrandero (Ron + Hielo)', price: 125000, category: 'Combos', image: 'https://picsum.photos/seed/combo3/400/500' },
];

// URL de un audio con ambiente de despecho/popular (Guitarra acústica melancólica)
const DESPECHO_BEAT_URL = 'https://cdn.pixabay.com/audio/2022/01/21/audio_31742c525d.mp3'; 

export default function CombosPage() {
  const { addToCart } = useCart();
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(DESPECHO_BEAT_URL);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleAdd = (product: Product) => {
    addToCart(product);
    toast({
      title: "¡Combo Añadido!",
      description: `${product.name} listo para el cargamento.`,
    });
  };

  const handleMouseEnter = (comboName: string) => {
    if (comboName.includes("Recuerdo") && audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {
        // Silently fail if browser blocks autoplay interaction
      });
    }
  };

  const handleMouseLeave = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 md:py-20 space-y-12 md:space-y-20">
        <div className="flex flex-col items-center text-center space-y-6 relative">
          <div className="flex items-center gap-4">
            <Badge className="bg-accent text-black font-black neon-glow-accent uppercase text-[10px] px-4">AHORRO EXPLOSIVO</Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-primary transition-all"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter font-headline leading-none">
            COMBOS <span className="text-primary neon-text-primary uppercase">VIP</span>
          </h1>
          <p className="text-sm text-gray-400 font-medium max-w-xl">
            Todo lo que necesitas en un solo paquete. Más rumba por menos plata.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {COMBOS.map((combo) => (
            <Card 
              key={combo.id} 
              onMouseEnter={() => handleMouseEnter(combo.name)}
              onMouseLeave={handleMouseLeave}
              className={`card-neon-border group overflow-hidden rounded-[2rem] bg-card/40 border-white/10 transition-all duration-500 ${combo.name.includes("Recuerdo") ? 'border-primary/40 hover:border-primary shadow-[0_0_20px_rgba(255,0,122,0.1)]' : ''}`}
            >
              <div className="relative h-56 md:h-64 overflow-hidden">
                <img 
                  src={combo.image} 
                  alt={combo.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                
                {combo.name.includes("Recuerdo") ? (
                  <Badge className="absolute top-4 right-4 bg-primary text-white font-black animate-pulse flex items-center gap-2 text-[9px] px-3">
                    <Music className="h-3 w-3" /> ¡DESPECHO ACTIVO!
                  </Badge>
                ) : (
                  <Badge className="absolute top-4 right-4 bg-primary/20 text-primary border-none font-black text-[8px] px-2">
                    POPULAR
                  </Badge>
                )}

                <div className="absolute top-4 left-4">
                  <Flame className="h-5 w-5 text-accent animate-bounce" />
                </div>

                {/* Indicador visual de sonido animado */}
                {combo.name.includes("Recuerdo") && (
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="flex gap-1 items-end h-4">
                        <div className="w-1 bg-primary animate-[pulse_0.4s_infinite] h-full" />
                        <div className="w-1 bg-primary animate-[pulse_0.6s_infinite] h-2/3" />
                        <div className="w-1 bg-primary animate-[pulse_0.3s_infinite] h-full" />
                     </div>
                  </div>
                )}
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg md:text-xl font-black italic tracking-tight uppercase truncate">{combo.name}</h3>
                  <p className="text-xl font-black text-secondary neon-text-secondary">{formatCurrency(combo.price)}</p>
                </div>
                
                <Button 
                  className={`w-full h-11 rounded-xl font-black tracking-widest transition-all text-[10px] italic ${
                    combo.name.includes("Recuerdo") 
                    ? 'bg-primary text-white neon-glow-primary hover:bg-primary/90' 
                    : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleAdd(combo)}
                >
                  <Zap className="mr-2 h-4 w-4 fill-current" /> AGREGAR COMBO
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center space-y-4 animate-in fade-in duration-1000">
           <h2 className="text-2xl font-black italic uppercase tracking-tighter">¿QUIERES UN COMBO A MEDIDA?</h2>
           <p className="text-gray-400 text-sm font-medium max-w-lg mx-auto">Chatea con nosotros en vivo y armamos el paquete que tu rumba o tu despecho necesita.</p>
           <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 font-black h-11 px-8 rounded-full text-[10px] tracking-widest italic">
              HABLAR CON UN EXPERTO
           </Button>
        </div>
      </main>
    </div>
  );
}
