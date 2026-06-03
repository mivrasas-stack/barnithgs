
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserRole } from '@/lib/store';
import { StaffNavigation } from '@/components/StaffNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose } from '@/components/ui/dialog';
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
  ChevronRight,
  Phone,
  Package,
  Calendar,
  History,
  Image as ImageIcon,
  Upload
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
  { 
    id: 'ORD-5501', 
    customer: 'Andrés Felipe', 
    phone: '310 555 1234',
    address: 'Calle 100 #15-30, Apt 502', 
    status: 'ENTREGANDO', 
    driver: 'Ana Rodríguez', 
    time: '12 min', 
    total: 245000,
    items: ['2x Old Parr 12 Años 750ml', '4x Red Bull 250ml', '1x Bolsa Hielo 5kg'],
    placedAt: '22:45'
  },
  { 
    id: 'ORD-5502', 
    customer: 'Juliana G.', 
    phone: '311 222 3344',
    address: 'Cra 7 #72-10, Edificio Capital', 
    status: 'EMPACANDO', 
    driver: 'Pendiente', 
    time: '4 min', 
    total: 85000,
    items: ['1x Aguardiente Antioqueño 750ml', '2x Coca Cola 1.5L'],
    placedAt: '22:58'
  },
  { 
    id: 'ORD-5503', 
    customer: 'Sofía V.', 
    phone: '300 987 6543',
    address: 'Av Boyacá #116-40', 
    status: 'COMPLETADO', 
    driver: 'Carlos Mendoza', 
    time: '25 min', 
    total: 115000,
    items: ['1x Grey Goose 750ml', '1x Jugo de Naranja 1L'],
    placedAt: '22:15'
  },
];

