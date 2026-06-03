"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserRole } from '@/lib/store';
import { StaffNavigation } from '@/components/StaffNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Cell,
  Tooltip as ChartTooltip
} from 'recharts';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Loader2, 
  Plus,
  Truck,
  Box,
  Edit3,
  Trash2,
  ShieldCheck,
  UserPlus,
  CreditCard,
  History,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  FileText
} from 'lucide-react';
import Link from 'next/link';

const MOCK_STATS = [
  { name: '18:00', orders: 15, revenue: 1200000 },
  { name: '20:00', orders: 32, revenue: 2800000 },
  { name: '22:00', orders: 85, revenue: 7400000 },
  { name: '00:00', orders: 124, revenue: 11200000 },
  { name: '02:00', orders: 65, revenue: 5800000 },
];

const INITIAL_INVENTORY = [
  { id: '1', name: 'Johnnie Walker Black', stock: 12, category: 'Whisky', price: 185000, minStock: 5 },
  { id: '2', name: 'Don Julio 70', stock: 5, category: 'Tequila', price: 420000, minStock: 4 },
  { id: '3', name: 'Grey Goose 750ml', stock: 2, category: 'Vodka', price: 210000, minStock: 6 },
  { id: '4', name: 'Heineken 6-Pack', stock: 45, category: 'Cerveza', price: 32000, minStock: 20 },
  { id: '5', name: 'Hielo (Bolsa 5kg)', stock: 0, category: 'Complementos', price: 15000, minStock: 10 },
];

const MOCK_STAFF = [
  { id: 'S1', name: 'Carlos Mendoza', role: 'admin', status: 'Online', lastActive: 'Ahora', cedula: '1020304050' },
  { id: 'S2', name: 'Ana Rodríguez', role: 'driver', status: 'En Entrega', lastActive: '5 min', cedula: '1098765432' },
  { id: 'S3', name: 'Juan Pérez', role: 'warehouse', status: 'Online', lastActive: '12 min', cedula: '1033445566' },
  { id: 'S4', name: 'Luis Martínez', role: 'driver', status: 'Offline', lastActive: '2h', cedula: '1077889900' },
];

