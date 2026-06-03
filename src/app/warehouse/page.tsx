
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/lib/store';
import { StaffNavigation } from '@/components/StaffNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Box, Package, ClipboardCheck, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const INITIAL_PACKING_ORDERS = [
  { 
    id: 'W-992', 
    customer: 'Alex Miller', 
    time: '4 mins',
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
    time: '2 mins',
    items: [
      { name: 'Corona Extra 12-Pack', packed: false },
      { name: 'Limones (Malla)', packed: false }
    ]
  }
];

export default function WarehousePage() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const [orders, setOrders] = useState(INITIAL_PACKING_ORDERS);

  useEffect(() => {
    if (isInitialized && (!isLoggedIn || (role !== 'warehouse' && role !== 'admin'))) {
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

  if (!isLoggedIn || (role !== 'warehouse' && role !== 'admin')) return null;

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
      toast({ title: "Checklist incompleta", variant: "destructive" });
      return;
    }
    toast({ title: `ORDEN ${orderId} LISTA` });
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <StaffNavigation />
      <main className="md:pl-16 transition-all duration-300 container mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-700 max-w-[1200px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black font-headline italic tracking-tighter flex items-center gap-3">
              <Box className="text-secondary h-8 w-8" /> 
              DESPACHO <span className="text-secondary neon-text-secondary">BODEGA</span>
            </h1>
            <p className="text-gray-400 font-medium text-xs mt-1">Precisión en cada cargamento.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="card-neon-border bg-card/40 overflow-hidden rounded-[1.5rem]">
              <CardHeader className="flex flex-row items-center justify-between p-6 bg-white/5">
                <div>
                   <CardTitle className="text-xl font-black italic tracking-tighter text-white">PEDIDO #{order.id}</CardTitle>
                   <p className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{order.customer} • {order.time}</p>
                </div>
                <Badge variant="outline" className="border-secondary text-secondary font-black bg-secondary/10 px-2 py-0 text-[10px]">PACKING</Badge>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-secondary tracking-widest flex items-center gap-2">
                       <ClipboardCheck className="h-4 w-4" /> CHECKLIST
                    </p>
                    <div className="space-y-2">
                       {order.items.map((item, idx) => (
                         <div 
                           key={idx} 
                           className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-300 ${item.packed ? 'bg-secondary/10 border-secondary/30 opacity-60' : 'bg-white/5 border-white/5'}`}
                         >
                           <Checkbox 
                              id={`${order.id}-${idx}`} 
                              checked={item.packed} 
                              onCheckedChange={() => toggleItem(order.id, item.name)}
                              className="h-5 w-5 border-secondary data-[state=checked]:bg-secondary"
                           />
                           <label 
                              htmlFor={`${order.id}-${idx}`} 
                              className={`text-sm font-bold cursor-pointer transition-all ${item.packed ? 'line-through text-gray-500' : 'text-gray-200'}`}
                           >
                             {item.name}
                           </label>
                         </div>
                       ))}
                    </div>
                 </div>

                 <Button 
                    className="w-full h-11 text-sm font-black italic tracking-widest bg-secondary text-black rounded-lg neon-glow-secondary" 
                    onClick={() => dispatchOrder(order.id)}
                 >
                    <Package className="mr-2 h-4 w-4" /> LISTO
                 </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
