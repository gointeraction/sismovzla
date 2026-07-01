import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { ResourceLocation } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MapPin, Plus, Filter, List } from 'lucide-react';
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
  'Almacén': '#3B82F6',
  'Punto de Distribución': '#10B981',
  'Centro Médico': '#EF4444',
  'Punto de Agua': '#06B6D4',
  'Generador': '#F59E0B',
  'Base de Operaciones': '#8B5CF6',
  'Otro': '#6B7280',
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

  const filteredResources = resources.filter(r => {
    if (filterType !== 'Todos' && r.type !== filterType) return false;
    if (filterStatus !== 'Todos' && r.status !== filterStatus) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = ['Nombre', 'Tipo', 'Estado', 'Capacidad', 'Stock', 'Contacto'];
    const rows = filteredResources.map(r => [r.name, r.type, r.state, r.capacity, r.currentStock, r.contactPhone]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recursos.csv';
    a.click();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Parcial': return 'bg-yellow-100 text-yellow-800';
      case 'Inactivo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="w-5 h-5" /> Mapa de Recursos
        </h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1 bg-green-500 text-white rounded text-sm">CSV</button>
          <button onClick={() => setShowForm(true)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nuevo Recurso
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option>Todos</option>
          {Object.keys(typeColors).map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1 text-sm">
          <option>Todos</option>
          <option>Activo</option>
          <option>Parcial</option>
          <option>Inactivo</option>
        </select>
        <button onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')} className="px-2 py-1 border rounded text-sm">
          {viewMode === 'map' ? <List className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nuevo Recurso</h3>
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
              <input name="capacity" placeholder="Capacidad" className="w-full border rounded px-3 py-2" />
              <input name="currentStock" placeholder="Stock actual" className="w-full border rounded px-3 py-2" />
              <input name="contactName" placeholder="Contacto" className="w-full border rounded px-3 py-2" />
              <input name="contactPhone" placeholder="Teléfono" className="w-full border rounded px-3 py-2" />
              <input name="operatingHours" placeholder="Horario" className="w-full border rounded px-3 py-2" />
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
            {filteredResources.map(r => (
              <Marker
                key={r.id}
                position={[r.latitude, r.longitude]}
                icon={createIcon(typeColors[r.type] || '#6B7280')}
              >
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
              <tr className="border-b">
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Tipo</th>
                <th className="text-left p-2">Estado</th>
                <th className="text-left p-2">Capacidad</th>
                <th className="text-left p-2">Stock</th>
                <th className="text-left p-2">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-2">{r.capacity}</td>
                  <td className="p-2">{r.currentStock}</td>
                  <td className="p-2">{r.contactPhone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}