import React, { useState, useEffect, Suspense } from 'react';
import { collection, query, onSnapshot, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Incident } from './types';
import type { VolunteerRole } from './components/VolunteerVerification';
import ModuleSkeleton from './components/ModuleSkeleton';
const ReportForm = React.lazy(() => import('./components/ReportForm'));
const MapViewer = React.lazy(() => import('./components/MapViewer'));
const PeopleSearch = React.lazy(() => import('./components/PeopleSearch'));
const SurvivalSection = React.lazy(() => import('./components/SurvivalSection'));
const VolunteerVerification = React.lazy(() => import('./components/VolunteerVerification'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const SheltersModule = React.lazy(() => import('./components/SheltersModule'));
const BloodDonorsModule = React.lazy(() => import('./components/BloodDonorsModule'));
const HospitalPatientsModule = React.lazy(() => import('./components/HospitalPatientsModule'));
const ReportsConsoleModule = React.lazy(() => import('./components/ReportsConsoleModule').then(m => ({ default: m.ReportsConsoleModule })));
const ShelterTacticalMap = React.lazy(() => import('./components/ShelterTacticalMap'));
const ShelterRequestsDashboard = React.lazy(() => import('./components/ShelterRequestsDashboard'));
const EvacuationRoutesPanel = React.lazy(() => import('./components/EvacuationRoutesPanel'));
const TriageModule = React.lazy(() => import('./components/TriageModule'));
const CascadeTimeline = React.lazy(() => import('./components/CascadeTimeline'));
const SearchAndRescueModule = React.lazy(() => import('./components/SearchAndRescueModule'));
const SupplyLogisticsModule = React.lazy(() => import('./components/SupplyLogisticsModule'));
const EOCDashboard = React.lazy(() => import('./components/EOCDashboard'));
const WaterSanitationModule = React.lazy(() => import('./components/WaterSanitationModule'));
const DeceasedManagementModule = React.lazy(() => import('./components/DeceasedManagementModule'));
const PsychosocialModule = React.lazy(() => import('./components/PsychosocialModule'));
const EmergencyCommsModule = React.lazy(() => import('./components/EmergencyCommsModule'));
const VolunteerDonationsModule = React.lazy(() => import('./components/VolunteerDonationsModule'));
const InteragencyModule = React.lazy(() => import('./components/InteragencyModule'));
const AerialOpsModule = React.lazy(() => import('./components/AerialOpsModule'));
const FuelEnergyModule = React.lazy(() => import('./components/FuelEnergyModule'));
import ErrorBoundary from './components/ErrorBoundary';
import { 
  ShieldAlert, Wifi, WifiOff, Activity, AlertTriangle, Heart, Compass,
  ShieldCheck, Clock, Database, MapPin, Flame, UserCheck, Building,
  Sun, Moon, Send, Share2, Check, Droplet, Printer, Crosshair,
  Route, HeartPulse, LayoutDashboard, Search, Package, Droplets,
  HeartOff, Radio, Users, GitMerge, Plane, Fuel
} from 'lucide-react';

export default function App() {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareApp = async () => {
    const shareData = {
      title: 'SISMOVZLA - Plataforma Civil de Contingencia',
      text: 'Plataforma táctica ciudadana para reporte de daños por sismos, refugios seguros y búsqueda de desaparecidos en Venezuela.',
      url: 'https://sismovzla.web.app'
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText('https://sismovzla.web.app');
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      } catch (e) {
        alert('Enlace oficial de contingencia: https://sismovzla.web.app');
      }
    }
  };

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [volunteerRole, setVolunteerRole] = useState<VolunteerRole>('none');
  const isVolunteerVerified = volunteerRole !== 'none';
  const [selectedStateFilter, setSelectedStateFilter] = useState<Incident['state'] | 'Todos'>('Todos');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isDirectFullMap = typeof window !== 'undefined' && (
    window.location.search.includes('mapa=completo') || 
    window.location.search.includes('mapa=tactico') ||
    window.location.search.includes('fullscreen=true') || 
    window.location.hash === '#mapa-completo'
  );

  type TabKey = 'map_reports' | 'report_form' | 'survival_guides' | 'missing_search' | 'shelters'
    | 'shelter_tactical' | 'blood_donors' | 'hospital_patients' | 'reports_console' | 'volunteer_gate'
    | 'evacuation_routes' | 'triage' | 'cascade_events' | 'search_rescue' | 'supply_logistics'
    | 'eoc' | 'water_sanitation' | 'deceased' | 'psychosocial' | 'comms'
    | 'volunteers' | 'interagency' | 'aerial_ops' | 'fuel_energy';

  const [activeTab, setActiveTab] = useState<TabKey>('map_reports');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('sismovzla_light_mode') === 'true');

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('sismovzla_light_mode', 'true');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('sismovzla_light_mode', 'false');
    }
  }, [isLightMode]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-VE', { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedRole = localStorage.getItem('sismovzla_volunteer_role') as VolunteerRole;
    if (savedRole && ['volunteer', 'operator', 'admin', 'shelter_coordinator', 'triage_medico', 'rescate_coord', 'logistica_admin', 'radio_op', 'forense', 'psicosocial', 'aereo_coord'].includes(savedRole)) {
      setVolunteerRole(savedRole);
    } else if (localStorage.getItem('sismovzla_volunteer_mode') === 'true') {
      setVolunteerRole('operator');
    }
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('[SismoVZLA PWA] Service Worker registrado.', reg))
          .catch((err) => console.error('[SismoVZLA PWA] Error SW:', err));
      });
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncOfflineQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) syncOfflineQueue();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('sismovzla_offline_incidents') || '[]');
    if (queue.length === 0) return;
    setSyncMessage(`CONEXIÓN DETECTADA: Sincronizando ${queue.length} reportes en cola offline...`);
    let successCount = 0;
    for (const report of queue) {
      try { await addDoc(collection(db, 'incidents'), report); successCount++; }
      catch (err) { console.error("Error al sincronizar reporte offline:", err); }
    }
    if (successCount > 0) {
      setSyncMessage(`CONEXIÓN RESTABLECIDA: ${successCount} reportes transmitidos al servidor de crisis.`);
      setTimeout(() => setSyncMessage(null), 6000);
      localStorage.removeItem('sismovzla_offline_incidents');
    } else setSyncMessage(null);
  };

  useEffect(() => {
    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(150));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Incident[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Incident));
      setIncidents(list);
    }, (error) => console.warn("Firestore listener fallback to IndexedDB cache:", error));
    return () => unsubscribe();
  }, []);

  const totalActive = incidents.filter(i => !i.resolved).length;
  const totalVerified = incidents.filter(i => i.verified && !i.resolved).length;
  const totalByState = (st: Incident['state']) => incidents.filter(i => i.state === st && !i.resolved).length;

  const tabLabel = (key: TabKey) => {
    const labels: Record<TabKey, string> = {
      eoc: '00 · Centro de Operaciones', map_reports: '01 · Mapa de Incidentes',
      report_form: '02 · Formulario de Reporte', missing_search: '03 · Búsqueda de Personas',
      shelters: '04 · Directorio de Refugios', shelter_tactical: '05 · Mapa Táctico de Refugios',
      survival_guides: '06 · Auxilios & Directorio de Emergencia', blood_donors: '07 · Banco de Sangre',
      hospital_patients: '08 · Registro Hospitalario', reports_console: '09 · Consola de Reportes',
      volunteer_gate: 'ADM · Panel de Coordinación', evacuation_routes: '10 · Vías y Rutas',
      triage: '11 · Triaje de Víctimas', cascade_events: '12 · Eventos en Cascada',
      search_rescue: '13 · Búsqueda y Rescate', supply_logistics: '14 · Logística',
      water_sanitation: '15 · Agua y Saneamiento', deceased: '16 · Gestión de Fallecidos',
      psychosocial: '17 · Apoyo Psicosocial', comms: '18 · Comunicaciones',
      volunteers: '19 · Voluntarios', interagency: '20 · Coordinación Interagencial',
      aerial_ops: '21 · Operaciones Aéreas', fuel_energy: '22 · Combustible y Energía',
    };
    return labels[key] || key;
  };

  const renderTab = (key: TabKey, label: string, icon: React.ReactNode, activeColor: string, glowColor: string, show: boolean = true) => {
    if (!show) return null;
    return (
      <button key={key} onClick={() => setActiveTab(key)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono font-bold text-xs tracking-tight whitespace-nowrap transition-all duration-200 cursor-pointer border ${
          activeTab === key
            ? `${activeColor} text-white shadow-[0_0_14px_${glowColor}] ${glowColor.includes('40') ? 'border-transparent' : ''} scale-[1.02]`
            : 'bg-white/5 text-white/65 hover:text-white hover:bg-white/10 border-white/5 hover:border-white/15'
        }`}>
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  const isOp = volunteerRole === 'operator' || volunteerRole === 'admin' || volunteerRole === 'triage_medico' || volunteerRole === 'rescate_coord' || volunteerRole === 'logistica_admin' || volunteerRole === 'radio_op' || volunteerRole === 'forense' || volunteerRole === 'psicosocial' || volunteerRole === 'aereo_coord';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#D32F2F] selection:text-white overflow-x-hidden" id="sismovzla-app">
      
      {/* TOP URGENCY BAR */}
      <div className="bg-[#D32F2F] flex items-center justify-between px-4 py-2.5 sm:px-6 border-b border-[#FF5252] shadow-[0_0_20px_rgba(211,47,47,0.4)] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span className="font-display font-black uppercase tracking-[0.15em] text-[10px] sm:text-xs">
            ESTADO: CRÍTICO / DESPLIEGUE DE EMERGENCIA
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px] sm:text-xs font-mono font-bold">
          <span className="hidden lg:inline text-white/90">EJE CENTRAL: CARACAS / LA GUAIRA / ARAGUA / CARABOBO</span>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 bg-black/30 text-[#4CAF50] px-2.5 py-1 rounded border border-[#4CAF50]/30">
                <Wifi className="w-3 h-3" /> CONECTADO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-black/40 text-[#FF9800] px-2.5 py-1 rounded border border-[#FF9800]/30 animate-pulse">
                <WifiOff className="w-3 h-3" /> OFFLINE
              </span>
            )}
            {isVolunteerVerified && (
              <span className="inline-flex items-center gap-1 bg-black/40 text-blue-400 px-2.5 py-1 rounded border border-blue-500/30">
                <ShieldCheck className="w-3 h-3" /> COORDINACIÓN
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-br from-[#121212] to-[#050505] border-b border-white/10 py-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-[#D32F2F] rounded-xl text-white shadow-[0_0_15px_rgba(211,47,47,0.4)]">
              <Activity className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter text-white">SISMOVZLA</h1>
                <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded font-mono font-bold border border-white/10">PWA v2.0</span>
                <button onClick={() => setIsLightMode(!isLightMode)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isLightMode ? 'bg-amber-400 text-black border-amber-500 shadow-md' : 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20'
                  }`}>
                  {isLightMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 animate-spin-slow" />}
                  {isLightMode ? 'MODO NOCTURNO' : 'VERSIÓN CLARA'}
                </button>
                <a href="https://t.me/+q9ScOcEulV9kY2Q5" target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1 bg-[#229ED9] hover:bg-[#1E8BC0] text-white border border-[#229ED9]/50 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
                  <Send className="w-3.5 h-3.5" /> GRUPO TELEGRAM
                </a>
                <button onClick={handleShareApp}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copiedLink ? '¡ENLACE COPIADO!' : 'COMPARTIR APP'}
                </button>
              </div>
              <p className="text-xs text-white/50 mt-1 max-w-xl leading-relaxed">
                Plataforma de contingencia civil para reporte táctico de daños, mapeo de riesgos en tiempo real y localización de heridos o desaparecidos. Optimizado para transmisión en redes degradadas 2G/EDGE.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
            <div className="text-left md:text-right font-mono bg-black/30 border border-white/5 p-3 rounded-lg min-w-[140px]">
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">HORA OFICIAL VZLA</p>
              <p className="text-lg font-bold text-[#4CAF50]">{currentTime || '00:00:00'}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto" id="mini-metrics">
              <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center min-w-[85px] shadow-sm">
                <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold">ACTIVOS</p>
                <p className="text-xl font-mono font-bold text-[#D32F2F]">{totalActive}</p>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center min-w-[85px] shadow-sm">
                <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold">VERIFICADOS</p>
                <p className="text-xl font-mono font-bold text-[#4CAF50]">{totalVerified}</p>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center min-w-[85px] shadow-sm">
                <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold">CARACAS</p>
                <p className="text-xl font-mono font-bold text-white/80">{totalByState('Caracas')}</p>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-white/10 text-center min-w-[85px] shadow-sm">
                <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold">ARAGUA</p>
                <p className="text-xl font-mono font-bold text-white/80">{totalByState('Aragua')}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {syncMessage && (
        <div className="bg-[#D32F2F] text-white font-mono font-bold text-xs py-2.5 px-4 text-center border-b border-[#FF5252] shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] animate-pulse" id="sync-banner">
          {syncMessage}
        </div>
      )}

      {/* Navigation */}
      <nav className="border-b border-white/10 bg-zinc-950/90 sticky top-[49px] sm:top-[51px] z-40 backdrop-blur-xl shadow-lg">
        <div className="max-w-7xl mx-auto px-2 md:px-4 py-2">
          <div className="flex flex-wrap gap-1.5">
            {renderTab('eoc', 'EOC', <LayoutDashboard className="w-4 h-4 shrink-0" />, 'bg-red-800', 'rgba(220,38,38,0.45)', isOp)}
            {renderTab('map_reports', 'MAPA TÁCTICO', <Clock className="w-4 h-4 shrink-0" />, 'bg-red-600', 'rgba(220,38,38,0.45)')}
            {renderTab('cascade_events', 'CASCADA', <Flame className="w-4 h-4 shrink-0" />, 'bg-orange-600', 'rgba(234,88,12,0.45)')}
            {renderTab('triage', 'TRIAJE', <HeartPulse className="w-4 h-4 shrink-0" />, 'bg-rose-600', 'rgba(225,29,72,0.45)')}
            {renderTab('evacuation_routes', 'VÍAS', <Route className="w-4 h-4 shrink-0" />, 'bg-emerald-700', 'rgba(5,150,105,0.45)')}
            {renderTab('search_rescue', 'RESCATE', <Search className="w-4 h-4 shrink-0" />, 'bg-blue-700', 'rgba(29,78,216,0.45)', isOp)}
            {renderTab('report_form', 'REPORTAR', <AlertTriangle className="w-4 h-4 shrink-0" />, 'bg-amber-500', 'rgba(245,158,11,0.4)')}
            {renderTab('missing_search', 'PERSONAS', <Heart className="w-4 h-4 shrink-0" />, 'bg-rose-600', 'rgba(225,29,72,0.4)')}
            {renderTab('shelters', 'REFUGIOS', <Building className="w-4 h-4 shrink-0" />, 'bg-teal-600', 'rgba(13,148,136,0.4)')}
            {renderTab('shelter_tactical', 'MAPA REFUGIOS', <Crosshair className="w-4 h-4 shrink-0" />, 'bg-emerald-700', 'rgba(5,150,105,0.4)')}
            {renderTab('supply_logistics', 'LOGÍSTICA', <Package className="w-4 h-4 shrink-0" />, 'bg-emerald-600', 'rgba(5,150,105,0.4)', isOp)}
            {renderTab('water_sanitation', 'AGUA', <Droplets className="w-4 h-4 shrink-0" />, 'bg-sky-700', 'rgba(3,105,161,0.4)')}
            {renderTab('comms', 'RADIO', <Radio className="w-4 h-4 shrink-0" />, 'bg-amber-700', 'rgba(180,83,9,0.4)')}
            {renderTab('fuel_energy', 'COMBUSTIBLE', <Fuel className="w-4 h-4 shrink-0" />, 'bg-yellow-700', 'rgba(161,98,7,0.4)')}
            {renderTab('aerial_ops', 'AÉREO', <Plane className="w-4 h-4 shrink-0" />, 'bg-sky-600', 'rgba(2,132,199,0.4)', isOp)}
            {renderTab('interagency', 'INTERAGENCIAL', <GitMerge className="w-4 h-4 shrink-0" />, 'bg-violet-700', 'rgba(109,40,217,0.4)', isOp)}
            {renderTab('deceased', 'FALLECIDOS', <HeartOff className="w-4 h-4 shrink-0" />, 'bg-gray-700', 'rgba(75,85,99,0.4)', isOp)}
            {renderTab('psychosocial', 'PSICOSOCIAL', <Heart className="w-4 h-4 shrink-0" />, 'bg-pink-700', 'rgba(159,18,57,0.4)')}
            {renderTab('volunteers', 'VOLUNTARIOS', <Users className="w-4 h-4 shrink-0" />, 'bg-blue-600', 'rgba(37,99,235,0.4)')}
            {renderTab('survival_guides', 'AUXILIOS', <Compass className="w-4 h-4 shrink-0" />, 'bg-emerald-600', 'rgba(5,150,105,0.4)')}
            {renderTab('blood_donors', 'SANGRE', <Droplet className="w-4 h-4 shrink-0" />, 'bg-red-700', 'rgba(185,28,28,0.4)')}
            {renderTab('hospital_patients', 'HOSPITALES', <Activity className="w-4 h-4 shrink-0" />, 'bg-amber-600', 'rgba(217,119,6,0.4)')}
            {renderTab('reports_console', 'REPORTES', <Printer className="w-4 h-4 shrink-0" />, 'bg-violet-600', 'rgba(139,92,246,0.4)')}
            <div className="flex-1 hidden sm:block" />
            {renderTab('volunteer_gate', 'COORDINADOR', <ShieldCheck className="w-4 h-4 shrink-0" />, 'bg-blue-600', 'rgba(37,99,235,0.4)')}
          </div>
          <div className="mt-1.5 flex items-center gap-2 px-0.5">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[9px] font-mono text-white/25 uppercase tracking-widest">{tabLabel(activeTab)}</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6" id="main-content-area">
        <ErrorBoundary>
          <Suspense fallback={<ModuleSkeleton tabKey={activeTab} label={tabLabel(activeTab)} />}>
        
        {!isOnline && (
          <div className="bg-[#FF9800]/10 border border-[#FF9800]/30 rounded-xl p-5 flex gap-4 items-start shadow-[0_0_15px_rgba(255,152,0,0.1)]">
            <WifiOff className="w-6 h-6 text-[#FF9800] shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-mono font-bold text-[#FF9800] text-sm uppercase">CONEXIÓN RED: DEGRADADA / INOPERATIVA</h4>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                Su terminal está operando localmente. Toda la base de datos táctica se lee y escribe directamente en su dispositivo. El envío de reportes guardará los datos de inmediato en la cola de contingencia local, retransmitiéndose automáticamente tan pronto se detecte red móvil o canal alternativo.
              </p>
            </div>
          </div>
        )}

        {/* Tab Routing */}
        {activeTab === 'eoc' && isOp && <EOCDashboard />}

        {activeTab === 'map_reports' && (
          <div className="space-y-6 animate-fade-in" id="tab-monitoring">
            <div className="bg-[#121212] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#4CAF50] rounded-full animate-pulse"></span>
                  CONSOLA DE MONITOREO DE CRISIS
                </h2>
                <p className="text-xs text-white/50 mt-1">Monitoreo de coordenadas críticas e infraestructura en el Eje Central.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="bg-black/40 px-3 py-1.5 rounded border border-white/10 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D32F2F]" /> CCS: <strong className="text-white">{totalByState('Caracas')}</strong>
                </span>
                <span className="bg-black/40 px-3 py-1.5 rounded border border-white/10 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D32F2F]" /> LGU: <strong className="text-white">{totalByState('La Guaira')}</strong>
                </span>
                <span className="bg-black/40 px-3 py-1.5 rounded border border-white/10 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D32F2F]" /> ARA: <strong className="text-white">{totalByState('Aragua')}</strong>
                </span>
                <span className="bg-black/40 px-3 py-1.5 rounded border border-white/10 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D32F2F]" /> CAR: <strong className="text-white">{totalByState('Carabobo')}</strong>
                </span>
              </div>
            </div>
            <MapViewer incidents={incidents} isVolunteerVerified={isVolunteerVerified}
              selectedStateFilter={selectedStateFilter} onStateFilterChange={setSelectedStateFilter}
              initialFullScreen={isDirectFullMap} />
          </div>
        )}

        {activeTab === 'cascade_events' && <CascadeTimeline />}

        {activeTab === 'triage' && <TriageModule />}

        {activeTab === 'evacuation_routes' && <EvacuationRoutesPanel />}

        {activeTab === 'search_rescue' && isOp && <SearchAndRescueModule />}

        {activeTab === 'report_form' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" id="tab-report-form">
            <div className="text-center bg-[#121212]/50 border border-white/5 p-6 rounded-2xl">
              <h2 className="text-2xl font-display font-black text-white uppercase tracking-wide">CANALIZACIÓN DE EMERGENCIAS</h2>
              <p className="text-xs text-white/50 mt-1 max-w-lg mx-auto leading-relaxed">Reporte de riesgos y salvamento. Esta información alimenta el mapa táctico de rescate de manera directa. No requiere Internet para encolar datos.</p>
            </div>
            <ReportForm userId="Anon" onReportSuccess={() => setActiveTab('map_reports')} />
          </div>
        )}

        {activeTab === 'missing_search' && (
          <PeopleSearch isVolunteerVerified={isVolunteerVerified} userId="Anon" />
        )}

        {activeTab === 'shelters' && (
          <div className="space-y-6 animate-fade-in" id="tab-shelters">
            <SheltersModule isVolunteerVerified={isVolunteerVerified} role={volunteerRole} userId="Ciudadano" />
            {volunteerRole === 'shelter_coordinator' && (
              <ShelterRequestsDashboard role={volunteerRole} userId="CoordRefugio" />
            )}
          </div>
        )}

        {activeTab === 'shelter_tactical' && <ShelterTacticalMap />}

        {activeTab === 'supply_logistics' && isOp && <SupplyLogisticsModule />}

        {activeTab === 'water_sanitation' && <WaterSanitationModule />}

        {activeTab === 'comms' && <EmergencyCommsModule />}

        {activeTab === 'fuel_energy' && <FuelEnergyModule />}

        {activeTab === 'aerial_ops' && isOp && <AerialOpsModule />}

        {activeTab === 'interagency' && isOp && <InteragencyModule />}

        {activeTab === 'deceased' && isOp && <DeceasedManagementModule />}

        {activeTab === 'psychosocial' && <PsychosocialModule />}

        {activeTab === 'volunteers' && <VolunteerDonationsModule />}

        {activeTab === 'survival_guides' && <SurvivalSection />}

        {activeTab === 'blood_donors' && (
          <BloodDonorsModule isVolunteerVerified={isVolunteerVerified} role={volunteerRole} />
        )}

        {activeTab === 'hospital_patients' && (
          <HospitalPatientsModule isVerified={isVolunteerVerified} role={volunteerRole} />
        )}

        {activeTab === 'reports_console' && (
          <ReportsConsoleModule incidents={incidents} isVerified={isVolunteerVerified} role={volunteerRole} />
        )}

        {activeTab === 'volunteer_gate' && (
          <div className={`${isVolunteerVerified ? 'w-full' : 'max-w-2xl mx-auto'} space-y-6 animate-fade-in`} id="tab-coordinacion">
            <VolunteerVerification role={volunteerRole} onRoleChange={setVolunteerRole} />
            {isVolunteerVerified && (
              <>
                {volunteerRole === 'shelter_coordinator' && (
                  <ShelterRequestsDashboard role={volunteerRole} userId="CoordRefugio" />
                )}
                {(volunteerRole === 'operator' || volunteerRole === 'admin') && (
                  <AdminPanel incidents={incidents} isVerified={isVolunteerVerified} role={volunteerRole} />
                )}
              </>
            )}
          </div>
        )}

        </Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050505] py-10 px-4 mt-12 text-center" id="sismovzla-footer">
        <div className="max-w-7xl mx-auto space-y-4">
          <p className="text-xs text-white/40 max-w-2xl mx-auto leading-relaxed">
            SismoVZLA es un nodo civil y humanitario de contingencia abierta para canalizar recursos críticos de información tras catástrofes sísmicas. Desplegado en modo resiliente de máxima tolerancia a fallas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono font-bold text-white/30">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#4CAF50]" /> MODO CONEXIÓN RESILIENTE</span>
            <span>•</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" /> COLA DISCO LOCAL ACTIVA (INDEXEDDB)</span>
            <span>•</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> COORDINACIÓN DE CRISIS EN CURSO</span>
          </div>
          <div className="flex justify-center items-center gap-1.5 text-xs text-white/40">
            <Database className="w-4 h-4 text-white/30" />
            <span className="font-mono">PWA PERSISTENCIA OFF-LINE ACTIVA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
