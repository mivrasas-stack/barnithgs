
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserRole } from '@/lib/store';
import { StaffNavigation } from '@/components/StaffNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  FileText,
  ClipboardList,
  MapPin,
  Clock,
  Zap,
  CheckCircle2,
  Navigation as NavIcon,
  LayoutDashboard,
  ChevronRight
} from 'lucide-react';

const MOCK_STATS = [
  { name: '18:00', orders: 15, revenue: 1200000 },
  { name: '20:00', orders: 32, revenue: 2800000 },
  { name: '22:00', orders: 85, revenue: 7400000 },
  { name: '00:00', orders: 124, revenue: 11200000 },
  { name: '02:00', orders: 65, revenue: 5800000 },
];

const CATEGORIAS_CONTABLES = [
  { id: 'aguardiente', label: 'Aguardiente', color: 'bg-blue-500/10 text-blue-400' },
  { id: 'ron', label: 'Ron', color: 'bg-orange-500/10 text-orange-400' },
  { id: 'whisky', label: 'Whisky', color: 'bg-amber-500/10 text-amber-400' },
  { id: 'tequila', label: 'Tequila', color: 'bg-green-500/10 text-green-400' },
  { id: 'cerveza', label: 'Cerveza', color: 'bg-yellow-500/10 text-yellow-400' },
  { id: 'combos', label: 'Combos VIP', color: 'bg-primary/10 text-primary' },
];

const INITIAL_INVENTORY = [
  { id: '1', name: 'Johnnie Walker Black 750ml', stock: 12, category: 'whisky', price: 185000, cost: 130000, minStock: 5 },
  { id: '2', name: 'Aguardiente Antioqueño 750ml', stock: 24, category: 'aguardiente', price: 65000, cost: 42000, minStock: 10 },
  { id: '3', name: 'Don Julio 70', stock: 5, category: 'tequila', price: 420000, cost: 310000, minStock: 4 },
  { id: '4', name: 'Heineken 6-Pack', stock: 45, category: 'cerveza', price: 32000, cost: 22000, minStock: 20 },
  { id: '5', name: 'Hielo (Bolsa 5kg)', stock: 0, category: 'complementos', price: 15000, cost: 5000, minStock: 10 },
];

const MOCK_STAFF = [
  { id: 'S1', name: 'Carlos Mendoza', role: 'admin', status: 'Online', lastActive: 'Ahora', cedula: '1020304050' },
  { id: 'S2', name: 'Ana Rodríguez', role: 'driver', status: 'En Entrega', lastActive: '5 min', cedula: '1098765432' },
  { id: 'S3', name: 'Juan Pérez', role: 'warehouse', status: 'Online', lastActive: '12 min', cedula: '1033445566' },
];

