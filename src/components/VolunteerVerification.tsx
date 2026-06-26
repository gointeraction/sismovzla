import React, { useState } from 'react';
import { ShieldCheck, Key, CheckCircle2 } from 'lucide-react';

export type VolunteerRole = 'none' | 'volunteer' | 'operator' | 'admin';

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
    } else if (cleanToken === 'SISMO_CRISIS_ADMIN') {
      setSuccess(true);
      onRoleChange('admin');
      localStorage.setItem('sismovzla_volunteer_role', 'admin');
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
              : role === 'volunteer'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-black/40 text-white/40 border-white/10'
          }`}
        >
          {role === 'admin' ? '👑 DIRECTOR GENERAL' : role === 'operator' ? '🛡️ OPERADOR 911/PC' : role === 'volunteer' ? '🤝 VOLUNTARIO CIVIL' : 'MODO CIUDADANO'}
        </span>
      </div>

      {role !== 'none' ? (
        <div className="space-y-5" id="volunteer-active-info">
          <div className={`border p-5 rounded-xl flex items-start gap-4 ${
            role === 'admin' ? 'bg-red-950/20 border-red-500/30 text-red-200' : role === 'operator' ? 'bg-[#4CAF50]/10 border-[#4CAF50]/20 text-white' : 'bg-blue-950/20 border-blue-500/30 text-blue-200'
          }`}>
            <CheckCircle2 className={`w-6 h-6 shrink-0 mt-0.5 ${role === 'admin' ? 'text-red-400' : role === 'operator' ? 'text-[#4CAF50]' : 'text-blue-400'}`} />
            <div>
              <p className="font-bold text-sm uppercase tracking-wide">
                ACREDITACIÓN ACTIVA: {role === 'admin' ? 'DIRECTOR DE MANDO' : role === 'operator' ? 'OPERADOR DE RESCATE' : 'VOLUNTARIO EN TIERRA'}
              </p>
              <p className="text-xs opacity-80 mt-1.5 leading-relaxed font-sans">
                {role === 'admin' && "Potestad absoluta en sala de crisis. Autorizado para verificar/resolver reportes, despachar agencias de rescate, eliminar refugios oficiales o minutas fútiles y exportar bases de datos en hojas de cálculo."}
                {role === 'operator' && "Permisos tácticos de intervención. Autorizado para oficializar reportes ciudadanos, despachar unidades de emergencia (VEN 911, Bomberos, PC) y actualizar el semáforo de capacidad de refugios."}
                {role === 'volunteer' && "Terminal de apoyo civil. Autorizado para visualizar teléfonos de contacto protegidos de reportantes ciudadanos y registrar nuevos refugios en el mapa oficial."}
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
