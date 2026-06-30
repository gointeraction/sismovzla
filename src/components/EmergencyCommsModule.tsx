import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { EmergencyComm } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Radio, Plus, Download, MapPin, Wifi, Satellite, Battery, Power, FileText } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

const COMMS_TYPE_ICONS: Record<string, string> = {
  Radioaficionado: '📻', Repetidora: '📡', 'Frecuencia VHF': '📶',
  'Frecuencia UHF': '📶', HF: '🌐', Satélite: '🛰️',
  'Mesh WiFi': '📡', 'Punto de Mensajería': '📬',
};

export default function EmergencyCommsModule() {
  const [comms, setComms] = useState<EmergencyComm[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const { getPosition } = useGeolocation();

  const [form, setForm] = useState({
    type: 'Radioaficionado' as EmergencyComm['type'],
    callsign: '', frequency: 0, mode: '' as string, location: '',
    operatorName: '', operatorContact: '', coverage: '',
    status: 'Activo' as EmergencyComm['status'],
    powerSource: '' as string, batteryHours: 0, messageRelay: false, notes: '',
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'emergency_comms'), orderBy('createdAt', 'desc')), snap => {
      setComms(snap.docs.map(d => ({ id: d.id, ...d.data() } as EmergencyComm)));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pos = await getPosition();
      await addDoc(collection(db, 'emergency_comms'), {
        ...form, frequency: form.frequency || null, mode: form.mode || null,
        latitude: pos?.lat ?? null, longitude: pos?.lng ?? null,
        operatorName: form.operatorName || null, operatorContact: form.operatorContact || null,
        coverage: form.coverage || null, powerSource: form.powerSource || null,
        batteryHours: form.batteryHours || null, notes: form.notes || null,
        reportedBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ type: 'Radioaficionado', callsign: '', frequency: 0, mode: '', location: '', operatorName: '', operatorContact: '', coverage: '', status: 'Activo', powerSource: '', batteryHours: 0, messageRelay: false, notes: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateComm = async (id: string, data: Partial<EmergencyComm>) => {
    try { await updateDoc(doc(db, 'emergency_comms', id), data); } catch (err) { console.error(err); }
  };

  const filtered = comms.filter(c => filterStatus === 'Todos' || c.status === filterStatus);
  const activeRelays = comms.filter(c => c.messageRelay && c.status === 'Activo');

  const exportCSV = () => {
    const headers = 'Tipo,Callsign,Frecuencia,Modo,Ubicación,Operador,Contacto,Cobertura,Estatus,Power,Batería H,Relay';
    const rows = comms.map(c =>
      `"${c.type}","${c.callsign || '-'}","${c.frequency || '-'}","${c.mode || '-'}","${c.location || '-'}","${c.operatorName || '-'}","${c.operatorContact || '-'}","${c.coverage || '-'}","${c.status}","${c.powerSource || '-'}",${c.batteryHours || '-'},"${c.messageRelay ? 'Sí' : 'No'}"`
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'comunicaciones.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(16);
    doc.text('SISMOVZLA - COMUNICACIONES DE EMERGENCIA', 14, 20);
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generado: ${today}`, 14, 28);
    autoTable(doc, {
      head: [['Tipo', 'Callsign', 'Frecuencia', 'Modo', 'Ubicación', 'Operador', 'Estatus', 'Power']],
      body: comms.map(c => [
        c.type, c.callsign || '-', c.frequency ? String(c.frequency) : '-', c.mode || '-',
        c.location || '-', c.operatorName || '-', c.status, c.powerSource || '-',
      ]),
      startY: 35,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, font: 'helvetica' },
    });
    doc.save(`comunicaciones_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">COMUNICACIONES DE EMERGENCIA</h2>
            <p className="text-xs text-white/50 mt-1">Radioaficionados, repetidoras, frecuencias activas y mesh WiFi</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> REGISTRO RADIO
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
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-amber-400">{comms.length}</p>
          <p className="text-[9px] font-mono text-amber-400/70 uppercase">Total estaciones</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-green-400">{comms.filter(c => c.status === 'Activo').length}</p>
          <p className="text-[9px] font-mono text-green-400/70 uppercase">Activas</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-blue-400">{activeRelays.length}</p>
          <p className="text-[9px] font-mono text-blue-400/70 uppercase">Retransmisores</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-purple-400">{comms.filter(c => c.type === 'Radioaficionado').length}</p>
          <p className="text-[9px] font-mono text-purple-400/70 uppercase">Radioaficionados</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['Todos', 'Activo', 'Standby', 'Fuera de Servicio'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              filterStatus === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/50'
            }`}>{s === 'Fuera de Servicio' ? 'FUERA' : s}</button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Registrar estación de comunicaciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EmergencyComm['type'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                {Object.keys(COMMS_TYPE_ICONS).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Indicativo (callsign)</label>
              <input value={form.callsign} onChange={e => setForm({ ...form, callsign: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="YV4XXX" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Frecuencia (MHz)</label>
              <input type="number" step="0.001" value={form.frequency || ''} onChange={e => setForm({ ...form, frequency: parseFloat(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="146.520" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Modo</label>
              <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="">N/A</option>
                <option value="FM">FM</option>
                <option value="USB">USB</option>
                <option value="LSB">LSB</option>
                <option value="DMR">DMR</option>
                <option value="Packet">Packet</option>
                <option value="Winlink">Winlink</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Operador</label>
              <input value={form.operatorName} onChange={e => setForm({ ...form, operatorName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Contacto</label>
              <input value={form.operatorContact} onChange={e => setForm({ ...form, operatorContact: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Cobertura</label>
              <input value={form.coverage} onChange={e => setForm({ ...form, coverage: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Zona Metropolitana" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Fuente de poder</label>
              <select value={form.powerSource} onChange={e => setForm({ ...form, powerSource: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="">N/A</option>
                <option value="Red Eléctrica">Red Eléctrica</option>
                <option value="Panel Solar">Panel Solar</option>
                <option value="Generador">Generador</option>
                <option value="Batería">Batería</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Batería restante (horas)</label>
              <input type="number" value={form.batteryHours || ''} onChange={e => setForm({ ...form, batteryHours: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Ubicación</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={form.messageRelay} onChange={e => setForm({ ...form, messageRelay: e.target.checked })}
                className="w-4 h-4 accent-emerald-500" />
              <span className="text-xs font-mono text-white/80">Puede retransmitir mensajes</span>
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'REGISTRANDO...' : 'REGISTRAR ESTACIÓN'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-[#121212] border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{COMMS_TYPE_ICONS[c.type] || '📡'}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-white">
                      {c.callsign || c.type}
                    </span>
                    <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/60">{c.type}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      c.status === 'Activo' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      c.status === 'Standby' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>{c.status}</span>
                  </div>
                  <p className="text-[10px] font-mono text-white/50 mt-0.5">
                    {c.frequency ? `${c.frequency} MHz ${c.mode ? `· ${c.mode}` : ''} · ` : ''}
                    {c.operatorName ? `Op: ${c.operatorName} · ` : ''}
                    {c.location ? `📍 ${c.location}` : ''}
                  </p>
                  <div className="flex gap-2 mt-1 text-[9px] font-mono text-white/40">
                    {c.coverage && <span>📡 {c.coverage}</span>}
                    {c.powerSource && <span>⚡ {c.powerSource}{c.batteryHours ? ` (${c.batteryHours}h)` : ''}</span>}
                    {c.messageRelay && <span className="text-blue-300">🔄 Relay</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {(['Activo', 'Standby', 'Fuera de Servicio'] as const).map(s => (
                  <button key={s} onClick={() => updateComm(c.id, { status: s })}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                      c.status === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40'
                    }`}>{s === 'Fuera de Servicio' ? 'FUERA' : s === 'Standby' ? 'STBY' : s.slice(0, 4)}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/30 font-mono text-sm">No hay estaciones de comunicaciones registradas.</div>
        )}
      </div>
    </div>
  );
}
