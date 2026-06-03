
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/lib/store';
import { StaffNavigation } from '@/components/StaffNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Loader2, 
  Package, 
  History, 
  Settings, 
  Eye, 
  Plus,
  Truck,
  Box,
  Flame
} from 'lucide-react';
import Link from 'next/link';

const MOCK_STATS = [
  { name: '10pm', orders: 45 },
  { name: '11pm', orders: 62 },
  { name: '12am', orders: 85 },
  { name: '1am', orders: 55 },
  { name: '2am', orders: 30 },
];

const MOCK_INVENTORY = [
  { id: '1', name: 'Johnnie Walker Black', stock: 12, category: 'Whisky', price: '$45' },
  { id: '2', name: 'Don Julio 70', stock: 5, category: 'Tequila', price: '$85' },
  { id: '3', name: 'Grey Goose 750ml', stock: 2, category: 'Vodka', price: '$55' },
  { id: '4', name: 'Heineken 6-Pack', stock: 45, category: 'Cerveza', price: '$12' },
  { id: '5', name: 'Hielo (Bolsa 5kg)', stock: 0, category: 'Complementos', price: '$5' },
];

const MOCK_HISTORY = [
  { id: 'ORD-882', user: 'Carlos M.', total: '$120.00', date: 'Hoy, 01:22 AM', status: 'Completado' },
  { id: 'ORD-881', user: 'Ana R.', total: '$35.50', date: 'Hoy, 01:15 AM', status: 'Entregado' },
  { id: 'ORD-880', user: 'Juan P.', total: '$85.00', date: 'Ayer, 11:45 PM', status: 'Completado' },
];

