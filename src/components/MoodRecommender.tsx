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
  { id: 'pre-copeo', label: 'PRE-COPEO', desc: 'Calienta motores', icon: Martini, color: 'text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]', glow: 'hover:shadow-[0_0_40px_rgba(236,72,153,0.4)]', bg: 'bg-gradient-to-br from-pink-400 via-pink-500 to-rose-600', borderGlow: 'hover:border-pink-500/50' },
  { id: 'urgente', label: '¡URGENTE!', desc: 'Plan rápido', icon: Zap, color: 'text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]', glow: 'hover:shadow-[0_0_40px_rgba(250,204,21,0.4)]', bg: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500', borderGlow: 'hover:border-yellow-400/50' },
  { id: 'romantica', label: 'ROMÁNTICA', desc: 'Noche especial', icon: Wine, color: 'text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]', glow: 'hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]', bg: 'bg-gradient-to-br from-red-400 via-red-500 to-rose-700', borderGlow: 'hover:border-red-500/50' },
  { id: 'after', label: 'AFTER PARTY', desc: 'Sigue el ritmo', icon: Beer, color: 'text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]', glow: 'hover:shadow-[0_0_40px_rgba(56,189,248,0.4)]', bg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600', borderGlow: 'hover:border-cyan-400/50' },
];

export function MoodRecommender() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AiMoodBasedRecommendationOutput | null>(null);
  const { addToCart } = useCart();

  const getMockRecommendations = (mood: string): AiMoodBasedRecommendationOutput => {
    if (mood.toLowerCase().includes('rom')) {
      return {
        recommendations: {
          liquors: [
            { name: "Vino Tinto Casillero del Diablo", category: "Vino", description: "Vino suave, perfecto para acompañar cenas y momentos íntimos." },
            { name: "Champaña Moët & Chandon", category: "Champaña", description: "Burbujas elegantes para un brindis inolvidable y exclusivo." }
          ],
          combos: [
            { name: "Combo Velada VIP", description: "Todo listo para sorprender.", items: ["1x Vino Tinto Premium", "2x Copas de Cristal", "1x Estuche de Fresas o Chocolates"] }
          ]
        }
      };
    }
    return {
      recommendations: {
        liquors: [
          { name: "Tequila Don Julio 70", category: "Tequila", description: "Añejo cristalino, muy suave, ideal para entrar en ambiente rápido." },
          { name: "Vodka Grey Goose", category: "Vodka", description: "Ultra premium, no genera guayabo. Perfecto para mezclar." }
        ],
        combos: [
          { name: "Combo Rumba Flash", description: "La artillería pesada para prender la noche.", items: ["1x Botella Tequila 700ml", "6x Cervezas Corona", "2x Jugos", "1x Bolsa de Hielo"] }
        ]
      }
    };
  };

  const getRecs = async (mood: string) => {
    setLoading(true);
    setRecommendations(null);
    try {
      const res = await recommendByMood({ mood });
      setRecommendations(res);
    } catch (err) {
      toast({ title: "IA Ocupada. Mostrando recomendación manual de nuestro sommelier.", variant: "default" });
      setRecommendations(getMockRecommendations(mood));
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
              className={`relative h-48 w-44 flex flex-col items-center justify-center gap-5 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 group ${m.glow} ${m.borderGlow} ${loading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => getRecs(m.label)}
            >
              {/* Gradient border overlay for hover */}
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className={`relative p-5 rounded-full shadow-inner transition-transform duration-500 group-hover:scale-110 group-active:scale-95 ${m.bg}`}>
                <div className="absolute inset-0 rounded-full bg-white/20 blur-sm mix-blend-overlay"></div>
                <m.icon className={`relative z-10 h-10 w-10 ${m.color}`} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <span className="text-sm font-black tracking-widest text-white/90 group-hover:text-white transition-colors">{m.label}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 group-hover:text-gray-300 transition-colors">{m.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-10">
          <div className="relative flex items-center justify-center w-32 h-32">
             <div className="absolute inset-0 bg-primary/30 rounded-full blur-[40px] animate-pulse" />
             
             <div className="absolute w-24 h-24 border-t-4 border-r-4 border-primary rounded-full animate-spin" style={{ animationDuration: '3s' }} />
             <div className="absolute w-20 h-20 border-b-4 border-l-4 border-primary/60 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
             <div className="absolute w-16 h-16 border-t-4 border-l-4 border-white/50 rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
             
             <Sparkles className="h-8 w-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse relative z-10" />
          </div>
          
          <div className="relative flex flex-col items-center gap-3">
            <h3 className="text-2xl md:text-3xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-primary animate-pulse uppercase text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              Consultando al Oráculo
            </h3>
            <div className="flex items-center gap-3 opacity-80">
              <span className="h-[2px] w-12 bg-gradient-to-r from-transparent to-primary"></span>
              <p className="text-xs md:text-sm font-bold tracking-[0.4em] text-white uppercase">
                De la Rumba...
              </p>
              <span className="h-[2px] w-12 bg-gradient-to-l from-transparent to-primary"></span>
            </div>
          </div>
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
