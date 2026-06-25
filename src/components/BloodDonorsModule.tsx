import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { BloodDonor } from '../types';
import { VolunteerRole } from './VolunteerVerification';
import { 
  HeartPulse, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Filter, 
  Building2, 
  Send, 
  Check, 
  X, 
  ShieldCheck, 
  FileText,
  Activity,
  Award
} from 'lucide-react';

interface BloodDonorsModuleProps {
  isVolunteerVerified: boolean;
  role: VolunteerRole;
}

const BLOOD_TYPES: BloodDonor['bloodType'][] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const ENABLED_BLOOD_BANKS = [
  { id: 'h_luciani', name: 'Hospital Domingo Luciani - Banco de Sangre (Caracas)', state: 'Caracas' },
  { id: 'h_universitario', name: 'Hospital Universitario de Caracas (HUC)', state: 'Caracas' },
  { id: 'h_cruz_roja', name: 'Cruz Roja Venezolana - Sede Nacional', state: 'Caracas' },
  { id: 'h_central_maracay', name: 'Hospital Central de Maracay - Hematología', state: 'Aragua' },
  { id: 'h_central_valencia', name: 'Ciudad Hospitalaria Enrique Tejera (Valencia)', state: 'Carabobo' },
  { id: 'h_jose_maria', name: 'Hospital José María Vargas (La Guaira)', state: 'La Guaira' }
];

