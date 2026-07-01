import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { FamilyRequest } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Heart, Plus, Download, Search, CheckCircle, Filter, X, Phone } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Buscando: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'En Contacto': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Reunificado: 'bg-green-500/20 text-green-400 border-green-500/30',
  Cerrado: 'bg-white/10 text-white/40 border-white/20',
};

export default function FamilyReunificationModule() {
  const [requests, setRequests] = useState<FamilyRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    seekerName: '', seekerPhone: '', seekerCI: '', missingName: '', missingCI: '',
    missingAge: 0, lastSeenLocation: '', description: '',
    state: 'Caracas' as FamilyRequest['state'],
  });

  useEffect(() => {
    const q = query(collection(db, 'family_requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as FamilyRequest)));
    });
    return unsub;
  }, []);

  const filtered = requests.filter(r =>
    (filterStatus === 'Todos' || r.status === filterStatus) &&
    (searchTerm === '' || r.missingName.toLowerCase().includes(searchTerm.toLowerCase()) || r.seekerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'family_requests'), {
        ...form, lastSeenDate: Date.now(), status: 'Buscando', reportedBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ seekerName: '', seekerPhone: '', seekerCI: '', missingName: '', missingCI: '', missingAge: 0, lastSeenLocation: '', description: '', state: 'Caracas' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (req: FamilyRequest, newStatus: FamilyRequest['status']) => {
    await updateDoc(doc(db, 'family_requests', req.id), { status: newStatus, updatedAt: Date.now() });
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.setTextColor(211, 47, 47);
    docPdf.text('Reunificacion Familiar - SismoVZLA', 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100);
    docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, 14, 30);
    autoTable(docPdf, {
      startY: 35,
      head: [['Busca', 'Desaparecido', 'Ubicacion', 'Estado', 'Telefono']],
      body: filtered.map(r => [r.seekerName, r.missingName, r.lastSeenLocation, r.status, r.seekerPhone]),
      theme: 'grid', headStyles: { fillColor: [211, 47, 47] },
    });
    docPdf.save('reunificacion_familiar.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Reunificacion Familiar</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{filtered.length} solicitudes</span>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar nombre..."
              className="pl-7 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-mono w-40" />
          </div>
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVA SOLICITUD'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Buscando', 'En Contacto', 'Reunificado', 'Cerrado'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${filterStatus === s ? 'bg-pink-600 text-white border-pink-500' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
            {s}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input value={form.seekerName} onChange={e => setForm({ ...form, seekerName: e.target.value })} placeholder="Nombre de quien busca" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input value={form.seekerPhone} onChange={e => setForm({ ...form, seekerPhone: e.target.value })} placeholder="Telefono de contacto" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input value={form.missingName} onChange={e => setForm({ ...form, missingName: e.target.value })} placeholder="Nombre de la persona buscada" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input value={form.lastSeenLocation} onChange={e => setForm({ ...form, lastSeenLocation: e.target.value })} placeholder="Ultima ubicacion conocida" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripcion (apariencia, circunstancias)" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'ENVIANDO...' : 'REGISTRAR SOLICITUD'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map(req => (
          <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-mono font-bold text-white text-xs">Busca: {req.seekerName}</h3>
                  <span className="text-white/30">→</span>
                  <span className="font-mono text-pink-400 text-xs">{req.missingName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                </div>
                <p className="text-[10px] text-white/50 mt-1">Ultima vez: {req.lastSeenLocation} | {req.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-3 h-3 text-white/30" />
                  <span className="text-[9px] font-mono text-white/40">{req.seekerPhone}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {req.status === 'Buscando' && (
                  <button onClick={() => updateStatus(req, 'En Contacto')} className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-[9px] font-mono font-bold border border-blue-500/30 cursor-pointer">CONTACTAR</button>
                )}
                {req.status === 'En Contacto' && (
                  <button onClick={() => updateStatus(req, 'Reunificado')} className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-[9px] font-mono font-bold border border-green-500/30 cursor-pointer">REUNIFICAR</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/30 text-xs font-mono py-8">No hay solicitudes</p>}
      </div>
    </div>
  );
}
