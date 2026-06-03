"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Cell } from 'recharts';
import { LayoutDashboard, ShoppingCart, Users, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

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
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="container mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black font-headline italic tracking-tighter flex items-center gap-4">
              <LayoutDashboard className="text-primary h-10 w-10 drop-shadow-[0_0_10px_rgba(255,0,122,0.8)]" /> 
              COMANDO <span className="text-primary neon-text-primary">CENTRAL</span>
            </h1>
            <p className="text-gray-400 font-medium mt-2">Monitoreo de rumba en tiempo real.</p>
          </div>
          <div className="flex gap-4">
            <Badge variant="outline" className="border-secondary text-secondary neon-glow-secondary bg-secondary/10 px-4 py-2 text-sm font-bold">
              TARIFA DINÁMICA: 2.5x
            </Badge>
            <Button size="lg" className="bg-primary hover:bg-primary/90 neon-glow-primary font-black italic">
              <Zap className="mr-2 h-4 w-4 fill-white" /> LANZAR PROMO FLASH
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           {[
             { title: 'Pedidos Activos', value: '24', icon: ShoppingCart, color: 'text-secondary', bg: 'bg-secondary/10' },
             { title: 'Crecimiento x Hora', value: '+12%', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
             { title: 'Alertas de Stock', value: '3 Items', icon: AlertTriangle, color: 'text-accent', bg: 'bg-accent/10' },
             { title: 'Drivers Online', value: '8', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' }
           ].map((stat, i) => (
             <Card key={i} className="bg-card/40 border-white/10 glass-morphism overflow-hidden group hover:border-primary/50 transition-all duration-300">
               <CardContent className="p-8 flex items-center gap-6">
                 <div className={`h-16 w-16 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                   <stat.icon className="h-8 w-8" />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
                   <h4 className="text-3xl font-black italic">{stat.value}</h4>
                 </div>
               </CardContent>
             </Card>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Chart Section */}
          <Card className="lg:col-span-2 bg-card/40 border-white/10 glass-morphism">
             <CardHeader>
               <CardTitle className="text-2xl font-black italic tracking-tight">TRÁFICO DE RUMBA (Últimas 5h)</CardTitle>
             </CardHeader>
             <CardContent className="h-[350px] pt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={MOCK_STATS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3f" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} fontWeight="bold" />
                    <YAxis stroke="#64748b" fontSize={12} fontWeight="bold" />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#FF007A', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                      {MOCK_STATS.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 2 ? '#FF007A' : '#00FFFF'} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="bg-card/40 border-white/10 glass-morphism">
            <CardHeader>
               <CardTitle className="text-2xl font-black italic flex items-center gap-3">
                 RADAR DE INVENTARIO <Badge variant="outline" className="border-accent text-accent animate-pulse">CRÍTICO</Badge>
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               {[
                 { name: 'Grey Goose 750ml', stock: '2 restantes', status: 'low' },
                 { name: 'Heineken 6-Pack', stock: '5 restantes', status: 'low' },
                 { name: 'Hielo (Bolsa Grande)', stock: 'SIN STOCK', status: 'out' }
               ].map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/40 transition-all">
                    <div>
                      <p className="font-bold text-lg">{item.name}</p>
                      <p className={`text-xs font-black uppercase ${item.status === 'out' ? 'text-destructive' : 'text-accent'}`}>{item.stock}</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-accent/50 text-accent hover:bg-accent/10">REPONER</Button>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="bg-card/40 border-white/10 glass-morphism overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-6">
            <CardTitle className="text-3xl font-black italic tracking-tighter">ÚLTIMOS PEDIDOS DE LA NOCHE</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-bold uppercase py-6">ID Pedido</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase">Cliente</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase">Items</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase">Estado</TableHead>
                  <TableHead className="text-gray-400 font-bold uppercase">Total</TableHead>
                  <TableHead className="text-right text-gray-400 font-bold uppercase">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ORDERS.map((order) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-black text-primary py-6">{order.id}</TableCell>
                    <TableCell className="font-bold">{order.customer}</TableCell>
                    <TableCell className="text-gray-300">{order.items}</TableCell>
                    <TableCell>
                      <Badge className={
                        order.status === 'Pendiente' ? 'bg-accent text-black font-black' : 
                        order.status === 'En Camino' ? 'bg-secondary text-black font-black' : 'bg-green-500 text-white font-black'
                      }>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black">{order.total}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="font-bold hover:text-primary">DETALLES</Button>
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
