import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { PsychosocialCase } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Heart, Plus, Download, AlertTriangle, UserCheck, Phone, FileText } from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  Inmediato: 'bg-red-600 text-white',
  Alto: 'bg-orange-500 text-white',
  Medio: 'bg-yellow-500 text-black',
  Bajo: 'bg-blue-500 text-white',
};

const STATUS_COLORS: Record<string, string> = {
  Abierto: 'bg-red-500/20 text-red-400 border-red-500/30',
  'En Seguimiento': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Cerrado: 'bg-green-500/20 text-green-400 border-green-500/30',
  Derivado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export default function PsychosocialModule() {
  const [cases, setCases] = useState<PsychosocialCase[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');

  const [form, setForm] = useState({
    patientName: '', age: 0, contact: '', location: '',
    crisisType: 'Estrés Agudo' as PsychosocialCase['crisisType'],
    triagePriority: 'Medio' as PsychosocialCase['triagePriority'],
    notes: '',
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'psychosocial_cases'), orderBy('createdAt', 'desc')), snap => {
      setCases(snap.docs.map(d => ({ id: d.id, ...d.data() } as PsychosocialCase)));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'psychosocial_cases'), {
        patientName: form.patientName || null, age: form.age || null,
        contact: form.contact || null, location: form.location || null,
        crisisType: form.crisisType, triagePriority: form.triagePriority,
        status: 'Abierto', sessionCount: 0,
        reportedBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ patientName: '', age: 0, contact: '', location: '', crisisType: 'Estrés Agudo', triagePriority: 'Medio', notes: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateCase = async (id: string, data: Partial<PsychosocialCase>) => {
    try { await updateDoc(doc(db, 'psychosocial_cases', id), data); } catch (err) { console.error(err); }
  };

  const filtered = cases.filter(c => filterStatus === 'Todos' || c.status === filterStatus);
  const urgent = cases.filter(c => c.triagePriority === 'Inmediato' && c.status !== 'Cerrado');

  const exportCSV = () => {
    const headers = 'Nombre,Edad,Contacto,Ubicación,Tipo Crisis,Prioridad,Estatus,Sesiones,Psicólogo,Fecha';
    const rows = cases.map(c =>
      `"${c.patientName || 'Anónimo'}",${c.age || '-'},"${c.contact || '-'}","${c.location || '-'}","${c.crisisType}","${c.triagePriority}","${c.status}",${c.sessionCount || 0},"${c.assignedPsychologist || '-'}","${new Date(c.createdAt).toISOString()}"`
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'psicosocial_casos.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(16);
    doc.text('SISMOVZLA - APOYO PSICOSOCIAL Y SALUD MENTAL', 14, 20);
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generado: ${today}`, 14, 28);
    autoTable(doc, {
      head: [['Nombre', 'Edad', 'Tipo Crisis', 'Prioridad', 'Estatus', 'Sesiones', 'Psicólogo', 'Fecha']],
      body: cases.map(c => [
        c.patientName || 'Anónimo', c.age != null ? String(c.age) : '-', c.crisisType,
        c.triagePriority, c.status, String(c.sessionCount || 0), c.assignedPsychologist || '-',
        new Date(c.createdAt).toLocaleDateString('es-VE'),
      ]),
      startY: 35,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, font: 'helvetica' },
    });
    doc.save(`psicosocial_casos_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {urgent.length > 0 && (
        <div className="bg-red-600/20 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <Heart className="w-6 h-6 text-red-400" />
          <div>
            <p className="font-mono font-bold text-red-400 text-sm uppercase">{urgent.length} caso(s) requieren atención psicosocial INMEDIATA</p>
            <p className="text-[10px] font-mono text-red-400/60">Activar protocolo de Primeros Auxilios Psicológicos</p>
          </div>
        </div>
      )}

      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-pink-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">APOYO PSICOSOCIAL Y SALUD MENTAL</h2>
            <p className="text-xs text-white/50 mt-1">Primeros Auxilios Psicológicos (PAP) y atención a crisis emocional</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> NUEVO CASO
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
        <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-pink-400">{cases.length}</p>
          <p className="text-[9px] font-mono text-pink-400/70 uppercase">Total casos</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-red-400">{urgent.length}</p>
          <p className="text-[9px] font-mono text-red-400/70 uppercase">Urgentes</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-yellow-400">{cases.filter(c => c.status === 'En Seguimiento').length}</p>
          <p className="text-[9px] font-mono text-yellow-400/70 uppercase">Seguimiento</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-green-400">{cases.filter(c => c.status === 'Cerrado').length}</p>
          <p className="text-[9px] font-mono text-green-400/70 uppercase">Cerrados</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['Todos', 'Abierto', 'En Seguimiento', 'Cerrado', 'Derivado'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              filterStatus === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/50'
            }`}>{s}</button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Registrar caso psicosocial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Nombre (puede ser anónimo)</label>
              <input value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Anónimo si prefiere" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Contacto</label>
              <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Teléfono o dirección" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Edad</label>
              <input type="number" value={form.age || ''} onChange={e => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Ubicación</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Tipo de crisis</label>
              <select value={form.crisisType} onChange={e => setForm({ ...form, crisisType: e.target.value as PsychosocialCase['crisisType'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Pérdida Familiar">Pérdida Familiar</option>
                <option value="Pérdida de Vivienda">Pérdida de Vivienda</option>
                <option value="Estrés Agudo">Estrés Agudo</option>
                <option value="Crisis de Pánico">Crisis de Pánico</option>
                <option value="Menor No Acompañado">Menor No Acompañado</option>
                <option value="Violencia">Violencia</option>
                <option value="Intento Suicida">Intento Suicida</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Prioridad de atención</label>
              <select value={form.triagePriority} onChange={e => setForm({ ...form, triagePriority: e.target.value as PsychosocialCase['triagePriority'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Inmediato">Inmediato</option>
                <option value="Alto">Alto</option>
                <option value="Medio">Medio</option>
                <option value="Bajo">Bajo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-white/50 uppercase">Notas</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" rows={2} />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'REGISTRANDO...' : 'REGISTRAR CASO'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-[#121212] border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${PRIORITY_COLORS[c.triagePriority]}`}>
                  {c.triagePriority === 'Inmediato' ? '!' : c.triagePriority[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-white">{c.patientName || 'Anónimo'}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </div>
                  <p className="text-[10px] font-mono text-white/50 mt-0.5">
                    Crisis: {c.crisisType} · Prioridad: {c.triagePriority}
                    {c.contact ? ` · 📞 ${c.contact}` : ''}
                    {c.location ? ` · 📍 ${c.location}` : ''}
                  </p>
                  {c.assignedPsychologist && <p className="text-[10px] font-mono text-blue-300 mt-0.5">Asignado a: {c.assignedPsychologist}</p>}
                  {c.sessionCount ? <p className="text-[10px] font-mono text-white/40">Sesiones: {c.sessionCount}</p> : null}
                  <p className="text-[9px] font-mono text-white/30 mt-1">{new Date(c.createdAt).toLocaleString('es-VE')}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {(['Abierto', 'En Seguimiento', 'Cerrado', 'Derivado'] as const).map(s => (
                  <button key={s} onClick={() => updateCase(c.id, { status: s })}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                      c.status === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40'
                    }`}>{s === 'En Seguimiento' ? 'SEG' : s.slice(0, 5)}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30 font-mono text-sm">No hay casos psicosociales registrados.</div>
        )}
      </div>
    </div>
  );
}
