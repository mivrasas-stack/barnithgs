"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, ShoppingCart, Users, AlertTriangle, TrendingUp } from 'lucide-react';

const MOCK_ORDERS = [
  { id: 'ORD001', customer: 'Juan Perez', items: 'Vodka + Mezcladores', status: 'Pendiente', total: '$54.00' },
  { id: 'ORD002', customer: 'Maria Gomez', items: 'Caja de Cerveza', status: 'En Camino', total: '$32.50' },
  { id: 'ORD003', customer: 'Carlos Ruiz', items: 'Selección de Vinos', status: 'Completado', total: '$120.00' },
];

const MOCK_STATS = [
  { name: '10pm', orders: 45 },
  { name: '11pm', orders: 62 },
  { name: '12am', orders: 85 },
  { name: '1am', orders: 55 },
  { name: '2am', orders: 30 },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <LayoutDashboard className="text-primary" /> Centro de Comando Admin
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-accent text-accent">Tarifa Nocturna: Activa</Button>
            <Button size="sm" className="bg-primary">Promo Flash</Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <Card className="bg-card border-border/50">
             <CardContent className="p-6 flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <ShoppingCart className="h-6 w-6" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Pedidos Activos</p>
                 <h4 className="text-2xl font-bold">24</h4>
               </div>
             </CardContent>
           </Card>
           <Card className="bg-card border-border/50">
             <CardContent className="p-6 flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                 <TrendingUp className="h-6 w-6" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Crecimiento x Hora</p>
                 <h4 className="text-2xl font-bold">+12%</h4>
               </div>
             </CardContent>
           </Card>
           <Card className="bg-card border-accent/20">
             <CardContent className="p-6 flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                 <AlertTriangle className="h-6 w-6" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Alertas de Stock</p>
                 <h4 className="text-2xl font-bold text-accent">3 Items</h4>
               </div>
             </CardContent>
           </Card>
           <Card className="bg-card border-border/50">
             <CardContent className="p-6 flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                 <Users className="h-6 w-6" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Drivers Online</p>
                 <h4 className="text-2xl font-bold">8</h4>
               </div>
             </CardContent>
           </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <Card className="lg:col-span-2 bg-card border-border/50">
             <CardHeader>
               <CardTitle className="text-lg">Tráfico de Pedidos (Últimas 5h)</CardTitle>
             </CardHeader>
             <CardContent className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={MOCK_STATS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3f" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: '#1A1C29', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#FF007A' }}
                    />
                    <Bar dataKey="orders" fill="#FF007A" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="bg-card border-border/50">
            <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 Vigilancia de Inventario <Badge variant="outline" className="border-accent text-accent">Crítico</Badge>
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {[
                 { name: 'Grey Goose 750ml', stock: '2 restantes', trend: 'down' },
                 { name: 'Heineken 6-Pack', stock: '5 restantes', trend: 'down' },
                 { name: 'Hielo (Bolsa Grande)', stock: 'Sin Stock', trend: 'none' }
               ].map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-accent font-bold uppercase">{item.stock}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs">Reponer</Button>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle>Pedidos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>ID Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ORDERS.map((order) => (
                  <TableRow key={order.id} className="border-border/50">
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell>
                      <Badge className={
                        order.status === 'Pendiente' ? 'bg-accent text-accent-foreground' : 
                        order.status === 'En Camino' ? 'bg-secondary text-secondary-foreground' : 'bg-green-500'
                      }>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.total}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Ver Detalles</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
