
"use client";

import Link from 'next/link';
import { useUserRole, useCart } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Menu, 
  User, 
  LayoutDashboard, 
  Truck, 
  Box, 
  Beer,
  ChevronDown,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function Navigation() {
  const { role, changeRole } = useUserRole();
  const { cart } = useCart();
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 glass-morphism">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform neon-glow-primary">
              <Beer className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white font-headline">
              Party<span className="text-primary">Flow</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/catalog" className="text-sm font-black tracking-widest uppercase hover:text-primary transition-colors">Tienda</Link>
            <Link href="/moods" className="text-sm font-black tracking-widest uppercase hover:text-primary transition-colors">Vibra</Link>
            <Link href="/combos" className="text-sm font-black tracking-widest uppercase hover:text-primary transition-colors">Combos</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden md:flex gap-2 font-bold text-gray-300 hover:text-white">
                <User className="h-4 w-4" />
                <span className="capitalize">{role === 'client' ? 'Cliente' : role === 'admin' ? 'Admin' : role === 'driver' ? 'Repartidor' : 'Almacén'}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-morphism border-white/20 p-2">
              <DropdownMenuItem onClick={() => changeRole('client')} className="rounded-lg p-3 cursor-pointer hover:bg-primary/10">
                <User className="mr-3 h-4 w-4 text-primary" /> <span className="font-bold">Vista Cliente</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeRole('admin')} className="rounded-lg p-3 cursor-pointer hover:bg-primary/10">
                <LayoutDashboard className="mr-3 h-4 w-4 text-primary" /> <span className="font-bold">Panel Admin</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeRole('driver')} className="rounded-lg p-3 cursor-pointer hover:bg-primary/10">
                <Truck className="mr-3 h-4 w-4 text-primary" /> <span className="font-bold">Vista Repartidor</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeRole('warehouse')} className="rounded-lg p-3 cursor-pointer hover:bg-primary/10">
                <Box className="mr-3 h-4 w-4 text-primary" /> <span className="font-bold">Vista Almacén</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-8 w-[1px] bg-white/10 hidden md:block" />

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative h-12 w-12 hover:bg-white/10 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-white" />
              {itemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-6 w-6 justify-center rounded-full bg-primary p-0 text-xs font-black text-white neon-glow-primary border-2 border-black">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="md:hidden h-12 w-12 hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </Button>
          
          {role === 'client' && (
             <Button variant="default" className="hidden md:flex bg-primary font-black tracking-widest px-8 rounded-full h-12 neon-glow-primary hover:bg-primary/90 transition-all hover:scale-105">
                <Zap className="mr-2 h-4 w-4 fill-white" /> ÚNETE
             </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