function AdminContent() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [inventory] = useState(INITIAL_INVENTORY);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "ACTUALIZACIÓN EXITOSA",
      description: "Los datos contables y de stock han sido sincronizados.",
    });
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
      <StaffNavigation />
      
      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* HEADER DE COMANDO */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-card/40 p-8 rounded-[2.5rem] border border-white/10 glass-morphism">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center neon-glow-primary">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                ADMIN <span className="text-primary neon-text-primary">MASTER</span>
              </h1>
            </div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pl-1">Auditoría y Control de Capital PartyFlow</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 neon-glow-primary font-black italic px-8 h-14 rounded-2xl">
                  <Plus className="mr-2 h-5 w-5 fill-white" /> INGRESAR MERCANCÍA
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card/95 border-white/10 glass-morphism text-white max-w-2xl rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black italic text-primary">ENTRADA DE ALMACÉN</DialogTitle>
                  <CardDescription className="text-gray-400 uppercase font-black text-[10px] tracking-widest">Registra ingresos para control de inventario</CardDescription>
                </DialogHeader>
                <form className="space-y-6 pt-6" onSubmit={handleSaveProduct}>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Nombre del Ítem</Label>
                      <Input placeholder="Ej. Ron Viejo de Caldas 1L" className="bg-white/5 border-white/10 h-14 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Categoría Contable</Label>
                      <Select>
                        <SelectTrigger className="bg-white/5 border-white/10 h-14">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                          <SelectItem value="whisky">Whisky</SelectItem>
                          <SelectItem value="ron">Ron</SelectItem>
                          <SelectItem value="cerveza">Cerveza</SelectItem>
                          <SelectItem value="combos">Combos VIP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Costo de Adquisición (COP)</Label>
                      <Input type="number" placeholder="0" className="bg-white/5 border-white/10 h-14 font-black text-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Precio de Venta (COP)</Label>
                      <Input type="number" placeholder="0" className="bg-white/5 border-white/10 h-14 font-black text-primary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Unidades que Ingresan</Label>
                      <Input type="number" placeholder="0" className="bg-white/5 border-white/10 h-14 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Stock Mínimo Alerta</Label>
                      <Input type="number" placeholder="5" className="bg-white/5 border-white/10 h-14 font-bold" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-16 bg-primary font-black italic text-xl neon-glow-primary rounded-2xl mt-4">
                    CONFIRMAR INGRESO A BODEGA
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="border-secondary/40 text-secondary hover:bg-secondary/10 h-14 px-8 font-black italic rounded-2xl">
              <FileText className="mr-2 h-5 w-5" /> REPORTE DIARIO
            </Button>
          </div>
        </div>

        {/* TABS DE GESTIÓN */}
        <div className="space-y-12">
          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              {/* KPIs FINANCIEROS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { title: 'Ventas del Turno', value: formatCurrency(12450000), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10', trend: '+12%', up: true },
                  { title: 'Pedidos Activos', value: '24', icon: ShoppingCart, color: 'text-secondary', bg: 'bg-secondary/10', trend: 'Alta', up: true },
                  { title: 'Ticket Promedio', value: formatCurrency(145000), icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', trend: '-2%', up: false },
                  { title: 'Personal Activo', value: '8', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', trend: 'Óptimo', up: true }
                ].map((stat, i) => (
                  <Card key={i} className="bg-card/40 border-white/10 glass-morphism overflow-hidden group hover:border-primary/50 transition-all duration-300">
                    <CardContent className="p-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                          <stat.icon className="h-7 w-7" />
                        </div>
                        <Badge className={`${stat.up ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} font-black border-none`}>
                          {stat.up ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                          {stat.trend}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{stat.title}</p>
                        <h4 className="text-3xl font-black italic">{stat.value}</h4>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* GRÁFICOS Y ALERTAS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 bg-card/40 border-white/10 glass-morphism p-8 rounded-[2.5rem]">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                        <h3 className="text-2xl font-black italic tracking-tight">FLUJO DE RUMBA Y CAPITAL</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Monitoreo de ingresos por hora</p>
                      </div>
                      <Select defaultValue="revenue">
                        <SelectTrigger className="w-40 bg-white/5 border-white/10 h-10 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                          <SelectItem value="revenue">Ingresos (COP)</SelectItem>
                          <SelectItem value="orders">Pedidos</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="h-[350px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={MOCK_STATS}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} fontWeight="bold" axisLine={false} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} fontWeight="bold" axisLine={false} tickLine={false} />
                          <ChartTooltip 
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                            itemStyle={{ color: '#FF007A', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                            {MOCK_STATS.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 3 ? '#FF007A' : '#00FFFF'} fillOpacity={0.8} />
                            ))}
                          </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </Card>

                <div className="space-y-8">
                  <Card className="bg-card/40 border-white/10 glass-morphism p-8 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-8">
                      <AlertTriangle className="text-accent h-6 w-6 animate-pulse" />
                      <h3 className="text-xl font-black italic">ESTADO DE CAJA</h3>
                    </div>
                    <div className="space-y-6">
                       <div className="flex justify-between items-end border-b border-white/5 pb-4">
                          <span className="text-xs font-bold text-gray-400 uppercase">Efectivo en Caja</span>
                          <span className="text-xl font-black">{formatCurrency(1250000)}</span>
                       </div>
                       <div className="flex justify-between items-end border-b border-white/5 pb-4">
                          <span className="text-xs font-bold text-gray-400 uppercase">Ventas Digitales</span>
                          <span className="text-xl font-black text-secondary">{formatCurrency(11200000)}</span>
                       </div>
                       <Button className="w-full bg-secondary text-black font-black italic rounded-xl h-12 hover:scale-[1.02] transition-transform">
                          REALIZAR CIERRE DE CAJA
                       </Button>
                    </div>
                  </Card>

                  <Card className="bg-card/40 border-white/10 glass-morphism p-8 rounded-[2.5rem]">
                    <h3 className="text-xl font-black italic mb-6">ALERTAS DE STOCK</h3>
                    <div className="space-y-4">
                       {inventory.filter(i => i.stock < i.minStock).map((item, idx) => (
                         <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div>
                               <p className="font-bold text-sm">{item.name}</p>
                               <Badge className="bg-accent/20 text-accent font-black text-[9px] mt-1 border-none">STOCK CRÍTICO: {item.stock}</Badge>
                            </div>
                            <Button size="sm" variant="ghost" className="text-secondary font-black hover:bg-secondary/10">PEDIR</Button>
                         </div>
                       ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <Card className="bg-card/40 border-white/10 glass-morphism overflow-hidden rounded-[2.5rem] animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="p-10 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="space-y-1">
                      <CardTitle className="text-3xl font-black italic tracking-tighter">CONTROL MAESTRO DE EXISTENCIAS</CardTitle>
                      <CardDescription className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Inventario valorizado y auditoría de stock</CardDescription>
                   </div>
                   <div className="flex gap-4 w-full md:w-auto">
                      <div className="relative flex-1 md:w-80">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                         <Input 
                            placeholder="Buscar producto..." 
                            className="bg-white/5 border-white/10 pl-12 h-12 font-bold rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                      </div>
                      <Button variant="outline" className="border-white/10 h-12 px-6 rounded-xl font-black italic">
                         <Filter className="mr-2 h-4 w-4" /> FILTRAR
                      </Button>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-gray-500 font-black uppercase tracking-widest p-8">Producto / SKU</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase tracking-widest p-8">Categoría</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase tracking-widest p-8">Precio Venta</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase tracking-widest p-8">Nivel de Stock</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase tracking-widest p-8">Estado</TableHead>
                          <TableHead className="text-right p-8">Acciones de Control</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item) => {
                          const isLow = item.stock < item.minStock;
                          const isOut = item.stock === 0;
                          return (
                            <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                              <TableCell className="p-8 font-black text-xl italic tracking-tight group-hover:text-primary transition-colors">{item.name}</TableCell>
                              <TableCell className="p-8">
                                <Badge variant="outline" className="border-white/10 text-gray-400 font-bold uppercase text-[9px] tracking-widest">{item.category}</Badge>
                              </TableCell>
                              <TableCell className="p-8 font-black text-secondary text-lg">{formatCurrency(item.price)}</TableCell>
                              <TableCell className="p-8">
                                 <div className="space-y-2">
                                    <div className="flex justify-between items-end mb-1">
                                       <span className="text-[10px] font-black text-gray-500 uppercase">{item.stock} / {item.minStock * 5}</span>
                                    </div>
                                    <div className="h-2 w-32 bg-white/5 rounded-full overflow-hidden">
                                       <div 
                                          className={`h-full rounded-full transition-all duration-1000 ${isOut ? 'bg-destructive' : isLow ? 'bg-accent' : 'bg-secondary'}`}
                                          style={{ width: `${Math.min((item.stock / (item.minStock * 5)) * 100, 100)}%` }}
                                       />
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell className="p-8">
                                 <Badge className={`${isOut ? 'bg-destructive/20 text-destructive' : isLow ? 'bg-accent/20 text-accent' : 'bg-green-500/20 text-green-400'} font-black px-4 rounded-lg border-none text-[10px] uppercase tracking-tighter`}>
                                   {isOut ? 'AGOTADO' : isLow ? 'CRÍTICO' : 'DISPONIBLE'}
                                 </Badge>
                              </TableCell>
                              <TableCell className="p-8 text-right space-x-3">
                                 <Dialog>
                                    <DialogTrigger asChild>
                                       <Button size="sm" variant="ghost" className="hover:bg-primary/10 text-primary font-black rounded-xl h-10 px-6 italic tracking-tighter">
                                          <Edit3 className="mr-2 h-4 w-4" /> AUDITAR
                                       </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card/95 border-white/10 text-white glass-morphism rounded-[3rem] p-12">
                                       <DialogHeader className="mb-8">
                                          <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
                                            <Edit3 className="h-8 w-8 text-primary" />
                                          </div>
                                          <DialogTitle className="text-4xl font-black italic tracking-tighter">EDITOR DE STOCK</DialogTitle>
                                          <CardDescription className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Producto: {item.name}</CardDescription>
                                       </DialogHeader>
                                       <div className="space-y-10">
                                          <div className="space-y-4">
                                             <Label className="uppercase text-[10px] font-black text-gray-500 tracking-[0.2em]">IDENTIFICACIÓN DEL PRODUCTO</Label>
                                             <Input defaultValue={item.name} className="bg-white/5 border-white/10 h-16 font-black text-2xl italic tracking-tighter rounded-2xl" />
                                          </div>
                                          <div className="grid grid-cols-2 gap-8">
                                             <div className="space-y-4">
                                                <Label className="uppercase text-[10px] font-black text-gray-500 tracking-[0.2em]">PRECIO DE VENTA (COP)</Label>
                                                <div className="relative">
                                                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-black text-xl">$</span>
                                                   <Input type="number" defaultValue={item.price} className="bg-white/5 border-white/10 h-16 pl-10 font-black text-2xl text-secondary rounded-2xl" />
                                                </div>
                                             </div>
                                             <div className="space-y-4">
                                                <Label className="uppercase text-[10px] font-black text-gray-500 tracking-[0.2em]">CANTIDAD EN BODEGA</Label>
                                                <Input type="number" defaultValue={item.stock} className="bg-white/5 border-white/10 h-16 font-black text-2xl rounded-2xl" />
                                             </div>
                                          </div>
                                          <div className="flex flex-col gap-4 pt-6">
                                             <Button className="w-full h-20 bg-primary font-black italic text-2xl rounded-[1.5rem] neon-glow-primary hover:scale-[1.02] transition-transform" onClick={() => toast({ title: "Cambios guardados." })}>
                                                CONFIRMAR CAMBIOS
                                             </Button>
                                             <p className="text-[10px] text-gray-600 text-center font-bold uppercase tracking-widest">Esta acción quedará registrada en el log de auditoría.</p>
                                          </div>
                                       </div>
                                    </DialogContent>
                                 </Dialog>
                                 <Button size="sm" variant="outline" className="border-white/10 text-white font-black hover:bg-white/10 rounded-xl h-10 px-6">HISTORIAL</Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-4xl font-black italic tracking-tighter flex items-center gap-3">
                      <Users className="text-secondary h-10 w-10" /> RUMBEROS STAFF
                   </h2>
                   <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 pl-1">Monitoreo de rendimiento y permisos de acceso</p>
                </div>
                <Dialog>
                   <DialogTrigger asChild>
                      <Button className="bg-secondary text-black font-black italic rounded-[1.2rem] h-14 px-10 neon-glow-secondary">
                         <UserPlus className="mr-3 h-6 w-6" /> REGISTRAR TALENTO
                      </Button>
                   </DialogTrigger>
                   <DialogContent className="bg-card/95 border-white/10 text-white glass-morphism rounded-[3rem] p-12">
                      <DialogHeader className="mb-8">
                         <DialogTitle className="text-4xl font-black italic tracking-tighter text-secondary">NUEVO MIEMBRO</DialogTitle>
                         <p className="text-gray-400 uppercase font-black text-[10px] tracking-widest mt-1">Configura credenciales y roles operativos</p>
                      </DialogHeader>
                      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); toast({ title: "Personal registrado." }); }}>
                         <div className="space-y-4">
                            <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest">Nombre Completo del Operativo</Label>
                            <Input placeholder="Ej. Carlos Mendoza" className="bg-white/5 border-white/10 h-16 font-bold rounded-2xl" />
                         </div>
                         <div className="space-y-4">
                            <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest">Número de Cédula (Identificación)</Label>
                            <div className="relative">
                               <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-secondary/40" />
                               <Input placeholder="Ej. 1020304050" className="bg-white/5 border-white/10 h-16 pl-14 font-black tracking-widest rounded-2xl text-xl" />
                            </div>
                            <p className="text-[9px] text-gray-600 font-bold uppercase italic mt-1 pl-1">Aviso: Los últimos 4 dígitos serán su PIN de acceso de seguridad.</p>
                         </div>
                         <div className="space-y-4">
                            <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest">Rol del Sistema (Nivel de Acceso)</Label>
                            <Select>
                               <SelectTrigger className="bg-white/5 border-white/10 h-16 rounded-2xl">
                                  <SelectValue placeholder="Definir Responsabilidades..." />
                               </SelectTrigger>
                               <SelectContent className="bg-black border-white/10 text-white">
                                  <SelectItem value="admin">Súper Administrador</SelectItem>
                                  <SelectItem value="driver">Logística / Repartidor</SelectItem>
                                  <SelectItem value="warehouse">Operario / Almacén</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         <Button type="submit" className="w-full h-20 bg-secondary text-black font-black italic text-2xl rounded-[1.5rem] neon-glow-secondary mt-4">
                            FINALIZAR REGISTRO DE STAFF
                         </Button>
                      </form>
                   </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {MOCK_STAFF.map((member) => (
                   <Card key={member.id} className="bg-card/40 border-white/10 glass-morphism p-10 rounded-[3rem] group hover:border-secondary/50 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-[60px] rounded-full" />
                      
                      <div className="flex items-center justify-between mb-10 relative z-10">
                         <div className="flex items-center gap-6">
                            <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/10 group-hover:neon-glow-secondary transition-all">
                               <ShieldCheck className={`h-12 w-12 ${member.role === 'admin' ? 'text-primary' : member.role === 'driver' ? 'text-secondary' : 'text-accent'}`} />
                            </div>
                            <div>
                               <h3 className="text-3xl font-black italic tracking-tighter">{member.name}</h3>
                               <div className="flex gap-3 items-center mt-2">
                                 <Badge className="bg-white/10 text-gray-400 font-black uppercase text-[10px] tracking-widest px-3 py-1 border-none">{member.role}</Badge>
                                 <span className="text-[10px] text-gray-600 font-bold tracking-widest">ID: {member.cedula}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <Badge className={`${member.status === 'Online' || member.status === 'En Entrega' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} font-black rounded-lg px-4 py-1 border-none text-[10px] mb-2`}>
                               {member.status.toUpperCase()}
                            </Badge>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ACTIVO: {member.lastActive}</p>
                         </div>
                      </div>
                      
                      <div className="flex gap-4 relative z-10">
                         <Button variant="outline" className="flex-1 h-16 text-lg font-black italic border-white/10 hover:bg-white/5 rounded-2xl tracking-tighter">BITÁCORA</Button>
                         <Dialog>
                            <DialogTrigger asChild>
                               <Button className="flex-1 bg-white/5 border border-white/10 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/40 h-16 font-black rounded-2xl tracking-tighter text-lg italic">
                                  <Edit3 className="mr-2 h-5 w-5" /> PERFIL
                               </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card/95 border-white/10 text-white glass-morphism rounded-[3rem] p-12">
                               <DialogHeader className="mb-8">
                                  <DialogTitle className="text-4xl font-black italic tracking-tighter">AUDITAR PERFIL: {member.name}</DialogTitle>
                               </DialogHeader>
                               <div className="space-y-8">
                                  <div className="space-y-4">
                                     <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest">Nombre Completo</Label>
                                     <Input defaultValue={member.name} className="bg-white/5 border-white/10 h-16 font-black text-2xl rounded-2xl" />
                                  </div>
                                  <div className="space-y-4">
                                     <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest">Cédula del Sistema</Label>
                                     <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-secondary/40" />
                                        <Input defaultValue={member.cedula} className="bg-white/5 border-white/10 h-16 pl-14 font-black tracking-widest text-2xl rounded-2xl" />
                                     </div>
                                  </div>
                                  <div className="space-y-4">
                                     <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest">Nivel de Privilegios</Label>
                                     <Select defaultValue={member.role}>
                                        <SelectTrigger className="bg-white/5 border-white/10 h-16 rounded-2xl font-bold">
                                           <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/10 text-white">
                                           <SelectItem value="admin">Súper Administrador</SelectItem>
                                           <SelectItem value="driver">Logística / Repartidor</SelectItem>
                                           <SelectItem value="warehouse">Operario / Almacén</SelectItem>
                                        </SelectContent>
                                     </Select>
                                  </div>
                                  <div className="grid grid-cols-2 gap-6 pt-6">
                                     <Button variant="destructive" className="h-20 font-black italic text-xl rounded-2xl flex items-center justify-center gap-2 group">
                                        <Trash2 className="h-6 w-6 group-hover:animate-bounce" /> SUSPENDER
                                     </Button>
                                     <Button className="h-20 bg-secondary text-black font-black italic text-xl rounded-2xl neon-glow-secondary hover:scale-[1.02] transition-transform" onClick={() => toast({ title: "Cambios sincronizados." })}>
                                        CONFIRMAR
                                     </Button>
                                  </div>
                               </div>
                            </DialogContent>
                         </Dialog>
                      </div>
                   </Card>
                ))}
             </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <div className="flex justify-between items-center">
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase">ESTRUCTURA DE TIENDA</h2>
                  <Button className="bg-primary text-white font-black italic px-8 h-14 rounded-2xl neon-glow-primary">
                    <Plus className="mr-2 h-5 w-5" /> NUEVO ARTÍCULO
                  </Button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                  {inventory.map((item, idx) => (
                     <Card key={idx} className="bg-white/5 border-white/10 overflow-hidden group hover:border-primary/50 transition-all rounded-[3rem] relative">
                        <div className="h-48 relative bg-black flex items-center justify-center overflow-hidden">
                           <img src={`https://picsum.photos/seed/catalog-${idx}/400/300`} className="w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 grayscale group-hover:grayscale-0" alt={item.name} />
                           <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                           <Badge className="absolute top-6 right-6 bg-black/60 border-white/10 font-black uppercase text-[9px] tracking-widest">{item.category}</Badge>
                        </div>
                        <CardContent className="p-10 space-y-8">
                           <div className="space-y-1">
                              <h3 className="font-black italic text-2xl leading-none tracking-tight">{item.name}</h3>
                              <span className="text-secondary font-black text-xl italic">{formatCurrency(item.price)}</span>
                           </div>
                           <div className="flex gap-4">
                              <Button size="lg" variant="outline" className="flex-1 border-white/10 hover:bg-white/5 h-14 font-black rounded-2xl tracking-tighter italic">OCULTAR</Button>
                              <Button size="lg" className="flex-1 bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 h-14 font-black rounded-2xl tracking-tighter italic">EDITAR</Button>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'history' && (
            <Card className="bg-card/40 border-white/10 glass-morphism overflow-hidden rounded-[2.5rem] animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="p-10 border-b border-white/5 flex flex-row items-center justify-between">
                   <div>
                      <CardTitle className="text-3xl font-black italic tracking-tighter">LOG DE OPERACIONES</CardTitle>
                      <CardDescription className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Historial completo de transacciones del turno</CardDescription>
                   </div>
                   <Button variant="outline" className="border-secondary text-secondary font-black italic rounded-xl px-8 h-12 hover:bg-secondary/10">
                     EXPORTAR PDF
                   </Button>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-gray-500 font-black uppercase p-8">Referencia ID</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Auditoría / Cliente</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Flujo de Caja</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Timestamp</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Validación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { id: 'TX-882001', user: 'Carlos M. (Cierre)', total: 450000, date: 'Hoy, 01:22 AM', status: 'Verificado', type: 'in' },
                          { id: 'ORD-881992', user: 'Ana R. (Entrega)', total: 125000, date: 'Hoy, 01:15 AM', status: 'Entregado', type: 'in' },
                          { id: 'ADJ-881990', user: 'Admin (Ajuste)', total: -45000, date: 'Ayer, 11:45 PM', status: 'Ajustado', type: 'out' },
                        ].map((order) => (
                          <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="p-8 font-black text-primary italic tracking-tighter">{order.id}</TableCell>
                            <TableCell className="p-8 font-bold text-gray-200">{order.user}</TableCell>
                            <TableCell className={`p-8 font-black text-xl italic ${order.type === 'in' ? 'text-secondary' : 'text-destructive'}`}>
                              {order.type === 'in' ? '+' : ''}{formatCurrency(order.total)}
                            </TableCell>
                            <TableCell className="p-8 text-gray-500 font-medium uppercase text-[10px] tracking-widest">{order.date}</TableCell>
                            <TableCell className="p-8">
                               <Badge className="bg-white/5 text-gray-400 font-black rounded-lg px-6 py-1 border border-white/10 uppercase text-[9px] tracking-widest">{order.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
