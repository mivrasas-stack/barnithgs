
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
  BarChart as ChartIcon, 
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
  FileText,
  Activity,
  ClipboardList
} from 'lucide-react';

const MOCK_STATS = [
  { name: '18:00', orders: 15, revenue: 1200000 },
  { name: '20:00', orders: 32, revenue: 2800000 },
  { name: '22:00', orders: 85, revenue: 7400000 },
  { name: '00:00', orders: 124, revenue: 11200000 },
  { name: '02:00', orders: 65, revenue: 5800000 },
];

const CATEGORIAS_CONTABLES = [
  { id: 'aguardiente', label: 'Aguardiente (Nacional)', color: 'bg-blue-500/20 text-blue-400' },
  { id: 'ron', label: 'Ron', color: 'bg-orange-500/20 text-orange-400' },
  { id: 'whisky', label: 'Whisky (Importado)', color: 'bg-amber-500/20 text-amber-400' },
  { id: 'tequila', label: 'Tequila', color: 'bg-green-500/20 text-green-400' },
  { id: 'vodka', label: 'Vodka', color: 'bg-cyan-500/20 text-cyan-400' },
  { id: 'ginebra', label: 'Ginebra', color: 'bg-teal-500/20 text-teal-400' },
  { id: 'cerveza', label: 'Cerveza', color: 'bg-yellow-500/20 text-yellow-400' },
  { id: 'vino', label: 'Vino / Espumoso', color: 'bg-red-500/20 text-red-400' },
  { id: 'mezcladores', label: 'Mezcladores (Sodas/Jugos)', color: 'bg-purple-500/20 text-purple-400' },
  { id: 'energizantes', label: 'Energizantes', color: 'bg-pink-500/20 text-pink-400' },
  { id: 'complementos', label: 'Complementos (Hielo/Vasos)', color: 'bg-slate-500/20 text-slate-400' },
  { id: 'combos', label: 'Combos VIP', color: 'bg-primary/20 text-primary' },
];

const INITIAL_INVENTORY = [
  { id: '1', name: 'Johnnie Walker Black 750ml', stock: 12, category: 'whisky', price: 185000, cost: 130000, minStock: 5 },
  { id: '2', name: 'Aguardiente Antioqueño Sin Azúcar 750ml', stock: 24, category: 'aguardiente', price: 65000, cost: 42000, minStock: 10 },
  { id: '3', name: 'Don Julio 70', stock: 5, category: 'tequila', price: 420000, cost: 310000, minStock: 4 },
  { id: '4', name: 'Heineken 6-Pack (Lata)', stock: 45, category: 'cerveza', price: 32000, cost: 22000, minStock: 20 },
  { id: '5', name: 'Hielo (Bolsa 5kg)', stock: 0, category: 'complementos', price: 15000, cost: 5000, minStock: 10 },
  { id: '6', name: 'Red Bull 250ml', stock: 60, category: 'energizantes', price: 12000, cost: 7500, minStock: 24 },
  { id: '7', name: 'Ron Viejo de Caldas 8 Años 750ml', stock: 18, category: 'ron', price: 85000, cost: 58000, minStock: 8 },
];

const MOCK_STAFF = [
  { id: 'S1', name: 'Carlos Mendoza', role: 'admin', status: 'Online', lastActive: 'Ahora', cedula: '1020304050' },
  { id: 'S2', name: 'Ana Rodríguez', role: 'driver', status: 'En Entrega', lastActive: '5 min', cedula: '1098765432' },
  { id: 'S3', name: 'Juan Pérez', role: 'warehouse', status: 'Online', lastActive: '12 min', cedula: '1033445566' },
];

const INITIAL_AUDIT_LOGS = [
  { id: 'LOG-001', type: 'VENTA', item: 'Johnnie Walker Black', user: 'App Client', delta: -1, reason: 'Venta Directa', date: 'Hace 5 min' },
  { id: 'LOG-002', type: 'AJUSTE', item: 'Hielo (Bolsa 5kg)', user: 'Carlos Mendoza', delta: -10, reason: 'Merma (Derretido)', date: 'Hace 15 min' },
  { id: 'LOG-003', type: 'REPOSICIÓN', item: 'Heineken 6-Pack', user: 'Juan Pérez', delta: 50, reason: 'Entrada Proveedor', date: 'Hace 1h' },
  { id: 'LOG-004', type: 'AJUSTE', item: 'Grey Goose 750ml', user: 'Carlos Mendoza', delta: -1, reason: 'Botella Rota', date: 'Hace 2h' },
];

