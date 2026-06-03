
"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart, Product } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Flame, Zap, ShoppingCart } from 'lucide-react';

const COMBOS: Product[] = [
  { id: 'c1', name: 'Combo Pre-Copeo VIP', price: 120, category: 'Combos', image: 'https://picsum.photos/seed/combo1/400/500' },
  { id: 'c2', name: 'Jack Daniels + 2 Cocas', price: 50, category: 'Combos', image: 'https://picsum.photos/seed/combo2/400/500' },
  { id: 'c3', name: 'Pack Parrandero (Ron + Hielo)', price: 45, category: 'Combos', image: 'https://picsum.photos/seed/combo3/400/500' },
  { id: 'c4', name: 'Kit Margarita Pro', price: 85, category: 'Combos', image: 'https://picsum.photos/seed/combo4/400/500' },
];

export default function CombosPage() {
  const { addToCart } = useCart();

  const handleAdd = (product: Product) => {
    addToCart(product);
    toast({
      title: "¡Combo Añadido!",
      description: `${product.name} listo para el cargamento.`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="container mx-auto px-4 py-20 space-y-20">
        <div className="flex flex-col items-center text-center space-y-6">
          <Badge className="bg-accent text-black font-black neon-glow-accent">AHORRO EXPLOSIVO</Badge>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter font-headline">
            COMBOS <span className="text-primary neon-text-primary">VIP</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium max-w-2xl">
            Todo lo que necesitas en un solo paquete. Más rumba por menos plata.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {COMBOS.map((combo) => (
            <Card key={combo.id} className="card-neon-border group overflow-hidden rounded-[2.5rem] bg-card/40 border-white/10">
              <div className="relative h-72 overflow-hidden">
                <img 
                  src={combo.image} 
                  alt={combo.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <Badge className="absolute top-4 right-4 bg-primary font-black animate-pulse">
                  POPULAR
                </Badge>
                <div className="absolute top-4 left-4">
                  <Flame className="h-6 w-6 text-accent animate-bounce" />
                </div>
              </div>
              
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tight mb-1">{combo.name}</h3>
                  <p className="text-3xl font-black text-secondary neon-text-secondary">${combo.price}.00</p>
                </div>
                
                <Button 
                  className="w-full h-14 rounded-2xl bg-primary text-white font-black tracking-widest hover:bg-primary/90 neon-glow-primary transition-all"
                  onClick={() => handleAdd(combo)}
                >
                  <Zap className="mr-2 h-5 w-5 fill-white" /> AGREGAR COMBO
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 text-center space-y-8">
           <h2 className="text-4xl font-black italic">¿QUIERES UN COMBO A MEDIDA?</h2>
           <p className="text-gray-400 text-lg">Chatea con nosotros en vivo y armamos el paquete que tu rumba necesita.</p>
           <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 font-black h-14 px-10 rounded-full">
              HABLAR CON UN EXPERTO
           </Button>
        </div>
      </main>
    </div>
  );
}
