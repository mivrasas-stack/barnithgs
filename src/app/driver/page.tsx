"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Bell, Navigation as NavIcon, CheckCircle2, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function DriverPage() {
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  const simulateNewOrder = () => {
    if (!isOnline) {
      toast({ title: "¡Ponte online para recibir pedidos!", variant: "destructive" });
      return;
    }
    const order = {
      id: 'ORD-1234',
      pickup: 'Almacén PartyFlow Centro',
      delivery: 'Calle Falsa 123',
      items: '2x Vodka 1L, 3x Jugo de Naranja',
      total: '$86.00'
    };
    setActiveOrder(order);
    toast({ title: "¡Nuevo Pedido Asignado!", description: "Recogida entrante en el Almacén Centro" });
  };

  const completeStep = (step: string) => {
    toast({ title: step, description: "Estado actualizado para el cliente." });
    if (step === 'Entrega Confirmada') {
      setActiveOrder(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between p-6 bg-card rounded-2xl border border-border/50">
          <div className="flex items-center gap-4">
             <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isOnline ? 'bg-secondary/10 text-secondary' : 'bg-muted text-muted-foreground'}`}>
                <Truck className="h-6 w-6" />
             </div>
             <div>
               <h2 className="text-xl font-bold font-headline">Estado: {isOnline ? 'Activo' : 'Desconectado'}</h2>
               <p className="text-sm text-muted-foreground">{isOnline ? 'Recibiendo pedidos de fiesta...' : 'Pulsa para empezar turno'}</p>
             </div>
          </div>
          <Switch checked={isOnline} onCheckedChange={setIsOnline} />
        </div>

        {!activeOrder ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
             <div className="relative">
                <div className={`absolute inset-0 rounded-full animate-ping bg-primary/20 ${isOnline ? 'block' : 'hidden'}`} />
                <div className="relative h-24 w-24 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center">
                   <Bell className={`h-10 w-10 ${isOnline ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
                </div>
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">Sin pedidos activos</h3>
                <p className="text-muted-foreground">Mantén tu teléfono cerca. ¡La noche es joven!</p>
             </div>
             <Button variant="outline" onClick={simulateNewOrder}>Simular Pedido Entrante</Button>
          </div>
        ) : (
          <Card className="border-primary neon-glow-primary animate-in zoom-in-95 duration-300">
             <CardHeader className="bg-primary/10 border-b border-primary/20">
                <div className="flex justify-between items-center">
                   <CardTitle className="text-primary flex items-center gap-2">
                      <Zap className="h-5 w-5" /> PEDIDO ACTIVO
                   </CardTitle>
                   <Badge className="bg-primary">URGENTE</Badge>
                </div>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="space-y-4">
                         <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                               <MapPin className="h-4 w-4" />
                            </div>
                            <div>
                               <p className="text-xs text-muted-foreground uppercase font-bold">Recogida</p>
                               <p className="font-medium">{activeOrder.pickup}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                               <NavIcon className="h-4 w-4" />
                            </div>
                            <div>
                               <p className="text-xs text-muted-foreground uppercase font-bold">Entrega</p>
                               <p className="font-medium">{activeOrder.delivery}</p>
                            </div>
                         </div>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                         <p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Artículos</p>
                         <p className="text-sm">{activeOrder.items}</p>
                      </div>
                   </div>
                   <div className="h-64 rounded-2xl overflow-hidden border border-border/50 bg-background relative">
                      <img src="https://picsum.photos/seed/route/600/400" className="w-full h-full object-cover grayscale opacity-50" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <Button className="bg-secondary text-secondary-foreground gap-2">
                            <NavIcon className="h-4 w-4" /> Iniciar Navegación
                         </Button>
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
                   <Button onClick={() => completeStep('Pedido Recogido')} variant="secondary" className="flex-1">
                      Marcar como Recogido
                   </Button>
                   <Button onClick={() => completeStep('Entrega Confirmada')} variant="default" className="flex-1 bg-primary neon-glow-primary">
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar Entrega
                   </Button>
                </div>
             </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
