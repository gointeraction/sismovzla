import React, { useState } from 'react';
import { StructuralEvaluation, DamageLevel } from '../types';
import { Building2, ShieldAlert, CheckCircle2, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

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

export const StructuralEvaluationModule: React.FC<Props> = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState<'edificio' | 'estructural' | 'riesgos' | 'dictamen'>('edificio');
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
      <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-3">
        <h5 className="text-xs font-mono font-black text-amber-400 uppercase tracking-wide border-b border-white/10 pb-2">
          {title}
        </h5>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {secObj.items.map((it, idx) => {
            const currentLevel = secObj.calificaciones[it] || 'Ninguno';
            return (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded bg-white/5 text-xs font-mono">
                <span className="text-white/80 shrink sm:max-w-[55%]">{it}</span>
                <div className="flex items-center gap-1 shrink-0 overflow-x-auto pb-1 sm:pb-0">
                  {DAMAGE_LEVELS.map(lvl => {
                    const isSel = currentLevel === lvl;
                    let colorClass = 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10';
                    if (isSel) {
                      if (lvl === 'Ninguno') colorClass = 'bg-green-500/20 text-green-400 border-green-500 font-bold';
                      else if (lvl === 'Leve') colorClass = 'bg-blue-500/20 text-blue-400 border-blue-500 font-bold';
                      else if (lvl === 'Moderado') colorClass = 'bg-amber-500/20 text-amber-400 border-amber-500 font-bold';
                      else colorClass = 'bg-red-500/30 text-red-300 border-red-500 font-bold animate-pulse';
                    }
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => updateSectionRating(secKey, it, lvl)}
                        className={`px-2 py-1 text-[10px] rounded border transition-all cursor-pointer select-none ${colorClass}`}
                      >
                        {lvl}
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

  return (
    <div className="bg-black/80 border border-amber-500/40 rounded-2xl p-5 space-y-5 font-mono shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-500/30 pb-4 gap-3">
        <div>
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
            NORMA COVENIN 1756 / ATC-20 / FEMA 154
          </span>
          <h4 className="text-lg font-display font-black text-white mt-1 uppercase">
            🏛️ EVALUACIÓN ESTRUCTURAL POST-SISMO
          </h4>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-white/10 text-[10px] font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('edificio')}
            className={`px-2.5 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${activeTab === 'edificio' ? 'bg-amber-500 text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            1. EDIFICIO & CIV
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('estructural')}
            className={`px-2.5 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${activeTab === 'estructural' ? 'bg-amber-500 text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            2. DAÑOS A-C
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('riesgos')}
            className={`px-2.5 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${activeTab === 'riesgos' ? 'bg-amber-500 text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            3. RIESGOS D-F
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dictamen')}
            className={`px-2.5 py-1.5 rounded transition-all whitespace-nowrap cursor-pointer ${activeTab === 'dictamen' ? 'bg-amber-500 text-black font-black' : 'text-white/60 hover:text-white'}`}
          >
            4. DICTAMEN FINAL
          </button>
        </div>
      </div>

      {/* Tab 1: Building & Engineer Data */}
      {activeTab === 'edificio' && (
        <div className="space-y-4 text-xs animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1">DIRECCIÓN DE EDIFICACIÓN</label>
              <input
                type="text"
                value={form.datos_edificacion.direccion}
                onChange={e => updateBuilding('direccion', e.target.value)}
                placeholder="Ej: Torre Delta, Av. Francisco de Miranda"
                className="w-full bg-black/60 border border-white/10 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1">USO DE EDIFICACIÓN</label>
              <input
                type="text"
                value={form.datos_edificacion.uso}
                onChange={e => updateBuilding('uso', e.target.value)}
                placeholder="Ej: Residencial, Hospital, Educativo, Oficina"
                className="w-full bg-black/60 border border-white/10 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1">AÑO DE CONSTRUCCIÓN</label>
              <input
                type="number"
                value={form.datos_edificacion.anio_construccion}
                onChange={e => updateBuilding('anio_construccion', parseInt(e.target.value) || 0)}
                className="w-full bg-black/60 border border-white/10 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1">NÚMERO DE PISOS</label>
              <input
                type="number"
                value={form.datos_edificacion.no_pisos}
                onChange={e => updateBuilding('no_pisos', parseInt(e.target.value) || 1)}
                className="w-full bg-black/60 border border-white/10 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-black/50 p-3 rounded-xl border border-white/5 space-y-2">
            <label className="block text-[10px] text-amber-400 font-bold uppercase">SISTEMA ESTRUCTURAL PRINCIPAL</label>
            <div className="flex flex-wrap gap-3 text-white/80">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={form.datos_edificacion.sistema_estructural.porticos_concreto} onChange={e => updateStructuralSystem('porticos_concreto', e.target.checked)} className="accent-amber-500" />
                Pórticos de Concreto
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={form.datos_edificacion.sistema_estructural.muros_corte} onChange={e => updateStructuralSystem('muros_corte', e.target.checked)} className="accent-amber-500" />
                Muros de Corte
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={form.datos_edificacion.sistema_estructural.mixto} onChange={e => updateStructuralSystem('mixto', e.target.checked)} className="accent-amber-500" />
                Sistema Mixto
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={form.datos_edificacion.sistema_estructural.acero} onChange={e => updateStructuralSystem('acero', e.target.checked)} className="accent-amber-500" />
                Estructura de Acero
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={form.datos_edificacion.sistema_estructural.mamposteria} onChange={e => updateStructuralSystem('mamposteria', e.target.checked)} className="accent-amber-500" />
                Mampostería
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1">NOMBRE DEL INGENIERO EVALUADOR</label>
              <input
                type="text"
                value={form.datos_edificacion.ingeniero_evaluador.nombre}
                onChange={e => updateEngineer('nombre', e.target.value)}
                placeholder="Ej: Ing. Carlos Mendoza"
                className="w-full bg-black/60 border border-white/10 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1">CÓDIGO CIV / INCES</label>
              <input
                type="text"
                value={form.datos_edificacion.ingeniero_evaluador.cod_inces_civ}
                onChange={e => {
                  updateEngineer('cod_inces_civ', e.target.value);
                  updateSignature('civ_no', e.target.value);
                }}
                placeholder="Ej: CIV 124.567"
                className="w-full bg-black/60 border border-white/10 rounded p-2 text-white focus:border-amber-400 focus:outline-none font-bold text-amber-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Structural Damage Sections A - C */}
      {activeTab === 'estructural' && (
        <div className="space-y-4 animate-fadeIn">
          {renderSectionTable("Sección A: Elementos Estructurales Verticales", "A_elementos_verticales")}
          {renderSectionTable("Sección B: Elementos Estructurales Horizontales", "B_elementos_horizontales")}
          {renderSectionTable("Sección C: Estabilidad del Sistema Global & Deriva", "C_sistema_global")}
        </div>
      )}

      {/* Tab 3: Secondary Risks Sections D - F */}
      {activeTab === 'riesgos' && (
        <div className="space-y-4 animate-fadeIn">
          {renderSectionTable("Sección D: Elementos No Estructurales & Fachada", "D_elementos_no_estructurales")}
          {renderSectionTable("Sección E: Terreno, Suelo & Cimentación", "E_terreno_y_cimentacion")}
          {renderSectionTable("Sección F: Instalaciones y Riesgos Tecnológicos", "F_instalaciones_y_riesgo_secundario")}
        </div>
      )}

      {/* Tab 4: Final Dictamen & Emergency Actions */}
      {activeTab === 'dictamen' && (
        <div className="space-y-5 text-xs animate-fadeIn">
          <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-mono font-black text-white uppercase tracking-wider">
              CLASIFICACIÓN COVENIN 1756 / ATC-20 (HABITABILIDAD POST-SISMO):
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(["Verde - Habitable", "Amarillo - Restringido", "Rojo - No Habitable"] as const).map(clas => {
                const isSel = form.resumen_final.clasificacion === clas;
                let bgCls = 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10';
                if (isSel) {
                  if (clas.includes('Verde')) bgCls = 'bg-[#4CAF50]/20 border-[#4CAF50] text-[#4CAF50] font-black shadow-lg';
                  else if (clas.includes('Amarillo')) bgCls = 'bg-[#FF9800]/20 border-[#FF9800] text-[#FF9800] font-black shadow-lg';
                  else bgCls = 'bg-[#D32F2F]/30 border-[#D32F2F] text-red-300 font-black shadow-lg animate-pulse';
                }
                return (
                  <button
                    key={clas}
                    type="button"
                    onClick={() => updateFinalSummary('clasificacion', clas)}
                    className={`p-3 rounded-xl border text-center font-display uppercase tracking-wide transition-all cursor-pointer ${bgCls}`}
                  >
                    {clas}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-white/50 font-bold mb-1">JUSTIFICACIÓN TÉCNICA DEL DICTAMEN</label>
            <textarea
              value={form.resumen_final.justificacion}
              onChange={e => updateFinalSummary('justificacion', e.target.value)}
              rows={3}
              placeholder="Describa el mecanismo de falla o el argumento clínico-estructural por el cual se restringe la ocupación..."
              className="w-full bg-black/60 border border-white/10 rounded p-2.5 text-white focus:border-amber-400 focus:outline-none text-xs"
            />
          </div>

          <div className="bg-black/50 p-4 rounded-xl border border-white/10 space-y-3">
            <label className="block text-[10px] text-amber-400 font-black uppercase">ACCIONES INMEDIATAS REQUERIDAS EN LA ESCENA</label>
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
                <label key={act.key} className="flex items-center gap-2 bg-white/5 p-2 rounded hover:bg-white/10 cursor-pointer select-none text-xs">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1">FIRMA RESPONSABLE DEL EVALUADOR</label>
              <input
                type="text"
                value={form.resumen_final.firma_evaluador.nombre_firma}
                onChange={e => updateSignature('nombre_firma', e.target.value)}
                placeholder="Ing. Evaluador Autorizado"
                className="w-full bg-black/60 border border-white/10 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-white/50 font-bold mb-1">FECHA DE EVALUACIÓN OFICIAL</label>
              <input
                type="date"
                value={form.resumen_final.firma_evaluador.fecha}
                onChange={e => updateSignature('fecha', e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded p-2 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
