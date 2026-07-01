import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { TemporaryHousing } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Home, Plus, Filter, MapPin, Users } from 'lucide-react';
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

const typeColors: Record<string, string> = {
  'Casa Temporal': '#3B82F6',
  'Carpa': '#10B981',
  'Contenedor': '#F59E0B',
  'Casa de Familia': '#8B5CF6',
  'Otro': '#6B7280',
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
        latitude: pos?.lat ?? 0,
        longitude: pos?.lng ?? 0,
        capacity: parseInt(formData.get('capacity') as string) || 0,
        currentOccupancy: 0,
        status: 'Disponible',
        contactName: formData.get('contactName') as string,
        contactPhone: formData.get('contactPhone') as string,
        services: (formData.get('services') as string).split(',').map(s => s.trim()),
        maxStayDays: parseInt(formData.get('maxStayDays') as string) || 30,
        notes: formData.get('notes') as string,
        reportedBy: 'Anon',
        createdAt: Date.now(),
      });
      setShowForm(false);
      form.reset();
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'temporary_housing', id), { status, updatedAt: Date.now() });
  };

  const filteredHousing = housing.filter(h => {
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

  const exportCSV = () => {
    const headers = ['Nombre', 'Tipo', 'Estado', 'Capacidad', 'Ocupación', 'Contacto'];
    const rows = filteredHousing.map(h => [h.name, h.type, h.state, h.capacity.toString(), h.currentOccupancy.toString(), h.contactPhone]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vivienda_temporal.csv';
    a.click();
  };

  const occupancyColor = (occupancy: number, capacity: number) => {
    const pct = capacity > 0 ? (occupancy / capacity) * 100 : 0;
    if (pct < 50) return 'bg-green-100 text-green-800';
    if (pct < 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Home className="w-5 h-5" /> Vivienda Temporal
        </h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1 bg-green-500 text-white rounded text-sm">CSV</button>
          <button onClick={() => setShowForm(true)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nueva Vivienda
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
        <div className="bg-white p-3 rounded border text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-green-50 p-3 rounded border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          <div className="text-xs text-gray-500">Disponibles</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded border text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.partial}</div>
          <div className="text-xs text-gray-500">Parciales</div>
        </div>
        <div className="bg-red-50 p-3 rounded border text-center">
          <div className="text-2xl font-bold text-red-600">{stats.full}</div>
          <div className="text-xs text-gray-500">Llenos</div>
        </div>
        <div className="bg-blue-50 p-3 rounded border text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalCapacity.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Capacidad Total</div>
        </div>
        <div className="bg-purple-50 p-3 rounded border text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.totalOccupancy.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Ocupados</div>
        </div>
      </div>

      <div className="flex gap-2">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option>Todos</option>
          {Object.keys(typeColors).map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option>Todos</option>
          <option>Disponible</option>
          <option>Parcial</option>
          <option>Lleno</option>
          <option>Mantenimiento</option>
        </select>
        <button onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')} className="px-2 py-1 border rounded text-sm">
          {viewMode === 'map' ? <Filter className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nueva Vivienda Temporal</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="name" placeholder="Nombre" required className="w-full border rounded px-3 py-2" />
              <select name="type" className="w-full border rounded px-3 py-2">
                {Object.keys(typeColors).map(t => <option key={t}>{t}</option>)}
              </select>
              <select name="state" className="w-full border rounded px-3 py-2">
                <option>Caracas</option>
                <option>La Guaira</option>
                <option>Aragua</option>
                <option>Carabobo</option>
                <option>Otros</option>
              </select>
              <input name="capacity" type="number" placeholder="Capacidad" required className="w-full border rounded px-3 py-2" />
              <input name="contactName" placeholder="Contacto" className="w-full border rounded px-3 py-2" />
              <input name="contactPhone" placeholder="Teléfono" className="w-full border rounded px-3 py-2" />
              <input name="services" placeholder="Servicios (separados por coma)" className="w-full border rounded px-3 py-2" />
              <input name="maxStayDays" type="number" placeholder="Días máximos de estancia" className="w-full border rounded px-3 py-2" />
              <textarea name="notes" placeholder="Notas" className="w-full border rounded px-3 py-2" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-500 text-white rounded">
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'map' ? (
        <div className="h-96 rounded overflow-hidden border">
          <MapContainer center={[10.5, -66.9]} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredHousing.map(h => (
              <Marker
                key={h.id}
                position={[h.latitude, h.longitude]}
                icon={createIcon(typeColors[h.type] || '#6B7280')}
              >
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
              <tr className="border-b">
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Tipo</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Capacidad</th>
                <th className="text-left p-2">Ocupación</th>
                <th className="text-left p-2">Servicios</th>
                <th className="text-left p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredHousing.map(h => (
                <tr key={h.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{h.name}</td>
                  <td className="p-2">{h.type}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${occupancyColor(h.currentOccupancy, h.capacity)}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="p-2">{h.capacity}</td>
                  <td className="p-2">{h.currentOccupancy}</td>
                  <td className="p-2 text-xs">{h.services?.join(', ')}</td>
                  <td className="p-2">
                    <select
                      value={h.status}
                      onChange={e => updateStatus(h.id, e.target.value)}
                      className="text-xs border rounded px-1"
                    >
                      <option>Disponible</option>
                      <option>Parcial</option>
                      <option>Lleno</option>
                      <option>Mantenimiento</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}