export default function BloodDonorsModule({ isVolunteerVerified, role }: BloodDonorsModuleProps) {
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [filterBlood, setFilterBlood] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Registration Form State
  const [form, setForm] = useState<{
    fullName: string;
    contactPhone: string;
    state: BloodDonor['state'];
    bloodType: BloodDonor['bloodType'];
    ageValid: boolean;
    weightValid: boolean;
    timeValid: boolean;
    healthValid: boolean;
  }>({
    fullName: '',
    contactPhone: '',
    state: 'Caracas',
    bloodType: 'O+',
    ageValid: false,
    weightValid: false,
    timeValid: false,
    healthValid: false
  });

  // Referral Modal State
  const [referralTarget, setReferralTarget] = useState<BloodDonor | null>(null);
  const [selectedFacility, setSelectedFacility] = useState(ENABLED_BLOOD_BANKS[0].name);
  const [referralNotes, setReferralNotes] = useState('');
  const [isReferring, setIsReferring] = useState(false);

  // Compute qualification live
  const isFormQualified = form.ageValid && form.weightValid && form.timeValid && form.healthValid;

  useEffect(() => {
    const q = query(collection(db, 'blood_donors'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: BloodDonor[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as BloodDonor);
      });
      setDonors(list);
    }, (err) => {
      console.error('Error fetching blood donors:', err);
    });
    return () => unsub();
  }, []);

  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.contactPhone) {
      alert('Debe ingresar su nombre completo y teléfono de contacto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newDonor: Omit<BloodDonor, 'id'> = {
        fullName: form.fullName.trim(),
        contactPhone: form.contactPhone.trim(),
        state: form.state,
        bloodType: form.bloodType,
        ageValid: form.ageValid,
        weightValid: form.weightValid,
        timeValid: form.timeValid,
        healthValid: form.healthValid,
        isQualified: isFormQualified,
        status: isFormQualified ? 'Calificado' : 'Registrado',
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'blood_donors'), newDonor);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);

      // Reset form
      setForm({
        fullName: '',
        contactPhone: '',
        state: 'Caracas',
        bloodType: 'O+',
        ageValid: false,
        weightValid: false,
        timeValid: false,
        healthValid: false
      });
    } catch (err) {
      console.error('Error registering blood donor:', err);
      alert('Hubo un error al registrar en la base de datos de contingencia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralTarget) return;

    setIsReferring(true);
    try {
      const donorRef = doc(db, 'blood_donors', referralTarget.id);
      await updateDoc(donorRef, {
        status: 'Remitido',
        referredFacilityName: selectedFacility,
        referredNotes: referralNotes.trim(),
        referredAt: Date.now(),
        referredBy: role === 'admin' ? 'Coordinador Admin' : 'Operador Táctico'
      });
      setReferralTarget(null);
      setReferralNotes('');
    } catch (err) {
      console.error('Error referring donor:', err);
      alert('Hubo un error al transmitir la orden de remisión médica.');
    } finally {
      setIsReferring(false);
    }
  };

  const filteredDonors = donors.filter((d) => {
    if (filterBlood !== 'all' && d.bloodType !== filterBlood) return false;
    if (filterState !== 'all' && d.state !== filterState) return false;
    return true;
  });

  const totalQualified = donors.filter((d) => d.isQualified && d.status !== 'Remitido').length;
  const totalReferred = donors.filter((d) => d.status === 'Remitido').length;

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      {/* HUD Header Banner */}
      <div className="bg-gradient-to-r from-red-950/80 via-[#121212] to-[#121212] border border-red-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-red-600 text-white rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <HeartPulse className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded font-mono font-bold border border-red-500/30 uppercase">
                  RED HUMANITARIA DE EMERGENCIA
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight mt-1">
                REGISTRO & TRIAJE DE DONANTES DE SANGRE
              </h2>
              <p className="text-xs text-white/60 mt-1 max-w-xl">
                Canalización directa de unidades sanguíneas ante contingencias sísmicas severas. Cuestionario de evaluación clínica previa y remisión oficial a centros de transfusión habilitados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <div className="bg-black/50 border border-red-500/20 rounded-xl p-3.5 text-center min-w-[100px]">
              <p className="text-[9px] text-white/40 uppercase font-bold">APTOS DISPONIBLES</p>
              <p className="text-2xl font-black text-red-400 mt-0.5">{totalQualified}</p>
            </div>
            <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-3.5 text-center min-w-[100px]">
              <p className="text-[9px] text-white/40 uppercase font-bold">REMITIDOS</p>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">{totalReferred}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Volunteer Registration & Triage Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl relative">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4 mb-5">
              <UserPlus className="w-5 h-5 text-red-400" />
              <h3 className="font-display font-black text-base text-white uppercase tracking-wider">
                INSCRIPCIÓN DE VOLUNTARIO DONANTE
              </h3>
            </div>

            {submitSuccess && (
              <div className="mb-6 bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-4 text-emerald-300 font-mono text-xs flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>¡Registro exitoso! Sus datos de triaje sanguíneo han sido ingresados en la red de coordinación.</span>
              </div>
            )}

            <form onSubmit={handleRegisterDonor} className="space-y-5 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-white/70 block font-bold uppercase">Nombre Completo del Ciudadano:</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Ej: Carlos Eduardo Méndez"
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-red-400 font-sans text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/70 block font-bold uppercase">Grupo Sanguíneo:</label>
                  <select
                    value={form.bloodType}
                    onChange={(e) => setForm({ ...form, bloodType: e.target.value as any })}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2.5 text-red-400 font-black focus:outline-none focus:border-red-400 text-sm"
                  >
                    {BLOOD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/70 block font-bold uppercase">Estado / Región:</label>
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value as any })}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-red-400"
                  >
                    <option value="Caracas">Caracas</option>
                    <option value="La Guaira">La Guaira</option>
                    <option value="Aragua">Aragua</option>
                    <option value="Carabobo">Carabobo</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/70 block font-bold uppercase">Teléfono Móvil de Llamada Rápida:</label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  placeholder="Ej: 0412-9876543"
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-red-400 font-sans text-sm"
                  required
                />
              </div>

              {/* Triage Questionnaire */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3.5 mt-2">
                <p className="text-[11px] text-red-400 uppercase font-black tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2 font-display">
                  <Activity className="w-3.5 h-3.5" /> CUESTIONARIO RÁPIDO DE CALIFICACIÓN PREVIA
                </p>

                <label className="flex items-start gap-3 text-white/80 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={form.ageValid}
                    onChange={(e) => setForm({ ...form, ageValid: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 bg-black text-red-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="leading-tight">¿Es usted mayor de 18 años y menor de 65 años?</span>
                </label>

                <label className="flex items-start gap-3 text-white/80 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={form.weightValid}
                    onChange={(e) => setForm({ ...form, weightValid: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 bg-black text-red-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="leading-tight">¿Su peso corporal es superior a los 50 kilogramos?</span>
                </label>

                <label className="flex items-start gap-3 text-white/80 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={form.timeValid}
                    onChange={(e) => setForm({ ...form, timeValid: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 bg-black text-red-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="leading-tight">¿Han transcurrido más de 3 meses (hombres) o 4 meses (mujeres) desde su última donación de sangre?</span>
                </label>

                <label className="flex items-start gap-3 text-white/80 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={form.healthValid}
                    onChange={(e) => setForm({ ...form, healthValid: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 bg-black text-red-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                  />
                  <span className="leading-tight">¿Goza de buena salud hoy? (Sin fiebre en últimas semanas, sin tatuajes/perforaciones en últimos 6 meses, sin infecciones activas).</span>
                </label>
              </div>

              {/* Triage Live Status Banner */}
              <div className={`p-3 rounded-xl border text-center font-bold transition-all ${
                isFormQualified 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                {isFormQualified ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> ESTATUS PREVIO: APTO PARA DONACIÓN INMEDIATA
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 text-[11px]">
                    <AlertCircle className="w-4 h-4 shrink-0" /> ESTATUS PREVIO: EN RESERVA (Requiere completar criterios)
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmitting ? 'REGISTRANDO EN RED...' : 'REGISTRAR MI VOLUNTAD DE DONACIÓN'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Registered Donors List & Tactical Operators Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-5 h-5 text-red-400" /> DIRECTORIO TÁCTICO DE DONANTES
                </h3>
                <p className="text-xs text-white/50 font-mono mt-0.5">
                  Total inscritos: {donors.length} • Visibilidad descentralizada
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-white/40" />
                  <select
                    value={filterBlood}
                    onChange={(e) => setFilterBlood(e.target.value)}
                    className="bg-transparent text-red-400 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#121212] text-white">Todos Tipo</option>
                    {BLOOD_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#121212] text-white">{t}</option>
                    ))}
                  </select>
                </div>

                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white/80 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#121212]">Todas Regiones</option>
                  <option value="Caracas" className="bg-[#121212]">Caracas</option>
                  <option value="La Guaira" className="bg-[#121212]">La Guaira</option>
                  <option value="Aragua" className="bg-[#121212]">Aragua</option>
                  <option value="Carabobo" className="bg-[#121212]">Carabobo</option>
                  <option value="Otros" className="bg-[#121212]">Otros</option>
                </select>
              </div>
            </div>

            {/* Operator Authority Info Notice */}
            {isVolunteerVerified && (role === 'operator' || role === 'admin') && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between gap-4 font-mono text-xs text-blue-300">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                  <span>MODO OPERADOR TÁCTICO ACTIVO: Usted posee potestad oficial para remitir donantes calificados hacia hospitales con Banco de Sangre.</span>
                </div>
              </div>
            )}

            {/* Donors Cards List */}
            <div className="space-y-3.5 max-h-[650px] overflow-y-auto pr-1">
              {filteredDonors.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-black/20">
                  <HeartPulse className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-xs font-mono text-white/40 uppercase">No hay donantes registrados con los filtros seleccionados</p>
                </div>
              ) : (
                filteredDonors.map((donor) => {
                  const isReferred = donor.status === 'Remitido';
                  const canRefer = isVolunteerVerified && (role === 'operator' || role === 'admin') && !isReferred && donor.isQualified;

                  return (
                    <div 
                      key={donor.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isReferred
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                          : donor.isQualified
                            ? 'bg-black/40 border-red-500/30 hover:border-red-500/50'
                            : 'bg-black/20 border-white/5 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3.5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-lg shrink-0 shadow-md ${
                            isReferred
                              ? 'bg-emerald-600 text-white'
                              : donor.isQualified
                                ? 'bg-red-600 text-white'
                                : 'bg-white/10 text-white/40'
                          }`}>
                            {donor.bloodType}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-white text-sm font-sans">{donor.fullName}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/5 uppercase">
                                {donor.state}
                              </span>
                              {donor.isQualified ? (
                                <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> APTO
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20 uppercase">
                                  RESERVA
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1.5 text-xs font-mono text-white/60">
                              <a 
                                href={`tel:${donor.contactPhone}`}
                                className="flex items-center gap-1 text-blue-400 hover:underline"
                              >
                                <Phone className="w-3 h-3" /> {donor.contactPhone}
                              </a>
                              <span>•</span>
                              <span className="text-[10px] text-white/40">
                                Inscrito {new Date(donor.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {isReferred && (
                              <div className="mt-2.5 pt-2 border-t border-emerald-500/20 text-[11px] font-mono text-emerald-300 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                                  REMITIDO A: {donor.referredFacilityName}
                                </p>
                                {donor.referredNotes && (
                                  <p className="text-emerald-400/80 italic">Nota: "{donor.referredNotes}"</p>
                                )}
                                <p className="text-[9px] text-emerald-500/70">
                                  Autorizado por {donor.referredBy} • {new Date(donor.referredAt!).toLocaleTimeString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tactical Action */}
                        <div className="shrink-0 mt-2 sm:mt-0">
                          {isReferred ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] uppercase border border-emerald-500/30">
                              <Check className="w-3.5 h-3.5" /> REMISIÓN EMITIDA
                            </span>
                          ) : canRefer ? (
                            <button
                              onClick={() => setReferralTarget(donor)}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-400/30 animate-pulse"
                            >
                              <Send className="w-3.5 h-3.5" /> REMITIR A BANCO DE SANGRE
                            </button>
                          ) : !isVolunteerVerified || (role !== 'operator' && role !== 'admin') ? (
                            <span className="text-[9px] font-mono text-white/30 italic block text-right">
                              Solo operador táctico puede remitir
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Modal Dialog */}
      {referralTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-blue-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-display font-black text-white uppercase tracking-wide flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                REMITIR DONANTE: {referralTarget.fullName}
              </h3>
              <button
                onClick={() => setReferralTarget(null)}
                className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black/50 p-3 rounded-xl border border-white/5 font-mono text-xs text-white/70 flex items-center justify-between">
              <span>Grupo Sanguíneo: <strong className="text-red-400 text-sm">{referralTarget.bloodType}</strong></span>
              <span>Ubicación: <strong>{referralTarget.state}</strong></span>
            </div>

            <form onSubmit={handleConfirmReferral} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-blue-300 block font-bold uppercase flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Seleccionar Centro Asistencial Habilitado:
                </label>
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="w-full bg-black/80 border border-white/20 rounded-xl px-3.5 py-3 text-white font-bold focus:outline-none focus:border-blue-400"
                >
                  {ENABLED_BLOOD_BANKS.map((bank) => (
                    <option key={bank.id} value={bank.name}>{bank.name} ({bank.state})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/70 block font-bold uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Instrucciones o Notas de Traslado Táctico:
                </label>
                <textarea
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  rows={3}
                  placeholder="Ej: Dirigirse al triaje del sótano 1. Preguntar por la Lic. Rodríguez. Urgente requerimiento para paciente quirúrgico."
                  className="w-full bg-black/80 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-blue-400 font-sans text-sm leading-relaxed"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[11px] text-amber-200">
                ⚠ Al confirmar, se despachará esta orden en tiempo real y el donante quedará reservado oficialmente para este centro médico.
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setReferralTarget(null)}
                  className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer uppercase font-bold"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isReferring}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isReferring ? 'TRANSMITIENDO ORDEN...' : 'CONFIRMAR REMISIÓN OFICIAL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
