"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { AgeGate } from '@/components/AgeGate';
import { MoodRecommender } from '@/components/MoodRecommender';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Clock, MapPin, ShieldCheck, Zap, Beer, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <AgeGate onVerified={() => setIsVerified(true)} />
      
      {isVerified && (
        <div className="animate-in fade-in duration-1000">
          <Navigation />
          
          <main className="container mx-auto px-4 py-12 space-y-32">
            {/* Sección Hero con Estilo Neón */}
            <section className="relative min-h-[600px] w-full rounded-[2rem] overflow-hidden border border-white/10 group">
              <img 
                src="https://picsum.photos/seed/party-night/1200/600" 
                alt="Fiesta PartyFlow" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent" />
              
              <div className="relative h-full flex flex-col justify-center px-8 md:px-20 py-20 max-w-3xl space-y-8">
                <Badge className="w-fit bg-primary neon-glow-primary text-white font-bold px-6 py-2 text-sm animate-pulse">
                  <Sparkles className="mr-2 h-4 w-4" /> ABIERTO LAS 24 HORAS
                </Badge>
                
                <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter leading-none italic">
                  LA FIESTA <br /> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary neon-text-primary">
                    NO TIENE FIN.
                  </span>
                </h1>
                
                <p className="text-xl text-gray-300 max-w-lg leading-relaxed font-medium">
                  Cerveza bajo cero, licores de lujo y combos explosivos entregados en la puerta de tu rumba en <span className="text-secondary font-bold">15 minutos</span>.
                </p>
                
                <div className="flex flex-wrap gap-6 pt-4">
                  <Link href="/catalog">
                    <Button size="lg" className="h-16 px-10 text-xl font-bold bg-primary hover:bg-primary/90 neon-glow-primary rounded-full transition-all hover:scale-105">
                      PEDIR AHORA <ChevronRight className="ml-2 h-6 w-6" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold border-secondary text-secondary hover:bg-secondary/10 rounded-full border-2 transition-all">
                    VER COMBOS
                  </Button>
                </div>
              </div>
            </section>

            {/* Características con Brillo */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { icon: Zap, title: "Envío Flash", desc: "Llegamos antes de que se caliente la pista.", color: "text-secondary" },
                { icon: Clock, title: "Atención 24/7", desc: "La fiesta no duerme, nosotros tampoco.", color: "text-primary" },
                { icon: ShieldCheck, title: "100% Original", desc: "Solo licores certificados y de alta calidad.", color: "text-accent" }
              ].map((f, i) => (
                <div key={i} className="card-neon-border p-10 rounded-[2rem] space-y-6 group cursor-default">
                  <div className={`h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center ${f.color} group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black font-headline tracking-tight">{f.title}</h3>
                  <p className="text-gray-400 text-lg leading-snug">{f.desc}</p>
                </div>
              ))}
            </section>

            {/* Recomendador IA */}
            <section id="moods" className="py-20 relative">
              <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full" />
              <MoodRecommender />
            </section>

            {/* Live Tracking Preview */}
            <section className="bg-white/5 rounded-[3rem] p-12 md:p-20 border border-white/10 relative overflow-hidden">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-8 relative z-10">
                    <div className="flex items-center gap-2 text-secondary font-black tracking-widest text-sm">
                       <MapPin className="h-5 w-5 animate-bounce" /> RASTREO SATELITAL EN VIVO
                    </div>
                    <h2 className="text-5xl md:text-6xl font-black font-headline leading-[0.9] tracking-tighter">
                      SIGUE TUS TRAGOS <br /> 
                      <span className="text-secondary neon-text-secondary">EN EL RADAR.</span>
                    </h2>
                    <p className="text-xl text-gray-400 font-medium">
                      No desesperes. Mira el recorrido de tu pedido en tiempo real desde que sale de nuestra cava hasta que toca tu puerta.
                    </p>
                    <Button size="lg" className="bg-secondary text-black font-bold h-14 px-8 rounded-full neon-glow-secondary">
                      VER MI PEDIDO
                    </Button>
                  </div>
                  <div className="relative h-[400px] rounded-[2.5rem] overflow-hidden border-8 border-black shadow-[0_0_50px_rgba(0,255,255,0.2)]">
                     <img src="https://picsum.photos/seed/dark-map/800/600" className="w-full h-full object-cover grayscale brightness-50 contrast-125" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          <div className="h-12 w-12 bg-primary rounded-full animate-ping opacity-40" />
                          <div className="absolute inset-0 h-12 w-12 bg-primary rounded-full flex items-center justify-center neon-glow-primary">
                             <Zap className="text-white h-6 w-6" />
                          </div>
                        </div>
                        <div className="absolute mt-24 glass-morphism px-6 py-3 rounded-2xl border border-primary/40 text-sm font-black tracking-tight">
                           ¡TU REPARTIDOR ESTÁ A 2 MINUTOS!
                        </div>
                     </div>
                  </div>
               </div>
            </section>
          </main>

          <footer className="border-t border-white/10 py-20 mt-32 bg-black">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-16">
               <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Beer className="h-10 w-10 text-primary" />
                    <span className="text-3xl font-black font-headline tracking-tighter">
                      Party<span className="text-primary">Flow</span>
                    </span>
                  </div>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    El alma de la fiesta entregada en tiempo récord. Disfruta con responsabilidad. Prohibido el expendio de bebidas embriagantes a menores de edad.
                  </p>
               </div>
               <div>
                  <h4 className="font-black text-xl mb-6 tracking-tight">EXPLORA</h4>
                  <ul className="space-y-4 text-gray-400 font-medium">
                    <li><Link href="/catalog" className="hover:text-primary transition-colors">Cava Digital</Link></li>
                    <li><Link href="/moods" className="hover:text-primary transition-colors">Vibra Party</Link></li>
                    <li><Link href="/combos" className="hover:text-primary transition-colors">Combos VIP</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-black text-xl mb-6 tracking-tight">SOPORTE</h4>
                  <ul className="space-y-4 text-gray-400 font-medium">
                    <li><Link href="/faq" className="hover:text-primary transition-colors">Ayuda</Link></li>
                    <li><Link href="/contact" className="hover:text-primary transition-colors">Contacto 24/7</Link></li>
                    <li><Link href="/terms" className="hover:text-primary transition-colors">Términos</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-black text-xl mb-6 tracking-tight">RUMBA SOCIAL</h4>
                  <div className="flex gap-4">
                     {['IG', 'FB', 'TK'].map(social => (
                       <div key={social} className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black hover:border-primary hover:text-primary cursor-pointer transition-all">
                         {social}
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}