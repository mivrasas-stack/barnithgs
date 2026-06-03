
"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function StaffNavigation() {
  const { role, isLoggedIn, logout } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isLoggedIn) return null;

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Entregas', href: '/driver', icon: Truck, roles: ['driver', 'admin'] },
    { name: 'Almacén', href: '/warehouse', icon: Box, roles: ['warehouse', 'admin'] },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 glass-morphism">
      <div className="container mx-auto flex h-24 items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href={role === 'admin' ? '/admin' : `/${role}`} className="flex items-center gap-3 group">
            <div className="h-12 w-12 bg-secondary/20 rounded-2xl flex items-center justify-center group-hover:neon-glow-secondary transition-all">
              <ShieldCheck className="h-7 w-7 text-secondary" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-black tracking-tighter text-white uppercase italic">
                PORTAL<span className="text-secondary">STAFF</span>
              </span>
              <span className="text-[10px] font-black text-gray-500 tracking-[0.3em] uppercase">Control Maestro</span>
            </div>
          </Link>
          
          <div className="h-10 w-[1px] bg-white/10 hidden lg:block" />

          <div className="hidden md:flex items-center gap-3">
            {navItems.filter(item => item.roles.includes(role)).map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant="ghost" 
                  className={`flex gap-3 font-black italic tracking-widest uppercase transition-all rounded-full h-12 px-6 ${
                    pathname === item.href 
                    ? 'bg-secondary/10 text-secondary border border-secondary/30' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden xl:flex items-center gap-3 mr-4">
             <Link href="/">
               <Button variant="ghost" className="text-gray-500 hover:text-white font-bold h-10">
                 <Home className="mr-2 h-4 w-4" /> VER TIENDA
               </Button>
             </Link>
             <div className="h-6 w-[1px] bg-white/10" />
             <div className="flex flex-col items-end">
                <Badge variant="outline" className="border-secondary text-secondary font-black px-3 py-0.5 text-[10px] mb-0.5">
                  MODO: {role.toUpperCase()}
                </Badge>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">Sesión Activa</span>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-12 w-12 hover:bg-white/5 relative group">
              <Bell className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
              <span className="absolute top-3 right-3 h-2 w-2 bg-secondary rounded-full animate-pulse shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
            </Button>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-xl border border-transparent hover:border-destructive/20"
              title="Cerrar Sesión Staff"
            >
              <LogOut className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
