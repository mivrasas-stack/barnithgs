"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  Calculator, TrendingUp, TrendingDown, DollarSign, Wallet, Activity, 
  ArrowUpRight, ArrowDownRight, Clock, Plus, Package, Truck
} from "lucide-react";
import { openShift, closeShift, addTransaction, getOpenRegister, getAccountingMetrics, getClosedShifts } from "@/actions/accounting";
import { supabase } from "@/lib/supabase";

export function AccountingView() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cash' | 'transactions'>('dashboard');
  
  // State for metrics
  const [metrics, setMetrics] = useState<any>({ orders: [], expenses: [] });
  const [chartData, setChartData] = useState<any[]>([]);
  
  // State for Cash Register
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftAmount, setShiftAmount] = useState("");
  
  // State for Transactions
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'income'|'expense'>('expense');
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("Suministros");
  const [txDesc, setTxDesc] = useState("");
  const [txMethod, setTxMethod] = useState<'cash'|'transfer'>('cash');
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [closedShifts, setClosedShifts] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    // Fetch metrics
    const data = await getAccountingMetrics();
    setMetrics(data);
    
    // Process chart data (last 7 days dummy mapping or real mapping)
    // For simplicity, we just aggregate total revenues and expenses by day
    const aggregated: Record<string, { date: string, ingresos: number, gastos: number }> = {};
    
    data.orders.forEach((o: any) => {
      const date = new Date(o.created_at).toLocaleDateString('es-CO');
      if (!aggregated[date]) aggregated[date] = { date, ingresos: 0, gastos: 0 };
      aggregated[date].ingresos += Number(o.total_amount);
    });
    
    data.expenses.forEach((e: any) => {
      const date = new Date(e.created_at).toLocaleDateString('es-CO');
      if (!aggregated[date]) aggregated[date] = { date, ingresos: 0, gastos: 0 };
      aggregated[date].gastos += Number(e.amount);
    });
    
    const cData = Object.values(aggregated).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
    if(cData.length === 0) {
       // Mock data if empty for visual
       cData.push({ date: 'Hoy', ingresos: 0, gastos: 0 });
    }
    setChartData(cData);

    // Fetch shift
    const shift = await getOpenRegister();
    setCurrentShift(shift.data || null);

    // Fetch recent transactions
    const { data: txs } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10);
    setRecentTxs(txs || []);

    // Fetch closed shifts history
    const closed = await getClosedShifts();
    setClosedShifts(closed.data || []);

    setIsLoading(false);
  };

  const handleOpenShift = async () => {
    if(!shiftAmount) return;
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;
    
    const res = await openShift(user.id, Number(shiftAmount));
    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Caja Abierta", description: `Iniciaste con $${Number(shiftAmount).toLocaleString()}` });
      setIsShiftModalOpen(false);
      fetchData();
    }
  };

  const handleCloseShift = async () => {
    if(!shiftAmount || !currentShift) return;
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;
    
    // Calculate expected (In real life, sum up cash orders + initial - cash expenses)
    const expected = Number(currentShift.initial_balance); // Simplified for now
    
    const res = await closeShift(currentShift.id, user.id, Number(shiftAmount), expected);
    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Caja Cerrada", description: "Turno finalizado correctamente." });
      setIsShiftModalOpen(false);
      fetchData();
    }
  };

  const handleAddTx = async () => {
    if(!txAmount || !txCategory) {
       toast({ variant: "destructive", title: "Error", description: "Completa los campos obligatorios." });
       return;
    }
    if(txMethod === 'cash' && !currentShift) {
       toast({ variant: "destructive", title: "Error", description: "Para registrar un movimiento en EFECTIVO, debes tener la caja abierta." });
       return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;

    const res = await addTransaction(currentShift ? currentShift.id : null, user.id, txType, Number(txAmount), txCategory, txDesc, txMethod);
    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Movimiento Registrado" });
      setIsTxModalOpen(false);
      fetchData();
    }
  };

  const totalIngresos = metrics.orders.reduce((acc: number, o: any) => acc + Number(o.total_amount), 0);
  
  const cogs = metrics.orders.reduce((acc: number, o: any) => {
    const orderCost = (o.order_items || []).reduce((sum: number, item: any) => sum + (Number(item.unit_cost || 0) * Number(item.quantity || 1)), 0);
    return acc + orderCost;
  }, 0);

  const totalDomicilios = metrics.orders.reduce((acc: number, o: any) => acc + Number(o.delivery_fee || 0), 0);
  const totalPropinas = metrics.orders.reduce((acc: number, o: any) => acc + Number(o.tip_amount || 0), 0);

  const totalGastos = metrics.expenses.reduce((acc: number, e: any) => acc + Number(e.amount), 0);
  
  const beneficioBruto = totalIngresos - cogs;
  // El domicilio suma al ingreso de la tienda, la propina idealmente no, se la lleva el driver.
  const beneficioNeto = beneficioBruto - totalGastos + totalDomicilios;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER TABS */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <Button variant={activeTab === 'dashboard' ? 'default' : 'ghost'} onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'bg-primary/20 text-primary border border-primary/50' : ''}>
          <Activity className="h-4 w-4 mr-2" /> Dashboard
        </Button>
        <Button variant={activeTab === 'cash' ? 'default' : 'ghost'} onClick={() => setActiveTab('cash')} className={activeTab === 'cash' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : ''}>
          <Calculator className="h-4 w-4 mr-2" /> Caja Menor
        </Button>
        <Button variant={activeTab === 'transactions' ? 'default' : 'ghost'} onClick={() => setActiveTab('transactions')} className={activeTab === 'transactions' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : ''}>
          <Wallet className="h-4 w-4 mr-2" /> Libro Diario
        </Button>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="glass-morphism p-6 border-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="h-16 w-16" /></div>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Ventas Brutas</p>
               <h3 className="text-2xl font-black text-white">${totalIngresos.toLocaleString('es-CO')}</h3>
               <p className="text-green-400 text-xs mt-2 flex items-center"><TrendingUp className="h-3 w-3 mr-1"/> Ingreso Total</p>
            </Card>
            <Card className="glass-morphism p-6 border-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Package className="h-16 w-16" /></div>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Costo Mercancía</p>
               <h3 className="text-2xl font-black text-orange-400">-${cogs.toLocaleString('es-CO')}</h3>
               <p className="text-orange-400/80 text-xs mt-2 flex items-center">Inversión en inventario</p>
            </Card>
            <Card className="glass-morphism p-6 border-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingDown className="h-16 w-16" /></div>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Gastos (30d)</p>
               <h3 className="text-2xl font-black text-red-400">-${totalGastos.toLocaleString('es-CO')}</h3>
               <p className="text-red-400/80 text-xs mt-2 flex items-center">Operación y nómina</p>
            </Card>
            <Card className="glass-morphism p-6 border-white/10 relative overflow-hidden border-primary/30">
               <div className="absolute inset-0 bg-primary/5"></div>
               <div className="absolute top-0 right-0 p-4 opacity-10"><Activity className="h-16 w-16 text-primary" /></div>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">Beneficio Neto</p>
               <h3 className="text-2xl font-black text-primary relative z-10">${beneficioNeto.toLocaleString('es-CO')}</h3>
               <p className="text-primary/80 text-xs mt-2 relative z-10">Flujo libre real</p>
            </Card>
            <Card className="glass-morphism p-6 border-white/10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Truck className="h-16 w-16" /></div>
               <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Domicilios / Propinas</p>
               <h3 className="text-2xl font-black text-white">+${totalDomicilios.toLocaleString('es-CO')}</h3>
               <p className="text-gray-500 text-xs mt-2 flex items-center">Propinas: ${totalPropinas.toLocaleString('es-CO')}</p>
            </Card>
          </div>

          <Card className="glass-morphism p-6 border-white/10">
            <h3 className="text-xl font-bold mb-6">Flujo de Ingresos vs Gastos</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="date" stroke="#666" tick={{fill: '#999'}} />
                  <YAxis stroke="#666" tick={{fill: '#999'}} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="ingresos" name="Ingresos" fill="var(--theme-primary)" radius={[4,4,0,0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* CAJA MENOR TAB */}
      {activeTab === 'cash' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="glass-morphism p-8 border-white/10 text-center space-y-6">
             <div className={`h-24 w-24 mx-auto rounded-full flex items-center justify-center border-4 ${currentShift ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-gray-600 bg-gray-800 text-gray-500'}`}>
                <Calculator className="h-10 w-10" />
             </div>
             <div>
               <h3 className="text-2xl font-black uppercase tracking-widest">{currentShift ? 'Turno Abierto' : 'Caja Cerrada'}</h3>
               <p className="text-gray-400 mt-2">
                 {currentShift 
                   ? `Iniciado el ${new Date(currentShift.opened_at).toLocaleString('es-CO')}` 
                   : 'Inicia el turno para registrar ventas en efectivo.'}
               </p>
             </div>
             
             {currentShift ? (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                     <span className="text-gray-400 font-bold">Base Inicial</span>
                     <span className="text-xl font-black">${Number(currentShift.initial_balance).toLocaleString('es-CO')}</span>
                  </div>
                  <Button size="lg" className="w-full bg-red-500 hover:bg-red-600 font-bold text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]" onClick={() => { setShiftAmount(""); setIsShiftModalOpen(true); }}>
                     CERRAR CAJA
                  </Button>
                </div>
             ) : (
                <Button size="lg" className="w-full bg-green-500 hover:bg-green-600 font-bold text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]" onClick={() => { setShiftAmount(""); setIsShiftModalOpen(true); }}>
                   ABRIR TURNO
                </Button>
             )}
          </Card>

          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center"><Clock className="mr-2 h-5 w-5 text-gray-400"/> Historial Reciente</h3>
            {closedShifts.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {closedShifts.map(shift => {
                  const variance = Number(shift.variance || 0);
                  const isShort = variance < 0;
                  return (
                    <div key={shift.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm">Cerrado por: {shift.closer?.name || 'Admin'}</p>
                          <p className="text-xs text-gray-400">{new Date(shift.closed_at).toLocaleString('es-CO')}</p>
                        </div>
                        <Badge variant="outline" className={isShort ? "border-red-500/50 text-red-400" : "border-green-500/50 text-green-400"}>
                          {isShort ? "Descuadre" : "Cuadrada"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <div>
                          <p className="text-gray-500 text-xs uppercase">Esperado</p>
                          <p className="font-bold text-white">${Number(shift.expected_balance).toLocaleString('es-CO')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500 text-xs uppercase">Real (Contado)</p>
                          <p className={`font-black ${isShort ? 'text-red-400' : 'text-green-400'}`}>
                            ${Number(shift.actual_balance).toLocaleString('es-CO')}
                          </p>
                        </div>
                      </div>
                      {variance !== 0 && (
                        <div className={`mt-2 text-xs font-bold ${isShort ? 'text-red-400' : 'text-green-400'}`}>
                          Diferencia: {isShort ? '' : '+'}${variance.toLocaleString('es-CO')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">El historial de turnos pasados aparecerá aquí cuando cierres cajas.</p>
            )}
          </div>
        </div>
      )}

      {/* TRANSACCIONES TAB */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Libro Diario</h3>
            <Button className="font-bold bg-white text-black hover:bg-gray-200" onClick={() => setIsTxModalOpen(true)}>
               <Plus className="mr-2 h-4 w-4" /> REGISTRAR MOVIMIENTO
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3">
             {recentTxs.map(tx => (
               <div key={tx.id} className="glass-morphism p-4 rounded-xl border border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {tx.type === 'income' ? <ArrowUpRight /> : <ArrowDownRight />}
                     </div>
                     <div>
                        <p className="font-bold">{tx.category}</p>
                        <p className="text-sm text-gray-500">{tx.description} • {new Date(tx.created_at).toLocaleTimeString()}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className={`font-black text-lg ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString('es-CO')}
                     </p>
                     <Badge variant="outline" className="text-[10px] mt-1">{tx.payment_method === 'cash' ? 'EFECTIVO' : 'TRANSFERENCIA'}</Badge>
                  </div>
               </div>
             ))}
             {recentTxs.length === 0 && (
               <div className="text-center py-10 text-gray-500">No hay movimientos recientes registrados manualmente.</div>
             )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-widest text-primary">
              {currentShift ? 'Cierre de Caja' : 'Apertura de Caja'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>{currentShift ? 'Efectivo Contado (Balance Real)' : 'Base Inicial en Efectivo'}</Label>
              <Input 
                type="number" 
                placeholder="Ej. 150000"
                value={shiftAmount}
                onChange={e => setShiftAmount(e.target.value)}
                className="bg-black border-white/20 text-2xl h-14 font-black"
              />
            </div>
            <Button size="lg" className="w-full font-bold" onClick={currentShift ? handleCloseShift : handleOpenShift}>
              CONFIRMAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTxModalOpen} onOpenChange={setIsTxModalOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-widest text-primary">
              Nuevo Movimiento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-2">
               <Button variant={txType === 'expense' ? 'default' : 'outline'} className={txType === 'expense' ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-400'} onClick={() => setTxType('expense')}>GASTO</Button>
               <Button variant={txType === 'income' ? 'default' : 'outline'} className={txType === 'income' ? 'bg-green-500 hover:bg-green-600 text-white' : 'text-gray-400'} onClick={() => setTxType('income')}>INGRESO EXTRA</Button>
            </div>
            
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" placeholder="Ej. 50000" value={txAmount} onChange={e => setTxAmount(e.target.value)} className="bg-black border-white/20 text-xl font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select className="w-full bg-black border border-white/20 rounded-md p-2 text-white text-sm focus:outline-none" value={txCategory} onChange={e => setTxCategory(e.target.value)}>
                  <option value="Suministros">Suministros (Hielo, etc.)</option>
                  <option value="Nómina">Nómina / Pago</option>
                  <option value="Proveedor">Pago a Proveedor</option>
                  <option value="Servicios">Servicios Generales</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <select className="w-full bg-black border border-white/20 rounded-md p-2 text-white text-sm focus:outline-none" value={txMethod} onChange={e => setTxMethod(e.target.value as any)}>
                  <option value="cash">Efectivo de Caja</option>
                  <option value="transfer">Transferencia / Nequi</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Input placeholder="Detalles del movimiento..." value={txDesc} onChange={e => setTxDesc(e.target.value)} className="bg-black border-white/20" />
            </div>

            <Button size="lg" className="w-full font-bold mt-4" onClick={handleAddTx}>
              REGISTRAR {txType === 'expense' ? 'GASTO' : 'INGRESO'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
