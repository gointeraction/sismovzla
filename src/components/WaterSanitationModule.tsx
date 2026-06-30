import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { WaterPoint, SanitationPoint } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Droplets, Plus, Download, MapPin, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

const WATER_STATUS_COLORS: Record<string, string> = {
  Potable: 'bg-green-500/20 text-green-400 border-green-500/30',
  'No Potable': 'bg-red-500/20 text-red-400 border-red-500/30',
  'En Prueba': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Agotado: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export default function WaterSanitationModule() {
  const [waterPoints, setWaterPoints] = useState<WaterPoint[]>([]);
  const [sanPoints, setSanPoints] = useState<SanitationPoint[]>([]);
  const [view, setView] = useState<'water' | 'sanitation'>('water');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterWater, setFilterWater] = useState<string>('Todos');
  const { getPosition } = useGeolocation();

  const [waterForm, setWaterForm] = useState({
    name: '', type: 'Punto de Agua' as WaterPoint['type'],
    waterStatus: 'En Prueba' as WaterPoint['waterStatus'],
    capacityLiters: 0, chlorineLevel: 0, populationServed: 0, openHours: '', notes: '',
  });

  const [sanForm, setSanForm] = useState({
    name: '', type: 'Letrina' as SanitationPoint['type'],
    capacity: 1, gender: 'Mixto' as SanitationPoint['gender'],
  });

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'water_points'), orderBy('createdAt', 'desc')), snap =>
      setWaterPoints(snap.docs.map(d => ({ id: d.id, ...d.data() } as WaterPoint))));
    const unsub2 = onSnapshot(collection(db, 'sanitation_points'), snap =>
      setSanPoints(snap.docs.map(d => ({ id: d.id, ...d.data() } as SanitationPoint))));
    return () => { unsub1(); unsub2(); };
  }, []);

  const submitWater = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pos = await getPosition();
      await addDoc(collection(db, 'water_points'), {
        ...waterForm, latitude: pos?.lat ?? 0, longitude: pos?.lng ?? 0, capacityLiters: waterForm.capacityLiters || null,
        chlorineLevel: waterForm.chlorineLevel || null, populationServed: waterForm.populationServed || null,
        openHours: waterForm.openHours || null, notes: waterForm.notes || null,
        reportedBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setWaterForm({ name: '', type: 'Punto de Agua', waterStatus: 'En Prueba', capacityLiters: 0, chlorineLevel: 0, populationServed: 0, openHours: '', notes: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const submitSan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pos = await getPosition();
      await addDoc(collection(db, 'sanitation_points'), {
        ...sanForm, latitude: pos?.lat ?? 0, longitude: pos?.lng ?? 0, reportedBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setSanForm({ name: '', type: 'Letrina', capacity: 1, gender: 'Mixto' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateWater = async (id: string, data: Partial<WaterPoint>) => {
    try { await updateDoc(doc(db, 'water_points', id), data); } catch (err) { console.error(err); }
  };

  const filtered = waterPoints.filter(p => filterWater === 'Todos' || p.waterStatus === filterWater);
  const potable = waterPoints.filter(p => p.waterStatus === 'Potable').length;
  const noPotable = waterPoints.filter(p => p.waterStatus === 'No Potable').length;

  const exportCSV = () => {
    const wHeaders = 'Nombre,Tipo,Estado,Capacidad L,Cloro ppm,Población,Horario,Notas';
    const wRows = waterPoints.map(p =>
      `"${p.name}","${p.type}","${p.waterStatus}","${p.capacityLiters || '-'}","${p.chlorineLevel || '-'}","${p.populationServed || '-'}","${p.openHours || '-'}","${p.notes || '-'}"`
    ).join('\n');
    const sHeaders = 'Nombre,Tipo,Capacidad,Género';
    const sRows = sanPoints.map(p =>
      `"${p.name}","${p.type}",${p.capacity},"${p.gender}"`
    ).join('\n');
    const blob = new Blob([`AGUA\n${wHeaders}\n${wRows}\n\nSANEAMIENTO\n${sHeaders}\n${sRows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'agua_saneamiento.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(16);
    doc.text('SISMOVZLA - AGUA POTABLE Y SANEAMIENTO', 14, 20);
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generado: ${today}`, 14, 28);
    autoTable(doc, {
      head: [['Nombre', 'Tipo', 'Estado', 'Capacidad L', 'Cloro ppm', 'Población']],
      body: waterPoints.map(p => [p.name, p.type, p.waterStatus, p.capacityLiters || '-', p.chlorineLevel || '-', p.populationServed || '-']),
      startY: 35,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, font: 'helvetica' },
    });
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('SANEAMIENTO', 14, finalY);
    autoTable(doc, {
      head: [['Nombre', 'Tipo', 'Capacidad', 'Género']],
      body: sanPoints.map(p => [p.name, p.type, String(p.capacity), p.gender]),
      startY: finalY + 5,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, font: 'helvetica' },
    });
    doc.save(`agua_saneamiento_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Droplets className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">AGUA POTABLE Y SANEAMIENTO</h2>
            <p className="text-xs text-white/50 mt-1">Puntos de agua, cisternas, potabilización y baños portátiles</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> NUEVO PUNTO
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
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-blue-400">{waterPoints.length}</p>
          <p className="text-[9px] font-mono text-blue-400/70 uppercase">Total puntos</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-green-400">{potable}</p>
          <p className="text-[9px] font-mono text-green-400/70 uppercase">Potable</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-red-400">{noPotable}</p>
          <p className="text-[9px] font-mono text-red-400/70 uppercase">No potable</p>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-gray-400">{sanPoints.length}</p>
          <p className="text-[9px] font-mono text-gray-400/70 uppercase">Baños/letrinas</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setView('water')}
          className={`px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${
            view === 'water' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-black/20 border-white/10 text-white/50'
          }`}>
          AGUA
        </button>
        <button onClick={() => setView('sanitation')}
          className={`px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${
            view === 'sanitation' ? 'bg-gray-600 border-gray-400 text-white' : 'bg-black/20 border-white/10 text-white/50'
          }`}>
          SANEAMIENTO ({sanPoints.length})
        </button>
      </div>

      {view === 'water' && (
        <>
          {showForm && (
            <form onSubmit={submitWater} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Registrar punto de agua</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Nombre</label>
                  <input value={waterForm.name} onChange={e => setWaterForm({ ...waterForm, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Tipo</label>
                  <select value={waterForm.type} onChange={e => setWaterForm({ ...waterForm, type: e.target.value as WaterPoint['type'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="Punto de Agua">Punto de Agua</option>
                    <option value="Planta Potabilizadora">Planta Potabilizadora</option>
                    <option value="Cisterna Móvil">Cisterna Móvil</option>
                    <option value="Pila Pública">Pila Pública</option>
                    <option value="Manantial">Manantial</option>
                    <option value="Pozo">Pozo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Estado del agua</label>
                  <select value={waterForm.waterStatus} onChange={e => setWaterForm({ ...waterForm, waterStatus: e.target.value as WaterPoint['waterStatus'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="Potable">Potable</option>
                    <option value="No Potable">No Potable</option>
                    <option value="En Prueba">En Prueba</option>
                    <option value="Agotado">Agotado</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Capacidad (litros)</label>
                  <input type="number" value={waterForm.capacityLiters || ''} onChange={e => setWaterForm({ ...waterForm, capacityLiters: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Cloro (ppm)</label>
                  <input type="number" step="0.1" value={waterForm.chlorineLevel || ''} onChange={e => setWaterForm({ ...waterForm, chlorineLevel: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Población servida</label>
                  <input type="number" value={waterForm.populationServed || ''} onChange={e => setWaterForm({ ...waterForm, populationServed: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase">Notas</label>
                  <textarea value={waterForm.notes} onChange={e => setWaterForm({ ...waterForm, notes: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" rows={2} />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
                {submitting ? 'REGISTRANDO...' : 'REGISTRAR PUNTO DE AGUA'}
              </button>
            </form>
          )}

          <div className="flex gap-2 flex-wrap">
            {['Todos', 'Potable', 'No Potable', 'En Prueba', 'Agotado'].map(s => (
              <button key={s} onClick={() => setFilterWater(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                  filterWater === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/50'
                }`}>{s === 'Todos' ? 'TODOS' : s}</button>
            ))}
          </div>

          <div className="grid gap-3">
            {filtered.map(p => (
              <div key={p.id} className={`${WATER_STATUS_COLORS[p.waterStatus]} border rounded-xl p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{p.type === 'Cisterna Móvil' ? '🚚' : p.type === 'Planta Potabilizadora' ? '🏭' : '💧'}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{p.name}</span>
                      <span className="text-[9px] font-mono bg-black/20 px-2 py-0.5 rounded">{p.type}</span>
                    </div>
                    <p className="text-[10px] font-mono text-white/60 mt-0.5">
                      {p.waterStatus === 'Potable' && <CheckCircle className="w-3 h-3 inline text-green-400 mr-1" />}
                      {p.waterStatus === 'No Potable' && <AlertTriangle className="w-3 h-3 inline text-red-400 mr-1" />}
                      Estado: {p.waterStatus}
                      {p.capacityLiters ? ` · ${p.capacityLiters}L` : ''}
                      {p.populationServed ? ` · ${p.populationServed} pers.` : ''}
                    </p>
                    {p.chlorineLevel ? <p className="text-[9px] font-mono text-white/40">Cloro: {p.chlorineLevel} ppm</p> : null}
                  </div>
                </div>
                <div className="flex gap-1">
                  {(['Potable', 'No Potable', 'En Prueba', 'Agotado'] as const).map(s => (
                    <button key={s} onClick={() => updateWater(p.id, { waterStatus: s })}
                      className={`px-2 py-1 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                        p.waterStatus === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40'
                      }                      `}>{s === 'No Potable' ? 'NO POT' : s === 'En Prueba' ? 'PRUE' : s.slice(0, 4)}</button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 text-white/30 font-mono text-sm">No hay puntos de agua registrados.</div>}
          </div>
        </>
      )}

      {view === 'sanitation' && (
        <>
          {showForm && (
            <form onSubmit={submitSan} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Registrar punto de saneamiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Nombre</label>
                  <input value={sanForm.name} onChange={e => setSanForm({ ...sanForm, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Tipo</label>
                  <select value={sanForm.type} onChange={e => setSanForm({ ...sanForm, type: e.target.value as SanitationPoint['type'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="Letrina">Letrina</option>
                    <option value="BañoPortátil">Baño Portátil</option>
                    <option value="Ducha">Ducha</option>
                    <option value="Lavamanos">Lavamanos</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Capacidad (personas)</label>
                  <input type="number" value={sanForm.capacity} onChange={e => setSanForm({ ...sanForm, capacity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Género</label>
                  <select value={sanForm.gender} onChange={e => setSanForm({ ...sanForm, gender: e.target.value as SanitationPoint['gender'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="Mixto">Mixto</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
                {submitting ? 'REGISTRANDO...' : 'REGISTRAR PUNTO'}
              </button>
            </form>
          )}

          <div className="grid gap-3">
            {sanPoints.map(p => (
              <div key={p.id} className="bg-[#121212] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.type === 'Ducha' ? '🚿' : p.type === 'Lavamanos' ? '🚰' : '🚻'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{p.name}</span>
                      <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/60">{p.type}</span>
                    </div>
                    <p className="text-[10px] font-mono text-white/50 mt-0.5">
                      Capacidad: {p.capacity} · {p.gender} · {p.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {sanPoints.length === 0 && <div className="text-center py-12 text-white/30 font-mono text-sm">No hay puntos de saneamiento registrados.</div>}
          </div>
        </>
      )}
    </div>
  );
}
