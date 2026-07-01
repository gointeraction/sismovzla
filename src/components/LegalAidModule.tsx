import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { LegalAidRequest } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Scale, Plus, Download, CheckCircle, Filter, X, FileText } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Registrado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'En Trámite': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Resuelto: 'bg-green-500/20 text-green-400 border-green-500/30',
  Derivado: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function LegalAidModule() {
  const [requests, setRequests] = useState<LegalAidRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [form, setForm] = useState({
    petitionerName: '', petitionerCI: '', petitionerPhone: '',
    requestType: 'Acta de Defunción' as LegalAidRequest['requestType'],
    description: '', state: 'Caracas' as LegalAidRequest['state'], institution: '', notes: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'legal_aid_requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as LegalAidRequest)));
    });
    return unsub;
  }, []);

  const filtered = requests.filter(r => filterStatus === 'Todos' || r.status === filterStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'legal_aid_requests'), {
        ...form, status: 'Registrado', reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ petitionerName: '', petitionerCI: '', petitionerPhone: '', requestType: 'Acta de Defunción', description: '', state: 'Caracas', institution: '', notes: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateStatus = async (r: LegalAidRequest, newStatus: LegalAidRequest['status']) => {
    await updateDoc(doc(db, 'legal_aid_requests', r.id), { status: newStatus, updatedAt: Date.now() });
  };

  const exportPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(18); docPdf.setTextColor(211, 47, 47);
    docPdf.text('Asistencia Legal - SismoVZLA', 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100);
    docPdf.text(`Fecha: ${new Date().toLocaleDateString('es-VE')}`, 14, 30);
    autoTable(docPdf, {
      startY: 35,
      head: [['Solicitante', 'Tipo', 'Estado', 'Institucion']],
      body: filtered.map(r => [r.petitionerName, r.requestType, r.status, r.institution || '-']),
      theme: 'grid', headStyles: { fillColor: [211, 47, 47] },
    });
    docPdf.save('asistencia_legal.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-400" />
          <h2 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Asistencia Legal</h2>
          <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded">{filtered.length} solicitudes</span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg font-mono text-[10px] border border-white/10 cursor-pointer">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-mono text-[10px] font-bold cursor-pointer">
            {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {showForm ? 'CANCELAR' : 'NUEVA SOLICITUD'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['Todos', 'Registrado', 'En Trámite', 'Resuelto', 'Derivado'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold border cursor-pointer ${filterStatus === s ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}>
            {s}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input value={form.petitionerName} onChange={e => setForm({ ...form, petitionerName: e.target.value })} placeholder="Nombre completo" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input value={form.petitionerCI} onChange={e => setForm({ ...form, petitionerCI: e.target.value })} placeholder="Cedula de Identidad" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
            <input value={form.petitionerPhone} onChange={e => setForm({ ...form, petitionerPhone: e.target.value })} placeholder="Telefono" required className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <select value={form.requestType} onChange={e => setForm({ ...form, requestType: e.target.value as LegalAidRequest['requestType'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              {['Acta de Defunción', 'Acta de Nacimiento', 'Identificación', 'Propiedad', 'Seguro', 'Otro'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value as LegalAidRequest['state'] })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono">
              {['Caracas', 'La Guaira', 'Aragua', 'Carabobo', 'Otros'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripcion del tramite" rows={2} required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-mono text-xs font-bold disabled:opacity-50 cursor-pointer">
            {submitting ? 'REGISTRANDO...' : 'REGISTRAR SOLICITUD'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map(r => (
          <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <h3 className="font-mono font-bold text-white text-xs">{r.petitionerName}</h3>
                  <span className="text-[9px] font-mono text-white/40">CI: {r.petitionerCI}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                </div>
                <p className="text-[10px] text-white/50 mt-1">Tipo: {r.requestType} | Estado: {r.state}</p>
                <p className="text-[9px] font-mono text-white/30 mt-1">{r.description}</p>
              </div>
              <div className="flex gap-1">
                {r.status === 'Registrado' && (
                  <button onClick={() => updateStatus(r, 'En Trámite')} className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-[9px] font-mono font-bold border border-yellow-500/30 cursor-pointer">INICIAR</button>
                )}
                {r.status === 'En Trámite' && (
                  <button onClick={() => updateStatus(r, 'Resuelto')} className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-[9px] font-mono font-bold border border-green-500/30 cursor-pointer">RESOLVER</button>
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