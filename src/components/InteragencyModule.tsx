import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { InteragencyTask } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GitMerge, Plus, Download, Users, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react';

const AGENCIES = ['Protección Civil', 'Bomberos D.C.', 'MPPP', 'FANB', 'Cruz Roja', 'ONU', 'INE', 'Ministerio Salud', 'Gobernación', 'Alcaldía', 'Cantv', 'Electricidad', 'Otro'];
const CLUSTERS = ['Salud', 'WASH', 'Alojamiento', 'Logística', 'Nutrición', 'Educación', 'Protección', 'Recuperación Temprana', 'Telecomunicaciones', 'Coordinación General'];

export default function InteragencyModule() {
  const [tasks, setTasks] = useState<InteragencyTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterAgency, setFilterAgency] = useState<string>('Todas');
  const [filterCluster, setFilterCluster] = useState<string>('Todos');

  const [form, setForm] = useState({
    agencyName: 'Protección Civil', contactName: '', contactPhone: '',
    cluster: 'Coordinación General' as InteragencyTask['cluster'],
    task: '', assignedZone: '', priority: 'Media' as InteragencyTask['priority'],
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'interagency_tasks'), orderBy('createdAt', 'desc')), snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as InteragencyTask)));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'interagency_tasks'), {
        ...form, contactName: form.contactName || null, contactPhone: form.contactPhone || null,
        assignedZone: form.assignedZone || null, status: 'Pendiente', reportedBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ agencyName: 'Protección Civil', contactName: '', contactPhone: '', cluster: 'Coordinación General', task: '', assignedZone: '', priority: 'Media' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateTask = async (id: string, data: Partial<InteragencyTask>) => {
    try {
      const payload: any = { ...data };
      if (data.status === 'En Progreso') payload.startedAt = Date.now();
      if (data.status === 'Completada') payload.completedAt = Date.now();
      await updateDoc(doc(db, 'interagency_tasks', id), payload);
    } catch (err) { console.error(err); }
  };

  const filtered = tasks.filter(t => {
    if (filterAgency !== 'Todas' && t.agencyName !== filterAgency) return false;
    if (filterCluster !== 'Todos' && t.cluster !== filterCluster) return false;
    return true;
  });

  const pending = tasks.filter(t => t.status === 'Pendiente').length;
  const inProgress = tasks.filter(t => t.status === 'En Progreso').length;
  const completed = tasks.filter(t => t.status === 'Completada').length;

  const exportCSV = () => {
    const headers = 'Agencia,Clúster,Tarea,Zona,Prioridad,Estatus,Contacto,Teléfono,Fecha';
    const rows = tasks.map(t =>
      `"${t.agencyName}","${t.cluster || '-'}","${t.task}","${t.assignedZone || '-'}","${t.priority}","${t.status}","${t.contactName || '-'}","${t.contactPhone || '-'}","${new Date(t.createdAt).toISOString()}"`
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'interagencial_tareas.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(16);
    doc.text('SISMOVZLA - COORDINACIÓN INTERAGENCIAL', 14, 20);
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generado: ${today}`, 14, 28);
    autoTable(doc, {
      head: [['Agencia', 'Clúster', 'Tarea', 'Zona', 'Prioridad', 'Estatus']],
      body: tasks.map(t => [
        t.agencyName, t.cluster || '-', t.task, t.assignedZone || '-', t.priority, t.status,
      ]),
      startY: 35,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, font: 'helvetica' },
    });
    doc.save(`interagencial_tareas_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <GitMerge className="w-6 h-6 text-violet-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">COORDINACIÓN INTERAGENCIAL</h2>
            <p className="text-xs text-white/50 mt-1">Sistema de Comando de Incidentes (ICS) · Clústers ONU OCHA</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> NUEVA TAREA
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-violet-400">{tasks.length}</p>
          <p className="text-[9px] font-mono text-violet-400/70 uppercase">Total tareas</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-yellow-400">{pending}</p>
          <p className="text-[9px] font-mono text-yellow-400/70 uppercase">Pendientes</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-blue-400">{inProgress}</p>
          <p className="text-[9px] font-mono text-blue-400/70 uppercase">En progreso</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-green-400">{completed}</p>
          <p className="text-[9px] font-mono text-green-400/70 uppercase">Completadas</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <select value={filterAgency} onChange={e => setFilterAgency(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono">
          <option value="Todas">Todas las agencias</option>
          {AGENCIES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterCluster} onChange={e => setFilterCluster(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono">
          <option value="Todos">Todos los clústers</option>
          {CLUSTERS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Nueva tarea interagencial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Agencia responsable</label>
              <select value={form.agencyName} onChange={e => setForm({ ...form, agencyName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                {AGENCIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Clúster ONU OCHA</label>
              <select value={form.cluster} onChange={e => setForm({ ...form, cluster: e.target.value as InteragencyTask['cluster'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                {CLUSTERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-white/50 uppercase">Tarea</label>
              <textarea value={form.task} onChange={e => setForm({ ...form, task: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" rows={2} required />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Zona asignada</label>
              <input value={form.assignedZone} onChange={e => setForm({ ...form, assignedZone: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Prioridad</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as InteragencyTask['priority'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Crítica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Contacto</label>
              <input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Teléfono contacto</label>
              <input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'CREANDO...' : 'CREAR TAREA'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {filtered.map(t => (
          <div key={t.id} className="bg-[#121212] border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                  t.priority === 'Crítica' ? 'bg-red-600 text-white' : t.priority === 'Alta' ? 'bg-orange-500 text-white' : t.priority === 'Media' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
                }`}>{t.priority[0]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-white">{t.agencyName}</span>
                    {t.cluster && <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/60">{t.cluster}</span>}
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      t.status === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      t.status === 'En Progreso' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      t.status === 'Completada' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>{t.status}</span>
                  </div>
                  <p className="text-xs font-mono text-white/70 mt-1">{t.task}</p>
                  <div className="flex gap-3 mt-1 text-[9px] font-mono text-white/40">
                    {t.assignedZone && <span>📍 {t.assignedZone}</span>}
                    {t.contactName && <span>👤 {t.contactName} {t.contactPhone ? `📞 ${t.contactPhone}` : ''}</span>}
                  </div>
                  <p className="text-[9px] font-mono text-white/30 mt-1">{new Date(t.createdAt).toLocaleString('es-VE')} · {t.reportedBy}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {(['Pendiente', 'En Progreso', 'Completada', 'Bloqueada'] as const).map(s => (
                  <button key={s} onClick={() => updateTask(t.id, { status: s })}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                      t.status === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40'
                    }`}>{s === 'En Progreso' ? 'PROG' : s.slice(0, 5)}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-white/30 font-mono text-sm">No hay tareas interagenciales.</div>}
      </div>
    </div>
  );
}
