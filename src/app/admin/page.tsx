
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserRole, Product } from '@/lib/store';
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
  DollarSign,
  Search,
  MapPin,
  Clock,
  Zap,
  Navigation as NavIcon,
  ChevronRight,
  Phone,
  Package,
  History,
  Upload,
  Music,
  Play
} from 'lucide-react';

const MOCK_STATS = [
  { name: '18:00', orders: 15, revenue: 1200000 },
  { name: '20:00', orders: 32, revenue: 2800000 },
  { name: '22:00', orders: 85, revenue: 7400000 },
  { name: '00:00', orders: 124, revenue: 11200000 },
  { name: '02:00', orders: 65, revenue: 5800000 },
];

const INITIAL_INVENTORY = [
  { id: '1', name: 'Johnnie Walker Black 750ml', stock: 12, category: 'whisky', price: 185000, cost: 130000, minStock: 5, image: 'https://picsum.photos/seed/1/400/500' },
  { id: '2', name: 'Aguardiente Antioqueño 750ml', stock: 24, category: 'aguardiente', price: 65000, cost: 42000, minStock: 10, image: 'https://picsum.photos/seed/2/400/500' },
  { id: 'c5', name: 'Combo "Me Bebí Tu Recuerdo"', price: 195000, category: 'Combos VIP', image: 'https://picsum.photos/seed/despecho/400/500', audioUrl: 'https://cdn.pixabay.com/audio/2022/10/24/audio_985532d5e2.mp3' },
];

function AdminContent() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isInitialized && (!isLoggedIn || role !== 'admin')) {
      router.push('/login');
    }
  }, [isInitialized, isLoggedIn, role, router]);

  if (!isInitialized) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;
  if (!isLoggedIn || role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <StaffNavigation />
      <main className="md:pl-16 container mx-auto px-6 py-6 max-w-[1200px] space-y-8 animate-in fade-in duration-500">
        
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              {activeTab === 'dashboard' && <><span className="text-primary neon-text-primary">COMMAND</span> CENTER</>}
              {activeTab === 'inventory' && <><span className="text-secondary neon-text-secondary">STOCK</span> CONTROL</>}
              {activeTab === 'audio' && <><span className="text-primary neon-text-primary">AUDIO</span> STUDIO</>}
              {activeTab === 'staff' && <><span className="text-primary neon-text-primary">STAFF</span> ROSTER</>}
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[8px] tracking-[0.3em] pl-1">PartyFlow OS v4.0</p>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Ingresos Hoy', value: formatCurrency(12450000), trend: '+14%', icon: DollarSign, color: 'text-primary' },
                { label: 'Ventas Live', value: '142', trend: 'Pico: 00:00', icon: Zap, color: 'text-secondary' },
                { label: 'Entregas', value: '18 min', trend: '-2 min', icon: Clock, color: 'text-green-400' },
                { label: 'Staff Online', value: '8', trend: 'Activos', icon: Users, color: 'text-accent' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2 hover:border-white/10 transition-all">
                  <div className="flex justify-between">
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    <span className="text-[8px] font-black text-gray-600 uppercase">{kpi.trend}</span>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{kpi.label}</p>
                    <h4 className="text-xl font-black italic tracking-tighter">{kpi.value}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-white/5 p-6 border-b border-white/5">
                <CardTitle className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-2">
                  <Music className="h-5 w-5 text-primary" /> SINCRONIZACIÓN DE AUDIO VIP
                </CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                  Asigna bandas sonoras exclusivas a cada combo del catálogo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-black/20">
                    <TableRow className="border-white/5">
                      <TableHead className="text-[8px] font-black uppercase p-4">PRODUCTO / COMBO</TableHead>
                      <TableHead className="text-[8px] font-black uppercase p-4">ESTADO AUDIO</TableHead>
                      <TableHead className="text-[8px] font-black uppercase p-4">URL SOURCE (.MP3)</TableHead>
                      <TableHead className="text-right p-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.filter(i => i.category.toLowerCase().includes('combo') || i.audioUrl).map((item) => (
                      <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg overflow-hidden border border-white/10">
                              <img src={item.image} className="w-full h-full object-cover grayscale" alt="" />
                            </div>
                            <div>
                              <p className="font-black italic text-xs uppercase">{item.name}</p>
                              <Badge className="text-[7px] bg-white/5 text-gray-500 border-none uppercase">{item.category}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <Badge className={item.audioUrl ? "bg-primary/10 text-primary" : "bg-gray-500/10 text-gray-500"}>
                            {item.audioUrl ? 'CANCION VINCULADA' : 'SIN AUDIO'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="relative group">
                            <Input 
                              className="bg-white/5 border-white/10 h-8 text-[10px] pr-10 font-mono text-gray-400 focus:text-primary transition-all" 
                              defaultValue={item.audioUrl || ''} 
                              placeholder="https://servidor.com/musica.mp3"
                            />
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-600 hover:text-primary">
                              <Upload className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary">
                            <Play className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="p-6 bg-primary/5 border border-dashed border-primary/20 rounded-3xl text-center space-y-3">
               <Music className="h-8 w-8 text-primary mx-auto opacity-50" />
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                 Los cambios en el Studio de Audio se reflejan instantáneamente en el catálogo público
               </p>
               <Button className="bg-primary h-10 px-8 rounded-xl font-black italic text-xs tracking-widest neon-glow-primary">
                 GUARDAR CAMBIOS MUSICALES
               </Button>
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
