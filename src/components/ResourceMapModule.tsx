import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { ResourceLocation } from '../types';
import { MapPin, Plus, Download, X, List, Phone } from 'lucide-react';
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
  'Almacén': '#3B82F6',
  'Punto de Distribución': '#10B981',
  'Centro Médico': '#EF4444',
  'Punto de Agua': '#06B6D4',
  'Generador': '#F59E0B',
  'Base de Operaciones': '#8B5CF6',
  'Otro': '#6B7280',
};

const STATUS_COLORS: Record<string, string> = {
  Activo: 'bg-green-500/20 text-green-400 border-green-500/30',
  Parcial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Inactivo: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function ResourceMapModule() {
  const [resources, setResources] = useState<ResourceLocation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const { getPosition } = useGeolocation();

  useEffect(() => {
    const q = query(collection(db, 'resource_locations'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setResources(snap.docs.map(d => ({ id: d.id, ...d.data() } as ResourceLocation)));
    });
    return unsub;
  }, []);

  const filtered = resources.filter(r => {
    if (filterType !== 'Todos' && r.type !== filterType) return false;
    if (filterStatus !== 'Todos' && r.status !== filterStatus) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const pos = await getPosition();
      await addDoc(collection(db, 'resource_locations'), {
        name: formData.get('name') as string,
        type: formData.get('type') as string,
        state: formData.get('state') as string,
        latitude: pos?.lat ?? 0,
        longitude: pos?.lng ?? 0,
        capacity: formData.get('capacity') as string,
        currentStock: formData.get('currentStock') as string,
        status: 'Activo',
        contactPhone: formData.get('contactPhone') as string,
        contactName: formData.get('contactName') as string,
        operatingHours: formData.get('operatingHours') as string,
        notes: formData.get('notes') as string,
        reportedBy: 'Anon',
        createdAt: Date.now(),
      });
      setShowForm(false);
      form.reset();
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Tipo', 'Estado', 'Capacidad', 'Stock', 'Contacto'];
    const rows = filtered.map(r => [r.name, r.type, r.state, r.capacity, r.currentStock, r.contactPhone]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'recursos.csv'; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Mapa de Recursos</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{filtered.length} recursos</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVO RECURSO'}
          </button>
        </div>
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
          <option value="Activo">Activo</option><option value="Parcial">Parcial</option><option value="Inactivo">Inactivo</option>
        </select>
        <button onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 hover:bg-white/10 cursor-pointer">
          {viewMode === 'map' ? <List className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
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
            <input name="capacity" placeholder="Capacidad" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input name="contactName" placeholder="Contacto" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input name="contactPhone" placeholder="Telefono" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'CREANDO...' : 'CREAR RECURSO'}
          </button>
        </form>
      )}

      {viewMode === 'map' ? (
        <div className="h-96 rounded-xl overflow-hidden border border-white/10">
          <MapContainer center={[10.5, -66.9]} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filtered.map(r => (
              <Marker key={r.id} position={[r.latitude, r.longitude]} icon={createIcon(TYPE_COLORS[r.type] || '#6B7280')}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{r.name}</p>
                    <p>Tipo: {r.type}</p>
                    <p>Estado: {r.state}</p>
                    {r.capacity && <p>Capacidad: {r.capacity}</p>}
                    {r.currentStock && <p>Stock: {r.currentStock}</p>}
                    {r.contactPhone && <p>Contacto: {r.contactPhone}</p>}
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
                <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Stock</th>
                <th className="text-left p-2 font-mono text-[10px] text-white/50 uppercase">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2 text-white text-xs font-mono">{r.name}</td>
                  <td className="p-2 text-white/70 text-xs font-mono">{r.type}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${STATUS_COLORS[r.status] || ''}`}>{r.status}</span>
                  </td>
                  <td className="p-2 text-white/50 text-xs font-mono">{r.capacity}</td>
                  <td className="p-2 text-white/50 text-xs font-mono">{r.currentStock}</td>
                  <td className="p-2 text-white/50 text-[10px] font-mono flex items-center gap-1"><Phone className="w-3 h-3" />{r.contactPhone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay recursos registrados</p>}
    </div>
  );
}