"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRole, Role } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Lock, Truck, Box, LayoutDashboard, ChevronRight, Info, CreditCard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Navigation } from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [cedula, setCedula] = useState('');
  const [digits, setDigits] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const router = useRouter();
  const { login } = useUserRole();

  const handleLogin = () => {
    if (!selectedRole) {
      toast({ 
        variant: "destructive", 
        title: "ROL NO SELECCIONADO", 
        description: "Elige tu puesto de trabajo primero." 
      });
      return;
    }

    if (!cedula) {
      toast({
        variant: "destructive",
        title: "CÉDULA REQUERIDA",
        description: "Ingresa tu número de identificación completo.",
      });
      return;
    }

    if (digits.length !== 4) {
      toast({
        variant: "destructive",
        title: "PIN INCOMPLETO",
        description: "Digita los últimos 4 números de tu cédula.",
      });
      return;
    }

    const success = login(selectedRole, digits);

    if (success) {
      toast({
        title: "¡ACCESO CONCEDIDO!",
        description: `Bienvenido al sistema Staff, ${selectedRole.toUpperCase()}.`,
      });
      
      if (selectedRole === 'admin') router.push('/admin');
      else if (selectedRole === 'driver') router.push('/driver');
      else if (selectedRole === 'warehouse') router.push('/warehouse');
      else router.push('/');
    } else {
      toast({
        variant: "destructive",
        title: "ERROR DE ACCESO",
        description: "El PIN no coincide con la cédula o rol seleccionado.",
      });
      setDigits('');
    }
  };

  const appendDigit = (d: string) => {
    if (digits.length < 4) setDigits(prev => prev + d);
  };

  const clear = () => setDigits('');

  const roleConfigs = [
    { id: 'admin' as Role, name: 'ADMIN', icon: LayoutDashboard, hint: 'Cédula: 1111' },
    { id: 'driver' as Role, name: 'DRIVER', icon: Truck, hint: 'Cédula: 2222' },
    { id: 'warehouse' as Role, name: 'ALMACÉN', icon: Box, hint: 'Cédula: 3333' },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary">
      <Navigation />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-in fade-in zoom-in duration-700">
          
          {/* Lado Izquierdo: Selección de Rol y Datos */}
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="h-16 w-16 bg-secondary/20 rounded-2xl flex items-center justify-center neon-glow-secondary border border-secondary/40">
                <ShieldCheck className="h-8 w-8 text-secondary" />
              </div>
              <h1 className="text-5xl font-black italic tracking-tighter leading-none">
                PORTAL <br /> <span className="text-secondary neon-text-secondary">STAFF VIP</span>
              </h1>
              <p className="text-gray-500 font-medium max-w-sm">
                Autenticación biométrica y digital para el personal de PartyFlow.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="uppercase text-[10px] font-black tracking-widest text-secondary">1. Selecciona tu Rol</Label>
                <div className="grid grid-cols-1 gap-3">
                  {roleConfigs.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`group p-4 rounded-2xl border-2 flex items-center justify-between transition-all duration-300 ${
                        selectedRole === role.id 
                        ? 'bg-secondary/10 border-secondary neon-glow-secondary' 
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <role.icon className={`h-5 w-5 ${selectedRole === role.id ? 'text-secondary' : 'text-gray-500'}`} />
                        <span className={`text-lg font-black italic tracking-widest ${selectedRole === role.id ? 'text-white' : 'text-gray-500'}`}>
                          {role.name}
                        </span>
                      </div>
                      {selectedRole === role.id && <ChevronRight className="h-5 w-5 text-secondary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="uppercase text-[10px] font-black tracking-widest text-secondary">2. Identificación</Label>
                <div className="relative group">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-secondary transition-colors" />
                  <Input 
                    placeholder="Ingresa tu Cédula" 
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl focus:border-secondary/50 font-black tracking-[0.2em] text-lg"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-4">
              <Info className="h-5 w-5 text-secondary mt-1" />
              <p className="text-sm text-gray-400">
                <span className="text-secondary font-bold">Ayuda:</span> Para este prototipo, usa cualquier número y los últimos 4 dígitos como PIN (ej: admin 1111).
              </p>
            </div>
          </div>

          {/* Lado Derecho: Teclado Numérico */}
          <div className="relative">
            <div className="absolute inset-0 bg-secondary/5 blur-[100px] rounded-full" />
            <Card className="bg-card/40 border-white/10 glass-morphism rounded-[3.5rem] overflow-hidden p-10 space-y-10 relative z-10">
              <div className="text-center space-y-2">
                <Lock className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">3. DIGITA TU PIN (ÚLTIMOS 4)</p>
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
