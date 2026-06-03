"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart, Product } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Search, Filter, Zap, Flame, Beer as BeerIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

const PRODUCTS: Product[] = [
  { id: '1', name: 'Johnnie Walker Black', price: 45, category: 'Whisky', image: 'https://picsum.photos/seed/whiskey1/400/500' },
  { id: '2', name: 'Don Julio 70', price: 85, category: 'Tequila', image: 'https://picsum.photos/seed/tequila1/400/500' },
  { id: '3', name: 'Grey Goose 750ml', price: 55, category: 'Vodka', image: 'https://picsum.photos/seed/vodka1/400/500' },
  { id: '4', name: 'Heineken 6-Pack', price: 12, category: 'Cerveza', image: 'https://picsum.photos/seed/beer1/400/500' },
  { id: '5', name: 'Ron Zacapa 23', price: 70, category: 'Ron', image: 'https://picsum.photos/seed/ron1/400/500' },
  { id: '6', name: 'Jagermeister 700ml', price: 35, category: 'Licores', image: 'https://picsum.photos/seed/jager1/400/500' },
  { id: '7', name: 'Combo Pre-Copeo VIP', price: 120, category: 'Combos', image: 'https://picsum.photos/seed/combo1/400/500' },
  { id: '8', name: 'Jack Daniels + 2 Cocas', price: 50, category: 'Combos', image: 'https://picsum.photos/seed/combo2/400/500' },
];

const CATEGORIES = ['Todos', 'Whisky', 'Tequila', 'Vodka', 'Cerveza', 'Ron', 'Combos'];

export default function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart } = useCart();

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Header de la Tienda */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-white/10 pb-12">
          <div className="space-y-4">
            <Badge className="bg-secondary text-black font-black neon-glow-secondary">CAVA DIGITAL 24/7</Badge>
            <h1 className="text-6xl font-black italic tracking-tighter font-headline">
              NUESTRO <span className="text-primary neon-text-primary">ARSENAL</span>
            </h1>
          </div>
          
          <div className="w-full md:w-96 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Busca tu trago..." 
              className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl focus:border-primary/50 focus:ring-primary/20 transition-all text-lg font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filtros de Categoría */}
        <div className="flex flex-wrap gap-4 overflow-x-auto pb-4 no-scrollbar">
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className={`h-12 px-8 rounded-full font-black italic tracking-widest transition-all ${
                selectedCategory === cat 
                ? 'bg-primary neon-glow-primary' 
                : 'border-white/10 hover:border-primary/50 hover:bg-primary/5'
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Grid de Productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="card-neon-border group overflow-hidden rounded-[2.5rem] bg-card/40 border-white/10">
              <div className="relative h-72 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <Badge className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border-primary/40 text-primary font-black">
                  {product.category}
                </Badge>
                {product.category === 'Combos' && (
                  <div className="absolute top-4 left-4">
                    <Flame className="h-6 w-6 text-accent animate-pulse" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tight mb-1">{product.name}</h3>
                  <p className="text-3xl font-black text-secondary neon-text-secondary">{formatCurrency(product.price)}</p>
                </div>
                
                <Button 
                  className="w-full h-14 rounded-2xl bg-primary text-white font-black tracking-widest hover:bg-primary/90 neon-glow-primary transition-all active:scale-95"
                  onClick={() => handleAdd(product)}
                >
                  <Zap className="mr-2 h-5 w-5 fill-white" /> AGREGAR
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-32 text-center space-y-6">
             <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                <BeerIcon className="h-10 w-10 text-gray-600" />
             </div>
             <h3 className="text-3xl font-black italic text-gray-500">NO HAY RASTRO DE ESE TRAGO...</h3>
             <Button variant="link" className="text-primary font-bold" onClick={() => {setSearchQuery(''); setSelectedCategory('Todos');}}>VER TODO EL ARSENAL</Button>
          </div>
        )}
      </main>
    </div>
  );
}