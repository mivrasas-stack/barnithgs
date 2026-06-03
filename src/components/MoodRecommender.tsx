"use client";

import { useState } from 'react';
import { recommendByMood, AiMoodBasedRecommendationOutput } from '@/ai/flows/ai-mood-based-recommendation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Wine, Beer, Martini, Zap, ShoppingCart } from 'lucide-react';
import { useCart, Product } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

const MOODS = [
  { id: 'pre-copeo', label: 'PRE-COPEO', icon: Martini, color: 'text-secondary', glow: 'neon-glow-secondary' },
  { id: 'urgente', label: '¡URGENTE!', icon: Zap, color: 'text-accent', glow: 'shadow-[0_0_15px_rgba(255,180,0,0.4)]' },
  { id: 'romantica', label: 'ROMÁNTICA', icon: Wine, color: 'text-primary', glow: 'neon-glow-primary' },
  { id: 'after', label: 'AFTER PARTY', icon: Beer, color: 'text-secondary', glow: 'neon-glow-secondary' },
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

  const handleAddToCart = (name: string, category: string, price?: number) => {
    // Generar precio realista en COP (entre 45k y 450k) si no se provee
    const finalPrice = price || Math.floor(Math.random() * 400000) + 45000;
    const mockProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      category,
      price: finalPrice,
      image: "https://picsum.photos/seed/liquor/400/500"
    };
    addToCart(mockProduct);
    toast({ title: `¡${name} (${formatCurrency(finalPrice)}) añadido al carrito!` });
  };

  return (
    <div className="space-y-16 py-12">
      <div className="text-center space-y-6">
        <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tighter flex items-center justify-center gap-4">
          ¿CUÁL ES LA <span className="text-secondary neon-text-secondary">VIBRA</span> DE HOY? <Sparkles className="h-10 w-10 text-accent animate-pulse" />
        </h2>
        <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto">
          Nuestra IA experta te arma la rumba ideal según tu estado de ánimo.
        </p>
        <div className="flex flex-wrap justify-center gap-6 pt-4">
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={`h-32 w-40 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 group ${loading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => getRecs(m.label)}
            >
              <div className={`p-3 rounded-full bg-black/40 transition-all group-hover:bg-black/60 ${m.glow}`}>
                <m.icon className={`h-8 w-8 ${m.color}`} />
              </div>
              <span className="text-xs font-black tracking-widest text-white">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="relative">
             <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
             <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
          </div>
          <p className="text-xl font-black tracking-widest text-primary animate-pulse uppercase">Consultando al oráculo de la rumba...</p>
        </div>
      )}

      {recommendations && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {recommendations.recommendations.liquors.map((liq, idx) => {
            const simulatedPrice = Math.floor(Math.random() * 300000) + 60000;
            return (
              <Card key={idx} className="card-neon-border group overflow-hidden rounded-[2.5rem] bg-card/40">
                <CardHeader className="p-0 h-56 relative overflow-hidden">
                  <img 
                     src={`https://picsum.photos/seed/liq-${idx}/400/300`} 
                     alt={liq.name} 
                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <Badge variant="secondary" className="mb-3 font-black bg-secondary text-black">{liq.category}</Badge>
                    <CardTitle className="text-2xl text-white font-black tracking-tight">{liq.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <p className="text-gray-400 font-medium leading-relaxed line-clamp-2 text-sm">{liq.description}</p>
                    <p className="text-xl font-black text-secondary neon-text-secondary">{formatCurrency(simulatedPrice)}</p>
                  </div>
                  <Button 
                     className="w-full h-14 rounded-2xl bg-secondary text-black font-black tracking-widest hover:bg-secondary/90 neon-glow-secondary transition-all"
                     onClick={() => handleAddToCart(liq.name, liq.category, simulatedPrice)}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" /> AL CARRITO
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          
          {recommendations.recommendations.combos.map((combo, idx) => {
            const simulatedComboPrice = Math.floor(Math.random() * 450000) + 120000;
            return (
              <Card key={`combo-${idx}`} className="bg-black/40 border-primary/40 overflow-hidden border-2 rounded-[2.5rem] relative group hover:border-primary transition-all">
                 <div className="absolute top-6 right-6 z-10">
                   <Badge className="bg-primary font-black neon-glow-primary animate-bounce">AHOOOORA</Badge>
                 </div>
                 <CardContent className="p-10 space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black font-headline text-primary neon-text-primary tracking-tighter leading-none">{combo.name}</h3>
                      <p className="text-gray-300 font-medium text-sm">{combo.description}</p>
                      <p className="text-2xl font-black text-primary neon-text-primary">{formatCurrency(simulatedComboPrice)}</p>
                    </div>
                    <ul className="space-y-3">
                      {combo.items.map((item, i) => (
                        <li key={i} className="text-sm font-bold flex items-center gap-3 text-gray-400">
                          <div className="h-2 w-2 rounded-full bg-secondary neon-glow-secondary" /> {item}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full h-16 rounded-2xl bg-primary text-white font-black tracking-widest neon-glow-primary hover:bg-primary/90 transition-all"
                      onClick={() => handleAddToCart(combo.name, 'Combo', simulatedComboPrice)}
                    >
                      AGREGAR COMBO VIP
                    </Button>
                 </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
