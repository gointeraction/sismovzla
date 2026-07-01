import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AfterActionReview } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClipboardCheck, Plus, Download, CheckCircle, Filter, X, AlertTriangle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Pendiente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'En Implementación': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Completado: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const PRIORITY_COLORS: Record<string, string> = {
  Alta: 'bg-red-500/20 text-red-400 border-red-500/30',
  Media: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Baja: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function LessonsLearnedModule() {
  const [reviews, setReviews] = useState<AfterActionReview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [form, setForm] = useState({
    title: '', module: '', whatWorkedWell: '', whatNeedsImprovement: '',
    recommendations: '', priority: 'Media' as AfterActionReview['priority'],
    incidentDate: Date.now(), reviewDate: Date.now(),
  });

  useEffect(() => {
    const q = query(collection(db, 'after_action_reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as AfterActionReview)));
    });
    return unsub;
  }, []);

  const filtered = reviews.filter(r => filterStatus === 'Todos' || r.status === filterStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'after_action_reviews'), {
        ...form, status: 'Pendiente', reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ title: '', module: '', whatWorkedWell: '', whatNeedsImprovement: '', recommendations: '', priority: 'Media', incidentDate: Date.now(), reviewDate: Date.now() });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (r: AfterActionReview, newStatus: AfterActionReview['status']) => {
    await updateDoc(doc(db, 'after_action_reviews', r.id), { status: newStatus, updatedAt: Date.now() });
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.setTextColor(211, 47, 47);
    docPdf.text('Lecciones Aprendidas - SismoVZLA', 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100);
    docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, 14, 30);
    autoTable(docPdf, {
      startY: 35,
      head: [['Titulo', 'Modulo', 'Prioridad', 'Estado']],
      body: filtered.map(r => [r.title, r.module, r.priority, r.status]),
      theme: 'grid', headStyles: { fillColor: [211, 47, 47] },
    });
    docPdf.save('lecciones_aprendidas.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-blue-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Lecciones Aprendidas</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{filtered.length} revisiones</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVA REVISION'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Pendiente', 'En Implementación', 'Completado'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${filterStatus === s ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
            {s}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titulo de la revision" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input value={form.module} onChange={e => setForm({ ...form, module: e.target.value })} placeholder="Modulo evaluado" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <textarea value={form.whatWorkedWell} onChange={e => setForm({ ...form, whatWorkedWell: e.target.value })} placeholder="Que funciono bien?" rows={2} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <textarea value={form.whatNeedsImprovement} onChange={e => setForm({ ...form, whatNeedsImprovement: e.target.value })} placeholder="Que necesita mejorar?" rows={2} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <textarea value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} placeholder="Recomendaciones" rows={2} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as AfterActionReview['priority'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono w-32">
            {['Alta', 'Media', 'Baja'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'CREANDO...' : 'CREAR REVISION'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <ClipboardCheck className="w-4 h-4 text-blue-400" />
                  <h3 className="font-mono font-bold text-white text-xs">{r.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/10 text-white/60">{r.module}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                </div>
                <p className="text-[10px] text-green-400/70 mt-1">Funciono: {r.whatWorkedWell}</p>
                <p className="text-[10px] text-yellow-400/70 mt-1">Mejorar: {r.whatNeedsImprovement}</p>
                <p className="text-[10px] text-blue-400/70 mt-1">Recomendaciones: {r.recommendations}</p>
              </div>
              <div className="flex gap-1">
                {r.status === 'Pendiente' && (
                  <button onClick={() => updateStatus(r, 'En Implementación')} className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-[9px] font-mono font-bold border border-blue-500/30 cursor-pointer">INICIAR</button>
                )}
                {r.status === 'En Implementación' && (
                  <button onClick={() => updateStatus(r, 'Completado')} className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-[9px] font-mono font-bold border border-green-500/30 cursor-pointer">COMPLETAR</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay revisiones</p>}
      </div>
    </div>
  );
}