function AdminContent() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [inventory] = useState(INITIAL_INVENTORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<typeof MOCK_DELIVERIES[0] | null>(null);

  useEffect(() => {
    if (isInitialized && (!isLoggedIn || role !== 'admin')) {
      router.push('/login');
    }
  }, [isInitialized, isLoggedIn, role, router]);

  if (!isInitialized) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;
  if (!isLoggedIn || role !== 'admin') return null;

  const totalCapital = inventory.reduce((acc, item) => acc + (item.cost * item.stock), 0);

  const handleUpdateProduct = (name: string) => {
    toast({
      title: "Actualización Exitosa",
      description: `El producto ${name} ha sido actualizado correctamente.`,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <StaffNavigation />
      
      <main className="md:pl-16 transition-all duration-300 container mx-auto px-6 py-8 max-w-[1400px] space-y-10">
        
        {/* SECTION HEADER - COMPACT */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/5">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              {activeTab === 'dashboard' && <><span className="text-primary neon-text-primary">COMMAND</span> CENTER</>}
              {activeTab === 'inventory' && <><span className="text-secondary neon-text-secondary">STOCK</span> CONTROL</>}
              {activeTab === 'deliveries' && <><span className="text-secondary neon-text-secondary">LIVE</span> LOGISTICS</>}
              {activeTab === 'catalog' && <><span className="text-primary neon-text-primary">STORE</span> FRONT</>}
              {activeTab === 'staff' && <><span className="text-primary neon-text-primary">STAFF</span> ROSTER</>}
              {activeTab === 'history' && <><span className="text-gray-400">AUDIT</span> LOG</>}
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.3em] pl-1">
              PartyFlow OS v4.0 • Bogota, CO
            </p>
          </div>
          
          {(activeTab === 'inventory' || activeTab === 'catalog') && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 h-10 px-6 rounded-xl font-black italic text-sm tracking-tight neon-glow-primary">
                  <Plus className="mr-2 h-4 w-4" /> NUEVA ENTRADA
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 text-white rounded-[1.5rem] p-8 max-w-xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic text-primary uppercase">REGISTRO DE MERCANCÍA</DialogTitle>
                  <DialogDescription className="text-gray-500 font-bold text-[10px] uppercase">Ingreso de stock con valoración COP</DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Left Column: Image Upload */}
                  <div className="space-y-4">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Imagen del Producto</Label>
                    <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 group hover:border-primary/40 transition-all cursor-pointer relative overflow-hidden">
                       <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                          <Upload className="h-6 w-6" />
                       </div>
                       <p className="text-[10px] font-black italic text-gray-400 uppercase tracking-tighter">SUBIR ARCHIVO</p>
                       <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>

                  {/* Right Column: Basic Info */}
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-gray-500">Nombre del Producto</Label>
                      <Input className="bg-white/5 border-white/10 h-11 placeholder:text-gray-600 text-sm" placeholder="Ej: Don Julio 70" />
                    </div>

                    <div className="space-y-1.5">
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-gray-500">Costo Adquisición (COP)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-black text-sm">$</span>
                          <Input type="number" className="bg-white/5 border-white/10 h-11 pl-7 text-sm font-black" placeholder="0" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-gray-500">Precio Venta (COP)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-sm">$</span>
                          <Input type="number" className="bg-white/5 border-white/10 h-11 pl-7 text-sm font-black" placeholder="0" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-gray-500">Stock Inicial</Label>
                        <Input type="number" className="bg-white/5 border-white/10 h-11 text-sm" placeholder="0" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-gray-500">Stock Mínimo</Label>
                        <Input type="number" className="bg-white/5 border-white/10 h-11 text-sm" placeholder="5" />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogClose asChild>
                  <Button className="w-full h-12 bg-primary font-black italic text-lg mt-8 rounded-xl uppercase neon-glow-primary tracking-widest">
                    VINCULAR A BODEGA
                  </Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          )}

          {activeTab === 'staff' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 h-10 px-6 rounded-xl font-black italic text-sm tracking-tight neon-glow-primary">
                  <UserPlus className="mr-2 h-4 w-4" /> VINCULAR STAFF
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 text-white rounded-[1.5rem] p-8 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic text-primary uppercase">ALTA DE PERSONAL</DialogTitle>
                  <DialogDescription className="text-gray-500 font-bold text-[10px] uppercase">Registro de nuevo miembro en la flota PartyFlow</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Nombre Completo</Label>
                    <Input className="bg-white/5 border-white/10 h-11 text-sm" placeholder="Ej: Ricardo Jaramillo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Rol Operativo</Label>
                    <Select>
                      <SelectTrigger className="bg-white/5 border-white/10 h-11 text-sm">
                        <SelectValue placeholder="Seleccionar rol..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white">
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="driver">Driver (Repartidor)</SelectItem>
                        <SelectItem value="warehouse">Bodeguero / Almacén</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Cédula de Ciudadanía</Label>
                    <Input className="bg-white/5 border-white/10 h-11 text-sm" placeholder="Documento de identidad" />
                  </div>
                </div>
                <DialogClose asChild>
                  <Button className="w-full h-12 bg-primary font-black italic text-lg mt-6 rounded-lg uppercase neon-glow-primary">REGISTRAR MIEMBRO</Button>
                </DialogClose>
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
                      <ChartTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '0.5rem', fontSize: '10px' }} 
                      />
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
                    <div key={i} className="p-4 rounded-xl bg-white/5 border-l-4 border-accent flex justify-between items-center text-xs">
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
                  className="bg-white/5 border-white/10 h-10 pl-10 rounded-xl font-bold text-sm focus:border-secondary"
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
                          <p className="font-black text-base italic tracking-tighter">{item.name}</p>
                          <Badge className="bg-white/5 text-gray-500 text-[7px] border-none font-black uppercase px-1.5 py-0">{item.category}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 font-black text-secondary text-base italic">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-col">
                          <span className={`text-xl font-black italic ${item.stock <= item.minStock ? 'text-accent' : 'text-white'}`}>{item.stock}</span>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-500 hover:text-white"><Edit3 className="h-4 w-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-white/10 text-white rounded-[1.5rem] p-8 max-md">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-black italic text-secondary uppercase">EDITAR PRODUCTO: {item.name}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Nombre del Producto</Label>
                                <Input className="bg-white/5 border-white/10 h-11 text-sm" defaultValue={item.name} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Categoría</Label>
                                <Select defaultValue={item.category}>
                                  <SelectTrigger className="bg-white/5 border-white/10 h-11 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border-white/10 text-white">
                                    {CATEGORIAS_CONTABLES.map(cat => (
                                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Precio Venta (COP)</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary font-bold text-sm">$</span>
                                  <Input type="number" className="bg-white/5 border-white/10 h-11 pl-7 text-sm" defaultValue={item.price} />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Costo Unitario (COP)</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
                                  <Input type="number" className="bg-white/5 border-white/10 h-11 pl-7 text-sm" defaultValue={item.cost} />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Stock Actual</Label>
                                <Input type="number" className="bg-white/5 border-white/10 h-11 text-sm" defaultValue={item.stock} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Stock Mínimo</Label>
                                <Input type="number" className="bg-white/5 border-white/10 h-11 text-sm" defaultValue={item.minStock} />
                              </div>
                            </div>
                            <DialogClose asChild>
                              <Button 
                                className="w-full h-12 bg-secondary text-black font-black italic text-lg mt-6 rounded-lg uppercase neon-glow-secondary"
                                onClick={() => handleUpdateProduct(item.name)}
                              >
                                CONFIRMAR CAMBIOS
                              </Button>
                            </DialogClose>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-500 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* CATALOG VIEW - PRODUCT MANAGEMENT */}
        {activeTab === 'catalog' && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 h-4 w-4" />
                <Input 
                  placeholder="Buscar en el catálogo público..." 
                  className="bg-white/5 border-white/10 h-10 pl-10 rounded-xl font-bold text-sm focus:border-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventory.map((product) => (
                <Card key={product.id} className="bg-white/[0.02] border border-white/5 overflow-hidden rounded-[1.5rem] group hover:border-primary/50 transition-all">
                  <div className="h-32 bg-white/5 relative">
                    <img 
                      src={`https://picsum.photos/seed/${product.id}/400/200`} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                      alt={product.name}
                    />
                    <Badge className="absolute top-2 right-2 bg-black/60 text-[8px] font-black uppercase border-none">{product.category}</Badge>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-black italic text-xs truncate uppercase tracking-tight">{product.name}</h3>
                    <div className="flex justify-between items-end">
                      <span className="text-primary font-black italic text-sm">{formatCurrency(product.price)}</span>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-600 hover:text-white"><Edit3 className="h-3 w-3" /></Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-white/10 text-white rounded-[1.5rem] p-8 max-md">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-black italic text-primary uppercase">EDITAR CATÁLOGO: {product.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-6">
                              <div className="aspect-video rounded-xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
                                <img src={`https://picsum.photos/seed/${product.id}/400/200`} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                                <Upload className="h-6 w-6 text-primary relative z-10" />
                                <p className="text-[10px] font-black uppercase text-gray-300 relative z-10 mt-2">CAMBIAR IMAGEN</p>
                                <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Nombre Público</Label>
                                <Input className="bg-white/5 border-white/10 h-11 text-sm" defaultValue={product.name} />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-gray-500">Precio Venta (COP)</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">$</span>
                                  <Input type="number" className="bg-white/5 border-white/10 h-11 pl-7 text-sm" defaultValue={product.price} />
                                </div>
                              </div>
                            </div>
                            <DialogClose asChild>
                              <Button 
                                className="w-full h-12 bg-primary text-white font-black italic text-lg mt-6 rounded-lg uppercase neon-glow-primary"
                                onClick={() => handleUpdateProduct(product.name)}
                              >
                                GUARDAR EN CATÁLOGO
                              </Button>
                            </DialogClose>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-gray-600 hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* DELIVERIES VIEW - LIVE LOGISTICS */}
        {activeTab === 'deliveries' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-2 bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden h-[450px] relative group">
                  <img src="https://picsum.photos/seed/map-bogota/1200/800" className="w-full h-full object-cover grayscale brightness-[0.3] contrast-150 transition-all group-hover:brightness-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 space-y-1">
                    <Badge className="bg-secondary text-black font-black animate-pulse px-4 py-1 text-[10px]">8 REPARTIDORES EN RUTA</Badge>
                    <p className="text-[10px] font-bold text-gray-400">Monitoreo Satelital Activo</p>
                  </div>
               </div>
               
               <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 px-2">Pedidos en Tiempo Real</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {MOCK_DELIVERIES.map((order) => (
                      <Dialog key={order.id}>
                        <DialogTrigger asChild>
                          <div 
                            className="bg-white/[0.02] border border-white/5 p-4 rounded-[1.5rem] space-y-3 hover:border-secondary/30 transition-all cursor-pointer group"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="flex justify-between items-start">
                              <p className="font-black text-secondary italic text-base group-hover:neon-text-secondary transition-all">{order.id}</p>
                              <Badge className={`${order.status === 'COMPLETADO' ? 'bg-green-500/10 text-green-400' : 'bg-secondary/10 text-secondary'} border-none text-[7px] font-black uppercase`}>
                                {order.status}
                              </Badge>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-gray-300">{order.customer}</p>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1 line-clamp-1"><MapPin className="h-2.5 w-2.5" /> {order.address}</p>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                              <span className="text-[9px] font-black text-gray-600 flex items-center gap-1"><Truck className="h-3 w-3" /> {order.driver}</span>
                              <div className="text-right">
                                <span className="text-xs font-black italic text-primary">{formatCurrency(order.total)}</span>
                              </div>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-white/10 text-white rounded-[2rem] p-8 max-w-lg">
                          <DialogHeader>
                            <div className="flex justify-between items-center mb-4">
                              <DialogTitle className="text-2xl font-black italic text-secondary uppercase tracking-tighter">DETALLE PEDIDO {order.id}</DialogTitle>
                              <Badge className="bg-secondary/20 text-secondary border-none px-3 py-1 font-black text-[10px] uppercase">{order.status}</Badge>
                            </div>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* CLIENT INFO */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Cliente</p>
                                <p className="text-sm font-bold flex items-center gap-2"><Users className="h-3.5 w-3.5 text-secondary" /> {order.customer}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Contacto</p>
                                <p className="text-sm font-bold flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-secondary" /> {order.phone}</p>
                              </div>
                              <div className="col-span-2 space-y-1 pt-2 border-t border-white/5">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Dirección de Entrega</p>
                                <p className="text-sm font-bold flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /> {order.address}</p>
                              </div>
                            </div>

                            {/* ORDER ITEMS */}
                            <div className="space-y-3">
                              <p className="text-[9px] font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                                <Package className="h-4 w-4" /> Desglose de Productos
                              </p>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                    <span className="text-xs font-bold text-gray-300">{item}</span>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* LOGISTICS INFO */}
                            <div className="flex justify-between items-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
                              <div className="space-y-1">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Repartidor</p>
                                <p className="text-sm font-black italic">{order.driver}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Valor Total</p>
                                <p className="text-xl font-black text-primary neon-text-primary">{formatCurrency(order.total)}</p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button className="flex-1 h-12 bg-secondary text-black font-black italic tracking-widest rounded-xl hover:bg-secondary/90">CONTACTAR DRIVER</Button>
                              <Button variant="outline" className="h-12 w-12 rounded-xl border-white/10 hover:bg-white/10"><NavIcon className="h-5 w-5" /></Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
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
                  <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-primary group-hover:neon-glow-primary transition-all">
                    <Users className="h-5 w-5" />
                  </div>
                  <Badge className={`${member.status === 'Online' ? 'bg-green-500/10 text-green-400' : 'bg-secondary/10 text-secondary'} font-black px-3 py-0 text-[10px]`}>{member.status}</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-black italic tracking-tighter uppercase">{member.name}</h3>
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-0.5">Cédula: {member.cedula}</p>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 h-10 bg-white/5 border border-white/10 hover:bg-white/10 font-black italic rounded-lg text-xs">PERFIL</Button>
                  <Button variant="ghost" className="h-10 w-10 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            
            <Dialog>
              <DialogTrigger asChild>
                <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center p-8 space-y-4 hover:bg-white/[0.03] transition-all cursor-pointer group">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-black italic text-sm tracking-tight text-gray-500">NUEVO MIEMBRO</p>
                </div>
              </DialogTrigger>
              <DialogContent className="bg-card border-white/10 text-white rounded-[1.5rem] p-8 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic text-primary uppercase">ALTA DE PERSONAL</DialogTitle>
                  <DialogDescription className="text-gray-500 font-bold text-[10px] uppercase">Registro de nuevo miembro en la flota PartyFlow</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-6">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Nombre Completo</Label>
                    <Input className="bg-white/5 border-white/10 h-11 text-sm" placeholder="Ej: Ricardo Jaramillo" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Rol Operativo</Label>
                    <Select>
                      <SelectTrigger className="bg-white/5 border-white/10 h-11 text-sm">
                        <SelectValue placeholder="Seleccionar rol..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10 text-white">
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="driver">Driver (Repartidor)</SelectItem>
                        <SelectItem value="warehouse">Bodeguero / Almacén</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-gray-500">Cédula de Ciudadanía</Label>
                    <Input className="bg-white/5 border-white/10 h-11 text-sm" placeholder="Documento de identidad" />
                  </div>
                </div>
                <DialogClose asChild>
                  <Button className="w-full h-12 bg-primary font-black italic text-lg mt-6 rounded-lg uppercase neon-glow-primary">REGISTRAR MIEMBRO</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
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
