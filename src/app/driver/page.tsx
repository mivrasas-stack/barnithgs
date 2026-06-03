
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
      <main className="container mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
        <div className="flex items-center justify-between p-8 bg-card/40 rounded-[2.5rem] border border-white/10 glass-morphism shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-6">
             <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOnline ? 'bg-secondary/20 text-secondary neon-glow-secondary' : 'bg-white/5 text-gray-500'}`}>
                <Radio className={`h-8 w-8 ${isOnline ? 'animate-pulse' : ''}`} />
             </div>
             <div>
               <h2 className="text-3xl font-black font-headline italic tracking-tighter">
                 ESTADO: {isOnline ? <span className="text-secondary neon-text-secondary">EN LÍNEA</span> : 'DESCONECTADO'}
               </h2>
               <p className="text-gray-400 font-medium">{isOnline ? 'Buscando rumbas que necesitan trago...' : 'Pulsa el interruptor para empezar a facturar'}</p>
             </div>
          </div>
          <Switch 
            checked={isOnline} 
            onCheckedChange={setIsOnline} 
            className="data-[state=checked]:bg-secondary"
          />
        </div>

        {!activeOrder ? (
          <div className="flex flex-col items-center justify-center py-32 gap-8 text-center">
             <div className="relative">
                <div className={`absolute inset-0 rounded-full animate-ping bg-secondary/20 ${isOnline ? 'block' : 'hidden'}`} />
                <div className={`relative h-32 w-32 rounded-full bg-card/40 border-2 flex items-center justify-center transition-all ${isOnline ? 'border-secondary/40' : 'border-white/10'}`}>
                   <Bell className={`h-12 w-12 ${isOnline ? 'text-secondary animate-bounce' : 'text-gray-600'}`} />
                </div>
             </div>
             <div className="space-y-4">
                <h3 className="text-4xl font-black italic tracking-tighter">SIN PEDIDOS ACTIVOS</h3>
                <p className="text-xl text-gray-400 font-medium max-w-md mx-auto">Mantén el volumen alto. La noche apenas está comenzando.</p>
             </div>
             {isOnline && (
               <Button variant="outline" size="lg" className="border-secondary text-secondary hover:bg-secondary/10 font-black tracking-widest px-10 rounded-full h-14" onClick={simulateNewOrder}>
                 SIMULAR PEDIDO ENTRANTE
               </Button>
             )}
          </div>
        ) : (
          <Card className="border-primary bg-card/60 neon-glow-primary animate-in zoom-in-95 duration-500 rounded-[3rem] overflow-hidden">
             <CardHeader className="bg-primary/20 border-b border-primary/20 p-8">
                <div className="flex justify-between items-center">
                   <CardTitle className="text-3xl font-black italic text-primary neon-text-primary tracking-tighter flex items-center gap-3">
                      <Zap className="h-8 w-8 fill-primary" /> ENTREGA EN CURSO
                   </CardTitle>
                   <Badge className="bg-primary font-black px-6 py-2 text-sm animate-pulse rounded-full">URGENTE</Badge>
                </div>
             </CardHeader>
             <CardContent className="p-10 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-10">
                      <div className="space-y-8">
                         <div className="flex items-start gap-5 group">
                            <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0 group-hover:neon-glow-secondary transition-all">
                               <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                               <p className="text-xs text-gray-400 uppercase font-black tracking-widest mb-1">Punto de Recogida</p>
                               <p className="text-xl font-bold">{activeOrder.pickup}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-5 group">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:neon-glow-primary transition-all">
                               <NavIcon className="h-6 w-6" />
                            </div>
                            <div>
                               <p className="text-xs text-gray-400 uppercase font-black tracking-widest mb-1">Destino de la Fiesta</p>
                               <p className="text-xl font-bold">{activeOrder.delivery}</p>
                            </div>
                         </div>
                      </div>
                      <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                         <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Lo que llevas en la maleta</p>
                         <p className="text-lg font-medium text-gray-200">{activeOrder.items}</p>
                      </div>
                      <div className="flex justify-between items-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
                         <span className="font-black italic text-primary uppercase tracking-widest">Valor a Cobrar:</span>
                         <span className="text-3xl font-black text-white">{formatCurrency(activeOrder.total)}</span>
                      </div>
                   </div>
                   <div className="h-[400px] rounded-[2.5rem] overflow-hidden border-4 border-white/5 relative group">
                      <img src="https://picsum.photos/seed/route-dark/800/600" className="w-full h-full object-cover grayscale brightness-50 contrast-125 transition-transform duration-700 group-hover:scale-110" />
                   </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 pt-8 border-t border-white/5">
                   <Button onClick={() => completeStep('Pedido Recogido')} variant="outline" className="flex-1 h-16 text-xl font-black border-secondary text-secondary hover:bg-secondary/10 rounded-2xl tracking-tighter italic">
                      MARCAR COMO RECOGIDO
                   </Button>
                   <Button onClick={() => completeStep('Entrega Confirmada')} className="flex-1 h-16 text-xl font-black bg-primary neon-glow-primary rounded-2xl tracking-tighter italic">
                      <CheckCircle2 className="mr-3 h-6 w-6" /> CONFIRMAR ENTREGA
                   </Button>
                </div>
             </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
