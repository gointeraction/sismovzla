import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Lightbulb, BookOpen, Phone, ShieldAlert, Check } from 'lucide-react';

interface Guide {
  title: string;
  category: string;
  steps: string[];
}

const EMERGENCY_GUIDES: Guide[] = [
  {
    title: "Primeros Auxilios de Emergencia",
    category: "Médico",
    steps: [
      "Hemorragias: Aplique presión directa sobre la herida con un paño limpio o gasa. No retire la presión hasta que cese o llegue ayuda.",
      "Inconsciencia: Si respira, colóquelo de lado (Posición Lateral de Seguridad) para mantener la vía aérea despejada.",
      "Asfixia / RCP: Si no respira, inicie compresiones cardíacas constantes en el centro del pecho (ritmo de 100-120 por minuto).",
      "Quemaduras: Lave con agua limpia y fresca por 10 minutos. No aplique pomadas, aceites ni hielo.",
      "Fracturas: Inmovilice el miembro en la posición encontrada. No intente acomodar el hueso."
    ]
  },
  {
    title: "Conducta Ante Derrumbes",
    category: "Rescate",
    steps: [
      "Si está atrapado: Mantenga la calma. Busque un espacio seguro (Triángulo de la vida) al lado de muebles fuertes.",
      "Señalización acústica: Use el silbato digital o golpee estructuras de metal/concreto en intervalos de tres (S.O.S.). Evite gritar para no tragar polvo ni agotarse.",
      "Protección de vías respiratorias: Cúbrase la boca y nariz con un trozo de ropa, preferiblemente húmedo.",
      "Evite encender fuego: No use encendedores ni fósforos ante posibles fugas de gas. Use linternas."
    ]
  },
  {
    title: "Control de Fugas de Gas",
    category: "Prevención",
    steps: [
      "No accione interruptores: No encienda ni apague luces, ni electrodomésticos; cualquier chispa puede causar explosión.",
      "Ventilación: Abra puertas y ventanas para dispersar el gas si es seguro hacerlo.",
      "Cierre la llave de paso: Si localiza la bombona o tubería principal, cierre la válvula inmediatamente.",
      "Evacuación: Abandone el área a pie y alerte a los vecinos en el trayecto sin usar timbres."
    ]
  }
];

const EMERGENCY_PHONES = [
  { name: "Emergencias Nacionales (VEN 911)", phone: "911", desc: "Atención médica, policial y rescate" },
  { name: "Bomberos de Caracas", phone: "0212-5454545", desc: "Incendios y rescate en el Distrito Capital" },
  { name: "Protección Civil Nacional", phone: "0800-7248454", desc: "Coordinación de desastres" },
  { name: "Cruz Roja Venezolana", phone: "0212-5781283", desc: "Atención médica humanitaria" },
  { name: "Bomberos de Aragua (Maracay)", phone: "0243-2422222", desc: "Emergencias en el estado Aragua" },
  { name: "Protección Civil Carabobo", phone: "0241-8586414", desc: "Emergencias en el estado Carabobo" },
  { name: "Bomberos de La Guaira", phone: "0212-3311911", desc: "Emergencias en el estado La Guaira" }
];

