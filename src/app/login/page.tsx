
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole, Role } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Lock, User, Truck, Box, LayoutDashboard, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';

export default function LoginPage() {
  const [digits, setDigits] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const router = useRouter();
  const { login, changeRole } = useUserRole();

  const handleLogin = () => {
    if (!selectedRole) {
      toast({ variant: "destructive", title: "ROL NO SELECCIONADO", description: "Elige tu puesto de trabajo primero." });
      return;
    }
    if (digits.length === 4) {
      changeRole(selectedRole);
      login(digits);
      toast({
        title: "¡ACCESO CONCEDIDO!",
        description: `Bienvenido al sistema Staff, ${selectedRole.toUpperCase()}.`,
      });
      // Redirigir según el rol seleccionado
      if (selectedRole === 'admin') router.push('/admin');
      else if (selectedRole === 'driver') router.push('/driver');
      else if (selectedRole === 'warehouse') router.push('/warehouse');
      else router.push('/');
    } else {
      toast({
        variant: "destructive",
        title: "ERROR DE ACCESO",
        description: "Debes ingresar los últimos 4 dígitos de tu ID.",
      });
    }
  };

  const appendDigit = (d: string) => {
    if (digits.length < 4) setDigits(prev => prev + d);
  };

  const clear = () => setDigits('');

  const roleConfigs = [
    { id: 'admin' as Role, name: 'ADMIN', icon: LayoutDashboard },
    { id: 'driver' as Role, name: 'DRIVER', icon: Truck },
    { id: 'warehouse' as Role, name: 'ALMACÉN', icon: Box },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <Navigation />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-in fade-in zoom-in duration-700">
          
          {/* Lado Izquierdo: Selección de Rol */}
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="h-16 w-16 bg-secondary/20 rounded-2xl flex items-center justify-center neon-glow-secondary border border-secondary/40">
                <ShieldCheck className="h-8 w-8 text-secondary" />
              </div>
              <h1 className="text-5xl font-black italic tracking-tighter leading-none">
                PORTAL <br /> <span className="text-secondary neon-text-secondary">STAFF VIP</span>
              </h1>
              <p className="text-gray-500 font-medium max-w-sm">
                Selecciona tu rol y autentícate para ingresar al sistema de control interno.
              </p>
            </div>

            <div className="space-y-4">
              {roleConfigs.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full group p-6 rounded-[2rem] border-2 flex items-center justify-between transition-all duration-300 ${
                    selectedRole === role.id 
                    ? 'bg-secondary/10 border-secondary neon-glow-secondary' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                      selectedRole === role.id ? 'bg-secondary text-black' : 'bg-white/10 text-gray-400 group-hover:text-white'
                    }`}>
                      <role.icon className="h-6 w-6" />
                    </div>
                    <span className={`text-xl font-black italic tracking-widest transition-all ${
                      selectedRole === role.id ? 'text-white' : 'text-gray-500'
                    }`}>
                      {role.name}
                    </span>
                  </div>
                  {selectedRole === role.id && <ChevronRight className="h-6 w-6 text-secondary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Lado Derecho: Teclado Numérico */}
          <div className="relative">
            <div className="absolute inset-0 bg-secondary/5 blur-[100px] rounded-full" />
            <Card className="bg-card/40 border-white/10 glass-morphism rounded-[3.5rem] overflow-hidden p-10 space-y-10 relative z-10">
              <div className="text-center space-y-2">
                <Lock className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">DIGITA TU CLAVE STAFF</p>
              </div>

              <div className="flex justify-center gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`h-20 w-14 rounded-2xl border-2 flex items-center justify-center text-4xl font-black transition-all duration-500 ${
                      digits[i] ? 'border-secondary text-secondary neon-glow-secondary' : 'border-white/5 text-gray-800'
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
                    className={`h-16 rounded-2xl text-xl font-black transition-all border-none ${
                      btn === 'OK' ? 'bg-secondary text-black neon-glow-secondary hover:bg-secondary/90' : 
                      btn === 'C' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' :
                      'bg-white/5 text-white hover:bg-white/10'
                    }`}
                    onClick={() => {
                      if (btn === 'C') clear();
                      else if (btn === 'OK') handleLogin();
                      else appendDigit(btn);
                    }}
                  >
                    {btn}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
