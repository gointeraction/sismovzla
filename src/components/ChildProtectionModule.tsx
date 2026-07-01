import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChildCase } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Baby, Plus, Download, Search, CheckCircle, Filter, X, AlertTriangle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  'No Acompañado': 'bg-red-500/20 text-red-400 border-red-500/30',
  'En Protección': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Con Familia': 'bg-green-500/20 text-green-400 border-green-500/30',
  Derivado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Resuelto: 'bg-white/10 text-white/40 border-white/20',
};

export default function ChildProtectionModule() {
  const [cases, setCases] = useState<ChildCase[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [form, setForm] = useState({
    childName: '', childAge: 0, childGender: 'M' as ChildCase['childGender'],
    parentName: '', parentPhone: '', location: '',
    state: 'Caracas' as ChildCase['state'], medicalNeeds: '', notes: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'child_protection_cases'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setCases(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChildCase)));
    });
    return unsub;
  }, []);

  const filtered = cases.filter(c => filterStatus === 'Todos' || c.status === filterStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'child_protection_cases'), {
        ...form, status: 'No Acompañado', reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ childName: '', childAge: 0, childGender: 'M', parentName: '', parentPhone: '', location: '', state: 'Caracas', medicalNeeds: '', notes: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (c: ChildCase, newStatus: ChildCase['status']) => {
    await updateDoc(doc(db, 'child_protection_cases', c.id), { status: newStatus, updatedAt: Date.now() });
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.setTextColor(211, 47, 47);
    docPdf.text('Proteccion Infantil - SismoVZLA', 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100);
    docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, 14, 30);
    autoTable(docPdf, {
      startY: 35,
      head: [['Nombre', 'Edad', 'Genero', 'Estado', 'Ubicacion']],
      body: filtered.map(c => [c.childName, c.childAge.toString(), c.childGender, c.status, c.location]),
      theme: 'grid', headStyles: { fillColor: [211, 47, 47] },
    });
    docPdf.save('proteccion_infantil.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Baby className="w-5 h-5 text-pink-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Proteccion Infantil</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{cases.filter(c => c.status === 'No Acompañado').length} sin acompanar</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVO CASO'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'No Acompañado', 'En Protección', 'Con Familia', 'Derivado', 'Resuelto'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${filterStatus === s ? 'bg-pink-600 text-white border-pink-500' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
            {s}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input value={form.childName} onChange={e => setForm({ ...form, childName: e.target.value })} placeholder="Nombre del menor" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input type="number" value={form.childAge || ''} onChange={e => setForm({ ...form, childAge: Number(e.target.value) })} placeholder="Edad" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <select value={form.childGender} onChange={e => setForm({ ...form, childGender: e.target.value as ChildCase['childGender'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              <option value="M">Masculino</option><option value="F">Femenino</option><option value="Otro">Otro</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} placeholder="Nombre del familiar" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value })} placeholder="Telefono familiar" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ubicacion actual" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <textarea value={form.medicalNeeds} onChange={e => setForm({ ...form, medicalNeeds: e.target.value })} placeholder="Necesidades medicas (opcional)" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'REGISTRANDO...' : 'REGISTRAR CASO'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className={`bg-white/5 border rounded-xl p-4 ${c.status === 'No Acompañado' ? 'border-red-500/30' : 'border-white/10'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {c.status === 'No Acompañado' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                  <h3 className="font-mono font-bold text-white text-xs">{c.childName}</h3>
                  <span className="text-[9px] font-mono text-white/40">{c.childAge} anos | {c.childGender}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                </div>
                <p className="text-[10px] text-white/50 mt-1">Ubicacion: {c.location} | Estado: {c.state}</p>
                {c.parentName && <p className="text-[9px] font-mono text-white/30 mt-1">Familiar: {c.parentName} | {c.parentPhone}</p>}
                {c.medicalNeeds && <p className="text-[9px] font-mono text-yellow-400/70 mt-1">Necesidades: {c.medicalNeeds}</p>}
              </div>
              <div className="flex gap-1 flex-wrap">
                {c.status === 'No Acompañado' && (
                  <button onClick={() => updateStatus(c, 'En Protección')} className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-[9px] font-mono font-bold border border-yellow-500/30 cursor-pointer">PROTEGER</button>
                )}
                {c.status === 'En Protección' && (
                  <button onClick={() => updateStatus(c, 'Con Familia')} className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-[9px] font-mono font-bold border border-green-500/30 cursor-pointer">REUNIR</button>
                )}
                {c.status === 'Con Familia' && (
                  <button onClick={() => updateStatus(c, 'Resuelto')} className="px-2 py-1 bg-white/10 text-white/60 rounded text-[9px] font-mono font-bold border border-white/20 cursor-pointer">CERRAR</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay casos registrados</p>}
      </div>
    </div>
  );
}
