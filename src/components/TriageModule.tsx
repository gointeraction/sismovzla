import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { TriagePatient, TriageTeam } from '../types';
import { HeartPulse, MapPin, Ambulance, Skull, Cross, ChevronRight, Download, Plus, UserCheck } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

const TRIAGE_CONFIG = {
  Rojo: { label: 'INMEDIATO', color: 'bg-red-600', text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10', iconBg: 'bg-red-600/20', pulse: true },
  Amarillo: { label: 'DEMORADO', color: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', iconBg: 'bg-yellow-500/20', pulse: false },
  Verde: { label: 'CAMINANDO', color: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10', iconBg: 'bg-green-500/20', pulse: false },
  Negro: { label: 'FALLECIDO', color: 'bg-gray-700', text: 'text-gray-400', border: 'border-gray-600/30', bg: 'bg-gray-700/10', iconBg: 'bg-gray-600/20', pulse: false },
};

export default function TriageModule() {
  const [patients, setPatients] = useState<TriagePatient[]>([]);
  const [teams, setTeams] = useState<TriageTeam[]>([]);
  const [filterCode, setFilterCode] = useState<string>('Todos');
  const [view, setView] = useState<'list' | 'stats'>('list');
  const [showForm, setShowForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [massMode, setMassMode] = useState(false);
  const [massCount, setMassCount] = useState(1);
  const { getPosition } = useGeolocation();

  const [formData, setFormData] = useState({
    triageCode: 'Verde' as TriagePatient['triageCode'],
    fullName: '',
    age: 0,
    isPediatric: false,
    gender: '' as 'M' | 'F' | 'D' | '',
    conscious: true,
    breathing: true,
    respiratoryRate: 0,
    capillaryRefill: 0,
    pulse: true,
    ambulatory: true,
    mechanism: '' as string,
    notes: '',
  });

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'triage_patients'), orderBy('createdAt', 'desc')), snap => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as TriagePatient)));
    });
    const unsub2 = onSnapshot(collection(db, 'triage_teams'), snap => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as TriageTeam)));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const getTriageCode = (): TriagePatient['triageCode'] => {
    if (!formData.breathing) return 'Negro';
    const { respiratoryRate, capillaryRefill, pulse, conscious, ambulatory } = formData;
    if (!ambulatory) {
      if (respiratoryRate > 30 || (respiratoryRate > 0 && respiratoryRate < 10)) return 'Rojo';
      if (capillaryRefill > 2 || !pulse) return 'Rojo';
      if (!conscious) return 'Rojo';
      return 'Amarillo';
    }
    return 'Verde';
  };

  const assignTriageFromVitals = () => {
    const code = getTriageCode();
    setFormData(prev => ({ ...prev, triageCode: code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pos = await getPosition();

      const count = massMode ? massCount : 1;
      for (let i = 0; i < count; i++) {
        await addDoc(collection(db, 'triage_patients'), {
          triageCode: formData.triageCode,
          fullName: massMode ? `Víctima ${i + 1}` : (formData.fullName || null),
          age: formData.age || null,
          isPediatric: formData.isPediatric,
          gender: formData.gender || null,
          locationLat: pos?.lat ?? 0,
          locationLng: pos?.lng ?? 0,
          conscious: formData.conscious,
          breathing: formData.breathing,
          respiratoryRate: formData.respiratoryRate || null,
          capillaryRefill: formData.capillaryRefill || null,
          pulse: formData.pulse,
          ambulatory: formData.ambulatory,
          mechanism: formData.mechanism || null,
          notes: massMode ? `Registro masivo #${i + 1}` : (formData.notes || null),
          reportedBy: auth.currentUser?.email || auth.currentUser?.uid || 'Anon',
          createdAt: Date.now() + i,
          updatedAt: Date.now() + i,
        });
      }
      setShowForm(false);
      setMassMode(false);
      setMassCount(1);
      setFormData({ triageCode: 'Verde', fullName: '', age: 0, isPediatric: false, gender: '', conscious: true, breathing: true, respiratoryRate: 0, capillaryRefill: 0, pulse: true, ambulatory: true, mechanism: '', notes: '' });
    } catch (err) {
      console.error('Error registering triage:', err);
    }
    setSubmitting(false);
  };

  const userRole = localStorage.getItem('sismovzla_volunteer_role') || '';
  const canDelete = userRole === 'admin' || userRole === 'operator';

  const deleteRecord = async (collectionName: string, id: string) => {
    if (window.confirm('¿Eliminar este registro?')) {
      try { await deleteDoc(doc(db, collectionName, id)); } catch (err) { console.error(err); }
    }
  };

  const updatePatient = async (id: string, data: Partial<TriagePatient>) => {
    try { await updateDoc(doc(db, 'triage_patients', id), { ...data, updatedAt: Date.now() }); }
    catch (err) { console.error('Error updating triage:', err); }
  };

  const filtered = patients.filter(p => filterCode === 'Todos' || p.triageCode === filterCode);
  const counts = { Rojo: patients.filter(p => p.triageCode === 'Rojo').length, Amarillo: patients.filter(p => p.triageCode === 'Amarillo').length, Verde: patients.filter(p => p.triageCode === 'Verde').length, Negro: patients.filter(p => p.triageCode === 'Negro').length };

  const exportCSV = () => {
    const headers = 'Código,Paciente,Edad,Género,Mecanismo,Consciente,Respira,Ambulatorio,Lat,Lng,Creado';
    const rows = filtered.map(p =>
      `"${p.triageCode}","${p.fullName || '-'}","${p.age || '-'}","${p.gender || '-'}","${p.mechanism || '-'}","${p.conscious}","${p.breathing}","${p.ambulatory}",${p.locationLat},${p.locationLng},"${new Date(p.createdAt).toISOString()}"`
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'triaje_victimas.csv'; a.click();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HeartPulse className="w-6 h-6 text-red-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">TRIAGE DE VÍCTIMAS (START)</h2>
            <p className="text-xs text-white/50 mt-1">Clasificación rápida de víctimas masivas · Protocolo START/JumpSTART</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowForm(true); setMassMode(false); }} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> REGISTRAR VÍCTIMA
          </button>
          <button onClick={() => { setShowForm(true); setMassMode(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <UserCheck className="w-4 h-4" /> REGISTRO MASIVO
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(['Rojo', 'Amarillo', 'Verde', 'Negro'] as const).map(code => {
          const c = TRIAGE_CONFIG[code];
          return (
            <div key={code} className={`${c.bg} border ${c.border} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-mono font-bold ${c.text} ${c.pulse ? 'animate-pulse' : ''}`}>{counts[code]}</p>
              <p className={`text-[9px] font-mono ${c.text} uppercase mt-1`}>{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        {['Todos', 'Rojo', 'Amarillo', 'Verde', 'Negro'].map(code => (
          <button key={code} onClick={() => setFilterCode(code)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              filterCode === code ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/10'
            }`}>
            {code === 'Todos' ? 'TODOS' : code.toUpperCase()}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
            {massMode ? `REGISTRO MASIVO — ${massCount} VÍCTIMAS` : 'REGISTRO INDIVIDUAL DE TRIAGE'}
          </h3>

          {massMode && (
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Cantidad de víctimas en esta ubicación</label>
              <input type="number" min={1} max={100} value={massCount} onChange={e => setMassCount(parseInt(e.target.value) || 1)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
          )}

          {!massMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase">Nombre (si conocido)</label>
                <input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Anónimo si no identificado" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Edad</label>
                  <input type="number" value={formData.age || ''} onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0, isPediatric: parseInt(e.target.value) < 8 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Sexo</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' | 'D' | '' })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="">No especificado</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase">Mecanismo de lesión</label>
                <select value={formData.mechanism} onChange={e => setFormData({ ...formData, mechanism: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                  <option value="">No especificado</option>
                  <option value="Colapso">Colapso estructural</option>
                  <option value="Atrapamiento">Atrapamiento</option>
                  <option value="Caída">Caída</option>
                  <option value="Quemadura">Quemadura</option>
                  <option value="Crisis">Crisis médica</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          )}

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <p className="text-[10px] font-mono text-white/50 uppercase mb-3">Signos vitales START</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.conscious} onChange={e => setFormData({ ...formData, conscious: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500" />
                <span className="text-xs font-mono text-white/80">Consciente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.breathing} onChange={e => setFormData({ ...formData, breathing: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500" />
                <span className="text-xs font-mono text-white/80">Respira</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.pulse} onChange={e => setFormData({ ...formData, pulse: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500" />
                <span className="text-xs font-mono text-white/80">Pulso presente</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.ambulatory} onChange={e => setFormData({ ...formData, ambulatory: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500" />
                <span className="text-xs font-mono text-white/80">Camina por sí mismo</span>
              </label>
              <div>
                <label className="text-[9px] font-mono text-white/50 uppercase">Resp/min</label>
                <input type="number" value={formData.respiratoryRate || ''} onChange={e => setFormData({ ...formData, respiratoryRate: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono mt-0.5" />
              </div>
              <div>
                <label className="text-[9px] font-mono text-white/50 uppercase">Llenado capilar (seg)</label>
                <input type="number" value={formData.capillaryRefill || ''} onChange={e => setFormData({ ...formData, capillaryRefill: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono mt-0.5" />
              </div>
            </div>
            <button type="button" onClick={assignTriageFromVitals}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
              ASIGNAR CÓDIGO START AUTOMÁTICAMENTE
            </button>
          </div>

          <div>
            <label className="text-[10px] font-mono text-white/50 uppercase">Código de triaje asignado</label>
            <div className="flex gap-2 mt-1">
              {(['Rojo', 'Amarillo', 'Verde', 'Negro'] as const).map(code => (
                <button key={code} type="button" onClick={() => setFormData({ ...formData, triageCode: code })}
                  className={`flex-1 py-3 rounded-lg font-mono font-bold text-xs uppercase transition-all cursor-pointer border ${
                    formData.triageCode === code
                      ? `${TRIAGE_CONFIG[code].color} text-white border-transparent`
                      : 'bg-black/20 border-white/10 text-white/50 hover:bg-white/10'
                  }`}>
                  {TRIAGE_CONFIG[code].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-white/50 uppercase">Notas</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" rows={2} />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'REGISTRANDO...' : massMode ? `REGISTRAR ${massCount} VÍCTIMAS COMO ${TRIAGE_CONFIG[formData.triageCode].label}` : 'REGISTRAR VÍCTIMA'}
          </button>
        </form>
      )}

      <div className="grid gap-2">
        {filtered.map(p => (
          <div key={p.id} className={`${TRIAGE_CONFIG[p.triageCode].bg} border ${TRIAGE_CONFIG[p.triageCode].border} rounded-xl p-4 flex items-start justify-between gap-3`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full ${TRIAGE_CONFIG[p.triageCode].color} flex items-center justify-center text-white font-mono font-bold text-lg ${TRIAGE_CONFIG[p.triageCode].pulse ? 'animate-pulse' : ''}`}>
                {p.triageCode === 'Negro' ? <Skull className="w-5 h-5" /> : p.triageCode[0]}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-mono font-bold text-sm ${TRIAGE_CONFIG[p.triageCode].text}`}>{TRIAGE_CONFIG[p.triageCode].label}</span>
                  {p.fullName && <span className="font-mono text-xs text-white/80">{p.fullName}</span>}
                  {p.age && <span className="text-[10px] font-mono text-white/50">{p.age} años{p.isPediatric ? ' (Ped)' : ''}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-1 text-[10px] font-mono text-white/50">
                  <span>Mecanismo: {p.mechanism || 'N/E'}</span>
                  {p.destination && <span className="text-blue-300">→ {p.destination}</span>}
                  <span>{new Date(p.createdAt).toLocaleString('es-VE')}</span>
                </div>
                {p.notes && <p className="text-[10px] font-mono text-white/40 mt-1">{p.notes}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              {(['Rojo', 'Amarillo', 'Verde'] as const).map(code => (
                <button key={code} onClick={() => updatePatient(p.id, { triageCode: code })}
                  className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                    p.triageCode === code ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40 hover:bg-white/10'
                  }`}>
                  {TRIAGE_CONFIG[code].label.slice(0, 4)}
                </button>
              ))}
              <button onClick={() => updatePatient(p.id, { triageCode: 'Negro' })}
                className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border border-gray-600/30 bg-black/20 text-gray-500 hover:bg-gray-600/30 cursor-pointer">
                FALL
              </button>
              {canDelete && (
                <button onClick={() => deleteRecord('triage_patients', p.id)}
                  className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-[9px] font-mono font-bold border border-red-500/30 cursor-pointer hover:bg-red-600/40"
                  title="Eliminar">
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30 font-mono text-sm">No hay víctimas registradas. Usa el botón "REGISTRAR VÍCTIMA" para iniciar el triaje.</div>
        )}
      </div>
    </div>
  );
}
