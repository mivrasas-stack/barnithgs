
"use client";

import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useUserRole } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Truck, 
  Box, 
  LogOut,
  ShieldCheck,
  Bell,
  Home,
  Menu,
  Zap,
  ChevronRight,
  Package,
  Users,
  History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger
} from '@/components/ui/sheet';
import { useState } from 'react';

export function StaffNavigation() {
  const { role, isLoggedIn, logout } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isLoggedIn) return null;

  const adminSubItems = [
    { name: 'Dashboard', tab: 'dashboard', icon: LayoutDashboard, desc: 'Métricas en tiempo real' },
    { name: 'Inventario', tab: 'inventory', icon: Box, desc: 'Control de existencias' },
    { name: 'Catálogo', tab: 'catalog', icon: Package, desc: 'Gestión de tienda' },
    { name: 'Personal', tab: 'staff', icon: Users, desc: 'Gestión de equipo' },
    { name: 'Historial', tab: 'history', icon: History, desc: 'Bitácora de auditoría' },
  ];

  const mainNavItems = [
    { name: 'Entregas', href: '/driver', icon: Truck, roles: ['driver', 'admin'], desc: 'Rutas activas' },
    { name: 'Almacén', href: '/warehouse', icon: Box, roles: ['warehouse', 'admin'], desc: 'Gestión de empaque' },
  ];

  return (
    <div className="sticky top-0 z-50 w-full border-b border-white/10 glass-morphism">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        
        <div className="flex items-center gap-6">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/20 neon-glow-secondary group">
                <Menu className="h-6 w-6 group-hover:rotate-90 transition-transform" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-card/95 border-r border-white/10 text-white glass-morphism w-[350px] p-0 overflow-y-auto no-scrollbar">
              <div className="flex flex-col min-h-full">
                <SheetHeader className="p-8 border-b border-white/5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 bg-secondary/20 rounded-2xl flex items-center justify-center neon-glow-secondary">
                      <ShieldCheck className="h-7 w-7 text-secondary" />
                    </div>
                    <SheetTitle className="text-2xl font-black italic tracking-tighter text-white">
                      COMMAND <span className="text-secondary">CENTER</span>
                    </SheetTitle>
                  </div>
                  <Badge variant="outline" className="w-fit border-secondary text-secondary font-black px-4 py-1">
                    SESIÓN: {role.toUpperCase()}
                  </Badge>
                </SheetHeader>

                <div className="flex-1 p-6 space-y-8">
                  {/* SECCIÓN ADMINISTRATIVA (Solo si es Admin) */}
                  {role === 'admin' && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2">Gestión de Control</p>
                      {adminSubItems.map((item) => (
                        <Link key={item.tab} href={`/admin?tab=${item.tab}`} onClick={() => setIsOpen(false)}>
                          <div className={`flex items-center gap-4 p-5 rounded-[1.5rem] border transition-all group ${
                            pathname === '/admin' && activeTab === item.tab
                            ? 'bg-primary/10 border-primary/40 text-primary' 
                            : 'bg-white/5 border-transparent hover:border-white/20 text-gray-400 hover:text-white'
                          }`}>
                            <item.icon className={`h-6 w-6 ${pathname === '/admin' && activeTab === item.tab ? 'neon-glow-primary' : ''}`} />
                            <div className="flex-1">
                              <p className="font-black italic text-lg tracking-tight uppercase leading-none">{item.name}</p>
                              <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 tracking-wider">{item.desc}</p>
                            </div>
                            <ChevronRight className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${pathname === '/admin' && activeTab === item.tab ? 'opacity-100' : ''}`} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* SECCIÓN OPERATIVA */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-2">Operaciones en Campo</p>
                    {mainNavItems.filter(item => item.roles.includes(role)).map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                        <div className={`flex items-center gap-4 p-5 rounded-[1.5rem] border transition-all group ${
                          pathname === item.href 
                          ? 'bg-secondary/10 border-secondary/40 text-secondary' 
                          : 'bg-white/5 border-transparent hover:border-white/20 text-gray-400 hover:text-white'
                        }`}>
                          <item.icon className={`h-6 w-6 ${pathname === item.href ? 'neon-glow-secondary' : ''}`} />
                          <div className="flex-1">
                            <p className="font-black italic text-lg tracking-tight uppercase leading-none">{item.name}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 tracking-wider">{item.desc}</p>
                          </div>
                          <ChevronRight className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity ${pathname === item.href ? 'opacity-100' : ''}`} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="p-8 border-t border-white/5 space-y-4">
                  <Link href="/" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full h-14 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 justify-start gap-4 font-bold">
                      <Home className="h-5 w-5" /> VISTA PÚBLICA
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout} 
                    className="w-full h-14 rounded-2xl text-destructive hover:bg-destructive/10 justify-start gap-4 font-black italic"
                  >
                    <LogOut className="h-5 w-5" /> CERRAR SESIÓN
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href={role === 'admin' ? '/admin' : `/${role}`} className="flex items-center gap-3">
             <span className="text-xl font-black tracking-tighter text-white uppercase italic">
                PORTAL<span className="text-secondary">STAFF</span>
             </span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end -space-y-1">
             <span className="text-[10px] font-black text-secondary tracking-widest uppercase">Sistema Activo</span>
             <span className="text-xs font-bold text-gray-500 uppercase">{role}</span>
          </div>

          <div className="h-8 w-[1px] bg-white/10" />

          <Button variant="ghost" size="icon" className="h-12 w-12 hover:bg-white/5 relative group">
            <Bell className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
            <span className="absolute top-3 right-3 h-2 w-2 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
          </Button>

          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
