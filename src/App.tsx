import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Incident } from './types';
import ReportForm from './components/ReportForm';
import MapViewer from './components/MapViewer';
import PeopleSearch from './components/PeopleSearch';
import SurvivalSection from './components/SurvivalSection';
import VolunteerVerification, { VolunteerRole } from './components/VolunteerVerification';
import AdminPanel from './components/AdminPanel';
import SheltersModule from './components/SheltersModule';
import BloodDonorsModule from './components/BloodDonorsModule';
import HospitalPatientsModule from './components/HospitalPatientsModule';
import { 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  Activity, 
  AlertTriangle, 
  Heart, 
  Compass, 
  ShieldCheck, 
  Clock, 
  Database,
  MapPin,
  Flame,
  UserCheck,
  Building,
  Sun,
  Moon,
  Send,
  Share2,
  Check,
  Droplet
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
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user cancelled share
      }
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
  const [activeTab, setActiveTab] = useState<'map_reports' | 'report_form' | 'survival_guides' | 'missing_search' | 'shelters' | 'blood_donors' | 'hospital_patients' | 'volunteer_gate'>('map_reports');
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

  // Live Tactical Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-VE', { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load Volunteer Role from LocalStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('sismovzla_volunteer_role') as VolunteerRole;
    if (savedRole && ['volunteer', 'operator', 'admin'].includes(savedRole)) {
      setVolunteerRole(savedRole);
    } else if (localStorage.getItem('sismovzla_volunteer_mode') === 'true') {
      setVolunteerRole('operator');
    }
  }, []);

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('[SismoVZLA PWA] Service Worker registrado con éxito.', reg);
          })
          .catch((err) => {
            console.error('[SismoVZLA PWA] Error al registrar Service Worker:', err);
          });
      });
    }
  }, []);

  // Track Network Online/Offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Offline Queue automatically
  const syncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('sismovzla_offline_incidents') || '[]');
    if (queue.length === 0) return;

    setSyncMessage(`CONEXIÓN DETECTADA: Sincronizando ${queue.length} reportes en cola offline...`);

    let successCount = 0;
    for (const report of queue) {
      try {
        await addDoc(collection(db, 'incidents'), report);
        successCount++;
      } catch (err) {
        console.error("Error al sincronizar reporte offline:", err);
      }
    }

    if (successCount > 0) {
      setSyncMessage(`CONEXIÓN RESTABLECIDA: ${successCount} reportes transmitidos al servidor de crisis.`);
      setTimeout(() => setSyncMessage(null), 6000);
      localStorage.removeItem('sismovzla_offline_incidents');
    } else {
      setSyncMessage(null);
    }
  };

  // Real-Time Firestore listener for incidents
  useEffect(() => {
    const q = query(
      collection(db, 'incidents'),
      orderBy('createdAt', 'desc'),
      limit(150)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Incident[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Incident);
      });
      setIncidents(list);
    }, (error) => {
      console.warn("Firestore listener fallback to IndexedDB cache:", error);
    });

    return () => unsubscribe();
  }, []);

  // Compute stats for Central Axis
  const totalActive = incidents.filter(i => !i.resolved).length;
  const totalVerified = incidents.filter(i => i.verified && !i.resolved).length;
  const totalByState = (st: Incident['state']) => incidents.filter(i => i.state === st && !i.resolved).length;

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
            {/* Network indicator */}
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

      {/* Main Branding Header */}
      <header className="bg-gradient-to-br from-[#121212] to-[#050505] border-b border-white/10 py-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-[#D32F2F] rounded-xl text-white shadow-[0_0_15px_rgba(211,47,47,0.4)]">
              <Activity className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter text-white">SISMOVZLA</h1>
                <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded font-mono font-bold border border-white/10">PWA v1.2</span>
                <button
                  onClick={() => setIsLightMode(!isLightMode)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isLightMode 
                      ? 'bg-amber-400 text-black border-amber-500 shadow-md' 
                      : 'bg-white/10 text-amber-300 border-white/20 hover:bg-white/20'
                  }`}
                  title={isLightMode ? 'Cambiar a Modo Nocturno Táctico' : 'Cambiar a Versión Clara Diurna'}
                >
                  {isLightMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 animate-spin-slow" />}
                  {isLightMode ? 'MODO NOCTURNO' : 'VERSIÓN CLARA'}
                </button>

                <a
                  href="https://t.me/+q9ScOcEulV9kY2Q5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-[#229ED9] hover:bg-[#1E8BC0] text-white border border-[#229ED9]/50 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="Unirse al canal oficial de coordinación comunitaria en Telegram"
                >
                  <Send className="w-3.5 h-3.5" />
                  GRUPO TELEGRAM
                </a>

                <button
                  onClick={handleShareApp}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  title="Compartir o copiar enlace oficial de la PWA"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copiedLink ? '¡ENLACE COPIADO!' : 'COMPARTIR APP'}
                </button>
              </div>
              <p className="text-xs text-white/50 mt-1 max-w-xl leading-relaxed">
                Plataforma de contingencia civil para reporte táctico de daños, mapeo de riesgos en tiempo real y localización de heridos o desaparecidos. Optimizado para transmisión en redes degradadas 2G/EDGE.
              </p>
            </div>
          </div>

          {/* Tactical Clock & Summary Cards */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-4">
            <div className="text-left md:text-right font-mono bg-black/30 border border-white/5 p-3 rounded-lg min-w-[140px]">
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">HORA OFICIAL VZLA</p>
              <p className="text-lg font-bold text-[#4CAF50]">{currentTime || '00:00:00'}</p>
            </div>

            {/* Quick Metrics Dashboard */}
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

      {/* Sync Banner Notification */}
      {syncMessage && (
        <div className="bg-[#D32F2F] text-white font-mono font-bold text-xs py-2.5 px-4 text-center border-b border-[#FF5252] shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] animate-pulse" id="sync-banner">
          {syncMessage}
        </div>
      )}

      {/* Primary HUD Navigation Tabs */}
      <nav className="border-b border-white/10 bg-black/40 sticky top-[49px] sm:top-[51px] z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-2 flex items-center justify-start xl:justify-center overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('map_reports')}
            className={`py-3.5 px-2.5 md:px-3.5 border-b-2 font-mono font-bold text-[11px] md:text-xs uppercase tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'map_reports'
                ? 'border-[#D32F2F] text-white bg-white/5 shadow-[inset_0_-4px_10px_rgba(211,47,47,0.15)]'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4 text-[#D32F2F] shrink-0" />
            [01] MONITOREO
          </button>

          <button
            onClick={() => setActiveTab('report_form')}
            className={`py-3.5 px-2.5 md:px-3.5 border-b-2 font-mono font-bold text-[11px] md:text-xs uppercase tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'report_form'
                ? 'border-[#D32F2F] text-white bg-white/5 shadow-[inset_0_-4px_10px_rgba(211,47,47,0.15)]'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-[#FF9800] shrink-0" />
            [02] NUEVO REPORTE
          </button>

          <button
            onClick={() => setActiveTab('missing_search')}
            className={`py-3.5 px-2.5 md:px-3.5 border-b-2 font-mono font-bold text-[11px] md:text-xs uppercase tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'missing_search'
                ? 'border-[#D32F2F] text-white bg-white/5 shadow-[inset_0_-4px_10px_rgba(211,47,47,0.15)]'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Heart className="w-4 h-4 text-red-400 shrink-0" />
            [03] BUSCAR PERSONAS
          </button>

          <button
            onClick={() => setActiveTab('survival_guides')}
            className={`py-3.5 px-2.5 md:px-3.5 border-b-2 font-mono font-bold text-[11px] md:text-xs uppercase tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'survival_guides'
                ? 'border-[#D32F2F] text-white bg-white/5 shadow-[inset_0_-4px_10px_rgba(211,47,47,0.15)]'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-4 h-4 text-[#4CAF50] shrink-0" />
            [04] AUXILIOS OFF-LINE
          </button>

          <button
            onClick={() => setActiveTab('shelters')}
            className={`py-3.5 px-2.5 md:px-3.5 border-b-2 font-mono font-bold text-[11px] md:text-xs uppercase tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'shelters'
                ? 'border-[#D32F2F] text-white bg-white/5 shadow-[inset_0_-4px_10px_rgba(211,47,47,0.15)]'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building className="w-4 h-4 text-emerald-400 shrink-0" />
            [05] REFUGIOS & ACOPIO
          </button>

          <button
            onClick={() => setActiveTab('blood_donors')}
            className={`py-3.5 px-2.5 md:px-3.5 border-b-2 font-mono font-bold text-[11px] md:text-xs uppercase tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'blood_donors'
                ? 'border-[#D32F2F] text-white bg-white/5 shadow-[inset_0_-4px_10px_rgba(211,47,47,0.15)]'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Droplet className="w-4 h-4 text-red-500 shrink-0" />
            [06] BANCO DE SANGRE
          </button>

          <button
            onClick={() => setActiveTab('hospital_patients')}
            className={`py-3.5 px-2.5 md:px-3.5 border-b-2 font-mono font-bold text-[11px] md:text-xs uppercase tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'hospital_patients'
                ? 'border-[#D32F2F] text-white bg-white/5 shadow-[inset_0_-4px_10px_rgba(211,47,47,0.15)]'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400 shrink-0" />
            [07] CENTROS ASISTENCIALES
          </button>

          <button
            onClick={() => setActiveTab('volunteer_gate')}
            className={`py-3.5 px-2.5 md:px-3.5 border-b-2 font-mono font-bold text-[11px] md:text-xs uppercase tracking-tight whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'volunteer_gate'
                ? 'border-blue-500 text-white bg-white/5 shadow-[inset_0_-4px_10px_rgba(59,130,246,0.15)]'
                : 'border-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            [ADM] COORDINADOR
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6" id="main-content-area">
        
        {/* Offline notice when applicable */}
        {!isOnline && (
          <div className="bg-[#FF9800]/10 border border-[#FF9800]/30 rounded-xl p-5 flex gap-4 items-start shadow-[0_0_15px_rgba(255,152,0,0.1)]">
            <WifiOff className="w-6 h-6 text-[#FF9800] shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-mono font-bold text-[#FF9800] text-sm uppercase">CONEXIÓN RED: DEGRADADA / INOPERATIVA</h4>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                Su terminal está operando localmente. Toda la base de datos táctica de ciudadanos y reportes se lee y escribe directamente en su dispositivo. El envío de reportes guardará los datos de inmediato en la cola de contingencia local, retransmitiéndose automáticamente tan pronto se detecte red móvil o canal alternativo.
              </p>
            </div>
          </div>
        )}

        {/* Tab Routing */}
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

              {/* General details of affected cities */}
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

            <MapViewer 
              incidents={incidents}
              isVolunteerVerified={isVolunteerVerified}
              selectedStateFilter={selectedStateFilter}
              onStateFilterChange={setSelectedStateFilter}
            />
          </div>
        )}

        {activeTab === 'report_form' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" id="tab-report-form">
            <div className="text-center bg-[#121212]/50 border border-white/5 p-6 rounded-2xl">
              <h2 className="text-2xl font-display font-black text-white uppercase tracking-wide">CANALIZACIÓN DE EMERGENCIAS</h2>
              <p className="text-xs text-white/50 mt-1 max-w-lg mx-auto leading-relaxed">
                Reporte de riesgos y salvamento. Esta información alimenta el mapa táctico de rescate de manera directa. No requiere Internet para encolar datos.
              </p>
            </div>
            
            <ReportForm 
              userId="Anon"
              onReportSuccess={(newInc) => {
                // Switch back to monitoring to show the new incident
                setActiveTab('map_reports');
              }}
            />
          </div>
        )}

        {activeTab === 'missing_search' && (
          <div className="space-y-6 animate-fade-in" id="tab-people-search">
            <PeopleSearch 
              isVolunteerVerified={isVolunteerVerified}
              userId="Anon"
            />
          </div>
        )}

        {activeTab === 'survival_guides' && (
          <div className="space-y-6 animate-fade-in" id="tab-survival-guides">
            <SurvivalSection />
          </div>
        )}

        {activeTab === 'shelters' && (
          <div className="space-y-6 animate-fade-in" id="tab-shelters">
            <SheltersModule 
              isVolunteerVerified={isVolunteerVerified}
              role={volunteerRole}
              userId="Ciudadano"
            />
          </div>
        )}

        {activeTab === 'blood_donors' && (
          <div className="space-y-6 animate-fade-in" id="tab-blood-donors">
            <BloodDonorsModule 
              isVolunteerVerified={isVolunteerVerified}
              role={volunteerRole}
            />
          </div>
        )}

        {activeTab === 'hospital_patients' && (
          <div className="space-y-6 animate-fade-in" id="tab-hospital-patients">
            <HospitalPatientsModule 
              isVerified={isVolunteerVerified}
              role={volunteerRole}
            />
          </div>
        )}

        {activeTab === 'volunteer_gate' && (
          <div className={`${isVolunteerVerified ? 'w-full' : 'max-w-2xl mx-auto'} space-y-6 animate-fade-in`} id="tab-coordinacion">
            <VolunteerVerification 
              role={volunteerRole}
              onRoleChange={setVolunteerRole}
            />
            {isVolunteerVerified && (
              <AdminPanel 
                incidents={incidents}
                isVerified={isVolunteerVerified}
                role={volunteerRole}
              />
            )}
          </div>
        )}

      </main>

      {/* Footer information section */}
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
