"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Box, Package, ClipboardCheck, History, Clock, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const INITIAL_PACKING_ORDERS = [
  { 
    id: 'W-992', 
    customer: 'Alex Miller', 
    time: 'Hace 4 mins',
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
    time: 'Hace 2 mins',
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
      toast({ title: "¡Checklist incompleta!", description: "Por favor, empaqueta todos los artículos antes de despachar.", variant: "destructive" });
      return;
    }
    toast({ title: `¡PEDIDO ${orderId} LISTO!`, description: "Se ha notificado al repartidor para la recogida flash." });
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="container mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h1 className="text-5xl font-black font-headline italic tracking-tighter flex items-center gap-4">
              <Box className="text-secondary h-12 w-12 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]" /> 
              CONTROL DE <span className="text-secondary neon-text-secondary">DESPACHO</span>
            </h1>
            <p className="text-gray-400 font-medium mt-2">La precisión es la clave de una rumba exitosa.</p>
          </div>
          <div className="flex gap-4">
             <Button variant="outline" className="border-white/10 hover:bg-white/5 font-bold rounded-xl h-12 px-6"><History className="mr-2 h-4 w-4" /> HISTORIAL</Button>
             <Button className="bg-secondary text-black font-black italic rounded-xl h-12 px-6 neon-glow-secondary"><Clock className="mr-2 h-4 w-4" /> COLA: {orders.length + 10}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {orders.map((order) => (
            <Card key={order.id} className="card-neon-border bg-card/40 overflow-hidden rounded-[2.5rem]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 p-8 bg-white/5">
                <div>
                   <CardTitle className="text-3xl font-black italic tracking-tighter text-white">PEDIDO #{order.id}</CardTitle>
                   <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">{order.customer} • {order.time}</p>
                </div>
                <Badge variant="outline" className="border-secondary text-secondary font-black bg-secondary/10 px-4 py-1">EN PROGRESO</Badge>
              </CardHeader>
              <CardContent className="p-10 space-y-10">
                 <div className="space-y-6">
                    <p className="text-sm font-black text-secondary tracking-widest flex items-center gap-3">
                       <ClipboardCheck className="h-5 w-5" /> CHECKLIST DE EMPAQUE
                    </p>
                    <div className="space-y-4">
                       {order.items.map((item, idx) => (
                         <div 
                           key={idx} 
                           className={`flex items-center space-x-4 p-5 rounded-2xl border transition-all duration-300 ${item.packed ? 'bg-secondary/10 border-secondary/30 opacity-60' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                         >
                           <Checkbox 
                              id={`${order.id}-${idx}`} 
                              checked={item.packed} 
                              onCheckedChange={() => toggleItem(order.id, item.name)}
                              className="h-6 w-6 border-secondary data-[state=checked]:bg-secondary data-[state=checked]:text-black"
                           />
                           <label 
                              htmlFor={`${order.id}-${idx}`} 
                              className={`text-lg font-bold cursor-pointer transition-all ${item.packed ? 'line-through text-gray-500' : 'text-gray-200'}`}
                           >
                             {item.name}
                           </label>
                         </div>
                       ))}
                    </div>
                 </div>

                 <Button 
                    className="w-full h-16 text-xl font-black italic tracking-widest bg-secondary text-black rounded-2xl neon-glow-secondary hover:scale-[1.02] transition-all" 
                    onClick={() => dispatchOrder(order.id)}
                 >
                    <Package className="mr-3 h-6 w-6" /> LISTO PARA RECOGIDA
                 </Button>
              </CardContent>
            </Card>
          ))}
          
          {orders.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in">
               <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center text-gray-600 border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                  <Zap className="h-12 w-12" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-4xl font-black italic tracking-tighter">BODEGA DESPEJADA</h3>
                  <p className="text-xl text-gray-500 font-medium max-w-lg mx-auto">Todos los pedidos han sido despachados. Aprovecha para reponer stock antes de la siguiente ola.</p>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
