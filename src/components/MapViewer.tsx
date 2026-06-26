import { useState, useEffect, useRef, useMemo } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Incident } from '../types';
import L from 'leaflet';
import {
  Map as MapIcon,
  List,
  Check,
  ShieldAlert,
  AlertOctagon,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Eye,
  Trash2,
  Phone
} from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';

interface MapViewerProps {
  incidents: Incident[];
  isVolunteerVerified: boolean;
  selectedStateFilter: Incident['state'] | 'Todos';
  onStateFilterChange: (state: Incident['state'] | 'Todos') => void;
}

export default function MapViewer({
  incidents,
  isVolunteerVerified,
  selectedStateFilter,
  onStateFilterChange
}: MapViewerProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Default to list for low network speed resilience
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<Incident['type'] | 'Todos'>('Todos');
  const [verificationFilter, setVerificationFilter] = useState<'Todos' | 'Verificados' | 'No Verificados'>('Todos');

  const [lightbox, setLightbox] = useState<{ urls: string[]; currentIndex: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.CircleMarker>>(new Map());

  const filteredIncidentsRef = useRef<Incident[]>([]);

  // Filtered incidents based on active controls
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const stateMatch = selectedStateFilter === 'Todos' || incident.state === selectedStateFilter;
      const typeMatch = selectedTypeFilter === 'Todos' || incident.type === selectedTypeFilter;
      const verificationMatch =
        verificationFilter === 'Todos' ||
        (verificationFilter === 'Verificados' && incident.verified) ||
        (verificationFilter === 'No Verificados' && !incident.verified);
      return stateMatch && typeMatch && verificationMatch;
    });
  }, [incidents, selectedStateFilter, selectedTypeFilter, verificationFilter]);

  filteredIncidentsRef.current = filteredIncidents;

  useEffect(() => {
    (window as any).openIncidentLightbox = (incidentId: string, idx: number) => {
      const inc = filteredIncidentsRef.current.find(i => i.id === incidentId);
      if (inc) {
        const urls = inc.mediaUrls && inc.mediaUrls.length > 0 ? inc.mediaUrls : inc.mediaUrl ? [inc.mediaUrl] : [];
        if (urls.length > 0) {
          setLightbox({ urls, currentIndex: idx });
        }
      }
    };
  }, []);

  // Center coordinates for states
  const STATE_CENTERS = {
    'Caracas': [10.4806, -66.9036] as [number, number],
    'La Guaira': [10.5986, -66.9317] as [number, number],
    'Aragua': [10.2442, -67.5919] as [number, number], // Maracay
    'Carabobo': [10.1622, -68.0077] as [number, number], // Valencia
    'Otros': [10.4806, -66.9036] as [number, number],
    'Todos': [10.4806, -66.9036] as [number, number]
  };

  // Set up and destroy raw Leaflet Map
  useEffect(() => {
    if (viewMode !== 'map') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersGroupRef.current = null;
      }
      return;
    }

    if (!mapRef.current) {
      const center = STATE_CENTERS[selectedStateFilter === 'Todos' ? 'Caracas' : selectedStateFilter] || [10.4806, -66.9036];
      const zoom = selectedStateFilter === 'Todos' ? 9 : 11;

      const map = L.map('map-element', {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      // CartoDB Dark Matter tile layer - perfect immersive dark theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);

      mapRef.current = map;
      markersGroupRef.current = L.featureGroup().addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, [viewMode]);

  // Adjust camera position smoothly ONLY when region filter changes
  useEffect(() => {
    if (viewMode !== 'map' || !mapRef.current) return;
    if (selectedStateFilter !== 'Todos') {
      mapRef.current.setView(STATE_CENTERS[selectedStateFilter] || [10.4806, -66.9036], 11, { animate: true });
    } else {
      mapRef.current.setView([10.4806, -66.9036], 9, { animate: true });
    }
  }, [selectedStateFilter, viewMode]);

  // Update georeferenced markers without reset/jumping camera or closing popups
  useEffect(() => {
    if (viewMode !== 'map' || !mapRef.current || !markersGroupRef.current) return;

    const currentIds = new Set(filteredIncidents.map(i => i.id));

    // Remove markers that no longer match active filters
    markersMapRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        markersGroupRef.current?.removeLayer(marker);
        markersMapRef.current.delete(id);
      }
    });

    filteredIncidents.forEach((inc) => {
      let color = '#D32F2F'; // Immersive Theme Dark Red for Rescate
      if (inc.type === 'Médico') color = '#2196F3'; // Theme Blue
      if (inc.type === 'Fuga de Gas') color = '#FF9800'; // Amber
      if (inc.type === 'Derrumbe') color = '#9C27B0'; // Purple
      if (inc.type === 'Otros') color = '#71717a'; // Gray

      const radius = 8 + inc.severity * 3.5;

      // Elegant immersive styled popups with Dark theme styling
      const mediaArray = inc.mediaUrls && inc.mediaUrls.length > 0 ? inc.mediaUrls : inc.mediaUrl ? [inc.mediaUrl] : [];
      const imagesHtml = mediaArray.length > 0 ? `
        <div style="margin: 10px 0;">
          <p style="font-size: 9px; color: rgba(255,255,255,0.5); margin: 0 0 4px 0; font-weight: bold; font-family: monospace;">📷 EVIDENCIAS (${mediaArray.length}):</p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; max-height: 140px; overflow-y: auto;">
            ${mediaArray.map((mUrl, idxImg) => `
              <div onclick="window.openIncidentLightbox('${inc.id}', ${idxImg})" title="Haga clic para ampliar" style="aspect-ratio: 1; border-radius: 4px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; background: #000;">
                <img src="${mUrl}" alt="Evidencia ${idxImg + 1}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
              </div>
            `).join('')}
          </div>
        </div>
      ` : '';

      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; color: #ffffff; background: #121212; padding: 12px; min-width: 240px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-b: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
            <strong style="font-size: 11px; font-weight: 800; tracking: 0.1em; color: ${color}; font-family: 'Orbitron', sans-serif;">${inc.type.toUpperCase()}</strong>
            <span style="font-size: 9px; padding: 2px 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; font-weight: bold; font-family: monospace;">GRAV ${inc.severity}/5</span>
          </div>
          <p style="font-size: 12px; margin: 0 0 10px 0; color: rgba(255,255,255,0.9); font-weight: 500; line-height: 1.4;">
            ${inc.description}
          </p>
          ${inc.address ? `<p style="font-size: 11px; margin: 0 0 10px 0; color: #f87171; background: rgba(220,38,38,0.15); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(220,38,38,0.3); font-family: monospace;">📍 Dir: ${inc.address}</p>` : ''}
          ${inc.structuralEvaluation ? `<p style="font-size: 10px; margin: 0 0 10px 0; color: #fbbf24; background: rgba(245,158,11,0.15); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.3); font-family: monospace; font-weight: bold;">🏛️ Estructura: ${inc.structuralEvaluation.formulario_evaluacion_post_sismo.resumen_final.clasificacion}</p>` : ''}
          ${imagesHtml}
          <div style="font-size: 10px; color: rgba(255,255,255,0.5); display: flex; flex-direction: column; gap: 4px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; font-family: monospace;">
            <span>📍 Ubicac: ${inc.state}</span>
            <span>📋 Estatus: ${inc.resolved ? '🟢 RESUELTO' : '🔴 ACTIVO'}</span>
            <span>🛡️ Verif: ${inc.verified ? '🟢 VERIFICADO' : '🟡 PENDIENTE'}</span>
            ${inc.reporterContact ? `<span>📞 Tlf: ${inc.reporterContact}</span>` : ''}
          </div>
        </div>
      `;

      let marker = markersMapRef.current.get(inc.id);
      if (marker) {
        marker.setLatLng([inc.latitude, inc.longitude]);
        marker.setRadius(radius);
        marker.setStyle({
          fillColor: color,
          color: inc.verified ? '#4CAF50' : '#FF9800',
          weight: inc.resolved ? 1 : 3.5,
          fillOpacity: inc.resolved ? 0.2 : 0.8
        });
        marker.setPopupContent(popupContent);
      } else {
        marker = L.circleMarker([inc.latitude, inc.longitude], {
          radius: radius,
          fillColor: color,
          color: inc.verified ? '#4CAF50' : '#FF9800',
          weight: inc.resolved ? 1 : 3.5,
          fillOpacity: inc.resolved ? 0.2 : 0.8,
          className: inc.resolved ? '' : 'animate-pulse-map'
        });
        marker.bindPopup(popupContent, { autoClose: true, closeOnClick: false });
        marker.off('click').on('click', () => {
          marker?.openPopup();
        });
        markersGroupRef.current?.addLayer(marker);
        markersMapRef.current.set(inc.id, marker);
      }
    });
  }, [filteredIncidents, viewMode]);

  const handleToggleVerified = async (incidentId: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, 'incidents', incidentId);
      await updateDoc(docRef, { verified: !currentStatus });
    } catch (e) {
      console.error("Error updating verification status:", e);
    }
  };

  const handleToggleResolved = async (incidentId: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, 'incidents', incidentId);
      await updateDoc(docRef, { resolved: !currentStatus });
    } catch (e) {
      console.error("Error updating resolution status:", e);
    }
  };

  const handleDeleteIncident = async (incidentId: string) => {
    if (confirm("¿Está seguro de eliminar este reporte de crisis?")) {
      try {
        await deleteDoc(doc(db, 'incidents', incidentId));
      } catch (e) {
        console.error("Error deleting incident:", e);
      }
    }
  };

  return (
    <div className="space-y-4" id="incident-map-and-list-container">

      {/* Tab controls & View toggler */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-[#121212] to-[#0d0d0d] border border-white/10 rounded-xl p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#D32F2F]" /> REGIÓN SÍSMICA:
          </span>
          {(['Todos', 'Caracas', 'La Guaira', 'Aragua', 'Carabobo'] as const).map((st) => (
            <button
              key={st}
              onClick={() => onStateFilterChange(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all duration-200 border ${selectedStateFilter === st
                  ? 'bg-[#D32F2F] border-[#FF5252] text-white shadow-[0_0_10px_rgba(211,47,47,0.3)]'
                  : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* View Mode Swapper */}
        <div className="flex bg-black/60 border border-white/10 p-1 rounded-lg self-start xl:self-auto shadow-inner">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-mono font-bold uppercase transition-all duration-150 ${viewMode === 'list'
                ? 'bg-[#D32F2F] text-white shadow-[0_0_8px_rgba(211,47,47,0.25)]'
                : 'text-white/50 hover:text-white/80'
              }`}
            title="List View for 2G / Offline"
            id="view-list-btn"
          >
            <List className="w-4 h-4" />
            REPORTE RESILIENTE (2G)
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-mono font-bold uppercase transition-all duration-150 ${viewMode === 'map'
                ? 'bg-[#D32F2F] text-white shadow-[0_0_8px_rgba(211,47,47,0.25)]'
                : 'text-white/50 hover:text-white/80'
              }`}
            title="Interactive Map (Needs Network)"
            id="view-map-btn"
          >
            <MapIcon className="w-4 h-4" />
            MAPA TÁCTICO
          </button>
        </div>
      </div>

      {/* Secondary filter bar (Category & Verification Status) */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-black/30 border border-white/5 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white/50">
            <Filter className="w-3.5 h-3.5 text-[#FF9800]" />
            <span>CRITERIOS:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value as Incident['type'] | 'Todos')}
            className="bg-[#121212] border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#D32F2F] font-mono font-bold cursor-pointer"
          >
            <option value="Todos">TODAS LAS CATEGORÍAS</option>
            <option value="Rescate">🚨 RESCATE</option>
            <option value="Médico">🏥 MÉDICO</option>
            <option value="Fuga de Gas">🔥 FUGA DE GAS</option>
            <option value="Derrumbe">🧱 DERRUMBE</option>
            <option value="Otros">⚠️ OTROS</option>
          </select>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as any)}
            className="bg-[#121212] border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#D32F2F] font-mono font-bold cursor-pointer"
          >
            <option value="Todos">FILTRO DE VERIFICACIÓN</option>
            <option value="Verificados">🛡️ VERIFICACIÓN CONFIRMADA</option>
            <option value="No Verificados">⚠️ EVALUACIÓN PENDIENTE</option>
          </select>
        </div>

        <span className="text-xs text-white/40 font-mono font-bold">
          CONTEO LOCAL: <strong className="text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">{filteredIncidents.length}</strong> REGISTROS
        </span>
      </div>

      {/* Interactive Map View */}
      {viewMode === 'map' && (
        <div className="relative border border-white/10 rounded-xl overflow-hidden shadow-2xl bg-[#121212]" id="map-view-wrapper">
          <div id="map-element" className="w-full h-[450px] z-10" />

          <div className="absolute bottom-4 left-4 z-20 bg-black/90 border border-white/10 rounded-lg p-3.5 text-[10px] space-y-1.5 text-white/75 backdrop-blur-md shadow-2xl font-mono">
            <p className="font-bold text-white uppercase tracking-widest border-b border-white/10 pb-1.5 mb-2 font-display">SIMBOLOGÍA DE RIESGO</p>
            <p className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F] inline-block shadow-[0_0_6px_#D32F2F]" /> RESCATE / INMEDIATO</p>
            <p className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#2196F3] inline-block shadow-[0_0_6px_#2196F3]" /> ASISTENCIA MÉDICA</p>
            <p className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FF9800] inline-block shadow-[0_0_6px_#FF9800]" /> FUGA DE GAS</p>
            <p className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#9C27B0] inline-block shadow-[0_0_6px_#9C27B0]" /> COLAPSO / DERRUMBE</p>
            <p className="flex items-center gap-2 border-t border-white/10 pt-1.5 mt-2 text-[#4CAF50]"><span className="w-2.5 h-2.5 rounded-full border border-[#4CAF50] inline-block" /> VERIFICACIÓN CONFIRMADA</p>
          </div>
        </div>
      )}

      {/* Resilient List Grid View */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-fade-in" id="resilient-list-grid">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-16 bg-black/40 rounded-xl border border-white/5 text-white/40 font-mono">
              <p className="text-sm font-bold">REGISTRO SÍSMICO SIN DATOS FILTRADOS</p>
              <p className="text-xs text-white/30 mt-1.5">No se encontraron reportes con los criterios activos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIncidents.map((inc) => {
                let badgeColor = 'bg-[#D32F2F]/10 text-[#D32F2F] border-[#D32F2F]/20';
                if (inc.type === 'Médico') badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                if (inc.type === 'Fuga de Gas') badgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                if (inc.type === 'Derrumbe') badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';

                return (
                  <div
                    key={inc.id}
                    className={`bg-gradient-to-br from-[#121212] to-[#080808] border rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-all duration-300 ${inc.resolved ? 'border-white/5 opacity-50' : 'border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.4)]'
                      }`}
                  >
                    <div>
                      {/* Top Bar with Type and Severity Badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${badgeColor}`}>
                            {inc.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-mono bg-black/40 text-white/50 px-2 py-0.5 rounded border border-white/5">
                            CRIT {inc.severity}/5
                          </span>
                        </div>

                        {/* Resolve Badge */}
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border ${inc.resolved
                              ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20'
                              : 'bg-[#D32F2F]/10 text-[#D32F2F] border-[#D32F2F]/20 animate-pulse'
                            }`}
                        >
                          {inc.resolved ? 'RESUELTO' : 'ACTIVO'}
                        </span>
                      </div>

                      {/* Main Description */}
                      <p className="text-white font-medium text-sm mb-4 leading-relaxed tracking-wide">
                        {inc.description}
                      </p>

                      {/* Image Preview if uploaded */}
                      {((inc.mediaUrls && inc.mediaUrls.length > 0) || inc.mediaUrl) && (
                        <div className="mb-4 space-y-2 max-w-xs">
                          <p className="text-[10px] text-white/50 font-mono font-bold uppercase tracking-wider">
                            📷 EVIDENCIAS ({inc.mediaUrls ? inc.mediaUrls.length : 1})
                          </p>
                          <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 bg-black/40 rounded border border-white/5">
                            {(inc.mediaUrls && inc.mediaUrls.length > 0 ? inc.mediaUrls : [inc.mediaUrl!]).map((url, idxImg) => (
                              <button
                                key={idxImg}
                                type="button"
                                onClick={() => setLightbox({
                                  urls: inc.mediaUrls && inc.mediaUrls.length > 0 ? inc.mediaUrls : [inc.mediaUrl!],
                                  currentIndex: idxImg
                                })}
                                className="rounded overflow-hidden border border-white/10 bg-black shadow-inner block hover:opacity-90 transition-opacity aspect-square cursor-pointer p-0 group focus:outline-none"
                                title="Haga clic para ver imagen"
                              >
                                <img
                                  src={url}
                                  alt={`Evidencia ${idxImg + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                                  referrerPolicy="no-referrer"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Audio Opus Preview if recorded */}
                      {inc.audioUrl && (
                        <div className="mb-4 bg-black/50 border border-red-500/30 p-2.5 rounded-lg flex flex-col gap-1 font-mono">
                          <span className="text-[10px] text-red-400 font-bold flex items-center gap-1.5">
                            🎙️ MINUTA DE VOZ CRÍTICA (~4KB OPUS)
                          </span>
                          <audio controls src={inc.audioUrl} className="w-full h-8 mt-1" />
                        </div>
                      )}

                      {/* Info lines (Proximity / Coordinates) */}
                      <div className="space-y-2 border-t border-white/5 pt-3.5 text-xs font-mono text-white/50">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#D32F2F]" />
                          <span>COORDENADAS: <strong className="text-white">{inc.state}</strong> ({inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-white/30" />
                          <span>REGISTRO: <strong className="text-white/80">{new Date(inc.createdAt).toLocaleTimeString('es-VE')} - {new Date(inc.createdAt).toLocaleDateString('es-VE')}</strong></span>
                        </div>
                        {inc.reporterContact && (
                          <div className="flex items-center gap-2 text-[#FF9800] bg-[#FF9800]/10 px-2.5 py-1.5 rounded border border-[#FF9800]/20 mt-2 max-w-fit">
                            <Phone className="w-3.5 h-3.5" />
                            <span>CONTACTO DE EMERGENCIA: <strong>{inc.reporterContact}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Verification and Admin Actions footer */}
                    <div className="mt-5 border-t border-white/5 pt-3.5 flex flex-wrap items-center justify-between gap-3">

                      {/* Verification Status Banner */}
                      <div className="flex items-center gap-1.5">
                        {inc.verified ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-[#4CAF50]/10 text-[#4CAF50] px-2.5 py-1 rounded border border-[#4CAF50]/20 font-bold uppercase select-none">
                            <Check className="w-3.5 h-3.5" /> VERIFICACIÓN CONFIRMADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-[#FF9800]/10 text-[#FF9800] px-2.5 py-1 rounded border border-[#FF9800]/20 font-bold uppercase select-none">
                            <ShieldAlert className="w-3.5 h-3.5" /> EVALUACIÓN PENDIENTE
                          </span>
                        )}
                      </div>

                      {/* Admin/Volunteer Verified Powers */}
                      {isVolunteerVerified && (
                        <div className="flex items-center gap-2" id={`volunteer-actions-${inc.id}`}>
                          {/* Toggle Verified */}
                          <button
                            onClick={() => handleToggleVerified(inc.id, inc.verified)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${inc.verified
                                ? 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                                : 'bg-[#4CAF50] text-black border-[#4CAF50]'
                              }`}
                          >
                            {inc.verified ? 'DES-VERIFICAR' : 'VERIFICAR'}
                          </button>

                          {/* Toggle Resolved */}
                          <button
                            onClick={() => handleToggleResolved(inc.id, inc.resolved)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${inc.resolved
                                ? 'bg-zinc-800 text-zinc-300 border-white/10'
                                : 'bg-blue-600 text-white border-blue-500'
                              }`}
                          >
                            {inc.resolved ? 'REABRIR' : 'RESOLVER'}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteIncident(inc.id)}
                            className="p-2 bg-[#D32F2F]/10 hover:bg-[#D32F2F]/30 text-[#D32F2F] border border-[#D32F2F]/20 rounded-lg hover:border-[#D32F2F] transition-all cursor-pointer"
                            title="Eliminar reporte de crisis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          urls={lightbox.urls}
          initialIndex={lightbox.currentIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
