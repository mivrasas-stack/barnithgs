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
  ChevronDown
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
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Beer className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tighter text-foreground font-headline">
              Party<span className="text-primary">Flow</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/catalog" className="text-sm font-medium hover:text-primary transition-colors">Tienda</Link>
            <Link href="/moods" className="text-sm font-medium hover:text-primary transition-colors">Vibra</Link>
            <Link href="/combos" className="text-sm font-medium hover:text-primary transition-colors">Combos</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                <User className="h-4 w-4" />
                <span className="capitalize">{role === 'client' ? 'Cliente' : role === 'admin' ? 'Admin' : role === 'driver' ? 'Repartidor' : 'Almacén'}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => changeRole('client')}>
                <User className="mr-2 h-4 w-4" /> Vista Cliente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeRole('admin')}>
                <LayoutDashboard className="mr-2 h-4 w-4" /> Panel Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeRole('driver')}>
                <Truck className="mr-2 h-4 w-4" /> Vista Repartidor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeRole('warehouse')}>
                <Box className="mr-2 h-4 w-4" /> Vista Almacén
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full bg-primary p-0 text-[10px] text-white">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          {role === 'client' && (
             <Button variant="default" className="hidden md:flex bg-primary neon-glow-primary hover:bg-primary/90">
                Únete a la Fiesta
             </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