export default function AdminPage() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (isInitialized && (!isLoggedIn || role !== 'admin')) {
      router.push('/login');
    }
  }, [isLoggedIn, role, router, isInitialized]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn || role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <StaffNavigation />
      
      <main className="container mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
        {/* Header Central de Comando */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div>
            <h1 className="text-5xl font-black font-headline italic tracking-tighter flex items-center gap-4">
              <LayoutDashboard className="text-primary h-12 w-12 drop-shadow-[0_0_15px_rgba(255,0,122,0.8)]" /> 
              COMANDO <span className="text-primary neon-text-primary">CENTRAL</span>
            </h1>
            <p className="text-gray-400 font-medium mt-2">Gestión integral de la infraestructura PartyFlow.</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Link href="/driver">
              <Button variant="outline" className="border-secondary/40 text-secondary hover:bg-secondary/10 font-black italic">
                <Truck className="mr-2 h-4 w-4" /> VISTA DRIVER
              </Button>
            </Link>
            <Link href="/warehouse">
              <Button variant="outline" className="border-secondary/40 text-secondary hover:bg-secondary/10 font-black italic">
                <Box className="mr-2 h-4 w-4" /> VISTA ALMACÉN
              </Button>
            </Link>
            <Button className="bg-primary hover:bg-primary/90 neon-glow-primary font-black italic px-8">
              <Plus className="mr-2 h-4 w-4 fill-white" /> NUEVO PRODUCTO
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full space-y-8" onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 p-1 h-16 rounded-full w-fit mx-auto lg:mx-0">
            <TabsTrigger value="dashboard" className="rounded-full px-8 font-black italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              DASHBOARD
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-full px-8 font-black italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              INVENTARIO
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-full px-8 font-black italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              HISTORIAL
            </TabsTrigger>
            <TabsTrigger value="catalog" className="rounded-full px-8 font-black italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              CATÁLOGO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[
                 { title: 'Pedidos Activos', value: '24', icon: ShoppingCart, color: 'text-secondary', bg: 'bg-secondary/10' },
                 { title: 'Ventas de Hoy', value: '$2,450', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
                 { title: 'Alertas Stock', value: '3 Items', icon: AlertTriangle, color: 'text-accent', bg: 'bg-accent/10' },
                 { title: 'Drivers Online', value: '8', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' }
               ].map((stat, i) => (
                 <Card key={i} className="bg-card/40 border-white/10 glass-morphism overflow-hidden group hover:border-primary/50 transition-all duration-300">
                   <CardContent className="p-8 flex items-center gap-6">
                     <div className={`h-16 w-16 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                       <stat.icon className="h-8 w-8" />
                     </div>
                     <div>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.title}</p>
                       <h4 className="text-3xl font-black italic">{stat.value}</h4>
                     </div>
                   </CardContent>
                 </Card>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
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

              <Card className="bg-card/40 border-white/10 glass-morphism">
                <CardHeader>
                   <CardTitle className="text-2xl font-black italic flex items-center gap-3">
                     PRIORIDAD <Badge variant="outline" className="border-accent text-accent animate-pulse">ALERTA</Badge>
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   {MOCK_INVENTORY.filter(i => i.stock < 10).map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/40 transition-all">
                        <div>
                          <p className="font-bold text-lg">{item.name}</p>
                          <p className={`text-xs font-black uppercase ${item.stock === 0 ? 'text-destructive' : 'text-accent'}`}>
                            {item.stock === 0 ? 'SIN STOCK' : `${item.stock} UNIDADES`}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="border-accent/50 text-accent hover:bg-accent/10">PEDIR</Button>
                     </div>
                   ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="animate-in fade-in slide-in-from-bottom-4">
             <Card className="bg-card/40 border-white/10 glass-morphism overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                   <div>
                      <CardTitle className="text-3xl font-black italic">CONTROL DE EXISTENCIAS</CardTitle>
                      <CardDescription className="text-gray-400">Monitoreo y reposición de bodega.</CardDescription>
                   </div>
                   <Button className="bg-secondary text-black font-black italic rounded-xl px-6">DESCARGAR REPORTE</Button>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-gray-400 font-black uppercase tracking-widest p-6">Producto</TableHead>
                          <TableHead className="text-gray-400 font-black uppercase tracking-widest p-6">Categoría</TableHead>
                          <TableHead className="text-gray-400 font-black uppercase tracking-widest p-6">Precio</TableHead>
                          <TableHead className="text-gray-400 font-black uppercase tracking-widest p-6">Stock</TableHead>
                          <TableHead className="text-right p-6">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {MOCK_INVENTORY.map((item) => (
                          <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="p-6 font-bold text-lg">{item.name}</TableCell>
                            <TableCell className="p-6 font-medium text-gray-400">{item.category}</TableCell>
                            <TableCell className="p-6 font-black text-secondary">{item.price}</TableCell>
                            <TableCell className="p-6">
                               <Badge className={`${item.stock < 10 ? 'bg-accent/20 text-accent border-accent/20' : 'bg-green-500/20 text-green-400 border-green-500/20'} font-black rounded-lg px-4`}>
                                 {item.stock} UNID.
                               </Badge>
                            </TableCell>
                            <TableCell className="p-6 text-right">
                               <Button size="sm" variant="ghost" className="hover:bg-primary/10 text-primary">EDITAR</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4">
             <Card className="bg-card/40 border-white/10 glass-morphism overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5">
                   <CardTitle className="text-3xl font-black italic flex items-center gap-3">
                     <History className="h-8 w-8 text-primary" /> HISTORIAL DE RUMBA
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-gray-400 font-black uppercase p-6">Pedido ID</TableHead>
                          <TableHead className="text-gray-400 font-black uppercase p-6">Cliente</TableHead>
                          <TableHead className="text-gray-400 font-black uppercase p-6">Total</TableHead>
                          <TableHead className="text-gray-400 font-black uppercase p-6">Fecha</TableHead>
                          <TableHead className="text-gray-400 font-black uppercase p-6">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {MOCK_HISTORY.map((order) => (
                          <TableRow key={order.id} className="border-white/5 hover:bg-white/5">
                            <TableCell className="p-6 font-black text-primary italic">{order.id}</TableCell>
                            <TableCell className="p-6 font-bold">{order.user}</TableCell>
                            <TableCell className="p-6 font-black text-secondary">{order.total}</TableCell>
                            <TableCell className="p-6 text-gray-400">{order.date}</TableCell>
                            <TableCell className="p-6">
                               <Badge className="bg-white/10 text-white font-black rounded-lg px-4">{order.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="catalog" className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
             <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black italic tracking-tight">GESTIÓN DEL CATÁLOGO</h2>
                <div className="flex gap-4">
                   <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-2 font-black">8 PRODUCTOS ACTIVOS</Badge>
                   <Badge className="bg-secondary/20 text-secondary border-secondary/20 px-4 py-2 font-black">2 COMBOS VIP</Badge>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {MOCK_INVENTORY.map((item, idx) => (
                   <Card key={idx} className="bg-white/5 border-white/10 overflow-hidden group hover:border-primary/50 transition-all">
                      <div className="h-40 relative bg-black flex items-center justify-center overflow-hidden">
                         <img src={`https://picsum.photos/seed/catalog-${idx}/300/200`} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform grayscale group-hover:grayscale-0" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                         <Badge className="absolute top-4 right-4 bg-black/60 border-white/10">{item.category}</Badge>
                      </div>
                      <CardContent className="p-6 space-y-4">
                         <div className="flex justify-between items-start">
                            <h3 className="font-black italic text-lg">{item.name}</h3>
                            <span className="text-secondary font-black">{item.price}</span>
                         </div>
                         <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 border-white/10 hover:bg-white/10 h-10 font-bold">OCULTAR</Button>
                            <Button size="sm" variant="outline" className="flex-1 border-primary/40 text-primary hover:bg-primary/10 h-10 font-bold">EDITAR</Button>
                         </div>
                      </CardContent>
                   </Card>
                ))}
                <Card className="bg-white/5 border-dashed border-2 border-white/10 flex flex-col items-center justify-center p-8 space-y-4 cursor-pointer hover:border-primary/40 transition-all group">
                   <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                      <Plus className="h-8 w-8 text-gray-500 group-hover:text-primary" />
                   </div>
                   <p className="font-black italic text-gray-500 group-hover:text-primary">AÑADIR NUEVO ÍTEM</p>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
