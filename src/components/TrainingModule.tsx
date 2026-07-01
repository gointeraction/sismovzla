import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { TrainingSession } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GraduationCap, Plus, Download, CheckCircle, Filter, X, Calendar, Users } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Programado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'En Curso': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Completado: 'bg-green-500/20 text-green-400 border-green-500/30',
  Cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function TrainingModule() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [form, setForm] = useState({
    title: '', type: 'Simulacro' as TrainingSession['type'], description: '',
    date: Date.now(), duration: '', location: '',
    state: 'Caracas' as TrainingSession['state'], instructor: '', maxParticipants: 20,
  });

  useEffect(() => {
    const q = query(collection(db, 'training_sessions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSession)));
    });
    return unsub;
  }, []);

  const filtered = sessions.filter(s => filterStatus === 'Todos' || s.status === filterStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'training_sessions'), {
        ...form, enrolledCount: 0, participants: [], status: 'Programado', reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ title: '', type: 'Simulacro', description: '', date: Date.now(), duration: '', location: '', state: 'Caracas', instructor: '', maxParticipants: 20 });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (s: TrainingSession, newStatus: TrainingSession['status']) => {
    await updateDoc(doc(db, 'training_sessions', s.id), { status: newStatus });
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.setTextColor(211, 47, 47);
    docPdf.text('Capacitacion y Simulacros - SismoVZLA', 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100);
    docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, 14, 30);
    autoTable(docPdf, {
      startY: 35,
      head: [['Titulo', 'Tipo', 'Fecha', 'Estado', 'Inscritos']],
      body: filtered.map(s => [s.title, s.type, new Date(s.date).toLocaleDateString('es-VE'), s.status, `${s.enrolledCount}/${s.maxParticipants}`]),
      theme: 'grid', headStyles: { fillColor: [211, 47, 47] },
    });
    docPdf.save('capacitacion_simulacros.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-green-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Capacitacion y Simulacros</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{filtered.length} sesiones</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVA SESION'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Programado', 'En Curso', 'Completado', 'Cancelado'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${filterStatus === s ? 'bg-green-600 text-white border-green-500' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
            {s}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titulo de la sesion" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TrainingSession['type'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              {['Simulacro', 'Capacitación', 'Taller', 'Entrenamiento SAR', 'Prueba de Comunicaciones'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="Duracion (horas)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lugar" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input type="number" value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: Number(e.target.value) })} placeholder="Max participantes" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <input value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} placeholder="Instructor / Responsable" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripcion del contenido" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'CREANDO...' : 'CREAR SESION'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <GraduationCap className="w-4 h-4 text-green-400" />
                  <h3 className="font-mono font-bold text-white text-xs">{s.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/10 text-white/60">{s.type}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                </div>
                <p className="text-[10px] text-white/50 mt-1">{s.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[9px] font-mono text-white/30"><Calendar className="w-3 h-3" />{new Date(s.date).toLocaleDateString('es-VE')}</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-white/30"><Users className="w-3 h-3" />{s.enrolledCount}/{s.maxParticipants}</span>
                  <span className="text-[9px] font-mono text-white/30">{s.instructor}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {s.status === 'Programado' && (
                  <button onClick={() => updateStatus(s, 'En Curso')} className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-[9px] font-mono font-bold border border-yellow-500/30 cursor-pointer">INICIAR</button>
                )}
                {s.status === 'En Curso' && (
                  <button onClick={() => updateStatus(s, 'Completado')} className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-[9px] font-mono font-bold border border-green-500/30 cursor-pointer">COMPLETAR</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay sesiones</p>}
      </div>
    </div>
  );
}