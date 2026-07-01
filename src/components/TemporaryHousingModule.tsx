import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { TemporaryHousing } from '../types';
import { Home, Plus, Download, X, Users, MapPin } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createIcon = (color: string) => L.divIcon({
  className: 'custom-icon',
  html: `<div style="background:${color};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const TYPE_COLORS: Record<string, string> = {
  'Casa Temporal': '#3B82F6',
  'Carpa': '#10B981',
  'Contenedor': '#F59E0B',
  'Casa de Familia': '#8B5CF6',
  'Otro': '#6B7280',
};

const STATUS_COLORS: Record<string, string> = {
  Disponible: 'bg-green-500/20 text-green-400 border-green-500/30',
  Parcial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Lleno: 'bg-red-500/20 text-red-400 border-red-500/30',
  Mantenimiento: 'bg-white/10 text-white/40 border-white/20',
};

export default function TemporaryHousingModule() {
  const [housing, setHousing] = useState<TemporaryHousing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const { getPosition } = useGeolocation();

  useEffect(() => {
    const q = query(collection(db, 'temporary_housing'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setHousing(snap.docs.map(d => ({ id: d.id, ...d.data() } as TemporaryHousing)));
    });
    return unsub;
  }, []);

  const filtered = housing.filter(h => {
    if (filterType !== 'Todos' && h.type !== filterType) return false;
    if (filterStatus !== 'Todos' && h.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: housing.length,
    available: housing.filter(h => h.status === 'Disponible').length,
    partial: housing.filter(h => h.status === 'Parcial').length,
    full: housing.filter(h => h.status === 'Lleno').length,
    totalCapacity: housing.reduce((sum, h) => sum + h.capacity, 0),
    totalOccupancy: housing.reduce((sum, h) => sum + h.currentOccupancy, 0),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const pos = await getPosition();
      await addDoc(collection(db, 'temporary_housing'), {
        name: formData.get('name') as string,
        type: formData.get('type') as string,
        state: formData.get('state') as string,
        latitude: pos?.lat ?? 0, longitude: pos?.lng ?? 0,
        capacity: parseInt(formData.get('capacity') as string) || 0,
        currentOccupancy: 0,
        status: 'Disponible',
        contactName: formData.get('contactName') as string,
        contactPhone: formData.get('contactPhone') as string,
        services: (formData.get('services') as string).split(',').map(s => s.trim()),
        notes: formData.get('notes') as string,
        reportedBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false); form.reset();
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'temporary_housing', id), { status, updatedAt: Date.now() });
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Tipo', 'Estado', 'Capacidad', 'Ocupacion', 'Servicios'];
    const rows = filtered.map(h => [h.name, h.type, h.state, h.capacity.toString(), h.currentOccupancy.toString(), h.services?.join('; ')]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vivienda_temporal.csv'; a.click();
  };

  const occupancyPct = (occ: number, cap: number) => cap > 0 ? Math.round((occ / cap) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-amber-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Vivienda Temporal</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{stats.total} viviendas</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVA VIVIENDA'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Disponibles', value: stats.available, color: 'text-green-400' },
          { label: 'Parciales', value: stats.partial, color: 'text-yellow-400' },
          { label: 'Llenos', value: stats.full, color: 'text-red-400' },
          { label: 'Capacidad', value: stats.totalCapacity.toLocaleString(), color: 'text-blue-400' },
          { label: 'Ocupados', value: stats.totalOccupancy.toLocaleString(), color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <div className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[9px] font-mono text-white/40 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-[10px] font-mono cursor-pointer">
          <option value="Todos">Todos los tipos</option>
          {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-[10px] font-mono cursor-pointer">
          <option value="Todos">Todos los estados</option>
          <option>Disponible</option><option>Parcial</option><option>Lleno</option><option>Mantenimiento</option>
        </select>
        <button onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:bg-white/10 cursor-pointer">
          {viewMode === 'map' ? <MapPin className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input name="name" placeholder="Nombre" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <select name="type" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select name="state" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              <option>Caracas</option><option>La Guaira</option><option>Aragua</option><option>Carabobo</option><option>Otros</option>
            </select>
            <input name="capacity" type="number" placeholder="Capacidad" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input name="contactName" placeholder="Contacto" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input name="contactPhone" placeholder="Telefono" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <input name="services" placeholder="Servicios (separados por coma)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <textarea name="notes" placeholder="Notas" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'CREANDO...' : 'CREAR VIVIENDA'}
          </button>
        </form>
      )}

      {viewMode === 'map' ? (
        <div className="h-96 rounded-xl overflow-hidden border border-white/10">
          <MapContainer center={[10.5, -66.9]} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filtered.map(h => (
              <Marker key={h.id} position={[h.latitude, h.longitude]} icon={createIcon(TYPE_COLORS[h.type] || '#6B7280')}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{h.name}</p>
                    <p>Tipo: {h.type}</p>
                    <p>Capacidad: {h.capacity} | Ocupados: {h.currentOccupancy}</p>
                    <p>Servicios: {h.services?.join(', ')}</p>
                    {h.contactPhone && <p>Contacto: {h.contactPhone}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Nombre</th>
                <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Tipo</th>
                <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Estado</th>
                <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Capacidad</th>
                <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Ocupacion</th>
                <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Servicios</th>
                <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => (
                <tr key={h.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2 text-white text-xs font-mono">{h.name}</td>
                  <td className="p-2 text-white/70 text-xs font-mono">{h.type}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${STATUS_COLORS[h.status] || ''}`}>{h.status}</span>
                  </td>
                  <td className="p-2 text-white/70 text-xs font-mono">{h.capacity}</td>
                  <td className="p-2 text-white/50 text-xs font-mono flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {h.currentOccupancy} ({occupancyPct(h.currentOccupancy, h.capacity)}%)
                  </td>
                  <td className="p-2 text-white/40 text-[9px] font-mono max-w-[120px] truncate">{h.services?.join(', ')}</td>
                  <td className="p-2">
                    <select value={h.status} onChange={e => updateStatus(h.id, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-white cursor-pointer">
                      <option>Disponible</option><option>Parcial</option><option>Lleno</option><option>Mantenimiento</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay viviendas registradas</p>}
    </div>
  );
}