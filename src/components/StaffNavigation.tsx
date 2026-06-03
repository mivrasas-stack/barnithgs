
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
  Home,
  Zap,
  ChevronRight,
  ChevronLeft,
  Package,
  Users,
  History,
  MapPin
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function StaffNavigation() {
  const { role, isLoggedIn, logout } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isLoggedIn) return null;

  const adminSubItems = [
    { name: 'Dashboard', tab: 'dashboard', icon: LayoutDashboard },
    { name: 'Inventario', tab: 'inventory', icon: Box },
    { name: 'Entregas', tab: 'deliveries', icon: MapPin },
    { name: 'Catálogo', tab: 'catalog', icon: Package },
    { name: 'Personal', tab: 'staff', icon: Users },
    { name: 'Historial', tab: 'history', icon: History },
  ];

  const mainNavItems = [
    { name: 'Vista Driver', href: '/driver', icon: Truck, roles: ['driver', 'admin'] },
    { name: 'Vista Almacén', href: '/warehouse', icon: Box, roles: ['warehouse', 'admin'] },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen z-50 transition-all duration-300 border-r border-white/10 glass-morphism flex flex-col hidden md:flex",
          isExpanded ? "w-64" : "w-20"
        )}
      >
        {/* Header / Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-white/5 h-20 overflow-hidden">
          <div className="shrink-0 h-12 w-12 bg-secondary/20 rounded-2xl flex items-center justify-center neon-glow-secondary">
            <ShieldCheck className="h-7 w-7 text-secondary" />
          </div>
          {isExpanded && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="text-sm font-black italic tracking-tighter text-white leading-none">COMMAND</p>
              <p className="text-xs font-bold text-secondary uppercase tracking-widest">CENTER</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
          
          {/* Admin Items */}
          {role === 'admin' && (
            <div className="px-3 space-y-2">
              {isExpanded && <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-3 mb-4">Control</p>}
              {adminSubItems.map((item) => (
                <Tooltip key={item.tab}>
                  <TooltipTrigger asChild>
                    <Link href={`/admin?tab=${item.tab}`}>
                      <div className={cn(
                        "flex items-center gap-4 p-3 rounded-xl transition-all group cursor-pointer",
                        pathname === '/admin' && activeTab === item.tab
                        ? 'bg-primary/10 text-primary' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      )}>
                        <item.icon className={cn(
                          "h-6 w-6 shrink-0 transition-all",
                          pathname === '/admin' && activeTab === item.tab ? 'neon-text-primary' : 'group-hover:scale-110'
                        )} />
                        {isExpanded && (
                          <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
                            <p className="font-black italic text-sm uppercase tracking-tight">{item.name}</p>
                          </div>
                        )}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  {!isExpanded && <TooltipContent side="right" className="bg-black border-white/10 font-bold uppercase text-[10px] tracking-widest">{item.name}</TooltipContent>}
                </Tooltip>
              ))}
            </div>
          )}

          {/* Operational Items */}
          <div className="px-3 space-y-2">
            {isExpanded && <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-3 mb-4">Operaciones</p>}
            {mainNavItems.filter(item => item.roles.includes(role)).map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div className={cn(
                      "flex items-center gap-4 p-3 rounded-xl transition-all group cursor-pointer",
                      pathname === item.href 
                      ? 'bg-secondary/10 text-secondary' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}>
                      <item.icon className={cn(
                        "h-6 w-6 shrink-0 transition-all",
                        pathname === item.href ? 'neon-text-secondary' : 'group-hover:scale-110'
                      )} />
                      {isExpanded && (
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
                          <p className="font-black italic text-sm uppercase tracking-tight">{item.name}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                {!isExpanded && <TooltipContent side="right" className="bg-black border-white/10 font-bold uppercase text-[10px] tracking-widest">{item.name}</TooltipContent>}
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/">
                <div className="flex items-center gap-4 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group cursor-pointer">
                  <Home className="h-6 w-6 shrink-0 group-hover:scale-110 transition-all" />
                  {isExpanded && <span className="font-black italic text-xs uppercase">Vista Pública</span>}
                </div>
              </Link>
            </TooltipTrigger>
            {!isExpanded && <TooltipContent side="right" className="bg-black border-white/10 font-bold uppercase text-[10px] tracking-widest">Inicio Público</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all group"
              >
                <LogOut className="h-6 w-6 shrink-0 group-hover:scale-110 transition-all" />
                {isExpanded && <span className="font-black italic text-xs uppercase">Cerrar Sesión</span>}
              </button>
            </TooltipTrigger>
            {!isExpanded && <TooltipContent side="right" className="bg-black border-white/10 font-bold uppercase text-[10px] tracking-widest">Salir</TooltipContent>}
          </Tooltip>

          {/* Toggle Button */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all mt-4 border border-white/5"
          >
            {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
