
"use client";

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserRole, Product } from '@/lib/store';
import { StaffNavigation } from '@/components/StaffNavigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Zap, 
  Loader2, 
  DollarSign,
  Clock,
  Music,
  Edit3,
  Trash2,
  Save,
  Play,
  Pause,
  Youtube,
  Timer,
  Package,
  Plus,
  Image as ImageIcon,
  Upload,
  Settings2
} from 'lucide-react';

const INITIAL_INVENTORY: Product[] = [
  { id: '1', name: 'Johnnie Walker Black', price: 185000, category: 'Whisky', image: 'https://picsum.photos/seed/whiskey1/400/500' },
  { id: '2', name: 'Don Julio 70', price: 420000, category: 'Tequila', image: 'https://picsum.photos/seed/tequila1/400/500' },
  { id: 'c5', name: 'Combo "Me Bebí Tu Recuerdo"', price: 195000, category: 'Combos VIP', image: 'https://picsum.photos/seed/despecho/400/500', youtubeUrl: 'https://www.youtube.com/watch?v=o302pTudeO4', startTime: 0 },
  { id: 'c1', name: 'Combo Pre-Copeo VIP', price: 480000, category: 'Combos', image: 'https://picsum.photos/seed/combo1/400/500', audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35078173b.mp3', startTime: 0 },
];

function AdminContent() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  
  const [inventory, setInventory] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  
  // State para el modal de asignación de audio
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioStartTime, setAudioStartTime] = useState(0);

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
    const saved = localStorage.getItem('partyflow_inventory');
    if (saved) {
      setInventory(JSON.parse(saved));
    } else {
      setInventory(INITIAL_INVENTORY);
      localStorage.setItem('partyflow_inventory', JSON.stringify(INITIAL_INVENTORY));
    }

    audioRef.current = new Audio();
    audioRef.current.loop = false;

    const initYt = () => {
      if (ytPlayerRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player('admin-yt-player', {
        height: '0',
        width: '0',
        videoId: '',
        events: {
          onReady: () => setYtReady(true)
        }
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

  const handleCreateClick = () => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '',
      price: 0,
      category: 'Licores',
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
      toast({ title: "PRODUCTO ACTUALIZADO", description: `${editingProduct.name} ha sido modificado.` });
    } else {
      updatedInventory = [...inventory, editingProduct];
      toast({ title: "NUEVO PRODUCTO CREADO", description: `${editingProduct.name} añadido al arsenal.` });
    }
    
    handleSaveInventory(updatedInventory);
    setIsEditDialogOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    const updatedInventory = inventory.filter(p => p.id !== id);
    handleSaveInventory(updatedInventory);
    toast({ title: "PRODUCTO ELIMINADO", variant: "destructive" });
  };

  const handleAssignAudio = () => {
    if (!selectedProductId) {
      toast({ title: "ERROR", description: "Selecciona un producto primero.", variant: "destructive" });
      return;
    }

    const isYt = audioUrl.includes('youtube.com') || audioUrl.includes('youtu.be');
    const updated = inventory.map(p => 
      p.id === selectedProductId 
        ? { 
            ...p, 
            youtubeUrl: isYt ? audioUrl : undefined, 
            audioUrl: !isYt ? audioUrl : undefined,
            startTime: audioStartTime
          } 
        : p
    );

    handleSaveInventory(updated);
    setIsAudioModalOpen(false);
    setSelectedProductId("");
    setAudioUrl("");
    setAudioStartTime(0);
    toast({ title: "AUDIO ASIGNADO", description: "La rumba ya tiene banda sonora." });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({ ...editingProduct, image: reader.result as string });
      };
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

  if (!isInitialized) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;
  if (!isLoggedIn || role !== 'admin') return null;

  const isCreating = editingProduct && !inventory.some(p => p.id === editingProduct.id);
  const combos = inventory.filter(p => p.category.toLowerCase().includes('combo'));

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <StaffNavigation />
      <div id="admin-yt-player" className="hidden"></div>
      
      <main className="md:pl-16 container mx-auto px-6 py-6 max-w-[1200px] space-y-8 animate-in fade-in duration-500">
        
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              {activeTab === 'dashboard' && <><span className="text-primary neon-text-primary">COMMAND</span> CENTER</>}
              {activeTab === 'catalog' && <><span className="text-secondary neon-text-secondary">CATALOG</span> CONTROL</>}
              {activeTab === 'audio' && <><span className="text-primary neon-text-primary">AUDIO</span> STUDIO</>}
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[8px] tracking-[0.3em] pl-1">PartyFlow OS v4.0</p>
          </div>
          {activeTab === 'catalog' && (
            <Button 
              className="bg-secondary text-black font-black italic tracking-tighter h-10 px-6 rounded-xl hover:scale-105 transition-all"
              onClick={handleCreateClick}
            >
              <Plus className="mr-2 h-4 w-4" /> NUEVO PRODUCTO
            </Button>
          )}
          {activeTab === 'audio' && (
            <Button 
              className="bg-primary text-white font-black italic tracking-tighter h-10 px-6 rounded-xl hover:scale-105 transition-all neon-glow-primary"
              onClick={() => setIsAudioModalOpen(true)}
            >
              <Music className="mr-2 h-4 w-4" /> ASIGNAR MÚSICA A COMBO
            </Button>
          )}
        </div>

        {activeTab === 'dashboard' && (
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
        )}

        {activeTab === 'catalog' && (
          <Card className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="text-[8px] font-black uppercase p-4">PRODUCTO</TableHead>
                    <TableHead className="text-[8px] font-black uppercase p-4">CATEGORÍA</TableHead>
                    <TableHead className="text-[8px] font-black uppercase p-4">PRECIO</TableHead>
                    <TableHead className="text-right p-4">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                      <TableCell className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg overflow-hidden border border-white/10">
                            <img src={item.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <span className="font-black italic text-xs uppercase">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <Badge variant="outline" className="text-[7px] border-white/10 text-gray-400 uppercase">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="p-4 font-black text-xs text-secondary">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="p-4 text-right space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-primary" onClick={() => handleEditClick(item)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-destructive" onClick={() => handleDeleteProduct(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-6">
            <Card className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="text-[8px] font-black uppercase p-4">PRODUCTO / COMBO</TableHead>
                    <TableHead className="text-[8px] font-black uppercase p-4">URL (YOUTUBE O MP3)</TableHead>
                    <TableHead className="text-[8px] font-black uppercase p-4">INICIO (SEG)</TableHead>
                    <TableHead className="text-right p-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.filter(i => i.category.toLowerCase().includes('combo') || i.audioUrl || i.youtubeUrl).map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="p-4 font-black italic text-xs uppercase">{item.name}</TableCell>
                      <TableCell className="p-4">
                        <Input 
                          className="bg-white/5 border-white/10 h-8 text-[10px] font-mono" 
                          value={item.youtubeUrl || item.audioUrl || ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            const isYt = val.includes('youtube.com') || val.includes('youtu.be');
                            const updated = inventory.map(p => p.id === item.id ? { ...p, youtubeUrl: isYt ? val : undefined, audioUrl: isYt ? undefined : val } : p);
                            handleSaveInventory(updated);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-4">
                        <Input 
                          type="number"
                          className="bg-white/5 border-white/10 h-8 w-20 text-[10px] text-center" 
                          value={item.startTime || 0}
                          onChange={(e) => {
                            const updated = inventory.map(p => p.id === item.id ? { ...p, startTime: parseInt(e.target.value) || 0 } : p);
                            handleSaveInventory(updated);
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <Button variant="ghost" size="icon" className={`h-8 w-8 ${previewingId === item.id ? 'text-primary' : 'text-secondary'}`} onClick={() => togglePreview(item)}>
                          {previewingId === item.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </main>

      {/* MODAL DE CREACIÓN/EDICIÓN DE CATÁLOGO */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2rem] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic tracking-tighter uppercase">
              {isCreating ? 'NUEVO PRODUCTO' : 'EDITAR PRODUCTO'}
            </DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-6 py-4">
              <div 
                className="relative h-48 w-full rounded-2xl overflow-hidden border border-dashed border-white/20 group cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <img src={editingProduct.image} className="w-full h-full object-cover grayscale brightness-50" alt="" />
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                  <Upload className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">CAMBIAR IMAGEN</span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Nombre</Label>
                  <Input 
                    placeholder="Ej. Tequila Patrón"
                    value={editingProduct.name} 
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="bg-white/5 border-white/10 h-10 font-black italic text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Categoría</Label>
                  <Input 
                    placeholder="Ej. Tequila"
                    value={editingProduct.category} 
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="bg-white/5 border-white/10 h-10 font-black italic text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Precio de Venta (COP)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
                  <Input 
                    type="text"
                    placeholder="0"
                    value={editingProduct.price === 0 ? "" : editingProduct.price.toLocaleString('es-CO')} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                      const num = parseInt(val) || 0;
                      setEditingProduct({ ...editingProduct, price: num });
                    }}
                    className="bg-white/5 border-white/10 h-10 pl-10 font-black text-secondary"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl font-black italic text-xs uppercase" onClick={() => setIsEditDialogOpen(false)}>CANCELAR</Button>
            <Button className="bg-primary text-white font-black italic text-xs uppercase rounded-xl px-8 neon-glow-primary" onClick={handleSaveEdit}>
              <Save className="mr-2 h-4 w-4" /> {isCreating ? 'CREAR PRODUCTO' : 'GUARDAR CAMBIOS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE ASIGNACIÓN DE AUDIO */}
      <Dialog open={isAudioModalOpen} onOpenChange={setIsAudioModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2rem] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" /> CONFIGURAR AUDIO DE COMBO
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Seleccionar Combo</Label>
              <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                <SelectTrigger className="bg-white/5 border-white/10 h-12 font-black italic text-xs uppercase">
                  <SelectValue placeholder="ELIGE UN COMBO" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                  {combos.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-black italic text-xs uppercase focus:bg-primary/20">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[8px] font-black uppercase tracking-widest text-gray-500">URL de YouTube o MP3</Label>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input 
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={audioUrl} 
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="bg-white/5 border-white/10 h-12 pl-10 font-black italic text-xs"
                />
              </div>
              <p className="text-[7px] text-gray-500 font-bold uppercase tracking-widest ml-1 italic">Pega un enlace de YouTube o una URL de audio directa.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Segundo de Inicio</Label>
              <div className="relative">
                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
                <Input 
                  type="number"
                  placeholder="0"
                  value={audioStartTime} 
                  onChange={(e) => setAudioStartTime(parseInt(e.target.value) || 0)}
                  className="bg-white/5 border-white/10 h-12 pl-10 font-black text-secondary"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl font-black italic text-xs uppercase" onClick={() => setIsAudioModalOpen(false)}>CANCELAR</Button>
            <Button className="bg-primary text-white font-black italic text-xs uppercase rounded-xl px-8 neon-glow-primary" onClick={handleAssignAudio}>
              <Music className="mr-2 h-4 w-4" /> ASIGNAR SONIDO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
