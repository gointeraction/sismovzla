import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { WeatherAlert } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CloudLightning, Plus, Download, AlertTriangle, CheckCircle, MapPin, Filter, X } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

const SEVERITY_COLORS: Record<string, string> = {
  Verde: 'bg-green-500/20 text-green-400 border-green-500/30',
  Amarillo: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Naranja: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Rojo: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function WeatherAlertsModule() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('Todos');
  const { getPosition } = useGeolocation();
  const [form, setForm] = useState({
    title: '', type: 'Lluvia Fuerte' as WeatherAlert['type'], severity: 'Amarillo' as WeatherAlert['severity'],
    state: 'Caracas' as WeatherAlert['state'], description: '', source: '', radiusKm: 5,
  });

  useEffect(() => {
    const q = query(collection(db, 'weather_alerts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as WeatherAlert)));
    });
    return unsub;
  }, []);

  const filtered = alerts.filter(a => filterSeverity === 'Todos' || a.severity === filterSeverity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pos = await getPosition();
      await addDoc(collection(db, 'weather_alerts'), {
        ...form, latitude: pos?.lat ?? 0, longitude: pos?.lng ?? 0,
        active: true, reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ title: '', type: 'Lluvia Fuerte', severity: 'Amarillo', state: 'Caracas', description: '', source: '', radiusKm: 5 });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const toggleActive = async (alert: WeatherAlert) => {
    await updateDoc(doc(db, 'weather_alerts', alert.id), { active: !alert.active, updatedAt: Date.now() });
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.setTextColor(211, 47, 47);
    docPdf.text('Alertas Meteorologicas - SismoVZLA', 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100);
    docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, 14, 30);
    autoTable(docPdf, {
      startY: 35,
      head: [['Titulo', 'Tipo', 'Severidad', 'Estado', 'Activa', 'Fuente']],
      body: filtered.map(a => [a.title, a.type, a.severity, a.state, a.active ? 'Si' : 'No', a.source]),
      theme: 'grid', headStyles: { fillColor: [211, 47, 47] },
    });
    docPdf.save('alertas_meteorologicas.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CloudLightning className="w-5 h-5 text-yellow-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Alertas Meteorologicas</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{filtered.length} alertas</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVA ALERTA'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Verde', 'Amarillo', 'Naranja', 'Rojo'].map(s => (
          <button key={s} onClick={() => setFilterSeverity(s)}
            className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${filterSeverity === s ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
            {s}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titulo de la alerta" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as WeatherAlert['type'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              {['Lluvia Fuerte', 'Tormenta', 'Viento Fuerte', 'Inundación', 'Deslizamiento', 'Tsunami', 'Réplica Significativa', 'Otro'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as WeatherAlert['severity'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              {['Verde', 'Amarillo', 'Naranja', 'Rojo'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value as WeatherAlert['state'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              {['Caracas', 'La Guaira', 'Aragua', 'Carabobo', 'Otros'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" value={form.radiusKm} onChange={e => setForm({ ...form, radiusKm: Number(e.target.value) })} placeholder="Radio km" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripcion" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Fuente (ej: INSIVUMEH)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'ENVIANDO...' : 'PUBLICAR ALERTA'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map(alert => (
          <div key={alert.id} className={`bg-white/5 border rounded-xl p-4 ${alert.active ? 'border-yellow-500/30' : 'border-white/10 opacity-60'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-mono font-bold text-white text-xs">{alert.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${SEVERITY_COLORS[alert.severity]}`}>{alert.severity}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/10 text-white/60">{alert.type}</span>
                  <span className="text-[9px] font-mono text-white/30">{alert.state}</span>
                </div>
                <p className="text-[11px] text-white/60 mt-1">{alert.description}</p>
                <p className="text-[9px] font-mono text-white/30 mt-1">Fuente: {alert.source} | Radio: {alert.radiusKm}km | {new Date(alert.createdAt).toLocaleString('es-VE')}</p>
              </div>
              <button onClick={() => toggleActive(alert)}
                className={`shrink-0 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${alert.active ? 'bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30' : 'bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600/30'}`}>
                {alert.active ? 'DESACTIVAR' : 'ACTIVAR'}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay alertas</p>}
      </div>
    </div>
  );
}
