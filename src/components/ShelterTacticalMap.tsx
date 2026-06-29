import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Shelter, ShelterOccupant } from '../types';
import L from 'leaflet';
import {
  Map as MapIcon,
  List,
  Users,
  MapPin,
  Download,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Activity,
  Package,
  Droplets,
  HeartPulse,
  Building
} from 'lucide-react';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const statusColor = (s: Shelter['capacityStatus']) =>
  s === 'Verde' ? '#10b981' : s === 'Amarillo' ? '#f59e0b' : '#ef4444';

const typeIcon = (t: Shelter['type']) => {
  switch (t) {
    case 'Hospital': return '🏥';
    case 'Centro de Acopio': return '📦';
    case 'Punto de Agua': return '💧';
    default: return '⛺';
  }
};

function createShelterIcon(status: Shelter['capacityStatus'], type: Shelter['type']) {
  const color = statusColor(status);
  const emoji = typeIcon(type);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="40" height="50">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${color}" flood-opacity="0.5"/>
      </filter>
    </defs>
    <ellipse cx="20" cy="46" rx="8" ry="3" fill="rgba(0,0,0,0.3)"/>
    <path d="M20 2 C12 2 6 8 6 16 C6 26 20 44 20 44 C20 44 34 26 34 16 C34 8 28 2 20 2Z" fill="${color}" filter="url(#shadow)" stroke="white" stroke-width="1.5"/>
    <circle cx="20" cy="16" r="9" fill="white" opacity="0.95"/>
    <text x="20" y="20" text-anchor="middle" font-size="11" dominant-baseline="middle">${emoji}</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -52]
  });
}

