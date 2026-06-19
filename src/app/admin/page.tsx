
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
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Zap, 
  Loader2, 
  DollarSign,
  Clock,
  Music,
  Upload,
  Play,
  Youtube,
  Save,
  Pause
} from 'lucide-react';

const INITIAL_INVENTORY: Product[] = [
  { id: '1', name: 'Johnnie Walker Black', price: 185000, category: 'Whisky', image: 'https://picsum.photos/seed/whiskey1/400/500' },
  { id: '2', name: 'Don Julio 70', price: 420000, category: 'Tequila', image: 'https://picsum.photos/seed/tequila1/400/500' },
  { id: 'c5', name: 'Combo "Me Bebí Tu Recuerdo"', price: 195000, category: 'Combos VIP', image: 'https://picsum.photos/seed/despecho/400/500', youtubeUrl: 'https://www.youtube.com/watch?v=o302pTudeO4' },
  { id: 'c1', name: 'Combo Pre-Copeo VIP', price: 480000, category: 'Combos', image: 'https://picsum.photos/seed/combo1/400/500', audioUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c35078173b.mp3' },
];

function AdminContent() {
  const { isLoggedIn, role, isInitialized } = useUserRole();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [inventory, setInventory] = useState<Product[]>([]);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  
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

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleUpdateAudio = (id: string, url: string) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          return { ...item, youtubeUrl: url, audioUrl: undefined };
        }
        return { ...item, audioUrl: url, youtubeUrl: undefined };
      }
      return item;
    }));
  };

  const handleSaveAudio = () => {
    localStorage.setItem('partyflow_inventory', JSON.stringify(inventory));
    toast({
      title: "🚀 SINCRONIZACIÓN EXITOSA",
      description: "Los enlaces de YouTube y archivos de audio han sido vinculados al catálogo.",
    });
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
        ytPlayerRef.current.loadVideoById(vid);
        ytPlayerRef.current.playVideo();
      }
    } else if (item.audioUrl && audioRef.current) {
      audioRef.current.src = item.audioUrl;
      audioRef.current.play().catch(() => {});
    }

    toast({
      title: "🎧 VISTA PREVIA ACTIVA",
      description: `Reproduciendo audio de: ${item.name}`,
    });
  };

  if (!isInitialized) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;
  if (!isLoggedIn || role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <StaffNavigation />
      <div id="admin-yt-player" className="hidden"></div>
      <main className="md:pl-16 container mx-auto px-6 py-6 max-w-[1200px] space-y-8 animate-in fade-in duration-500">
        
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              {activeTab === 'dashboard' && <><span className="text-primary neon-text-primary">COMMAND</span> CENTER</>}
              {activeTab === 'inventory' && <><span className="text-secondary neon-text-secondary">STOCK</span> CONTROL</>}
              {activeTab === 'audio' && <><span className="text-primary neon-text-primary">AUDIO</span> STUDIO</>}
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
                  <Music className="h-5 w-5 text-primary" /> SINCRONIZACIÓN MULTIMEDIA VIP
                </CardTitle>
                <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                  Pega enlaces de YouTube o archivos MP3 directos para cada combo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-black/20">
                    <TableRow className="border-white/5">
                      <TableHead className="text-[8px] font-black uppercase p-4">PRODUCTO / COMBO</TableHead>
                      <TableHead className="text-[8px] font-black uppercase p-4">TIPO SOURCE</TableHead>
                      <TableHead className="text-[8px] font-black uppercase p-4">URL (YOUTUBE O MP3)</TableHead>
                      <TableHead className="text-right p-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.filter(i => i.category.toLowerCase().includes('combo') || i.audioUrl || i.youtubeUrl).map((item) => (
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
                          {item.youtubeUrl ? (
                            <Badge className="bg-red-500/10 text-red-500 border-none flex items-center gap-1 text-[8px] font-black uppercase">
                              <Youtube className="h-3 w-3" /> YouTube
                            </Badge>
                          ) : item.audioUrl ? (
                            <Badge className="bg-primary/10 text-primary border-none flex items-center gap-1 text-[8px] font-black uppercase">
                              <Music className="h-3 w-3" /> MP3 / File
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500/10 text-gray-500 border-none text-[8px] font-black uppercase">Vacio</Badge>
                          )}
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="relative group">
                            <Input 
                              className="bg-white/5 border-white/10 h-8 text-[10px] pr-10 font-mono text-gray-400 focus:text-primary transition-all" 
                              defaultValue={item.youtubeUrl || item.audioUrl || ''} 
                              placeholder="YouTube URL o MP3 URL"
                              onBlur={(e) => handleUpdateAudio(item.id, e.target.value)}
                            />
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-600 hover:text-primary">
                              <Upload className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-8 w-8 transition-all ${previewingId === item.id ? 'text-primary scale-125' : 'text-secondary hover:text-primary'}`}
                            onClick={() => togglePreview(item)}
                          >
                            {previewingId === item.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
                 Los enlaces de YouTube se procesan automáticamente para reproducción en hover
               </p>
               <Button 
                onClick={handleSaveAudio}
                className="bg-primary h-12 px-12 rounded-xl font-black italic text-xs tracking-widest neon-glow-primary hover:scale-105 transition-transform"
               >
                 <Save className="mr-2 h-4 w-4" /> GUARDAR CAMBIOS MUSICALES
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
