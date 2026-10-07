"use client";

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserRole, Product } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { createOrUpdateStaffMember, deleteStaffMember } from '@/actions/staff';
import { StaffNavigation } from '@/components/StaffNavigation';
import { AccountingView } from '@/components/AccountingView';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { 
  Users, Zap, Loader2, DollarSign, Clock, Music, Edit3, Trash2, Play, Pause,
  Package, Plus, Upload, Settings2, Disc, Flame, ChevronRight, TrendingUp, BarChart3, History, LogOut, Truck, Box, Calculator, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

const REVENUE_DATA = [
  { time: '18:00', amount: 1200000 },
  { time: '19:00', amount: 2800000 },
  { time: '20:00', amount: 4500000 },
  { time: '21:00', amount: 6800000 },
  { time: '22:00', amount: 10500000 },
  { time: '23:00', amount: 15200000 },
  { time: '00:00', amount: 18450000 },
  { time: '01:00', amount: 14200000 },
  { time: '02:00', amount: 8900000 },
  { time: '03:00', amount: 3500000 }
];

const CATEGORY_DATA = [
  { name: 'Whisky', sales: 45 },
  { name: 'Tequila', sales: 38 },
  { name: 'VIP', sales: 25 },
  { name: 'Aguard.', sales: 60 },
  { name: 'Cerveza', sales: 120 }
];

const INITIAL_INVENTORY: Product[] = [
  { id: '1', name: 'Johnnie Walker Black', price: 185000, category: 'Whisky', image: 'https://picsum.photos/seed/whiskey1/400/500' },
  { id: '2', name: 'Don Julio 70', price: 420000, category: 'Tequila', image: 'https://picsum.photos/seed/tequila1/400/500' },
  { id: 'c5', name: 'Combo "Me Bebí Tu Recuerdo"', price: 195000, category: 'Combos VIP', image: 'https://picsum.photos/seed/despecho/400/500', youtubeUrl: 'https://www.youtube.com/watch?v=o302pTudeO4', startTime: 0 },
  { id: 'c1', name: 'Combo Pre-Copeo VIP', price: 480000, category: 'Combos', image: 'https://picsum.photos/seed/combo1/400/500', audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35078173b.mp3', startTime: 0 },
];

const CATEGORIES_OPTIONS = [
  'Whisky', 'Tequila', 'Vodka', 'Ron', 'Aguardiente', 'Cerveza', 'Ginebra', 
  'Vino', 'Champaña', 'Combos', 'Combos VIP', 'Mezcladores', 'Snacks y Hielo'
];

const ADMIN_SECTIONS = [
  { name: 'Panel de Control', tab: 'dashboard', icon: BarChart3, color: 'text-primary', bgGradient: 'from-primary/20 to-transparent', borderHover: 'hover:border-primary/50', shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(255,42,109,0.3)]', desc: 'Métricas, ingresos y estadísticas' },
  { name: 'Contabilidad', tab: 'accounting', icon: Calculator, color: 'text-green-500', bgGradient: 'from-green-500/20 to-transparent', borderHover: 'hover:border-green-500/50', shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)]', desc: 'Flujo de caja y caja menor' },
  { name: 'Catálogo e Inventario', tab: 'catalog', icon: Package, color: 'text-orange-500', bgGradient: 'from-orange-500/20 to-transparent', borderHover: 'hover:border-orange-500/50', shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)]', desc: 'Gestiona productos y combos VIP' },
  { name: 'Audio Studio', tab: 'audio', icon: Music, color: 'text-blue-400', bgGradient: 'from-blue-400/20 to-transparent', borderHover: 'hover:border-blue-400/50', shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(96,165,250,0.3)]', desc: 'Vincula audios a los combos' },
  { name: 'Entregas', tab: 'deliveries', icon: Zap, color: 'text-green-500', bgGradient: 'from-green-500/20 to-transparent', borderHover: 'hover:border-green-500/50', shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(34,197,94,0.3)]', desc: 'Rastreo y estado de órdenes' },
  { name: 'Equipo Staff', tab: 'staff', icon: Users, color: 'text-purple-400', bgGradient: 'from-purple-400/20 to-transparent', borderHover: 'hover:border-purple-400/50', shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(192,132,252,0.3)]', desc: 'Gestión de roles y accesos' },
  { name: 'Auditoría', tab: 'history', icon: History, color: 'text-red-400', bgGradient: 'from-red-400/20 to-transparent', borderHover: 'hover:border-red-400/50', shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(248,113,113,0.3)]', desc: 'Registro histórico de operaciones' },
  { name: 'App Driver', href: '/driver', icon: Truck, color: 'text-cyan-400', bgGradient: 'from-cyan-400/20 to-transparent', borderHover: 'hover:border-cyan-400/50', shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)]', desc: 'Ingresar a la vista de repartidor' },
  { name: 'App Bodega', href: '/warehouse', icon: Box, color: 'text-yellow-500', bgGradient: 'from-yellow-500/20 to-transparent', borderHover: 'hover:border-yellow-500/50', shadowHover: 'hover:shadow-[0_0_40px_-10px_rgba(234,179,8,0.3)]', desc: 'Ingresar a la vista de almacén' }
];

