export interface Incident {
  id: string;
  type: 'Rescate' | 'Médico' | 'Fuga de Gas' | 'Derrumbe' | 'Otros';
  severity: number; // 1 to 5
  description: string;
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  address?: string; // Dirección o referencia manual del incidente
  latitude: number;
  longitude: number;
  mediaUrl?: string;
  mediaUrls?: string[]; // Array de evidencias visuales comprimidas
  audioUrl?: string; // OPUS voice note base64 string (~4KB)
  resolved: boolean;
  verified: boolean;
  createdAt: number; // timestamp in milliseconds
  reportedBy: string; // user display name or anonymous ID
  reporterContact?: string;
  structuralEvaluation?: StructuralEvaluation; // Checklist Técnico COVENIN 1756 / ATC-20
}

export type DamageLevel = 'Ninguno' | 'Leve' | 'Moderado' | 'Severo' | 'Colapso';

export interface StructuralEvaluation {
  formulario_evaluacion_post_sismo: {
    datos_edificacion: {
      direccion: string;
      fecha: string;
      anio_construccion: number;
      no_pisos: number;
      uso: string;
      zona_sismica: string;
      sistema_estructural: {
        porticos_concreto: boolean;
        muros_corte: boolean;
        mixto: boolean;
        mamposteria: boolean;
        acero: boolean;
        otro: string;
      };
      ingeniero_evaluador: {
        nombre: string;
        cod_inces_civ: string;
      };
    };
    secciones_evaluacion: {
      A_elementos_verticales: {
        items: string[];
        calificaciones: Record<string, DamageLevel>;
      };
      B_elementos_horizontales: {
        items: string[];
        calificaciones: Record<string, DamageLevel>;
      };
      C_sistema_global: {
        items: string[];
        calificaciones: Record<string, DamageLevel>;
      };
      D_elementos_no_estructurales: {
        items: string[];
        calificaciones: Record<string, DamageLevel>;
      };
      E_terreno_y_cimentacion: {
        items: string[];
        calificaciones: Record<string, DamageLevel>;
      };
      F_instalaciones_y_riesgo_secundario: {
        items: string[];
        calificaciones: Record<string, DamageLevel>;
      };
    };
    observaciones: {
      fotos: Array<{ id: number; descripcion: string; archivo?: string }>;
      notas_adicionales: string;
    };
    resumen_final: {
      clasificacion: 'Verde - Habitable' | 'Amarillo - Restringido' | 'Rojo - No Habitable';
      justificacion: string;
      firma_evaluador: {
        nombre_firma: string;
        civ_no: string;
        fecha: string;
      };
      acciones_inmediatas: {
        evacuar_acordonar: boolean;
        notificar_proteccion_civil: boolean;
        cortar_servicios: boolean;
        no_usar_ascensores: boolean;
        apuntalar: boolean;
        documentar_fotos: boolean;
        esperar_inspeccion_2do: boolean;
        informar_vecinos: boolean;
      };
    };
  };
}


export interface PersonSearch {
  id: string;
  name: string;
  name_slug: string; // lowercase for easy searching
  last_known_loc: string;
  status: 'Buscado' | 'Localizado' | 'Hospitalizado';
  contact_info: string; // hidden for unverified users
  registeredBy: string;
  createdAt: number; // timestamp in milliseconds
  notes?: string;
}

export interface SurvivalGuide {
  id: string;
  title: string;
  category: 'Primeros Auxilios' | 'Rescate' | 'Escombros' | 'Sistemas de Alerta';
  steps: string[];
}

export interface Shelter {
  id: string;
  name: string;
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  address: string;
  latitude: number;
  longitude: number;
  type: 'Refugio' | 'Hospital' | 'Centro de Acopio' | 'Punto de Agua' | 'Banco de Sangre';
  capacityStatus: 'Verde' | 'Amarillo' | 'Rojo'; // Verde: Disponible, Amarillo: Casi lleno, Rojo: Colapsado
  needs?: string; // Suministros solicitados o servicios ofrecidos
  contact?: string;
  verified: boolean;
  updatedAt: number;
  updatedBy: string;
}

export interface BloodDonor {
  id: string;
  fullName: string;
  contactPhone: string;
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  bloodType: 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
  ageValid: boolean;
  weightValid: boolean;
  timeValid: boolean;
  healthValid: boolean;
  isQualified: boolean; // true si cumple todos los criterios previos
  status: 'Registrado' | 'Calificado' | 'Remitido' | 'Donación Completada';
  referredFacilityName?: string;
  referredNotes?: string;
  referredAt?: number;
  createdAt: number;
}

export interface HospitalPatient {
  id: string;
  fullName: string;
  age?: number;
  ci: string; // Cédula de identidad normalizada ej: V-12345678 o 12345678
  hospitalName: string; // Centro asistencial donde ingresó
  status: 'Ingresado' | 'En Observación' | 'Dado de Alta' | 'Trasladado' | 'Fallecido';
  condition?: string; // Estable, Crítico, Leve, Desconocido
  notes?: string; // Habitación, cama u observaciones
  reportedBy: string; // Voluntario o médico
  sourcePhotoUrl?: string; // Evidencia visual de lista impresa
  isDuplicateCheck?: boolean; // True si coincide cédula en otro hospital (Doble chequeo)
  duplicateOfHospital?: string; // Nombre del otro hospital con el que entra en conflicto
  createdAt: number;
}