export default function ShelterTacticalMap() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [occupants, setOccupants] = useState<ShelterOccupant[]>([]);
  const [expandedShelter, setExpandedShelter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Sync shelters
  useEffect(() => {
    const q = query(collection(db, 'shelters'));
    const unsub = onSnapshot(q, (snap) => {
      const list: Shelter[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Shelter));
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setShelters(list);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // Sync all occupants
  useEffect(() => {
    const q = query(collection(db, 'shelter_occupants'));
    const unsub = onSnapshot(q, (snap) => {
      const list: ShelterOccupant[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as ShelterOccupant));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setOccupants(list);
    });
    return () => unsub();
  }, []);

  // Initialize / update map
  useEffect(() => {
    if (viewMode !== 'map') return;

    // Wait for DOM
    setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
          center: [10.48, -66.9],
          zoom: 9,
          zoomControl: true,
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© CARTO',
          maxZoom: 19
        }).addTo(mapRef.current);
      }

      // Remove old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();

      shelters.forEach(shelter => {
        if (!shelter.latitude || !shelter.longitude) return;
        const shelterOccupants = occupants.filter(o => o.shelterId === shelter.id);
        const icon = createShelterIcon(shelter.capacityStatus, shelter.type);

        const occupantRows = shelterOccupants.length > 0
          ? shelterOccupants.map(o =>
              `<tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
                <td style="padding:3px 6px;color:#fff;font-size:11px">${o.fullName}</td>
                <td style="padding:3px 6px;color:#9ca3af;font-size:10px">${o.ci}</td>
                <td style="padding:3px 6px;color:#9ca3af;font-size:10px">${o.age ?? '-'}</td>
                <td style="padding:3px 6px;color:#9ca3af;font-size:10px">${o.physicalCondition}</td>
              </tr>`
            ).join('')
          : `<tr><td colspan="4" style="padding:8px;text-align:center;color:#6b7280;font-size:11px">Sin personas registradas</td></tr>`;

        const popup = L.popup({ maxWidth: 420, minWidth: 320, className: 'shelter-tactical-popup' })
          .setContent(`
            <div style="background:#111;color:#fff;border-radius:8px;font-family:monospace;overflow:hidden">
              <div style="background:${statusColor(shelter.capacityStatus)}15;border-bottom:1px solid ${statusColor(shelter.capacityStatus)}40;padding:10px 12px">
                <div style="font-size:11px;font-weight:900;color:${statusColor(shelter.capacityStatus)};text-transform:uppercase;letter-spacing:1px">${shelter.capacityStatus.toUpperCase()}</div>
                <div style="font-size:15px;font-weight:900;color:#fff;margin-top:2px">${typeIcon(shelter.type)} ${shelter.name}</div>
                <div style="font-size:10px;color:#6b7280;margin-top:2px">${shelter.type} · ${shelter.state}</div>
              </div>
              <div style="padding:8px 12px;display:grid;grid-template-columns:1fr 1fr;gap:4px">
                <div style="font-size:10px;color:#6b7280">COORDENADAS</div>
                <div style="font-size:10px;color:#10b981;text-align:right">${shelter.latitude.toFixed(5)}, ${shelter.longitude.toFixed(5)}</div>
                <div style="font-size:10px;color:#6b7280">PERSONAS</div>
                <div style="font-size:10px;color:#fff;text-align:right">${shelterOccupants.length}${shelter.maxCapacity ? ` / ${shelter.maxCapacity}` : ''}</div>
                <div style="font-size:10px;color:#6b7280">DIRECCIÓN</div>
                <div style="font-size:10px;color:#d1d5db;text-align:right">${shelter.address || '—'}</div>
              </div>
              <div style="border-top:1px solid rgba(255,255,255,0.08);padding:8px 12px">
                <div style="font-size:10px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">PERSONAS ALBERGADAS</div>
                <table style="width:100%;border-collapse:collapse">
                  <thead>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
                      <th style="padding:3px 6px;text-align:left;font-size:9px;color:#6b7280;font-weight:700">NOMBRE</th>
                      <th style="padding:3px 6px;text-align:left;font-size:9px;color:#6b7280;font-weight:700">CI</th>
                      <th style="padding:3px 6px;text-align:left;font-size:9px;color:#6b7280;font-weight:700">EDAD</th>
                      <th style="padding:3px 6px;text-align:left;font-size:9px;color:#6b7280;font-weight:700">CONDICIÓN</th>
                    </tr>
                  </thead>
                  <tbody>${occupantRows}</tbody>
                </table>
              </div>
            </div>
          `);

        const marker = L.marker([shelter.latitude, shelter.longitude], { icon }).addTo(mapRef.current!);
        marker.bindPopup(popup);
        markersRef.current.set(shelter.id, marker);
      });
    }, 100);

    return () => {
      if (mapRef.current && viewMode !== 'map') {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [shelters, occupants, viewMode]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const getOccupantsForShelter = (shelterId: string) =>
    occupants.filter(o => o.shelterId === shelterId);

  const exportCSV = () => {
    const rows: string[] = [
      'refugio,tipo,estado_semaforo,capacidad_max,latitud,longitud,coordenadas,nombre_persona,cedula,edad,telefono,condicion_fisica,necesidades_medicas'
    ];
    shelters.forEach(s => {
      const occ = getOccupantsForShelter(s.id);
      if (occ.length === 0) {
        rows.push(`"${s.name}","${s.type}","${s.capacityStatus}","${s.maxCapacity ?? ''}","${s.latitude}","${s.longitude}","${s.latitude},${s.longitude}","","","","","",""`);
      } else {
        occ.forEach(o => {
          rows.push(`"${s.name}","${s.type}","${s.capacityStatus}","${s.maxCapacity ?? ''}","${s.latitude}","${s.longitude}","${s.latitude},${s.longitude}","${o.fullName}","${o.ci}","${o.age ?? ''}","${o.contactPhone ?? ''}","${o.physicalCondition}","${o.medicalNeeds}"`);
        });
      }
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapa_tactico_refugios_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalOccupants = occupants.length;
  const sheltersWithPeople = shelters.filter(s => getOccupantsForShelter(s.id).length > 0).length;

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0d1117] to-[#0a0f0a] border border-emerald-500/20 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-black text-emerald-400 text-lg uppercase tracking-wider flex items-center gap-2">
              <Crosshair className="w-5 h-5" />
              MAPA TÁCTICO DE REFUGIOS
            </h2>
            <p className="text-xs text-white/40 mt-1">
              Geolocalización de centros + listado de personas albergadas en tiempo real
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
              <Building className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs text-white/60">Refugios:</span>
              <span className="text-sm font-black text-white">{shelters.length}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-white/60">Personas:</span>
              <span className="text-sm font-black text-white">{totalOccupants}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-white/60">Con personas:</span>
              <span className="text-sm font-black text-white">{sheltersWithPeople}</span>
            </div>
          </div>
        </div>

        {/* Semaphore legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
          <span className="text-[10px] text-white/30 uppercase tracking-widest">SEMÁFORO:</span>
          {(['Verde', 'Amarillo', 'Rojo'] as const).map(s => (
            <span key={s} className="flex items-center gap-1.5 text-[10px] font-bold"
              style={{ color: statusColor(s) }}>
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: statusColor(s) }} />
              {s === 'Verde' ? 'DISPONIBLE' : s === 'Amarillo' ? 'CASI LLENO' : 'COLAPSADO'}
            </span>
          ))}
        </div>
      </div>

      {/* View Toggle + Export */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-black/40 border border-white/10 rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${viewMode === 'map' ? 'bg-emerald-600 text-black' : 'text-white/50 hover:text-white'}`}
          >
            <MapIcon className="w-3.5 h-3.5" /> Mapa
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-emerald-600 text-black' : 'text-white/50 hover:text-white'}`}
          >
            <List className="w-3.5 h-3.5" /> Listado
          </button>
        </div>

        {viewMode === 'list' && (
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-black transition-all rounded-lg text-xs font-bold uppercase flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        )}
      </div>

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: '65vh' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="text-center">
                <Activity className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Cargando mapa táctico...</p>
              </div>
            </div>
          )}
          {/* Corner info overlay */}
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs font-mono">
            <p className="text-white/40 text-[10px] uppercase tracking-widest">Haz clic en un pin para ver el listado de personas</p>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-16 text-center text-white/40">
              <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-xs">Cargando datos...</p>
            </div>
          ) : shelters.length === 0 ? (
            <div className="text-center py-16 bg-black/40 rounded-xl border border-white/5 text-white/40">
              <Building className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">NO HAY REFUGIOS REGISTRADOS</p>
            </div>
          ) : (
            shelters.map(shelter => {
              const shelterOcc = getOccupantsForShelter(shelter.id);
              const isExpanded = expandedShelter === shelter.id;
              const color = statusColor(shelter.capacityStatus);

              return (
                <div key={shelter.id} className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden shadow-lg">
                  {/* Shelter Header */}
                  <button
                    onClick={() => setExpandedShelter(isExpanded ? null : shelter.id)}
                    className="w-full p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{typeIcon(shelter.type)}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-white text-sm uppercase truncate">{shelter.name}</h3>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase shrink-0" style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                            {shelter.capacityStatus}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 mt-1">
                          <span className="text-[10px] text-white/40">{shelter.type} · {shelter.state}</span>
                          <span className="text-[10px] text-emerald-500/70 flex items-center gap-1">
                            <Crosshair className="w-2.5 h-2.5" />
                            {shelter.latitude?.toFixed(5)}, {shelter.longitude?.toFixed(5)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-black text-white">{shelterOcc.length}</div>
                        <div className="text-[9px] text-white/40 uppercase">
                          {shelter.maxCapacity ? `/ ${shelter.maxCapacity}` : 'personas'}
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4 text-white/40" />
                        : <ChevronRight className="w-4 h-4 text-white/40" />
                      }
                    </div>
                  </button>

                  {/* Expanded Occupant Table */}
                  {isExpanded && (
                    <div className="border-t border-white/10">
                      {/* Coordinates bar */}
                      <div className="bg-emerald-500/5 border-b border-emerald-500/10 px-4 py-2 flex flex-wrap gap-x-6 gap-y-1">
                        <span className="text-[10px] text-white/50 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500" /> LATITUD: <strong className="text-emerald-400 ml-1">{shelter.latitude}</strong>
                        </span>
                        <span className="text-[10px] text-white/50 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500" /> LONGITUD: <strong className="text-emerald-400 ml-1">{shelter.longitude}</strong>
                        </span>
                        <span className="text-[10px] text-white/50 flex items-center gap-1">
                          📍 DIRECCIÓN: <strong className="text-white/70 ml-1">{shelter.address || '—'}</strong>
                        </span>
                        {shelter.contact && (
                          <span className="text-[10px] text-white/50">📞 {shelter.contact}</span>
                        )}
                      </div>

                      {shelterOcc.length === 0 ? (
                        <div className="py-8 text-center text-white/30">
                          <Users className="w-6 h-6 mx-auto mb-2 opacity-40" />
                          <p className="text-xs font-bold">SIN PERSONAS REGISTRADAS</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-white/10 bg-black/30">
                                <th className="px-4 py-2.5 text-left text-[9px] font-black text-white/40 uppercase tracking-widest">#</th>
                                <th className="px-4 py-2.5 text-left text-[9px] font-black text-white/40 uppercase tracking-widest">Nombre</th>
                                <th className="px-4 py-2.5 text-left text-[9px] font-black text-white/40 uppercase tracking-widest">CI</th>
                                <th className="px-4 py-2.5 text-left text-[9px] font-black text-white/40 uppercase tracking-widest">Edad</th>
                                <th className="px-4 py-2.5 text-left text-[9px] font-black text-white/40 uppercase tracking-widest">Teléfono</th>
                                <th className="px-4 py-2.5 text-left text-[9px] font-black text-white/40 uppercase tracking-widest">Condición Física</th>
                                <th className="px-4 py-2.5 text-left text-[9px] font-black text-white/40 uppercase tracking-widest">Necesidades Médicas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {shelterOcc.map((o, i) => (
                                <tr key={o.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                  <td className="px-4 py-2.5 text-white/30 font-mono">{i + 1}</td>
                                  <td className="px-4 py-2.5 font-bold text-white uppercase">{o.fullName}</td>
                                  <td className="px-4 py-2.5 text-white/60 font-mono">{o.ci}</td>
                                  <td className="px-4 py-2.5 text-white/60">{o.age ?? '—'}</td>
                                  <td className="px-4 py-2.5 text-white/60">{o.contactPhone ?? '—'}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                      o.physicalCondition === 'Estable'
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : o.physicalCondition?.includes('Leve')
                                        ? 'bg-amber-500/15 text-amber-400'
                                        : 'bg-red-500/15 text-red-400'
                                    }`}>
                                      {o.physicalCondition}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-white/50 italic">{o.medicalNeeds}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Popup custom styles */}
      <style>{`
        .shelter-tactical-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important;
          border-radius: 12px !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        .shelter-tactical-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }
        .shelter-tactical-popup .leaflet-popup-tip-container {
          display: none;
        }
        .shelter-tactical-popup .leaflet-popup-close-button {
          color: #6b7280 !important;
          top: 8px !important;
          right: 8px !important;
          font-size: 18px !important;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
