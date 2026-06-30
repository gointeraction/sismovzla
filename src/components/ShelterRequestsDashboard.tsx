import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shelter, ShelterRequest } from '../types';
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Building,
  Activity,
  HeartPulse,
  Droplets,
  Package,
  Loader,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { VolunteerRole } from './VolunteerVerification';

interface ShelterRequestsDashboardProps {
  role: VolunteerRole;
  userId: string;
}

const REQUEST_TYPE_COLORS: Record<ShelterRequest['type'], string> = {
  'Atención Médica':  'bg-red-500/15 text-red-300 border-red-500/30',
  'Insumos Médicos':  'bg-orange-500/15 text-orange-300 border-orange-500/30',
  'Alimentos':        'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Logística':        'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Otros':            'bg-white/10 text-white/60 border-white/10',
};

const REQUEST_TYPE_ICONS: Record<ShelterRequest['type'], React.ReactElement> = {
  'Atención Médica':  <HeartPulse className="w-3.5 h-3.5" />,
  'Insumos Médicos':  <Activity className="w-3.5 h-3.5" />,
  'Alimentos':        <Package className="w-3.5 h-3.5" />,
  'Logística':        <Droplets className="w-3.5 h-3.5" />,
  'Otros':            <ClipboardList className="w-3.5 h-3.5" />,
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('es-VE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

export default function ShelterRequestsDashboard({ role, userId }: ShelterRequestsDashboardProps) {
  const [requests, setRequests]   = useState<ShelterRequest[]>([]);
  const [shelters, setShelters]   = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Abierto' | 'Cerrado'>('Abierto');
  const [filterType,   setFilterType]   = useState<ShelterRequest['type'] | 'Todos'>('Todos');
  const [filterShelter, setFilterShelter] = useState<string>('Todos');
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);

  const canResolve = role === 'shelter_coordinator' || role === 'operator' || role === 'admin';

  // Load all shelter requests
  useEffect(() => {
    const q = query(collection(db, 'shelter_requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const list: ShelterRequest[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as ShelterRequest));
      setRequests(list);
      setIsLoading(false);
    }, err => {
      console.error('Error loading shelter_requests:', err);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // Load shelters for name lookup
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'shelters')), snap => {
      const list: Shelter[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Shelter));
      setShelters(list);
    });
    return () => unsub();
  }, []);

  const shelterName = (id: string) =>
    shelters.find(s => s.id === id)?.name ?? `Refugio ${id.slice(0, 6)}…`;

  const handleResolve = async (reqId: string) => {
    if (!confirm('¿Marcar esta solicitud como atendida?')) return;
    try {
      await updateDoc(doc(db, 'shelter_requests', reqId), {
        status: 'Cerrado',
        resolvedAt: Date.now(),
        resolvedBy: userId || role
      });
    } catch (e) {
      console.error('Error resolving request:', e);
      alert('Error al actualizar la solicitud.');
    }
  };

  const handleReopen = async (reqId: string) => {
    try {
      await updateDoc(doc(db, 'shelter_requests', reqId), {
        status: 'Abierto',
        resolvedAt: null,
        resolvedBy: null
      });
    } catch (e) {
      console.error('Error reopening request:', e);
    }
  };

  // Filtered list
  const filtered = requests.filter(r => {
    const byStatus  = filterStatus  === 'Todos' || r.status  === filterStatus;
    const byType    = filterType    === 'Todos' || r.type    === filterType;
    const byShelter = filterShelter === 'Todos' || r.shelterId === filterShelter;
    return byStatus && byType && byShelter;
  });

  const openCount   = requests.filter(r => r.status === 'Abierto').length;
  const closedCount = requests.filter(r => r.status === 'Cerrado').length;

  return (
    <div className="space-y-5 font-mono" id="shelter-requests-dashboard">

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-950/60 to-[#0d0d0d] border border-teal-500/25 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-display font-black text-white flex items-center gap-2.5 uppercase tracking-wide">
              <ClipboardList className="w-5 h-5 text-teal-400" />
              PANEL DE SOLICITUDES DE REFUGIOS
            </h3>
            <p className="text-xs text-white/45 mt-1 font-sans leading-relaxed">
              Monitoreo centralizado de todas las solicitudes de ayuda enviadas desde los refugios activos.
            </p>
          </div>
          {/* Summary pills */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFilterStatus('Abierto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${filterStatus === 'Abierto' ? 'bg-red-600 text-white border-red-400' : 'bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500/20'}`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {openCount} ABIERTAS
            </button>
            <button
              onClick={() => setFilterStatus('Cerrado')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${filterStatus === 'Cerrado' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {closedCount} RESUELTAS
            </button>
            <button
              onClick={() => setFilterStatus('Todos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${filterStatus === 'Todos' ? 'bg-white/20 text-white border-white/40' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'}`}
            >
              TODAS
            </button>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-3.5 h-3.5 text-white/30 shrink-0" />

        {/* By type */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as ShelterRequest['type'] | 'Todos')}
          className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-teal-500 cursor-pointer"
        >
          <option value="Todos">Todos los tipos</option>
          <option value="Atención Médica">Atención Médica</option>
          <option value="Insumos Médicos">Insumos Médicos</option>
          <option value="Alimentos">Alimentos</option>
          <option value="Logística">Logística</option>
          <option value="Otros">Otros</option>
        </select>

        {/* By shelter */}
        <select
          value={filterShelter}
          onChange={e => setFilterShelter(e.target.value)}
          className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-teal-500 cursor-pointer max-w-[220px] truncate"
        >
          <option value="Todos">Todos los refugios</option>
          {shelters.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <span className="text-[10px] text-white/30 ml-1 tabular-nums">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-7 h-7 text-teal-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-white/25 text-sm">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
          No hay solicitudes con los filtros seleccionados.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(req => {
            const isOpen = req.status === 'Abierto';
            const expanded = expandedReqId === req.id;
            return (
              <div
                key={req.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-black/50 border-white/8 hover:border-teal-500/30'
                    : 'bg-black/25 border-white/5 opacity-70'
                }`}
              >
                {/* Compact row */}
                <div
                  className="flex items-center gap-3 p-3.5 cursor-pointer"
                  onClick={() => setExpandedReqId(expanded ? null : req.id)}
                >
                  {/* Status dot */}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isOpen ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />

                  {/* Type badge */}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${REQUEST_TYPE_COLORS[req.type]}`}>
                    {REQUEST_TYPE_ICONS[req.type]}
                    {req.type.toUpperCase()}
                  </span>

                  {/* Shelter name */}
                  <span className="flex items-center gap-1 text-xs text-teal-300 font-bold truncate">
                    <Building className="w-3 h-3 shrink-0" />
                    {shelterName(req.shelterId)}
                  </span>

                  {/* Description preview */}
                  <span className="text-xs text-white/50 truncate flex-1 hidden sm:block">
                    {req.description}
                  </span>

                  {/* Time */}
                  <span className="text-[10px] text-white/30 shrink-0 hidden md:block tabular-nums">
                    <Clock className="w-3 h-3 inline mr-0.5" />
                    {formatDate(req.createdAt)}
                  </span>

                  {/* Expand icon */}
                  {expanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-white/30 shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  }
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
                    <p className="text-xs text-white/70 leading-relaxed font-sans">
                      <span className="text-white/40 font-mono text-[10px] uppercase">Descripción: </span>
                      {req.description}
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-white/35 font-mono">
                      <span>Reportado por: <span className="text-white/55">{req.reportedBy}</span></span>
                      <span>Refugio ID: <span className="text-teal-400/70">{req.shelterId.slice(0, 8)}…</span></span>
                      {req.resolvedBy && <span>Resuelto por: <span className="text-emerald-400/80">{req.resolvedBy}</span></span>}
                      {req.resolvedAt && <span>Resuelto: <span className="text-emerald-400/80">{formatDate(req.resolvedAt)}</span></span>}
                    </div>

                    {canResolve && (
                      <div className="flex gap-2 pt-1">
                        {isOpen ? (
                          <button
                            onClick={() => handleResolve(req.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg border border-emerald-400 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            MARCAR COMO ATENDIDA
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReopen(req.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold rounded-lg border border-white/10 transition-all cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            REABRIR SOLICITUD
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
