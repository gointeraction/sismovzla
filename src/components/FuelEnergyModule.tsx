import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FuelEnergyPoint } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Fuel, Plus, Download, MapPin, Battery, Zap, AlertTriangle, FileText } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

export default function FuelEnergyModule() {
  const [points, setPoints] = useState<FuelEnergyPoint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const { getPosition } = useGeolocation();

  const [form, setForm] = useState({
    name: '', type: 'Gasolinera' as FuelEnergyPoint['type'],
    state: 'Caracas', fuelType: '' as string,
    capacityLiters: 0, litersRemaining: 0,
    generatorPowerKW: 0, operationalStatus: 'Operativo' as FuelEnergyPoint['operationalStatus'],
    priorityAccess: '' as string,
  });

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'fuel_energy_points'), orderBy('createdAt', 'desc')), snap => {
      setPoints(snap.docs.map(d => ({ id: d.id, ...d.data() } as FuelEnergyPoint)));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pos = await getPosition();
      await addDoc(collection(db, 'fuel_energy_points'), {
        ...form, fuelType: form.fuelType || null, capacityLiters: form.capacityLiters || null,
        litersRemaining: form.litersRemaining || null, generatorPowerKW: form.generatorPowerKW || null,
        priorityAccess: form.priorityAccess || null, latitude: pos?.lat ?? 0, longitude: pos?.lng ?? 0,
        reportedBy: 'Anon', createdAt: Date.now(),
      });
      setShowForm(false);
      setForm({ name: '', type: 'Gasolinera', state: 'Caracas', fuelType: '', capacityLiters: 0, litersRemaining: 0, generatorPowerKW: 0, operationalStatus: 'Operativo', priorityAccess: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updatePoint = async (id: string, data: Partial<FuelEnergyPoint>) => {
    try { await updateDoc(doc(db, 'fuel_energy_points', id), data); } catch (err) { console.error(err); }
  };

  const filtered = points.filter(p => filterStatus === 'Todos' || p.operationalStatus === filterStatus);
  const operational = points.filter(p => p.operationalStatus === 'Operativo').length;
  const outOfService = points.filter(p => p.operationalStatus === 'Fuera de Servicio' || p.operationalStatus === 'Agotado').length;

  const exportCSV = () => {
    const headers = 'Nombre,Tipo,Estado,Combustible,Capacidad L,Restante L,Potencia kW,Estatus,Acceso';
    const rows = points.map(p =>
      `"${p.name}","${p.type}","${p.state}","${p.fuelType || '-'}",${p.capacityLiters || '-'},${p.litersRemaining || '-'},${p.generatorPowerKW || '-'},"${p.operationalStatus}","${p.priorityAccess || '-'}"`
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'combustible_energia.csv'; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(16);
    doc.text('SISMOVZLA - COMBUSTIBLE Y ENERGÍA', 14, 20);
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generado: ${today}`, 14, 28);
    autoTable(doc, {
      head: [['Nombre', 'Tipo', 'Estado', 'Combustible', 'Capacidad L', 'Restante L', 'Potencia kW', 'Estatus']],
      body: points.map(p => [
        p.name, p.type, p.state, p.fuelType || '-',
        p.capacityLiters != null ? String(p.capacityLiters) : '-',
        p.litersRemaining != null ? String(p.litersRemaining) : '-',
        p.generatorPowerKW != null ? String(p.generatorPowerKW) : '-',
        p.operationalStatus,
      ]),
      startY: 35,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8, font: 'helvetica' },
    });
    doc.save(`combustible_energia_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Fuel className="w-6 h-6 text-yellow-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">COMBUSTIBLE Y ENERGÍA</h2>
            <p className="text-xs text-white/50 mt-1">Gasolineras operativas, generadores, plantas eléctricas y paneles solares</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
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
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-yellow-400">{points.length}</p>
          <p className="text-[9px] font-mono text-yellow-400/70 uppercase">Total puntos</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-green-400">{operational}</p>
          <p className="text-[9px] font-mono text-green-400/70 uppercase">Operativos</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-red-400">{outOfService}</p>
          <p className="text-[9px] font-mono text-red-400/70 uppercase">Fuera/Agotados</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-blue-400">{points.filter(p => p.type === 'Generador').length}</p>
          <p className="text-[9px] font-mono text-blue-400/70 uppercase">Generadores</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['Todos', 'Operativo', 'Parcial', 'Fuera de Servicio', 'Agotado'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
              filterStatus === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/50'
            }`}>{s === 'Fuera de Servicio' ? 'FUERA' : s.slice(0, 5)}</button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Registrar punto de combustible/energía</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Nombre</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as FuelEnergyPoint['type'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Gasolinera">Gasolinera</option>
                <option value="Generador">Generador</option>
                <option value="Planta Eléctrica">Planta Eléctrica</option>
                <option value="Panel Solar">Panel Solar</option>
                <option value="Estación de Carga">Estación de Carga</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Estado</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Caracas">Caracas</option>
                <option value="La Guaira">La Guaira</option>
                <option value="Aragua">Aragua</option>
                <option value="Carabobo">Carabobo</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Estatus operativo</label>
              <select value={form.operationalStatus} onChange={e => setForm({ ...form, operationalStatus: e.target.value as FuelEnergyPoint['operationalStatus'] })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="Operativo">Operativo</option>
                <option value="Parcial">Parcial</option>
                <option value="Fuera de Servicio">Fuera de Servicio</option>
                <option value="Agotado">Agotado</option>
              </select>
            </div>
            {form.type === 'Gasolinera' && (
              <>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Tipo de combustible</label>
                  <select value={form.fuelType} onChange={e => setForm({ ...form, fuelType: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="">N/A</option>
                    <option value="Gasolina 95">Gasolina 95</option>
                    <option value="Gasolina 91">Gasolina 91</option>
                    <option value="Diesel">Diesel</option>
                    <option value="GLP">GLP</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Capacidad (litros)</label>
                  <input type="number" value={form.capacityLiters || ''} onChange={e => setForm({ ...form, capacityLiters: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Litros restantes</label>
                  <input type="number" value={form.litersRemaining || ''} onChange={e => setForm({ ...form, litersRemaining: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
              </>
            )}
            {form.type === 'Generador' || form.type === 'Planta Eléctrica' ? (
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase">Potencia (kW)</label>
                <input type="number" value={form.generatorPowerKW || ''} onChange={e => setForm({ ...form, generatorPowerKW: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
              </div>
            ) : null}
            <div>
              <label className="text-[10px] font-mono text-white/50 uppercase">Acceso prioritario</label>
              <select value={form.priorityAccess} onChange={e => setForm({ ...form, priorityAccess: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                <option value="">Público general</option>
                <option value="Emergencia">Solo emergencia</option>
                <option value="Restringido">Restringido</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
            {submitting ? 'REGISTRANDO...' : 'REGISTRAR PUNTO'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {filtered.map(p => (
          <div key={p.id} className="bg-[#121212] border border-white/10 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{p.type === 'Gasolinera' ? '⛽' : p.type === 'Generador' ? '🔋' : p.type === 'Panel Solar' ? '☀️' : p.type === 'Planta Eléctrica' ? '🏭' : '🔌'}</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-white">{p.name}</span>
                    <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/60">{p.type}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      p.operationalStatus === 'Operativo' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      p.operationalStatus === 'Parcial' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      p.operationalStatus === 'Fuera de Servicio' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>{p.operationalStatus}</span>
                  </div>
                  <p className="text-[10px] font-mono text-white/50 mt-0.5">
                    {p.state} {p.fuelType ? `· ${p.fuelType}` : ''}
                    {p.litersRemaining ? ` · ${p.litersRemaining}L disponibles` : ''}
                    {p.generatorPowerKW ? ` · ${p.generatorPowerKW} kW` : ''}
                  </p>
                  <div className="text-[9px] font-mono text-white/40 mt-0.5">
                    {p.priorityAccess && <span>Acceso: {p.priorityAccess}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {(['Operativo', 'Parcial', 'Fuera de Servicio', 'Agotado'] as const).map(s => (
                  <button key={s} onClick={() => updatePoint(p.id, { operationalStatus: s })}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                      p.operationalStatus === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40'
                    }`}>{s === 'Fuera de Servicio' ? 'FUERA' : s.slice(0, 5)}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-white/30 font-mono text-sm">No hay puntos de combustible o energía registrados.</div>}
      </div>
    </div>
  );
}
