
"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { AgeGate } from '@/components/AgeGate';
import { MoodRecommender } from '@/components/MoodRecommender';
import { Button } from '@/components/ui/button';
import { ChevronRight, Clock, MapPin, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AgeGate onVerified={() => setIsVerified(true)} />
      
      {isVerified && (
        <>
          <Navigation />
          
          <main className="container mx-auto px-4 py-12 space-y-24">
            {/* Hero Section */}
            <section className="relative h-[500px] w-full rounded-3xl overflow-hidden border border-primary/20">
              <img 
                src="https://picsum.photos/seed/party-hero/1200/600" 
                alt="PartyFlow" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl space-y-6">
                <Badge className="w-fit bg-accent text-accent-foreground font-bold px-4 py-1">24/7 OPEN NOW</Badge>
                <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter text-foreground leading-tight">
                  The Party <br /> <span className="text-primary italic">Doesn't Stop.</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md">
                  Ice-cold beer, premium spirits, and complete combos delivered in under 20 minutes. Anytime. Anywhere.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/catalog">
                    <Button size="lg" className="h-14 px-8 text-lg bg-primary neon-glow-primary">
                      Order Now <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-secondary text-secondary hover:bg-secondary/10">
                    View Combos
                  </Button>
                </div>
              </div>
            </section>

            {/* Features */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Ultra Fast", desc: "Delivery in less than 20 minutes guaranteed." },
                { icon: Clock, title: "24/7 Service", desc: "We're awake whenever the party is." },
                { icon: ShieldCheck, title: "Verified Quality", desc: "Official distributor of the world's best brands." }
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-2xl bg-card border border-border/50 space-y-4 hover:border-primary/50 transition-colors group">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">{f.title}</h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </section>

            {/* AI Mood Recommender */}
            <section id="moods" className="py-12 border-t border-border/50">
              <MoodRecommender />
            </section>

            {/* Live Tracking Preview */}
            <section className="bg-card/50 rounded-3xl p-8 md:p-16 border border-secondary/20 relative overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-secondary font-bold">
                       <MapPin className="h-5 w-5" /> LIVE TRACKING
                    </div>
                    <h2 className="text-4xl font-bold font-headline">Watch your drinks <span className="text-secondary">arrive</span> in real-time.</h2>
                    <p className="text-muted-foreground">
                      No more guessing. Follow our delivery heroes on an interactive map from the warehouse to your doorstep.
                    </p>
                    <Button className="bg-secondary text-secondary-foreground">Try it out</Button>
                  </div>
                  <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden border-4 border-background shadow-2xl">
                     <img src="https://picsum.photos/seed/map/600/400" className="w-full h-full object-cover grayscale brightness-50" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-4 w-4 bg-primary rounded-full animate-ping" />
                        <div className="absolute mt-10 bg-background/90 px-4 py-2 rounded-lg border border-primary/20 text-xs font-bold">
                           Rider is 2 mins away!
                        </div>
                     </div>
                  </div>
               </div>
            </section>
          </main>

          <footer className="border-t border-border/50 py-12 mt-24 bg-card/20">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Beer className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold font-headline">PartyFlow</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enjoy responsibly. Our mission is to make sure your celebrations never run dry.
                  </p>
               </div>
               <div>
                  <h4 className="font-bold mb-4">Quick Links</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><Link href="/catalog" className="hover:text-primary">Catalog</Link></li>
                    <li><Link href="/combos" className="hover:text-primary">Combos</Link></li>
                    <li><Link href="/tracking" className="hover:text-primary">Track Order</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold mb-4">Support</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><Link href="/faq" className="hover:text-primary">FAQs</Link></li>
                    <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
                    <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold mb-4">Follow the Party</h4>
                  <div className="flex gap-4">
                     {/* Placeholder social icons */}
                     <div className="h-10 w-10 rounded-full bg-border/50 flex items-center justify-center hover:bg-primary/20 cursor-pointer">IG</div>
                     <div className="h-10 w-10 rounded-full bg-border/50 flex items-center justify-center hover:bg-primary/20 cursor-pointer">FB</div>
                     <div className="h-10 w-10 rounded-full bg-border/50 flex items-center justify-center hover:bg-primary/20 cursor-pointer">TW</div>
                  </div>
               </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
