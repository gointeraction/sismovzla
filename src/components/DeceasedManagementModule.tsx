import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { DeceasedPerson } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HeartOff, MapPin, Search, Plus, Download, AlertTriangle, CheckCircle, UserCheck, FileText } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

const STATUS_COLORS: Record<string, string> = {
  Recuperado: 'bg-gray-600/30 text-gray-400',
  'En Morgue': 'bg-blue-600/30 text-blue-400',
  Identificado: 'bg-yellow-500/20 text-yellow-400',
  'Entregado a Familiares': 'bg-green-500/20 text-green-400',
  Sepultado: 'bg-gray-800/30 text-gray-500',
};

export default function DeceasedManagementModule() {
  const [persons, setPersons] = useState<DeceasedPerson[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const { getPosition } = useGeolocation();

  const [form, setForm] = useState({
    fullName: '', ci: '', age: 0, gender: '' as 'M' | 'F' | 'D' | '',
    recoveryAddress: '', causeOfDeath: '' as string, identified: false,
    identificationMethod: '' as string, morgueLocation: '', bodyTag: '',
    personalEffects: '', familyContact: '', notes: '',
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'deceased_persons'), orderBy('createdAt', 'desc')), snap => {
      setPersons(snap.docs.map(d => ({ id: d.id, ...d.data() } as DeceasedPerson)));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pos = await getPosition();
      const ref = doc(collection(db, 'deceased_persons'));
      const caseId = `VZLA-FOR-${new Date().getFullYear()}-${ref.id.slice(-4).toUpperCase()}`;
      await addDoc(collection(db, 'deceased_persons'), {
        caseId, fullName: form.fullName || null, ci: form.ci || null,
        age: form.age || null, gender: form.gender || null,
        recoveryLat: pos?.lat ?? 0, recoveryLng: pos?.lng ?? 0, recoveryAddress: form.recoveryAddress || null,
        recoveryTime: Date.now(), causeOfDeath: form.causeOfDeath || null,
        identified: form.identified, identificationMethod: form.identificationMethod || null,
        morgueLocation: form.morgueLocation || null, bodyTag: form.bodyTag || null,
        personalEffects: form.personalEffects || null, familyNotified: false,
        familyContact: form.familyContact || null, status: 'Recuperado',
        reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon', createdAt: Date.now(), updatedAt: Date.now(),
      });
      setShowForm(false);
      setForm({ fullName: '', ci: '', age: 0, gender: '', recoveryAddress: '', causeOfDeath: '', identified: false, identificationMethod: '', morgueLocation: '', bodyTag: '', personalEffects: '', familyContact: '', notes: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updatePerson = async (id: string, data: Partial<DeceasedPerson>) => {
    try { await updateDoc(doc(db, 'deceased_persons', id), { ...data, updatedAt: Date.now() }); }
    catch (err) { console.error(err); }
  };

  const filtered = persons.filter(p => {
    if (filterStatus !== 'Todos' && p.status !== filterStatus) return false;
    if (searchTerm && !p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) && !p.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) && !p.ci?.includes(searchTerm)) return false;
    return true;
  });

  const counts = {
    total: persons.length, identified: persons.filter(p => p.identified).length,
    delivered: persons.filter(p => p.status === 'Entregado a Familiares' || p.status === 'Sepultado').length,
    pending: persons.filter(p => p.status === 'Recuperado' || p.status === 'En Morgue').length,
  };

  const exportCSV = () => {
    const headers = 'Caso,Nombre,CI,Edad,Sexo,Causa,Dirección Recuperación,Estatus,Identificado,Morgue,Tag,Efectos Personales,Fecha';
    const rows = persons.map(p =>
      `"${p.caseId || '-'}","${p.fullName || 'No ID'}","${p.ci || '-'}",${p.age || '-'},"${p.gender || '-'}","${p.causeOfDeath || '-'}","${p.recoveryAddress || '-'}","${p.status}","${p.identified ? 'Sí' : 'No'}","${p.morgueLocation || '-'}","${p.bodyTag || '-'}","${p.personalEffects || '-'}","${new Date(p.createdAt).toISOString()}"`
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fallecidos_forense.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(16);
    doc.text('SISMOVZLA - GESTIÓN DE FALLECIDOS Y FORENSE', 14, 20);
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generado: ${today}`, 14, 28);
    autoTable(doc, {
      head: [['Caso', 'Nombre', 'CI', 'Edad', 'Sexo', 'Causa', 'Estatus', 'Identificado', 'Morgue']],
      body: persons.map(p => [
        p.caseId || '-', p.fullName || 'No ID', p.ci || '-', p.age != null ? String(p.age) : '-',
        p.gender || '-', p.causeOfDeath || '-', p.status, p.identified ? 'Sí' : 'No', p.morgueLocation || '-',
      ]),
      startY: 35,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 7, font: 'helvetica' },
    });
    doc.save(`fallecidos_forense_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HeartOff className="w-6 h-6 text-gray-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">GESTIÓN DE FALLECIDOS Y FORENSE</h2>
            <p className="text-xs text-white/50 mt-1">Registro forense, cadena de custodia, morgues y notificación</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
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
        <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-gray-400">{counts.total}</p>
          <p className="text-[9px] font-mono text-gray-400/70 uppercase">Total casos</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-yellow-400">{counts.identified}</p>
          <p className="text-[9px] font-mono text-yellow-400/70 uppercase">Identificados</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-green-400">{counts.delivered}</p>
          <p className="text-[9px] font-mono text-green-400/70 uppercase">Entregados</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-red-400">{counts.pending}</p>
          <p className="text-[9px] font-mono text-red-400/70 uppercase">Pendientes</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nombre, caso o CI..."
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white font-mono" />
        </div>
        {['Todos', 'Recuperado', 'En Morgue', 'Identificado', 'Entregado a Familiares', 'Sepultado'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              filterStatus === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/50'
            }`}>{s === 'Entregado a Familiares' ? 'ENTREG' : s === 'En Morgue' ? 'MORGUE' : s.slice(0, 6)}</button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Nuevo caso forense · VZLA-FOR-{new Date().getFullYear()}-XXXX</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Nombre (si identificado)</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">CI</label>
              <input value={form.ci} onChange={e => setForm({ ...form, ci: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase">Edad</label>
                <input type="number" value={form.age || ''} onChange={e => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase">Sexo</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as 'M' | 'F' | 'D' | '' })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                  <option value="">N/E</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Dirección de recuperación</label>
              <input value={form.recoveryAddress} onChange={e => setForm({ ...form, recoveryAddress: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Causa de muerte</label>
              <select value={form.causeOfDeath} onChange={e => setForm({ ...form, causeOfDeath: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="">No especificada</option>
                <option value="Trauma">Trauma</option>
                <option value="Asfixia">Asfixia</option>
                <option value="Quemaduras">Quemaduras</option>
                <option value="Hipotermia">Hipotermia</option>
                <option value="Paro Cardíaco">Paro Cardíaco</option>
                <option value="Desconocida">Desconocida</option>
                <option value="Otra">Otra</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Morgue / destino</label>
              <input value={form.morgueLocation} onChange={e => setForm({ ...form, morgueLocation: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Morgue Temporal X" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Etiqueta corporal #</label>
              <input value={form.bodyTag} onChange={e => setForm({ ...form, bodyTag: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Pertenencias</label>
              <input value={form.personalEffects} onChange={e => setForm({ ...form, personalEffects: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="flex items-center gap-2 mt-6 cursor-pointer">
                <input type="checkbox" checked={form.identified} onChange={e => setForm({ ...form, identified: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500" />
                <span className="text-xs font-mono text-white/80">Identificado</span>
              </label>
            </div>
            {form.identified && (
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase">Método de identificación</label>
                <select value={form.identificationMethod} onChange={e => setForm({ ...form, identificationMethod: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                  <option value="Documento">Documento</option>
                  <option value="Familiar">Familiar</option>
                  <option value="Huella">Huella dactilar</option>
                  <option value="Odontograma">Odontograma</option>
                  <option value="ADN">ADN</option>
                </select>
              </div>
            )}
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'REGISTRANDO...' : 'REGISTRAR CASO FORENSE'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {filtered.map(p => (
          <div key={p.id} className={`${STATUS_COLORS[p.status]} border rounded-xl p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{p.gender === 'F' ? '👩' : '👨'}</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-white">{p.fullName || 'No identificado'}</span>
                    <span className="text-[9px] font-mono bg-black/30 px-2 py-0.5 rounded">{p.caseId}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${STATUS_COLORS[p.status].split(' ')[0]} ${STATUS_COLORS[p.status].split(' ')[1]}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-white/50 mt-0.5">
                    {p.ci ? `CI: ${p.ci} · ` : ''}{p.age ? `${p.age} años · ` : ''}{p.gender ? `${p.gender === 'M' ? 'Masc.' : 'Fem.'} · ` : ''}
                    Causa: {p.causeOfDeath || 'N/E'}
                  </p>
                  <p className="text-[9px] font-mono text-white/40">
                    {p.morgueLocation ? `Morgue: ${p.morgueLocation} · ` : ''}
                    {p.bodyTag ? `Tag: ${p.bodyTag} · ` : ''}
                    {p.recoveryAddress ? `Ubicación: ${p.recoveryAddress}` : ''}
                  </p>
                  <p className="text-[9px] font-mono text-white/40 mt-0.5">
                    {p.identified ? `ID: ${p.identificationMethod || 'N/E'}` : 'NO IDENTIFICADO'}
                    {p.familyNotified ? ' · ✅ Familia notificada' : ' · ⏳ Pendiente notificación'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {(['Recuperado', 'En Morgue', 'Identificado', 'Entregado a Familiares', 'Sepultado'] as const).map(s => (
                  <button key={s} onClick={() => updatePerson(p.id, { status: s })}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                      p.status === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40'
                    }`}>{s === 'Entregado a Familiares' ? 'ENTREG' : s.slice(0, 6)}</button>
                ))}
                <button onClick={() => updatePerson(p.id, { identified: !p.identified })}
                  className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border cursor-pointer ${
                    p.identified ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}>{p.identified ? 'IDENTIF' : 'NO ID'}</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30 font-mono text-sm">No hay casos forenses registrados.</div>
        )}
      </div>
    </div>
  );
}
