import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { EvacuationRoute } from '../types';
import { Route, MapPin, AlertTriangle, CheckCircle, XCircle, AlertCircle, Download, Plus, RefreshCw } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

const BLOCKAGE_COLORS: Record<string, string> = {
  Despejada: 'bg-green-500/20 text-green-400 border-green-500/30',
  Parcial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Bloqueada: 'bg-red-500/20 text-red-400 border-red-500/30',
  Evaluando: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Despejada: CheckCircle,
  Parcial: AlertCircle,
  Bloqueada: XCircle,
  Evaluando: RefreshCw,
};

const STATES = ['Caracas', 'La Guaira', 'Aragua', 'Carabobo', 'Otros'] as const;
const BLOCKAGE_TYPES = ['Escombros', 'Hundimiento', 'Deslizamiento', 'Vehículos', 'Agua', 'Otro'] as const;

export default function EvacuationRoutesPanel() {
  const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
  const [filterState, setFilterState] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { getPosition } = useGeolocation();

  const [formData, setFormData] = useState({
    name: '',
    state: 'Caracas' as EvacuationRoute['state'],
    segment: '',
    status: 'Evaluando' as EvacuationRoute['status'],
    blockageType: '' as string,
    latitude: 0,
    longitude: 0,
    barrierType: '' as string,
    estimatedClearTime: '',
    clearingAgency: '',
    alternativeRoute: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'evacuation_routes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRoutes(snap.docs.map(d => ({ id: d.id, ...d.data() } as EvacuationRoute)));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.segment) return;
    setSubmitting(true);
    try {
      const pos = await getPosition();
      await addDoc(collection(db, 'evacuation_routes'), {
        ...formData, latitude: pos?.lat ?? formData.latitude, longitude: pos?.lng ?? formData.longitude,
        blockageType: formData.blockageType || null,
        barrierType: formData.barrierType || null,
        estimatedClearTime: formData.estimatedClearTime || null,
        clearingAgency: formData.clearingAgency || null,
        alternativeRoute: formData.alternativeRoute || null,
        reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setShowForm(false);
      setFormData({ name: '', state: 'Caracas', segment: '', status: 'Evaluando', blockageType: '', latitude: 0, longitude: 0, barrierType: '', estimatedClearTime: '', clearingAgency: '', alternativeRoute: '' });
    } catch (err) {
      console.error('Error reporting route:', err);
    }
    setSubmitting(false);
  };

  const updateRouteStatus = async (id: string, newStatus: EvacuationRoute['status']) => {
    try {
      await updateDoc(doc(db, 'evacuation_routes', id), { status: newStatus, updatedAt: Date.now() });
    } catch (err) {
      console.error('Error updating route:', err);
    }
  };

  const filtered = routes.filter(r => {
    if (filterState !== 'Todos' && r.state !== filterState) return false;
    if (filterStatus !== 'Todos' && r.status !== filterStatus) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = 'Nombre,Vía,Estado,Estatus,Tipo Bloqueo,Barrera,Tiempo Est. Despeje,Agencia,Ruta Alternativa,Lat,Lng';
    const rows = filtered.map(r =>
      `"${r.name}","${r.segment}","${r.state}","${r.status}","${r.blockageType || '-'}","${r.barrierType || '-'}","${r.estimatedClearTime || '-'}","${r.clearingAgency || '-'}","${r.alternativeRoute || '-'}",${r.latitude},${r.longitude}`
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'evacuacion_vias.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const getCountByStatus = (status: string) => routes.filter(r => r.status === status).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Route className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">VÍAS Y RUTAS DE EVACUACIÓN</h2>
            <p className="text-xs text-white/50 mt-1">Estado de transitabilidad vial post-sismo</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> REPORTAR VÍA
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-green-400">{getCountByStatus('Despejada')}</p>
          <p className="text-[10px] font-mono text-green-400/70 uppercase">Despejadas</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-yellow-400">{getCountByStatus('Parcial')}</p>
          <p className="text-[10px] font-mono text-yellow-400/70 uppercase">Parciales</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-red-400">{getCountByStatus('Bloqueada')}</p>
          <p className="text-[10px] font-mono text-red-400/70 uppercase">Bloqueadas</p>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-gray-400">{getCountByStatus('Evaluando')}</p>
          <p className="text-[10px] font-mono text-gray-400/70 uppercase">Evaluando</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Reportar estado de vía</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Nombre de la vía</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Av. Libertador" required />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Estado</label>
              <select value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value as EvacuationRoute['state'] })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-white/50 uppercase">Tramo (Desde — Hasta)</label>
              <input value={formData.segment} onChange={e => setFormData({ ...formData, segment: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Desde Plaza Venezuela hasta Chacaíto" required />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Estado actual</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as EvacuationRoute['status'] })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Despejada">Despejada</option>
                <option value="Parcial">Parcial</option>
                <option value="Bloqueada">Bloqueada</option>
                <option value="Evaluando">Evaluando</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Tipo de bloqueo</label>
              <select value={formData.blockageType} onChange={e => setFormData({ ...formData, blockageType: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="">N/A</option>
                {BLOCKAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Tipo de barrera</label>
              <select value={formData.barrierType} onChange={e => setFormData({ ...formData, barrierType: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="">N/A</option>
                <option value="Total">Total</option>
                <option value="Parcial">Parcial</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Tiempo estimado de despeje</label>
              <input value={formData.estimatedClearTime} onChange={e => setFormData({ ...formData, estimatedClearTime: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="2h / En obra / Desconocido" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Agencia encargada</label>
              <input value={formData.clearingAgency} onChange={e => setFormData({ ...formData, clearingAgency: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="MPPP, Bomberos" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-white/50 uppercase">Ruta alternativa sugerida</label>
              <input value={formData.alternativeRoute} onChange={e => setFormData({ ...formData, alternativeRoute: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Desvío por Av. Principal" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'ENVIANDO...' : 'REPORTAR VÍA'}
          </button>
        </form>
      )}

      <div className="flex gap-2 flex-wrap">
        <select value={filterState} onChange={e => setFilterState(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono">
          <option value="Todos">Todos los estados</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono">
          <option value="Todos">Todos los estatus</option>
          {['Despejada', 'Parcial', 'Bloqueada', 'Evaluando'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid gap-3">
        {filtered.map(route => {
          const Icon = STATUS_ICONS[route.status] || AlertTriangle;
          return (
            <div key={route.id} className={`${BLOCKAGE_COLORS[route.status]} border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3`}>
              <div className="flex items-start gap-3 flex-1">
                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-mono font-bold text-sm">{route.name}</h3>
                    <span className="text-[10px] font-mono opacity-60">{route.state}</span>
                  </div>
                  <p className="text-xs font-mono opacity-70 mt-0.5">{route.segment}</p>
                  {route.blockageType && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono mt-1.5 bg-black/20 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3" /> {route.blockageType}
                    </span>
                  )}
                  {route.alternativeRoute && (
                    <p className="text-[10px] font-mono text-emerald-300 mt-1">Desvío: {route.alternativeRoute}</p>
                  )}
                  {route.clearingAgency && (
                    <p className="text-[10px] font-mono opacity-60 mt-0.5">Agencia: {route.clearingAgency} {route.estimatedClearTime ? `· Est. ${route.estimatedClearTime}` : ''}</p>
                  )}
                  <p className="text-[9px] font-mono text-white/30 mt-1">Reportado por: {route.reportedBy} · {new Date(route.createdAt).toLocaleString('es-VE')}</p>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {(['Despejada', 'Parcial', 'Bloqueada', 'Evaluando'] as const).map(s => (
                  <button key={s} onClick={() => updateRouteStatus(route.id, s)}
                    className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                      route.status === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/10'
                    }`}>
                    {s === 'Despejada' ? 'OK' : s === 'Parcial' ? 'PAR' : s === 'Bloqueada' ? 'BLOQ' : 'EVAL'}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30 font-mono text-sm">No hay reportes de vías. Usa el botón "REPORTAR VÍA" para informar el estado de las rutas.</div>
        )}
      </div>
    </div>
  );
}
