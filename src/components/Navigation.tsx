"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserRole, useCart } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Menu, 
  Beer,
  Lock,
  Star
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Navigation() {
  const { cart } = useCart();
  const { isLoggedIn } = useUserRole();
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 glass-morphism">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-gradient-to-br from-[#FFD700] to-[#DAA520] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,215,0,0.3)]">
              <Star className="h-5 w-5 text-black fill-black" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white font-headline">
              Party<span className="text-primary">Flow</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/catalog" className="text-sm font-semibold tracking-widest uppercase hover:text-primary transition-colors text-gray-300">Colección</Link>
            <Link href="/moods" className="text-sm font-semibold tracking-widest uppercase hover:text-primary transition-colors text-gray-300">Experiencias</Link>
            <Link href="/combos" className="text-sm font-semibold tracking-widest uppercase hover:text-primary transition-colors text-gray-300">Combos VIP</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="relative h-12 w-12 hover:bg-white/5 rounded-xl transition-colors group">
            <Link href="/cart">
              <ShoppingCart className="h-6 w-6 text-white group-hover:text-primary transition-colors" />
              {itemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary p-0 text-xs font-black text-black border-2 border-background shadow-[0_0_10px_rgba(255,215,0,0.4)]">
                  {itemCount}
                </Badge>
              )}
            </Link>
          </Button>

          <div className="h-8 w-[1px] bg-white/10 hidden md:block" />

          <Button asChild
            variant="outline" 
            className={`hidden md:flex border-white/20 text-white font-semibold tracking-widest px-6 rounded-full h-12 hover:bg-white/10 hover:border-white/40 transition-all ${isLoggedIn ? 'border-primary/50 text-primary bg-primary/5' : ''}`}
          >
            <Link href="/login">
              <Lock className="mr-2 h-4 w-4" /> {isLoggedIn ? 'PANEL STAFF' : 'ACCESO VIP'}
            </Link>
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-12 w-12 hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6 text-white" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl animate-in slide-in-from-top-2">
          <div className="flex flex-col p-6 gap-6">
            <Link href="/catalog" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold tracking-widest uppercase text-white hover:text-primary">Colección</Link>
            <Link href="/moods" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold tracking-widest uppercase text-white hover:text-primary">Experiencias</Link>
            <Link href="/combos" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold tracking-widest uppercase text-white hover:text-primary">Combos VIP</Link>
            
            <div className="h-[1px] w-full bg-white/10 my-2" />
            
            <Button asChild
              variant="outline" 
              className={`w-full border-white/20 text-white font-semibold tracking-widest h-14 rounded-xl ${isLoggedIn ? 'border-primary/50 text-primary bg-primary/5' : ''}`}
            >
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Lock className="mr-2 h-5 w-5" /> {isLoggedIn ? 'PANEL STAFF' : 'ACCESO VIP'}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
