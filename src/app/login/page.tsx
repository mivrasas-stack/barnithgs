"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole, Role } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';

export default function LoginPage() {
  const [digits, setDigits] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const { login } = useUserRole();

  const handleLogin = () => {
    if (digits.length !== 4) {
      toast({
        variant: "destructive",
        title: "PIN INCOMPLETO",
        description: "Digita tu código de acceso de 4 números.",
      });
      return;
    }

    setIsAuthenticating(true);

    // Intentamos loguear buscando a qué rol pertenece el PIN ingresado
    // En un sistema real, esto validaría contra la base de datos de empleados
    let authenticatedRole: Role | null = null;
    
    if (digits === '1111') authenticatedRole = 'admin';
    else if (digits === '2222') authenticatedRole = 'driver';
    else if (digits === '3333') authenticatedRole = 'warehouse';

    setTimeout(() => {
      if (authenticatedRole) {
        login(authenticatedRole, digits);
        toast({
          title: "¡ACCESO CONCEDIDO!",
          description: `Bienvenido al sistema Staff, ${authenticatedRole.toUpperCase()}.`,
        });
        
        if (authenticatedRole === 'admin') router.push('/admin');
        else if (authenticatedRole === 'driver') router.push('/driver');
        else if (authenticatedRole === 'warehouse') router.push('/warehouse');
      } else {
        toast({
          variant: "destructive",
          title: "ACCESO DENEGADO",
          description: "El PIN ingresado no es válido para ningún miembro del staff.",
        });
        setDigits('');
      }
      setIsAuthenticating(false);
    }, 800);
  };

  const appendDigit = (d: string) => {
    if (digits.length < 4) setDigits(prev => prev + d);
  };

  const clear = () => setDigits('');

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary overflow-hidden">
      <Navigation />
      
      <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-700 relative">
          
          {/* Elementos de fondo decorativos */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/10 blur-[120px] rounded-full" />

          <div className="text-center space-y-4 mb-10">
            <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center neon-glow-primary border border-primary/40 mx-auto">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter">
              PORTAL <span className="text-primary neon-text-primary">STAFF</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Autenticación Biométrica Digital</p>
          </div>

          <Card className="bg-card/40 border-white/10 glass-morphism rounded-[3rem] overflow-hidden p-8 space-y-8 relative z-10 shadow-2xl">
            <div className="text-center space-y-2">
              <Lock className="h-5 w-5 text-gray-600 mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">INGRESA TU PIN DE ACCESO</p>
            </div>

            {/* Visualizador de PIN */}
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`h-16 w-12 rounded-xl border-2 flex items-center justify-center text-3xl font-black transition-all duration-300 ${
                    digits[i] ? 'border-primary text-primary neon-glow-primary' : 'border-white/5 text-gray-800'
                  }`}
                >
                  {digits[i] ? '•' : ''}
                </div>
              ))}
            </div>

            {/* Teclado Numérico */}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((btn) => (
                <Button
                  key={btn}
                  variant="outline"
                  disabled={isAuthenticating}
                  className={`h-14 rounded-xl text-xl font-black transition-all border-none ${
                    btn === 'OK' ? 'bg-primary text-white neon-glow-primary hover:bg-primary/90' : 
                    btn === 'C' ? 'bg-white/5 text-destructive hover:bg-destructive/10' :
                    'bg-white/5 text-white hover:bg-white/10'
                  }`}
                  onClick={() => {
                    if (btn === 'C') clear();
                    else if (btn === 'OK') handleLogin();
                    else appendDigit(btn);
                  }}
                >
                  {btn === 'OK' && isAuthenticating ? <Loader2 className="h-6 w-6 animate-spin" /> : btn}
                </Button>
              ))}
            </div>

            <p className="text-[9px] text-gray-600 text-center font-bold uppercase tracking-widest pt-4">
              Punto de acceso restringido a personal autorizado
            </p>
          </Card>
          
          <div className="mt-12 text-center">
             <div className="p-4 bg-white/5 border border-white/10 rounded-2xl inline-block">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Acceso de prueba: <span className="text-primary">1111</span> (Admin) • <span className="text-secondary">2222</span> (Driver) • <span className="text-accent">3333</span> (Almacén)
                </p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
