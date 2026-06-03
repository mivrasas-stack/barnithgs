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
  ChartTooltip, 
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
  Plus,
  Truck,
  Box,
  Edit3,
  Trash2,
  ShieldCheck,
  UserPlus,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

const MOCK_STATS = [
  { name: '10pm', orders: 45 },
  { name: '11pm', orders: 62 },
  { name: '12am', orders: 85 },
  { name: '1am', orders: 55 },
  { name: '2am', orders: 30 },
];

const INITIAL_INVENTORY = [
  { id: '1', name: 'Johnnie Walker Black', stock: 12, category: 'Whisky', price: 185000 },
  { id: '2', name: 'Don Julio 70', stock: 5, category: 'Tequila', price: 420000 },
  { id: '3', name: 'Grey Goose 750ml', stock: 2, category: 'Vodka', price: 210000 },
  { id: '4', name: 'Heineken 6-Pack', stock: 45, category: 'Cerveza', price: 32000 },
  { id: '5', name: 'Hielo (Bolsa 5kg)', stock: 0, category: 'Complementos', price: 15000 },
];

const MOCK_STAFF = [
  { id: 'S1', name: 'Carlos Mendoza', role: 'admin', status: 'Online', lastActive: 'Ahora', cedula: '1020304050' },
  { id: 'S2', name: 'Ana Rodríguez', role: 'driver', status: 'En Entrega', lastActive: '5 min', cedula: '1098765432' },
  { id: 'S3', name: 'Juan Pérez', role: 'warehouse', status: 'Online', lastActive: '12 min', cedula: '1033445566' },
  { id: 'S4', name: 'Luis Martínez', role: 'driver', status: 'Offline', lastActive: '2h', cedula: '1077889900' },
];

