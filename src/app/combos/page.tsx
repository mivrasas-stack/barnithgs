
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
  { 
    id: 'c5', 
    name: 'Combo "Me Bebí Tu Recuerdo"', 
    price: 195000, 
    category: 'Combos VIP', 
    image: 'https://picsum.photos/seed/despecho/400/500',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/10/24/audio_985532d5e2.mp3' // Fragmento Popular
  },
  { 
    id: 'c1', 
    name: 'Combo Pre-Copeo VIP', 
    price: 480000, 
    category: 'Combos', 
    image: 'https://picsum.photos/seed/combo1/400/500',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35078173b.mp3' // Electronic Beat
  },
  { 
    id: 'c2', 
    name: 'Jack Daniels + 2 Cocas', 
    price: 185000, 
    category: 'Combos', 
    image: 'https://picsum.photos/seed/combo2/400/500',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/02/08/audio_8241b714f3.mp3' // Rock/Party vibe
  },
  { 
    id: 'c3', 
    name: 'Pack Parrandero (Ron + Hielo)', 
    price: 125000, 
    category: 'Combos', 
    image: 'https://picsum.photos/seed/combo3/400/500',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/11/15/audio_51a3a60a8b.mp3' // Latin Rhythm
  },
];

export default function CombosPage() {
  const { addToCart } = useCart();
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeComboId, setActiveComboId] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar reproductor oculto
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.6;

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

  const handleMouseEnter = (combo: Product) => {
    if (!combo.audioUrl || isMuted) return;

    setActiveComboId(combo.id);
    if (audioRef.current) {
      audioRef.current.src = combo.audioUrl;
      audioRef.current.play().catch(() => {
        console.warn("Interacción requerida para audio.");
      });
    }
  };

  const handleMouseLeave = () => {
    setActiveComboId(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 space-y-12 max-w-7xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border-primary/40 font-black neon-glow-primary uppercase text-[8px] px-4 py-1">
              ESTRENOS VIP
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-primary"
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                if (nextMute && audioRef.current) audioRef.current.pause();
              }}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none">
            COMBOS <span className="text-primary neon-text-primary uppercase">VIP</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.3em] max-w-xl">
            Cada combo tiene su propia banda sonora. Pasa el cursor y siente la vibra.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COMBOS.map((combo) => (
            <Card 
              key={combo.id} 
              onMouseEnter={() => handleMouseEnter(combo)}
              onMouseLeave={handleMouseLeave}
              className={`group overflow-hidden rounded-[2rem] bg-white/[0.02] border transition-all duration-500 transform hover:-translate-y-2 ${
                activeComboId === combo.id 
                ? 'border-primary shadow-[0_0_30px_rgba(255,0,122,0.15)]' 
                : 'border-white/5'
              }`}
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={combo.image} 
                  alt={combo.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0 brightness-75 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                
                {activeComboId === combo.id && (
                  <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                     <div className="p-3 bg-primary/20 backdrop-blur-md rounded-full border border-primary/40 animate-pulse">
                        <Music className="h-6 w-6 text-white" />
                     </div>
                  </div>
                )}

                <div className="absolute top-4 left-4">
                  <Flame className="h-5 w-5 text-accent animate-bounce" />
                </div>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-black italic tracking-tighter uppercase truncate group-hover:text-primary transition-colors">
                    {combo.name}
                  </h3>
                  <p className="text-xl font-black text-secondary neon-text-secondary">
                    {formatCurrency(combo.price)}
                  </p>
                </div>
                
                <Button 
                  className={`w-full h-10 rounded-xl font-black tracking-widest transition-all text-[10px] italic ${
                    activeComboId === combo.id 
                    ? 'bg-primary text-white neon-glow-primary' 
                    : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleAdd(combo)}
                >
                  <Zap className="mr-2 h-3.5 w-3.5 fill-current" /> AGREGAR AL CARRO
                </Button>

                {activeComboId === combo.id && (
                   <div className="pt-2 flex justify-center gap-0.5 h-3">
                      {[0, 1, 2, 3].map(i => (
                        <div 
                          key={i} 
                          className="w-1 bg-primary animate-pulse" 
                          style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }} 
                        />
                      ))}
                   </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 text-center space-y-4 max-w-2xl mx-auto">
           <h2 className="text-2xl font-black italic uppercase tracking-tighter">¿LISTO PARA LA TUSA?</h2>
           <p className="text-gray-500 font-bold text-[8px] uppercase tracking-[0.2em]">Licor 100% legal. Sube el volumen y deja que nosotros nos encarguemos.</p>
           <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 font-black h-10 px-8 rounded-full text-[9px] tracking-widest italic neon-glow-primary">
              CHAT DE DESPECHO 24/7
           </Button>
        </div>
      </main>
    </div>
  );
}
