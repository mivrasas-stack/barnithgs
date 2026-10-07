"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { AgeGate } from '@/components/AgeGate';
import { MoodRecommender } from '@/components/MoodRecommender';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Clock, MapPin, ShieldCheck, Zap, Beer, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-black">
      <AgeGate onVerified={() => setIsVerified(true)} />
      
      {isVerified && (
        <div className="animate-in fade-in duration-1000">
          <Navigation />
          
          <main className="container mx-auto px-4 py-12 space-y-32">
            {/* Sección Hero VIP */}
            <section className="relative min-h-[750px] w-full rounded-[2rem] overflow-hidden border border-white/5 group">
              <img 
                src="https://picsum.photos/seed/luxury-nightclub/1920/1080" 
                alt="Experiencia PartyFlow VIP" 
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/90 via-[#0A0A0A]/50 to-transparent" />
              
              <div className="relative h-full flex flex-col justify-center px-8 md:px-24 py-20 max-w-4xl space-y-10">
                <Badge className="w-fit apple-frost text-white font-medium px-6 py-2 text-sm border-white/10 uppercase tracking-tight flex items-center shadow-sm">
                  <Star className="mr-2 h-4 w-4 fill-primary text-primary" /> Servicio de Conserjería 24/7
                </Badge>
                
                <h1 className="text-5xl md:text-8xl lg:text-9xl font-black font-headline tracking-tighter leading-[0.9]">
                  EXCLUSIVIDAD <br /> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FDF5E6] to-[#D4AF37] drop-shadow-[0_0_25px_rgba(255,215,0,0.4)]">
                    A TU PUERTA.
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl leading-relaxed font-light">
                  Licores premium, botellas de colección y experiencias VIP entregadas en tu ubicación en <span className="text-primary font-semibold">15 minutos</span>. No hacemos filas.
                </p>
                
                <div className="flex flex-col md:flex-row flex-wrap gap-4 pt-6 w-full">
                  <Link href="/catalog" className="w-full md:w-auto">
                    <Button size="lg" className="w-full md:w-auto h-14 px-10 text-base font-semibold btn-theme-luxury rounded-full transition-all">
                      PEDIR AHORA <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/combos" className="w-full md:w-auto">
                    <Button size="lg" variant="outline" className="w-full md:w-auto h-14 px-10 text-base font-medium border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37]/10 apple-frost rounded-full transition-all">
                      VER CATÁLOGO VIP
                    </Button>
                  </Link>
                </div>
              </div>
            </section>


            {/* Nueva Sección: Selección Premium */}
            <section className="space-y-10 relative">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                     <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
                        RESERVA Privada
                     </h2>
                     <p className="text-white/50 text-lg font-medium">Lo más codiciado de nuestra cava.</p>
                  </div>
                  <Button variant="link" className="text-primary hover:text-white font-semibold p-0 text-base group">
                     Ver toda la cava <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                  {[
                    { name: 'Dom Pérignon Vintage', cat: 'Champaña', price: 1450000, img: 'https://picsum.photos/seed/luxury-bottle-1/200/400' },
                    { name: 'Johnnie Walker Blue', cat: 'Whisky', price: 980000, img: 'https://picsum.photos/seed/luxury-bottle-2/200/400' },
                    { name: 'Combo Pre-Copeo', cat: 'Vodka', price: 210000, img: 'https://picsum.photos/seed/luxury-bottle-3/200/400' },
                    { name: 'Don Julio 1942', cat: 'Tequila Añejo', price: 850000, img: 'https://picsum.photos/seed/luxury-bottle-4/200/400' }
                  ].map((p, i) => {
                     const isCombo = p.cat === 'Vodka' || p.name.includes('Combo');
                     const btnClass = isCombo ? 'btn-theme-vibrant' : 'btn-theme-luxury';
                     const cardClass = isCombo ? 'card-theme-vibrant' : 'card-theme-luxury';
                     
                     return (
                      <div key={i} className={`${cardClass} rounded-3xl overflow-hidden group hover:-translate-y-2 border border-white/10 flex flex-col`}>
                         <div className="h-72 relative flex items-center justify-center p-8 overflow-hidden bg-gradient-to-t from-black/80 to-transparent">
                            <img src={p.img} alt={p.name} className="h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-in-out relative z-10 drop-shadow-2xl" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-0"></div>
                            <Badge className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-white border-white/20 font-light tracking-wider">{p.cat}</Badge>
                         </div>
                         <div className="p-6 space-y-4 bg-black/90 flex-grow flex flex-col justify-between backdrop-blur-xl border-t border-white/5">
                            <h4 className="text-2xl font-bold font-headline truncate text-white tracking-tight">{p.name}</h4>
                            <div className="flex flex-col gap-3">
                               <div className="flex justify-between items-center">
                                  <span className="text-3xl font-light text-[#d4af37]">${(p.price).toLocaleString('es-CO')}</span>
                                  <Button size="icon" className={`rounded-full shadow-lg ${btnClass}`}>
                                     <Zap className="h-5 w-5" />
                                  </Button>
                               </div>
                               {/* Upsell Suggestion inside card */}
                               <div className="text-xs text-white/40 flex items-center gap-1 bg-white/5 p-2 rounded-lg">
                                 <Sparkles className="h-3 w-3 text-[#d4af37]" /> + $15.000 incluye 2 RedBull
                               </div>
                            </div>
                         </div>
                      </div>
                  )})}
               </div>
            </section>

            {/* Nueva Sección: Jóvenes y Cócteles (Vibrant) */}
            <section className="space-y-10 relative mt-32 p-8 md:p-12 rounded-[3rem] border border-[#ff0f7b]/30 bg-gradient-to-br from-[#ff0f7b]/10 via-black to-[#f89b29]/10">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                     <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#ff0f7b] to-[#f89b29]">
                        ENERGÍA & DULZURA
                     </h2>
                     <p className="text-white/70 text-lg font-medium">Licores jóvenes, aperitivos y cócteles llamativos.</p>
                  </div>
                  <Button variant="link" className="text-[#ff0f7b] hover:text-white font-semibold p-0 text-base group">
                     Ver más <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  {[
                    { name: 'Grey Goose', cat: 'Vodka', price: 210000, img: 'https://picsum.photos/seed/vodka1/200/400' },
                    { name: 'Aguardiente Antioqueño', cat: 'Aguardiente', price: 65000, img: 'https://picsum.photos/seed/aguardiente/200/400' },
                    { name: 'Heineken 6-Pack', cat: 'Cerveza', price: 32000, img: 'https://picsum.photos/seed/beer1/200/400' }
                  ].map((p, i) => (
                     <div key={i} className="card-theme-vibrant rounded-3xl overflow-hidden group hover:-translate-y-2 border border-[#ff0f7b]/40 flex flex-col">
                        <div className="h-72 relative bg-gradient-to-b from-[#ff0f7b]/5 to-transparent flex items-center justify-center p-8 overflow-hidden">
                           <img src={p.img} alt={p.name} className="h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-in-out drop-shadow-2xl" />
                           <Badge className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-[#ff0f7b] border-[#ff0f7b]/30 font-light tracking-wider">{p.cat}</Badge>
                        </div>
                        <div className="p-6 space-y-4 bg-black/90 flex-grow flex flex-col justify-between backdrop-blur-xl border-t border-[#ff0f7b]/20">
                           <h4 className="text-2xl font-bold font-headline truncate text-white tracking-tight">{p.name}</h4>
                           <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                 <span className="text-3xl font-light text-white">${(p.price).toLocaleString('es-CO')}</span>
                                 <Button size="icon" className="rounded-full shadow-lg btn-theme-vibrant">
                                    <Zap className="h-5 w-5" />
                                 </Button>
                              </div>
                              <div className="text-xs text-white/40 flex items-center gap-1 bg-white/5 p-2 rounded-lg">
                                <Sparkles className="h-3 w-3 text-[#ff0f7b]" /> Sugerencia: Limones y Sal por $5.000
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* Nueva Sección: Tradición y Añejos (Aged) */}
            <section className="space-y-10 relative mt-32 p-8 md:p-12 rounded-[3rem] border border-[#d4af37]/30 bg-gradient-to-br from-[#8b4513]/20 via-black to-[#d4af37]/10">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                     <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-[#8b4513]">
                        TRADICIÓN & CALIDEZ
                     </h2>
                     <p className="text-white/70 text-lg font-medium">Whisky, ron oscuro y licores añejos de alta calidad.</p>
                  </div>
                  <Button variant="link" className="text-[#d4af37] hover:text-white font-semibold p-0 text-base group">
                     Ver más <ChevronRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  {[
                    { name: 'Johnnie Walker Black', cat: 'Whisky', price: 185000, img: 'https://picsum.photos/seed/whiskey1/200/400' },
                    { name: 'Ron Zacapa 23', cat: 'Ron', price: 280000, img: 'https://picsum.photos/seed/ron1/200/400' },
                    { name: 'Tequila Don Julio Reposado', cat: 'Tequila', price: 320000, img: 'https://picsum.photos/seed/tequila2/200/400' }
                  ].map((p, i) => (
                     <div key={i} className="card-theme-aged rounded-3xl overflow-hidden group hover:-translate-y-2 border border-[#d4af37]/40 flex flex-col">
                        <div className="h-72 relative bg-gradient-to-b from-[#d4af37]/5 to-transparent flex items-center justify-center p-8 overflow-hidden">
                           <img src={p.img} alt={p.name} className="h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-in-out drop-shadow-2xl" />
                           <Badge className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-[#d4af37] border-[#d4af37]/30 font-light tracking-wider">{p.cat}</Badge>
                        </div>
                        <div className="p-6 space-y-4 bg-black/90 flex-grow flex flex-col justify-between backdrop-blur-xl border-t border-[#d4af37]/20">
                           <h4 className="text-2xl font-bold font-headline truncate text-white tracking-tight">{p.name}</h4>
                           <div className="flex flex-col gap-3">
                              <div className="flex justify-between items-center">
                                 <span className="text-3xl font-light text-white">${(p.price).toLocaleString('es-CO')}</span>
                                 <Button size="icon" className="rounded-full shadow-lg btn-theme-aged">
                                    <Zap className="h-5 w-5" />
                                 </Button>
                              </div>
                              <div className="text-xs text-white/40 flex items-center gap-1 bg-white/5 p-2 rounded-lg">
                                <Sparkles className="h-3 w-3 text-[#d4af37]" /> Combina con: Hielo Premium por $8.000
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* Recomendador IA */}
            <section id="moods" className="py-20 relative border-t border-white/5 mt-32">
              <div className="absolute inset-0 bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />
              <MoodRecommender />
            </section>

            {/* Live Tracking Preview (Rediseñado) */}
            <section className="glass-morphism rounded-[3rem] p-8 md:p-20 relative overflow-hidden mt-32">
               <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent blur-3xl pointer-events-none" />
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                  <div className="space-y-8 relative z-10">
                    <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-sm uppercase">
                       <MapPin className="h-5 w-5 animate-bounce" /> Seguimiento Satelital
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black font-headline leading-[1] tracking-tighter">
                      TU EXPERIENCIA <br /> 
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-[#FDF5E6]">
                        EN CAMINO.
                      </span>
                    </h2>
                    <p className="text-xl text-gray-300 font-light leading-relaxed">
                      Monitorea tu entrega en tiempo real con precisión militar. Desde nuestra cava hasta tus manos, sabrás exactamente dónde está tu pedido.
                    </p>
                    <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-bold h-14 px-10 rounded-full transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]" asChild>
                      <Link href="/portal/login">
                        VER ESTADO DEL PEDIDO
                      </Link>
                    </Button>
                  </div>
                  <div className="relative h-[450px] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                     <img src="https://picsum.photos/seed/dark-city-map/800/800" className="w-full h-full object-cover grayscale brightness-[0.3] contrast-150" alt="Live tracking map" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          <div className="h-16 w-16 bg-primary rounded-full animate-ping opacity-20" />
                          <div className="absolute inset-0 h-16 w-16 bg-primary/20 backdrop-blur-md border border-primary/50 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                             <Zap className="text-primary h-6 w-6" />
                          </div>
                        </div>
                        <div className="absolute mt-32 glass-morphism px-8 py-4 rounded-2xl border border-primary/30 text-sm font-bold tracking-widest text-primary shadow-2xl">
                           LLEGANDO EN 2 MINUTOS
                        </div>
                     </div>
                  </div>
               </div>
            </section>

            {/* UPSELL: Completa tu Experiencia */}
            <section className="space-y-10 relative mt-32 p-8 md:p-12 apple-card overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#d4af37]/10 via-black to-black pointer-events-none" />
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                     <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white flex items-center gap-3">
                        <Sparkles className="h-8 w-8 text-[#d4af37]" /> COMPLETA TU EXPERIENCIA
                     </h2>
                     <p className="text-white/70 text-lg font-medium">El toque final perfecto. Agrega estos imprescindibles sin costo extra de envío.</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 mt-8">
                  {[
                    { name: 'Hielo Premium 2kg', price: 8000, img: 'https://picsum.photos/seed/ice/100/100' },
                    { name: 'RedBull 4-Pack', price: 32000, img: 'https://picsum.photos/seed/energy/100/100' },
                    { name: 'Limones & Sal', price: 5000, img: 'https://picsum.photos/seed/lemons/100/100' },
                    { name: 'Tónica Fever Tree', price: 15000, img: 'https://picsum.photos/seed/tonic/100/100' }
                  ].map((p, i) => (
                     <div key={i} className="apple-frost rounded-2xl p-4 flex flex-col items-center text-center gap-4 group hover:bg-white/5 transition-colors border border-white/5 cursor-pointer hover:border-[#d4af37]/30">
                        <img src={p.img} alt={p.name} className="h-20 w-20 rounded-full object-cover group-hover:scale-110 transition-transform shadow-lg" />
                        <div className="flex-grow flex flex-col justify-center">
                           <h5 className="font-semibold text-white leading-tight">{p.name}</h5>
                           <p className="text-[#d4af37] font-bold mt-1">+${(p.price).toLocaleString('es-CO')}</p>
                        </div>
                        <Button size="sm" variant="outline" className="w-full rounded-full border-white/10 text-white hover:bg-white/10 mt-auto text-xs font-bold tracking-wider">
                           AGREGAR
                        </Button>
                     </div>
                  ))}
               </div>
            </section>
          </main>

          <footer className="border-t border-white/5 py-24 mt-32 bg-[#050505]">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-16">
               <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Star className="h-8 w-8 text-primary fill-primary" />
                    <span className="text-3xl font-black font-headline tracking-tighter">
                      Party<span className="text-primary">Flow</span> <span className="text-sm font-light tracking-widest uppercase text-gray-500 ml-2">Premium</span>
                    </span>
                  </div>
                  <p className="text-gray-500 font-light leading-relaxed">
                    Elevando el estándar del servicio de licores a domicilio. Exclusividad, rapidez y distinción en cada entrega. Disfruta con responsabilidad.
                  </p>
               </div>
               <div>
                  <h4 className="font-bold text-lg mb-6 tracking-widest uppercase text-white/80">Colección</h4>
                  <ul className="space-y-4 text-gray-400 font-light">
                    <li><Link href="/catalog" className="hover:text-primary transition-colors">Cava Principal</Link></li>
                    <li><Link href="/moods" className="hover:text-primary transition-colors">Selección por Momento</Link></li>
                    <li><Link href="/combos" className="hover:text-primary transition-colors">Experiencias VIP</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold text-lg mb-6 tracking-widest uppercase text-white/80">Servicio</h4>
                  <ul className="space-y-4 text-gray-400 font-light">
                    <li><Link href="/faq" className="hover:text-primary transition-colors">Concierge (Ayuda)</Link></li>
                    <li><Link href="/contact" className="hover:text-primary transition-colors">Contacto Exclusivo</Link></li>
                    <li><Link href="/terms" className="hover:text-primary transition-colors">Términos y Condiciones</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold text-lg mb-6 tracking-widest uppercase text-white/80">Comunidad</h4>
                  <div className="flex gap-4">
                     {['IG', 'FB', 'X'].map(social => (
                       <div key={social} className="h-12 w-12 rounded-full glass-morphism flex items-center justify-center font-bold text-sm hover:border-primary hover:text-primary cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]">
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
