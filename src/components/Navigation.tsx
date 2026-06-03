
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserRole, useCart } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Menu, 
  Beer,
  Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Navigation() {
  const { cart } = useCart();
  const { isLoggedIn } = useUserRole();
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

          <div className="h-8 w-[1px] bg-white/10 hidden md:block" />

          <Link href="/login">
            <Button 
              variant="outline" 
              className={`hidden md:flex border-primary/40 text-primary font-black tracking-widest px-6 rounded-full h-12 hover:bg-primary/10 transition-all ${isLoggedIn ? 'neon-glow-primary' : ''}`}
            >
              <Lock className="mr-2 h-4 w-4" /> {isLoggedIn ? 'PANEL STAFF' : 'ACCESO STAFF'}
            </Button>
          </Link>

          <Button variant="ghost" size="icon" className="md:hidden h-12 w-12 hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
