import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { SearchSector, RescueTeam } from '../types';
import { Search, Users, Clock, Map, Shield, CheckCircle, XCircle, AlertTriangle, Plus, Download } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';

const PRIORITY_COLORS: Record<string, string> = {
  Crítico: 'bg-red-600 text-white',
  Alto: 'bg-orange-500 text-white',
  Medio: 'bg-yellow-500 text-black',
  Bajo: 'bg-blue-500 text-white',
};

const STATUS_COLORS: Record<string, string> = {
  'No Iniciado': 'bg-gray-600/50 text-gray-300',
  'En Progreso': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Completado: 'bg-green-500/20 text-green-400 border-green-500/30',
  Verificado: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
};

const TEAM_STATUS_COLORS: Record<string, string> = {
  Disponible: 'bg-green-500/20 text-green-400',
  Desplegado: 'bg-red-500/20 text-red-400',
  Descanso: 'bg-yellow-500/20 text-yellow-400',
  Reasignado: 'bg-blue-500/20 text-blue-400',
};

const TEAM_TYPES = ['K9', 'Técnico', 'Pesado', 'Acuático', 'AltaAngulo'] as const;
const HAZARD_OPTIONS = ['Gas', 'Fuego', 'Inestable', 'Agua', 'Eléctrico', 'Químico'] as const;

