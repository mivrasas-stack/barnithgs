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
  MapPin,
  Music,
  Flame
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
    { name: 'Inventario', tab: 'catalog', icon: Package },
    { name: 'Audio Studio', tab: 'audio', icon: Music },
    { name: 'Entregas', tab: 'deliveries', icon: MapPin },
    { name: 'Staff', tab: 'staff', icon: Users },
    { name: 'Auditoría', tab: 'history', icon: History },
  ];

  const mainNavItems = [
    { name: 'Driver', href: '/driver', icon: Truck, roles: ['driver', 'admin'] },
    { name: 'Bodega', href: '/warehouse', icon: Box, roles: ['warehouse', 'admin'] },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen z-50 transition-all duration-300 border-r border-white/10 glass-morphism flex flex-col hidden md:flex",
          isExpanded ? "w-48" : "w-16"
        )}
      >
        <div className="p-3 flex items-center gap-2 border-b border-white/5 h-16 overflow-hidden">
          <div className="shrink-0 h-10 w-10 bg-secondary/20 rounded-xl flex items-center justify-center neon-glow-secondary">
            <ShieldCheck className="h-6 w-6 text-secondary" />
          </div>
          {isExpanded && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="text-[10px] font-black italic text-white leading-none">COMMAND</p>
              <p className="text-[8px] font-bold text-secondary uppercase tracking-widest">CENTER</p>
            </div>
          )}
        </div>

        <div className="flex-1 py-4 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          {role === 'admin' && (
            <div className="px-2 space-y-1">
              {adminSubItems.map((item) => (
                <Tooltip key={item.tab}>
                  <TooltipTrigger asChild>
                    <Link href={`/admin?tab=${item.tab}`}>
                      <div className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg transition-all group cursor-pointer",
                        pathname === '/admin' && activeTab === item.tab
                        ? 'bg-primary/10 text-primary' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      )}>
                        <item.icon className={cn(
                          "h-5 w-5 shrink-0 transition-all",
                          pathname === '/admin' && activeTab === item.tab ? 'neon-text-primary' : 'group-hover:scale-110'
                        )} />
                        {isExpanded && <p className="font-black italic text-[10px] uppercase tracking-tight">{item.name}</p>}
                      </div>
                    </Link>
                  </TooltipTrigger>
                  {!isExpanded && <TooltipContent side="right" className="bg-black border-white/10 font-bold uppercase text-[8px] tracking-widest">{item.name}</TooltipContent>}
                </Tooltip>
              ))}
            </div>
          )}

          <div className="px-2 space-y-1">
            {mainNavItems.filter(item => item.roles.includes(role)).map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg transition-all group cursor-pointer",
                      pathname === item.href 
                      ? 'bg-secondary/10 text-secondary' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}>
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0 transition-all",
                        pathname === item.href ? 'neon-text-secondary' : 'group-hover:scale-110'
                      )} />
                      {isExpanded && <p className="font-black italic text-[10px] uppercase tracking-tight">{item.name}</p>}
                    </div>
                  </Link>
                </TooltipTrigger>
                {!isExpanded && <TooltipContent side="right" className="bg-black border-white/10 font-bold uppercase text-[8px] tracking-widest">{item.name}</TooltipContent>}
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="p-2 border-t border-white/5 space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 p-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all group">
                <LogOut className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="font-black italic text-[10px] uppercase">Salir</span>}
              </button>
            </TooltipTrigger>
            {!isExpanded && <TooltipContent side="right" className="bg-black border-white/10 font-bold uppercase text-[8px]">Salir</TooltipContent>}
          </Tooltip>
          <button onClick={() => setIsExpanded(!isExpanded)} className="w-full h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-all mt-1">
            {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
