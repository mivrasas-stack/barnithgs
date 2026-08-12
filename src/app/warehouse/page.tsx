"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/lib/store';
import { StaffNavigation } from '@/components/StaffNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackageSearch, CheckCircle2, ChevronRight, Loader2, Package, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type OrderItem = { id: string; name: string; qty: number; packed: boolean };
type WarehouseOrder = {
  id: string;
  customer: string;
  items: OrderItem[];
  status: 'pending' | 'packed' | 'dispatched';
  time: string;
};

const MOCK_ORDERS: WarehouseOrder[] = [
  {
    id: 'ORD-8821', customer: 'VIP Table 4', time: '12:45 AM', status: 'pending',
    items: [
      { id: 'i1', name: 'Tequila Don Julio 70', qty: 1, packed: false },
      { id: 'i2', name: 'Limes & Salt Kit', qty: 1, packed: false },
      { id: 'i3', name: 'Sparkling Water', qty: 4, packed: false }
    ]
  },
  {
    id: 'ORD-8822', customer: 'Delivery - John D.', time: '01:10 AM', status: 'pending',
    items: [
      { id: 'i4', name: 'Combo Pre-Copeo', qty: 1, packed: false },
      { id: 'i5', name: 'Ice Bag', qty: 2, packed: false }
    ]
  }
];

export default function WarehousePage() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);

  useEffect(() => {
    if (isInitialized && (!isLoggedIn || (role !== 'warehouse' && role !== 'admin'))) {
      router.push('/login');
    } else {
      setOrders(MOCK_ORDERS);
    }
  }, [isLoggedIn, role, router, isInitialized]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white/50 animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn || (role !== 'warehouse' && role !== 'admin')) return null;

  const toggleItem = (orderId: string, itemId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const newItems = order.items.map(item => item.id === itemId ? { ...item, packed: !item.packed } : item);
      return { ...order, items: newItems };
    }));
  };

  const dispatchOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    toast({ title: "Pedido Despachado", description: "El repartidor ha sido notificado." });
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <StaffNavigation />
      <main className="md:pl-16 container mx-auto px-4 py-8 md:py-12 max-w-[1000px] space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white flex items-center gap-3">
              Centro de Empaque
            </h1>
            <p className="text-sm font-medium text-white/50">Gestiona inventario y prepara pedidos</p>
          </div>
          <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1 text-sm font-medium border-0">
            {orders.length} Pedidos Activos
          </Badge>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <PackageSearch className="h-16 w-16 text-white/20 mb-4" />
            <h3 className="text-xl font-semibold text-white/80">Todo al Día</h3>
            <p className="text-sm text-white/50 mt-1">No hay pedidos pendientes en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map(order => {
              const totalItems = order.items.length;
              const packedItems = order.items.filter(i => i.packed).length;
              const isFullyPacked = packedItems === totalItems;
              const progress = (packedItems / totalItems) * 100;

              return (
                <Card key={order.id} className="apple-frost rounded-3xl border-0 overflow-hidden shadow-md">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-semibold tracking-tight text-white">{order.id}</h3>
                        <p className="text-sm font-medium text-white/50 mt-1">{order.customer}</p>
                      </div>
                      <Badge variant="outline" className="bg-white/5 border-white/10 text-white/70 flex items-center gap-1.5 font-medium">
                        <Clock className="h-3 w-3" /> {order.time}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-xs font-medium text-white/50 mb-2">
                        <span>Progreso de Empaque</span>
                        <span>{packedItems} / {totalItems}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-out ${isFullyPacked ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-2 mb-6">
                      {order.items.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => toggleItem(order.id, item.id)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                            item.packed 
                              ? 'bg-white/5 border-white/10 opacity-60' 
                              : 'bg-white/10 border-white/20 hover:bg-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition-colors ${
                              item.packed ? 'bg-green-500 border-green-500 text-white' : 'border-white/30'
                            }`}>
                              {item.packed && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </div>
                            <span className={`text-sm font-medium ${item.packed ? 'line-through text-white/50' : 'text-white'}`}>
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs font-semibold bg-black/30 px-2 py-1 rounded-md text-white/70">
                            x{item.qty}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className={`w-full h-12 rounded-xl font-medium transition-all ${
                        isFullyPacked 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-white/5 text-white/30 cursor-not-allowed'
                      }`}
                      disabled={!isFullyPacked}
                      onClick={() => dispatchOrder(order.id)}
                    >
                      {isFullyPacked ? 'Despachar Pedido' : 'Completar Empaque Primero'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
