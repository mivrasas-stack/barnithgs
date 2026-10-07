"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PRIZES = [
  { id: 1, label: '10% Dcto', bgColor: '#eab308', textColor: 'text-black' },
  { id: 2, label: 'Envío Gratis', bgColor: '#000000', textColor: 'text-white' },
  { id: 3, label: 'Hielo Extra', bgColor: '#ffffff', textColor: 'text-black' },
  { id: 4, label: 'Shot Cortesía', bgColor: '#eab308', textColor: 'text-black' },
  { id: 5, label: '15% Dcto', bgColor: '#000000', textColor: 'text-white' },
  { id: 6, label: 'Sin Premio', bgColor: '#1f2937', textColor: 'text-gray-400' },
  { id: 7, label: 'Gomitas', bgColor: '#ffffff', textColor: 'text-black' },
  { id: 8, label: '5% Dcto', bgColor: '#eab308', textColor: 'text-black' },
  { id: 9, label: 'VIP Pass', bgColor: '#000000', textColor: 'text-white' },
  { id: 10, label: 'Sin Premio', bgColor: '#1f2937', textColor: 'text-gray-400' },
];

interface RouletteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RouletteModal({ open, onOpenChange }: RouletteModalProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const { toast } = useToast();

  const spinRoulette = () => {
    if (spinning || wonPrize) return;
    
    setSpinning(true);
    // Calcular una rotación aleatoria asegurando al menos 5 vueltas completas (5 * 360 = 1800)
    const extraSpins = 1800;
    const randomDegree = Math.floor(Math.random() * 360);
    const totalRotation = rotation + extraSpins + randomDegree;
    
    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      // Calcular qué premio ganó basándonos en los grados finales
      const normalizedDegree = (totalRotation % 360);
      const segmentSize = 360 / PRIZES.length;
      
      // El conic-gradient empieza en las 12 en punto (arriba), que representa 0 grados en nuestra ruleta.
      // Cuando la ruleta gira 'totalRotation' grados hacia la derecha (sentido horario),
      // el segmento que queda arriba es el que estaba 'totalRotation' grados hacia atrás (antihorario).
      const currentArrowAngle = (360 - (totalRotation % 360)) % 360;
      const index = Math.floor(currentArrowAngle / segmentSize) % PRIZES.length;

      const prize = PRIZES[index];

      setWonPrize(prize.label);

      if (prize.label !== 'Sin Premio') {
        // Guardar el premio localmente para mostrarlo en el portal
        try {
          const stored = JSON.parse(localStorage.getItem('portal_prizes') || '[]');
          stored.push({ id: Date.now(), label: prize.label, date: new Date().toISOString() });
          localStorage.setItem('portal_prizes', JSON.stringify(stored));
          // Despachar un evento para que el portal actualice su estado
          window.dispatchEvent(new Event('portal_prizes_updated'));
        } catch (e) { console.error("Error guardando premio", e); }

        toast({
          title: "¡Felicidades Leyenda! 🎉",
          description: `Has ganado: ${prize.label}. Se aplicará en tu próxima compra o añádelo ahora.`,
        });
      } else {
        toast({
          title: "Casi...",
          description: "No hubo suerte esta vez, pero la noche es joven.",
          variant: "destructive"
        });
      }
    }, 4000); // 4 segundos de duración de la animación
  };

  const sliceAngle = 360 / PRIZES.length;
  const backgroundGradient = `conic-gradient(${PRIZES.map((p, i) => `${p.bgColor} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(', ')})`;

  return (
    <Dialog open={open} onOpenChange={(val) => {
        if(!spinning) onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-lg bg-black/90 border-primary/20 glass-morphism overflow-hidden">
        
        {wonPrize && (
           <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
              {wonPrize === 'Sin Premio' ? (
                <>
                  <h2 className="text-3xl font-black text-white uppercase tracking-widest text-center">Casi...</h2>
                  <p className="text-xl font-bold text-gray-400 mt-4 mb-8 text-center px-6">La suerte no estuvo de tu lado esta vez,<br/>¡pero la noche es joven!</p>
                  <Button onClick={() => onOpenChange(false)} className="bg-gray-800 text-white hover:bg-gray-700 font-bold px-8">
                    Cerrar
                  </Button>
                </>
              ) : (
                <>
                  <Gift className="h-20 w-20 text-primary mb-6 animate-bounce" />
                  <h2 className="text-3xl font-black text-white uppercase tracking-widest text-center">¡Ganaste!</h2>
                  <p className="text-4xl font-black text-primary mt-4 mb-8 text-center drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">{wonPrize}</p>
                  <Button onClick={() => onOpenChange(false)} className="bg-primary text-black font-bold px-8">
                    Reclamar Premio
                  </Button>
                </>
              )}
           </div>
        )}

        <DialogHeader className="relative z-10 text-center flex flex-col items-center pt-6">
          <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
             <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-widest text-white">La Ruleta de la Rumba</DialogTitle>
          <DialogDescription className="text-gray-400">
            ¡Gira para ganar premios exclusivos y mejorar tu noche!
          </DialogDescription>
        </DialogHeader>

        <div className="relative py-10 flex justify-center overflow-hidden">
          {/* Flecha indicadora */}
          <div className="absolute top-6 z-20 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>

          {/* Ruleta */}
          <div 
            className="w-80 h-80 sm:w-96 sm:h-96 rounded-full border-4 border-white/20 shadow-[0_0_50px_rgba(255,215,0,0.2)] relative overflow-hidden transition-transform ease-out"
            style={{ 
                background: backgroundGradient,
                transform: `rotate(${rotation}deg)`, 
                transitionDuration: spinning ? '4s' : '0s' 
            }}
          >
            {PRIZES.map((prize, index) => {
              const rotationDegree = -90 + (index * sliceAngle) + (sliceAngle / 2);
              return (
                <div 
                  key={prize.id}
                  className="absolute top-1/2 left-1/2 flex items-center justify-end"
                  style={{
                    width: '45%',
                    transform: `translateY(-50%) rotate(${rotationDegree}deg)`,
                    transformOrigin: '0% 50%'
                  }}
                >
                  <span 
                    className={`pr-4 text-[10px] sm:text-xs font-black uppercase tracking-wider text-right line-clamp-2 ${prize.textColor}`}
                  >
                    {prize.label}
                  </span>
                </div>
              );
            })}
            
            {/* Separadores visuales */}
            {PRIZES.map((_, index) => (
              <div 
                key={`sep-${index}`}
                className="absolute top-1/2 left-1/2 w-[50%] h-[2px] bg-black/20 origin-left"
                style={{ transform: `translateY(-50%) rotate(${-90 + index * sliceAngle}deg)` }}
              />
            ))}

            {/* Centro de la ruleta */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black rounded-full border-4 border-[#eab308] z-10 flex items-center justify-center shadow-2xl">
               <div className="w-5 h-5 bg-[#eab308] rounded-full animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
            </div>
          </div>
        </div>

        <div className="flex justify-center pb-6">
          <Button 
            size="lg" 
            className="w-full max-w-[250px] h-14 rounded-full font-black text-lg bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
            onClick={spinRoulette}
            disabled={spinning || !!wonPrize}
          >
            {spinning ? 'GIRANDO...' : '¡GIRAR AHORA!'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
