import React, { useState } from 'react';
import { StructuralEvaluation, DamageLevel } from '../types';
import { Building2, ShieldAlert, CheckCircle2, AlertTriangle, FileText, ChevronRight, ChevronLeft } from 'lucide-react';

const ITEMS_A = [
  "Columnas: grietas inclinadas (45 deg)",
  "Columnas: aplastamiento del concreto",
  "Columnas: acero de refuerzo expuesto",
  "Columnas: perdida de verticalidad",
  "Muros: fisuras en X o diagonales",
  "Muros: desplazamiento fuera del plano",
  "Muros: colapso parcial o total",
  "Nudos viga-columna: dano o fisuras",
  "Conexiones: separacion o deslizamiento"
];

const ITEMS_B = [
  "Losas: grietas excesivas o flechas",
  "Losas: colapso parcial o total",
  "Vigas: grietas en extremos (zona critica)",
  "Vigas: perdida de apoyo en extremos",
  "Vigas: deformacion excesiva visible",
  "Escaleras: fisuras o separacion de muros",
  "Escaleras: bloqueo de ruta evacuacion",
  "Balcones: fisuras o desplazamiento",
  "Volados: deflexion excesiva visible"
];

const ITEMS_C = [
  "Deriva visible (inclinacion de la estructura)",
  "Piso blando identificado (planta blanda)",
  "Columna corta (corte por ventana)",
  "Golpeteo con edificio contiguo",
  "Colapso parcial de entrepiso o techo",
  "Irregularidad en planta o altura visible",
  "Separacion de juntas de construccion"
];

const ITEMS_D = [
  "Fachada: caida de revestimientos",
  "Fachada: ventanas rotas o marcos danados",
  "Tabiques: fisuras en X o colapso",
  "Cielos rasos: caida parcial o total",
  "Antetechos o parapetos: inestables",
  "Antenas, tanques: caidos o inclinados",
  "Cornisas o molduras: desprendidas"
];

const ITEMS_E = [
  "Grietas en terreno circundante",
  "Asentamiento diferencial visible",
  "Inclinacion del edificio respecto vert.",
  "Arena o agua emergente (licuefaccion)",
  "Socavacion o erosion en cimentacion",
  "Desplazamiento lateral del terreno"
];

const ITEMS_F = [
  "Olor a gas o tuberias rotas visibles",
  "Cableado electrico expuesto / chispas",
  "Inundacion por ruptura hidraulica",
  "Ascensores: NO OPERAR hasta insp.",
  "Extintores / red contra incendio: dano",
  "Transformadores: derrame o inclinacion"
];

const DAMAGE_LEVELS: DamageLevel[] = ["Ninguno", "Leve", "Moderado", "Severo", "Colapso"];