const MOCK_DELIVERIES = [
  { id: 'ORD-5501', customer: 'Andrés Felipe', address: 'Calle 100 #15-30', status: 'ENTREGANDO', driver: 'Ana Rodríguez', time: '12 min', total: 245000 },
  { id: 'ORD-5502', customer: 'Juliana G.', address: 'Cra 7 #72-10', status: 'EMPACANDO', driver: 'Pendiente', time: '4 min', total: 85000 },
  { id: 'ORD-5503', customer: 'Sofía V.', address: 'Av Boyacá #116-40', status: 'COMPLETADO', driver: 'Carlos Mendoza', time: '25 min', total: 115000 },
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
  }, [isInitialized, isLoggedIn, role, router]);

  if (!isInitialized) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;
  if (!isLoggedIn || role !== 'admin') return null;

  const totalCapital = inventory.reduce((acc, item) => acc + (item.cost * item.stock), 0);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <StaffNavigation />
      
      <main className="md:pl-16 transition-all duration-300 container mx-auto px-6 py-8 max-w-[1400px] space-y-10">
        
        {/* SECTION HEADER - COMPACT */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/5">
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
              {activeTab === 'dashboard' && <><span className="text-primary neon-text-primary">COMMAND</span> CENTER</>}
              {activeTab === 'inventory' && <><span className="text-secondary neon-text-secondary">STOCK</span> CONTROL</>}
              {activeTab === 'deliveries' && <><span className="text-secondary neon-text-secondary">LIVE</span> LOGISTICS</>}
              {activeTab === 'staff' && <><span className="text-primary neon-text-primary">STAFF</span> ROSTER</>}
              {activeTab === 'history' && <><span className="text-gray-400">AUDIT</span> LOG</>}
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.3em] pl-1">
              PartyFlow OS v4.0 • Bogota, CO
            </p>
          </div>
          
          {activeTab === 'inventory' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-xl font-black italic text-base tracking-tight neon-glow-primary">
                  <Plus className="mr-2 h-5 w-5" /> NUEVA ENTRADA
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 text-white rounded-[1.5rem] p-8 max-w-xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic text-primary uppercase">REGISTRO DE MERCANCÍA</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Nombre del Producto</Label>
                    <Input className="bg-white/5 border-white/10 h-11 placeholder:text-gray-600 text-sm" placeholder="Ej: Johnnie Walker Red Label" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Categoría Contable</Label>
                    <Select>
                      <SelectTrigger className="bg-white/5 border-white/10 h-11 text-sm">
                        <SelectValue placeholder="Seleccionar categoría..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white">
                        {CATEGORIAS_CONTABLES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Costo (COP)</Label>
                    <Input type="number" className="bg-white/5 border-white/10 h-11 text-sm" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Precio Venta (COP)</Label>
                    <Input type="number" className="bg-white/5 border-white/10 h-11 text-sm" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Stock Inicial</Label>
                    <Input type="number" className="bg-white/5 border-white/10 h-11 text-sm" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Stock Mínimo</Label>
                    <Input type="number" className="bg-white/5 border-white/10 h-11 text-sm" placeholder="5" />
                  </div>
                </div>
                <Button className="w-full h-12 bg-primary font-black italic text-lg mt-6 rounded-lg uppercase neon-glow-primary">Vincular a Bodega</Button>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            {/* KPI STRIP - COMPACT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Ingresos Hoy', value: formatCurrency(12450000), trend: '+14%', icon: DollarSign, color: 'text-primary' },
                { label: 'Capital Stock', value: formatCurrency(totalCapital), trend: 'Auditado', icon: Box, color: 'text-secondary' },
                { label: 'Pedidos Turno', value: '142', trend: 'Pico: 00:00', icon: Zap, color: 'text-accent' },
                { label: 'Tiempo Entrega', value: '18 min', trend: '-2 min', icon: Clock, color: 'text-green-400' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 p-5 rounded-[1.5rem] space-y-3 hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start">
                    <div className={`h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center ${kpi.color}`}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{kpi.trend}</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{kpi.label}</p>
                    <h4 className="text-2xl font-black italic tracking-tighter">{kpi.value}</h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* MAIN CHART */}
              <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-6 rounded-[2rem]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black italic uppercase tracking-tight">Flujo de Caja</h3>
                  <Badge className="bg-primary/20 text-primary border-none font-black italic px-3 text-[10px]">LIVE</Badge>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_STATS}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} fontWeight="bold" />
                      <YAxis hide />
                      <ChartTooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '0.5rem', fontSize: '10px' }} />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                        {MOCK_STATS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 3 ? '#FF007A' : '#00FFFF'} fillOpacity={0.6} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SIDE MONITOR */}
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem]">
                <h3 className="text-base font-black italic uppercase mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-accent h-4 w-4" /> Alertas
                </h3>
                <div className="space-y-3">
                  {[
                    { msg: 'Stock bajo: Johnnie Walker', type: 'warning' },
                    { msg: 'Alta demanda en Zona Norte', type: 'info' },
                    { msg: '3 pedidos con retraso', type: 'error' },
                  ].map((alert, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/5 border-l-4 border-accent flex justify-between items-center text-xs">
                      <span className="font-bold">{alert.msg}</span>
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY VIEW */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 h-4 w-4" />
                <Input 
                  placeholder="Filtrar por SKU o Nombre..." 
                  className="bg-white/5 border-white/10 h-12 pl-10 rounded-xl font-bold text-sm focus:border-secondary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-600 font-black uppercase p-4 tracking-widest text-[8px]">PRODUCTO</TableHead>
                    <TableHead className="text-gray-600 font-black uppercase p-4 tracking-widest text-[8px]">PRECIO VENTA</TableHead>
                    <TableHead className="text-gray-600 font-black uppercase p-4 tracking-widest text-[8px]">STOCK</TableHead>
                    <TableHead className="text-gray-600 font-black uppercase p-4 tracking-widest text-[8px]">ESTADO</TableHead>
                    <TableHead className="text-right p-4">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-black text-lg italic tracking-tighter">{item.name}</p>
                          <Badge className="bg-white/5 text-gray-500 text-[7px] border-none font-black uppercase px-1.5 py-0">{item.category}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 font-black text-secondary text-lg italic">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-col">
                          <span className={`text-2xl font-black italic ${item.stock <= item.minStock ? 'text-accent' : 'text-white'}`}>{item.stock}</span>
                          <span className="text-[7px] font-black text-gray-600 uppercase">Unidades</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <Badge className={`${item.stock <= item.minStock ? 'bg-accent/10 text-accent' : 'bg-green-500/10 text-green-400'} font-black px-2 py-0 border-none text-[9px]`}>
                          {item.stock <= item.minStock ? 'REABASTECER' : 'ÓPTIMO'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4 text-right space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-gray-500 hover:text-white"><Edit3 className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-white/10 text-white rounded-[1.5rem] p-8 max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-black italic text-secondary uppercase">EDITAR STOCK: {item.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-6">
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Nombre</Label>
                                <Input className="bg-white/5 border-white/10 h-11 text-sm" defaultValue={item.name} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Precio (COP)</Label>
                                <Input type="number" className="bg-white/5 border-white/10 h-11 text-sm" defaultValue={item.price} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Stock Actual</Label>
                                <Input type="number" className="bg-white/5 border-white/10 h-11 text-sm" defaultValue={item.stock} />
                              </div>
                            </div>
                            <Button className="w-full h-12 bg-secondary text-black font-black italic text-lg mt-6 rounded-lg uppercase neon-glow-secondary">ACTUALIZAR</Button>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-gray-500 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* DELIVERIES VIEW */}
        {activeTab === 'deliveries' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden h-[450px] relative group">
                  <img src="https://picsum.photos/seed/map-bogota/1200/800" className="w-full h-full object-cover grayscale brightness-[0.3] contrast-150 transition-all group-hover:brightness-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 space-y-1">
                    <Badge className="bg-secondary text-black font-black animate-pulse px-4 py-1 text-[10px]">8 REPARTIDORES EN RUTA</Badge>
                    <p className="text-[10px] font-bold text-gray-400">Mapa Satelital en Tiempo Real</p>
                  </div>
               </div>
               <div className="space-y-4">
                  {MOCK_DELIVERIES.map((order) => (
                    <div key={order.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-[1.5rem] space-y-3 hover:border-secondary/30 transition-all cursor-pointer">
                      <div className="flex justify-between items-start">
                        <p className="font-black text-secondary italic text-base">{order.id}</p>
                        <Badge className="bg-secondary/10 text-secondary border-none text-[7px] font-black uppercase">{order.status}</Badge>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-gray-300">{order.customer}</p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {order.address}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-[9px] font-black text-gray-600">{order.driver}</span>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-gray-500 uppercase">Total</p>
                          <span className="text-xs font-black italic text-primary">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* STAFF VIEW */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
            {MOCK_STAFF.map((member) => (
              <div key={member.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] space-y-6 group hover:border-primary/50 transition-all relative">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center text-primary group-hover:neon-glow-primary transition-all">
                    <Users className="h-6 w-6" />
                  </div>
                  <Badge className={`${member.status === 'Online' ? 'bg-green-500/10 text-green-400' : 'bg-secondary/10 text-secondary'} font-black px-3 py-0 text-[10px]`}>{member.status}</Badge>
                </div>
                <div>
                  <h3 className="text-xl font-black italic tracking-tighter uppercase">{member.name}</h3>
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-0.5">Cédula: {member.cedula}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 h-11 bg-white/5 border border-white/10 hover:bg-white/10 font-black italic rounded-lg text-sm">PERFIL</Button>
                  <Button variant="ghost" className="h-11 w-11 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center p-8 space-y-4 hover:bg-white/[0.03] transition-all cursor-pointer group">
               <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="h-7 w-7 text-primary" />
               </div>
               <p className="font-black italic text-base tracking-tight text-gray-500">NUEVO MIEMBRO</p>
            </div>
          </div>
        )}

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
