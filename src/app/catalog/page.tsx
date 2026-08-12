
"use client";

import { useState, useRef, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart, Product } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Search, 
  Zap, 
  Beer as BeerIcon, 
  Volume2, 
  VolumeX, 
  Youtube,
  Music,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Johnnie Walker Black', price: 185000, category: 'Whisky', image: 'https://picsum.photos/seed/whiskey1/400/500' },
  { id: '2', name: 'Don Julio 70', price: 420000, category: 'Tequila', image: 'https://picsum.photos/seed/tequila1/400/500' },
  { id: '3', name: 'Grey Goose 750ml', price: 210000, category: 'Vodka', image: 'https://picsum.photos/seed/vodka1/400/500' },
  { id: '4', name: 'Heineken 6-Pack', price: 32000, category: 'Cerveza', image: 'https://picsum.photos/seed/beer1/400/500' },
  { id: '5', name: 'Ron Zacapa 23', price: 280000, category: 'Ron', image: 'https://picsum.photos/seed/ron1/400/500' },
  { id: '6', name: 'Jagermeister 700ml', price: 145000, category: 'Licores', image: 'https://picsum.photos/seed/jager1/400/500' },
  { id: 'c5', name: 'Combo "Me Bebí Tu Recuerdo"', price: 195000, category: 'Combos VIP', image: 'https://picsum.photos/seed/despecho/400/500', youtubeUrl: 'https://www.youtube.com/watch?v=o302pTudeO4', startTime: 0 },
  { id: 'c1', name: 'Combo Pre-Copeo VIP', price: 480000, category: 'Combos', image: 'https://picsum.photos/seed/combo1/400/500', audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35078173b.mp3', startTime: 0 },
];

