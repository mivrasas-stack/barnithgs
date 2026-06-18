
"use client";

import { useState, useRef, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart, Product } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Search, Filter, Zap, Flame, Beer as BeerIcon, Volume2, VolumeX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const PRODUCTS: Product[] = [
  { id: '1', name: 'Johnnie Walker Black', price: 185000, category: 'Whisky', image: 'https://picsum.photos/seed/whiskey1/400/500' },
  { id: '2', name: 'Don Julio 70', price: 420000, category: 'Tequila', image: 'https://picsum.photos/seed/tequila1/400/500' },
  { id: '3', name: 'Grey Goose 750ml', price: 210000, category: 'Vodka', image: 'https://picsum.photos/seed/vodka1/400/500' },
  { id: '4', name: 'Heineken 6-Pack', price: 32000, category: 'Cerveza', image: 'https://picsum.photos/seed/beer1/400/500' },
  { id: '5', name: 'Ron Zacapa 23', price: 280000, category: 'Ron', image: 'https://picsum.photos/seed/ron1/400/500' },
  { id: '6', name: 'Jagermeister 700ml', price: 145000, category: 'Licores', image: 'https://picsum.photos/seed/jager1/400/500' },
  { id: '7', name: 'Combo Pre-Copeo VIP', price: 450000, category: 'Combos', image: 'https://picsum.photos/seed/combo1/400/500' },
  { id: '8', name: 'Jack Daniels + 2 Cocas', price: 165000, category: 'Combos', image: 'https://picsum.photos/seed/combo2/400/500' },
];

const CATEGORIES = ['Todos', 'Whisky', 'Tequila', 'Vodka', 'Cerveza', 'Ron', 'Combos'];

// URL de un beat de fiesta electrónico (Royalty Free)
const PARTY_BEAT_URL = 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35078173b.mp3';

export default function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    // Inicializar el objeto de audio en el cliente
    audioRef.current = new Audio(PARTY_BEAT_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const filteredProducts = PRODUCTS.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAdd = (product: Product) => {
    addToCart(product);
    toast({
      title: "¡Añadido!",
      description: `${product.name} ya está en tu carrito.`,
    });
  };

  const playHoverSound = () => {
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {
        // Ignorar errores de autoplay si el navegador bloquea
      });
    }
  };

  const stopHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Badge className="bg-secondary/10 text-secondary border-none font-black text-[9px] uppercase tracking-widest px-3">CAVA DIGITAL 24/7</Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-primary transition-all"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Activar Sonido" : "Silenciar"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
              NUESTRO <span className="text-primary neon-text-primary">ARSENAL</span>
            </h1>
          </div>
          
          <div className="w-full md:w-80 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors h-4 w-4" />
            <Input 
              placeholder="Busca tu trago..." 
              className="h-10 pl-10 bg-white/5 border-white/10 rounded-xl focus:border-primary/40 focus:ring-0 transition-all text-sm font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className={`h-9 px-6 rounded-full font-black italic tracking-tight text-xs transition-all ${
                selectedCategory === cat 
                ? 'bg-primary neon-glow-primary border-none' 
                : 'border-white/10 hover:border-primary/40 hover:bg-primary/5 text-gray-400'
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.toUpperCase()}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              onMouseEnter={playHoverSound}
              onMouseLeave={stopHoverSound}
              className="group overflow-hidden rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0 brightness-75 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                <Badge className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border-none text-primary font-black text-[9px]">
                  {product.category.toUpperCase()}
                </Badge>
                {/* Indicador visual de audio al hacer hover */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex gap-0.5 items-end h-4">
                      <div className="w-1 bg-primary animate-[pulse_0.6s_infinite] h-full" />
                      <div className="w-1 bg-primary animate-[pulse_0.8s_infinite] h-2/3" />
                      <div className="w-1 bg-primary animate-[pulse_0.5s_infinite] h-full" />
                   </div>
                </div>
              </div>
              
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black italic tracking-tight uppercase truncate">{product.name}</h3>
                  <p className="text-xl font-black text-secondary neon-text-secondary">{formatCurrency(product.price)}</p>
                </div>
                
                <Button 
                  className="w-full h-11 rounded-xl bg-primary text-white font-black tracking-widest hover:bg-primary/90 neon-glow-primary transition-all active:scale-95 text-xs italic"
                  onClick={() => handleAdd(product)}
                >
                  <Zap className="mr-2 h-4 w-4 fill-white" /> AGREGAR AL CARRO
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-24 text-center space-y-4">
             <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                <BeerIcon className="h-8 w-8 text-gray-700" />
             </div>
             <h3 className="text-xl font-black italic text-gray-600 uppercase">NO HAY RASTRO DE ESE TRAGO...</h3>
             <Button variant="link" className="text-primary font-bold text-xs" onClick={() => {setSearchQuery(''); setSelectedCategory('Todos');}}>VER TODO EL ARSENAL</Button>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-16 mt-20 bg-black/40">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BeerIcon className="h-8 w-8 text-primary" />
                <span className="text-2xl font-black italic tracking-tighter">
                  Party<span className="text-primary">Flow</span>
                </span>
              </div>
              <p className="text-gray-500 font-medium text-xs leading-relaxed max-w-xs">
                El alma de la fiesta entregada en tiempo récord. Disfruta con responsabilidad. Prohibido el expendio de bebidas embriagantes a menores de edad.
              </p>
           </div>
           <div>
              <h4 className="font-black text-sm mb-4 tracking-widest uppercase text-gray-400">EXPLORA</h4>
              <ul className="space-y-2 text-gray-500 font-bold text-xs uppercase">
                <li><Link href="/catalog" className="hover:text-primary transition-colors">Cava Digital</Link></li>
                <li><Link href="/moods" className="hover:text-primary transition-colors">Vibra Party</Link></li>
                <li><Link href="/combos" className="hover:text-primary transition-colors">Combos VIP</Link></li>
              </ul>
           </div>
           <div>
              <h4 className="font-black text-sm mb-4 tracking-widest uppercase text-gray-400">SOPORTE</h4>
              <ul className="space-y-2 text-gray-500 font-bold text-xs uppercase">
                <li><Link href="#" className="hover:text-primary transition-colors">Ayuda</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contacto 24/7</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Términos</Link></li>
              </ul>
           </div>
           <div>
              <h4 className="font-black text-sm mb-4 tracking-widest uppercase text-gray-400">RUMBA SOCIAL</h4>
              <div className="flex gap-2">
                 {['IG', 'FB', 'TK'].map(social => (
                   <div key={social} className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-[10px] hover:border-primary hover:text-primary cursor-pointer transition-all">
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
