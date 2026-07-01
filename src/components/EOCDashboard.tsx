import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Incident, EvacuationRoute, TriagePatient, CascadeEvent, SearchSector, Shelter } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LayoutDashboard, Activity, AlertTriangle, Users, Building, Route, HeartPulse, Flame, Download, Map, RefreshCw } from 'lucide-react';

export default function EOCDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
  const [triagePatients, setTriagePatients] = useState<TriagePatient[]>([]);
  const [cascadeEvents, setCascadeEvents] = useState<CascadeEvent[]>([]);
  const [sectors, setSectors] = useState<SearchSector[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [quakeTime] = useState(Date.now());

  useEffect(() => {
    const clock = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-VE', { hour12: true }));
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(150)), snap =>
      setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Incident))));
    const unsub2 = onSnapshot(collection(db, 'evacuation_routes'), snap =>
      setRoutes(snap.docs.map(d => ({ id: d.id, ...d.data() } as EvacuationRoute))));
    const unsub3 = onSnapshot(query(collection(db, 'triage_patients'), orderBy('createdAt', 'desc'), limit(200)), snap =>
      setTriagePatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as TriagePatient))));
    const unsub4 = onSnapshot(query(collection(db, 'cascade_events'), orderBy('createdAt', 'desc')), snap =>
      setCascadeEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CascadeEvent))));
    const unsub5 = onSnapshot(collection(db, 'search_sectors'), snap =>
      setSectors(snap.docs.map(d => ({ id: d.id, ...d.data() } as SearchSector))));
    const unsub6 = onSnapshot(collection(db, 'shelters'), snap =>
      setShelters(snap.docs.map(d => ({ id: d.id, ...d.data() } as Shelter))));
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); };
  }, []);

  const elapsed = Math.floor((Date.now() - quakeTime) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  const activeIncidents = incidents.filter(i => !i.resolved).length;
  const verifiedIncidents = incidents.filter(i => i.verified && !i.resolved).length;
  const blockedRoutes = routes.filter(r => r.status === 'Bloqueada').length;
  const clearRoutes = routes.filter(r => r.status === 'Despejada').length;
  const triageRed = triagePatients.filter(p => p.triageCode === 'Rojo').length;
  const triageTotal = triagePatients.length;
  const activeCascade = cascadeEvents.filter(e => e.status === 'Activo').length;
  const criticalCascade = cascadeEvents.filter(e => e.severity === 'Crítico' && e.status === 'Activo').length;
  const sheltersOperational = shelters.filter(s => s.capacityStatus === 'Verde').length;
  const sheltersFull = shelters.filter(s => s.capacityStatus === 'Rojo').length;
  const totalRescued = sectors.reduce((a, s) => a + (s.victimsRescued || 0), 0);
  const totalDeceased = sectors.reduce((a, s) => a + (s.victimsDeceased || 0), 0);
  const sectorsComplete = sectors.filter(s => s.status === 'Completado' || s.status === 'Verificado').length;
  const sectorsTotal = sectors.length;

  const acknowledgeIncident = async (id: string) => {
    try { await updateDoc(doc(db, 'incidents', id), { verified: true, updatedAt: Date.now() }); }
    catch (err) { console.error(err); }
  };

  const resolveIncident = async (id: string) => {
    try { await updateDoc(doc(db, 'incidents', id), { resolved: true, updatedAt: Date.now() }); }
    catch (err) { console.error(err); }
  };

  const updateSectorStatus = async (id: string, status: string) => {
    try { await updateDoc(doc(db, 'search_sectors', id), { status, updatedAt: Date.now() }); }
    catch (err) { console.error(err); }
  };

  const generateSITREP = () => {
    const lines = [
      '='.repeat(60),
      'SITREP — CENTRO DE OPERACIONES DE EMERGENCIA (COE)',
      `Generado: ${new Date().toLocaleString('es-VE')}`,
      `Tiempo transcurrido: ${hours}h ${mins}m ${secs}s`,
      '='.repeat(60),
      '',
      '--- SITUACIÓN GENERAL ---',
      `Incidentes activos: ${activeIncidents} (${verifiedIncidents} verificados)`,
      `Víctimas en triaje: ${triageTotal} (ROJO: ${triageRed})`,
      `Rescatados: ${totalRescued} · Fallecidos: ${totalDeceased}`,
      `Refugios operativos: ${sheltersOperational} · Colapsados: ${sheltersFull}`,
      `Vías bloqueadas: ${blockedRoutes} · Despejadas: ${clearRoutes}`,
      `Eventos en cascada activos: ${activeCascade} (críticos: ${criticalCascade})`,
      `Sectores de búsqueda: ${sectorsComplete}/${sectorsTotal} completados`,
      '',
      '--- ACCIONES REQUERIDAS ---',
      criticalCascade > 0 ? `⚠️ ATENCIÓN: ${criticalCascade} evento(s) crítico(s) activo(s) requieren respuesta inmediata` : '',
      triageRed > 0 ? `🚑 ${triageRed} pacientes ROJO requieren evacuación prioritaria` : '',
      blockedRoutes > 0 ? `🚧 ${blockedRoutes} vías bloqueadas — movilizar maquinaria de despeje` : '',
      sheltersFull > 0 ? `🏠 ${sheltersFull} refugios colapsados — habilitar nuevas capacidades` : '',
      '',
      '--- RECURSOS ---',
      `Total reportes: ${incidents.length} · Rutas monitoreadas: ${routes.length}`,
      '='.repeat(60),
      'SISMOVZLA — Plataforma Táctica de Emergencia',
      '',
    ].filter(Boolean).join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SITREP_${new Date().toISOString().slice(0, 10)}.txt`;
    setTimeout(() => { a.click(); URL.revokeObjectURL(url); }, 100);
  };

  const exportCSV = () => {
    const metrics = [
      ['Métrica', 'Valor'],
      ['Incidentes Activos', String(activeIncidents)],
      ['Incidentes Verificados', String(verifiedIncidents)],
      ['Pacientes Triaje', String(triageTotal)],
      ['Triaje Rojo', String(triageRed)],
      ['Rescatados', String(totalRescued)],
      ['Fallecidos', String(totalDeceased)],
      ['Refugios Operativos', String(sheltersOperational)],
      ['Refugios Colapsados', String(sheltersFull)],
      ['Vías Despejadas', String(clearRoutes)],
      ['Vías Bloqueadas', String(blockedRoutes)],
      ['Eventos Cascada Activos', String(activeCascade)],
      ['Críticos', String(criticalCascade)],
      ['Sectores Completados', `${sectorsComplete}/${sectorsTotal}`],
    ];
    const csv = metrics.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'coe_ksir.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(16);
    doc.text('SISMOVZLA - CENTRO DE OPERACIONES DE EMERGENCIA', 14, 20);
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generado: ${today}`, 14, 28);
    const metrics = [
      ['Incidentes Activos', String(activeIncidents)],
      ['Incidentes Verificados', String(verifiedIncidents)],
      ['Pacientes en Triaje', String(triageTotal)],
      ['Triaje Rojo', String(triageRed)],
      ['Rescatados Vivos', String(totalRescued)],
      ['Fallecidos', String(totalDeceased)],
      ['Refugios Operativos', String(sheltersOperational)],
      ['Refugios Colapsados', String(sheltersFull)],
      ['Vías Despejadas', String(clearRoutes)],
      ['Vías Bloqueadas', String(blockedRoutes)],
      ['Eventos en Cascada', String(activeCascade)],
      ['Críticos', String(criticalCascade)],
      ['Sectores Completados', `${sectorsComplete}/${sectorsTotal}`],
      ['Total Ocupantes Refugios', String(shelters.reduce((a, s) => a + (s.occupantCount || 0), 0))],
    ];
    autoTable(doc, {
      head: [['Indicador KSIR', 'Valor']],
      body: metrics,
      startY: 35,
      headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 9, font: 'helvetica' },
    });
    doc.save(`coe_resumen_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* EOC Header */}
      <div className="bg-gradient-to-r from-red-900/30 to-[#121212] border border-red-500/20 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/20 rounded-xl">
              <LayoutDashboard className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black text-white uppercase tracking-tight">CENTRO DE OPERACIONES DE EMERGENCIA</h1>
              <p className="text-xs font-mono text-white/50 mt-1">Common Operating Picture (COP) — Tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right font-mono">
              <p className="text-[9px] text-white/40 uppercase tracking-widest">Tiempo transcurrido</p>
              <p className="text-xl font-bold text-red-400">{hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}</p>
            </div>
            <div className="text-right font-mono">
              <p className="text-[9px] text-white/40 uppercase tracking-widest">Hora oficial</p>
              <p className="text-lg font-bold text-emerald-400">{currentTime}</p>
            </div>
            <button onClick={generateSITREP}
              className="flex items-center gap-1.5 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
              <Download className="w-4 h-4" /> SITREP
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-1.5 px-4 py-3 bg-red-700 hover:bg-red-600 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* KSIR — Key Strategic Indicators Realtime */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <Activity className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-red-400">{activeIncidents}</p>
          <p className="text-[8px] font-mono text-red-400/70 uppercase">Incidentes activos</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <Building className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-green-400">{sheltersOperational}</p>
          <p className="text-[8px] font-mono text-green-400/70 uppercase">Refugios operativos</p>
        </div>
        <div className="bg-red-600/10 border border-red-600/20 rounded-xl p-4 text-center">
          <HeartPulse className="w-5 h-5 text-red-500 mx-auto mb-1 animate-pulse" />
          <p className="text-2xl font-mono font-bold text-red-500">{triageRed}</p>
          <p className="text-[8px] font-mono text-red-500/70 uppercase">Triaje ROJO</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-blue-400">{totalRescued}</p>
          <p className="text-[8px] font-mono text-blue-400/70 uppercase">Rescatados</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-orange-400">{activeCascade}</p>
          <p className="text-[8px] font-mono text-orange-400/70 uppercase">Eventos cascada</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
          <Route className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-2xl font-mono font-bold text-yellow-400">{blockedRoutes}</p>
          <p className="text-[8px] font-mono text-yellow-400/70 uppercase">Vías bloqueadas</p>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalCascade > 0 && (
        <div className="bg-red-600/20 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <div>
            <p className="font-mono font-bold text-red-400 text-sm uppercase">ALERTA CRÍTICA: {criticalCascade} evento(s) en cascada requieren atención inmediata</p>
            <p className="text-[10px] font-mono text-red-400/60">Revisar Timeline de Eventos en Cascada para detalles</p>
          </div>
        </div>
      )}

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidentes recientes */}
        <div className="bg-[#121212] border border-white/10 rounded-xl p-5">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400" /> ÚLTIMOS INCIDENTES
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {incidents.slice(0, 10).map(inc => (
              <div key={inc.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${inc.resolved ? 'bg-gray-600' : inc.severity >= 4 ? 'bg-red-500 animate-pulse' : inc.severity >= 3 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                  <span className="text-xs font-mono text-white/80 truncate max-w-[200px]">{inc.type} · {inc.description.slice(0, 40)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-white/40">{inc.state}</span>
                  {!inc.resolved && !inc.verified && (
                    <button onClick={() => acknowledgeIncident(inc.id)}
                      className="px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded text-[8px] font-mono font-bold border border-blue-500/30 cursor-pointer hover:bg-blue-600/40"
                      title="Acusar recibo">
                      ✓
                    </button>
                  )}
                  {!inc.resolved && (
                    <button onClick={() => resolveIncident(inc.id)}
                      className="px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded text-[8px] font-mono font-bold border border-green-500/30 cursor-pointer hover:bg-green-600/40"
                      title="Resolver">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            {incidents.length === 0 && <p className="text-xs font-mono text-white/30 text-center py-4">Sin incidentes</p>}
          </div>
        </div>

        {/* Eventos en cascada */}
        <div className="bg-[#121212] border border-white/10 rounded-xl p-5">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" /> EVENTOS EN CASCADA ACTIVOS
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {cascadeEvents.filter(e => e.status === 'Activo').slice(0, 8).map(ev => (
              <div key={ev.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${ev.severity === 'Crítico' ? 'bg-red-500 animate-pulse' : ev.severity === 'Alto' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                  <span className="text-xs font-mono text-white/80">{ev.eventType} {ev.magnitude ? `ML ${ev.magnitude}` : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-white/40">{ev.location || ''}</span>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                    ev.severity === 'Crítico' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>{ev.severity}</span>
                </div>
              </div>
            ))}
            {cascadeEvents.filter(e => e.status === 'Activo').length === 0 && (
              <p className="text-xs font-mono text-white/30 text-center py-4">Sin eventos activos</p>
            )}
          </div>
        </div>

        {/* Estado de búsqueda y rescate */}
        <div className="bg-[#121212] border border-white/10 rounded-xl p-5">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> PROGRESO DE BÚSQUEDA Y RESCATE
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-green-400">{totalRescued}</p>
              <p className="text-[9px] font-mono text-white/40 uppercase">Rescatados vivos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-gray-400">{totalDeceased}</p>
              <p className="text-[9px] font-mono text-white/40 uppercase">Fallecidos</p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mb-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${sectorsTotal ? (sectorsComplete / sectorsTotal) * 100 : 0}%` }} />
          </div>
          <p className="text-[10px] font-mono text-white/50 text-center">{sectorsComplete}/{sectorsTotal} sectores completados</p>
          <div className="flex gap-2 mt-3">
            {['Crítico', 'Alto', 'Medio', 'Bajo'].map(p => {
              const count = sectors.filter(s => s.priority === p).length;
              return (
                <div key={p} className="flex-1 text-center">
                  <p className={`text-sm font-mono font-bold ${p === 'Crítico' ? 'text-red-400' : p === 'Alto' ? 'text-orange-400' : p === 'Medio' ? 'text-yellow-400' : 'text-blue-400'}`}>{count}</p>
                  <p className="text-[7px] font-mono text-white/30 uppercase">{p}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 space-y-1">
            {sectors.filter(s => s.status !== 'Completado' && s.status !== 'Verificado').slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[10px] font-mono text-white/70">{s.gridRef || s.id} · {s.priority}</span>
                <div className="flex gap-1">
                  <button onClick={() => updateSectorStatus(s.id, 'En Progreso')}
                    className="px-1.5 py-0.5 bg-yellow-600/20 text-yellow-400 rounded text-[8px] font-mono font-bold border border-yellow-500/30 cursor-pointer">▶</button>
                  <button onClick={() => updateSectorStatus(s.id, 'Completado')}
                    className="px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded text-[8px] font-mono font-bold border border-green-500/30 cursor-pointer">✓</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen Refugios y Vías */}
        <div className="bg-[#121212] border border-white/10 rounded-xl p-5">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-400" /> ESTADO DE REFUGIOS Y VÍAS
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-[10px] font-mono text-white/50 uppercase mb-2">Refugios</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-green-400">🟢 Operativos</span>
                  <span className="font-bold">{sheltersOperational}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-yellow-400">🟡 Casi llenos</span>
                  <span className="font-bold">{shelters.filter(s => s.capacityStatus === 'Amarillo').length}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-red-400">🔴 Colapsados</span>
                  <span className="font-bold">{sheltersFull}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-white/50 uppercase mb-2">Vías</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-green-400">🟢 Despejadas</span>
                  <span className="font-bold">{clearRoutes}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-yellow-400">🟡 Parciales</span>
                  <span className="font-bold">{routes.filter(r => r.status === 'Parcial').length}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-red-400">🔴 Bloqueadas</span>
                  <span className="font-bold">{blockedRoutes}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 bg-[#0A0A0A] border border-white/5 rounded-lg p-3 text-center">
              <p className="text-[9px] font-mono text-white/40 uppercase">Total refugios</p>
              <p className="text-lg font-mono font-bold text-white">{shelters.length}</p>
            </div>
            <div className="flex-1 bg-[#0A0A0A] border border-white/5 rounded-lg p-3 text-center">
              <p className="text-[9px] font-mono text-white/40 uppercase">Ocupantes</p>
              <p className="text-lg font-mono font-bold text-white">{shelters.reduce((a, s) => a + (s.occupantCount || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
