import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { PressRelease } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Newspaper, Plus, Download, CheckCircle, Filter, X, Eye, Send } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Oficial: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Situación: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Operativo: 'bg-green-500/20 text-green-400 border-green-500/30',
  Salud: 'bg-red-500/20 text-red-400 border-red-500/30',
  Logística: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Otro: 'bg-white/10 text-white/50 border-white/20',
};

export default function PressCenterModule() {
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [form, setForm] = useState({
    title: '', summary: '', content: '', category: 'Oficial' as PressRelease['category'],
    author: '', source: '', states: [] as string[],
  });

  useEffect(() => {
    const q = query(collection(db, 'press_releases'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setReleases(snap.docs.map(d => ({ id: d.id, ...d.data() } as PressRelease)));
    });
    return unsub;
  }, []);

  const filtered = releases.filter(r => filterCategory === 'Todos' || r.category === filterCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'press_releases'), {
        ...form, published: false, viewCount: 0, createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ title: '', summary: '', content: '', category: 'Oficial', author: '', source: '', states: [] });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const togglePublish = async (r: PressRelease) => {
    await updateDoc(doc(db, 'press_releases', r.id), { published: !r.published, updatedAt: Date.now() });
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.setTextColor(211, 47, 47);
    docPdf.text('Centro de Prensa - SismoVZLA', 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100);
    docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, 14, 30);
    autoTable(docPdf, {
      startY: 35,
      head: [['Titulo', 'Categoria', 'Publicado', 'Vistas']],
      body: filtered.map(r => [r.title, r.category, r.published ? 'Si' : 'No', r.viewCount.toString()]),
      theme: 'grid', headStyles: { fillColor: [211, 47, 47] },
    });
    docPdf.save('centro_prensa.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Centro de Prensa</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{releases.filter(r => r.published).length} publicados</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVO COMUNICADO'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Oficial', 'Situación', 'Operativo', 'Salud', 'Logística', 'Otro'].map(c => (
          <button key={c} onClick={() => setFilterCategory(c)}
            className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${filterCategory === c ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
            {c}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titulo del comunicado" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <input value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Resumen ejecutivo" required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Contenido completo del comunicado" rows={6} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as PressRelease['category'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              {['Oficial', 'Situación', 'Operativo', 'Salud', 'Logística', 'Otro'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Autor / Fuente" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'CREANDO...' : 'CREAR COMUNICADO'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <div key={r.id} className={`bg-white/5 border rounded-xl p-4 ${r.published ? 'border-green-500/30' : 'border-white/10'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-mono font-bold text-white text-xs">{r.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${CATEGORY_COLORS[r.category]}`}>{r.category}</span>
                  {r.published && <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-green-500/20 text-green-400 border border-green-500/30">PUBLICADO</span>}
                </div>
                <p className="text-[10px] text-white/50 mt-1">{r.summary}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[9px] font-mono text-white/30"><Eye className="w-3 h-3" />{r.viewCount}</span>
                  <span className="text-[9px] font-mono text-white/30">{new Date(r.createdAt).toLocaleString('es-VE')}</span>
                </div>
              </div>
              <button onClick={() => togglePublish(r)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${r.published ? 'bg-white/10 text-white/60 border-white/20' : 'bg-green-600/20 text-green-400 border-green-500/30'}`}>
                {r.published ? <Send className="w-3 h-3" /> : <Send className="w-3 h-3" />} {r.published ? 'OCULTAR' : 'PUBLICAR'}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay comunicados</p>}
      </div>
    </div>
  );
}