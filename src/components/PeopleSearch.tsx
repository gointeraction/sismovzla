import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { PersonSearch } from '../types';
import { Search, UserPlus, Heart, MapPin, Phone, ShieldCheck, Loader, WifiOff } from 'lucide-react';

interface PeopleSearchProps {
  isVolunteerVerified: boolean;
  userId: string;
}

export default function PeopleSearch({ isVolunteerVerified, userId }: PeopleSearchProps) {
  const [people, setPeople] = useState<PersonSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Register missing/found person form
  const [name, setName] = useState('');
  const [lastKnownLoc, setLastKnownLoc] = useState('');
  const [status, setStatus] = useState<PersonSearch['status']>('Buscado');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Firestore Real-Time Listener (Offline persistent)
  useEffect(() => {
    const q = query(
      collection(db, 'people_search'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PersonSearch[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PersonSearch);
      });
      setPeople(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Listener error on people_search:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !lastKnownLoc.trim()) return;

    setIsSubmitting(true);
    setSubmitSuccess(false);

    const newPerson: Omit<PersonSearch, 'id'> = {
      name: name.trim(),
      name_slug: name.trim().toLowerCase(),
      last_known_loc: lastKnownLoc.trim(),
      status,
      contact_info: contactInfo.trim() || 'No provisto',
      registeredBy: userId || 'Anonimo',
      createdAt: Date.now(),
      notes: notes.trim() || undefined
    };

    try {
      await addDoc(collection(db, 'people_search'), newPerson);
      setSubmitSuccess(true);
      setName('');
      setLastKnownLoc('');
      setContactInfo('');
      setNotes('');
      setIsAdding(false);
    } catch (err) {
      console.error("Failed to add person to Firestore:", err);
      // Fallback local storage
      const fallbackList = JSON.parse(localStorage.getItem('sismovzla_offline_people') || '[]');
      fallbackList.push(newPerson);
      localStorage.setItem('sismovzla_offline_people', JSON.stringify(fallbackList));
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleOnline = async () => {
      if (navigator.onLine) {
        const fallbackList = JSON.parse(localStorage.getItem('sismovzla_offline_people') || '[]');
        if (fallbackList.length > 0) {
          console.log("Syncing offline people search records...");
          for (const item of fallbackList) {
            try {
              await addDoc(collection(db, 'people_search'), item);
            } catch (e) {
              console.error("Sync failed for", item, e);
            }
          }
          localStorage.removeItem('sismovzla_offline_people');
        }
      }
    };

    window.addEventListener('online', handleOnline);
    handleOnline();

    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Filter people list based on query
  const filteredPeople = people.filter((p) => {
    const querySlug = searchQuery.toLowerCase().trim();
    if (!querySlug) return true;
    return p.name_slug.includes(querySlug) || p.last_known_loc.toLowerCase().includes(querySlug);
  });

  return (
    <div className="space-y-6" id="people-search-section">
      {/* Header and Add Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#121212] to-[#0d0d0d] border border-white/10 rounded-xl p-5 shadow-lg">
        <div>
          <h3 className="text-xl font-display font-black text-white flex items-center gap-2.5 uppercase tracking-wide">
            <Heart className="w-5 h-5 text-[#D32F2F] animate-pulse" />
            REGISTRO DE CIUDADANOS Y DESAPARECIDOS
          </h3>
          <p className="text-xs text-white/50 mt-1 max-w-xl leading-relaxed">
            Canal humanitario civil y unificado para localizar familiares, reportar heridos o registrar personas sanas y salvas en refugios oficiales.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`shrink-0 px-4 py-2.5 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 border cursor-pointer ${
            isAdding
              ? 'bg-black/40 text-white/70 border-white/10 hover:border-white/20'
              : 'bg-[#D32F2F] hover:bg-[#b71c1c] text-white border-[#FF5252] shadow-[0_0_12px_rgba(211,47,47,0.3)]'
          }`}
          id="toggle-add-person-btn"
        >
          <UserPlus className="w-4 h-4" />
          {isAdding ? 'VER REGISTROS' : 'REGISTRAR PERSONA'}
        </button>
      </div>

      {isAdding ? (
        /* Form for Registering Person */
        <form onSubmit={handleRegister} className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-6 space-y-5 max-w-3xl mx-auto shadow-2xl" id="add-person-form">
          <h4 className="font-display font-black text-white text-sm border-b border-white/10 pb-3 flex items-center gap-2 uppercase tracking-wider">
            <UserPlus className="w-4 h-4 text-[#D32F2F]" />
            NUEVO REGISTRO CIVIL DE CONTINGENCIA
          </h4>

          {submitSuccess && (
            <div className="text-xs text-[#4CAF50] bg-[#4CAF50]/10 border border-[#4CAF50]/20 p-3 rounded-lg font-mono font-bold">
              ✓ REGISTRO COMPLETADO EXITOSAMENTE. Transmitiendo en tiempo real y sincronizado con el caché offline.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1.5">
                NOMBRE COMPLETO DEL CIUDADANO
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (submitSuccess) setSubmitSuccess(false);
                }}
                placeholder="Ej: Pedro José Pérez"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1.5">
                ESTATUS / CONDICIÓN ACTUAL
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PersonSearch['status'])}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#D32F2F] focus:outline-none cursor-pointer"
                required
              >
                <option value="Buscado">🔍 BUSCADO (DESAPARECIDO / SIN CONTACTO)</option>
                <option value="Localizado">✅ LOCALIZADO (SANO EN REFUGIO / HOGAR)</option>
                <option value="Hospitalizado">🏥 HOSPITALIZADO (ATENDIDO EN CENTRO DE SALUD)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Last Known Location */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1.5">
                ÚLTIMA UBICACIÓN DETECTADA / CONOCIDA
              </label>
              <input
                type="text"
                value={lastKnownLoc}
                onChange={(e) => setLastKnownLoc(e.target.value)}
                placeholder="Ej: Res. Girasol (Maracay) o Los Palos Grandes (Caracas)"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]"
                required
              />
            </div>

            {/* Contact Info (Only visible to verified volunteers/admins) */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1.5 flex justify-between items-center">
                <span>DATOS DE CONTACTO FAMILIAR</span>
                <span className="text-[9px] text-[#FF9800] bg-[#FF9800]/10 px-1.5 py-0.5 rounded border border-[#FF9800]/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> VOLUNTARIOS
                </span>
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Ej: Primo Pedro Pérez 0414-7654321"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1.5">
              SEÑAS PARTICULARES, REQUERIMIENTOS MÉDICOS O INFORMACIÓN ADICIONAL
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Usa lentes, franela azul. Diabético (requiere insulina)."
              className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#D32F2F] hover:bg-[#b71c1c] active:bg-[#9c1c1c] text-white font-mono font-bold uppercase tracking-wider py-3 rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer border border-[#FF5252]"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                REGISTRANDO EN BASE DE DATOS...
              </>
            ) : (
              'COMPLETAR REGISTRO DE CIUDADANO'
            )}
          </button>
        </form>
      ) : (
        /* List & Search View */
        <div className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR CIUDADANO POR NOMBRE, APELLIDO O UBICACIÓN..."
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]"
              id="search-people-input"
            />
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/40 gap-3 font-mono">
              <Loader className="w-8 h-8 animate-spin text-[#D32F2F]" />
              <p className="text-xs tracking-wider">CONECTANDO CON SERVIDOR DE BÚSQUEDA...</p>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="text-center py-16 bg-black/40 rounded-xl border border-white/5 text-white/40 font-mono">
              <p className="text-sm font-bold">NINGÚN REGISTRO DETECTADO</p>
              <p className="text-xs text-white/20 mt-1.5">Verifique la ortografía o agregue una nueva persona.</p>
            </div>
          ) : (
            /* Results grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="people-results-grid">
              {filteredPeople.map((p) => (
                <div
                  key={p.id}
                  className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-4.5 flex flex-col justify-between hover:border-white/20 transition-all duration-300 shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h4 className="font-display font-black text-white text-base tracking-tight uppercase">{p.name}</h4>
                      <span
                        className={`text-[9px] font-mono px-2.5 py-0.5 rounded border font-bold uppercase ${
                          p.status === 'Localizado'
                            ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20'
                            : p.status === 'Hospitalizado'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/20 animate-pulse'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono text-white/60">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#D32F2F] shrink-0" />
                        <span>
                          ÚLTIMA UBICACIÓN: <strong className="text-white">{p.last_known_loc}</strong>
                        </span>
                      </p>

                      {p.notes && (
                        <p className="bg-black/30 p-2.5 rounded border border-white/5 text-white/80 text-[11px] leading-relaxed italic mt-3 font-sans">
                          "{p.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact info container with volunteer wall */}
                  <div className="mt-5 border-t border-white/5 pt-3.5 flex items-center justify-between gap-3 font-mono">
                    <span className="text-[10px] text-white/30 font-bold">
                      FECHA: {new Date(p.createdAt).toLocaleDateString('es-VE')}
                    </span>
                    
                    {isVolunteerVerified ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#4CAF50] bg-[#4CAF50]/10 px-2.5 py-1 rounded border border-[#4CAF50]/20 font-bold">
                        <Phone className="w-3.5 h-3.5" />
                        <span>TLF: {p.contact_info}</span>
                      </div>
                    ) : (
                      <div className="text-[9px] text-[#FF9800] bg-[#FF9800]/10 px-2.5 py-1 rounded border border-[#FF9800]/10 flex items-center gap-1 font-bold select-none">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>CONTACTO RESTRINGIDO</span>
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
