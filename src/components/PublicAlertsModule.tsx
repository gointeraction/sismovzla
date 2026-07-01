import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { PublicAlert } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Megaphone, Plus, Download, AlertTriangle, CheckCircle, Filter, X, Eye } from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  Crítica: 'bg-red-600 text-white animate-pulse',
  Alta: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Media: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Baja: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function PublicAlertsModule() {
  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('Todos');
  const [form, setForm] = useState({
    title: '', message: '', type: 'Evacuación' as PublicAlert['type'], priority: 'Alta' as PublicAlert['priority'],
    states: [] as string[],
  });

  useEffect(() => {
    const q = query(collection(db, 'public_alerts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as PublicAlert)));
    });
    return unsub;
  }, []);

  const filtered = alerts.filter(a => filterPriority === 'Todos' || a.priority === filterPriority);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'public_alerts'), {
        ...form, active: true, broadcastCount: 0, sentBy: 'Operador', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ title: '', message: '', type: 'Evacuación', priority: 'Alta', states: [] });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const toggleActive = async (alert: PublicAlert) => {
    await updateDoc(doc(db, 'public_alerts', alert.id), { active: !alert.active });
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.setTextColor(211, 47, 47);
    docPdf.text('Alertas Publicas - SismoVZLA', 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100);
    docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, 14, 30);
    autoTable(docPdf, {
      startY: 35,
      head: [['Titulo', 'Tipo', 'Prioridad', 'Activa', 'Estados']],
      body: filtered.map(a => [a.title, a.type, a.priority, a.active ? 'Si' : 'No', a.states.join(', ')]),
      theme: 'grid', headStyles: { fillColor: [211, 47, 47] },
    });
    docPdf.save('alertas_publicas.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-red-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Alertas Publicas</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{alerts.filter(a => a.active).length} activas</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVA ALERTA'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Crítica', 'Alta', 'Media', 'Baja'].map(p => (
          <button key={p} onClick={() => setFilterPriority(p)}
            className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${filterPriority === p ? 'bg-red-600 text-white border-red-500' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
            {p}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titulo de la alerta" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Mensaje para la poblacion" rows={3} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as PublicAlert['type'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              {['Evacuación', 'Refugio', 'Ruta Segura', 'Agua Segura', 'Peligro', 'Informativa'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as PublicAlert['priority'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              {['Crítica', 'Alta', 'Media', 'Baja'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'ENVIANDO...' : 'PUBLICAR ALERTA'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map(alert => (
          <div key={alert.id} className={`bg-white/5 border rounded-xl p-4 ${alert.active ? 'border-red-500/30' : 'border-white/10 opacity-60'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-mono font-bold text-white text-xs">{alert.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${PRIORITY_COLORS[alert.priority]}`}>{alert.priority}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/10 text-white/60">{alert.type}</span>
                </div>
                <p className="text-[11px] text-white/60 mt-1">{alert.message}</p>
                <p className="text-[9px] font-mono text-white/30 mt-1">Estados: {alert.states.join(', ')} | {new Date(alert.createdAt).toLocaleString('es-VE')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[9px] font-mono text-white/30"><Eye className="w-3 h-3" />{alert.broadcastCount}</span>
                <button onClick={() => toggleActive(alert)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${alert.active ? 'bg-red-600/20 text-red-400 border-red-500/30' : 'bg-green-600/20 text-green-400 border-green-500/30'}`}>
                  {alert.active ? 'DESACTIVAR' : 'ACTIVAR'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay alertas</p>}
      </div>
    </div>
  );
}
