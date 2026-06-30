import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { VolunteerRegistry, Donation } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Users, Gift, Plus, Download, Search, MapPin, Phone, Briefcase, FileText } from 'lucide-react';

const SKILLS = ['Primeros Auxilios', 'Radio', 'Conducción', 'Psicología', 'Enfermería', 'Rescate', 'Logística', 'Cocina', 'Construcción', 'Electricidad'];

const STATUS_COLORS: Record<string, string> = {
  Registrado: 'bg-gray-500/20 text-gray-400',
  Asignado: 'bg-blue-500/20 text-blue-400',
  'En Campo': 'bg-green-500/20 text-green-400',
  Descanso: 'bg-yellow-500/20 text-yellow-400',
  Finalizado: 'bg-gray-800/30 text-gray-500',
};

export default function VolunteerDonationsModule() {
  const [volunteers, setVolunteers] = useState<VolunteerRegistry[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [view, setView] = useState<'volunteers' | 'donations'>('volunteers');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [volForm, setVolForm] = useState({
    fullName: '', ci: '', phone: '', profession: '',
    skills: [] as string[], availability: 'Inmediata' as VolunteerRegistry['availability'],
    location: '',
  });

  const [donForm, setDonForm] = useState({
    donorType: 'Persona' as Donation['donorType'], donorName: '',
    donationType: 'Insumo' as Donation['donationType'],
    amount: 0, itemDescription: '', quantity: 0, destination: '',
  });

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'volunteers_registry'), orderBy('createdAt', 'desc')), snap =>
      setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerRegistry))));
    const unsub2 = onSnapshot(query(collection(db, 'donations'), orderBy('createdAt', 'desc')), snap =>
      setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation))));
    return () => { unsub1(); unsub2(); };
  }, []);

  const submitVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'volunteers_registry'), {
        ...volForm, skills: volForm.skills, profession: volForm.profession || null,
        location: volForm.location || null, status: 'Registrado', registeredBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setVolForm({ fullName: '', ci: '', phone: '', profession: '', skills: [], availability: 'Inmediata', location: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const submitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'donations'), {
        ...donForm, amount: donForm.amount || null, quantity: donForm.quantity || null,
        itemDescription: donForm.itemDescription || null, destination: donForm.destination || null,
        status: 'Registrado', createdAt: Date.now(),
      });
      setShowForm(false);
      setDonForm({ donorType: 'Persona', donorName: '', donationType: 'Insumo', amount: 0, itemDescription: '', quantity: 0, destination: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateVolunteer = async (id: string, data: Partial<VolunteerRegistry>) => {
    try { await updateDoc(doc(db, 'volunteers_registry', id), data); } catch (err) { console.error(err); }
  };

  const toggleSkill = (s: string) => {
    setVolForm(prev => ({
      ...prev, skills: prev.skills.includes(s) ? prev.skills.filter(x => x !== s) : [...prev.skills, s],
    }));
  };

  const filtered = volunteers.filter(v =>
    !searchTerm || v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || v.ci.includes(searchTerm)
  );

  const fieldReady = volunteers.filter(v => v.status === 'En Campo').length;

  const exportCSV = () => {
    const vHeaders = 'Nombre,CI,Teléfono,Profesión,Habilidades,Disponibilidad,Ubicación,Estatus,Tarea,Turno';
    const vRows = volunteers.map(v =>
      `"${v.fullName}","${v.ci}","${v.phone}","${v.profession || '-'}","${(v.skills || []).join('; ')}","${v.availability}","${v.location || '-'}","${v.status}","${v.assignedTask || '-'}","${v.assignedShift || '-'}"`
    ).join('\n');
    const dHeaders = 'Donante,Tipo,Donación,Monto $,Descripción,Cantidad,Destino,Estatus';
    const dRows = donations.map(d =>
      `"${d.donorName}","${d.donorType}","${d.donationType}",${d.amount || '-'},"${d.itemDescription || '-'}",${d.quantity || '-'},"${d.destination || '-'}","${d.status}"`
    ).join('\n');
    const blob = new Blob([`VOLUNTARIOS\n${vHeaders}\n${vRows}\n\nDONACIONES\n${dHeaders}\n${dRows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'voluntarios_donaciones.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(16);
    doc.text('SISMOVZLA - VOLUNTARIOS Y DONACIONES', 14, 20);
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generado: ${today}`, 14, 28);
    autoTable(doc, {
      head: [['Nombre', 'CI', 'Teléfono', 'Habilidades', 'Disponibilidad', 'Estatus']],
      body: volunteers.map(v => [
        v.fullName, v.ci, v.phone, (v.skills || []).join(', '), v.availability, v.status,
      ]),
      startY: 35,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, font: 'helvetica' },
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('DONACIONES', 14, finalY);
    autoTable(doc, {
      head: [['Donante', 'Tipo', 'Donación', 'Monto', 'Descripción', 'Cantidad', 'Estatus']],
      body: donations.map(d => [
        d.donorName, d.donorType, d.donationType, d.amount ? `$${d.amount}` : '-',
        d.itemDescription || '-', d.quantity ? String(d.quantity) : '-', d.status,
      ]),
      startY: finalY + 5,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, font: 'helvetica' },
    });
    doc.save(`voluntarios_donaciones_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {view === 'volunteers' ? <Users className="w-6 h-6 text-blue-400" /> : <Gift className="w-6 h-6 text-emerald-400" />}
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">{view === 'volunteers' ? 'VOLUNTARIOS' : 'DONACIONES'}</h2>
            <p className="text-xs text-white/50 mt-1">{view === 'volunteers' ? `${fieldReady} voluntarios en campo · ${volunteers.length} registrados` : `${donations.length} donaciones registradas`}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> {view === 'volunteers' ? 'REGISTRAR VOLUNTARIO' : 'REGISTRAR DONACIÓN'}
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

      <div className="flex gap-2">
        <button onClick={() => setView('volunteers')}
          className={`px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${view === 'volunteers' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-black/20 border-white/10 text-white/50'}`}>
          VOLUNTARIOS ({volunteers.length})
        </button>
        <button onClick={() => setView('donations')}
          className={`px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${view === 'donations' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-black/20 border-white/10 text-white/50'}`}>
          DONACIONES ({donations.length})
        </button>
      </div>

      {view === 'volunteers' && (
        <>
          {showForm && (
            <form onSubmit={submitVolunteer} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Registrar voluntario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Nombre completo</label>
                  <input value={volForm.fullName} onChange={e => setVolForm({ ...volForm, fullName: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">CI</label>
                  <input value={volForm.ci} onChange={e => setVolForm({ ...volForm, ci: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Teléfono</label>
                  <input value={volForm.phone} onChange={e => setVolForm({ ...volForm, phone: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Profesión</label>
                  <input value={volForm.profession} onChange={e => setVolForm({ ...volForm, profession: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Disponibilidad</label>
                  <select value={volForm.availability} onChange={e => setVolForm({ ...volForm, availability: e.target.value as VolunteerRegistry['availability'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="Inmediata">Inmediata</option>
                    <option value="Próximas 24h">Próximas 24h</option>
                    <option value="Próximos 3 Días">Próximos 3 Días</option>
                    <option value="Indefinida">Indefinida</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Ubicación</label>
                  <input value={volForm.location} onChange={e => setVolForm({ ...volForm, location: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase">Habilidades</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SKILLS.map(s => (
                      <button key={s} type="button" onClick={() => toggleSkill(s)}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                          volForm.skills.includes(s) ? 'bg-blue-500/30 border-blue-500/50 text-blue-300' : 'bg-black/20 border-white/10 text-white/50'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
                {submitting ? 'REGISTRANDO...' : 'REGISTRAR VOLUNTARIO'}
              </button>
            </form>
          )}

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar voluntario..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white font-mono" />
          </div>

          <div className="grid gap-3">
            {filtered.map(v => (
              <div key={v.id} className="bg-[#121212] border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-mono font-bold text-sm">
                      {v.fullName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-white">{v.fullName}</span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${STATUS_COLORS[v.status]}`}>{v.status}</span>
                      </div>
                      <p className="text-[10px] font-mono text-white/50 mt-0.5">
                        CI: {v.ci} · 📞 {v.phone} {v.profession ? `· ${v.profession}` : ''} · {v.availability}
                      </p>
                      {v.skills && v.skills.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {v.skills.map((s, i) => <span key={i} className="text-[8px] font-mono bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded">{s}</span>)}
                        </div>
                      )}
                      {v.location && <p className="text-[9px] font-mono text-white/40 mt-0.5">📍 {v.location}</p>}
                      {v.assignedTask && <p className="text-[10px] font-mono text-emerald-300 mt-0.5">Tarea: {v.assignedTask} {v.assignedShift ? `· Turno: ${v.assignedShift}` : ''}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {(['Registrado', 'Asignado', 'En Campo', 'Descanso', 'Finalizado'] as const).map(s => (
                      <button key={s} onClick={() => updateVolunteer(v.id, { status: s })}
                        className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                          v.status === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40'
                        }`}>{s === 'En Campo' ? 'CAMPO' : s === 'Finalizado' ? 'FIN' : s.slice(0, 5)}</button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 text-white/30 font-mono text-sm">No hay voluntarios registrados.</div>}
          </div>
        </>
      )}

      {view === 'donations' && (
        <>
          {showForm && (
            <form onSubmit={submitDonation} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Registrar donación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Tipo de donante</label>
                  <select value={donForm.donorType} onChange={e => setDonForm({ ...donForm, donorType: e.target.value as Donation['donorType'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="Persona">Persona</option>
                    <option value="Empresa">Empresa</option>
                    <option value="ONG">ONG</option>
                    <option value="Gobierno">Gobierno</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Nombre del donante</label>
                  <input value={donForm.donorName} onChange={e => setDonForm({ ...donForm, donorName: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Tipo de donación</label>
                  <select value={donForm.donationType} onChange={e => setDonForm({ ...donForm, donationType: e.target.value as Donation['donationType'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Insumo">Insumo</option>
                    <option value="Servicio">Servicio</option>
                  </select>
                </div>
                {donForm.donationType === 'Efectivo' && (
                  <div>
                    <label className="text-[10px] font-mono text-white/50 uppercase">Monto ($)</label>
                    <input type="number" value={donForm.amount || ''} onChange={e => setDonForm({ ...donForm, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                  </div>
                )}
                {donForm.donationType === 'Insumo' && (
                  <>
                    <div>
                      <label className="text-[10px] font-mono text-white/50 uppercase">Descripción del insumo</label>
                      <input value={donForm.itemDescription} onChange={e => setDonForm({ ...donForm, itemDescription: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-white/50 uppercase">Cantidad</label>
                      <input type="number" value={donForm.quantity || ''} onChange={e => setDonForm({ ...donForm, quantity: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                    </div>
                  </>
                )}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase">Destino</label>
                  <input value={donForm.destination} onChange={e => setDonForm({ ...donForm, destination: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
                {submitting ? 'REGISTRANDO...' : 'REGISTRAR DONACIÓN'}
              </button>
            </form>
          )}

          <div className="grid gap-3">
            {donations.map(d => (
              <div key={d.id} className="bg-[#121212] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{d.donorName}</span>
                      <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/60">{d.donorType}</span>
                    </div>
                    <p className="text-[10px] font-mono text-white/50 mt-0.5">
                      {d.donationType}: {d.donationType === 'Efectivo' ? `$${d.amount}` : d.itemDescription || ''} {d.quantity ? `· Cant: ${d.quantity}` : ''}
                      {d.destination ? ` → ${d.destination}` : ''}
                    </p>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      d.status === 'Distribuido' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      d.status === 'Recibido' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}>{d.status}</span>
                  </div>
                </div>
              </div>
            ))}
            {donations.length === 0 && <div className="text-center py-12 text-white/30 font-mono text-sm">No hay donaciones registradas.</div>}
          </div>
        </>
      )}
    </div>
  );
}