export default function SurvivalSection() {
  const [isWhistleActive, setIsWhistleActive] = useState(false);
  const [isStrobeActive, setIsStrobeActive] = useState(false);
  const [strobeColor, setStrobeColor] = useState('bg-yellow-400');
  const [selectedGuide, setSelectedGuide] = useState<number | null>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const strobeIntervalRef = useRef<number | null>(null);

  const toggleWhistle = () => {
    if (isWhistleActive) {
      stopWhistle();
    } else {
      startWhistle();
    }
  };

  const startWhistle = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2900, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      let isBeep = true;
      const interval = setInterval(() => {
        if (!gainNodeRef.current || !audioCtxRef.current) return;
        const now = audioCtxRef.current.currentTime;
        if (isBeep) {
          gainNodeRef.current.gain.linearRampToValueAtTime(1.0, now + 0.05);
        } else {
          gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.1);
        }
        isBeep = !isBeep;
      }, 250);

      (osc as any).pulseInterval = interval;
      setIsWhistleActive(true);
    } catch (e) {
      console.error("Error starting digital whistle:", e);
    }
  };

  const stopWhistle = () => {
    if (oscillatorRef.current) {
      clearInterval((oscillatorRef.current as any).pulseInterval);
      try {
        oscillatorRef.current.stop();
      } catch (e) {}
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsWhistleActive(false);
  };

  const toggleStrobe = () => {
    if (isStrobeActive) {
      if (strobeIntervalRef.current) {
        clearInterval(strobeIntervalRef.current);
        strobeIntervalRef.current = null;
      }
      setIsStrobeActive(false);
      stopCameraFlash();
    } else {
      setIsStrobeActive(true);
      startCameraFlash();
      let step = 0;
      const interval = window.setInterval(() => {
        setStrobeColor(step % 2 === 0 ? 'bg-yellow-400' : 'bg-black');
        step++;
      }, 80);
      strobeIntervalRef.current = interval;
    }
  };

  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  const startCameraFlash = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        const track = stream.getVideoTracks()[0];
        videoTrackRef.current = track;
        const capabilities = track.getCapabilities() as any;
        if (capabilities && capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: true }] as any
          });
        }
      }
    } catch (e) {
      console.log("Device torch not supported or permission denied. Falling back to screen strobe.");
    }
  };

  const stopCameraFlash = () => {
    if (videoTrackRef.current) {
      try {
        videoTrackRef.current.applyConstraints({
          advanced: [{ torch: false }] as any
        });
        videoTrackRef.current.stop();
      } catch (e) {}
      videoTrackRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopWhistle();
      if (strobeIntervalRef.current) clearInterval(strobeIntervalRef.current);
      stopCameraFlash();
    };
  }, []);

  return (
    <div className="space-y-6" id="survival-section">
      {/* Visual Strobe Overlay */}
      {isStrobeActive && (
        <div 
          onClick={toggleStrobe}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer transition-colors duration-75 ${strobeColor}`}
        >
          <div className="bg-black/90 border border-white/10 p-6 rounded-2xl text-center max-w-sm mx-4 shadow-2xl backdrop-blur-md">
            <Lightbulb className="w-14 h-14 text-yellow-400 animate-bounce mx-auto mb-3" />
            <h4 className="text-white font-display font-black text-lg tracking-wide uppercase">SEÑAL DE BALIZA ACTIVA</h4>
            <p className="text-white/60 text-xs mt-1 leading-relaxed">
              Strobe estroboscópico táctico de alta visibilidad para localización visual por rescatistas.
            </p>
            <button className="mt-5 px-5 py-2 bg-[#D32F2F] text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider border border-[#FF5252]">
              DETENER SEÑALIZACIÓN
            </button>
          </div>
        </div>
      )}

      {/* Emergency Tools Card */}
      <div className="bg-gradient-to-br from-[#1c1212] to-[#080808] border border-[#D32F2F]/30 rounded-xl p-5.5 shadow-[0_4px_25px_rgba(211,47,47,0.1)]" id="survival-tools">
        <h3 className="text-lg font-display font-black text-[#D32F2F] mb-3 flex items-center gap-2.5 uppercase tracking-wide">
          <ShieldAlert className="w-5 h-5 text-[#D32F2F] animate-pulse" />
          HERRAMIENTAS DE SEÑALIZACIÓN (100% OFF-LINE)
        </h3>
        <p className="text-xs text-white/60 mb-5 leading-relaxed">
          Sistemas acústicos y ópticos diseñados exclusivamente para situaciones críticas de atrapamiento o colapso. Optimizados para consumo ultra-bajo de batería, funcionando de forma autónoma sin señal telefónica ni datos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Whistle Button */}
          <button
            onClick={toggleWhistle}
            className={`flex items-center justify-between p-4.5 rounded-xl border transition-all duration-300 cursor-pointer ${
              isWhistleActive
                ? 'bg-[#D32F2F] text-white border-[#FF5252] shadow-[0_0_15px_rgba(211,47,47,0.4)] animate-pulse'
                : 'bg-black/40 text-white border-white/10 hover:border-[#D32F2F]/40'
            }`}
            id="whistle-btn"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg transition-all duration-300 ${isWhistleActive ? 'bg-[#b71c1c]' : 'bg-[#D32F2F]/10 text-[#D32F2F]'}`}>
                <Volume2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-mono font-bold text-sm tracking-wide">SILBATO DE CRISIS</p>
                <p className={`text-[11px] font-medium leading-relaxed mt-0.5 ${isWhistleActive ? 'text-white/80' : 'text-white/40'}`}>
                  {isWhistleActive ? 'Emitiendo ráfagas acústicas de 2.9kHz (SOS)' : 'Tono penetrante para escombros'}
                </p>
              </div>
            </div>
            <div className="text-[10px] font-mono font-extrabold uppercase tracking-widest bg-black/40 px-2.5 py-1 rounded border border-white/10">
              {isWhistleActive ? 'STOP' : 'PLAY'}
            </div>
          </button>

          {/* Strobe Button */}
          <button
            onClick={toggleStrobe}
            className={`flex items-center justify-between p-4.5 rounded-xl border transition-all duration-300 cursor-pointer ${
              isStrobeActive
                ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                : 'bg-black/40 text-white border-white/10 hover:border-yellow-500/40'
            }`}
            id="strobe-btn"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg transition-all duration-300 ${isStrobeActive ? 'bg-yellow-600' : 'bg-yellow-500/10 text-yellow-500'}`}>
                <Lightbulb className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-mono font-bold text-sm tracking-wide">BALIZA LUMÍNICA</p>
                <p className={`text-[11px] font-medium leading-relaxed mt-0.5 ${isStrobeActive ? 'text-black/80' : 'text-white/40'}`}>
                  {isStrobeActive ? 'Strobe de alta frecuencia activo' : 'Pulsador de pantalla + linterna flash'}
                </p>
              </div>
            </div>
            <div className="text-[10px] font-mono font-extrabold uppercase tracking-widest bg-black/40 px-2.5 py-1 rounded border border-white/10">
              {isStrobeActive ? 'STOP' : 'PLAY'}
            </div>
          </button>
        </div>
      </div>

      {/* Directory of Emergency Contacts */}
      <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-5.5 shadow-lg" id="emergency-directory">
        <h3 className="text-lg font-display font-black text-white mb-4 flex items-center gap-2.5 uppercase tracking-wide">
          <Phone className="w-5 h-5 text-[#D32F2F]" />
          NÚMEROS DE EMERGENCIA Y DESPACHO
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {EMERGENCY_PHONES.map((item, index) => (
            <a
              key={index}
              href={`tel:${item.phone.replace(/[^0-9]/g, '')}`}
              className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5 hover:border-[#D32F2F]/30 transition-all duration-300 group"
            >
              <div>
                <p className="font-mono font-bold text-white text-sm group-hover:text-[#D32F2F] transition-colors uppercase">
                  {item.name}
                </p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#D32F2F]/10 text-[#D32F2F] text-xs px-3 py-1.5 rounded-lg font-mono font-bold border border-[#D32F2F]/20 shrink-0">
                <Phone className="w-3.5 h-3.5" />
                {item.phone}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Embedded Manuals Section */}
      <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-5.5 shadow-lg" id="survival-manuals">
        <h3 className="text-lg font-display font-black text-white mb-4 flex items-center gap-2.5 uppercase tracking-wide">
          <BookOpen className="w-5 h-5 text-[#D32F2F]" />
          MANUALES CIVILES DE PRIMERA RESPUESTA
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Menu */}
          <div className="lg:col-span-1 flex flex-col gap-2 font-mono">
            {EMERGENCY_GUIDES.map((guide, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedGuide(idx)}
                className={`text-left p-3.5 rounded-lg border text-xs font-bold uppercase transition-all duration-200 cursor-pointer ${
                  selectedGuide === idx
                    ? 'bg-[#D32F2F]/10 text-white border-[#D32F2F] shadow-sm'
                    : 'bg-black/30 text-white/50 border-white/5 hover:bg-white/5 hover:text-white'
                }`}
              >
                {guide.title}
              </button>
            ))}
          </div>

          {/* Guide Detail View */}
          <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl p-5">
            {selectedGuide !== null ? (
              <div>
                <div className="flex items-center gap-2.5 mb-4 border-b border-white/5 pb-3">
                  <span className="bg-[#D32F2F]/10 text-[#D32F2F] text-[10px] px-2.5 py-1 rounded border border-[#D32F2F]/20 uppercase font-mono font-bold">
                    {EMERGENCY_GUIDES[selectedGuide].category}
                  </span>
                  <h4 className="font-display font-black text-white text-base uppercase tracking-tight">
                    {EMERGENCY_GUIDES[selectedGuide].title}
                  </h4>
                </div>
                <ul className="space-y-4">
                  {EMERGENCY_GUIDES[selectedGuide].steps.map((step, sIdx) => {
                    const [boldText, regularText] = step.split(': ');
                    return (
                      <li key={sIdx} className="flex gap-3 text-xs md:text-sm text-white/80 leading-relaxed">
                        <span className="text-[#D32F2F] font-mono font-bold text-sm shrink-0 mt-0.5">{String(sIdx + 1).padStart(2, '0')}.</span>
                        <p>
                          <strong className="text-white font-mono font-semibold tracking-wide block sm:inline uppercase text-xs sm:text-sm mr-1">{boldText}:</strong> 
                          {regularText}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-white/30 text-center py-10 font-mono text-xs">SELECCIONE UN PROTOCOLO ACTIVO</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
