import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AerialOperation } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plane, Plus, Download, Map, AlertTriangle, Camera, Crosshair, FileText } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

export default function AerialOpsModule() {
  const [ops, setOps] = useState<AerialOperation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const { getPosition } = useGeolocation();

  const [form, setForm] = useState({
    aircraftType: 'Dron' as AerialOperation['aircraftType'],
    registration: '', operatorName: '',
    missionType: 'Reconocimiento' as AerialOperation['missionType'],
    assignedZone: '', launchPoint: '',
    estimatedFlightTime: 0, noFlyZone: false, noFlyReason: '',
    damageAssessment: '',
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'aerial_operations'), orderBy('createdAt', 'desc')), snap => {
      setOps(snap.docs.map(d => ({ id: d.id, ...d.data() } as AerialOperation)));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pos = await getPosition();
      await addDoc(collection(db, 'aerial_operations'), {
        ...form, registration: form.registration || null, operatorName: form.operatorName || null,
        assignedZone: form.assignedZone || null, launchPoint: form.launchPoint || null,
        launchLat: pos?.lat ?? null, launchLng: pos?.lng ?? null,
        estimatedFlightTime: form.estimatedFlightTime || null,
        noFlyReason: form.noFlyReason || null, damageAssessment: form.damageAssessment || null,
        status: 'Planificado', batteryFuelRemaining: 100, reportedBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ aircraftType: 'Dron', registration: '', operatorName: '', missionType: 'Reconocimiento', assignedZone: '', launchPoint: '', estimatedFlightTime: 0, noFlyZone: false, noFlyReason: '', damageAssessment: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateOp = async (id: string, data: Partial<AerialOperation>) => {
    try { await updateDoc(doc(db, 'aerial_operations', id), data); } catch (err) { console.error(err); }
  };

  const filtered = ops.filter(o => filterStatus === 'Todos' || o.status === filterStatus);
  const inFlight = ops.filter(o => o.status === 'En Vuelo');

  const exportCSV = () => {
    const headers = 'Aeronave,Matrícula,Misión,Operador,Zona,Lanzamiento,Tiempo min,Estatus,NoFly,Batería %,Evaluación';
    const rows = ops.map(o =>
      `"${o.aircraftType}","${o.registration || '-'}","${o.missionType}","${o.operatorName || '-'}","${o.assignedZone || '-'}","${o.launchPoint || '-'}",${o.estimatedFlightTime || '-'},"${o.status}","${o.noFlyZone ? 'Sí' : 'No'}",${o.batteryFuelRemaining ?? '-'},"${o.damageAssessment || '-'}"`
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'operaciones_aereas.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(16);
    doc.text('SISMOVZLA - OPERACIONES AÉREAS Y DRONES', 14, 20);
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generado: ${today}`, 14, 28);
    autoTable(doc, {
      head: [['Aeronave', 'Matrícula', 'Misión', 'Operador', 'Zona', 'Estatus', 'Batería %']],
      body: ops.map(o => [
        o.aircraftType, o.registration || '-', o.missionType, o.operatorName || '-',
        o.assignedZone || '-', o.status, o.batteryFuelRemaining != null ? `${o.batteryFuelRemaining}%` : '-',
      ]),
      startY: 35,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, font: 'helvetica' },
    });
    doc.save(`operaciones_aereas_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {inFlight.length > 0 && (
        <div className="bg-green-600/20 border border-green-500/40 rounded-xl p-4 flex items-center gap-3">
          <Plane className="w-6 h-6 text-green-400 animate-pulse" />
          <div><p className="font-mono font-bold text-green-400 text-sm uppercase">{inFlight.length} misión(es) en vuelo activo</p></div>
        </div>
      )}

      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Plane className="w-6 h-6 text-sky-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">OPERACIONES AÉREAS Y DRONES</h2>
            <p className="text-xs text-white/50 mt-1">Misiones de reconocimiento, evaluación de daños y entrega de suministros</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> NUEVA MISIÓN
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
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-sky-400">{ops.length}</p>
          <p className="text-[9px] font-mono text-sky-400/70 uppercase">Misiones</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-green-400">{inFlight.length}</p>
          <p className="text-[9px] font-mono text-green-400/70 uppercase">En vuelo</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-blue-400">{ops.filter(o => o.status === 'Planificado').length}</p>
          <p className="text-[9px] font-mono text-blue-400/70 uppercase">Planificadas</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-amber-400">{ops.filter(o => o.noFlyZone).length}</p>
          <p className="text-[9px] font-mono text-amber-400/70 uppercase">No-fly zones</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['Todos', 'Planificado', 'En Vuelo', 'Completado', 'En Tierra'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              filterStatus === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/50'
            }`}>{s}</button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Planificar nueva misión</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Tipo de aeronave</label>
              <select value={form.aircraftType} onChange={e => setForm({ ...form, aircraftType: e.target.value as AerialOperation['aircraftType'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Dron">Dron</option>
                <option value="Helicóptero">Helicóptero</option>
                <option value="Avión Ligero">Avión Ligero</option>
                <option value="Comercial">Comercial</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Matrícula</label>
              <input value={form.registration} onChange={e => setForm({ ...form, registration: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="YVXXXX" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Tipo de misión</label>
              <select value={form.missionType} onChange={e => setForm({ ...form, missionType: e.target.value as AerialOperation['missionType'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Reconocimiento">Reconocimiento</option>
                <option value="Evaluación de Daños">Evaluación de Daños</option>
                <option value="Búsqueda">Búsqueda</option>
                <option value="Entrega de Suministros">Entrega de Suministros</option>
                <option value="Evacuación Aeromédica">Evacuación Aeromédica</option>
                <option value="Mapeo Térmico">Mapeo Térmico</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Operador</label>
              <input value={form.operatorName} onChange={e => setForm({ ...form, operatorName: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Zona asignada</label>
              <input value={form.assignedZone} onChange={e => setForm({ ...form, assignedZone: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Punto de lanzamiento</label>
              <input value={form.launchPoint} onChange={e => setForm({ ...form, launchPoint: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Tiempo estimado (min)</label>
              <input type="number" value={form.estimatedFlightTime || ''} onChange={e => setForm({ ...form, estimatedFlightTime: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={form.noFlyZone} onChange={e => setForm({ ...form, noFlyZone: e.target.checked })}
                className="w-4 h-4 accent-red-500" />
              <span className="text-xs font-mono text-white/80">Zona de exclusión aérea (No-fly zone)</span>
            </div>
            {form.noFlyZone && (
              <div className="md:col-span-2">
                <label className="text-[10px] font-mono text-white/50 uppercase">Razón de no-fly zone</label>
                <input value={form.noFlyReason} onChange={e => setForm({ ...form, noFlyReason: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-white/50 uppercase">Evaluación de daños (resultados)</label>
              <textarea value={form.damageAssessment} onChange={e => setForm({ ...form, damageAssessment: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" rows={2} />
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'PLANIFICANDO...' : 'PLANIFICAR MISIÓN'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {filtered.map(o => (
          <div key={o.id} className="bg-[#121212] border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{o.aircraftType === 'Dron' ? '🛸' : '🚁'}</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-white">{o.missionType}</span>
                    <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/60">{o.aircraftType}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      o.status === 'En Vuelo' ? 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse' :
                      o.status === 'Planificado' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      o.status === 'Completado' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}>{o.status}</span>
                  </div>
                  <p className="text-[10px] font-mono text-white/50 mt-0.5">
                    {o.registration ? `${o.registration} · ` : ''}
                    {o.operatorName ? `Op: ${o.operatorName} · ` : ''}
                    {o.assignedZone ? `Zona: ${o.assignedZone}` : ''}
                  </p>
                  <p className="text-[9px] font-mono text-white/40">
                    {o.launchPoint ? `🛫 ${o.launchPoint}` : ''}
                    {o.estimatedFlightTime ? ` · ⏱ ${o.estimatedFlightTime}min` : ''}
                    {o.batteryFuelRemaining !== undefined ? ` · ⚡ ${o.batteryFuelRemaining}%` : ''}
                  </p>
                  {o.noFlyZone && <p className="text-[9px] font-mono text-red-400 mt-0.5">🚫 No-fly zone: {o.noFlyReason || 'No especificada'}</p>}
                  {o.damageAssessment && <p className="text-[10px] font-mono text-white/60 mt-0.5">📋 {o.damageAssessment}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {(['Planificado', 'En Vuelo', 'Completado', 'En Tierra'] as const).map(s => (
                  <button key={s} onClick={() => updateOp(o.id, { status: s })}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                      o.status === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40'
                    }`}>{s === 'Planificado' ? 'PLAN' : s === 'Completado' ? 'COMP' : s.slice(0, 5)}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-white/30 font-mono text-sm">No hay operaciones aéreas planificadas.</div>}
      </div>
    </div>
  );
}