export default function SearchAndRescueModule() {
  const [sectors, setSectors] = useState<SearchSector[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [view, setView] = useState<'sectors' | 'teams'>('sectors');
  const [showSectorForm, setShowSectorForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('Todos');
  const { getPosition } = useGeolocation();

  const [sectorForm, setSectorForm] = useState({
    gridRef: '', state: 'Caracas', sectorName: '', priority: 'Alto' as SearchSector['priority'],
    estimatedStructures: 0, hazards: [] as string[], assignedTeam: '',
  });

  const [teamForm, setTeamForm] = useState({
    teamName: '', type: 'Técnico' as RescueTeam['type'], members: 2,
    equipment: '', teamLeader: '', contact: '', status: 'Disponible' as RescueTeam['status'],
  });

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'search_sectors'), orderBy('createdAt', 'desc')), snap => {
      setSectors(snap.docs.map(d => ({ id: d.id, ...d.data() } as SearchSector)));
    });
    const unsub2 = onSnapshot(collection(db, 'rescue_teams'), snap => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() } as RescueTeam)));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const submitSector = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pos = await getPosition();
      const lat = pos?.lat ?? 10.5;
      const lng = pos?.lng ?? -66.9;
      const ref = doc(collection(db, 'search_sectors'));
      const sectorId = ref.id;
      const centerLat = lat, centerLng = lng;
      const boundaryCoords = [
        { lat: centerLat - 0.005, lng: centerLng - 0.005 },
        { lat: centerLat - 0.005, lng: centerLng + 0.005 },
        { lat: centerLat + 0.005, lng: centerLng + 0.005 },
        { lat: centerLat + 0.005, lng: centerLng - 0.005 },
      ];
      await addDoc(collection(db, 'search_sectors'), {
        gridRef: sectorForm.gridRef, boundaryCoords, state: sectorForm.state,
        sectorName: sectorForm.sectorName || null, priority: sectorForm.priority,
        status: 'No Iniciado', estimatedStructures: sectorForm.estimatedStructures || null,
        structuresSearched: 0, victimsFound: 0, victimsRescued: 0, victimsDeceased: 0,
        assignedTeam: sectorForm.assignedTeam || null, hazards: sectorForm.hazards,
        createdAt: Date.now(), updatedAt: Date.now(),
      });
      setShowSectorForm(false);
      setSectorForm({ gridRef: '', state: 'Caracas', sectorName: '', priority: 'Alto', estimatedStructures: 0, hazards: [], assignedTeam: '' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const submitTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'rescue_teams'), { ...teamForm, createdAt: Date.now() });
      setShowTeamForm(false);
      setTeamForm({ teamName: '', type: 'Técnico', members: 2, equipment: '', teamLeader: '', contact: '', status: 'Disponible' });
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const updateSector = async (id: string, data: Partial<SearchSector>) => {
    try { await updateDoc(doc(db, 'search_sectors', id), { ...data, updatedAt: Date.now() }); }
    catch (err) { console.error(err); }
  };

  const updateTeam = async (id: string, data: Partial<RescueTeam>) => {
    try { await updateDoc(doc(db, 'rescue_teams', id), data); }
    catch (err) { console.error(err); }
  };

  const toggleHazard = (h: string) => {
    setSectorForm(prev => ({
      ...prev,
      hazards: prev.hazards.includes(h) ? prev.hazards.filter(x => x !== h) : [...prev.hazards, h],
    }));
  };

  const filtered = sectors.filter(s => filterPriority === 'Todos' || s.priority === filterPriority);
  const totalRescued = sectors.reduce((a, s) => a + (s.victimsRescued || 0), 0);
  const totalFound = sectors.reduce((a, s) => a + (s.victimsFound || 0), 0);
  const totalDeceased = sectors.reduce((a, s) => a + (s.victimsDeceased || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">COORDINACIÓN DE BÚSQUEDA Y RESCATE (USAR)</h2>
            <p className="text-xs text-white/50 mt-1">Sectores de búsqueda, equipos desplegados y progreso de rescate</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowSectorForm(true); setView('sectors'); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> NUEVO SECTOR
          </button>
          <button onClick={() => { setShowTeamForm(true); setView('teams'); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono text-xs font-bold transition-all cursor-pointer">
            <Users className="w-4 h-4" /> NUEVO EQUIPO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-blue-400">{sectors.length}</p>
          <p className="text-[9px] font-mono text-blue-400/70 uppercase">Sectores</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-green-400">{totalRescued}</p>
          <p className="text-[9px] font-mono text-green-400/70 uppercase">Rescatados</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-red-400">{totalFound - totalRescued - totalDeceased}</p>
          <p className="text-[9px] font-mono text-red-400/70 uppercase">Pendientes</p>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-gray-400">{totalDeceased}</p>
          <p className="text-[9px] font-mono text-gray-400/70 uppercase">Fallecidos</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setView('sectors')}
          className={`px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${
            view === 'sectors' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-black/20 border-white/10 text-white/50'
          }`}>
          SECTORES
        </button>
        <button onClick={() => setView('teams')}
          className={`px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer border ${
            view === 'teams' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-black/20 border-white/10 text-white/50'
          }`}>
          EQUIPOS
        </button>
      </div>

      {view === 'sectors' && (
        <>
          <div className="flex gap-2 flex-wrap">
            {['Todos', 'Crítico', 'Alto', 'Medio', 'Bajo'].map(p => (
              <button key={p} onClick={() => setFilterPriority(p)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                  filterPriority === p ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/50'
                }`}>
                {p}
              </button>
            ))}
          </div>

          {showSectorForm && (
            <form onSubmit={submitSector} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Registrar nuevo sector de búsqueda</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Referencia de cuadrícula</label>
                  <input value={sectorForm.gridRef} onChange={e => setSectorForm({ ...sectorForm, gridRef: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="A-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Nombre del sector</label>
                  <input value={sectorForm.sectorName} onChange={e => setSectorForm({ ...sectorForm, sectorName: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Los Palos Grandes" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Prioridad</label>
                  <select value={sectorForm.priority} onChange={e => setSectorForm({ ...sectorForm, priority: e.target.value as SearchSector['priority'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="Crítico">Crítico</option>
                    <option value="Alto">Alto</option>
                    <option value="Medio">Medio</option>
                    <option value="Bajo">Bajo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Estructuras estimadas</label>
                  <input type="number" value={sectorForm.estimatedStructures || ''} onChange={e => setSectorForm({ ...sectorForm, estimatedStructures: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase">Peligros</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {HAZARD_OPTIONS.map(h => (
                      <button key={h} type="button" onClick={() => toggleHazard(h)}
                        className={`px-3 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                          sectorForm.hazards.includes(h) ? 'bg-red-500/30 border-red-500/50 text-red-300' : 'bg-black/20 border-white/10 text-white/50'
                        }`}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Asignar equipo</label>
                  <select value={sectorForm.assignedTeam} onChange={e => setSectorForm({ ...sectorForm, assignedTeam: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    <option value="">Sin asignar</option>
                    {teams.filter(t => t.status === 'Disponible' || t.status === 'Desplegado').map(t => (
                      <option key={t.id} value={t.teamName}>{t.teamName} ({t.type})</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
                {submitting ? 'CREANDO...' : 'CREAR SECTOR'}
              </button>
            </form>
          )}

          <div className="grid gap-3">
            {filtered.map(s => (
              <div key={s.id} className="bg-[#121212] border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${PRIORITY_COLORS[s.priority]}`}>
                      {s.gridRef}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-white">{s.sectorName || s.gridRef}</span>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                      </div>
                      <p className="text-[10px] font-mono text-white/50 mt-1">{s.state} · {s.assignedTeam || 'Sin equipo asignado'}</p>
                      {(s.hazards && s.hazards.length > 0) && (
                        <div className="flex gap-1 mt-1">
                          {s.hazards.map((h, i) => <span key={i} className="text-[8px] font-mono bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">{h}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-white/70">Estructuras: {s.structuresSearched || 0}/{s.estimatedStructures || '?'}</p>
                    <p className="text-xs font-mono text-white/70">Rescatados: <span className="text-green-400 font-bold">{s.victimsRescued || 0}</span></p>
                    <p className="text-xs font-mono text-white/70">Fallecidos: <span className="text-gray-400">{s.victimsDeceased || 0}</span></p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
                  <button onClick={() => updateSector(s.id, { status: 'En Progreso' })}
                    className="px-2 py-1 rounded text-[8px] font-mono font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 cursor-pointer uppercase">
                    Iniciar
                  </button>
                  <button onClick={() => updateSector(s.id, { victimsRescued: (s.victimsRescued || 0) + 1, victimsFound: (s.victimsFound || 0) + 1 })}
                    className="px-2 py-1 rounded text-[8px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 cursor-pointer uppercase">
                    +1 Rescatado
                  </button>
                  <button onClick={() => updateSector(s.id, { victimsDeceased: (s.victimsDeceased || 0) + 1, victimsFound: (s.victimsFound || 0) + 1 })}
                    className="px-2 py-1 rounded text-[8px] font-mono font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30 cursor-pointer uppercase">
                    +1 Fallecido
                  </button>
                  <button onClick={() => updateSector(s.id, { structuresSearched: (s.structuresSearched || 0) + 1 })}
                    className="px-2 py-1 rounded text-[8px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 cursor-pointer uppercase">
                    +1 Estructura
                  </button>
                  {s.status === 'Completado' && (
                    <button onClick={() => updateSector(s.id, { status: 'Verificado' })}
                      className="px-2 py-1 rounded text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer uppercase">
                      Verificar
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-white/30 font-mono text-sm">No hay sectores registrados. Crea el primer sector de búsqueda.</div>
            )}
          </div>
        </>
      )}

      {view === 'teams' && (
        <>
          {showTeamForm && (
            <form onSubmit={submitTeam} className="bg-[#121212] border border-white/10 rounded-xl p-6 space-y-4">
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">Registrar nuevo equipo de rescate</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Nombre del equipo</label>
                  <input value={teamForm.teamName} onChange={e => setTeamForm({ ...teamForm, teamName: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Tipo</label>
                  <select value={teamForm.type} onChange={e => setTeamForm({ ...teamForm, type: e.target.value as RescueTeam['type'] })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1">
                    {TEAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Miembros</label>
                  <input type="number" value={teamForm.members} onChange={e => setTeamForm({ ...teamForm, members: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Líder</label>
                  <input value={teamForm.teamLeader} onChange={e => setTeamForm({ ...teamForm, teamLeader: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Contacto</label>
                  <input value={teamForm.contact} onChange={e => setTeamForm({ ...teamForm, contact: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" required />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase">Equipo</label>
                  <input value={teamForm.equipment} onChange={e => setTeamForm({ ...teamForm, equipment: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono mt-1" placeholder="Cuerdas, camilla, detector" />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs py-3 rounded-lg transition-all cursor-pointer disabled:opacity-50">
                {submitting ? 'CREANDO...' : 'REGISTRAR EQUIPO'}
              </button>
            </form>
          )}

          <div className="grid gap-3">
            {teams.map(t => (
              <div key={t.id} className="bg-[#121212] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${TEAM_STATUS_COLORS[t.status]} font-mono font-bold text-xs`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">{t.teamName}</span>
                      <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/60">{t.type}</span>
                    </div>
                    <p className="text-[10px] font-mono text-white/50 mt-0.5">Líder: {t.teamLeader} · {t.members} miembros · {t.contact}</p>
                    {t.currentSector && <p className="text-[10px] font-mono text-blue-300">Sector: {t.currentSector}</p>}
                    {t.shiftEnd && <p className="text-[10px] font-mono text-yellow-300">Turno termina: {new Date(t.shiftEnd).toLocaleTimeString('es-VE')}</p>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(['Disponible', 'Desplegado', 'Descanso', 'Reasignado'] as const).map(s => (
                    <button key={s} onClick={() => updateTeam(t.id, { status: s })}
                      className={`px-2 py-1 rounded text-[8px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                        t.status === s ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-white/10 text-white/40'
                      }`}>
                      {s.slice(0, 6)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {teams.length === 0 && (
              <div className="text-center py-12 text-white/30 font-mono text-sm">No hay equipos registrados. Crea el primer equipo de rescate.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
