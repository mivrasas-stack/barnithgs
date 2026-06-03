
"use client";

import { Navigation } from '@/components/Navigation';
import { MoodRecommender } from '@/components/MoodRecommender';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export default function MoodsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="container mx-auto px-4 py-20 space-y-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <Badge className="bg-primary neon-glow-primary text-white font-black px-6 py-2 text-sm animate-pulse">
            <Sparkles className="mr-2 h-4 w-4" /> RECOMENDADOR IA
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter font-headline leading-none">
            ENCUENTRA TU <span className="text-secondary neon-text-secondary">VIBRA</span>
          </h1>
          <p className="text-xl text-gray-400 font-medium leading-relaxed">
            Dile a nuestro sommelier virtual cómo te sientes y te armaremos la rumba ideal en segundos.
          </p>
        </div>

        <section className="relative">
          <div className="absolute inset-0 bg-secondary/5 blur-[120px] rounded-full -z-10" />
          <MoodRecommender />
        </section>
      </main>
    </div>
  );
}
