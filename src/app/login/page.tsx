
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Keypad, ShieldCheck, Zap, Beer, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';

export default function LoginPage() {
  const [digits, setDigits] = useState('');
  const router = useRouter();
  const { login, role } = useUserRole();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (digits.length === 4) {
      login(digits);
      toast({
        title: "¡ACCESO CONCEDIDO!",
        description: `Bienvenido al sistema, agente PartyFlow.`,
      });
      // Redirigir según el rol actual
      if (role === 'admin') router.push('/admin');
      else if (role === 'driver') router.push('/driver');
      else if (role === 'warehouse') router.push('/warehouse');
      else router.push('/');
    } else {
      toast({
        variant: "destructive",
        title: "ERROR DE ACCESO",
        description: "Debes ingresar exactamente los últimos 4 dígitos.",
      });
    }
  };

  const appendDigit = (d: string) => {
    if (digits.length < 4) setDigits(prev => prev + d);
  };

  const clear = () => setDigits('');

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <Navigation />
      <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md space-y-12 animate-in fade-in zoom-in duration-700">
          <div className="text-center space-y-4">
            <div className="h-20 w-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto neon-glow-primary border border-primary/40">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter">
              ACCESO <span className="text-primary neon-text-primary">VIP STAFF</span>
            </h1>
            <p className="text-gray-500 font-medium">Ingresa los últimos 4 dígitos de tu cédula para continuar.</p>
          </div>

          <Card className="bg-card/40 border-white/10 glass-morphism rounded-[3rem] overflow-hidden p-8 space-y-8">
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`h-16 w-12 rounded-2xl border-2 flex items-center justify-center text-3xl font-black transition-all duration-300 ${
                    digits[i] ? 'border-primary text-primary neon-glow-primary' : 'border-white/10 text-gray-800'
                  }`}
                >
                  {digits[i] ? '•' : ''}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((btn) => (
                <Button
                  key={btn}
                  variant="outline"
                  className={`h-16 rounded-2xl text-xl font-black transition-all ${
                    btn === 'OK' ? 'bg-primary border-none text-white neon-glow-primary' : 
                    btn === 'C' ? 'border-destructive/30 text-destructive hover:bg-destructive/10' :
                    'border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/50'
                  }`}
                  onClick={() => {
                    if (btn === 'C') clear();
                    else if (btn === 'OK') handleLogin(new Event('submit') as any);
                    else appendDigit(btn);
                  }}
                >
                  {btn}
                </Button>
              ))}
            </div>
          </Card>

          <p className="text-center text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">
            Sistema de Seguridad PartyFlow v2.5 • Acceso Monitoreado
          </p>
        </div>
      </main>
    </div>
  );
}
