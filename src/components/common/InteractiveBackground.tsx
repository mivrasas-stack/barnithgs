'use client';

import { useEffect, useState } from 'react';

export default function InteractiveBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isClient) return <div className="fixed inset-0 z-[-1] bg-black" />;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-black pointer-events-none">
      {/* Base animated gradient */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(30, 20, 50, 0.4) 0%, rgba(0, 0, 0, 1) 100%)',
        }}
      />
      
      {/* Interactive mouse follower blob */}
      <div 
        className="absolute rounded-full opacity-40 blur-[100px] transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(200, 150, 50, 0.25) 0%, rgba(200, 50, 150, 0.15) 50%, transparent 100%)',
          width: '600px',
          height: '600px',
          transform: `translate(${mousePosition.x - 300}px, ${mousePosition.y - 300}px)`,
        }}
      />
      
      {/* Animated ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[120px] animate-blob animation-delay-2000" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[120px] animate-blob animation-delay-4000" />
      
      {/* Noise texture overlay for premium feel */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
    </div>
  );
}
