
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/lib/store';
import { StaffNavigation } from '@/components/StaffNavigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Bell, Navigation as NavIcon, CheckCircle2, Zap, Radio, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

export default function DriverPage() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  useEffect(() => {
    if (isInitialized && (!isLoggedIn || (role !== 'driver' && role !== 'admin'))) {
      router.push('/login');
    }
  }, [isLoggedIn, role, router, isInitialized]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-secondary animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn || (role !== 'driver' && role !== 'admin')) return null;

  const simulateNewOrder = () => {
    if (!isOnline) {
      toast({ title: "¡Ponte online para recibir pedidos!", variant: "destructive" });
      return;
    }
    const order = {
      id: 'ORD-1234',
      pickup: 'Almacén PartyFlow Centro',
      delivery: 'Calle de la Fiesta 777',
      items: '2x Vodka Premium 1L, 3x Jugo Arándano, 1x Bolsa Hielo',
      total: 245000
    };
    setActiveOrder(order);
    toast({ title: "¡NUEVO PEDIDO ASIGNADO!", description: "Recogida urgente en Almacén Centro" });
  };

  const completeStep = (step: string) => {
    toast({ title: step, description: "Estado actualizado para el cliente." });
    if (step === 'Entrega Confirmada') {
      setActiveOrder(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <StaffNavigation />
      <main className="md:pl-16 transition-all duration-300 container mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-700 max-w-[1200px]">
        <div className="flex items-center justify-between p-6 bg-card/40 rounded-[1.5rem] border border-white/10 glass-morphism">
          <div className="flex items-center gap-4">
             <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-500 ${isOnline ? 'bg-secondary/20 text-secondary neon-glow-secondary' : 'bg-white/5 text-gray-500'}`}>
                <Radio className={`h-6 w-6 ${isOnline ? 'animate-pulse' : ''}`} />
             </div>
             <div>
               <h2 className="text-xl font-black font-headline italic tracking-tighter">
                 ESTADO: {isOnline ? <span className="text-secondary neon-text-secondary">EN LÍNEA</span> : 'OFFLINE'}
               </h2>
               <p className="text-gray-400 font-medium text-xs">{isOnline ? 'Buscando rumbas...' : 'Pulsa para empezar'}</p>
             </div>
          </div>
          <Switch 
            checked={isOnline} 
            onCheckedChange={setIsOnline} 
            className="data-[state=checked]:bg-secondary"
          />
        </div>

        {!activeOrder ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
             <div className="relative">
                <div className={`absolute inset-0 rounded-full animate-ping bg-secondary/20 ${isOnline ? 'block' : 'hidden'}`} />
                <div className={`relative h-20 w-20 rounded-full bg-card/40 border-2 flex items-center justify-center transition-all ${isOnline ? 'border-secondary/40' : 'border-white/10'}`}>
                   <Bell className={`h-8 w-8 ${isOnline ? 'text-secondary animate-bounce' : 'text-gray-600'}`} />
                </div>
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black italic tracking-tighter">SIN PEDIDOS ACTIVOS</h3>
                <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">Mantén el volumen alto. La noche apenas comienza.</p>
             </div>
             {isOnline && (
               <Button variant="outline" size="sm" className="border-secondary text-secondary hover:bg-secondary/10 font-black tracking-widest px-6 rounded-full h-10" onClick={simulateNewOrder}>
                 SIMULAR PEDIDO
               </Button>
             )}
          </div>
        ) : (
          <Card className="border-primary bg-card/60 neon-glow-primary animate-in zoom-in-95 duration-500 rounded-[2rem] overflow-hidden">
             <CardHeader className="bg-primary/20 border-b border-primary/20 p-6">
                <div className="flex justify-between items-center">
                   <CardTitle className="text-xl font-black italic text-primary neon-text-primary tracking-tighter flex items-center gap-2">
                      <Zap className="h-6 w-6 fill-primary" /> ENTREGA EN CURSO
                   </CardTitle>
                   <Badge className="bg-primary font-black px-4 py-1 text-[10px] animate-pulse rounded-full">URGENTE</Badge>
                </div>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="space-y-4">
                         <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                               <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                               <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mb-0.5">Recogida</p>
                               <p className="text-base font-bold">{activeOrder.pickup}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                               <NavIcon className="h-5 w-5" />
                            </div>
                            <div>
                               <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mb-0.5">Destino</p>
                               <p className="text-base font-bold">{activeOrder.delivery}</p>
                            </div>
                         </div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                         <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest">Contenido</p>
                         <p className="text-sm font-medium text-gray-200">{activeOrder.items}</p>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                         <span className="font-black italic text-primary uppercase tracking-widest text-xs">Valor:</span>
                         <span className="text-xl font-black text-white">{formatCurrency(activeOrder.total)}</span>
                      </div>
                   </div>
                   <div className="h-[250px] rounded-[1.5rem] overflow-hidden border-2 border-white/5 relative">
                      <img src="https://picsum.photos/seed/route-dark/800/600" className="w-full h-full object-cover grayscale brightness-50 contrast-125" />
                   </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-white/5">
                   <Button onClick={() => completeStep('Pedido Recogido')} variant="outline" className="flex-1 h-12 text-sm font-black border-secondary text-secondary hover:bg-secondary/10 rounded-xl tracking-tighter italic">
                      RECOGIDO
                   </Button>
                   <Button onClick={() => completeStep('Entrega Confirmada')} className="flex-1 h-12 text-sm font-black bg-primary neon-glow-primary rounded-xl tracking-tighter italic">
                      <CheckCircle2 className="mr-2 h-4 w-4" /> CONFIRMAR
                   </Button>
                </div>
             </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
