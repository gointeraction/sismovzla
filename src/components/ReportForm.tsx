import React, { useState, useEffect, useRef } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Incident } from '../types';
import { MapPin, AlertTriangle, Image as ImageIcon, Camera, Loader, WifiOff, CheckCircle, Mic, Square, Trash2, Volume2, Building2 } from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';
import { StructuralEvaluation } from '../types';
import { StructuralEvaluationModule, createDefaultEvaluation } from './StructuralEvaluationModule';

interface ReportFormProps {
  onReportSuccess: (incident: Incident) => void;
  userId: string;
}

export default function ReportForm({ onReportSuccess, userId }: ReportFormProps) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; currentIndex: number } | null>(null);
  const [type, setType] = useState<Incident['type']>('Rescate');
  const [severity, setSeverity] = useState<number>(3);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [apartmentsCount, setApartmentsCount] = useState<number | ''>('');
  const [peopleCount, setPeopleCount] = useState<number | ''>('');
  const [includeEvaluation, setIncludeEvaluation] = useState(false);
  const [evaluationData, setEvaluationData] = useState<StructuralEvaluation>(createDefaultEvaluation());
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [state, setState] = useState<Incident['state']>('Caracas');
  const [reporterContact, setReporterContact] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Audio Opus Voice Notes
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);

  useEffect(() => {
    // getGeolocation(); // Solicitud automática ahora opcional mediante botón
  }, []);

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalización no soportada por su navegador.");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        setManualLat(lat.toFixed(5));
        setManualLng(lng.toFixed(5));
        setIsGettingLocation(false);

        if (lat > 10.55 && lat < 10.65 && lng > -67.2 && lng < -66.5) {
          setState('La Guaira');
        } else if (lat > 10.4 && lat <= 10.55 && lng > -67.1 && lng < -66.7) {
          setState('Caracas');
        } else if (lat > 10.0 && lat < 10.3 && lng > -67.8 && lng <= -67.2) {
          setState('Aragua');
        } else if (lat > 9.9 && lat <= 10.4 && lng > -68.3 && lng <= -67.8) {
          setState('Carabobo');
        } else {
          setState('Otros');
        }
      },
      (error) => {
        setIsGettingLocation(false);
        setLocationError("No se pudo obtener el GPS (Saturación de torre/Batería baja). Seleccione el estado manualmente.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const startVoiceRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mime = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mime)) {
        mime = 'audio/webm';
      }
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioPreview(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      alert("No se pudo acceder al micrófono de su dispositivo.");
    }
  };

  const stopVoiceRecord = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    const fileList = Array.from(files) as File[];

    Promise.all(fileList.map((file: File) => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_DIM = 350;
          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.35));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }))).then(newImages => {
      setImagePreviews(prev => [...prev, ...newImages].slice(0, 30));
      setIsCompressing(false);
    });
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setOfflineQueued(false);
    setSubmitSuccess(false);

    let parsedLat = parseFloat(manualLat);
    let parsedLng = parseFloat(manualLng);
    let finalLat = !isNaN(parsedLat) ? parsedLat : (location?.lat || 10.4806);
    let finalLng = !isNaN(parsedLng) ? parsedLng : (location?.lng || -66.9036);

    if (isNaN(parsedLat) && !location) {
      if (state === 'La Guaira') { finalLat = 10.5986; finalLng = -66.9317; }
      else if (state === 'Aragua') { finalLat = 10.2442; finalLng = -67.5919; }
      else if (state === 'Carabobo') { finalLat = 10.1622; finalLng = -68.0077; }
    }

    const newIncident: Omit<Incident, 'id'> = {
      type,
      severity,
      description,
      state,
      address: address.trim() || undefined,
      latitude: finalLat,
      longitude: finalLng,
      mediaUrl: imagePreviews[0] || undefined,
      mediaUrls: imagePreviews.length > 0 ? imagePreviews : undefined,
      audioUrl: audioPreview || undefined,
      resolved: false,
      verified: false,
      createdAt: Date.now(),
      reportedBy: 'Ciudadano Anónimo',
      reporterContact: reporterContact.trim() || undefined,
      buildingInfo: isBuilding && (apartmentsCount !== '' || peopleCount !== '') ? {
        apartmentsCount: Number(apartmentsCount) || 0,
        peopleCount: Number(peopleCount) || 0
      } : undefined,
      structuralEvaluation: includeEvaluation ? evaluationData : undefined
    };

    if (!navigator.onLine) {
      queueReportOffline(newIncident);
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'incidents'), newIncident);
      const savedIncident: Incident = { id: docRef.id, ...newIncident };
      onReportSuccess(savedIncident);
      
      setSubmitSuccess(true);
      resetForm();
    } catch (err) {
      console.warn("Firestore upload failed. Queuing report offline:", err);
      queueReportOffline(newIncident);
    } finally {
      setIsSubmitting(false);
    }
  };

  const queueReportOffline = (report: Omit<Incident, 'id'>) => {
    try {
      const offlineQueue = JSON.parse(localStorage.getItem('sismovzla_offline_incidents') || '[]');
      offlineQueue.push(report);
      localStorage.setItem('sismovzla_offline_incidents', JSON.stringify(offlineQueue));
      
      setOfflineQueued(true);
      resetForm();
    } catch (e) {
      console.error("Failed to queue report in LocalStorage:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription('');
    setAddress('');
    setManualLat('');
    setManualLng('');
    setReporterContact('');
    setIsBuilding(false);
    setApartmentsCount('');
    setPeopleCount('');
    setImagePreviews([]);
    setAudioPreview(null);
    setIncludeEvaluation(false);
    setEvaluationData(createDefaultEvaluation());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-6 space-y-5 shadow-2xl" id="incident-report-form">
      <h3 className="text-xl font-display font-black text-white flex items-center gap-2.5 uppercase tracking-wide">
        <AlertTriangle className="w-5 h-5 text-[#D32F2F]" />
        REGISTRAR REPORTE DE CRISIS / DAÑO
      </h3>

      {submitSuccess && (
        <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 text-[#4CAF50] p-4 rounded-lg flex items-start gap-3 font-mono">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm uppercase">✓ REPORTE ENVIADO AL CENTRO DE CRISIS</p>
            <p className="text-xs text-[#4CAF50]/80 mt-1">
              La situación ha ingresado con estatus "Evaluación Pendiente". Voluntarios verificarán y despacharán ayuda.
            </p>
          </div>
        </div>
      )}

      {offlineQueued && (
        <div className="bg-[#FF9800]/10 border border-[#FF9800]/20 text-[#FF9800] p-4 rounded-lg flex items-start gap-3 font-mono">
          <WifiOff className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-bold text-sm uppercase">⚠ COLA OFFLINE: REPORTE GUARDADO LOCALMENTE</p>
            <p className="text-xs text-[#FF9800]/80 mt-1">
              No se detectó conexión. Se guardó localmente y se transmitirá de forma automatizada al recuperar cobertura.
            </p>
          </div>
        </div>
      )}

      {/* Grid of basic fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono">
        {/* Category */}
        <div>
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
            CATEGORÍA DEL INCIDENTE
          </label>
          <select
            value={type}
            onChange={(e) => {
              const val = e.target.value as Incident['type'];
              setType(val);
              if (val === 'Derrumbe') setIsBuilding(true);
            }}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F] cursor-pointer"
            required
          >
            <option value="Rescate">🚨 RESCATE / ATRAPADOS</option>
            <option value="Médico">🏥 EMERGENCIA MÉDICA</option>
            <option value="Fuga de Gas">🔥 FUGA DE GAS / INCENDIO</option>
            <option value="Derrumbe">🧱 DERRUMBE / COLAPSO</option>
            <option value="Otros">⚠️ OTROS RIESGOS</option>
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
            ESTADO / JURISDICCIÓN
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value as Incident['state'])}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F] cursor-pointer"
            required
          >
            <option value="Caracas">CARACAS (DISTRITO CAPITAL)</option>
            <option value="La Guaira">LA GUAIRA</option>
            <option value="Aragua">ARAGUA</option>
            <option value="Carabobo">CARABOBO</option>
            <option value="Otros">OTRA ENTIDAD FEDERAL</option>
          </select>
        </div>

        {/* Building Selector Toggle */}
        <div className="md:col-span-2 pt-1">
          <label className="flex items-center gap-2.5 bg-black/50 p-3.5 rounded-xl border border-white/10 hover:border-amber-500/40 cursor-pointer select-none transition-all">
            <input
              type="checkbox"
              checked={isBuilding || type === 'Derrumbe'}
              onChange={(e) => setIsBuilding(e.target.checked)}
              className="accent-amber-500 w-4 h-4 rounded"
            />
            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-wider">
              🏢 ¿ES EL REPORTE DE UN EDIFICIO RESIDENCIAL / COMERCIAL?
            </span>
          </label>
        </div>

        {/* Building Details Inputs */}
        {(isBuilding || type === 'Derrumbe') && (
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl animate-fadeIn">
            <div>
              <label className="block text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest mb-1.5">
                NRO. DE APARTAMENTOS / PISOS
              </label>
              <input
                type="number"
                min="0"
                value={apartmentsCount}
                onChange={(e) => setApartmentsCount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Ej: 24"
                className="w-full bg-black/80 border border-amber-500/40 rounded-lg p-3 text-white text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest mb-1.5">
                CANTIDAD ESTIMADA DE PERSONAS
              </label>
              <input
                type="number"
                min="0"
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Ej: 85"
                className="w-full bg-black/80 border border-amber-500/40 rounded-lg p-3 text-white text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Severity Indicator */}
      <div>
        <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2 flex justify-between">
          <span>NIVEL DE SEVERIDAD / URGENCIA</span>
          <span className="font-extrabold text-[#D32F2F] uppercase">Riesgo Nivel {severity}/5</span>
        </label>
        <div className="flex gap-2 font-mono">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSeverity(level)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all duration-200 border cursor-pointer ${
                severity === level
                  ? 'bg-[#D32F2F] border-[#FF5252] text-white shadow-[0_0_10px_rgba(211,47,47,0.35)]'
                  : 'bg-black/40 border-white/10 text-white/50 hover:border-[#D32F2F]/30 hover:text-white'
              }`}
            >
              {level === 1 ? 'BAJO' : level === 5 ? 'CRÍTICO' : level}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1.5">
          DESCRIPCIÓN DE LA SITUACIÓN Y DIRECCIÓN DETALLADA
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (submitSuccess) setSubmitSuccess(false);
            if (offlineQueued) setOfflineQueued(false);
          }}
          placeholder="Ej: Colapso parcial de estructura residencial. Entrada principal obstruida por escombros. Se escuchan gritos solicitando auxilio médico en el piso 2..."
          className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F] resize-none"
          required
        />
      </div>

      {/* Manual Address Field */}
      <div>
        <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-[#D32F2F]" />
          DIRECCIÓN O REFERENCIA MANUAL EXACTA (OPCIONAL)
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Ej: Av. Principal de Los Dos Caminos, Edificio Santa Ana, Piso 3, Caracas."
          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]"
        />
      </div>

      {/* Contact Info */}
      <div>
        <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1.5">
          TELÉFONO DE CONTACTO EN LA ESCENA (OPCIONAL)
        </label>
        <input
          type="tel"
          value={reporterContact}
          onChange={(e) => setReporterContact(e.target.value)}
          placeholder="Ej: 0412-1234567 o canal radial"
          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none focus:ring-1 focus:ring-[#D32F2F]"
        />
      </div>

      {/* Coordinates: Manual or Automatic GPS */}
      <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#D32F2F]" />
            COORDENADAS GEOGRÁFICAS (LAT / LON)
          </label>
          <button
            type="button"
            onClick={getGeolocation}
            disabled={isGettingLocation}
            className="px-3 py-1.5 bg-[#D32F2F]/20 hover:bg-[#D32F2F]/30 border border-[#D32F2F]/40 hover:border-[#D32F2F] rounded-lg text-[10px] font-extrabold text-white uppercase transition-all cursor-pointer flex items-center gap-1.5 shadow"
          >
            {isGettingLocation ? (
              <>
                <Loader className="w-3 h-3 animate-spin text-[#D32F2F]" /> ADQUIRIENDO GPS...
              </>
            ) : (
              '📡 SOLICITAR GPS AUTOMÁTICO'
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <span className="block text-[9px] text-white/40 mb-1 font-bold tracking-wider">LATITUD (Ej: 10.4806)</span>
            <input
              type="text"
              value={manualLat}
              onChange={(e) => {
                setManualLat(e.target.value);
                if (location) setLocation(null);
              }}
              placeholder="10.xxxxxx"
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#D32F2F] focus:outline-none font-mono"
            />
          </div>
          <div>
            <span className="block text-[9px] text-white/40 mb-1 font-bold tracking-wider">LONGITUD (Ej: -66.9036)</span>
            <input
              type="text"
              value={manualLng}
              onChange={(e) => {
                setManualLng(e.target.value);
                if (location) setLocation(null);
              }}
              placeholder="-66.xxxxxx"
              className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-[#D32F2F] focus:outline-none font-mono"
            />
          </div>
        </div>

        {locationError && (
          <p className="text-[10px] text-red-400 italic font-sans pt-1">{locationError}</p>
        )}
        {location && (
          <p className="text-[10px] text-[#4CAF50] font-bold pt-1">🟢 Coordenadas satelitales fijadas con éxito.</p>
        )}
      </div>

      {/* Image Capture & Downscaling */}
      <div>
        <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2.5">
          EVIDENCIA VISUAL COMPRIMIDA (OPCIONAL)
        </label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:border-[#D32F2F]/40 cursor-pointer text-xs font-mono font-bold text-white uppercase select-none transition-all">
            <Camera className="w-4 h-4 text-white/50" />
            TOMAR REGISTRO / ARCHIVO
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          {isCompressing && (
            <span className="text-xs text-white/50 font-mono flex items-center gap-1.5">
              <Loader className="w-3.5 h-3.5 animate-spin text-[#D32F2F]" />
              REDUCIENDO FOTOS PARA RED 2G...
            </span>
          )}
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-black/40 rounded-lg border border-white/10 max-w-full">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative group rounded overflow-hidden border border-white/10 bg-black shadow-lg shrink-0 w-10 h-10">
                  <img 
                    src={preview} 
                    alt={`Evidencia ${idx+1}`} 
                    onClick={() => setLightbox({ urls: imagePreviews, currentIndex: idx })}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                    title="Haga clic para ampliar"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute inset-x-0 bottom-0 bg-[#D32F2F]/90 text-white font-mono font-bold text-[6px] py-0.5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity uppercase cursor-pointer"
                  >
                    QUITAR
                  </button>
                </div>
              ))}
              <span className="text-[10px] text-white/50 font-mono font-bold self-center ml-1">
                ({imagePreviews.length}/30)
              </span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-white/40 font-mono mt-1.5 leading-normal">
          Para documentación exhaustiva, puede adjuntar hasta 30 fotografías (comprimidas automáticamente a ~9KB por Canvas).
        </p>
      </div>

      {/* Voice Note Section OPUS 4KB */}
      <div>
        <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2.5">
          NOTA DE VOZ COMPRIMIDA OPUS (~4KB)
        </label>
        <div className="flex flex-wrap items-center gap-3 font-mono">
          {!isRecording ? (
            <button
              type="button"
              onClick={startVoiceRecord}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all shadow-[0_0_10px_rgba(220,38,38,0.15)]"
            >
              <Mic className="w-4 h-4 animate-bounce" /> GRABAR MINUTA (10S MAX)
            </button>
          ) : (
            <button
              type="button"
              onClick={stopVoiceRecord}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white border border-red-400 rounded-lg text-xs font-bold uppercase cursor-pointer animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]"
            >
              <Square className="w-4 h-4" /> DETENER Y COMPRIMIR
            </button>
          )}

          {audioPreview && (
            <div className="flex items-center gap-2 bg-black/60 border border-white/10 px-3 py-1.5 rounded-lg">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <audio controls src={audioPreview} className="h-7 w-44" />
              <button
                type="button"
                onClick={() => setAudioPreview(null)}
                className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                title="Descartar audio"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <p className="text-[10px] text-white/40 font-mono mt-1.5 leading-normal">
          Formato WebM/OPUS ultra-liviano optimizado para escombros. Transmite relato verbal ocupando solo ~4KB.
        </p>
      </div>

      {/* Optional Post-Earthquake Structural Evaluation Checklist Toggle */}
      <div className="border border-amber-500/30 rounded-xl p-4 bg-amber-500/5 space-y-4 font-mono">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeEvaluation}
            onChange={(e) => setIncludeEvaluation(e.target.checked)}
            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
          />
          <div className="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm uppercase">
            <Building2 className="w-4 h-4 shrink-0" />
            ¿ADJUNTAR CHECKLIST DE EVALUACIÓN ESTRUCTURAL POST-SISMO (COVENIN 1756)?
          </div>
        </label>

        {includeEvaluation && (
          <div className="pt-2">
            <StructuralEvaluationModule
              value={evaluationData}
              onChange={setEvaluationData}
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isCompressing || isRecording}
        className="w-full bg-[#D32F2F] hover:bg-[#b71c1c] active:bg-[#9c1c1c] disabled:bg-white/5 disabled:text-white/20 py-3 rounded-lg font-mono font-bold uppercase tracking-widest text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm border border-[#FF5252] cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            TRANSMITIENDO REPORTE DE CRISIS...
          </>
        ) : !navigator.onLine ? (
          <>
            <WifiOff className="w-4 h-4" />
            GUARDAR EN COLA DE RESPUESTA OFFLINE
          </>
        ) : (
          'TRANSMITIR REPORTE INMEDIATO'
        )}
      </button>

      {lightbox && (
        <ImageLightbox
          urls={lightbox.urls}
          initialIndex={lightbox.currentIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </form>
  );
}
