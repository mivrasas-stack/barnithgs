"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, KeyRound } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function PortalLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (identifier.length < 4) {
      toast({
        title: "Identificador inválido",
        description: "Por favor, ingresa al menos 4 caracteres de tu número de orden o teléfono.",
        variant: "destructive"
      });
      return;
    }

    setIsAuthenticating(true);

    // Simular conexión y validación de seguridad
    setTimeout(() => {
      localStorage.setItem('portal_vip_verified', 'true');
      toast({
        title: "¡Acceso Concedido! 🥂",
        description: "Validando tus credenciales VIP...",
      });
      router.push('/portal');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-black">
      <Navigation />
      
      <main className="container mx-auto flex items-center justify-center min-h-[calc(100vh-100px)] px-4">
        
        <Card className="w-full max-w-md mx-auto glass-morphism border-primary/20 bg-black/60 relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          {/* Decorative glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-secondary/20 rounded-full blur-[80px]" />

          <CardHeader className="text-center pt-10 pb-6 relative z-10">
            <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-widest text-white">
              Acceso <span className="text-primary">VIP</span>
            </CardTitle>
            <CardDescription className="text-gray-400 mt-2 text-base text-center mx-auto max-w-[90%]">
              Ingresa el identificador único de tu pedido (orden o celular) para ver el rastreo satelital en vivo.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 pb-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 relative">
                <Input 
                  type="text" 
                  placeholder="Ej. #8942-X o 3001234567" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={isAuthenticating}
                  className="h-14 bg-black/50 border-white/10 text-white text-center text-lg tracking-widest focus:border-primary transition-colors placeholder:text-gray-600 rounded-xl"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 font-black tracking-widest uppercase text-black bg-white hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] rounded-xl"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  'Ingresar al Portal'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
