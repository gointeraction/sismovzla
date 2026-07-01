import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CascadeEvent } from '../types';
import { Activity, Flame, Droplets, Wind, AlertTriangle, Truck, Zap, Skull, Bomb, Database, Plus, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

const EVENT_ICONS: Record<string, any> = {
  Réplica: Activity, Incendio: Flame, 'Fuga de Gas': Wind, Deslizamiento: Truck,
  Inundación: Droplets, Tsunami: Droplets, 'Colapso Estructural': AlertTriangle,
  Explosión: Bomb, 'Derrame Químico': Zap, 'Ruptura de Presa': Droplets,
  Licuefacción: Database, Otro: AlertTriangle,
};

const SEVERITY_COLORS: Record<string, string> = {
  Crítico: 'bg-red-600 text-white border-red-400',
  Alto: 'bg-orange-500 text-white border-orange-400',
  Medio: 'bg-yellow-500 text-black border-yellow-400',
  Bajo: 'bg-blue-500 text-white border-blue-400',
};

const STATUS_COLORS: Record<string, string> = {
  Activo: 'text-red-400 bg-red-500/10 border-red-500/30',
  Contenido: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Resuelto: 'text-green-400 bg-green-500/10 border-green-500/30',
  Monitoreando: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

export default function CascadeTimeline() {
  const [events, setEvents] = useState<CascadeEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('Todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { getPosition } = useGeolocation();

  const [form, setForm] = useState({
    eventType: 'Réplica' as CascadeEvent['eventType'],
    magnitude: 0,
    location: '',
    severity: 'Alto' as CascadeEvent['severity'],
    status: 'Activo' as CascadeEvent['status'],
    description: '',
    affectedZones: '',
    parentEventId: '',
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'cascade_events'), orderBy('createdAt', 'desc')), snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CascadeEvent)));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pos = await getPosition();
      await addDoc(collection(db, 'cascade_events'), {
        eventType: form.eventType,
        magnitude: form.eventType === 'Réplica' ? form.magnitude : null,
        location: form.location || null,
        latitude: pos?.lat ?? null,
        longitude: pos?.lng ?? null,
        severity: form.severity,
        status: form.status,
        affectedZones: form.affectedZones ? form.affectedZones.split(',').map(s => s.trim()) : [],
        description: form.description || null,
        parentEventId: form.parentEventId || null,
        reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon',
        createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ eventType: 'Réplica', magnitude: 0, location: '', severity: 'Alto', status: 'Activo', description: '', affectedZones: '', parentEventId: '' });
    } catch (err) {
      console.error('Error creating cascade event:', err);
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: CascadeEvent['status']) => {
    try {
      const data: any = { status };
      if (status === 'Resuelto') { data.resolvedAt = Date.now(); data.resolvedBy = 'Anon'; }
      await updateDoc(doc(db, 'cascade_events', id), data);
    } catch (err) { console.error(err); }
  };

  const filtered = events.filter(e => filterSeverity === 'Todos' || e.severity === filterSeverity);
  const activeCritical = events.filter(e => e.status === 'Activo' && e.severity === 'Crítico').length;

  const exportCSV = () => {
    const headers = 'Tipo,Magnitud,Ubicación,Severidad,Estatus,Zonas Afectadas,Descripción,Fecha';
    const rows = filtered.map(e =>
      `"${e.eventType}","${e.magnitude || '-'}","${e.location || '-'}","${e.severity}","${e.status}","${(e.affectedZones || []).join('; ')}","${e.description || '-'}","${new Date(e.createdAt).toISOString()}"`
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cascada_eventos.csv'; a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner de alerta */}
      {activeCritical > 0 && (
        <div className="bg-red-600/20 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <div>
            <p className="font-mono font-bold text-red-400 text-sm uppercase">ALERTA: {activeCritical} evento(s) crítico(s) activo(s)</p>
            <p className="text-[10px] font-mono text-red-400/60">Eventos en cascada requieren atención inmediata</p>
          </div>
        </div>
      )}

      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-orange-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">TIMELINE DE EVENTOS EN CASCADA</h2>
            <p className="text-xs text-white/50 mt-1">Secuencia temporal de réplicas, incendios, fugas, deslizamientos y otros eventos post-sismo</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> NUEVO EVENTO
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Crítico', 'Alto', 'Medio', 'Bajo'].map(s => (
          <button key={s} onClick={() => setFilterSeverity(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              filterSeverity === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/10'
            }`}>
            {s === 'Todos' ? 'TODOS' : s}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Registrar evento en cascada</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Tipo de evento</label>
              <select value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value as CascadeEvent['eventType'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                {Object.keys(EVENT_ICONS).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {form.eventType === 'Réplica' && (
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase">Magnitud (ML)</label>
                <input type="number" step="0.1" value={form.magnitude || ''} onChange={e => setForm({ ...form, magnitude: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="4.2" />
              </div>
            )}
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Ubicación</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Sector Los Palos Grandes" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Severidad</label>
              <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as CascadeEvent['severity'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Crítico">Crítico</option>
                <option value="Alto">Alto</option>
                <option value="Medio">Medio</option>
                <option value="Bajo">Bajo</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Estatus inicial</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CascadeEvent['status'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Activo">Activo</option>
                <option value="Contenido">Contenido</option>
                <option value="Monitoreando">Monitoreando</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-white/50 uppercase">Zonas afectadas (separado por comas)</label>
              <input value={form.affectedZones} onChange={e => setForm({ ...form, affectedZones: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Los Palos Grandes, Altamira, Chacao" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-white/50 uppercase">Descripción</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" rows={2} />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'REGISTRANDO...' : 'REGISTRAR EVENTO'}
          </button>
        </form>
      )}

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />
        <div className="space-y-4">
          {filtered.map((event, idx) => {
            const Icon = EVENT_ICONS[event.eventType] || AlertTriangle;
            const isExpanded = expandedId === event.id;
            return (
              <div key={event.id} className="relative pl-14">
                <div className={`absolute left-2 w-9 h-9 rounded-full flex items-center justify-center ${SEVERITY_COLORS[event.severity]} ${event.status === 'Activo' ? 'animate-pulse' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className={`border rounded-xl p-4 cursor-pointer transition-all ${STATUS_COLORS[event.status]}`}
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm">{event.eventType}</span>
                        {event.magnitude && <span className="text-[10px] font-mono bg-black/30 px-2 py-0.5 rounded">ML {event.magnitude}</span>}
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase ${SEVERITY_COLORS[event.severity].split('bg-')[1] ? '' : ''}`}>
                          {event.severity}
                        </span>
                      </div>
                      {event.location && <p className="text-xs font-mono text-white/60 mt-1">{event.location}</p>}
                      <p className="text-[10px] font-mono text-white/40 mt-1">
                        {new Date(event.createdAt).toLocaleString('es-VE')} · {event.reportedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-1 rounded border ${event.status === 'Activo' ? 'bg-red-500/20 text-red-400 border-red-500/30' : event.status === 'Contenido' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : event.status === 'Resuelto' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                        {event.status}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      {event.description && <p className="text-xs font-mono text-white/70">{event.description}</p>}
                      {event.affectedZones && event.affectedZones.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {event.affectedZones.map((z, i) => (
                            <span key={i} className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/60">{z}</span>
                          ))}
                        </div>
                      )}
                      {event.respondersDeployed && (
                        <p className="text-[10px] font-mono text-white/50">Respondedores desplegados: {event.respondersDeployed}</p>
                      )}
                      <div className="flex gap-1.5">
                        {(['Activo', 'Contenido', 'Resuelto', 'Monitoreando'] as const).map(s => (
                          <button key={s} onClick={(e) => { e.stopPropagation(); updateStatus(event.id, s); }}
                            className={`px-2 py-1 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                              event.status === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/10'
                            }`}>
                            {s.slice(0, 5)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-white/30 font-mono text-sm">No hay eventos registrados. Usa "NUEVO EVENTO" para reportar réplicas o incidentes secundarios.</div>
          )}
        </div>
      </div>
    </div>
  );
}
