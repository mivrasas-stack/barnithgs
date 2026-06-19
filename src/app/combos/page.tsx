
"use client";

import { useState, useRef, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart, Product } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Flame, Zap, Music, Volume2, VolumeX, Youtube, Loader2 } from 'lucide-react';

const DEFAULT_COMBOS: Product[] = [
  { 
    id: 'c5', 
    name: 'Combo "Me Bebí Tu Recuerdo"', 
    price: 195000, 
    category: 'Combos VIP', 
    image: 'https://picsum.photos/seed/despecho/400/500',
    youtubeUrl: 'https://www.youtube.com/watch?v=o302pTudeO4' 
  },
  { 
    id: 'c1', 
    name: 'Combo Pre-Copeo VIP', 
    price: 480000, 
    category: 'Combos', 
    image: 'https://picsum.photos/seed/combo1/400/500',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35078173b.mp3'
  },
  { 
    id: 'c2', 
    name: 'Jack Daniels + 2 Cocas', 
    price: 185000, 
    category: 'Combos', 
    image: 'https://picsum.photos/seed/combo2/400/500',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/02/08/audio_8241b714f3.mp3'
  },
  { 
    id: 'c3', 
    name: 'Pack Parrandero (Ron + Hielo)', 
    price: 125000, 
    category: 'Combos', 
    image: 'https://picsum.photos/seed/combo3/400/500',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/11/15/audio_51a3a60a8b.mp3'
  },
];

export default function CombosPage() {
  const { addToCart } = useCart();
  const [combos, setCombos] = useState<Product[]>(DEFAULT_COMBOS);
  const [isMuted, setIsMuted] = useState(false);
  const [activeComboId, setActiveComboId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const [ytReady, setYtReady] = useState(false);

  useEffect(() => {
    // 1. Cargar inventario personalizado del Admin si existe
    const saved = localStorage.getItem('partyflow_inventory');
    if (saved) {
      const allInventory = JSON.parse(saved) as Product[];
      // Filtrar por combos o productos que tengan música configurada
      const savedCombos = allInventory.filter(p => 
        p.category.toLowerCase().includes('combo') || 
        p.id.startsWith('c') || 
        p.audioUrl || 
        p.youtubeUrl
      );
      if (savedCombos.length > 0) {
        setCombos(savedCombos);
      }
    }

    // 2. Inicializar Audio estándar
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.6;

    // 3. Inicializar API de YouTube
    const initYoutube = () => {
      if (ytPlayerRef.current) return;
      
      ytPlayerRef.current = new (window as any).YT.Player('hidden-yt-player', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          showinfo: 0,
          modestbranding: 1,
          loop: 1,
          fs: 0,
          cc_load_policy: 0,
          iv_load_policy: 3,
          autohide: 1,
          mute: 0
        },
        events: {
          onReady: () => setYtReady(true),
          onError: (e: any) => {
            console.error("YT Player Error:", e);
            setYtReady(false);
          }
        }
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = initYoutube;
    } else {
      initYoutube();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        ytPlayerRef.current.destroy();
      }
    };
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleMouseEnter = (combo: Product) => {
    if (isMuted) return;
    setActiveComboId(combo.id);

    // Priorizar YouTube si existe
    if (combo.youtubeUrl && ytPlayerRef.current && ytReady) {
      const videoId = getYoutubeId(combo.youtubeUrl);
      if (videoId) {
        try {
          ytPlayerRef.current.loadVideoById({
            videoId: videoId,
            startSeconds: 0
          });
          ytPlayerRef.current.playVideo();
          ytPlayerRef.current.setVolume(80);
        } catch (e) {
          console.error("Error playing YT:", e);
        }
      }
    } 
    // Si no hay YouTube, usar audio URL estándar
    else if (combo.audioUrl && audioRef.current) {
      audioRef.current.src = combo.audioUrl;
      audioRef.current.play().catch(() => {
        // Fallback si el navegador bloquea
      });
    }
  };

  const handleMouseLeave = () => {
    setActiveComboId(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (ytPlayerRef.current && ytReady) {
      ytPlayerRef.current.stopVideo();
    }
  };

  const handleAdd = (product: Product) => {
    addToCart(product);
    toast({
      title: "🔥 COMBO LISTO",
      description: `${product.name} añadido a tu cargamento.`,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <Navigation />
      
      {/* Reproductor oculto de YouTube */}
      <div id="hidden-yt-player" className="hidden"></div>
      
      <main className="container mx-auto px-4 py-12 space-y-12 max-w-7xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border-primary/40 font-black neon-glow-primary uppercase text-[8px] px-4 py-1">
              ATMÓSFERA VIP ACTIVADA
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-primary transition-all"
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                if (nextMute) {
                  if (audioRef.current) audioRef.current.pause();
                  if (ytPlayerRef.current && ytReady) ytPlayerRef.current.stopVideo();
                }
              }}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none uppercase">
            COMBOS <span className="text-primary neon-text-primary">MUSICALES</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.3em] max-w-xl">
            Sincronización instantánea con YouTube. Pasa el cursor y vive la rumba antes de pedir.
          </p>
          
          {!ytReady && !isMuted && (
            <div className="flex items-center gap-2 text-[7px] text-primary font-black uppercase tracking-widest animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" /> SINCRONIZANDO SATÉLITES DE AUDIO...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {combos.map((combo) => (
            <Card 
              key={combo.id} 
              onMouseEnter={() => handleMouseEnter(combo)}
              onMouseLeave={handleMouseLeave}
              className={`group overflow-hidden rounded-[2rem] bg-white/[0.02] border transition-all duration-500 transform hover:-translate-y-2 ${
                activeComboId === combo.id 
                ? 'border-primary shadow-[0_0_40px_rgba(255,0,122,0.2)] scale-[1.02]' 
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
                     <div className="p-4 bg-primary/20 backdrop-blur-md rounded-full border border-primary/40 animate-pulse">
                        {combo.youtubeUrl ? <Youtube className="h-8 w-8 text-white" /> : <Music className="h-8 w-8 text-white" />}
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
                  className={`w-full h-11 rounded-xl font-black tracking-widest transition-all text-[10px] italic ${
                    activeComboId === combo.id 
                    ? 'bg-primary text-white neon-glow-primary' 
                    : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleAdd(combo)}
                >
                  <Zap className="mr-2 h-4 w-4 fill-current" /> PEDIR AHORA
                </Button>

                {activeComboId === combo.id && (
                   <div className="pt-2 flex justify-center gap-0.5 h-4">
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <div 
                          key={i} 
                          className="w-1 bg-primary animate-pulse" 
                          style={{ 
                            height: `${30 + Math.random() * 70}%`, 
                            animationDelay: `${i * 0.1}s`,
                            boxShadow: '0 0 10px hsl(var(--primary))'
                          }} 
                        />
                      ))}
                   </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-10 text-center space-y-6 max-w-2xl mx-auto glass-morphism">
           <Music className="h-10 w-10 text-primary mx-auto opacity-50" />
           <div className="space-y-2">
             <h2 className="text-2xl font-black italic uppercase tracking-tighter">¿Sientes la vibra?</h2>
             <p className="text-gray-500 font-bold text-[8px] uppercase tracking-[0.2em] leading-relaxed">
               Cada combo tiene una identidad sonora única. <br />
               Si no escuchas nada, asegúrate de haber interactuado con la página primero.
             </p>
           </div>
           <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 font-black h-12 px-10 rounded-full text-[9px] tracking-widest italic neon-glow-primary">
              PEDIR RECOMENDACIÓN IA
           </Button>
        </div>
      </main>
    </div>
  );
}
