"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Beer } from 'lucide-react';

export function AgeGate({ onVerified }: { onVerified: () => void }) {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const isVerified = localStorage.getItem('partyflow_age_verified');
    if (isVerified === 'true') {
      onVerified();
      setVerified(true);
    } else {
      setVerified(false);
    }
  }, [onVerified]);

  const handleVerify = () => {
    localStorage.setItem('partyflow_age_verified', 'true');
    setVerified(true);
    onVerified();
  };

  if (verified === null || verified === true) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 gradient-bg opacity-50" />
      <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Beer className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline">PartyFlow</CardTitle>
          <p className="mt-2 text-muted-foreground">Debes tener la edad legal para beber para entrar.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full h-12 text-lg font-semibold neon-glow-primary" 
            onClick={handleVerify}
          >
            Soy mayor de 18 años
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => window.location.href = 'https://google.com'}
          >
            Salir
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