function AdminContent() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [inventory] = useState(INITIAL_INVENTORY);
  const [auditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
      title: "OPERACIÓN REGISTRADA",
      description: "El cambio ha sido auditado y guardado en la base de datos contable.",
    });
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalCapital = inventory.reduce((acc, item) => acc + (item.cost * item.stock), 0);
  const projectedRevenue = inventory.reduce((acc, item) => acc + (item.price * item.stock), 0);

  const getCategoryBadge = (catId: string) => {
    const cat = CATEGORIAS_CONTABLES.find(c => c.id === catId);
    return (
      <Badge className={`${cat?.color || 'bg-white/10 text-gray-400'} border-none font-black text-[9px] uppercase tracking-tighter`}>
        {cat?.label || 'Sin Categoría'}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
      <StaffNavigation />
      
      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* HEADER DE COMANDO */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-card/40 p-8 rounded-[2.5rem] border border-white/10 glass-morphism shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center neon-glow-primary">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                ADMIN <span className="text-primary neon-text-primary">CONTROL</span>
              </h1>
            </div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest pl-1">Auditoría Financiera y Logística PartyFlow</p>
          </div>
          
          <div className="hidden lg:block">
            <Badge variant="outline" className="border-primary/20 text-primary/60 font-black italic px-4 py-2">
               ESTADO DE RED: SEGURO
            </Badge>
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
                  { title: 'Capital en Stock', value: formatCurrency(totalCapital), icon: Box, color: 'text-secondary', bg: 'bg-secondary/10', trend: 'Auditado', up: true },
                  { title: 'Utilidad Proyectada', value: formatCurrency(projectedRevenue - totalCapital), icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', trend: 'Potencial', up: true },
                  { title: 'Pérdida por Merma', value: formatCurrency(185000), icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', trend: 'Turno Hoy', up: false }
                ].map((stat, i) => (
                  <Card key={i} className="bg-card/40 border-white/10 glass-morphism overflow-hidden group hover:border-primary/50 transition-all duration-300">
                    <CardContent className="p-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform shadow-lg`}>
                          <stat.icon className="h-7 w-7" />
                        </div>
                        <Badge className={`${stat.up ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} font-black border-none px-3`}>
                          {stat.up ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                          {stat.trend}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{stat.title}</p>
                        <h4 className="text-3xl font-black italic tracking-tighter">{stat.value}</h4>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* GRÁFICOS Y ALERTAS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <Card className="lg:col-span-2 bg-card/40 border-white/10 glass-morphism p-10 rounded-[3rem]">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                        <h3 className="text-3xl font-black italic tracking-tighter">TRÁFICO DE VENTAS (COP)</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Análisis por hora del turno actual</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-primary/20 text-primary border-none font-black italic">EN VIVO</Badge>
                      </div>
                   </div>
                   <div className="h-[350px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={MOCK_STATS}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} fontWeight="bold" axisLine={false} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} fontWeight="bold" axisLine={false} tickLine={false} />
                          <ChartTooltip 
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', color: '#fff' }}
                            itemStyle={{ color: '#FF007A', fontWeight: 'bold' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          />
                          <Bar dataKey="revenue" radius={[15, 15, 0, 0]}>
                            {MOCK_STATS.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 3 ? '#FF007A' : '#00FFFF'} fillOpacity={0.8} />
                            ))}
                          </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </Card>

                <div className="space-y-8">
                  <Card className="bg-card/40 border-white/10 glass-morphism p-8 rounded-[2.5rem] shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-10 w-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                        <ClipboardList className="text-secondary h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-black italic uppercase tracking-tighter">AJUSTES RECIENTES</h3>
                    </div>
                    <div className="space-y-4">
                       {auditLogs.slice(0, 4).map((log, idx) => (
                         <div key={idx} className="flex flex-col p-5 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                            <div className="flex justify-between items-start">
                              <Badge variant="outline" className={`${log.type === 'REPOSICIÓN' ? 'border-green-500/50 text-green-400' : 'border-primary/50 text-primary'} text-[8px] font-black h-5`}>{log.type}</Badge>
                              <span className="text-[9px] text-gray-500 font-bold uppercase">{log.date}</span>
                            </div>
                            <p className="font-bold text-sm mt-3 leading-tight">{log.item}</p>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                              <span className="text-xs text-gray-400 font-bold">Variación: <span className={log.delta > 0 ? 'text-green-400' : 'text-red-400'}>{log.delta > 0 ? '+' : ''}{log.delta} UND</span></span>
                              <span className="text-[8px] font-black uppercase text-gray-600">ID: {log.user.split(' ')[0]}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <Card className="bg-card/40 border-white/10 glass-morphism overflow-hidden rounded-[3rem] animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
                <CardHeader className="p-10 border-b border-white/5 flex flex-col xl:flex-row items-center justify-between gap-8">
                   <div className="space-y-2">
                      <div className="flex items-center gap-4">
                         <CardTitle className="text-4xl font-black italic tracking-tighter uppercase leading-none">CONTROL DE INVENTARIO</CardTitle>
                         <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-primary hover:bg-primary/90 neon-glow-primary font-black italic px-6 h-10 rounded-xl text-xs tracking-tight">
                                <Plus className="mr-1 h-4 w-4 fill-white" /> NUEVA ENTRADA
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card/95 border-white/10 glass-morphism text-white max-w-2xl rounded-[2.5rem] p-10">
                              <DialogHeader>
                                <DialogTitle className="text-3xl font-black italic text-primary uppercase tracking-tighter">REGISTRO DE MERCANCÍA</DialogTitle>
                                <CardDescription className="text-gray-400 uppercase font-black text-[10px] tracking-widest">Afecta el capital invertido y stock disponible</CardDescription>
                              </DialogHeader>
                              <form className="space-y-6 pt-6" onSubmit={handleSaveProduct}>
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2 col-span-2">
                                    <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Nombre Completo del Producto (SKU)</Label>
                                    <Input placeholder="Ej. Ron Viejo de Caldas 8 Años 750ml" className="bg-white/5 border-white/10 h-14 font-bold rounded-xl" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Categoría Contable</Label>
                                    <Select>
                                      <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-xl font-bold">
                                        <SelectValue placeholder="Seleccionar..." />
                                      </SelectTrigger>
                                      <SelectContent className="bg-black border-white/10 text-white">
                                        {CATEGORIAS_CONTABLES.map(cat => (
                                          <SelectItem key={cat.id} value={cat.id} className="font-bold">
                                            {cat.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Stock Inicial (Unidades)</Label>
                                    <Input type="number" placeholder="0" className="bg-white/5 border-white/10 h-14 font-black text-white rounded-xl" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Costo Unitario de Adquisición</Label>
                                    <div className="relative">
                                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                      <Input type="number" placeholder="0" className="bg-white/5 border-white/10 h-14 pl-12 font-black text-secondary rounded-xl" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Precio de Venta Sugerido</Label>
                                    <div className="relative">
                                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                      <Input type="number" placeholder="0" className="bg-white/5 border-white/10 h-14 pl-12 font-black text-primary rounded-xl" />
                                    </div>
                                  </div>
                                </div>
                                <Button type="submit" className="w-full h-16 bg-primary font-black italic text-xl neon-glow-primary rounded-2xl mt-4 uppercase tracking-widest">
                                  VINCULAR PRODUCTO A BODEGA
                                </Button>
                              </form>
                            </DialogContent>
                         </Dialog>
                      </div>
                      <CardDescription className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Gestión de capital en bodega y valoración de stock</CardDescription>
                   </div>
                   <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                      <div className="relative flex-1 xl:w-80">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                         <Input 
                            placeholder="Buscar SKU o nombre..." 
                            className="bg-white/5 border-white/10 pl-12 h-14 font-bold rounded-2xl focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                      </div>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl w-full xl:w-64 font-bold">
                          <Filter className="mr-2 h-4 w-4 text-gray-500" />
                          <SelectValue placeholder="Filtrar por Categoría" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                          <SelectItem value="all">Todas las Categorías</SelectItem>
                          {CATEGORIAS_CONTABLES.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">PRODUCTO / CATEGORÍA</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">CAPITAL (COSTO)</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">PRECIO VENTA</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">EXISTENCIAS</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">ESTADO CONTROL</TableHead>
                          <TableHead className="text-right p-10">ACCIONES</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item) => {
                          const isLow = item.stock < item.minStock;
                          const isOut = item.stock === 0;
                          return (
                            <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                              <TableCell className="p-10">
                                <div className="space-y-2">
                                  <p className="font-black text-2xl italic tracking-tighter group-hover:text-primary transition-colors">{item.name}</p>
                                  {getCategoryBadge(item.category)}
                                </div>
                              </TableCell>
                              <TableCell className="p-10 font-black text-gray-400 text-lg">{formatCurrency(item.cost * item.stock)}</TableCell>
                              <TableCell className="p-10 font-black text-secondary text-2xl italic tracking-tight">{formatCurrency(item.price)}</TableCell>
                              <TableCell className="p-10">
                                 <div className="flex flex-col">
                                   <span className={`text-4xl font-black italic ${isOut ? 'text-destructive' : isLow ? 'text-accent' : 'text-white'}`}>
                                     {item.stock}
                                   </span>
                                   <span className="text-[10px] uppercase font-bold text-gray-600">Unidades Disponibles</span>
                                 </div>
                              </TableCell>
                              <TableCell className="p-10">
                                 <Badge className={`${isOut ? 'bg-destructive/20 text-destructive' : isLow ? 'bg-accent/20 text-accent' : 'bg-green-500/20 text-green-400'} font-black px-6 py-2 rounded-xl border-none text-[10px] tracking-widest shadow-lg`}>
                                   {isOut ? 'STOCK CRÍTICO' : isLow ? 'BAJO STOCK' : 'NIVEL ÓPTIMO'}
                                 </Badge>
                              </TableCell>
                              <TableCell className="p-10 text-right">
                                 <Dialog>
                                    <DialogTrigger asChild>
                                       <Button size="lg" className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 font-black rounded-2xl h-14 px-8 italic tracking-tight">
                                          <Edit3 className="mr-3 h-5 w-5" /> AUDITAR
                                       </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card/95 border-white/10 text-white glass-morphism rounded-[3rem] p-12 shadow-[0_0_100px_rgba(255,0,122,0.2)]">
                                       <DialogHeader className="mb-10">
                                          <DialogTitle className="text-4xl font-black italic tracking-tighter uppercase text-primary">AJUSTE DE INVENTARIO</DialogTitle>
                                          <CardDescription className="text-gray-400 uppercase font-black text-[10px] tracking-[0.3em] mt-2">SKU: {item.name}</CardDescription>
                                       </DialogHeader>
                                       <form className="space-y-8" onSubmit={handleSaveProduct}>
                                          <div className="grid grid-cols-2 gap-8">
                                             <div className="space-y-4">
                                                <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest pl-1">Existencia Física Real</Label>
                                                <div className="relative">
                                                  <Box className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-600" />
                                                  <Input type="number" defaultValue={item.stock} className="bg-white/5 border-white/10 h-16 pl-14 font-black text-3xl rounded-2xl focus:border-primary" />
                                                </div>
                                             </div>
                                             <div className="space-y-4">
                                                <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest pl-1">Motivo Contable</Label>
                                                <Select required>
                                                   <SelectTrigger className="bg-white/5 border-white/10 h-16 rounded-2xl font-bold text-lg px-6 focus:ring-primary/40 focus:border-primary">
                                                      <SelectValue placeholder="Definir Acción..." />
                                                   </SelectTrigger>
                                                   <SelectContent className="bg-black border-white/10 text-white">
                                                      <SelectItem value="sale">Venta Directa Manual</SelectItem>
                                                      <SelectItem value="broken">Botella Rota (Merma)</SelectItem>
                                                      <SelectItem value="restock">Reposición de Proveedor</SelectItem>
                                                      <SelectItem value="adjustment">Ajuste de Conteo Físico</SelectItem>
                                                      <SelectItem value="lost">Pérdida no Justificada</SelectItem>
                                                   </SelectContent>
                                                </Select>
                                             </div>
                                          </div>
                                          <div className="space-y-4">
                                            <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest pl-1">Notas de la Operación</Label>
                                            <Input placeholder="Ej. Se encontró botella rota en estante superior..." className="bg-white/5 border-white/10 h-16 rounded-2xl font-medium px-6" />
                                          </div>
                                          <Button type="submit" className="w-full h-20 bg-primary font-black italic text-2xl rounded-[1.5rem] neon-glow-primary uppercase tracking-widest shadow-[0_10px_40px_rgba(255,0,122,0.3)] hover:scale-[1.02] transition-transform">
                                             CONFIRMAR MOVIMIENTO AUDITABLE
                                          </Button>
                                       </form>
                                    </DialogContent>
                                 </Dialog>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          )}

          {activeTab === 'history' && (
            <Card className="bg-card/40 border-white/10 glass-morphism overflow-hidden rounded-[3rem] animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
                <CardHeader className="p-10 border-b border-white/5 flex flex-row items-center justify-between">
                   <div className="space-y-1">
                      <CardTitle className="text-4xl font-black italic tracking-tighter uppercase leading-none">BITÁCORA DE CONTROL</CardTitle>
                      <CardDescription className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Registro inalterable de cada unidad de trago y peso invertido</CardDescription>
                   </div>
                   <Button variant="outline" className="border-secondary text-secondary font-black italic rounded-xl px-8 h-12 hover:bg-secondary/10 shadow-lg">
                     EXPORTAR LIBRO CONTABLE (PDF)
                   </Button>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">OP ID</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">ACCIÓN / TIPO</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">PRODUCTO AFECTADO</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">VARIACIÓN</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">OPERARIO / STAFF</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-10 tracking-widest text-[10px]">JUSTIFICACIÓN</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="p-10 font-black text-primary italic text-lg">{log.id}</TableCell>
                            <TableCell className="p-10 font-black">
                               <Badge className={`${log.type === 'VENTA' ? 'bg-secondary/20 text-secondary' : log.type === 'AJUSTE' ? 'bg-destructive/20 text-destructive' : 'bg-green-500/20 text-green-400'} border-none font-black px-4 py-1 text-[9px] tracking-widest`}>
                                 {log.type}
                               </Badge>
                            </TableCell>
                            <TableCell className="p-10 font-bold text-gray-200 text-lg tracking-tight">{log.item}</TableCell>
                            <TableCell className={`p-10 font-black text-3xl italic tracking-tighter ${log.delta > 0 ? 'text-secondary' : 'text-destructive'}`}>
                              {log.delta > 0 ? '+' : ''}{log.delta} <span className="text-[10px] uppercase text-gray-600 not-italic">Und</span>
                            </TableCell>
                            <TableCell className="p-10 text-gray-400 font-bold uppercase text-[10px] tracking-widest">{log.user}</TableCell>
                            <TableCell className="p-10">
                               <div className="flex items-center gap-2">
                                 <FileText className="h-4 w-4 text-gray-700" />
                                 <span className="text-xs font-medium text-gray-500 italic">{log.reason}</span>
                               </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                   <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">RUMBEROS <span className="text-secondary neon-text-secondary">STAFF</span></h2>
                   <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] pl-1">Monitoreo de rendimiento operativo y seguridad de acceso</p>
                </div>
                <Dialog>
                   <DialogTrigger asChild>
                      <Button className="bg-secondary text-black font-black italic rounded-[1.5rem] h-16 px-12 text-xl tracking-tight neon-glow-secondary">
                         <UserPlus className="mr-3 h-7 w-7" /> REGISTRAR OPERATIVO
                      </Button>
                   </DialogTrigger>
                   <DialogContent className="bg-card/95 border-white/10 text-white glass-morphism rounded-[3rem] p-12 shadow-[0_0_100px_rgba(0,255,255,0.2)]">
                      <DialogHeader className="mb-10">
                         <DialogTitle className="text-4xl font-black italic tracking-tighter text-secondary uppercase">NUEVO MIEMBRO STAFF</DialogTitle>
                         <p className="text-gray-400 uppercase font-black text-[10px] tracking-widest mt-1">Configura credenciales oficiales y roles operativos</p>
                      </DialogHeader>
                      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); toast({ title: "Personal registrado exitosamente." }); }}>
                         <div className="space-y-4">
                            <Label className="uppercase text-[10px] font-black text-gray-500 tracking-[0.2em] pl-1">Nombre Completo del Colaborador</Label>
                            <Input placeholder="Ej. Carlos Mendoza" className="bg-white/5 border-white/10 h-16 font-bold rounded-2xl text-lg px-6" />
                         </div>
                         <div className="space-y-4">
                            <Label className="uppercase text-[10px] font-black text-gray-500 tracking-[0.2em] pl-1">Número de Cédula (Login ID)</Label>
                            <div className="relative">
                               <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-secondary" />
                               <Input placeholder="Ej. 1020304050" className="bg-white/5 border-white/10 h-16 pl-16 font-black tracking-widest rounded-2xl text-2xl" />
                            </div>
                            <p className="text-[9px] text-secondary/70 font-bold uppercase tracking-widest pl-1">Los últimos 4 dígitos serán su PIN de acceso.</p>
                         </div>
                         <div className="space-y-4">
                            <Label className="uppercase text-[10px] font-black text-gray-500 tracking-[0.2em] pl-1">Responsabilidad en el Sistema</Label>
                            <Select>
                               <SelectTrigger className="bg-white/5 border-white/10 h-16 rounded-2xl font-bold text-lg px-6">
                                  <SelectValue placeholder="Definir Privilegios..." />
                               </SelectTrigger>
                               <SelectContent className="bg-black border-white/10 text-white">
                                  <SelectItem value="admin">Administrador (Control Total)</SelectItem>
                                  <SelectItem value="driver">Repartidor Flash (Logística)</SelectItem>
                                  <SelectItem value="warehouse">Almacén (Empaque y Stock)</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         <Button type="submit" className="w-full h-20 bg-secondary text-black font-black italic text-2xl rounded-[1.8rem] neon-glow-secondary mt-4 tracking-widest hover:scale-[1.02] transition-transform">
                            FINALIZAR VÍNCULO LABORAL
                         </Button>
                      </form>
                   </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {MOCK_STAFF.map((member) => (
                   <Card key={member.id} className="bg-card/40 border-white/10 glass-morphism p-10 rounded-[3rem] group hover:border-secondary/50 transition-all relative shadow-2xl overflow-hidden">
                      <div className="absolute top-0 right-0 h-32 w-32 bg-secondary/5 blur-3xl -z-10" />
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10 shadow-lg group-hover:neon-glow-secondary transition-all">
                               <Users className="h-10 w-10 text-secondary" />
                            </div>
                            <div>
                               <h3 className="text-3xl font-black italic tracking-tighter">{member.name}</h3>
                               <div className="flex flex-wrap gap-3 items-center mt-2">
                                 <Badge className="bg-secondary/10 text-secondary font-black uppercase text-[10px] border-none px-3">{member.role}</Badge>
                                 <span className="text-[10px] text-gray-600 font-bold tracking-widest">ID: {member.cedula}</span>
                               </div>
                            </div>
                         </div>
                         <Badge className={`${member.status === 'Online' || member.status === 'En Entrega' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} font-black rounded-lg px-4 py-1 border-none text-[10px] shadow-sm`}>
                            {member.status.toUpperCase()}
                         </Badge>
                      </div>
                      
                      <div className="flex gap-4">
                         <Button variant="outline" className="flex-1 h-16 text-lg font-black italic border-white/10 hover:bg-white/5 rounded-2xl tracking-tight">VER AUDITORÍA</Button>
                         <Button className="flex-1 bg-white/5 border border-white/10 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/40 h-16 font-black rounded-2xl text-lg italic tracking-tight">EDITAR ROL</Button>
                      </div>
                   </Card>
                ))}
             </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-2">
                    <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">ESTRUCTURA DE <span className="text-primary neon-text-primary">TIENDA</span></h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] pl-1">Curaduría de productos visibles para el consumidor final</p>
                  </div>
                  <Button className="bg-primary text-white font-black italic px-10 h-16 rounded-[1.5rem] text-xl tracking-tight neon-glow-primary uppercase">
                    <Plus className="mr-3 h-7 w-7" /> PUBLICAR ITEM
                  </Button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                  {inventory.map((item, idx) => (
                     <Card key={idx} className="bg-card/40 border-white/10 overflow-hidden group hover:border-primary/50 transition-all rounded-[2.5rem] relative shadow-2xl">
                        <div className="h-56 relative bg-black flex items-center justify-center overflow-hidden">
                           <img src={`https://picsum.photos/seed/catalog-${idx}/500/400`} className="w-full h-full object-cover opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 grayscale group-hover:grayscale-0" alt={item.name} />
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                           <div className="absolute top-4 left-4">
                             {getCategoryBadge(item.category)}
                           </div>
                        </div>
                        <CardContent className="p-8 space-y-6">
                           <div className="space-y-1">
                              <h3 className="font-black italic text-2xl leading-none tracking-tight line-clamp-1">{item.name}</h3>
                              <p className="text-secondary font-black text-2xl italic tracking-tight">{formatCurrency(item.price)}</p>
                           </div>
                           <div className="flex gap-3">
                             <Button className="flex-1 bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 h-14 font-black rounded-2xl tracking-tighter italic text-lg">EDITAR</Button>
                             <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-white/10 text-destructive hover:bg-destructive/10">
                               <Trash2 className="h-6 w-6" />
                             </Button>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            </div>
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
