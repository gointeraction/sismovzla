import React, { useState } from 'react';
import { ShieldCheck, Key, CheckCircle2 } from 'lucide-react';

export type VolunteerRole = 'none' | 'volunteer' | 'shelter_coordinator' | 'operator' | 'admin'
  | 'triage_medico' | 'rescate_coord' | 'logistica_admin' | 'radio_op' | 'forense' | 'psicosocial' | 'aereo_coord';

interface VolunteerVerificationProps {
  role: VolunteerRole;
  onRoleChange: (role: VolunteerRole) => void;
}

export default function VolunteerVerification({ role, onRoleChange }: VolunteerVerificationProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const cleanToken = token.trim().toUpperCase();

    if (cleanToken === 'VOLUNTARIO_VZLA') {
      setSuccess(true);
      onRoleChange('volunteer');
      localStorage.setItem('sismovzla_volunteer_role', 'volunteer');
      setToken('');
    } else if (cleanToken === 'TACTICO_2026') {
      setSuccess(true);
      onRoleChange('operator');
      localStorage.setItem('sismovzla_volunteer_role', 'operator');
      setToken('');
    } else if (cleanToken === 'COORD_REFUGIO') {
      setSuccess(true);
      onRoleChange('shelter_coordinator');
      localStorage.setItem('sismovzla_volunteer_role', 'shelter_coordinator');
      setToken('');
    } else if (cleanToken === 'SISMO_CRISIS_ADMIN') {
      setSuccess(true);
      onRoleChange('admin');
      localStorage.setItem('sismovzla_volunteer_role', 'admin');
      setToken('');
    } else if (cleanToken === 'TRIAGE_MEDICO') {
      setSuccess(true);
      onRoleChange('triage_medico');
      localStorage.setItem('sismovzla_volunteer_role', 'triage_medico');
      setToken('');
    } else if (cleanToken === 'RESCATE_COORD') {
      setSuccess(true);
      onRoleChange('rescate_coord');
      localStorage.setItem('sismovzla_volunteer_role', 'rescate_coord');
      setToken('');
    } else if (cleanToken === 'LOGISTICA_ADMIN') {
      setSuccess(true);
      onRoleChange('logistica_admin');
      localStorage.setItem('sismovzla_volunteer_role', 'logistica_admin');
      setToken('');
    } else if (cleanToken === 'RADIO_OP') {
      setSuccess(true);
      onRoleChange('radio_op');
      localStorage.setItem('sismovzla_volunteer_role', 'radio_op');
      setToken('');
    } else if (cleanToken === 'FORENSE') {
      setSuccess(true);
      onRoleChange('forense');
      localStorage.setItem('sismovzla_volunteer_role', 'forense');
      setToken('');
    } else if (cleanToken === 'PSICOSOCIAL') {
      setSuccess(true);
      onRoleChange('psicosocial');
      localStorage.setItem('sismovzla_volunteer_role', 'psicosocial');
      setToken('');
    } else if (cleanToken === 'AEREO_COORD') {
      setSuccess(true);
      onRoleChange('aereo_coord');
      localStorage.setItem('sismovzla_volunteer_role', 'aereo_coord');
      setToken('');
    } else {
      setError('Código de acreditación inválido. Intente de nuevo.');
    }
  };

  const handleDeactivate = () => {
    onRoleChange('none');
    localStorage.removeItem('sismovzla_volunteer_role');
    localStorage.removeItem('sismovzla_volunteer_mode');
    setSuccess(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-6 shadow-2xl font-mono" id="volunteer-verification-card">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 pb-4 mb-5">
        <div>
          <h3 className="text-xl font-display font-black text-white flex items-center gap-2.5 uppercase tracking-wide">
            <ShieldCheck className={`w-5 h-5 ${role !== 'none' ? 'text-[#4CAF50] animate-pulse' : 'text-white/30'}`} />
            COORDINACIÓN CIVIL DE CRISIS (RBAC)
          </h3>
          <p className="text-xs text-white/50 mt-1 max-w-md leading-relaxed font-sans">
            Portal diferenciado por roles para la verificación táctica de daños, despacho de emergencias y dirección civil.
          </p>
        </div>
        <span
          className={`text-[9px] font-mono px-2.5 py-1 rounded border font-bold uppercase shrink-0 self-start sm:self-auto ${
            role === 'admin' 
              ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse'
              : role === 'operator'
              ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20 shadow-[0_0_8px_rgba(76,175,80,0.15)]'
              : role === 'shelter_coordinator'
              ? 'bg-teal-500/10 text-teal-300 border-teal-500/20 shadow-[0_0_8px_rgba(20,184,166,0.15)]'
              : role === 'volunteer'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : role === 'triage_medico'
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              : role === 'rescate_coord'
              ? 'bg-orange-500/10 text-orange-300 border-orange-500/30'
              : role === 'logistica_admin'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : role === 'radio_op'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : role === 'forense'
              ? 'bg-gray-500/10 text-gray-300 border-gray-500/30'
              : role === 'psicosocial'
              ? 'bg-pink-500/10 text-pink-300 border-pink-500/30'
              : role === 'aereo_coord'
              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
              : 'bg-black/40 text-white/40 border-white/10'
          }`}
        >
          {role === 'admin' ? '👑 DIRECTOR GENERAL' : role === 'operator' ? '🛡️ OPERADOR 911/PC' : role === 'shelter_coordinator' ? '🏠 COORD. REFUGIO' : role === 'volunteer' ? '🤝 VOLUNTARIO CIVIL' : role === 'triage_medico' ? '🩺 MÉDICO TRIAJE' : role === 'rescate_coord' ? '🚒 COORD. RESCATE' : role === 'logistica_admin' ? '📦 ADMIN. LOGÍSTICA' : role === 'radio_op' ? '📡 OPERADOR RADIO' : role === 'forense' ? '⚰️ FORENSE' : role === 'psicosocial' ? '🧠 APOYO PSICOSOCIAL' : role === 'aereo_coord' ? '🚁 COORD. AÉREO' : 'MODO CIUDADANO'}
        </span>
      </div>

      {role !== 'none' ? (
        <div className="space-y-5" id="volunteer-active-info">
          <div className={`border p-5 rounded-xl flex items-start gap-4 ${
            role === 'admin' ? 'bg-red-950/20 border-red-500/30 text-red-200'
            : role === 'operator' ? 'bg-[#4CAF50]/10 border-[#4CAF50]/20 text-white'
            : role === 'shelter_coordinator' ? 'bg-teal-950/20 border-teal-500/30 text-teal-100'
            : role === 'triage_medico' ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
            : role === 'rescate_coord' ? 'bg-orange-950/20 border-orange-500/30 text-orange-200'
            : role === 'logistica_admin' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            : role === 'radio_op' ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            : role === 'forense' ? 'bg-gray-950/20 border-gray-500/30 text-gray-200'
            : role === 'psicosocial' ? 'bg-pink-950/20 border-pink-500/30 text-pink-200'
            : role === 'aereo_coord' ? 'bg-sky-950/20 border-sky-500/30 text-sky-200'
            : 'bg-blue-950/20 border-blue-500/30 text-blue-200'
          }`}>
            <CheckCircle2 className={`w-6 h-6 shrink-0 mt-0.5 ${
              role === 'admin' ? 'text-red-400'
              : role === 'operator' ? 'text-[#4CAF50]'
              : role === 'shelter_coordinator' ? 'text-teal-400'
              : role === 'triage_medico' ? 'text-rose-400'
              : role === 'rescate_coord' ? 'text-orange-400'
              : role === 'logistica_admin' ? 'text-emerald-400'
              : role === 'radio_op' ? 'text-amber-400'
              : role === 'forense' ? 'text-gray-400'
              : role === 'psicosocial' ? 'text-pink-400'
              : role === 'aereo_coord' ? 'text-sky-400'
              : 'text-blue-400'
            }`} />
            <div>
              <p className="font-bold text-sm uppercase tracking-wide">
                ACREDITACIÓN ACTIVA: {role === 'admin' ? 'DIRECTOR DE MANDO' : role === 'operator' ? 'OPERADOR DE RESCATE' : role === 'shelter_coordinator' ? 'COORDINADOR DE REFUGIO' : role === 'triage_medico' ? 'MÉDICO DE TRIAJE' : role === 'rescate_coord' ? 'COORDINADOR DE RESCATE' : role === 'logistica_admin' ? 'ADMINISTRADOR LOGÍSTICO' : role === 'radio_op' ? 'OPERADOR DE RADIO' : role === 'forense' ? 'FORENSE' : role === 'psicosocial' ? 'APOYO PSICOSOCIAL' : role === 'aereo_coord' ? 'COORDINADOR AÉREO' : 'VOLUNTARIO EN TIERRA'}
              </p>
              <p className="text-xs opacity-80 mt-1.5 leading-relaxed font-sans">
                {role === 'admin' && "Potestad absoluta en sala de crisis. Autorizado para verificar/resolver reportes, despachar agencias de rescate, eliminar refugios oficiales o minutas fútiles y exportar bases de datos en hojas de cálculo."}
                {role === 'operator' && "Permisos tácticos de intervención. Autorizado para oficializar reportes ciudadanos, despachar unidades de emergencia (VEN 911, Bomberos, PC) y actualizar el semáforo de capacidad de refugios."}
                {role === 'shelter_coordinator' && "Acceso de coordinación logística de refugios. Autorizado para gestionar solicitudes de ayuda, registrar personas albergadas, actualizar estado de capacidad y consultar el panel administrativo de solicitudes de todos los refugios asignados."}
                {role === 'volunteer' && "Terminal de apoyo civil. Autorizado para visualizar teléfonos de contacto protegidos de reportantes ciudadanos y registrar nuevos refugios en el mapa oficial."}
                {role === 'triage_medico' && "Evaluación clínica en zona cero. Autorizado para clasificar víctimas mediante protocolo START, priorizar evacuación por gravedad y registrar datos vitales en el módulo de triaje."}
                {role === 'rescate_coord' && "Coordinación táctica de equipos USAR. Autorizado para desplegar brigadas de búsqueda y rescate en estructuras colapsadas, asignar sectores de operación y actualizar el estatus de víctimas atrapadas."}
                {role === 'logistica_admin' && "Gestión de cadena de suministro en crisis. Autorizado para administrar inventario de insumos críticos, coordinar despachos a refugios y puntos de distribución, y supervisar rutas de abastecimiento."}
                {role === 'radio_op' && "Comunicaciones de emergencia en espectro táctico. Autorizado para operar enlaces VHF/UHF, retransmitir mensajes entre agencias y mantener el registro de comunicaciones en el módulo de radio."}
                {role === 'forense' && "Manejo de fallecidos en desastre masivo. Autorizado para registrar cadáveres, gestionar el proceso de identificación forense y coordinar el traslado a morgues temporales."}
                {role === 'psicosocial' && "Intervención en crisis y primeros auxilios psicológicos. Autorizado para brindar contención emocional a afectados, activar redes de apoyo y registrar casos en el módulo psicosocial."}
                {role === 'aereo_coord' && "Operaciones aéreas en espacio aéreo degradado. Autorizado para coordinar despegue/aterrizaje de aeronaves de emergencia, gestionar helipuertos tácticos y priorizar evacuación aeromédica."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
            <span className="text-xs text-white/40 font-bold">¿DESEA CERRAR SESIÓN DE COORDINACIÓN?</span>
            <button
              onClick={handleDeactivate}
              className="px-4 py-2 bg-[#D32F2F]/10 hover:bg-[#D32F2F]/20 border border-[#D32F2F]/20 hover:border-[#D32F2F] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer w-full sm:w-auto"
            >
              CERRAR CREDENCIALES
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5" id="volunteer-form-wrapper">
          <p className="text-xs text-white/70 leading-relaxed font-sans">
            Dada la alta sensibilidad tras sismos mayores, los reportes ingresan con estatus pendiente. Ingrese el código oficial asignado a su brigada, institución médica o dirección civil para activar sus facultades en el sistema.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" />
              <input
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="INTRODUZCA CÓDIGO ASIGNADO A SU ROL"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-3 py-3 text-white text-xs placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-[#D32F2F] hover:bg-[#b71c1c] active:bg-[#9c1c1c] text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-[#FF5252] shadow-lg cursor-pointer whitespace-nowrap"
            >
              ACREDITAR TERMINAL
            </button>
          </form>

          {error && <p className="text-xs text-red-500 font-bold tracking-wider">⚠ {error.toUpperCase()}</p>}
        </div>
      )}
    </div>
  );
}
