
"use client";

import { useState, useRef, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart, Product } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Flame, Zap, Music, Volume2, VolumeX, Youtube, Loader2, Disc } from 'lucide-react';

const DEFAULT_COMBOS: Product[] = [
  { 
    id: 'c5', 
    name: 'Combo "Me Bebí Tu Recuerdo"', 
    price: 195000, 
    category: 'Combos VIP', 
    image: 'https://picsum.photos/seed/despecho/400/500',
    youtubeUrl: 'https://www.youtube.com/watch?v=o302pTudeO4',
    startTime: 0
  },
  { 
    id: 'c1', 
    name: 'Combo Pre-Copeo VIP', 
    price: 480000, 
    category: 'Combos', 
    image: 'https://picsum.photos/seed/combo1/400/500',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35078173b.mp3',
    startTime: 0
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
    const saved = localStorage.getItem('partyflow_inventory');
    if (saved) {
      const allInventory = JSON.parse(saved) as Product[];
      const savedCombos = allInventory.filter(p => 
        p.category.toLowerCase().includes('combo') || 
        p.id.startsWith('c') || 
        p.audioUrl || 
        p.youtubeUrl ||
        p.spotifyUrl
      );
      if (savedCombos.length > 0) {
        setCombos(savedCombos);
      }
    }

    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.6;

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

  const getSpotifyId = (url: string) => {
    const regExp = /track\/([a-zA-Z0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const handleMouseEnter = (combo: Product) => {
    if (isMuted) return;
    setActiveComboId(combo.id);

    if (combo.youtubeUrl && ytPlayerRef.current && ytReady) {
      const videoId = getYoutubeId(combo.youtubeUrl);
      if (videoId) {
        try {
          ytPlayerRef.current.loadVideoById({
            videoId: videoId,
            startSeconds: combo.startTime || 0
          });
          ytPlayerRef.current.playVideo();
        } catch (e) {}
      }
    } 
    else if (combo.audioUrl && audioRef.current) {
      audioRef.current.src = combo.audioUrl;
      audioRef.current.currentTime = combo.startTime || 0;
      audioRef.current.play().catch(() => {});
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
      <div id="hidden-yt-player" className="hidden"></div>
      
      <main className="container mx-auto px-4 py-12 space-y-12 max-w-7xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <Badge className="bg-primary/20 text-primary border-primary/40 font-black neon-glow-primary uppercase text-[8px] px-4 py-1">
            ATMÓSFERA VIP ACTIVADA
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none uppercase">
            COMBOS <span className="text-primary neon-text-primary">MUSICALES</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.3em] max-w-xl">
            Soportamos YouTube, Spotify y MP3. Pasa el cursor y siente la vibra.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {combos.map((combo) => {
            const spotifyId = combo.spotifyUrl ? getSpotifyId(combo.spotifyUrl) : null;
            
            return (
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
                  
                  {activeComboId === combo.id && !spotifyId && (
                    <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                       <div className="p-4 bg-primary/20 backdrop-blur-md rounded-full border border-primary/40 animate-pulse">
                          {combo.youtubeUrl ? <Youtube className="h-8 w-8 text-white" /> : <Music className="h-8 w-8 text-white" />}
                       </div>
                    </div>
                  )}

                  {spotifyId && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                      <iframe 
                        src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`} 
                        width="100%" 
                        height="80" 
                        frameBorder="0" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy"
                        className="rounded-xl border border-secondary/20 shadow-lg"
                      ></iframe>
                    </div>
                  )}
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
