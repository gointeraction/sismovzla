import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp, writeBatch, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SupplyInventory, SupplyRequest, Shelter } from '../types';
import { Package, Truck, Plus, Download, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
  Agua: '💧', Alimentos: '🍎', Medicamentos: '💊', Carpas: '⛺',
  'Mantas/Ropa': '🧥', Higiene: '🧼', Herramientas: '🔧', Combustible: '⛽',
  Comunicaciones: '📡', Otro: '📦',
};

const CATEGORIES = ['Agua', 'Alimentos', 'Medicamentos', 'Carpas', 'Mantas/Ropa', 'Higiene', 'Herramientas', 'Combustible', 'Comunicaciones', 'Otro'] as const;

export default function SupplyLogisticsModule() {
  const [inventory, setInventory] = useState<SupplyInventory[]>([]);
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [view, setView] = useState<'inventory' | 'requests'>('inventory');
  const [showForm, setShowForm] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('Todos');

  const [form, setForm] = useState({
    warehouseId: '', category: 'Agua' as SupplyInventory['category'],
    itemName: '', unit: 'Unidades' as SupplyInventory['unit'], quantity: 0,
    minThreshold: 0, expirationDate: '', notes: '',
  });

  const [reqForm, setReqForm] = useState({
    fromWarehouse: '', toLocation: '', priority: 'Media' as SupplyRequest['priority'],
    items: [{ itemId: '', itemName: '', quantityRequested: 0 }] as SupplyRequest['items'],
  });

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'supply_inventory'), orderBy('createdAt', 'desc')), snap => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyInventory)));
    });
    const unsub2 = onSnapshot(query(collection(db, 'supply_requests'), orderBy('createdAt', 'desc')), snap => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as SupplyRequest)));
    });
    const unsub3 = onSnapshot(collection(db, 'shelters'), snap => {
      setShelters(snap.docs.map(d => ({ id: d.id, ...d.data() } as Shelter)));
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'supply_inventory'), {
        warehouseId: form.warehouseId || 'general', category: form.category,
        itemName: form.itemName, unit: form.unit, quantity: form.quantity,
        minThreshold: form.minThreshold || null,
        expirationDate: form.expirationDate ? new Date(form.expirationDate).getTime() : null,
        notes: form.notes || null, createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ warehouseId: '', category: 'Agua', itemName: '', unit: 'Unidades', quantity: 0, minThreshold: 0, expirationDate: '', notes: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'supply_requests'), {
        ...reqForm, status: 'Pendiente', reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon', createdAt: Date.now(),
      });
      setShowRequestForm(false);
      setReqForm({ fromWarehouse: '', toLocation: '', priority: 'Media', items: [{ itemId: '', itemName: '', quantityRequested: 0 }] });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateRequest = async (id: string, status: SupplyRequest['status']) => {
    try {
      const data: any = { status };
      if (status === 'Entregado') {
        data.deliveredAt = Date.now();
        const req = requests.find(r => r.id === id);
        if (req) {
          const batch = writeBatch(db);
          for (const item of req.items) {
            const q = query(collection(db, 'supply_inventory'), where('itemName', '==', item.itemName));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const invDoc = snap.docs[0];
              const invData = invDoc.data() as SupplyInventory;
              const newQty = Math.max(0, invData.quantity - item.quantityRequested);
              batch.update(doc(db, 'supply_inventory', invDoc.id), { quantity: newQty });
            }
          }
          await batch.commit();
        }
      }
      await updateDoc(doc(db, 'supply_requests', id), data);
    } catch (err) { console.error(err); }
  };

  const filtered = inventory.filter(i => filterCategory === 'Todos' || i.category === filterCategory);
  const lowStock = inventory.filter(i => i.minThreshold && i.quantity <= i.minThreshold);
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    const items = inventory.filter(i => i.category === cat);
    acc[cat] = { total: items.reduce((s, i) => s + i.quantity, 0), count: items.length };
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return (
    <div className="space-y-6 animate-fade-in">
      {lowStock.length > 0 && (
        <div className="bg-red-600/20 border border-red-500/40 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <p className="font-mono font-bold text-red-400 text-sm uppercase">{lowStock.length} artículo(s) con stock bajo</p>
            <p className="text-[10px] font-mono text-red-400/60">Requieren reabastecimiento urgente</p>
          </div>
        </div>
      )}

      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">LOGÍSTICA DE SUMINISTROS</h2>
            <p className="text-xs text-white/50 mt-1">Inventario de centros de acopio y solicitudes de reabastecimiento</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowForm(true); setView('inventory'); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> AGREGAR ITEM
          </button>
          <button onClick={() => { setShowRequestForm(true); setView('requests'); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Truck className="w-4 h-4" /> SOLICITAR
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setView('inventory')}
          className={`px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${
            view === 'inventory' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-black/20 border-white/10 text-white/50'
          }`}>
          INVENTARIO
        </button>
        <button onClick={() => setView('requests')}
          className={`px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${
            view === 'requests' ? 'bg-orange-600 border-orange-400 text-white' : 'bg-black/20 border-white/10 text-white/50'
          }`}>
          SOLICITUDES ({requests.filter(r => r.status === 'Pendiente').length})
        </button>
      </div>

      {view === 'inventory' && (
        <>
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Agregar item al inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Categoría</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as SupplyInventory['category'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Nombre del item</label>
                  <input value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Unidad</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as SupplyInventory['unit'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="Unidades">Unidades</option>
                    <option value="Litros">Litros</option>
                    <option value="Kilogramos">Kilogramos</option>
                    <option value="Cajas">Cajas</option>
                    <option value="Pallets">Pallets</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Cantidad</label>
                  <input type="number" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Stock mínimo (alerta)</label>
                  <input type="number" value={form.minThreshold || ''} onChange={e => setForm({ ...form, minThreshold: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Fecha de vencimiento</label>
                  <input type="date" value={form.expirationDate} onChange={e => setForm({ ...form, expirationDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase">Notas</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" rows={2} />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
                {submitting ? 'AGREGANDO...' : 'AGREGAR AL INVENTARIO'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {CATEGORIES.map(cat => (
              <div key={cat} className="bg-[#121212] border border-white/10 rounded-xl p-3 text-center">
                <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                <p className="text-xs font-mono font-bold text-white mt-1">{byCategory[cat]?.total || 0}</p>
                <p className="text-[8px] font-mono text-white/40 uppercase">{cat}</p>
                <p className="text-[8px] font-mono text-white/30">{byCategory[cat]?.count || 0} items</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono">
              <option value="Todos">Todas las categorías</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            {filtered.map(item => (
              <div key={item.id} className={`bg-[#121212] border rounded-xl p-4 flex items-center justify-between ${
                item.minThreshold && item.quantity <= item.minThreshold ? 'border-red-500/30' : 'border-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[item.category]}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{item.itemName}</span>
                      <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/60">{item.category}</span>
                    </div>
                    <p className="text-[10px] font-mono text-white/50 mt-0.5">
                      Stock: <strong className={item.minThreshold && item.quantity <= item.minThreshold ? 'text-red-400' : 'text-white'}>
                        {item.quantity} {item.unit}
                      </strong>
                      {item.minThreshold ? ` · Mín: ${item.minThreshold}` : ''}
                      {item.expirationDate ? ` · Vence: ${new Date(item.expirationDate).toLocaleDateString('es-VE')}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] font-mono px-2 py-1 rounded ${
                  item.minThreshold && item.quantity <= item.minThreshold
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {item.minThreshold && item.quantity <= item.minThreshold ? 'CRÍTICO' : 'OK'}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-white/30 font-mono text-sm">No hay items en el inventario. Agrega suministros usando el botón superior.</div>
            )}
          </div>
        </>
      )}

      {view === 'requests' && (
        <>
          {showRequestForm && (
            <form onSubmit={handleRequestSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Nueva solicitud de suministros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Desde (almacén)</label>
                  <input value={reqForm.fromWarehouse} onChange={e => setReqForm({ ...reqForm, fromWarehouse: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Centro de Acopio Principal" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Hacia (destino)</label>
                  <select value={reqForm.toLocation} onChange={e => setReqForm({ ...reqForm, toLocation: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="">Seleccionar destino</option>
                    {shelters.map(s => <option key={s.id} value={s.name}>{s.name} ({s.state})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Prioridad</label>
                  <select value={reqForm.priority} onChange={e => setReqForm({ ...reqForm, priority: e.target.value as SupplyRequest['priority'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="Crítica">Crítica</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase">Items solicitados</label>
                {reqForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mt-2">
                    <input value={item.itemName} onChange={e => {
                      const items = [...reqForm.items];
                      items[idx] = { ...items[idx], itemName: e.target.value };
                      setReqForm({ ...reqForm, items });
                    }} className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono" placeholder="Nombre del item" />
                    <input type="number" value={item.quantityRequested || ''} onChange={e => {
                      const items = [...reqForm.items];
                      items[idx] = { ...items[idx], quantityRequested: parseInt(e.target.value) || 0 };
                      setReqForm({ ...reqForm, items });
                    }} className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono" placeholder="Cant." />
                    {idx === reqForm.items.length - 1 && (
                      <button type="button" onClick={() => setReqForm({ ...reqForm, items: [...reqForm.items, { itemId: '', itemName: '', quantityRequested: 0 }] })}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-mono cursor-pointer">+</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
                {submitting ? 'ENVIANDO...' : 'CREAR SOLICITUD'}
              </button>
            </form>
          )}

          <div className="grid gap-3">
            {requests.map(r => (
              <div key={r.id} className="bg-[#121212] border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Truck className="w-4 h-4 text-orange-400" />
                      <span className="font-mono font-bold text-sm text-white">{r.priority.toUpperCase()} · {r.fromWarehouse} → {r.toLocation}</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                        r.status === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        r.status === 'En Tránsito' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        r.status === 'Entregado' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>{r.status}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {r.items.map((item, i) => (
                        <p key={i} className="text-[10px] font-mono text-white/60">
                          {item.itemName} — Solicitado: {item.quantityRequested} {item.quantityDelivered ? `· Entregado: ${item.quantityDelivered}` : ''}
                        </p>
                      ))}
                    </div>
                    <p className="text-[9px] font-mono text-white/30 mt-2">{new Date(r.createdAt).toLocaleString('es-VE')} · {r.reportedBy}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {r.status === 'Pendiente' && (
                      <button onClick={() => updateRequest(r.id, 'En Tránsito')}
                        className="px-2 py-1 rounded text-[8px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-pointer uppercase">
                        Despachar
                      </button>
                    )}
                    {r.status === 'En Tránsito' && (
                      <button onClick={() => updateRequest(r.id, 'Entregado')}
                        className="px-2 py-1 rounded text-[8px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30 cursor-pointer uppercase">
                        Entregar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-12 text-white/30 font-mono text-sm">No hay solicitudes de suministros.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
