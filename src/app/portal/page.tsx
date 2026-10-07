"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Clock, Package, Zap, Plus, Wine, Trophy, History, CheckCircle2, ChevronRight, Sparkles, Flame, Gift } from 'lucide-react';
import { RouletteModal } from '@/components/RouletteModal';
import { DeliveryMap } from '@/components/DeliveryMap';
import { router as osrmRouter } from '@/lib/geo/osrm';

export default function PortalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [progress, setProgress] = useState(15);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [showRoulette, setShowRoulette] = useState(false);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{distance: number, eta: number} | null>(null);
  const [prizes, setPrizes] = useState<{id: number, label: string, date: string}[]>([]);

  // Coordenadas mock de Bogotá (Zona T -> Parque 93)
  const origin: [number, number] = [-74.0543, 4.6677];
  const dest: [number, number] = [-74.0494, 4.6766];

  useEffect(() => {
    // Si no está verificado, redirigir al login del portal
    if (!localStorage.getItem('portal_vip_verified')) {
      router.push('/portal/login');
    }

    const timer = setInterval(() => {
      setProgress(p => Math.min(p + 10, 100));
    }, 2000);

    const rouletteTimer = setTimeout(() => setShowRoulette(true), 2000);
    
    // Cargar premios iniciales
    const loadPrizes = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('portal_prizes') || '[]');
        setPrizes(stored);
      } catch(e) {}
    };
    
    loadPrizes();
    window.addEventListener('portal_prizes_updated', loadPrizes);
    
    // Obtener ruta con OSRM al cargar
    osrmRouter.getRoute(origin, dest).then(route => {
      setRouteGeoJSON(route.geometry);
      setRouteInfo({ distance: route.distance, eta: route.eta });
    }).catch(console.error);

    return () => {
      clearInterval(timer);
      clearTimeout(rouletteTimer);
      window.removeEventListener('portal_prizes_updated', loadPrizes);
    };
  }, [router]);

  const handle1ClickAdd = (item: string) => {
    setAddingItem(item);
    setTimeout(() => {
      setAddingItem(null);
      toast({
        title: "¡Magia Pura! ✨",
        description: `${item} ha sido añadido a tu orden en camino. Sin costo extra de envío.`,
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-black">
      <Navigation />
      
      <main className="container mx-auto px-4 py-32 space-y-12 animate-in fade-in duration-1000">
        
        {/* Cabecera del Portal */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter flex items-center gap-3">
              BIENVENIDO, LEYENDA <Sparkles className="text-primary h-8 w-8" />
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Tu centro de control nocturno. Nivel actual: <strong className="text-primary">VIP Oro</strong></p>
          </div>
          <div className="flex gap-4">
             <Card className="glass-morphism border-primary/20 bg-black/40">
                <CardContent className="p-4 flex items-center gap-4">
                   <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                      <Trophy className="text-primary h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Puntos PartyFlow</p>
                      <p className="text-2xl font-black text-white">4,250</p>
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>

        <Tabs defaultValue="tracking" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-[600px] bg-black/50 border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="tracking" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black font-bold">Pedido Actual</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black font-bold">Historial</TabsTrigger>
            <TabsTrigger value="prizes" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black font-bold flex items-center gap-2">
              Premios
              {prizes.length > 0 && (
                <span className="bg-primary text-black rounded-full h-5 w-5 text-xs flex items-center justify-center font-black animate-bounce">
                  {prizes.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tracking" className="mt-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Columna Izquierda: SEGUIMIENTO EN VIVO */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="glass-morphism border-white/10 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-2">
                           <MapPin className="text-primary h-6 w-6" /> Misión en Curso
                        </CardTitle>
                        <CardDescription className="text-gray-400">Orden #8942-X</CardDescription>
                      </div>
                      <Badge variant="outline" className="border-primary text-primary bg-primary/10 px-4 py-2 font-bold animate-pulse">
                         EN CAMINO
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Mapa Interactivo MapLibre */}
                    <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden border border-white/10">
                      <DeliveryMap 
                        routeGeoJSON={routeGeoJSON}
                        markers={[
                          { id: 'store', type: 'store', lng: origin[0], lat: origin[1] },
                          { id: 'driver', type: 'driver', lng: origin[0] + 0.002, lat: origin[1] + 0.002 },
                          { id: 'customer', type: 'customer', lng: dest[0], lat: dest[1] }
                        ]}
                      />
                      
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-morphism px-6 py-3 rounded-xl border border-primary/30 flex items-center gap-3 whitespace-nowrap z-10 shadow-2xl">
                         <Clock className="text-primary h-5 w-5 animate-pulse" />
                         <span className="font-bold text-lg tracking-widest">
                           {routeInfo ? `LLEGANDO EN ${Math.round(routeInfo.eta / 60)} MIN` : 'CALCULANDO RUTA...'}
                         </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                      <Progress value={progress} className="h-3 bg-white/5" />
                      <div className="flex justify-between text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider">
                         <span className="text-primary flex flex-col items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Confirmado</span>
                         <span className="text-primary flex flex-col items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Preparado</span>
                         <span className="text-white drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] flex flex-col items-center gap-1">En Camino</span>
                         <span className="flex flex-col items-center gap-1 opacity-50">Entregado</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Columna Derecha: UPSELL "EL ORÁCULO SUGIERE" */}
              <div className="space-y-6">
                 <h3 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Flame className="h-5 w-5" /> Amplía la Rumba
                 </h3>
                 <p className="text-sm text-gray-400">¿Olvidaste algo? Añádelo ahora con 1-click y llegará en la misma entrega.</p>

                 <div className="grid gap-4">
                    {/* Upsell Item 1 */}
                    <Card className="card-neon-border bg-black/40 group overflow-hidden relative">
                       <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                       <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="h-16 w-16 rounded-xl bg-white/5 overflow-hidden border border-white/10">
                                <img src="https://picsum.photos/seed/hielo/100/100" alt="Hielo" className="w-full h-full object-cover grayscale opacity-80" />
                             </div>
                             <div>
                                <h4 className="font-bold text-white leading-tight">Bolsa de Hielo Premium</h4>
                                <p className="text-xs text-primary font-black mt-1">$15,000 COP</p>
                             </div>
                          </div>
                          <Button 
                            size="icon" 
                            className="rounded-full bg-white text-black hover:bg-primary transition-all relative z-10"
                            onClick={() => handle1ClickAdd('Bolsa de Hielo Premium')}
                            disabled={addingItem === 'Bolsa de Hielo Premium'}
                          >
                             {addingItem === 'Bolsa de Hielo Premium' ? <Clock className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                          </Button>
                       </CardContent>
                    </Card>

                    {/* Upsell Item 2 */}
                    <Card className="card-neon-border bg-black/40 group overflow-hidden relative border-primary/20">
                       <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                       <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="h-16 w-16 rounded-xl bg-white/5 overflow-hidden border border-white/10">
                                <img src="https://picsum.photos/seed/redbull/100/100" alt="Mezcladores" className="w-full h-full object-cover grayscale opacity-80" />
                             </div>
                             <div>
                                <h4 className="font-bold text-white leading-tight">Pack 4 Red Bull</h4>
                                <p className="text-xs text-primary font-black mt-1">$45,000 COP</p>
                             </div>
                          </div>
                          <Button 
                            size="icon" 
                            className="rounded-full bg-white text-black hover:bg-primary transition-all relative z-10"
                            onClick={() => handle1ClickAdd('Pack 4 Red Bull')}
                            disabled={addingItem === 'Pack 4 Red Bull'}
                          >
                             {addingItem === 'Pack 4 Red Bull' ? <Clock className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                          </Button>
                       </CardContent>
                    </Card>

                    {/* Upsell Item 3 */}
                    <Card className="card-neon-border bg-black/40 group overflow-hidden relative">
                       <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="h-16 w-16 rounded-xl bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center">
                                <Wine className="h-8 w-8 text-gray-500" />
                             </div>
                             <div>
                                <h4 className="font-bold text-white leading-tight">Limones y Sal</h4>
                                <p className="text-xs text-primary font-black mt-1">$10,000 COP</p>
                             </div>
                          </div>
                          <Button 
                            size="icon" 
                            className="rounded-full bg-white text-black hover:bg-primary transition-all relative z-10"
                            onClick={() => handle1ClickAdd('Limones y Sal')}
                            disabled={addingItem === 'Limones y Sal'}
                          >
                             {addingItem === 'Limones y Sal' ? <Clock className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                          </Button>
                       </CardContent>
                    </Card>
                 </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
             <Card className="glass-morphism border-white/10">
                <CardHeader>
                   <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-2">
                      <History className="text-primary h-6 w-6" /> Noches Legendarias
                   </CardTitle>
                   <CardDescription>Tus pedidos anteriores. Repítelos con un solo clic.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {[
                      { id: '8821', date: 'Viernes pasado', items: 'Combo Buchanan\'s 12 + Hielo + 2 RedBull', price: '$350,000' },
                      { id: '8105', date: 'Hace 2 semanas', items: 'Tequila Don Julio 70 + Limones + Sal', price: '$420,000' },
                      { id: '7940', date: 'Hace 1 mes', items: 'Pack Cervezas Corona x12 + Snacks', price: '$85,000' }
                   ].map((order, i) => (
                      <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-white/5 transition-colors group">
                         <div>
                            <div className="flex items-center gap-3">
                               <Badge variant="outline" className="border-gray-600 text-gray-400">#{order.id}</Badge>
                               <span className="text-sm font-bold text-white">{order.date}</span>
                            </div>
                            <p className="text-gray-400 text-sm mt-1">{order.items}</p>
                         </div>
                         <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                            <span className="text-primary font-black tracking-wider">{order.price}</span>
                            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary hover:text-black group-hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] transition-all">
                               Repetir Orden <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                         </div>
                      </div>
                   ))}
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="prizes" className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Gift className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-black uppercase tracking-widest text-white">Tus Premios Ganados</h2>
            </div>
            
            {prizes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prizes.map((prize, idx) => (
                  <Card key={idx} className="glass-morphism border-primary/20 bg-black/40 hover:bg-black/60 hover:scale-105 transition-all duration-300">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl font-black text-primary uppercase">{prize.label}</CardTitle>
                      <CardDescription className="text-gray-400">
                        Ganado el: {new Date(prize.date).toLocaleDateString()} a las {new Date(prize.date).toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-white text-black hover:bg-gray-200 font-bold uppercase mt-2">
                        Usar en Próxima Orden
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="glass-morphism border-white/10 bg-black/40">
                <CardContent className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                     <Sparkles className="h-8 w-8 text-primary/50" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Aún no tienes premios</h3>
                  <p className="text-gray-400 mb-6">Prueba tu suerte girando La Ruleta de la Rumba. ¡Puedes ganar desde envíos gratis hasta tragos cortesía!</p>
                  <Button 
                    className="bg-primary text-black font-bold hover:scale-105 transition-transform"
                    onClick={() => setShowRoulette(true)}
                  >
                    Girar Ruleta
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

      </main>
      
      <RouletteModal open={showRoulette} onOpenChange={setShowRoulette} />
    </div>
  );
}
