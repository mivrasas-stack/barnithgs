"use client";

import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/lib/store';
import { Trash2, ShoppingBag, ArrowRight, Zap, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function CartPage() {
  const { cart, removeFromCart, total, clearCart, addToCart } = useCart();

  const handleCheckout = () => {
    toast({
      title: "🚀 ¡Pedido en Camino!",
      description: "Tu rumba está por encenderse. El repartidor llegará en 15-20 min.",
    });
    clearCart();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl space-y-12">
        <h1 className="text-5xl font-black italic tracking-tighter font-headline flex items-center gap-4">
           TU <span className="text-secondary neon-text-secondary">CARGAMENTO</span> <ShoppingBag className="h-10 w-10 text-secondary" />
        </h1>

        {cart.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-700">
             <div className="h-32 w-32 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(255,0,122,0.1)]">
                <ShoppingBag className="h-16 w-16 text-gray-700" />
             </div>
             <div className="text-center space-y-4">
                <h2 className="text-4xl font-black italic">EL CARRITO ESTÁ FRÍO</h2>
                <p className="text-gray-400 font-medium text-lg">Aún no has agregado la gasolina para la rumba.</p>
             </div>
             <Link href="/catalog">
                <Button size="lg" className="h-16 px-12 text-xl font-black bg-primary neon-glow-primary rounded-full italic tracking-widest">
                  EXPLORAR CAVA <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Lista de Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-6 p-6 bg-card/40 rounded-[2rem] border border-white/10 glass-morphism group hover:border-secondary/40 transition-all">
                   <div className="h-24 w-24 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                   </div>
                   <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-black italic">{item.name}</h3>
                      <p className="text-secondary font-black text-2xl">${item.price}.00</p>
                   </div>
                   <div className="flex flex-col items-end gap-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500 hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => removeFromCart(item.id)}
                      >
                         <Trash2 className="h-6 w-6" />
                      </Button>
                      <div className="flex items-center gap-4 bg-white/5 rounded-full p-1 border border-white/10">
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeFromCart(item.id)}><Minus className="h-4 w-4" /></Button>
                         <span className="font-black text-lg">{item.quantity}</span>
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-secondary" onClick={() => addToCart(item)}><Plus className="h-4 w-4" /></Button>
                      </div>
                   </div>
                </div>
              ))}
            </div>

            {/* Resumen de Compra */}
            <Card className="bg-card/60 border-primary/40 rounded-[2.5rem] overflow-hidden neon-glow-primary lg:sticky lg:top-32">
               <CardHeader className="bg-primary/10 border-b border-primary/20 p-8">
                  <CardTitle className="text-2xl font-black italic tracking-tighter">RESUMEN DE RUMBA</CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                     <div className="flex justify-between text-gray-400 font-bold uppercase text-xs tracking-widest">
                        <span>Subtotal</span>
                        <span>${total}.00</span>
                     </div>
                     <div className="flex justify-between text-secondary font-black uppercase text-xs tracking-widest">
                        <span>Envío Flash (15 min)</span>
                        <span>GRATIS</span>
                     </div>
                     <div className="h-[1px] bg-white/10 w-full" />
                     <div className="flex justify-between items-end">
                        <span className="text-xl font-black italic">TOTAL</span>
                        <span className="text-4xl font-black text-primary neon-text-primary italic">${total}.00</span>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                       className="w-full h-16 text-xl font-black italic tracking-widest bg-primary text-white rounded-2xl neon-glow-primary hover:scale-[1.02] transition-all"
                       onClick={handleCheckout}
                    >
                       <Zap className="mr-3 h-6 w-6 fill-white" /> PEDIR AHORA
                    </Button>
                    <p className="text-[10px] text-gray-500 text-center uppercase font-black leading-tight">
                       Al hacer clic, confirmas que eres mayor de edad y aceptas nuestros términos de rumba responsable.
                    </p>
                  </div>
               </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