const CATEGORIES = ['Todos', 'Whisky', 'Tequila', 'Vodka', 'Cerveza', 'Ron', 'Combos'];

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [ytReady, setYtReady] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    // Cargar inventario desde localStorage
    const saved = localStorage.getItem('partyflow_inventory');
    if (saved) {
      setProducts(JSON.parse(saved));
    }

    // Inicializar Audio
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    // Inicializar YouTube API
    const initYoutube = () => {
      if (ytPlayerRef.current) return;
      
      ytPlayerRef.current = new (window as any).YT.Player('catalog-yt-player', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          showinfo: 0,
          modestbranding: 1,
          loop: 1,
          mute: 0
        },
        events: {
          onReady: () => setYtReady(true)
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
      if (audioRef.current) audioRef.current.pause();
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) ytPlayerRef.current.destroy();
    };
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleMouseEnter = (product: Product) => {
    if (isMuted) return;
    setActiveProductId(product.id);

    if (product.youtubeUrl && ytPlayerRef.current && ytReady) {
      const vid = getYoutubeId(product.youtubeUrl);
      if (vid) {
        ytPlayerRef.current.loadVideoById({
          videoId: vid,
          startSeconds: product.startTime || 0
        });
        ytPlayerRef.current.playVideo();
      }
    } else if (audioRef.current) {
      // Si el producto no tiene un audioUrl específico, usamos la canción principal por defecto
      audioRef.current.src = product.audioUrl || 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35078173b.mp3';
      audioRef.current.currentTime = product.startTime || 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setActiveProductId(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (ytPlayerRef.current && ytReady) {
      ytPlayerRef.current.stopVideo();
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAdd = (product: Product) => {
    addToCart(product);
    toast({
      title: "¡AÑADIDO AL ARSENAL!",
      description: `${product.name} listo para la rumba.`,
    });
  };

  const getCategoryTheme = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('whisky') || cat.includes('ron') || cat.includes('tequila')) return 'aged';
    if (cat.includes('vip') || cat.includes('champaña') || cat.includes('lujo')) return 'luxury';
    return 'vibrant';
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <Navigation />
      <div id="catalog-yt-player" className="hidden"></div>
      
      <main className="container mx-auto px-4 py-8 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Badge className="bg-primary/20 text-primary border-primary/40 font-black text-[9px] uppercase tracking-widest px-3 py-1 neon-glow-primary">
                CAVA DIGITAL 24/7
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-10 w-10 rounded-xl transition-all ${isMuted ? 'bg-white/5 text-gray-500' : 'bg-primary/10 text-primary neon-glow-primary'}`}
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
              NUESTRO <span className="text-primary neon-text-primary">ARSENAL</span>
            </h1>
          </div>
          
          <div className="w-full md:w-80 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors h-4 w-4" />
            <Input 
              placeholder="Busca tu trago..." 
              className="h-12 pl-12 bg-white/5 border-white/10 rounded-2xl focus:border-primary/40 focus:ring-0 transition-all text-sm font-bold placeholder:text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar snap-x">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className={`h-10 px-8 rounded-full font-black italic tracking-tight text-xs transition-all ${
                selectedCategory === cat 
                ? 'bg-primary neon-glow-primary border-none text-white' 
                : 'border-white/10 hover:border-primary/40 hover:bg-primary/5 text-gray-500'
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.toUpperCase()}
            </Button>
          ))}
        </div>

        {filteredProducts.length > 0 ? (
          <>
            {/* VISTA MOBILE: Cuando entra (Todos + sin búsqueda), muestra SOLO el carrusel de combos con canción */}
            {selectedCategory === 'Todos' && searchQuery === '' ? (
              <div className="md:hidden">
                <div className="mb-4 flex items-center gap-2">
                  <Music className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-black italic uppercase tracking-tighter text-white">Combos VIP Musicales</h2>
                </div>
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 no-scrollbar">
                  {products.filter(p => p.audioUrl || p.youtubeUrl).map((product) => {
                    const theme = getCategoryTheme(product.category);
                    const themeClass = `card-theme-${theme}`;
                    const btnClass = `btn-theme-${theme}`;
                    
                    return (
                    <div key={product.id} className="min-w-[85vw] snap-center">
                      <Card 
                        onMouseEnter={() => handleMouseEnter(product)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleMouseEnter(product)} // Para que funcione al tocar en móvil
                        className={`group overflow-hidden rounded-[2rem] bg-white/[0.02] border border-white/5 transition-all duration-500 ${themeClass}`}
                      >
                        <div className="relative h-64 overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0 brightness-75 group-hover:brightness-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                          
                          {activeProductId === product.id && (
                            <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                               <div className="p-4 bg-primary/20 backdrop-blur-md rounded-full border border-primary/40 animate-pulse">
                                  {product.youtubeUrl ? <Youtube className="h-8 w-8 text-white" /> : <Music className="h-8 w-8 text-white" />}
                               </div>
                            </div>
                          )}

                          <Badge className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border-none text-primary font-black text-[8px] tracking-widest px-3 py-1">
                            {product.category.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <CardContent className="p-6 space-y-5">
                          <div className="space-y-1">
                            <h3 className="text-sm font-black italic tracking-tighter uppercase truncate group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-2xl font-black text-secondary neon-text-secondary">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                          
                          <Button 
                            className={`w-full h-12 rounded-xl font-black tracking-widest transition-all text-[10px] italic ${
                              activeProductId === product.id 
                              ? btnClass 
                              : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                            }`}
                            onClick={(e) => { e.stopPropagation(); handleAdd(product); }}
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" /> AGREGAR AL CARRO
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )})}
                </div>
              </div>
            ) : null}

            {/* VISTA ESCRITORIO O CUANDO HAY FILTROS EN MOBILE */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 ${selectedCategory === 'Todos' && searchQuery === '' ? 'hidden md:grid' : ''}`}>
              {filteredProducts.map((product) => {
                const theme = getCategoryTheme(product.category);
                const themeClass = `card-theme-${theme}`;
                const btnClass = `btn-theme-${theme}`;
                
                return (
                <Card 
                  key={product.id} 
                  onMouseEnter={() => handleMouseEnter(product)}
                  onMouseLeave={handleMouseLeave}
                  className={`group overflow-hidden rounded-[2rem] bg-white/[0.02] border border-white/5 transition-all duration-500 transform hover:-translate-y-2 ${themeClass}`}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0 brightness-75 group-hover:brightness-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    
                    {activeProductId === product.id && (
                      <div className="absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                         <div className="p-4 bg-primary/20 backdrop-blur-md rounded-full border border-primary/40 animate-pulse">
                            {product.youtubeUrl ? <Youtube className="h-8 w-8 text-white" /> : <Music className="h-8 w-8 text-white" />}
                         </div>
                      </div>
                    )}

                    <Badge className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border-none text-primary font-black text-[8px] tracking-widest px-3 py-1">
                      {product.category.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black italic tracking-tighter uppercase truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-2xl font-black text-secondary neon-text-secondary">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                    
                    <Button 
                      className={`w-full h-12 rounded-xl font-black tracking-widest transition-all text-[10px] italic ${
                        activeProductId === product.id 
                        ? btnClass 
                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                      }`}
                      onClick={() => handleAdd(product)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" /> AGREGAR AL CARRO
                    </Button>
                  </CardContent>
                </Card>
              )})}
            </div>

            {/* CATALOG UPSELL SECTION */}
            <div className="mt-20 pt-10 border-t border-white/5 animate-in fade-in slide-in-from-bottom-10 duration-1000">
               <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
                  <div>
                     <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                        <Zap className="h-6 w-6 text-[#ff0f7b]" /> MIXERS & EXTRAS
                     </h2>
                     <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mt-1">El toque final para tu botella</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[
                    { id: 'm1', name: 'Hielo Premium 2kg', price: 8000, category: 'Mixers', image: 'https://picsum.photos/seed/ice/100/100' },
                    { id: 'm2', name: 'RedBull 4-Pack', price: 32000, category: 'Mixers', image: 'https://picsum.photos/seed/energy/100/100' },
                    { id: 'm3', name: 'Limones & Sal', price: 5000, category: 'Mixers', image: 'https://picsum.photos/seed/lemons/100/100' },
                    { id: 'm4', name: 'Tónica Fever Tree', price: 15000, category: 'Mixers', image: 'https://picsum.photos/seed/tonic/100/100' },
                    { id: 'm5', name: 'Coca-Cola 1.5L', price: 6000, category: 'Mixers', image: 'https://picsum.photos/seed/coke/100/100' }
                  ].map((p, i) => (
                     <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center gap-4 hover:bg-white/[0.05] hover:border-primary/30 transition-all group cursor-pointer" onClick={() => { addToCart(p as any); toast({title:"Agregado", description:`${p.name} sumado a tu pedido.`}); }}>
                        <img src={p.image} alt={p.name} className="h-20 w-20 rounded-full object-cover shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform" />
                        <div className="flex-grow flex flex-col justify-center">
                           <h5 className="font-bold text-sm text-white">{p.name}</h5>
                           <p className="text-secondary font-black text-xs neon-text-secondary mt-1">{formatCurrency(p.price)}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="w-full rounded-xl bg-white/5 hover:bg-primary hover:text-white transition-colors text-[10px] font-black tracking-widest italic h-8">
                           AGREGAR
                        </Button>
                     </div>
                  ))}
               </div>
            </div>
          </>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-700">
             <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                <BeerIcon className="h-12 w-12 text-gray-700" />
             </div>
             <div className="space-y-2">
               <h3 className="text-2xl font-black italic text-gray-400 uppercase tracking-tighter">EL ARSENAL ESTÁ VACÍO</h3>
               <p className="text-gray-600 font-bold text-sm uppercase tracking-widest">No hay rastro de ese trago en nuestra cava.</p>
             </div>
             <Button 
               variant="link" 
               className="text-primary font-black text-xs uppercase tracking-widest" 
               onClick={() => {setSearchQuery(''); setSelectedCategory('Todos');}}
             >
               REINICIAR BÚSQUEDA
             </Button>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-20 mt-20 bg-black/50">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center neon-glow-primary">
                  <BeerIcon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-2xl font-black italic tracking-tighter">
                  Party<span className="text-primary">Flow</span>
                </span>
              </div>
              <p className="text-gray-500 font-bold text-[10px] uppercase leading-relaxed tracking-wider">
                El alma de la fiesta entregada en tiempo récord. Disfruta con responsabilidad. Prohibido el expendio de bebidas embriagantes a menores de edad.
              </p>
           </div>
           <div>
              <h4 className="font-black text-xs mb-6 tracking-[0.2em] uppercase text-gray-400">EXPLORA</h4>
              <ul className="space-y-4 text-gray-600 font-black text-[10px] uppercase tracking-widest">
                <li><Link href="/catalog" className="hover:text-primary transition-colors">Cava Digital</Link></li>
                <li><Link href="/moods" className="hover:text-primary transition-colors">Vibra Party</Link></li>
                <li><Link href="/combos" className="hover:text-primary transition-colors">Combos VIP</Link></li>
              </ul>
           </div>
           <div>
              <h4 className="font-black text-xs mb-6 tracking-[0.2em] uppercase text-gray-400">SOPORTE</h4>
              <ul className="space-y-4 text-gray-600 font-black text-[10px] uppercase tracking-widest">
                <li><Link href="#" className="hover:text-primary transition-colors">Ayuda</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contacto 24/7</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Términos</Link></li>
              </ul>
           </div>
           <div>
              <h4 className="font-black text-xs mb-6 tracking-[0.2em] uppercase text-gray-400">RUMBA SOCIAL</h4>
              <div className="flex gap-3">
                 {['IG', 'FB', 'TK'].map(social => (
                   <div key={social} className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-[10px] hover:border-primary hover:text-primary cursor-pointer transition-all">
                     {social}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
