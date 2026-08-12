"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/lib/store';
import { StaffNavigation } from '@/components/StaffNavigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Truck, Bell, Navigation as NavIcon, CheckCircle2, Loader2, Signal } from 'lucide-react';
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white/50 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn || (role !== 'driver' && role !== 'admin')) return null;

  const simulateNewOrder = () => {
    if (!isOnline) {
      toast({ title: "Desconectado", description: "Conéctate para recibir pedidos." });
      return;
    }
    const order = {
      id: 'ORD-1234',
      pickup: 'Central Hub',
      delivery: '777 Appletree Way, Cupertino',
      items: '2x Vodka Premium 1L, 3x Cranberry Juice, 1x Ice Bag',
      total: 245000
    };
    setActiveOrder(order);
    toast({ title: "Nueva Asignación", description: "Se requiere recolección en Central." });
  };

  const completeStep = (step: string) => {
    toast({ title: "Estado Actualizado", description: step });
    if (step === 'Entrega Confirmada') {
      setActiveOrder(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <StaffNavigation />
      <main className="md:pl-16 container mx-auto px-4 py-8 md:py-12 max-w-[800px] space-y-6">
        
        {/* Status Header - Apple Style Widget */}
        <div className="apple-frost rounded-3xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
             <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${isOnline ? 'bg-green-500 text-white' : 'bg-white/10 text-white/50'}`}>
                <Signal className={`h-6 w-6 ${isOnline ? 'animate-pulse' : ''}`} />
             </div>
             <div>
               <h2 className="text-xl font-semibold tracking-tight">
                 {isOnline ? 'En Línea' : 'Desconectado'}
               </h2>
               <p className="text-sm font-medium text-white/50">
                 {isOnline ? 'Buscando asignaciones...' : 'Actualmente estás desconectado'}
               </p>
             </div>
          </div>
          <Switch 
            checked={isOnline} 
            onCheckedChange={setIsOnline} 
            className="data-[state=checked]:bg-green-500 scale-110"
          />
        </div>

        {!activeOrder ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
             <div className={`h-24 w-24 rounded-full flex items-center justify-center transition-all ${isOnline ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/20'}`}>
                <Bell className={`h-10 w-10 ${isOnline ? 'animate-bounce' : ''}`} />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight text-white">
                  {isOnline ? 'Rastreando Pedidos' : 'Radar Apagado'}
                </h3>
                <p className="text-sm text-white/50 font-medium">
                  {isOnline ? 'Mantente alerta. Los nuevos pedidos aparecerán aquí.' : 'Enciende tu estado para recibir pedidos.'}
                </p>
             </div>
             {isOnline && (
               <Button 
                 variant="secondary" 
                 className="bg-white/10 hover:bg-white/20 text-white rounded-full px-8 font-medium mt-4"
                 onClick={simulateNewOrder}
               >
                 Simular Entrega
               </Button>
             )}
          </div>
        ) : (
          <Card className="apple-frost rounded-3xl border-0 overflow-hidden shadow-lg">
             <CardContent className="p-0">
                {/* Map Simulation - Clean iOS Maps style */}
                <div className="h-64 w-full bg-[#1c1c1e] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}></div>
                  <div className="relative z-10 text-center space-y-2">
                    <NavIcon className="h-10 w-10 text-red-500 mx-auto" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-500 bg-red-500/10 px-3 py-1 rounded-full">Ruta Activa</span>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-6 bg-black/20">
                   <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <h3 className="text-xl font-semibold tracking-tight">Asignación Actual</h3>
                      <span className="text-xl font-semibold text-red-500">{formatCurrency(activeOrder.total)}</span>
                   </div>

                   <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center mt-1">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          <div className="w-px h-12 bg-white/10 my-1"></div>
                          <div className="h-3 w-3 rounded-full border-2 border-white/30"></div>
                        </div>
                        <div className="space-y-6 flex-1">
                          <div>
                            <p className="text-xs font-medium text-white/50 mb-1">Recolección</p>
                            <p className="text-base font-semibold">{activeOrder.pickup}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white/50 mb-1">Destino</p>
                            <p className="text-base font-semibold">{activeOrder.delivery}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                         <p className="text-xs font-medium text-white/50 flex items-center gap-2 mb-2">
                           <Truck className="h-4 w-4" /> Detalles del Pedido
                         </p>
                         <p className="text-sm font-medium text-white/90">{activeOrder.items}</p>
                      </div>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button 
                        onClick={() => completeStep('Recolección Confirmada')} 
                        variant="secondary" 
                        className="flex-1 h-12 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-xl"
                      >
                         Confirmar Recolección
                      </Button>
                      <Button 
                        onClick={() => completeStep('Entrega Confirmada')} 
                        className="flex-1 h-12 text-sm font-medium apple-btn-primary rounded-xl"
                      >
                         <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Entrega
                      </Button>
                   </div>
                </div>
             </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
