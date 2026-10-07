"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/lib/store';
import { Trash2, ShoppingBag, ArrowRight, Zap, Minus, Plus, MapPin, Loader2, Search, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { geocoder, COLOMBIAN_CITIES, CUNDINAMARCA_MUNICIPALITIES } from '@/lib/geo/nominatim';
import { GeocodingResult } from '@/lib/geo/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeliveryMap } from '@/components/DeliveryMap';

export default function CartPage() {
  const { cart, removeFromCart, total, clearCart, addToCart } = useCart();
  // Formulario de Envío
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(COLOMBIAN_CITIES[0]);
  const [selectedMunicipality, setSelectedMunicipality] = useState(CUNDINAMARCA_MUNICIPALITIES[0]);
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    setIsLocating(true);
    setSearchResults([]);
    setSelectedLocation(null);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const result = await geocoder.reverseGeocode(latitude, longitude);
            if (result) {
              selectAddress(result);
            } else {
              selectAddress({
                id: `gps-${latitude}-${longitude}`,
                address: 'Ubicación GPS (Sin nomenclatura)',
                city: selectedCity === 'Cundinamarca' ? selectedMunicipality : selectedCity,
                department: 'Colombia',
                country: 'Colombia',
                lat: latitude,
                lng: longitude,
                type: 'gps'
              });
            }
          } catch (e) {
            selectAddress({
              id: `gps-${latitude}-${longitude}`,
              address: 'Ubicación GPS',
              city: selectedCity === 'Cundinamarca' ? selectedMunicipality : selectedCity,
              department: 'Colombia',
              country: 'Colombia',
              lat: latitude,
              lng: longitude,
              type: 'gps'
            });
          }
          setIsLocating(false);
        },
        (error) => {
          setIsLocating(false);
          toast({ 
            title: "Error de Ubicación", 
            description: "No pudimos obtener tu ubicación. Por favor, asegúrate de dar permisos.", 
            variant: "destructive" 
          });
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      toast({ title: "No Soportado", description: "Tu navegador no soporta geolocalización.", variant: "destructive" });
    }
  };

  const handleSearchAddress = async () => {
    if (!addressSearch || addressSearch.length < 5) {
      toast({ title: "Dirección muy corta", description: "Por favor, escribe una dirección más completa." });
      return;
    }
    
    setIsSearching(true);
    setSearchResults([]);
    setSelectedLocation(null);
    
    try {
      const searchCity = selectedCity === 'Cundinamarca' ? `${selectedMunicipality}, Cundinamarca` : selectedCity;
      const results = await geocoder.searchAddress(addressSearch, searchCity);
      if (results.length === 0) {
        toast({ title: "No encontramos la dirección", description: "Intenta agregar más detalles (ej. Barrio, Número de casa) o asegúrate de que esté en " + searchCity, variant: "destructive" });
      } else {
        setSearchResults(results);
      }
    } catch (e) {
      toast({ title: "Error", description: "Falló la búsqueda de la dirección.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const selectAddress = (result: GeocodingResult) => {
    setSelectedLocation(result);
    setSearchResults([]);
    setAddressSearch(result.address);
    setIsLocationConfirmed(false);
    toast({ title: "📍 Verifica el mapa", description: `Por favor, confirma que el pin esté en el lugar correcto.` });
  };

  const handleCheckout = () => {
    if (!name || !whatsapp || !selectedLocation || !isLocationConfirmed) {
      toast({
        title: "Faltan datos en tu misión",
        description: "Por favor, completa tu nombre, WhatsApp y confirma tu dirección en el mapa para poder enviar tu pedido.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "🚀 ¡Pedido en Camino!",
      description: "Tu rumba está por encenderse. El repartidor llegará en 15-20 min.",
    });
    clearCart();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl space-y-12 animate-in fade-in duration-700">
        <h1 className="text-5xl font-black italic tracking-tighter font-headline flex items-center gap-4">
           TU <span className="text-secondary neon-text-secondary">CARGAMENTO</span> <ShoppingBag className="h-10 w-10 text-secondary" />
        </h1>

        {cart.length === 0 ? (
           <div className="py-32 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-700">
             <div className="h-32 w-32 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(255,0,122,0.1)]">
                <ShoppingBag className="h-16 w-16 text-gray-700" />
             </div>
             <div className="text-center space-y-4">
                <h2 className="text-4xl font-black italic">EL CARRITO ESTÁ FRÍO</h2>
                <p className="text-gray-400 font-medium text-lg">Aún no has agregado la gasolina para la rumba.</p>
             </div>
             <Link href="/catalog">
                <Button size="lg" className="h-16 px-12 text-xl font-black bg-primary neon-glow-primary rounded-full italic tracking-widest text-black">
                  EXPLORAR CAVA <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Lista de Items */}
            <div className="lg:col-span-2 space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-6 p-6 bg-card/40 rounded-[2rem] border border-white/10 glass-morphism group hover:border-secondary/40 transition-all">
                   <div className="h-24 w-24 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                   </div>
                   <div className="flex-1 space-y-2">
                      <h3 className="text-xl font-black italic">{item.name}</h3>
                      <p className="text-secondary font-black text-2xl">{formatCurrency(item.price)}</p>
                   </div>
                   <div className="flex flex-col items-end gap-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500 hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => removeFromCart(item.id)}
                      >
                         <Trash2 className="h-6 w-6" />
                      </Button>
                      <div className="flex items-center gap-4 bg-white/5 rounded-full p-1 border border-white/10">
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeFromCart(item.id)}><Minus className="h-4 w-4" /></Button>
                         <span className="font-black text-lg">{item.quantity}</span>
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-secondary" onClick={() => addToCart(item)}><Plus className="h-4 w-4" /></Button>
                      </div>
                   </div>
                </div>
              ))}

              {/* Formulario de Envío */}
              <div className="mt-12 pt-8 border-t border-white/10 space-y-6">
                 <h3 className="text-2xl font-black italic text-white flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-primary" /> COORDENADAS DE LA RUMBA
                 </h3>
                 <Card className="bg-black/40 border-white/10 glass-morphism">
                   <CardContent className="p-6 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre del Líder</label>
                         <Input 
                           placeholder="¿A nombre de quién?" 
                           value={name} onChange={e => setName(e.target.value)} 
                           className="bg-white/5 border-white/10 focus:border-primary transition-colors text-white" 
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">WhatsApp de Contacto</label>
                         <Input 
                           placeholder="Para notificarte..." type="tel" 
                           value={whatsapp} onChange={e => setWhatsapp(e.target.value)} 
                           className="bg-white/5 border-white/10 focus:border-primary transition-colors text-white" 
                         />
                       </div>
                     </div>
                     
                     <div className="space-y-4 pt-4 border-t border-white/10">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Búsqueda de Dirección 🇨🇴</label>
                       
                       <div className="flex flex-col sm:flex-row gap-3">
                         <Select value={selectedCity} onValueChange={setSelectedCity}>
                           <SelectTrigger className="w-full sm:w-[180px] shrink-0 bg-white/5 border-white/10 text-white focus:ring-primary">
                             <SelectValue placeholder="Ciudad" />
                           </SelectTrigger>
                           <SelectContent>
                             {COLOMBIAN_CITIES.map(c => (
                               <SelectItem key={c} value={c}>{c}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>

                         {selectedCity === 'Cundinamarca' && (
                           <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality}>
                             <SelectTrigger className="w-full sm:w-[180px] shrink-0 bg-white/5 border-white/10 text-white focus:ring-primary">
                               <SelectValue placeholder="Municipio" />
                             </SelectTrigger>
                             <SelectContent>
                               {CUNDINAMARCA_MUNICIPALITIES.map(m => (
                                 <SelectItem key={m} value={m}>{m}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         )}
                         
                         <div className="relative flex-1 flex min-w-0 gap-2">
                           <Button 
                             variant="outline"
                             onClick={handleGetLocation}
                             disabled={isLocating}
                             className="bg-white/5 border-white/10 text-white shrink-0 hover:bg-white/10 hover:text-primary transition-colors"
                             title="Usar mi ubicación actual"
                             type="button"
                           >
                             {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                           </Button>
                           
                           <Input 
                             placeholder="Ej: Carrera 7 # 72-41" 
                             value={addressSearch} 
                             onChange={e => setAddressSearch(e.target.value)} 
                             className="bg-white/5 border-white/10 focus:border-primary transition-colors text-white flex-1" 
                             onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                           />
                           <Button 
                             onClick={handleSearchAddress}
                             disabled={isSearching}
                             className="bg-primary text-black hover:bg-primary/80 font-bold"
                           >
                             {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                           </Button>
                         </div>
                       </div>

                       {/* Resultados de búsqueda */}
                       {searchResults.length > 0 && (
                         <div className="bg-black/80 border border-primary/30 rounded-xl overflow-hidden mt-2">
                           {searchResults.map((res) => (
                             <div 
                               key={res.id} 
                               className="p-3 border-b border-white/5 hover:bg-primary/20 cursor-pointer flex items-start gap-3 transition-colors"
                               onClick={() => selectAddress(res)}
                             >
                               <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                               <div>
                                 <p className="font-bold text-white text-sm">{res.address}</p>
                                 <p className="text-xs text-gray-400">{res.city}, {res.department}, {res.country}</p>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}

                       {/* Validación en el Mapa */}
                       {selectedLocation && !isLocationConfirmed && (
                         <div className="mt-4 space-y-3 animate-in fade-in">
                           <p className="text-sm text-center font-bold text-white uppercase">¿Es esta tu ubicación exacta?</p>
                           <div className="h-48 w-full relative rounded-xl overflow-hidden border-2 border-primary">
                             <DeliveryMap 
                               center={[selectedLocation.lng, selectedLocation.lat]}
                               zoom={16}
                               markers={[{ id: 'customer', type: 'customer', lng: selectedLocation.lng, lat: selectedLocation.lat }]}
                             />
                           </div>
                           <div className="flex gap-2">
                             <Button 
                               variant="outline" 
                               className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/20"
                               onClick={() => setSelectedLocation(null)}
                             >
                               ❌ Corregir
                             </Button>
                             <Button 
                               className="flex-1 bg-green-500 hover:bg-green-600 text-black font-black"
                               onClick={() => setIsLocationConfirmed(true)}
                             >
                               <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar
                             </Button>
                           </div>
                         </div>
                       )}

                       {/* Dirección confirmada */}
                       {selectedLocation && isLocationConfirmed && (
                         <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl mt-2 animate-in fade-in">
                            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                            <div>
                               <p className="text-sm font-bold text-green-500">Ubicación Confirmada</p>
                               <p className="text-xs text-white font-mono opacity-80">{selectedLocation.address} ({selectedLocation.city})</p>
                               <p className="text-[10px] text-gray-500 font-mono mt-1">Lat: {selectedLocation.lat} / Lng: {selectedLocation.lng}</p>
                            </div>
                         </div>
                       )}
                     </div>

                     <div className="space-y-2 pt-2">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notas / Celebración Especial</label>
                       <Textarea 
                         placeholder="¿Están celebrando un cumpleaños, aniversario, o despedida? ¡Déjanos un detalle para darles una cortesía!" 
                         value={notes} onChange={e => setNotes(e.target.value)}
                         className="bg-white/5 border-white/10 focus:border-primary transition-colors text-white resize-none h-20" 
                       />
                     </div>
                   </CardContent>
                 </Card>
              </div>

              {/* UPSELL SECTION IN CART */}
              <div className="mt-8 pt-8 border-t border-white/10">
                 <h3 className="text-xl font-black italic text-gray-300 mb-6 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#ff0f7b]" /> ANTES DE PAGAR, ¿NO OLVIDAS ESTO?
                 </h3>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { id: 'u1', name: 'Hielo 2kg', price: 8000, category: 'Extras', image: 'https://picsum.photos/seed/ice/100/100' },
                      { id: 'u2', name: 'Limones & Sal', price: 5000, category: 'Extras', image: 'https://picsum.photos/seed/lemons/100/100' },
                      { id: 'u3', name: 'RedBull', price: 9000, category: 'Extras', image: 'https://picsum.photos/seed/energy/100/100' },
                      { id: 'u4', name: 'Agua Tónica', price: 15000, category: 'Extras', image: 'https://picsum.photos/seed/tonic/100/100' }
                    ].map((p, i) => (
                       <div key={i} className="apple-frost p-4 rounded-2xl flex flex-col items-center text-center gap-3 border border-white/5 hover:border-primary/30 transition-colors group cursor-pointer" onClick={() => { addToCart(p as any); toast({title:"Agregado", description:`${p.name} sumado a tu pedido.`}); }}>
                          <img src={p.image} alt={p.name} className="h-16 w-16 rounded-full object-cover shadow-lg group-hover:scale-110 transition-transform" />
                          <div className="space-y-1">
                             <h4 className="font-bold text-sm text-white leading-tight">{p.name}</h4>
                             <p className="text-primary font-black text-sm">+{formatCurrency(p.price)}</p>
                          </div>
                          <Button size="sm" variant="outline" className="w-full h-8 rounded-full border-white/10 text-xs font-bold hover:bg-primary/20 hover:text-primary transition-all">
                             SUMAR
                          </Button>
                       </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Resumen de Compra */}
            <Card className="bg-card/60 border-primary/40 rounded-[2.5rem] overflow-hidden neon-glow-primary lg:sticky lg:top-32">
               <CardHeader className="bg-primary/10 border-b border-primary/20 p-8">
                  <CardTitle className="text-2xl font-black italic tracking-tighter">RESUMEN DE RUMBA</CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                     <div className="flex justify-between text-gray-400 font-bold uppercase text-xs tracking-widest">
                        <span>Subtotal</span>
                        <span>{formatCurrency(total)}</span>
                     </div>
                     <div className="flex justify-between text-secondary font-black uppercase text-xs tracking-widest">
                        <span>Envío Flash (15 min)</span>
                        <span>{formatCurrency(15000)}</span>
                     </div>
                     <div className="h-[1px] bg-white/10 w-full" />
                     <div className="flex flex-wrap justify-between items-end gap-x-2 gap-y-1">
                        <span className="text-xl font-black italic shrink-0">TOTAL</span>
                        <span className="text-3xl lg:text-2xl xl:text-4xl font-black text-primary neon-text-primary italic text-right break-words">{formatCurrency(total + 15000)}</span>
                     </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                       className="w-full h-16 text-xl font-black italic tracking-widest bg-primary text-black rounded-2xl neon-glow-primary hover:scale-[1.02] transition-all"
                       onClick={handleCheckout}
                    >
                       <Zap className="mr-3 h-6 w-6 text-black" /> PEDIR AHORA
                    </Button>
                    <p className="text-[10px] text-gray-500 text-center uppercase font-black leading-tight">
                       Al hacer clic, confirmas que eres mayor de edad y aceptas nuestros términos de rumba responsable.
                    </p>
                  </div>
               </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}