export const createDefaultEvaluation = (): StructuralEvaluation => {
  const initRecord = (items: string[]) => {
    const rec: Record<string, DamageLevel> = {};
    items.forEach(it => { rec[it] = 'Ninguno'; });
    return rec;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return {
    formulario_evaluacion_post_sismo: {
      datos_edificacion: {
        direccion: '',
        fecha: todayStr,
        anio_construccion: 1980,
        no_pisos: 1,
        uso: 'Residencial',
        zona_sismica: 'Zona 5 (Elevada)',
        sistema_estructural: {
          porticos_concreto: true,
          muros_corte: false,
          mixto: false,
          mamposteria: false,
          acero: false,
          otro: ''
        },
        ingeniero_evaluador: {
          nombre: '',
          cod_inces_civ: ''
        }
      },
      secciones_evaluacion: {
        A_elementos_verticales: { items: ITEMS_A, calificaciones: initRecord(ITEMS_A) },
        B_elementos_horizontales: { items: ITEMS_B, calificaciones: initRecord(ITEMS_B) },
        C_sistema_global: { items: ITEMS_C, calificaciones: initRecord(ITEMS_C) },
        D_elementos_no_estructurales: { items: ITEMS_D, calificaciones: initRecord(ITEMS_D) },
        E_terreno_y_cimentacion: { items: ITEMS_E, calificaciones: initRecord(ITEMS_E) },
        F_instalaciones_y_riesgo_secundario: { items: ITEMS_F, calificaciones: initRecord(ITEMS_F) }
      },
      observaciones: {
        fotos: [
          { id: 1, descripcion: 'Evidencia Fachada' },
          { id: 2, descripcion: 'Daño Estructural Interno' },
          { id: 3, descripcion: 'Daño en Entorno / Cimentación' }
        ],
        notas_adicionales: ''
      },
      resumen_final: {
        clasificacion: 'Verde - Habitable',
        justificacion: '',
        firma_evaluador: {
          nombre_firma: '',
          civ_no: '',
          fecha: todayStr
        },
        acciones_inmediatas: {
          evacuar_acordonar: false,
          notificar_proteccion_civil: false,
          cortar_servicios: false,
          no_usar_ascensores: true,
          apuntalar: false,
          documentar_fotos: true,
          esperar_inspeccion_2do: false,
          informar_vecinos: false
        }
      }
    }
  };
};

interface Props {
  value: StructuralEvaluation;
  onChange: (val: StructuralEvaluation) => void;
}

type TabKey = 'edificio' | 'estructural' | 'riesgos' | 'dictamen';

export const StructuralEvaluationModule: React.FC<Props> = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('edificio');
  const form = value.formulario_evaluacion_post_sismo;

  const updateBuilding = (field: string, val: any) => {
    onChange({
      formulario_evaluacion_post_sismo: {
        ...form,
        datos_edificacion: {
          ...form.datos_edificacion,
          [field]: val
        }
      }
    });
  };

  const updateStructuralSystem = (field: string, val: any) => {
    onChange({
      formulario_evaluacion_post_sismo: {
        ...form,
        datos_edificacion: {
          ...form.datos_edificacion,
          sistema_estructural: {
            ...form.datos_edificacion.sistema_estructural,
            [field]: val
          }
        }
      }
    });
  };

  const updateEngineer = (field: string, val: string) => {
    onChange({
      formulario_evaluacion_post_sismo: {
        ...form,
        datos_edificacion: {
          ...form.datos_edificacion,
          ingeniero_evaluador: {
            ...form.datos_edificacion.ingeniero_evaluador,
            [field]: val
          }
        }
      }
    });
  };

  const updateSectionRating = (sectionKey: keyof typeof form.secciones_evaluacion, item: string, level: DamageLevel) => {
    const sec = form.secciones_evaluacion[sectionKey];
    onChange({
      formulario_evaluacion_post_sismo: {
        ...form,
        secciones_evaluacion: {
          ...form.secciones_evaluacion,
          [sectionKey]: {
            ...sec,
            calificaciones: {
              ...sec.calificaciones,
              [item]: level
            }
          }
        }
      }
    });
  };

  const updateFinalSummary = (field: string, val: any) => {
    onChange({
      formulario_evaluacion_post_sismo: {
        ...form,
        resumen_final: {
          ...form.resumen_final,
          [field]: val
        }
      }
    });
  };

  const updateSignature = (field: string, val: string) => {
    onChange({
      formulario_evaluacion_post_sismo: {
        ...form,
        resumen_final: {
          ...form.resumen_final,
          firma_evaluador: {
            ...form.resumen_final.firma_evaluador,
            [field]: val
          }
        }
      }
    });
  };

  const updateImmediateActions = (field: keyof typeof form.resumen_final.acciones_inmediatas, val: boolean) => {
    onChange({
      formulario_evaluacion_post_sismo: {
        ...form,
        resumen_final: {
          ...form.resumen_final,
          acciones_inmediatas: {
            ...form.resumen_final.acciones_inmediatas,
            [field]: val
          }
        }
      }
    });
  };

  const renderSectionTable = (title: string, secKey: keyof typeof form.secciones_evaluacion) => {
    const secObj = form.secciones_evaluacion[secKey];
    return (
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-3.5">
        <h5 className="text-xs font-mono font-black text-amber-400 uppercase tracking-wide border-b border-white/10 pb-2.5 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          {title}
        </h5>
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
          {secObj.items.map((it, idx) => {
            const currentLevel = secObj.calificaciones[it] || 'Ninguno';
            return (
              <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] transition-colors text-xs font-mono">
                <span className="text-white/90 font-semibold leading-relaxed block">{it}</span>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {DAMAGE_LEVELS.map(lvl => {
                    const isSel = currentLevel === lvl;
                    let colorClass = 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/70';
                    if (isSel) {
                      if (lvl === 'Ninguno') colorClass = 'bg-emerald-500/25 text-emerald-300 border-emerald-500 font-black shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                      else if (lvl === 'Leve') colorClass = 'bg-sky-500/25 text-sky-300 border-sky-500 font-black shadow-[0_0_10px_rgba(14,165,233,0.2)]';
                      else if (lvl === 'Moderado') colorClass = 'bg-amber-500/25 text-amber-300 border-amber-500 font-black shadow-[0_0_10px_rgba(245,158,11,0.2)]';
                      else colorClass = 'bg-red-600/35 text-red-200 border-red-500 font-black animate-pulse shadow-[0_0_12px_rgba(220,38,38,0.4)]';
                    }
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => updateSectionRating(secKey, it, lvl)}
                        className={`px-1 py-2 text-[10px] sm:text-xs rounded border transition-all cursor-pointer select-none text-center truncate ${colorClass}`}
                      >
                        {lvl === 'Moderado' ? 'Mod.' : lvl}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFooterNav = (prevTab?: TabKey, nextTab?: TabKey, nextLabel?: string) => (
    <div className="flex items-center justify-between pt-5 border-t border-white/10 mt-6 gap-3">
      {prevTab ? (
        <button
          type="button"
          onClick={() => setActiveTab(prevTab)}
          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4 text-white/60" /> ANTERIOR
        </button>
      ) : <div />}

      {nextTab && (
        <button
          type="button"
          onClick={() => setActiveTab(nextTab)}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-xl text-xs font-mono font-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer flex items-center gap-2 ml-auto uppercase tracking-wider active:scale-95"
        >
          {nextLabel || 'SIGUIENTE SECCIÓN'} <ChevronRight className="w-4 h-4 text-black shrink-0" />
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-[#0c0c0c] border border-amber-500/50 rounded-2xl p-4 sm:p-6 space-y-6 font-mono shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header & Title */}
      <div className="flex flex-col gap-4 border-b border-amber-500/30 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-widest flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> NORMA COVENIN 1756 / ATC-20 / FEMA 154
          </span>
          <span className="text-[11px] text-white/40">Paso {(["edificio", "estructural", "riesgos", "dictamen"] as const).indexOf(activeTab) + 1} de 4</span>
        </div>
        <h4 className="text-xl font-display font-black text-white tracking-wide uppercase">
          🏛️ EVALUACIÓN ESTRUCTURAL POST-SISMO
        </h4>

        {/* Improved Full-Width Responsive Grid Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-black/80 p-1.5 rounded-xl border border-white/10 text-xs font-bold mt-1">
          {[
            { id: 'edificio', label: '1. EDIFICIO & CIV' },
            { id: 'estructural', label: '2. DAÑOS A-C' },
            { id: 'riesgos', label: '3. RIESGOS D-F' },
            { id: 'dictamen', label: '4. DICTAMEN' }
          ].map((tab, tIdx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`py-2.5 px-3 rounded-lg transition-all cursor-pointer text-center select-none truncate ${
                  isActive 
                    ? 'bg-amber-500 text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-[1.02]' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Building & Engineer Data */}
      {activeTab === 'edificio' && (
        <div className="space-y-5 text-xs animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1.5 tracking-wider">DIRECCIÓN DE EDIFICACIÓN</label>
              <input
                type="text"
                value={form.datos_edificacion.direccion}
                onChange={e => updateBuilding('direccion', e.target.value)}
                placeholder="Ej: Torre Delta, Av. Francisco de Miranda"
                className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1.5 tracking-wider">USO DE EDIFICACIÓN</label>
              <input
                type="text"
                value={form.datos_edificacion.uso}
                onChange={e => updateBuilding('uso', e.target.value)}
                placeholder="Ej: Residencial, Hospital, Educativo, Oficina"
                className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1.5 tracking-wider">AÑO DE CONSTRUCCIÓN</label>
              <input
                type="number"
                value={form.datos_edificacion.anio_construccion}
                onChange={e => updateBuilding('anio_construccion', parseInt(e.target.value) || 0)}
                className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1.5 tracking-wider">NÚMERO DE PISOS</label>
              <input
                type="number"
                value={form.datos_edificacion.no_pisos}
                onChange={e => updateBuilding('no_pisos', parseInt(e.target.value) || 1)}
                className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="bg-black/60 p-4 rounded-xl border border-white/10 space-y-3">
            <label className="block text-[10px] text-amber-400 font-bold uppercase tracking-widest">SISTEMA ESTRUCTURAL PRINCIPAL</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-white/80">
              {[
                { key: 'porticos_concreto', label: 'Pórticos Concreto' },
                { key: 'muros_corte', label: 'Muros de Corte' },
                { key: 'mixto', label: 'Sistema Mixto' },
                { key: 'acero', label: 'Estructura Acero' },
                { key: 'mamposteria', label: 'Mampostería' }
              ].map(sys => (
                <label key={sys.key} className="flex items-center gap-2 bg-white/5 p-2.5 rounded-lg hover:bg-white/10 cursor-pointer select-none transition-colors border border-white/5">
                  <input
                    type="checkbox"
                    checked={(form.datos_edificacion.sistema_estructural as any)[sys.key]}
                    onChange={e => updateStructuralSystem(sys.key, e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded"
                  />
                  {sys.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1.5 tracking-wider">NOMBRE DEL INGENIERO EVALUADOR</label>
              <input
                type="text"
                value={form.datos_edificacion.ingeniero_evaluador.nombre}
                onChange={e => updateEngineer('nombre', e.target.value)}
                placeholder="Ej: Ing. Carlos Mendoza"
                className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1.5 tracking-wider">CÓDIGO CIV / INCES</label>
              <input
                type="text"
                value={form.datos_edificacion.ingeniero_evaluador.cod_inces_civ}
                onChange={e => {
                  updateEngineer('cod_inces_civ', e.target.value);
                  updateSignature('civ_no', e.target.value);
                }}
                placeholder="Ej: CIV 124.567"
                className="w-full bg-black/70 border border-amber-500/40 rounded-xl p-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 font-black text-amber-300"
              />
            </div>
          </div>

          {renderFooterNav(undefined, 'estructural', 'EVALUAR DAÑOS A-C')}
        </div>
      )}

      {/* Tab 2: Structural Damage Sections A - C */}
      {activeTab === 'estructural' && (
        <div className="space-y-5 animate-fadeIn">
          {renderSectionTable("Sección A: Elementos Estructurales Verticales", "A_elementos_verticales")}
          {renderSectionTable("Sección B: Elementos Estructurales Horizontales", "B_elementos_horizontales")}
          {renderSectionTable("Sección C: Estabilidad del Sistema Global & Deriva", "C_sistema_global")}
          
          {renderFooterNav('edificio', 'riesgos', 'EVALUAR RIESGOS D-F')}
        </div>
      )}

      {/* Tab 3: Secondary Risks Sections D - F */}
      {activeTab === 'riesgos' && (
        <div className="space-y-5 animate-fadeIn">
          {renderSectionTable("Sección D: Elementos No Estructurales & Fachada", "D_elementos_no_estructurales")}
          {renderSectionTable("Sección E: Terreno, Suelo & Cimentación", "E_terreno_y_cimentacion")}
          {renderSectionTable("Sección F: Instalaciones y Riesgos Tecnológicos", "F_instalaciones_y_riesgo_secundario")}

          {renderFooterNav('estructural', 'dictamen', 'EMITIR DICTAMEN FINAL')}
        </div>
      )}

      {/* Tab 4: Final Dictamen & Emergency Actions */}
      {activeTab === 'dictamen' && (
        <div className="space-y-5 text-xs animate-fadeIn">
          <div className="bg-black/60 border border-white/10 rounded-xl p-5 space-y-3.5">
            <label className="block text-xs font-mono font-black text-amber-400 uppercase tracking-wider">
              CLASIFICACIÓN COVENIN 1756 / ATC-20 (HABITABILIDAD POST-SISMO):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {(["Verde - Habitable", "Amarillo - Restringido", "Rojo - No Habitable"] as const).map(clas => {
                const isSel = form.resumen_final.clasificacion === clas;
                let bgCls = 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white';
                if (isSel) {
                  if (clas.includes('Verde')) bgCls = 'bg-[#4CAF50]/20 border-[#4CAF50] text-[#4CAF50] font-black shadow-[0_0_15px_rgba(76,175,80,0.3)] scale-[1.02]';
                  else if (clas.includes('Amarillo')) bgCls = 'bg-[#FF9800]/20 border-[#FF9800] text-[#FF9800] font-black shadow-[0_0_15px_rgba(255,152,0,0.3)] scale-[1.02]';
                  else bgCls = 'bg-[#D32F2F]/30 border-[#D32F2F] text-red-300 font-black shadow-[0_0_20px_rgba(211,47,47,0.5)] animate-pulse scale-[1.02]';
                }
                return (
                  <button
                    key={clas}
                    type="button"
                    onClick={() => updateFinalSummary('clasificacion', clas)}
                    className={`p-4 rounded-xl border text-center font-display font-black uppercase tracking-wide transition-all cursor-pointer ${bgCls}`}
                  >
                    {clas}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-white/50 font-bold mb-1.5 tracking-wider">JUSTIFICACIÓN TÉCNICA DEL DICTAMEN</label>
            <textarea
              value={form.resumen_final.justificacion}
              onChange={e => updateFinalSummary('justificacion', e.target.value)}
              rows={3}
              placeholder="Describa el mecanismo de falla o el argumento clínico-estructural por el cual se restringe la ocupación..."
              className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs leading-relaxed"
            />
          </div>

          <div className="bg-black/60 p-5 rounded-xl border border-white/10 space-y-3.5">
            <label className="block text-[10px] text-amber-400 font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
              ACCIONES INMEDIATAS REQUERIDAS EN LA ESCENA
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-white/90">
              {[
                { key: 'evacuar_acordonar', label: '🚨 Evacuar edificación y acordonar perímetro' },
                { key: 'notificar_proteccion_civil', label: '📞 Notificar de urgencia a Protección Civil / Bomberos' },
                { key: 'cortar_servicios', label: '⚡ Cortar suministro eléctrico, gas y agua' },
                { key: 'no_usar_ascensores', label: '🛑 Prohibir estrictamente uso de ascensores' },
                { key: 'apuntalar', label: '🏗️ Apuntalamiento de emergencia en zona crítica' },
                { key: 'documentar_fotos', label: '📸 Documentar evidencia fotográfica para expediente' },
                { key: 'esperar_inspeccion_2do', label: '⏳ Solicitar inspección estructural de segundo nivel' },
                { key: 'informar_vecinos', label: '📢 Alertar a edificios colindantes por riesgo de caída' }
              ].map(act => (
                <label key={act.key} className="flex items-center gap-2.5 bg-white/[0.04] p-2.5 rounded-lg hover:bg-white/[0.08] cursor-pointer select-none text-xs border border-white/[0.05] transition-colors">
                  <input
                    type="checkbox"
                    checked={(form.resumen_final.acciones_inmediatas as any)[act.key]}
                    onChange={e => updateImmediateActions(act.key as any, e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded"
                  />
                  {act.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1.5 tracking-wider">FIRMA RESPONSABLE DEL EVALUADOR</label>
              <input
                type="text"
                value={form.resumen_final.firma_evaluador.nombre_firma}
                onChange={e => updateSignature('nombre_firma', e.target.value)}
                placeholder="Ing. Evaluador Autorizado"
                className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1.5 tracking-wider">FECHA DE EVALUACIÓN OFICIAL</label>
              <input
                type="date"
                value={form.resumen_final.firma_evaluador.fecha}
                onChange={e => updateSignature('fecha', e.target.value)}
                className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {renderFooterNav('riesgos', undefined)}
        </div>
      )}
    </div>
  );
};
