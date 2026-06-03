
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
      
      <main className="container mx-auto px-6 py-12 max-w-[1600px] space-y-16">
        
        {/* SECTION HEADER - MINIMALIST & BOLD */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/5">
          <div className="space-y-1">
            <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
              {activeTab === 'dashboard' && <><span className="text-primary neon-text-primary">COMMAND</span> CENTER</>}
              {activeTab === 'inventory' && <><span className="text-secondary neon-text-secondary">STOCK</span> CONTROL</>}
              {activeTab === 'deliveries' && <><span className="text-secondary neon-text-secondary">LIVE</span> LOGISTICS</>}
              {activeTab === 'staff' && <><span className="text-primary neon-text-primary">STAFF</span> ROSTER</>}
              {activeTab === 'catalog' && <><span className="text-accent neon-text-accent">STORE</span> DESIGN</>}
              {activeTab === 'history' && <><span className="text-gray-400">AUDIT</span> LOG</>}
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.4em] pl-1">
              PartyFlow OS v4.0 • Bogota, CO
            </p>
          </div>
          
          {activeTab === 'inventory' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 h-16 px-10 rounded-2xl font-black italic text-lg tracking-tight neon-glow-primary">
                  <Plus className="mr-2 h-6 w-6" /> NUEVA ENTRADA
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 text-white rounded-[2rem] p-10 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black italic text-primary uppercase">REGISTRO DE MERCANCÍA</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Nombre del Producto</Label>
                    <Input className="bg-white/5 border-white/10 h-14" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Costo Adquisición</Label>
                    <Input type="number" className="bg-white/5 border-white/10 h-14" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-gray-500">Precio Venta</Label>
                    <Input type="number" className="bg-white/5 border-white/10 h-14" />
                  </div>
                </div>
                <Button className="w-full h-16 bg-primary font-black italic text-xl mt-8 rounded-xl uppercase">Vincular a Bodega</Button>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-16 animate-in fade-in duration-700">
            {/* KPI STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Ingresos Hoy', value: formatCurrency(12450000), trend: '+14%', icon: DollarSign, color: 'text-primary' },
                { label: 'Capital Stock', value: formatCurrency(totalCapital), trend: 'Auditado', icon: Box, color: 'text-secondary' },
                { label: 'Pedidos Turno', value: '142', trend: 'Pico: 00:00', icon: Zap, color: 'text-accent' },
                { label: 'Tiempo Entrega', value: '18 min', trend: '-2 min', icon: Clock, color: 'text-green-400' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] space-y-4 hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start">
                    <div className={`h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center ${kpi.color}`}>
                      <kpi.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{kpi.trend}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{kpi.label}</p>
                    <h4 className="text-4xl font-black italic tracking-tighter">{kpi.value}</h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* MAIN CHART */}
              <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-10 rounded-[3rem]">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black italic uppercase tracking-tight">Flujo de Caja por Hora</h3>
                  <Badge className="bg-primary/20 text-primary border-none font-black italic px-4">EN VIVO</Badge>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_STATS}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff20" fontSize={12} fontWeight="bold" />
                      <YAxis hide />
                      <ChartTooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '1rem' }} />
                      <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                        {MOCK_STATS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 3 ? '#FF007A' : '#00FFFF'} fillOpacity={0.6} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SIDE MONITOR */}
              <div className="space-y-6">
                <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2.5rem] h-full">
                  <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
                    <AlertTriangle className="text-accent h-5 w-5" /> Alertas Críticas
                  </h3>
                  <div className="space-y-4">
                    {[
                      { msg: 'Stock bajo: Johnnie Walker', type: 'warning' },
                      { msg: 'Alta demanda en Zona Norte', type: 'info' },
                      { msg: '3 pedidos con > 25min retraso', type: 'error' },
                    ].map((alert, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border-l-4 border-accent flex justify-between items-center">
                        <span className="text-sm font-bold">{alert.msg}</span>
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY VIEW */}
        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 h-5 w-5" />
                <Input 
                  placeholder="Filtrar por SKU o Nombre..." 
                  className="bg-white/5 border-white/10 h-16 pl-12 rounded-2xl font-bold text-lg focus:border-secondary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-600 font-black uppercase p-8 tracking-widest text-[10px]">PRODUCTO</TableHead>
                    <TableHead className="text-gray-600 font-black uppercase p-8 tracking-widest text-[10px]">PRECIO VENTA</TableHead>
                    <TableHead className="text-gray-600 font-black uppercase p-8 tracking-widest text-[10px]">STOCK</TableHead>
                    <TableHead className="text-gray-600 font-black uppercase p-8 tracking-widest text-[10px]">ESTADO</TableHead>
                    <TableHead className="text-right p-8">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="p-8">
                        <div className="space-y-1">
                          <p className="font-black text-2xl italic tracking-tighter">{item.name}</p>
                          <Badge className="bg-white/5 text-gray-500 text-[8px] border-none font-black uppercase">{item.category}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="p-8 font-black text-secondary text-2xl italic">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="p-8">
                        <div className="flex flex-col">
                          <span className={`text-4xl font-black italic ${item.stock <= item.minStock ? 'text-accent' : 'text-white'}`}>{item.stock}</span>
                          <span className="text-[8px] font-black text-gray-600 uppercase">Unidades</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-8">
                        <Badge className={`${item.stock <= item.minStock ? 'bg-accent/10 text-accent' : 'bg-green-500/10 text-green-400'} font-black px-4 border-none`}>
                          {item.stock <= item.minStock ? 'REABASTECER' : 'ÓPTIMO'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-8 text-right space-x-2">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-gray-500 hover:text-white"><Edit3 className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-gray-500 hover:text-destructive"><Trash2 className="h-5 w-5" /></Button>
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
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden h-[600px] relative group">
                  <img src="https://picsum.photos/seed/map-bogota/1200/800" className="w-full h-full object-cover grayscale brightness-[0.3] contrast-150 transition-all group-hover:brightness-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-10 left-10 space-y-2">
                    <Badge className="bg-secondary text-black font-black animate-pulse px-6 py-2">8 REPARTIDORES EN RUTA</Badge>
                    <p className="text-sm font-bold text-gray-400">Mapa Satelital en Tiempo Real</p>
                  </div>
               </div>
               <div className="space-y-6">
                  {MOCK_DELIVERIES.map((order) => (
                    <div key={order.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] space-y-4 hover:border-secondary/30 transition-all cursor-pointer">
                      <div className="flex justify-between items-start">
                        <p className="font-black text-secondary italic text-lg">{order.id}</p>
                        <Badge className="bg-secondary/10 text-secondary border-none text-[8px] font-black">{order.status}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-300">{order.customer}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {order.address}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-xs font-black text-gray-600">{order.driver}</span>
                        <span className="text-sm font-black italic">{order.time}</span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* STAFF VIEW */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
            {MOCK_STAFF.map((member) => (
              <div key={member.id} className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] space-y-8 group hover:border-primary/50 transition-all relative">
                <div className="flex justify-between items-start">
                  <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:neon-glow-primary transition-all">
                    <Users className="h-8 w-8" />
                  </div>
                  <Badge className={`${member.status === 'Online' ? 'bg-green-500/10 text-green-400' : 'bg-secondary/10 text-secondary'} font-black px-4`}>{member.status}</Badge>
                </div>
                <div>
                  <h3 className="text-3xl font-black italic tracking-tighter uppercase">{member.name}</h3>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1">Cédula: {member.cedula}</p>
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 h-14 bg-white/5 border border-white/10 hover:bg-white/10 font-black italic rounded-xl">PERFIL</Button>
                  <Button variant="ghost" className="h-14 w-14 rounded-xl text-destructive hover:bg-destructive/10"><Trash2 className="h-5 w-5" /></Button>
                </div>
              </div>
            ))}
            <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center p-12 space-y-6 hover:bg-white/[0.03] transition-all cursor-pointer group">
               <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="h-10 w-10 text-primary" />
               </div>
               <p className="font-black italic text-xl tracking-tight text-gray-500">REGISTRAR NUEVO MIEMBRO</p>
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
