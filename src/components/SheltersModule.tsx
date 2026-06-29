import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Shelter, ShelterOccupant, ShelterRequest } from '../types';
import { 
  Building, 
  MapPin, 
  PlusCircle, 
  ShieldCheck, 
  Phone, 
  Loader, 
  WifiOff, 
  CheckCircle, 
  AlertCircle, 
  Filter, 
  Trash2, 
  Activity,
  HeartPulse,
  Droplets,
  Package,
  Users,
  ChevronLeft,
  ClipboardList,
  CheckCircle2
} from 'lucide-react';

import { VolunteerRole } from './VolunteerVerification';

interface SheltersModuleProps {
  isVolunteerVerified: boolean;
  role?: VolunteerRole;
  userId: string;
}

export default function SheltersModule({ isVolunteerVerified, role = 'none', userId }: SheltersModuleProps) {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStateFilter, setSelectedStateFilter] = useState<Shelter['state'] | 'Todos'>('Todos');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<Shelter['type'] | 'Todos'>('Todos');
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [state, setState] = useState<Shelter['state']>('Caracas');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<Shelter['type']>('Refugio');
  const [capacityStatus, setCapacityStatus] = useState<Shelter['capacityStatus']>('Verde');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [needs, setNeeds] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);

  // Occupants State
  const [selectedShelterForOccupants, setSelectedShelterForOccupants] = useState<Shelter | null>(null);
  const [occupants, setOccupants] = useState<ShelterOccupant[]>([]);
  const [occFullName, setOccFullName] = useState('');
  const [occCI, setOccCI] = useState('');
  const [occAge, setOccAge] = useState('');
  const [occContact, setOccContact] = useState('');
  const [occPhysical, setOccPhysical] = useState('');
  const [occMedical, setOccMedical] = useState('');
  const [isOccSubmitting, setIsOccSubmitting] = useState(false);

  // Requests State
  const [selectedShelterForRequests, setSelectedShelterForRequests] = useState<Shelter | null>(null);
  const [requests, setRequests] = useState<ShelterRequest[]>([]);
  const [reqType, setReqType] = useState<ShelterRequest['type']>('Alimentos');
  const [reqDesc, setReqDesc] = useState('');
  const [isReqSubmitting, setIsReqSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'shelters'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Shelter[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Shelter);
      });
      // Sort client-side descending by updatedAt (fallback to 0 if missing)
      list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setShelters(list);
      setIsLoading(false);
    }, (err) => {
      console.error("Error listening to shelters:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync occupants
  useEffect(() => {
    if (!selectedShelterForOccupants) {
      setOccupants([]);
      return;
    }
    const q = query(collection(db, 'shelter_occupants'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ShelterOccupant[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as ShelterOccupant;
        if (data.shelterId === selectedShelterForOccupants.id) {
          list.push({ id: d.id, ...data });
        }
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      setOccupants(list);
    });
    return () => unsubscribe();
  }, [selectedShelterForOccupants]);

  // Sync requests
  useEffect(() => {
    if (!selectedShelterForRequests) {
      setRequests([]);
      return;
    }
    const q = query(collection(db, 'shelter_requests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ShelterRequest[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as ShelterRequest;
        if (data.shelterId === selectedShelterForRequests.id) {
          list.push({ id: d.id, ...data });
        }
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      setRequests(list);
    });
    return () => unsubscribe();
  }, [selectedShelterForRequests]);

  // Sync offline queue
  useEffect(() => {
    const syncOffline = async () => {
      if (navigator.onLine) {
        const offlineList = JSON.parse(localStorage.getItem('sismovzla_offline_shelters') || '[]');
        if (offlineList.length > 0) {
          console.log("Syncing offline shelters...");
          for (const s of offlineList) {
            try {
              await addDoc(collection(db, 'shelters'), s);
            } catch (e) {
              console.error("Failed to sync shelter", s, e);
            }
          }
          localStorage.removeItem('sismovzla_offline_shelters');
        }
      }
    };
    window.addEventListener('online', syncOffline);
    syncOffline();
    return () => window.removeEventListener('online', syncOffline);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin' || !name.trim() || !address.trim()) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);
    setOfflineQueued(false);

    // approximate coordinate per state
    let lat = 10.4806;
    let lng = -66.9036;
    if (state === 'La Guaira') { lat = 10.5986; lng = -66.9317; }
    else if (state === 'Aragua') { lat = 10.2442; lng = -67.5919; }
    else if (state === 'Carabobo') { lat = 10.1622; lng = -68.0077; }

    const newShelter: Omit<Shelter, 'id'> = {
      name: name.trim(),
      state,
      address: address.trim(),
      latitude: lat,
      longitude: lng,
      type,
      capacityStatus,
      ...(maxCapacity.trim() ? { maxCapacity: parseInt(maxCapacity, 10), occupantCount: 0 } : {}),
      needs: needs.trim() || 'Suministros estables',
      contact: contact.trim() || 'Coordinación local',
      verified: isVolunteerVerified,
      updatedAt: Date.now(),
      updatedBy: userId || 'Ciudadano'
    };

    if (!navigator.onLine) {
      const qList = JSON.parse(localStorage.getItem('sismovzla_offline_shelters') || '[]');
      qList.push(newShelter);
      localStorage.setItem('sismovzla_offline_shelters', JSON.stringify(qList));
      setOfflineQueued(true);
      setIsSubmitting(false);
      setName(''); setAddress(''); setNeeds(''); setContact(''); setMaxCapacity('');
      setIsAdding(false);
      return;
    }

    try {
      await addDoc(collection(db, 'shelters'), newShelter);
      setSubmitSuccess(true);
      setName(''); setAddress(''); setNeeds(''); setContact(''); setMaxCapacity('');
      setIsAdding(false);
    } catch (err) {
      console.warn("Failed to save shelter to Firestore. Queuing local:", err);
      const qList = JSON.parse(localStorage.getItem('sismovzla_offline_shelters') || '[]');
      qList.push(newShelter);
      localStorage.setItem('sismovzla_offline_shelters', JSON.stringify(qList));
      setOfflineQueued(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (shelterId: string, newStatus: Shelter['capacityStatus']) => {
    try {
      await updateDoc(doc(db, 'shelters', shelterId), {
        capacityStatus: newStatus,
        updatedAt: Date.now(),
        updatedBy: userId || 'Voluntario'
      });
    } catch (e) {
      console.error("Error updating capacity status:", e);
    }
  };

  const handleDelete = async (shelterId: string) => {
    if (confirm("¿Está seguro de eliminar este centro del mapa oficial?")) {
      try {
        await deleteDoc(doc(db, 'shelters', shelterId));
      } catch (e) {
        console.error("Error deleting shelter:", e);
      }
    }
  };

  const filteredShelters = shelters.filter(s => {
    const stMatch = selectedStateFilter === 'Todos' || s.state === selectedStateFilter;
    const tyMatch = selectedTypeFilter === 'Todos' || s.type === selectedTypeFilter;
    return stMatch && tyMatch;
  });

  const handleAddOccupant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShelterForOccupants || !occFullName.trim() || !occCI.trim()) return;

    setIsOccSubmitting(true);
    const newOccupant = {
      shelterId: selectedShelterForOccupants.id,
      fullName: occFullName.trim(),
      ci: occCI.trim().toUpperCase(),
      ...(occAge.trim() ? { age: parseInt(occAge, 10) } : {}),
      ...(occContact.trim() ? { contactPhone: occContact.trim() } : {}),
      physicalCondition: occPhysical.trim() || 'Estable',
      medicalNeeds: occMedical.trim() || 'Ninguna',
      registeredBy: userId || 'Ciudadano',
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'shelter_occupants'), newOccupant);
      
      // Update shelter occupantCount and recalculate status if maxCapacity exists
      const currentCount = selectedShelterForOccupants.occupantCount || 0;
      const newCount = currentCount + 1;
      let newStatus = selectedShelterForOccupants.capacityStatus;
      
      if (selectedShelterForOccupants.maxCapacity) {
        const ratio = newCount / selectedShelterForOccupants.maxCapacity;
        if (ratio >= 0.95) newStatus = 'Rojo';
        else if (ratio >= 0.75) newStatus = 'Amarillo';
        else newStatus = 'Verde';
      }

      await updateDoc(doc(db, 'shelters', selectedShelterForOccupants.id), {
        occupantCount: increment(1),
        capacityStatus: newStatus
      });

      setOccFullName('');
      setOccCI('');
      setOccAge('');
      setOccContact('');
      setOccPhysical('');
      setOccMedical('');
    } catch (err) {
      console.warn("Failed to save occupant:", err);
      alert("Error al guardar la persona. Revise su conexión.");
    } finally {
      setIsOccSubmitting(false);
    }
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShelterForRequests || !reqDesc.trim()) return;

    setIsReqSubmitting(true);
    const newRequest: Omit<ShelterRequest, 'id'> = {
      shelterId: selectedShelterForRequests.id,
      type: reqType,
      description: reqDesc.trim(),
      status: 'Abierto',
      reportedBy: userId || 'Ciudadano',
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'shelter_requests'), newRequest);
      setReqDesc('');
      setReqType('Alimentos');
    } catch (err) {
      console.warn("Failed to save request:", err);
      alert("Error al guardar la solicitud.");
    } finally {
      setIsReqSubmitting(false);
    }
  };

  const handleCloseRequest = async (requestId: string) => {
    if (!confirm('¿Deseas marcar esta solicitud como resuelta / cerrada?')) return;
    try {
      await updateDoc(doc(db, 'shelter_requests', requestId), {
        status: 'Cerrado',
        resolvedAt: Date.now(),
        resolvedBy: userId || 'Voluntario'
      });
    } catch (e) {
      console.error("Error closing request:", e);
    }
  };

  const getTypeIcon = (t: Shelter['type']) => {
    switch(t) {
      case 'Hospital': return <HeartPulse className="w-4 h-4 text-red-400" />;
      case 'Punto de Agua': return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'Centro de Acopio': return <Package className="w-4 h-4 text-amber-400" />;
      default: return <Building className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="shelters-module">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#121212] to-[#0d0d0d] border border-white/10 rounded-xl p-5 shadow-xl">
        <div>
          <h3 className="text-xl font-display font-black text-white flex items-center gap-2.5 uppercase tracking-wide">
            <Building className="w-5 h-5 text-emerald-500 animate-pulse" />
            REFUGIOS SEGUROS Y CENTROS DE ACOPIO
          </h3>
          <p className="text-xs text-white/50 mt-1 max-w-2xl leading-relaxed font-mono">
            Directorio georreferenciado de espacios habilitados con planta eléctrica, agua potable y suministros vitales tras sismos.
          </p>
        </div>
        {role === 'admin' ? (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`shrink-0 px-4 py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border cursor-pointer ${
              isAdding
                ? 'bg-black/40 text-white/70 border-white/10 hover:border-white/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-black font-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            {isAdding ? 'VER LISTADO' : 'REGISTRAR CENTRO (ADMIN)'}
          </button>
        ) : (
          <span className="shrink-0 text-[10px] font-mono bg-black/40 text-emerald-400/80 border border-emerald-500/20 px-3 py-1.5 rounded flex items-center gap-1.5 uppercase font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> MODO CONSULTA CIUDADANA
          </span>
        )}
      </div>

      {submitSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 font-mono text-xs font-bold">
          <CheckCircle className="w-5 h-5 shrink-0" />
          CENTRO REGISTRADO EXITOSAMENTE EN LA NUBE OFICIAL DE FIRESTORE.
        </div>
      )}

      {offlineQueued && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center gap-3 font-mono text-xs font-bold">
          <WifiOff className="w-5 h-5 shrink-0 animate-pulse" />
          SIN CONEXIÓN: CENTRO GUARDADO EN COLA OFFLINE LOCAL. SE TRANSMITIRÁ AL RECONECTAR.
        </div>
      )}

      {selectedShelterForOccupants ? (
        <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-6 shadow-2xl font-mono">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <div>
              <h4 className="font-display font-black text-emerald-400 text-lg uppercase flex items-center gap-2">
                <Users className="w-5 h-5" />
                PERSONAS ALBERGADAS
              </h4>
              <p className="text-xs text-white/50 mt-1 uppercase">Centro: {selectedShelterForOccupants.name}</p>
            </div>
            <button
              onClick={() => setSelectedShelterForOccupants(null)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs font-bold uppercase transition-all flex items-center gap-2 border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" /> VOLVER A CENTROS
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-1">
              <form onSubmit={handleAddOccupant} className="space-y-4 bg-black/40 p-4 rounded-lg border border-white/5">
                <h5 className="text-xs font-bold text-white/60 uppercase tracking-widest border-b border-white/10 pb-2">
                  REGISTRAR INGRESO
                </h5>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">NOMBRE COMPLETO</label>
                  <input
                    type="text"
                    value={occFullName}
                    onChange={e => setOccFullName(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded p-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">CÉDULA O IDENTIFICACIÓN</label>
                  <input
                    type="text"
                    value={occCI}
                    onChange={e => setOccCI(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded p-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">EDAD (OPC)</label>
                    <input
                      type="number"
                      min="0"
                      value={occAge}
                      onChange={e => setOccAge(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded p-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">TELÉFONO (OPC)</label>
                    <input
                      type="text"
                      value={occContact}
                      onChange={e => setOccContact(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded p-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">CONDICIONES FÍSICAS (OPCIONAL)</label>
                  <input
                    type="text"
                    value={occPhysical}
                    onChange={e => setOccPhysical(e.target.value)}
                    placeholder="Ej: Estable, Herido Leve..."
                    className="w-full bg-[#121212] border border-white/10 rounded p-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">NECESIDADES MÉDICAS (OPCIONAL)</label>
                  <input
                    type="text"
                    value={occMedical}
                    onChange={e => setOccMedical(e.target.value)}
                    placeholder="Ej: Requiere Insulina, Asma..."
                    className="w-full bg-[#121212] border border-white/10 rounded p-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isOccSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase text-[11px] py-2.5 rounded shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  {isOccSubmitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'REGISTRAR PERSONA'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {occupants.length === 0 ? (
                <div className="text-center py-10 bg-white/5 border border-white/5 rounded-lg text-white/40">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">NO HAY REGISTROS EN ESTE CENTRO</p>
                </div>
              ) : (
                occupants.map(o => (
                  <div key={o.id} className="bg-black/40 border border-white/5 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white uppercase">{o.fullName}</p>
                      <p className="text-[10px] text-white/50 font-mono flex gap-3">
                        <span>CI/ID: {o.ci}</span>
                        {o.age && <span>Edad: {o.age}</span>}
                        {o.contactPhone && <span>Tlf: {o.contactPhone}</span>}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 text-[10px]">
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">
                        Físico: {o.physicalCondition}
                      </span>
                      <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 w-fit">
                        Médico: {o.medicalNeeds}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : selectedShelterForRequests ? (
        <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-6 shadow-2xl font-mono">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <div>
              <h4 className="font-display font-black text-emerald-400 text-lg uppercase flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                SOLICITUDES LOGÍSTICAS Y MÉDICAS
              </h4>
              <p className="text-xs text-white/50 mt-1 uppercase">Centro: {selectedShelterForRequests.name}</p>
            </div>
            <button
              onClick={() => setSelectedShelterForRequests(null)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs font-bold uppercase transition-all flex items-center gap-2 border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" /> VOLVER A CENTROS
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-1">
              <form onSubmit={handleAddRequest} className="space-y-4 bg-black/40 p-4 rounded-lg border border-white/5">
                <h5 className="text-xs font-bold text-white/60 uppercase tracking-widest border-b border-white/10 pb-2">
                  NUEVA SOLICITUD
                </h5>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">TIPO DE SOLICITUD</label>
                  <select
                    value={reqType}
                    onChange={e => setReqType(e.target.value as any)}
                    className="w-full bg-[#121212] border border-white/10 rounded p-2 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Alimentos">Alimentos</option>
                    <option value="Insumos Médicos">Insumos Médicos</option>
                    <option value="Atención Médica">Atención Médica</option>
                    <option value="Logística">Logística</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">DESCRIPCIÓN</label>
                  <textarea
                    value={reqDesc}
                    onChange={e => setReqDesc(e.target.value)}
                    placeholder="Ej: Necesitamos gasoil, agua potable..."
                    className="w-full bg-[#121212] border border-white/10 rounded p-2 text-white text-xs focus:border-emerald-500 focus:outline-none min-h-[100px]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isReqSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase text-[11px] py-2.5 rounded shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  {isReqSubmitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'ABRIR SOLICITUD'}
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {requests.length === 0 ? (
                <div className="text-center py-10 bg-white/5 border border-white/5 rounded-lg text-white/40">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">NO HAY SOLICITUDES ACTIVAS</p>
                </div>
              ) : (
                requests.map(r => (
                  <div key={r.id} className={`p-4 rounded-lg border ${r.status === 'Abierto' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-black/40 border-white/5 opacity-70'} flex flex-col justify-between gap-3`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${r.status === 'Abierto' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {r.status}
                        </span>
                        <h6 className="text-sm font-bold text-white mt-1.5">{r.type}</h6>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 italic bg-black/30 p-2 rounded border border-white/5">
                      "{r.description}"
                    </p>
                    {r.status === 'Abierto' && (
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={() => handleCloseRequest(r.id)}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all rounded text-[10px] font-bold uppercase flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> MARCAR RESUELTO
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : isAdding && role === 'admin' ? (
        /* Registration Form */
        <form onSubmit={handleCreate} className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-6 space-y-5 max-w-3xl mx-auto shadow-2xl font-mono">
          <h4 className="font-display font-black text-white text-sm border-b border-white/10 pb-3 flex items-center gap-2 uppercase tracking-wider">
            <Building className="w-4 h-4 text-emerald-400" />
            NUEVO PUNTO DE ASISTENCIA / ACOPIO
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                NOMBRE DEL REFUGIO O INSTITUCIÓN
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Estadio Luis Aparicio o Polideportivo La Guaira"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                TIPO DE ASISTENCIA / CENTRO
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="Refugio">⛺ REFUGIO CIVIL (DORMITORIOS / TECHO)</option>
                <option value="Hospital">🏥 HOSPITAL / CENTRO MÉDICO OPERATIVO</option>
                <option value="Centro de Acopio">📦 CENTRO DE ACOPIO (ALIMENTOS / ROPA)</option>
                <option value="Punto de Agua">💧 PUNTO DE SUMINISTRO DE AGUA POTABLE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                ESTADO / REGIÓN
              </label>
              <select
                value={state}
                onChange={e => setState(e.target.value as any)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="Caracas">CARACAS (DISTRITO CAPITAL)</option>
                <option value="La Guaira">LA GUAIRA</option>
                <option value="Aragua">ARAGUA</option>
                <option value="Carabobo">CARABOBO</option>
                <option value="Otros">OTRAS ENTIDADES</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                SEMÁFORO DE CAPACIDAD ACTUAL
              </label>
              <select
                value={capacityStatus}
                onChange={e => setCapacityStatus(e.target.value as any)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                disabled={!!maxCapacity.trim()}
              >
                <option value="Verde">🟢 DISPONIBLE (ESPACIO E INSUMOS SUFICIEN.)</option>
                <option value="Amarillo">🟡 CASI LLENO (RECURSOS LIMITADOS)</option>
                <option value="Rojo">🔴 COLAPSADO (SIN CAPACIDAD / REQU. AYUDA)</option>
              </select>
              {maxCapacity.trim() && (
                <p className="text-[10px] text-emerald-500/70 mt-1 italic">El semáforo se automatizará por tener capacidad máxima asignada.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
              CAPACIDAD MÁXIMA DE PERSONAS (OPCIONAL)
            </label>
            <input
              type="number"
              min="1"
              value={maxCapacity}
              onChange={e => setMaxCapacity(e.target.value)}
              placeholder="Ej: 100"
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
              DIRECCIÓN O PUNTO DE REFERENCIA EXACTO
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Ej: Av. Principal de Las Mercedes, frente a la plaza."
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                REQUERIMIENTOS CRÍTICOS O SERVICIOS
              </label>
              <input
                type="text"
                value={needs}
                onChange={e => setNeeds(e.target.value)}
                placeholder="Ej: Necesita pañales, agua y donantes O-"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                TELÉFONO O RADIO DE COORDINACIÓN
              </label>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="Ej: 0414-1112233 o Canal 7 VHF"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-widest py-3.5 rounded-lg text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : 'PUBLICAR CENTRO EN EL DIRECTORIO OFICIAL'}
          </button>
        </form>
      ) : (
        /* Directory List View */
        <div className="space-y-4 font-mono">
          
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-black/40 border border-white/10 p-4 rounded-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-2 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-400" /> ENTIDAD:
              </span>
              {(['Todos', 'Caracas', 'La Guaira', 'Aragua', 'Carabobo'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStateFilter(st)}
                  className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all ${
                    selectedStateFilter === st
                      ? 'bg-emerald-500 text-black font-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value as any)}
                className="bg-[#121212] border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 font-bold cursor-pointer focus:outline-none"
              >
                <option value="Todos">TODOS LOS TIPOS</option>
                <option value="Refugio">⛺ REFUGIOS</option>
                <option value="Hospital">🏥 HOSPITALES</option>
                <option value="Centro de Acopio">📦 ACOPIO</option>
                <option value="Punto de Agua">💧 AGUA</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-white/40 flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-xs tracking-wider">SINCRONIZANDO MAPA DE REFUGIOS...</p>
            </div>
          ) : filteredShelters.length === 0 ? (
            <div className="text-center py-16 bg-black/40 rounded-xl border border-white/5 text-white/40">
              <p className="text-sm font-bold">NO HAY CENTROS REGISTRADOS CON ESTE FILTRO</p>
              <p className="text-xs text-white/20 mt-1">Registra un nuevo refugio o cambia de región.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredShelters.map(s => (
                <div key={s.id} className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-white/20 transition-all shadow-lg">
                  <div>
                    {/* Top status bar */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-white/5 rounded-lg border border-white/10">
                          {getTypeIcon(s.type)}
                        </span>
                        <div>
                          <h4 className="font-display font-black text-white text-sm uppercase">{s.name}</h4>
                          <span className="text-[10px] text-white/40 font-mono">{s.type} • {s.state}</span>
                        </div>
                      </div>

                      {/* Traffic Light Badge */}
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider border shrink-0 ${
                        s.capacityStatus === 'Verde'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                          : s.capacityStatus === 'Amarillo'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
                      }`}>
                        {s.capacityStatus === 'Verde' ? '🟢 DISPONIBLE' : s.capacityStatus === 'Amarillo' ? '🟡 CASI LLENO' : '🔴 COLAPSADO'}
                        {s.maxCapacity && ` (${s.occupantCount || 0}/${s.maxCapacity})`}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-white/70 mt-4 border-t border-white/5 pt-3">
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{s.address}</span>
                      </p>
                      {s.needs && (
                        <p className="bg-black/40 p-2.5 rounded border border-white/5 text-[11px] text-amber-300/90 italic font-sans">
                          ⚡ Requerimiento / Info: "{s.needs}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 border-t border-white/5 pt-3 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Contacto: <strong className="text-white">{s.contact || 'No provisto'}</strong></span>
                    </div>

                    {(role === 'operator' || role === 'admin' || (isVolunteerVerified && role === 'none')) && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setSelectedShelterForOccupants(s); setSelectedShelterForRequests(null); }}
                          className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" /> Personas
                        </button>
                        
                        <button
                          onClick={() => { setSelectedShelterForRequests(s); setSelectedShelterForOccupants(null); }}
                          className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase rounded border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1 mr-1"
                        >
                          <ClipboardList className="w-3.5 h-3.5" /> Solicitudes
                        </button>

                        <select
                          value={s.capacityStatus}
                          onChange={e => handleUpdateStatus(s.id, e.target.value as any)}
                          className="bg-black text-[10px] text-emerald-400 font-bold border border-emerald-500/30 rounded px-2 py-1 cursor-pointer focus:outline-none"
                          title="Actualizar semáforo de capacidad"
                        >
                          <option value="Verde">🟢 DISP</option>
                          <option value="Amarillo">🟡 LLENO</option>
                          <option value="Rojo">🔴 COLAP</option>
                        </select>

                        {(role === 'admin' || (isVolunteerVerified && role === 'none')) && (
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 bg-red-500/10 text-red-400 rounded border border-red-500/20 hover:bg-red-500/30 transition-all cursor-pointer"
                            title="Eliminar del mapa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
