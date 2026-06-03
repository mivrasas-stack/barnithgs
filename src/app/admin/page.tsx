
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

const INITIAL_INVENTORY = [
  { id: '1', name: 'Johnnie Walker Black', stock: 12, category: 'Whisky', price: 185000, cost: 130000, minStock: 5 },
  { id: '2', name: 'Don Julio 70', stock: 5, category: 'Tequila', price: 420000, cost: 310000, minStock: 4 },
  { id: '3', name: 'Grey Goose 750ml', stock: 2, category: 'Vodka', price: 210000, cost: 150000, minStock: 6 },
  { id: '4', name: 'Heineken 6-Pack', stock: 45, category: 'Cerveza', price: 32000, cost: 22000, minStock: 20 },
  { id: '5', name: 'Hielo (Bolsa 5kg)', stock: 0, category: 'Complementos', price: 15000, cost: 5000, minStock: 10 },
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
      description: "El log de auditoría ha registrado este cambio de stock.",
    });
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCapital = inventory.reduce((acc, item) => acc + (item.cost * item.stock), 0);
  const projectedRevenue = inventory.reduce((acc, item) => acc + (item.price * item.stock), 0);

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
                  <Button type="submit" className="w-full h-16 bg-primary font-black italic text-xl neon-glow-primary rounded-2xl mt-4">
                    CONFIRMAR INGRESO A BODEGA
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
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
                  { title: 'Capital en Stock', value: formatCurrency(totalCapital), icon: Box, color: 'text-secondary', bg: 'bg-secondary/10', trend: 'Actualizado', up: true },
                  { title: 'Ingreso Proyectado', value: formatCurrency(projectedRevenue), icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', trend: 'Potencial', up: true },
                  { title: 'Merma del Turno', value: formatCurrency(185000), icon: Activity, color: 'text-destructive', bg: 'bg-destructive/10', trend: 'Ajuste Stock', up: false }
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
                      <ClipboardList className="text-secondary h-6 w-6" />
                      <h3 className="text-xl font-black italic">ÚLTIMOS AJUSTES</h3>
                    </div>
                    <div className="space-y-4">
                       {auditLogs.slice(0, 4).map((log, idx) => (
                         <div key={idx} className="flex flex-col p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-black text-primary uppercase">{log.type}</span>
                              <span className="text-[9px] text-gray-500">{log.date}</span>
                            </div>
                            <p className="font-bold text-sm mt-1">{log.item}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-400">Cant: <span className={log.delta > 0 ? 'text-green-400' : 'text-red-400'}>{log.delta > 0 ? '+' : ''}{log.delta}</span></span>
                              <span className="text-[9px] font-black uppercase text-gray-600">Por: {log.user.split(' ')[0]}</span>
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
            <Card className="bg-card/40 border-white/10 glass-morphism overflow-hidden rounded-[2.5rem] animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="p-10 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="space-y-1">
                      <CardTitle className="text-3xl font-black italic tracking-tighter">CONTROL MAESTRO DE EXISTENCIAS</CardTitle>
                      <CardDescription className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Inventario valorizado y auditoría de stock</CardDescription>
                   </div>
                   <div className="flex gap-4">
                      <div className="relative w-80">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                         <Input 
                            placeholder="Buscar producto..." 
                            className="bg-white/5 border-white/10 pl-12 h-12 font-bold rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5">
                          <TableHead className="text-gray-500 font-black uppercase p-8">Producto / SKU</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Capital Stock (Costo)</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Precio Venta</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Stock Actual</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Estado de Auditoría</TableHead>
                          <TableHead className="text-right p-8">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item) => {
                          const isLow = item.stock < item.minStock;
                          const isOut = item.stock === 0;
                          return (
                            <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                              <TableCell className="p-8 font-black text-xl italic">{item.name}</TableCell>
                              <TableCell className="p-8 font-black text-gray-400">{formatCurrency(item.cost * item.stock)}</TableCell>
                              <TableCell className="p-8 font-black text-secondary text-lg">{formatCurrency(item.price)}</TableCell>
                              <TableCell className="p-8">
                                 <span className={`text-2xl font-black ${isOut ? 'text-destructive' : isLow ? 'text-accent' : 'text-white'}`}>
                                   {item.stock} <span className="text-[10px] uppercase text-gray-600">UND</span>
                                 </span>
                              </TableCell>
                              <TableCell className="p-8">
                                 <Badge className={`${isOut ? 'bg-destructive/20 text-destructive' : isLow ? 'bg-accent/20 text-accent' : 'bg-green-500/20 text-green-400'} font-black px-4 rounded-lg border-none text-[10px]`}>
                                   {isOut ? 'AGOTADO' : isLow ? 'BAJO STOCK' : 'VERIFICADO'}
                                 </Badge>
                              </TableCell>
                              <TableCell className="p-8 text-right">
                                 <Dialog>
                                    <DialogTrigger asChild>
                                       <Button size="sm" variant="ghost" className="hover:bg-primary/10 text-primary font-black rounded-xl h-10 px-6 italic">
                                          <Edit3 className="mr-2 h-4 w-4" /> AUDITAR
                                       </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card/95 border-white/10 text-white glass-morphism rounded-[3rem] p-12">
                                       <DialogHeader className="mb-8">
                                          <DialogTitle className="text-4xl font-black italic tracking-tighter">AJUSTE DE STOCK</DialogTitle>
                                          <CardDescription className="text-gray-400 uppercase font-bold text-[10px] tracking-widest">Producto: {item.name}</CardDescription>
                                       </DialogHeader>
                                       <form className="space-y-8" onSubmit={handleSaveProduct}>
                                          <div className="grid grid-cols-2 gap-8">
                                             <div className="space-y-4">
                                                <Label className="uppercase text-[10px] font-black text-gray-500">NUEVA CANTIDAD</Label>
                                                <Input type="number" defaultValue={item.stock} className="bg-white/5 border-white/10 h-16 font-black text-2xl rounded-2xl" />
                                             </div>
                                             <div className="space-y-4">
                                                <Label className="uppercase text-[10px] font-black text-gray-500">MOTIVO DEL AJUSTE</Label>
                                                <Select required>
                                                   <SelectTrigger className="bg-white/5 border-white/10 h-16 rounded-2xl font-bold">
                                                      <SelectValue placeholder="Seleccionar..." />
                                                   </SelectTrigger>
                                                   <SelectContent className="bg-black border-white/10 text-white">
                                                      <SelectItem value="sale">Venta Manual</SelectItem>
                                                      <SelectItem value="broken">Botella Rota / Daño</SelectItem>
                                                      <SelectItem value="error">Error de Conteo</SelectItem>
                                                      <SelectItem value="restock">Reposición Almacén</SelectItem>
                                                      <SelectItem value="sampling">Cortesía / Degustación</SelectItem>
                                                   </SelectContent>
                                                </Select>
                                             </div>
                                          </div>
                                          <div className="space-y-4">
                                            <Label className="uppercase text-[10px] font-black text-gray-500">NOTAS ADICIONALES (OPCIONAL)</Label>
                                            <Input placeholder="Escribe aquí..." className="bg-white/5 border-white/10 h-16 rounded-2xl" />
                                          </div>
                                          <Button type="submit" className="w-full h-20 bg-primary font-black italic text-2xl rounded-[1.5rem] neon-glow-primary">
                                             CONFIRMAR AJUSTE AUDITABLE
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
            <Card className="bg-card/40 border-white/10 glass-morphism overflow-hidden rounded-[2.5rem] animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="p-10 border-b border-white/5 flex flex-row items-center justify-between">
                   <div>
                      <CardTitle className="text-3xl font-black italic tracking-tighter">BITÁCORA DE AUDITORÍA</CardTitle>
                      <CardDescription className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Control absoluto de cada movimiento de inventario y capital</CardDescription>
                   </div>
                   <Button variant="outline" className="border-secondary text-secondary font-black italic rounded-xl px-8 h-12">
                     EXPORTAR PDF
                   </Button>
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5">
                          <TableHead className="text-gray-500 font-black uppercase p-8">ID Operación</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Tipo / Acción</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Ítem Afectado</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Variación</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Usuario / Staff</TableHead>
                          <TableHead className="text-gray-500 font-black uppercase p-8">Motivo Reportado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => (
                          <TableRow key={log.id} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="p-8 font-black text-primary italic">{log.id}</TableCell>
                            <TableCell className="p-8 font-black">
                               <Badge className={`${log.type === 'VENTA' ? 'bg-secondary/20 text-secondary' : log.type === 'AJUSTE' ? 'bg-destructive/20 text-destructive' : 'bg-green-500/20 text-green-400'} border-none font-black`}>
                                 {log.type}
                               </Badge>
                            </TableCell>
                            <TableCell className="p-8 font-bold text-gray-200">{log.item}</TableCell>
                            <TableCell className={`p-8 font-black text-xl italic ${log.delta > 0 ? 'text-secondary' : 'text-destructive'}`}>
                              {log.delta > 0 ? '+' : ''}{log.delta} UND
                            </TableCell>
                            <TableCell className="p-8 text-gray-400 font-bold uppercase text-[10px]">{log.user}</TableCell>
                            <TableCell className="p-8">
                               <span className="text-xs font-medium text-gray-500 italic">{log.reason}</span>
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
              <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-4xl font-black italic tracking-tighter">RUMBEROS STAFF</h2>
                   <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 pl-1">Monitoreo de rendimiento y permisos de acceso</p>
                </div>
                <Dialog>
                   <DialogTrigger asChild>
                      <Button className="bg-secondary text-black font-black italic rounded-[1.2rem] h-14 px-10 neon-glow-secondary">
                         <UserPlus className="mr-3 h-6 w-6" /> REGISTRAR OPERATIVO
                      </Button>
                   </DialogTrigger>
                   <DialogContent className="bg-card/95 border-white/10 text-white glass-morphism rounded-[3rem] p-12">
                      <DialogHeader className="mb-8">
                         <DialogTitle className="text-4xl font-black italic tracking-tighter text-secondary">NUEVO MIEMBRO</DialogTitle>
                         <p className="text-gray-400 uppercase font-black text-[10px] tracking-widest mt-1">Configura credenciales y roles operativos</p>
                      </DialogHeader>
                      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); toast({ title: "Personal registrado." }); }}>
                         <div className="space-y-4">
                            <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest">Nombre Completo</Label>
                            <Input placeholder="Ej. Carlos Mendoza" className="bg-white/5 border-white/10 h-16 font-bold rounded-2xl" />
                         </div>
                         <div className="space-y-4">
                            <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest">Número de Cédula (Login ID)</Label>
                            <div className="relative">
                               <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-secondary/40" />
                               <Input placeholder="Ej. 1020304050" className="bg-white/5 border-white/10 h-16 pl-14 font-black tracking-widest rounded-2xl text-xl" />
                            </div>
                         </div>
                         <div className="space-y-4">
                            <Label className="uppercase text-[10px] font-black text-gray-500 tracking-widest">Rol del Sistema</Label>
                            <Select>
                               <SelectTrigger className="bg-white/5 border-white/10 h-16 rounded-2xl">
                                  <SelectValue placeholder="Definir Responsabilidades..." />
                               </SelectTrigger>
                               <SelectContent className="bg-black border-white/10 text-white">
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="driver">Repartidor</SelectItem>
                                  <SelectItem value="warehouse">Almacén</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         <Button type="submit" className="w-full h-20 bg-secondary text-black font-black italic text-2xl rounded-[1.5rem] neon-glow-secondary mt-4">
                            FINALIZAR REGISTRO
                         </Button>
                      </form>
                   </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {MOCK_STAFF.map((member) => (
                   <Card key={member.id} className="bg-card/40 border-white/10 glass-morphism p-10 rounded-[3rem] group hover:border-secondary/50 transition-all relative">
                      <div className="flex items-center justify-between mb-10">
                         <div className="flex items-center gap-6">
                            <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                               <Users className="h-10 w-10 text-secondary" />
                            </div>
                            <div>
                               <h3 className="text-3xl font-black italic tracking-tighter">{member.name}</h3>
                               <div className="flex gap-3 items-center mt-2">
                                 <Badge className="bg-white/10 text-gray-400 font-black uppercase text-[10px] border-none">{member.role}</Badge>
                                 <span className="text-[10px] text-gray-600 font-bold tracking-widest">ID: {member.cedula}</span>
                               </div>
                            </div>
                         </div>
                         <Badge className={`${member.status === 'Online' || member.status === 'En Entrega' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} font-black rounded-lg px-4 py-1 border-none text-[10px]`}>
                            {member.status.toUpperCase()}
                         </Badge>
                      </div>
                      
                      <div className="flex gap-4">
                         <Button variant="outline" className="flex-1 h-14 text-lg font-black italic border-white/10 hover:bg-white/5 rounded-2xl">REPORTES</Button>
                         <Button className="flex-1 bg-white/5 border border-white/10 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/40 h-14 font-black rounded-2xl text-lg italic">EDITAR</Button>
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
                        </div>
                        <CardContent className="p-10 space-y-6">
                           <div className="space-y-1">
                              <h3 className="font-black italic text-2xl leading-none tracking-tight">{item.name}</h3>
                              <span className="text-secondary font-black text-xl italic">{formatCurrency(item.price)}</span>
                           </div>
                           <Button className="w-full bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 h-14 font-black rounded-2xl tracking-tighter italic">EDITAR INFO</Button>
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
