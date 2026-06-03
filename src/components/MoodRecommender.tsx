"use client";

import { useState } from 'react';
import { recommendByMood, AiMoodBasedRecommendationOutput } from '@/ai/flows/ai-mood-based-recommendation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Wine, Beer, Martini, Zap } from 'lucide-react';
import { useCart, Product } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const MOODS = [
  { id: 'pre-copeo', label: 'Pre-copeo', icon: Martini, color: 'text-secondary' },
  { id: 'urgente', label: '¡Se acabó el trago!', icon: Zap, color: 'text-accent' },
  { id: 'romantica', label: 'Cena Romántica', icon: Wine, color: 'text-primary' },
  { id: 'after', label: 'After Party', icon: Beer, color: 'text-secondary' },
];

export function MoodRecommender() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AiMoodBasedRecommendationOutput | null>(null);
  const { addToCart } = useCart();

  const getRecs = async (mood: string) => {
    setLoading(true);
    try {
      const res = await recommendByMood({ mood });
      setRecommendations(res);
    } catch (err) {
      toast({ title: "Error al obtener recomendaciones", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (name: string, category: string) => {
    const mockProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      category,
      price: Math.floor(Math.random() * 50) + 20,
      image: "https://picsum.photos/seed/liquor/400/500"
    };
    addToCart(mockProduct);
    toast({ title: `¡${name} añadido al carrito!` });
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline mb-4 flex items-center justify-center gap-2">
          ¿Cuál es la <span className="text-secondary">vibra</span> de hoy? <Sparkles className="h-6 w-6 text-accent" />
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {MOODS.map((m) => (
            <Button
              key={m.id}
              variant="outline"
              className={`h-24 w-32 flex flex-col gap-2 rounded-xl border-border/50 bg-card hover:bg-card/80 transition-all hover:scale-105 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => getRecs(m.label)}
            >
              <m.icon className={`h-8 w-8 ${m.color}`} />
              <span className="text-xs font-semibold">{m.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Consultando al oráculo de la fiesta...</p>
        </div>
      )}

      {recommendations && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {recommendations.recommendations.liquors.map((liq, idx) => (
            <Card key={idx} className="bg-card border-border/50 overflow-hidden group">
              <CardHeader className="p-0 h-40 relative">
                <img 
                   src={`https://picsum.photos/seed/liq-${idx}/400/300`} 
                   alt={liq.name} 
                   className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <Badge variant="secondary" className="mb-2">{liq.category}</Badge>
                  <CardTitle className="text-lg text-white font-headline">{liq.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{liq.description}</p>
                <Button 
                   className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 neon-glow-secondary"
                   onClick={() => handleAddToCart(liq.name, liq.category)}
                >
                  Añadir al Carrito
                </Button>
              </CardContent>
            </Card>
          ))}
          {recommendations.recommendations.combos.map((combo, idx) => (
            <Card key={`combo-${idx}`} className="bg-card border-primary/20 overflow-hidden border-2 relative">
               <div className="absolute top-2 right-2 z-10">
                 <Badge className="bg-primary">MEJOR PRECIO</Badge>
               </div>
               <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold font-headline text-primary">{combo.name}</h3>
                  <p className="text-sm text-muted-foreground">{combo.description}</p>
                  <ul className="space-y-1">
                    {combo.items.map((item, i) => (
                      <li key={i} className="text-xs flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-secondary" /> {item}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-primary neon-glow-primary"
                    onClick={() => handleAddToCart(combo.name, 'Combo')}
                  >
                    Añadir Combo
                  </Button>
               </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