export default function AdminPage() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [editingItem, setEditingItem] = useState<any>(null);

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
      title: "¡PRODUCTO ACTUALIZADO!",
      description: "Los cambios han sido aplicados al catálogo en vivo.",
    });
    setEditingItem(null);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "STAFF ACTUALIZADO",
      description: "La información del personal ha sido guardada con éxito.",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <StaffNavigation />
      
      <main className="container mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-700">
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
              <Button variant="outline" className="border-secondary/40 text-secondary hover:bg-secondary/10 font-black italic rounded-xl">
                <Truck className="mr-2 h-4 w-4" /> VISTA DRIVER
              </Button>
            </Link>
            <Link href="/warehouse">
              <Button variant="outline" className="border-secondary/40 text-secondary hover:bg-secondary/10 font-black italic rounded-xl">
                <Box className="mr-2 h-4 w-4" /> VISTA ALMACÉN
              </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 neon-glow-primary font-black italic px-8 rounded-xl">
                  <Plus className="mr-2 h-4 w-4 fill-white" /> NUEVO PRODUCTO
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card/90 border-white/10 glass-morphism text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black italic text-primary">AÑADIR AL ARSENAL</DialogTitle>
                </DialogHeader>
                <form className="space-y-6 pt-6" onSubmit={handleSaveProduct}>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Nombre del Producto</Label>
                      <Input placeholder="Ej. Ron Viejo de Caldas 1L" className="bg-white/5 border-white/10 h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Categoría</Label>
                      <Select>
                        <SelectTrigger className="bg-white/5 border-white/10 h-12">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10 text-white">
                          <SelectItem value="whisky">Whisky</SelectItem>
                          <SelectItem value="ron">Ron</SelectItem>
                          <SelectItem value="cerveza">Cerveza</SelectItem>
                          <SelectItem value="combos">Combos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Precio (COP)</Label>
                      <Input type="number" placeholder="0" className="bg-white/5 border-white/10 h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Stock Inicial</Label>
                      <Input type="number" placeholder="0" className="bg-white/5 border-white/10 h-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Descripción</Label>
                    <Input placeholder="Breve descripción para el cliente" className="bg-white/5 border-white/10 h-12" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full h-14 bg-primary font-black italic text-lg neon-glow-primary rounded-2xl mt-4">GUARDAR PRODUCTO</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="w-full space-y-8" onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 p-1 h-16 rounded-full w-fit mx-auto lg:mx-0 overflow-x-auto no-scrollbar">
            <TabsTrigger value="dashboard" className="rounded-full px-8 font-black italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              DASHBOARD
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-full px-8 font-black italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              INVENTARIO
            </TabsTrigger>
            <TabsTrigger value="catalog" className="rounded-full px-8 font-black italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              CATÁLOGO
            </TabsTrigger>
            <TabsTrigger value="staff" className="rounded-full px-8 font-black italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              PERSONAL
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-full px-8 font-black italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              HISTORIAL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[
                 { title: 'Pedidos Activos', value: '24', icon: ShoppingCart, color: 'text-secondary', bg: 'bg-secondary/10' },
                 { title: 'Ventas de Hoy', value: formatCurrency(8450000), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
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
                       <h4 className="text-2xl font-black italic">{stat.value}</h4>
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
                   {inventory.filter(i => i.stock < 10).map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/40 transition-all">
                        <div>
                          <p className="font-bold text-lg">{item.name}</p>
                          <p className={`text-xs font-black uppercase ${item.stock === 0 ? 'text-destructive' : 'text-accent'}`}>
                            {item.stock === 0 ? 'SIN STOCK' : `${item.stock} UNIDADES`}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="border-accent/50 text-accent hover:bg-accent/10 rounded-xl" onClick={() => setActiveTab('inventory')}>EDITAR</Button>
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
                        {inventory.map((item) => (
                          <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors">
                            <TableCell className="p-6 font-bold text-lg">{item.name}</TableCell>
                            <TableCell className="p-6 font-medium text-gray-400">{item.category}</TableCell>
                            <TableCell className="p-6 font-black text-secondary">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="p-6">
                               <Badge className={`${item.stock < 10 ? 'bg-accent/20 text-accent border-accent/20' : 'bg-green-500/20 text-green-400 border-green-500/20'} font-black rounded-lg px-4`}>
                                 {item.stock} UNID.
                               </Badge>
                            </TableCell>
                            <TableCell className="p-6 text-right">
                               <Button size="sm" variant="ghost" className="hover:bg-primary/10 text-primary font-black rounded-xl">REABASTECER</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="catalog" className="space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {inventory.map((item, idx) => (
                   <Card key={idx} className="bg-white/5 border-white/10 overflow-hidden group hover:border-primary/50 transition-all rounded-[2rem]">
                      <div className="h-40 relative bg-black flex items-center justify-center overflow-hidden">
                         <img src={`https://picsum.photos/seed/catalog-${idx}/300/200`} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform grayscale group-hover:grayscale-0" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                         <Badge className="absolute top-4 right-4 bg-black/60 border-white/10 font-black">{item.category}</Badge>
                      </div>
                      <CardContent className="p-8 space-y-6">
                         <div className="flex justify-between items-start">
                            <h3 className="font-black italic text-xl leading-tight">{item.name}</h3>
                            <span className="text-secondary font-black">{formatCurrency(item.price)}</span>
                         </div>
                         <div className="flex gap-4">
                            <Button size="sm" variant="outline" className="flex-1 border-white/10 hover:bg-white/10 h-12 font-bold rounded-xl uppercase tracking-tighter">OCULTAR</Button>
                            <Dialog>
                               <DialogTrigger asChild>
                                  <Button size="sm" className="flex-1 bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 h-12 font-bold rounded-xl">EDITAR</Button>
                               </DialogTrigger>
                               <DialogContent className="bg-card/95 border-white/10 text-white glass-morphism">
                                  <DialogHeader>
                                     <DialogTitle className="text-2xl font-black italic">EDITAR: {item.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-6 pt-6">
                                     <div className="space-y-2">
                                        <Label className="uppercase text-[10px] font-black text-gray-500">Nuevo Nombre</Label>
                                        <Input defaultValue={item.name} className="bg-white/5 border-white/10 h-14 font-bold" />
                                     </div>
                                     <div className="space-y-2">
                                        <Label className="uppercase text-[10px] font-black text-gray-500">Nuevo Precio (COP)</Label>
                                        <Input type="number" defaultValue={item.price} className="bg-white/5 border-white/10 h-14 font-black text-secondary" />
                                     </div>
                                     <Button className="w-full h-16 bg-primary font-black italic text-lg rounded-2xl neon-glow-primary" onClick={() => toast({ title: "Cambios guardados." })}>
                                        CONFIRMAR CAMBIOS
                                     </Button>
                                  </div>
                               </DialogContent>
                            </Dialog>
                         </div>
                      </CardContent>
                   </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-12">
             <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-3xl font-black italic flex items-center gap-3">
                      <Users className="text-secondary h-8 w-8" /> GESTIÓN DE RUMBEROS STAFF
                   </h2>
                   <p className="text-gray-500 font-medium">Administra el equipo que hace posible la rumba.</p>
                </div>
                <Dialog>
                   <DialogTrigger asChild>
                      <Button className="bg-secondary text-black font-black italic rounded-xl h-12 px-8">
                         <UserPlus className="mr-2 h-5 w-5" /> NUEVO STAFF
                      </Button>
                   </DialogTrigger>
                   <DialogContent className="bg-card/95 border-white/10 text-white glass-morphism">
                      <DialogHeader>
                         <DialogTitle className="text-2xl font-black italic text-secondary">REGISTRAR NUEVO TALENTO</DialogTitle>
                      </DialogHeader>
                      <form className="space-y-6 pt-6" onSubmit={handleSaveStaff}>
                         <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-gray-500">Nombre Completo</Label>
                            <Input placeholder="Ej. Juan Pérez" className="bg-white/5 border-white/10 h-14 font-bold" />
                         </div>
                         <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-gray-500">Número de Cédula</Label>
                            <div className="relative">
                               <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary/40" />
                               <Input placeholder="Ej. 1020304050" className="bg-white/5 border-white/10 h-14 pl-12 font-black tracking-widest" />
                            </div>
                            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Los últimos 4 dígitos serán su PIN de acceso.</p>
                         </div>
                         <div className="space-y-2">
                            <Label className="uppercase text-[10px] font-black text-gray-500">Rol del Sistema</Label>
                            <Select>
                               <SelectTrigger className="bg-white/5 border-white/10 h-14">
                                  <SelectValue placeholder="Seleccionar Rol..." />
                               </SelectTrigger>
                               <SelectContent className="bg-black border-white/10 text-white">
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="driver">Repartidor (Driver)</SelectItem>
                                  <SelectItem value="warehouse">Almacén (Warehouse)</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                         <Button type="submit" className="w-full h-16 bg-secondary text-black font-black italic text-lg rounded-2xl neon-glow-secondary mt-4">
                            FINALIZAR REGISTRO
                         </Button>
                      </form>
                   </DialogContent>
                </Dialog>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {MOCK_STAFF.map((member) => (
                   <Card key={member.id} className="bg-card/40 border-white/10 glass-morphism p-8 rounded-[2.5rem] group hover:border-secondary/50 transition-all">
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-5">
                            <div className="h-20 w-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10">
                               <ShieldCheck className={`h-10 w-10 ${member.role === 'admin' ? 'text-primary' : member.role === 'driver' ? 'text-secondary' : 'text-accent'}`} />
                            </div>
                            <div>
                               <h3 className="text-2xl font-black italic">{member.name}</h3>
                               <div className="flex gap-2 items-center mt-1">
                                 <Badge className="bg-white/10 text-gray-400 font-black uppercase text-[10px]">{member.role}</Badge>
                                 <span className="text-[10px] text-gray-600 font-bold">CC: {member.cedula}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <Badge className={`${member.status === 'Online' || member.status === 'En Entrega' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} font-black rounded-lg mb-1`}>
                               {member.status.toUpperCase()}
                            </Badge>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Activo hace: {member.lastActive}</p>
                         </div>
                      </div>
                      
                      <div className="flex gap-4">
                         <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/10 h-14 font-black rounded-2xl">VER ACTIVIDAD</Button>
                         <Dialog>
                            <DialogTrigger asChild>
                               <Button className="flex-1 bg-white/5 border border-white/10 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/40 h-14 font-black rounded-2xl">
                                  <Edit3 className="mr-2 h-4 w-4" /> EDITAR PERFIL
                               </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card/95 border-white/10 text-white glass-morphism">
                               <DialogHeader>
                                  <DialogTitle className="text-2xl font-black italic">EDITAR STAFF: {member.name}</DialogTitle>
                               </DialogHeader>
                               <div className="space-y-6 pt-6">
                                  <div className="space-y-2">
                                     <Label className="uppercase text-[10px] font-black text-gray-500">Nombre Completo</Label>
                                     <Input defaultValue={member.name} className="bg-white/5 border-white/10 h-14 font-bold" />
                                  </div>
                                  <div className="space-y-2">
                                     <Label className="uppercase text-[10px] font-black text-gray-500">Cédula de Identidad</Label>
                                     <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary/40" />
                                        <Input defaultValue={member.cedula} className="bg-white/5 border-white/10 h-14 pl-12 font-black tracking-widest" />
                                     </div>
                                  </div>
                                  <div className="space-y-2">
                                     <Label className="uppercase text-[10px] font-black text-gray-500">Rol del Sistema</Label>
                                     <Select defaultValue={member.role}>
                                        <SelectTrigger className="bg-white/5 border-white/10 h-14">
                                           <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/10 text-white">
                                           <SelectItem value="admin">Administrador</SelectItem>
                                           <SelectItem value="driver">Repartidor (Driver)</SelectItem>
                                           <SelectItem value="warehouse">Almacén (Warehouse)</SelectItem>
                                        </SelectContent>
                                     </Select>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 pt-4">
                                     <Button variant="destructive" className="h-16 font-black rounded-2xl flex items-center gap-2">
                                        <Trash2 className="h-5 w-5" /> BAJA STAFF
                                     </Button>
                                     <Button className="h-16 bg-secondary text-black font-black italic rounded-2xl neon-glow-secondary" onClick={() => toast({ title: "Cambios guardados." })}>
                                        GUARDAR CAMBIOS
                                     </Button>
                                  </div>
                               </div>
                            </DialogContent>
                         </Dialog>
                      </div>
                   </Card>
                ))}
             </div>
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
                        {[
                          { id: 'ORD-882', user: 'Carlos M.', total: 450000, date: 'Hoy, 01:22 AM', status: 'Completado' },
                          { id: 'ORD-881', user: 'Ana R.', total: 125000, date: 'Hoy, 01:15 AM', status: 'Entregado' },
                          { id: 'ORD-880', user: 'Juan P.', total: 320000, date: 'Ayer, 11:45 PM', status: 'Completado' },
                        ].map((order) => (
                          <TableRow key={order.id} className="border-white/5 hover:bg-white/5">
                            <TableCell className="p-6 font-black text-primary italic">{order.id}</TableCell>
                            <TableCell className="p-6 font-bold">{order.user}</TableCell>
                            <TableCell className="p-6 font-black text-secondary">{formatCurrency(order.total)}</TableCell>
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
        </Tabs>
      </main>
    </div>
  );
}
