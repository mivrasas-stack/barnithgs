"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Box, Package, ClipboardCheck, History, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const INITIAL_PACKING_ORDERS = [
  { 
    id: 'W-992', 
    customer: 'Alex Miller', 
    time: 'hace 4 mins',
    items: [
      { name: 'Johnnie Walker Black Label 750ml', packed: false },
      { name: 'Bolsa de Hielo Premium 5kg', packed: false },
      { name: 'Coca-Cola 2L', packed: false },
      { name: 'Vasos Desechables (20pk)', packed: false }
    ]
  },
  { 
    id: 'W-993', 
    customer: 'Sarah Connor', 
    time: 'hace 2 mins',
    items: [
      { name: 'Corona Extra 12-Pack', packed: false },
      { name: 'Limones (Malla)', packed: false }
    ]
  }
];

export default function WarehousePage() {
  const [orders, setOrders] = useState(INITIAL_PACKING_ORDERS);

  const toggleItem = (orderId: string, itemName: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item => 
            item.name === itemName ? { ...item, packed: !item.packed } : item
          )
        };
      }
      return order;
    }));
  };

  const dispatchOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order?.items.some(i => !i.packed)) {
      toast({ title: "¡Checklist incompleta!", description: "Por favor, empaqueta todos los items antes de despachar.", variant: "destructive" });
      return;
    }
    toast({ title: `¡Pedido ${orderId} Listo!`, description: "Se ha notificado a un repartidor para la recogida." });
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
              <Box className="text-secondary" /> Despacho y Empaquetado
            </h1>
            <p className="text-muted-foreground">Asegura que cada fiesta sea perfecta. Revisa todos los artículos.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="gap-2"><History className="h-4 w-4" /> Recientes</Button>
             <Button variant="secondary" className="gap-2"><Clock className="h-4 w-4" /> Cola (12)</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {orders.map((order) => (
            <Card key={order.id} className="bg-card border-border/50">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                <div>
                   <CardTitle className="text-xl">#{order.id}</CardTitle>
                   <p className="text-xs text-muted-foreground">{order.customer} • {order.time}</p>
                </div>
                <Badge variant="outline" className="border-secondary text-secondary">En Progreso</Badge>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                 <div className="space-y-4">
                    <p className="text-sm font-bold flex items-center gap-2">
                       <ClipboardCheck className="h-4 w-4 text-secondary" /> CHECKLIST DE EMPAQUE
                    </p>
                    <div className="space-y-3">
                       {order.items.map((item, idx) => (
                         <div key={idx} className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${item.packed ? 'bg-secondary/5 border-secondary/20' : 'bg-background/50 border-border/30'}`}>
                           <Checkbox 
                              id={`${order.id}-${idx}`} 
                              checked={item.packed} 
                              onCheckedChange={() => toggleItem(order.id, item.name)}
                              className="border-secondary data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground"
                           />
                           <label 
                              htmlFor={`${order.id}-${idx}`} 
                              className={`text-sm font-medium leading-none cursor-pointer ${item.packed ? 'line-through text-muted-foreground' : ''}`}
                           >
                             {item.name}
                           </label>
                         </div>
                       ))}
                    </div>
                 </div>

                 <Button 
                    className="w-full bg-secondary text-secondary-foreground neon-glow-secondary" 
                    onClick={() => dispatchOrder(order.id)}
                 >
                    <Package className="mr-2 h-4 w-4" /> Listo para Recogida
                 </Button>
              </CardContent>
            </Card>
          ))}
          
          {orders.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
               <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Box className="h-10 w-10" />
               </div>
               <div>
                  <h3 className="text-xl font-bold">Cola Vacía</h3>
                  <p className="text-muted-foreground">Todos los pedidos han sido empaquetados y despachados. ¡Buen trabajo!</p>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