function AdminContent() {
  const { isLoggedIn, role, isInitialized, logout } = useUserRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'home';
  
  const [inventory, setInventory] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioStartTime, setAudioStartTime] = useState(0);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Background Interactive State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const [ytReady, setYtReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isInitialized && (!isLoggedIn || role !== 'admin')) {
      router.push('/login');
    }
  }, [isInitialized, isLoggedIn, role, router]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('partyflow_inventory');
    if (saved) {
      setInventory(JSON.parse(saved));
    } else {
      setInventory(INITIAL_INVENTORY);
      localStorage.setItem('partyflow_inventory', JSON.stringify(INITIAL_INVENTORY));
    }

    // Fetch Staff from Supabase
    const fetchStaff = async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (data && !error) {
        const formattedStaff = data.map(p => ({
          id: p.id,
          name: p.full_name,
          role: p.role,
          email: p.email || ''
        }));
        setStaffList(formattedStaff);
      } else {
        // Fallback for initial load if DB is empty or disconnected
        const initStaff: any[] = [
        ];
        setStaffList(initStaff);
      }
    };
    fetchStaff();

    audioRef.current = new Audio();
    audioRef.current.loop = false;

    const initYt = () => {
      if (ytPlayerRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player('admin-yt-player', {
        height: '0', width: '0', videoId: '',
        events: { onReady: () => setYtReady(true) }
      });
    };

    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      (window as any).onYouTubeIframeAPIReady = initYt;
    } else {
      initYt();
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const handleSaveInventory = (newInventory: Product[]) => {
    setInventory(newInventory);
    localStorage.setItem('partyflow_inventory', JSON.stringify(newInventory));
  };

  const handleCreateClick = (category = 'Whisky') => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '', price: 0, category: category,
      image: 'https://picsum.photos/seed/new-item/400/500'
    });
    setIsEditDialogOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct({ ...product });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;
    const exists = inventory.find(p => p.id === editingProduct.id);
    let updatedInventory: Product[];
    
    if (exists) {
      updatedInventory = inventory.map(p => p.id === editingProduct.id ? editingProduct : p);
      toast({ title: "Actualizado", description: `${editingProduct.name} guardado correctamente.` });
    } else {
      updatedInventory = [...inventory, editingProduct];
      toast({ title: "Añadido", description: `${editingProduct.name} creado exitosamente.` });
    }
    
    handleSaveInventory(updatedInventory);
    setIsEditDialogOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    const updatedInventory = inventory.filter(p => p.id !== id);
    handleSaveInventory(updatedInventory);
    toast({ title: "Eliminado", variant: "destructive", description: "El ítem ha sido eliminado." });
  };

  const handleSaveStaff = async () => {
    if (!editingStaff) return;
    if (editingStaff.pin.length !== 4) {
      toast({ title: "Error", description: "El PIN debe tener 4 dígitos", variant: "destructive" });
      return;
    }

    // Call Server Action
    const result = await createOrUpdateStaffMember({
      id: editingStaff.id.startsWith('staff-') ? editingStaff.id : editingStaff.id,
      name: editingStaff.name,
      role: editingStaff.role,
      email: editingStaff.email
    });

    if (result.error) {
      toast({ title: "Error al guardar", description: result.error, variant: "destructive" });
      return;
    }

    // Update Local State for immediate UI feedback
    const exists = staffList.find(s => s.id === editingStaff.id);
    let updated: any[];
    if (exists) {
      updated = staffList.map(s => s.id === editingStaff.id ? editingStaff : s);
      toast({ title: "Personal Actualizado" });
    } else {
      updated = [...staffList, editingStaff];
      toast({ title: "Personal Añadido" });
    }
    setStaffList(updated);
    setIsStaffModalOpen(false);
  };

  const handleAssignAudio = () => {
    if (!selectedProductId) {
      toast({ title: "Error", description: "Selecciona un producto.", variant: "destructive" });
      return;
    }

    const isYt = audioUrl.includes('youtube.com') || audioUrl.includes('youtu.be');
    const isSpotify = audioUrl.includes('spotify.com');
    
    const updated = inventory.map(p => 
      p.id === selectedProductId 
        ? { 
            ...p, 
            youtubeUrl: isYt ? audioUrl : undefined, 
            spotifyUrl: isSpotify ? audioUrl : undefined,
            audioUrl: (!isYt && !isSpotify) ? audioUrl : undefined,
            startTime: audioStartTime
          } 
        : p
    );

    handleSaveInventory(updated);
    setIsAudioModalOpen(false);
    setSelectedProductId(""); setAudioUrl(""); setAudioStartTime(0);
    toast({ title: "Audio Asignado", description: "La pista fue vinculada con éxito." });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => setEditingProduct({ ...editingProduct, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const togglePreview = (item: Product) => {
    if (previewingId === item.id) {
      setPreviewingId(null);
      if (audioRef.current) audioRef.current.pause();
      if (ytPlayerRef.current && ytReady) ytPlayerRef.current.stopVideo();
      return;
    }
    setPreviewingId(item.id);
    if (item.youtubeUrl && ytPlayerRef.current && ytReady) {
      const vid = getYoutubeId(item.youtubeUrl);
      if (vid) {
        ytPlayerRef.current.loadVideoById({ videoId: vid, startSeconds: item.startTime || 0 });
        ytPlayerRef.current.playVideo();
      }
    } else if (item.audioUrl && audioRef.current) {
      audioRef.current.src = item.audioUrl;
      audioRef.current.currentTime = item.startTime || 0;
      audioRef.current.play().catch(() => {});
    }
  };

  if (!isInitialized || !isLoggedIn || role !== 'admin') return null;

  const isCreating = editingProduct && !inventory.some(p => p.id === editingProduct.id);
  const products = inventory.filter(p => !p.category.toLowerCase().includes('combo'));
  const combos = inventory.filter(p => p.category.toLowerCase().includes('combo'));

  return (
    <div className="min-h-screen bg-[#020202] text-foreground selection:bg-primary/30 selection:text-primary relative overflow-hidden z-0">
      
      {/* Interactive Background Engine */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        {/* Cursor tracking spotlight */}
        <div 
          className="absolute rounded-full blur-[150px] opacity-40 mix-blend-screen transition-transform duration-1000 ease-out will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(255,42,109,0.4) 0%, rgba(96,165,250,0.1) 60%, transparent 100%)',
            width: '800px',
            height: '800px',
            transform: `translate(${mousePos.x - 400}px, ${mousePos.y - 400}px)`
          }}
        />
        {/* Floating Ambient Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[150px] animate-pulse pointer-events-none duration-1000" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px] animate-pulse pointer-events-none" style={{ animationDelay: '2s', animationDuration: '4s' }} />
        <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] rounded-full bg-yellow-500/5 blur-[120px] pointer-events-none mix-blend-screen animate-bounce" style={{ animationDuration: '8s' }} />
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
      </div>

      {activeTab !== 'home' && <StaffNavigation />}
      <div className="hidden">
        <div id="admin-yt-player"></div>
      </div>
      
      <main className={`${activeTab !== 'home' ? 'md:pl-16 py-8 md:py-12' : 'py-4 md:py-6'} container mx-auto px-4 md:px-8 max-w-[1200px] space-y-6 md:space-y-8 transition-all duration-300 relative z-10`}>
        
        {/* Header - Apple Style (Solo para pestañas internas) */}
        {activeTab !== 'home' && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-4">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
                {activeTab === 'dashboard' && 'Panel de Control'}
                {activeTab === 'catalog' && 'Catálogo e Inventario'}
                {activeTab === 'audio' && 'Estudio de Audio'}
                {activeTab === 'staff' && 'Equipo Staff'}
                {activeTab === 'accounting' && 'Contabilidad'}
                {activeTab === 'deliveries' && 'Gestión de Entregas'}
                {activeTab === 'history' && 'Auditoría del Sistema'}
              </h1>
              <p className="text-sm font-medium text-white/50">
                Administración de PartyFlow
              </p>
            </div>
            
            <div className="flex items-center gap-3">
            {activeTab === 'catalog' && (
            <Button 
              className="apple-btn-primary h-10 px-6 rounded-full font-medium"
              onClick={() => handleCreateClick()}
            >
              <Plus className="mr-2 h-4 w-4" /> Agregar Ítem
            </Button>
          )}
            {activeTab === 'audio' && (
              <Button 
                className="apple-btn-primary h-10 px-6 rounded-full font-medium"
                onClick={() => setIsAudioModalOpen(true)}
              >
                <Music className="mr-2 h-4 w-4" /> Vincular Audio
              </Button>
            )}
            {activeTab === 'staff' && (
              <Button 
                className="apple-btn-primary h-10 px-6 rounded-full font-medium shadow-lg hover:shadow-primary/20"
                onClick={() => {
                  setIsStaffModalOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Agregar Personal
              </Button>
            )}
            </div>
          </div>
        )}

        {/* Home Hub - Premium UI */}
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 relative">
            
            {/* Giant Welcome Hero */}
            <div className="relative py-6 lg:py-8 flex flex-col items-start space-y-6">
               <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
               <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
               
               <div className="w-full flex justify-between items-center relative z-20">
                 <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-xl shadow-2xl">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                    Sistema Operativo En Línea
                 </div>
                 
                 <Button 
                    variant="outline"
                    className="h-8 px-4 rounded-full font-medium border-white/10 bg-black/40 backdrop-blur-md text-white/70 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all duration-300 text-xs"
                    onClick={() => {
                      logout();
                      router.push('/');
                    }}
                  >
                    <LogOut className="mr-2 h-3 w-3" /> Cerrar Sesión
                  </Button>
               </div>
               
               <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[1.05]">
                 Bienvenido,<br/>
                 <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient-x">Administrador.</span>
               </h1>
               
               <p className="text-base md:text-xl text-white/50 max-w-3xl font-medium leading-relaxed tracking-wide">
                 Tienes el control total de la operación. Supervisa métricas, gestiona el inventario y audita el rendimiento en tiempo real.
               </p>
               
               <div className="pt-2 flex flex-wrap gap-3 relative z-10">
                  <Button 
                    className="h-12 px-6 rounded-full font-bold bg-white text-black hover:bg-white/90 hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] text-sm"
                    onClick={() => router.push('/homeadmin?tab=dashboard')}
                  >
                    <Activity className="mr-2 h-4 w-4" /> Ver Rendimiento
                  </Button>
               </div>
            </div>

            {/* Modules List Layout (No Bento Boxes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 relative z-10">
              {ADMIN_SECTIONS.map((sec, i) => (
                <div 
                  key={i}
                  onClick={() => router.push(sec.href ? sec.href : `/homeadmin?tab=${sec.tab}`)}
                  className={`group relative flex items-center gap-4 p-4 md:p-5 rounded-[1.25rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-500 cursor-pointer overflow-hidden ${sec.borderHover}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${sec.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none`} />
                  
                  <div className={`relative z-10 flex items-center justify-center h-12 w-12 min-w-12 rounded-xl bg-black/50 border border-white/10 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ${sec.color}`}>
                     <sec.icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
                  </div>
                  
                  <div className="relative z-10 flex-1 space-y-1">
                     <h3 className="text-lg md:text-xl font-bold text-white/90 group-hover:text-white transition-colors tracking-tight leading-tight">{sec.name}</h3>
                     <p className="text-xs text-white/40 group-hover:text-white/70 transition-colors line-clamp-1 md:line-clamp-2 leading-relaxed">{sec.desc}</p>
                  </div>

                  <div className="relative z-10 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-white/30 group-hover:text-white">
                     <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Módulo de Entregas (Placeholder) */}
        {activeTab === 'deliveries' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                <Truck className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Monitor de Entregas</h2>
              <p className="text-white/50 max-w-md mx-auto mb-8">
                Aquí podrás visualizar en tiempo real (mapa y estado) todas las órdenes activas, asignar repartidores y gestionar las rutas.
              </p>
              <Button disabled variant="outline" className="border-white/10 bg-white/5">
                Próximamente...
              </Button>
            </Card>
          </div>
        )}

        {/* Módulo de Auditoría (Placeholder) */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <History className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Registro de Auditoría</h2>
              <p className="text-white/50 max-w-md mx-auto mb-8">
                Historial completo de todas las acciones del sistema. Eliminaciones, ediciones de inventario, y registros de acceso del personal.
              </p>
              <Button disabled variant="outline" className="border-white/10 bg-white/5">
                Próximamente...
              </Button>
            </Card>
          </div>
        )}

        {/* Dashboard KPIs */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Ingresos Hoy', value: formatCurrency(18450000), trend: '+22.4% vs ayer', icon: DollarSign, color: 'text-primary' },
                { label: 'Órdenes Activas', value: '38', trend: 'Pico esperado en 00:00', icon: Zap, color: 'text-orange-500' },
                { label: 'Promedio Entrega', value: '14 min', trend: '-4 min mejora', icon: Clock, color: 'text-green-500' },
                { label: 'Personal Online', value: '12', trend: 'Capacidad óptima', icon: Users, color: 'text-blue-400' },
              ].map((kpi, i) => (
                <Card key={i} className="apple-card overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white/60">{kpi.label}</p>
                        <h4 className="text-2xl font-semibold tracking-tight text-white">{kpi.value}</h4>
                      </div>
                      <div className={`p-2 rounded-full bg-white/5 ${kpi.color}`}>
                        <kpi.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-white/40">
                      <TrendingUp className="h-3 w-3 text-green-400" />
                      <span>{kpi.trend}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="apple-card lg:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" /> 
                        Ingresos por Hora
                      </h3>
                      <p className="text-sm text-white/50">Tendencia de ventas durante la jornada actual</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis 
                          stroke="#ffffff50" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `$${value / 1000000}M`}
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#000000ee', borderRadius: '12px', border: '1px solid #ffffff20', color: '#fff' }}
                          itemStyle={{ color: '#fff', fontWeight: 500 }}
                          formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="apple-card">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-orange-500" />
                      Ventas por Categoría
                    </h3>
                    <p className="text-sm text-white/50">Distribución de volumen</p>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#ffffff90" fontSize={12} tickLine={false} axisLine={false} width={80} />
                        <RechartsTooltip 
                          cursor={{fill: '#ffffff10'}}
                          contentStyle={{ backgroundColor: '#000000ee', borderRadius: '12px', border: '1px solid #ffffff20', color: '#fff' }}
                          formatter={(value: number) => [`${value} órdenes`, 'Cantidad']}
                        />
                        <Bar dataKey="sales" fill="#ffffff" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'accounting' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <Calculator className="h-8 w-8 text-green-500" />
              <h2 className="text-3xl font-black tracking-tighter">Contabilidad y Caja</h2>
            </div>
            <AccountingView />
          </div>
        )}

        {/* Catalog */}
        {activeTab === 'catalog' && (
          <div className="space-y-10">
            {/* Combos VIP */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" /> VIP Combos
              </h2>
              <div className="apple-frost rounded-3xl overflow-x-auto">
                <Table>
                  <TableHeader className="bg-black/20">
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="text-xs font-medium text-white/50 h-12">Producto</TableHead>
                      <TableHead className="text-xs font-medium text-white/50 h-12">Categoría</TableHead>
                      <TableHead className="text-xs font-medium text-white/50 h-12">Precio</TableHead>
                      <TableHead className="text-right text-xs font-medium text-white/50 h-12">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combos.map((item) => (
                      <TableRow key={item.id} className="border-b border-white/5 apple-hover">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <img src={item.image} className="w-10 h-10 rounded-lg object-cover bg-white/5" alt="" />
                            <span className="font-medium text-sm text-white">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="secondary" className="bg-white/10 text-white/80 font-medium hover:bg-white/20 border-0">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="py-4 font-medium text-sm text-white/90">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white rounded-full" onClick={() => handleEditClick(item)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-red-400 rounded-full" onClick={() => handleDeleteProduct(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* General Products */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-red-500" /> Ítems Generales
              </h2>
              <div className="apple-frost rounded-3xl overflow-x-auto">
                <Table>
                  <TableHeader className="bg-black/20">
                    <TableRow className="border-b border-white/10 hover:bg-transparent">
                      <TableHead className="text-xs font-medium text-white/50 h-12">Producto</TableHead>
                      <TableHead className="text-xs font-medium text-white/50 h-12">Categoría</TableHead>
                      <TableHead className="text-xs font-medium text-white/50 h-12">Precio</TableHead>
                      <TableHead className="text-right text-xs font-medium text-white/50 h-12">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((item) => (
                      <TableRow key={item.id} className="border-b border-white/5 apple-hover">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <img src={item.image} className="w-10 h-10 rounded-lg object-cover bg-white/5" alt="" />
                            <span className="font-medium text-sm text-white">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="secondary" className="bg-white/10 text-white/80 font-medium hover:bg-white/20 border-0">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="py-4 font-medium text-sm text-white/90">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white rounded-full" onClick={() => handleEditClick(item)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-red-400 rounded-full" onClick={() => handleDeleteProduct(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Audio Studio */}
        {activeTab === 'audio' && (
          <div className="space-y-6">
            <div className="apple-frost rounded-3xl overflow-x-auto">
              <Table>
                <TableHeader className="bg-black/20">
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-white/50 h-12">Ítem</TableHead>
                    <TableHead className="text-xs font-medium text-white/50 h-12">Fuente de Audio</TableHead>
                    <TableHead className="text-xs font-medium text-white/50 h-12 w-28">Inicio (s)</TableHead>
                    <TableHead className="text-right h-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.filter(i => i.category.toLowerCase().includes('combo') || i.audioUrl || i.youtubeUrl).map((item) => (
                    <TableRow key={item.id} className="border-b border-white/5 apple-hover">
                      <TableCell className="py-4">
                        <span className="font-medium text-sm text-white">{item.name}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Input 
                          className="bg-black/20 border-white/10 h-9 text-xs font-mono text-white/80 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg" 
                          value={item.youtubeUrl || item.audioUrl || ''} 
                          placeholder="Paste URL..."
                          onChange={(e) => {
                            const val = e.target.value;
                            const isYt = val.includes('youtube.com') || val.includes('youtu.be');
                            const updated = inventory.map(p => p.id === item.id ? { 
                              ...p, youtubeUrl: isYt ? val : undefined, audioUrl: !isYt ? val : undefined 
                            } : p);
                            handleSaveInventory(updated);
                          }}
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <Input 
                          type="number"
                          className="bg-black/20 border-white/10 h-9 text-xs font-medium focus:border-primary focus:ring-1 focus:ring-primary rounded-lg" 
                          value={item.startTime || 0}
                          onChange={(e) => {
                            const updated = inventory.map(p => p.id === item.id ? { ...p, startTime: parseInt(e.target.value) || 0 } : p);
                            handleSaveInventory(updated);
                          }}
                        />
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={`h-9 w-9 rounded-full ${previewingId === item.id ? 'bg-primary text-white hover:bg-primary/80' : 'text-white/60 hover:text-white hover:bg-white/10'}`} 
                          onClick={() => togglePreview(item)}
                        >
                          {previewingId === item.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Equipo Staff */}
        {activeTab === 'staff' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="apple-frost rounded-3xl overflow-x-auto shadow-xl">
              <Table>
                <TableHeader className="bg-black/20">
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-white/50 h-12">Nombre y Apellido</TableHead>
                    <TableHead className="text-xs font-medium text-white/50 h-12">Rol / Puesto</TableHead>
                    <TableHead className="text-xs font-medium text-white/50 h-12">PIN de Acceso</TableHead>
                    <TableHead className="text-right h-12 text-xs font-medium text-white/50">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((member) => (
                    <TableRow key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-bold text-white shadow-inner">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm text-white">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className={`border-0 uppercase text-[10px] tracking-widest ${
                          member.role === 'admin' ? 'bg-primary/20 text-primary' : 
                          member.role === 'driver' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {member.role === 'admin' ? 'Administrador' : member.role === 'driver' ? 'Repartidor' : 'Almacén'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="bg-black/40 px-3 py-1.5 rounded-lg w-fit font-mono text-sm text-white/70 tracking-widest border border-white/5 shadow-inner">
                          {member.pin}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white rounded-full bg-white/5 hover:bg-white/10" onClick={() => {
                            setEditingStaff(member);
                            setIsStaffModalOpen(true);
                          }}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-red-400 rounded-full bg-white/5 hover:bg-red-500/10" onClick={async () => {
                            const res = await deleteStaffMember(member.id);
                            if (res.error) {
                              toast({ title: "Error", description: res.error, variant: "destructive" });
                              return;
                            }
                            const updated = staffList.filter(s => s.id !== member.id);
                            setStaffList(updated);
                            toast({ title: "Personal Eliminado", variant: "destructive" });
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>

      {/* Modal Staff */}
      <Dialog open={isStaffModalOpen} onOpenChange={setIsStaffModalOpen}>
        <DialogOverlay className="bg-black/60 backdrop-blur-md" />
        <DialogContent className="apple-frost border-white/10 text-white rounded-[2rem] max-w-md p-8 shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-center">
              {editingStaff?.name ? 'Editar Personal' : 'Nuevo Personal'}
            </DialogTitle>
          </DialogHeader>
          
          {editingStaff && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Nombre y Apellido</Label>
                <Input 
                  value={editingStaff.name} 
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="bg-black/40 border-white/10 h-12 rounded-xl px-4 font-medium text-base focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
                  placeholder="Ej: Carlos Ramírez"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Email (Para verificación OTP)</Label>
                <Input 
                  type="email"
                  value={editingStaff.email} 
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                  className="bg-black/40 border-white/10 h-12 rounded-xl px-4 font-medium text-base focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
                  placeholder="ejemplo@partyflow.app"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white/70 uppercase tracking-wider">Rol de Acceso</Label>
                <Select value={editingStaff.role} onValueChange={(val) => setEditingStaff({ ...editingStaff, role: val })}>
                  <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl px-4 font-medium text-base focus:border-primary focus:ring-1 focus:ring-primary shadow-inner">
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                    <SelectItem value="admin">Administrador Total</SelectItem>
                    <SelectItem value="driver">App Driver (Repartidor)</SelectItem>
                    <SelectItem value="warehouse">App Bodega (Almacén)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white/70 uppercase tracking-wider">PIN (4 Dígitos)</Label>
                <Input 
                  type="text"
                  maxLength={4}
                  value={editingStaff.pin} 
                  className="bg-black/40 border-white/10 h-12 rounded-xl px-4 font-mono text-lg text-center tracking-[0.5em] focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
                  placeholder="1234"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
            <Button variant="ghost" className="rounded-xl font-bold text-sm hover:bg-white/10 h-12" onClick={() => setIsStaffModalOpen(false)}>
              CANCELAR
            </Button>
            <Button className="apple-btn-primary rounded-xl h-12 font-bold text-sm shadow-lg hover:shadow-primary/30" onClick={handleSaveStaff}>
              GUARDAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Edit/Create - Apple Style */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogOverlay className="bg-black/60 backdrop-blur-md" />
        <DialogContent className="apple-frost-heavy border-white/10 text-white rounded-[2rem] max-w-md p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight text-center">
              {isCreating ? 'Nuevo Ítem' : 'Editar Ítem'}
            </DialogTitle>
          </DialogHeader>
          
          {editingProduct && (
            <div className="space-y-5">
              <div 
                className="relative h-48 w-full rounded-2xl overflow-hidden bg-black/40 cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <img src={editingProduct.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="" />
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-white/50">Nombre</Label>
                  <Input 
                    value={editingProduct.name} 
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="bg-black/20 border-white/10 h-11 rounded-xl px-3 font-medium text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-white/50">Categoría</Label>
                    <Select value={editingProduct.category} onValueChange={(val) => setEditingProduct({ ...editingProduct, category: val })}>
                      <SelectTrigger className="bg-black/20 border-white/10 h-11 rounded-xl px-3 font-medium text-sm focus:border-primary focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="apple-frost border-white/10 text-white rounded-xl">
                        {CATEGORIES_OPTIONS.map((cat) => (
                          <SelectItem key={cat} value={cat} className="font-medium text-sm focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-white/50">Precio (COP)</Label>
                    <Input 
                      type="text"
                      value={editingProduct.price === 0 ? "" : editingProduct.price.toLocaleString('es-CO')} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                        const num = parseInt(val) || 0;
                        setEditingProduct({ ...editingProduct, price: num });
                      }}
                      className="bg-black/20 border-white/10 h-11 rounded-xl px-3 font-medium text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-3 sm:justify-between">
            <Button variant="ghost" className="rounded-xl font-medium text-sm hover:bg-white/10 h-11" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="apple-btn-primary rounded-xl h-11 font-medium text-sm" onClick={handleSaveEdit}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Audio - Apple Style */}
      <Dialog open={isAudioModalOpen} onOpenChange={setIsAudioModalOpen}>
        <DialogOverlay className="bg-black/60 backdrop-blur-md" />
        <DialogContent className="apple-frost-heavy border-white/10 text-white rounded-[2rem] max-w-md p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight text-center">
              Vincular Audio
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-white/50">Ítem Destino</Label>
              <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                <SelectTrigger className="bg-black/20 border-white/10 h-11 rounded-xl px-3 font-medium text-sm focus:border-primary focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Selecciona un Combo o Producto" />
                </SelectTrigger>
                <SelectContent className="apple-frost border-white/10 text-white rounded-xl">
                  {inventory.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-medium text-sm focus:bg-white/10 focus:text-white cursor-pointer rounded-lg mx-1 my-0.5">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-white/50">Audio URL</Label>
              <Input 
                placeholder="https://youtube.com/..."
                value={audioUrl} 
                onChange={(e) => setAudioUrl(e.target.value)}
                className="bg-black/20 border-white/10 h-11 rounded-xl px-3 font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-white/50">Tiempo de Inicio (s)</Label>
              <Input 
                type="number"
                value={audioStartTime} 
                onChange={(e) => setAudioStartTime(parseInt(e.target.value) || 0)}
                className="bg-black/20 border-white/10 h-11 rounded-xl px-3 font-medium text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-3 sm:justify-between">
            <Button variant="ghost" className="rounded-xl font-medium text-sm hover:bg-white/10 h-11" onClick={() => setIsAudioModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="apple-btn-primary rounded-xl h-11 font-medium text-sm" onClick={handleAssignAudio}>
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminFallback() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 text-white/50 animate-spin" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminContent />
    </Suspense>
  );
}
