"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ variant: "destructive", title: "DATOS INCOMPLETOS", description: "Ingresa tu email y contraseña." });
      return;
    }

    setIsAuthenticating(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      toast({
        variant: "destructive",
        title: "ACCESO DENEGADO",
        description: "Credenciales incorrectas o no perteneces al personal.",
      });
      setIsAuthenticating(false);
      return;
    }

    const role = data.user.user_metadata?.role || 'client';
    
    toast({
      title: "¡ACCESO CONCEDIDO!",
      description: `Bienvenido al sistema Staff, ${role.toUpperCase()}.`,
    });

    if (role === 'admin') router.push('/homeadmin');
    else if (role === 'driver') router.push('/driver');
    else if (role === 'warehouse') router.push('/warehouse');
    else router.push('/');
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary overflow-hidden">
      <Navigation />
      <main className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-700 relative">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/10 blur-[120px] rounded-full" />

          <div className="text-center space-y-4 mb-10">
            <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center neon-glow-primary border border-primary/40 mx-auto">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-black italic tracking-tighter">
              PORTAL <span className="text-primary neon-text-primary">STAFF</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Autenticación Segura</p>
          </div>

          <Card className="bg-card/40 border-white/10 glass-morphism rounded-[3rem] overflow-hidden p-8 space-y-8 relative z-10 shadow-2xl">
            <div className="text-center space-y-2">
              <Lock className="h-5 w-5 text-gray-600 mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">CREDENCIALES DE ACCESO</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-primary text-white h-14 rounded-xl px-4"
                  required
                />
              </div>
              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="Contraseña" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-primary text-white h-14 rounded-xl px-4"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isAuthenticating}
                className="w-full h-14 rounded-xl text-xl font-black transition-all bg-primary text-white neon-glow-primary hover:bg-primary/90 mt-4"
              >
                {isAuthenticating ? <Loader2 className="h-6 w-6 animate-spin" /> : 'INGRESAR'}
              </Button>
            </form>

            <p className="text-[9px] text-gray-600 text-center font-bold uppercase tracking-widest pt-2">
              Punto de acceso restringido a personal autorizado
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
