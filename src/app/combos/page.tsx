
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

// URL de un audio con estilo de guitarra popular/despecho (fragmento representativo)
// Nota: En producción, sustituir por el archivo MP3 del fragmento de Gali Galeano.
const DESPECHO_BEAT_URL = 'https://cdn.pixabay.com/audio/2022/10/24/audio_985532d5e2.mp3'; 

export default function CombosPage() {
  const { addToCart } = useCart();
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeAudioCombo, setActiveAudioCombo] = useState<string | null>(null);

  useEffect(() => {
    // Inicialización del audio
    const audio = new Audio(DESPECHO_BEAT_URL);
    audio.loop = true;
    audio.volume = 0.6;
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
    if (comboName.includes("Recuerdo")) {
      setActiveAudioCombo(comboName);
      if (audioRef.current && !isMuted) {
        audioRef.current.play().catch((err) => {
          console.warn("Autoplay bloqueado. El usuario debe interactuar con la página primero.", err);
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setActiveAudioCombo(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16 space-y-16 max-w-7xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border-primary/40 font-black neon-glow-primary uppercase text-[10px] px-6 py-1">
              ESPECIAL DESPECHO
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-primary transition-all"
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                if (nextMute && audioRef.current) audioRef.current.pause();
              }}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none">
            COMBOS <span className="text-primary neon-text-primary uppercase">VIP</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] max-w-xl">
            Sube el volumen y elige tu arsenal. Envíos flash en toda la ciudad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COMBOS.map((combo) => (
            <Card 
              key={combo.id} 
              onMouseEnter={() => handleMouseEnter(combo.name)}
              onMouseLeave={handleMouseLeave}
              className={`group overflow-hidden rounded-[2.5rem] bg-white/[0.02] border transition-all duration-500 transform hover:-translate-y-2 ${
                combo.name.includes("Recuerdo") 
                ? 'border-primary/40 hover:border-primary shadow-[0_0_30px_rgba(255,0,122,0.2)]' 
                : 'border-white/5 hover:border-secondary/40'
              }`}
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={combo.image} 
                  alt={combo.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0 brightness-75 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                {combo.name.includes("Recuerdo") && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="p-4 bg-primary/20 backdrop-blur-md rounded-full border border-primary/40 animate-pulse">
                        <Music className="h-8 w-8 text-white" />
                     </div>
                  </div>
                )}

                <div className="absolute top-4 left-4">
                  <Flame className="h-6 w-6 text-accent animate-bounce" />
                </div>

                <Badge className={`absolute top-4 right-4 font-black text-[9px] px-3 border-none ${
                  combo.name.includes("Recuerdo") ? 'bg-primary text-white' : 'bg-black/60 text-gray-400'
                }`}>
                  {combo.name.includes("Recuerdo") ? 'CANCION ACTIVA' : 'COMBO'}
                </Badge>
              </div>
              
              <CardContent className="p-6 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-black italic tracking-tighter uppercase truncate group-hover:text-primary transition-colors">
                    {combo.name}
                  </h3>
                  <p className="text-2xl font-black text-secondary neon-text-secondary">
                    {formatCurrency(combo.price)}
                  </p>
                </div>
                
                <Button 
                  className={`w-full h-12 rounded-2xl font-black tracking-widest transition-all text-xs italic ${
                    combo.name.includes("Recuerdo") 
                    ? 'bg-primary text-white neon-glow-primary hover:bg-primary/90' 
                    : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleAdd(combo)}
                >
                  <Zap className="mr-2 h-4 w-4 fill-current" /> AGREGAR AL CARRO
                </Button>

                {combo.name.includes("Recuerdo") && activeAudioCombo === combo.name && (
                   <div className="pt-2 flex justify-center">
                      <div className="flex gap-1 items-end h-4">
                        {[0, 1, 2, 3, 4].map(i => (
                          <div 
                            key={i} 
                            className="w-1 bg-primary animate-pulse" 
                            style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} 
                          />
                        ))}
                      </div>
                   </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-[3rem] p-10 text-center space-y-6 max-w-3xl mx-auto">
           <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">¿TIENES UNA TUSA QUE APAGAR?</h2>
           <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em]">Hablamos tu mismo idioma. Licor 100% legal garantizado.</p>
           <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 font-black h-12 px-10 rounded-full text-[10px] tracking-widest italic neon-glow-primary">
              CHAT DE DESPECHO 24/7
           </Button>
        </div>
      </main>
    </div>
  );
}
