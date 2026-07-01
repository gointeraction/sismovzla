export interface Incident {
  id: string;
  type: 'Rescate' | 'Médico' | 'Fuga de Gas' | 'Derrumbe' | 'Otros';
  severity: number; // 1 to 5
  description: string;
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  address?: string;
  latitude: number;
  longitude: number;
  mediaUrl?: string;
  mediaUrls?: string[];
  audioUrl?: string;
  resolved: boolean;
  verified: boolean;
  createdAt: number;
  reportedBy: string;
  reporterContact?: string;
  buildingInfo?: {
    apartmentsCount: number;
    peopleCount: number;
  };
  structuralEvaluation?: StructuralEvaluation;
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
  name_slug: string;
  last_known_loc: string;
  status: 'Buscado' | 'Localizado' | 'Hospitalizado';
  contact_info: string;
  registeredBy: string;
  createdAt: number;
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
  capacityStatus: 'Verde' | 'Amarillo' | 'Rojo';
  maxCapacity?: number;
  occupantCount?: number;
  needs?: string;
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
  isQualified: boolean;
  status: 'Registrado' | 'Calificado' | 'Remitido' | 'Donación Completada';
  referredBy?: string;
  referredFacilityName?: string;
  referredNotes?: string;
  referredAt?: number;
  createdAt: number;
}

export interface HospitalPatient {
  id: string;
  fullName: string;
  age?: number;
  ci: string;
  hospitalName: string;
  status: 'Ingresado' | 'En Observación' | 'Dado de Alta' | 'Trasladado' | 'Fallecido';
  condition?: string;
  notes?: string;
  reportedBy: string;
  sourcePhotoUrl?: string;
  isDuplicateCheck?: boolean;
  duplicateOfHospital?: string;
  createdAt: number;
}

export interface ShelterOccupant {
  id: string;
  shelterId: string;
  fullName: string;
  ci: string;
  age?: number;
  contactPhone?: string;
  physicalCondition: string;
  medicalNeeds: string;
  notes?: string;
  registeredBy: string;
  createdAt: number;
  status?: 'Albergado' | 'Salida';
  exitDate?: number;
}

export interface ShelterRequest {
  id: string;
  shelterId: string;
  type: 'Atención Médica' | 'Insumos Médicos' | 'Alimentos' | 'Logística' | 'Otros';
  description: string;
  status: 'Abierto' | 'Cerrado';
  createdAt: number;
  reportedBy: string;
  resolvedAt?: number;
  resolvedBy?: string;
}

/** FASE 0 — Módulo 1: Vías y Rutas de Evacuación */
export interface EvacuationRoute {
  id: string;
  name: string;
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  segment: string;
  status: 'Despejada' | 'Parcial' | 'Bloqueada' | 'Evaluando';
  blockageType?: 'Escombros' | 'Hundimiento' | 'Deslizamiento' | 'Vehículos' | 'Agua' | 'Otro';
  latitude: number;
  longitude: number;
  endLatitude?: number;
  endLongitude?: number;
  barrierType?: 'Total' | 'Parcial';
  estimatedClearTime?: string;
  reportedBy: string;
  createdAt: number;
  updatedAt: number;
  clearingAgency?: string;
  alternativeRoute?: string;
}

/** FASE 0 — Módulo 2: Triaje de Víctimas (START/JumpSTART) */
export interface TriagePatient {
  id: string;
  triageCode: 'Rojo' | 'Amarillo' | 'Verde' | 'Negro';
  patientId?: string;
  fullName?: string;
  age?: number;
  isPediatric: boolean;
  gender?: 'M' | 'F' | 'D';
  locationLat: number;
  locationLng: number;
  address?: string;
  mechanism?: 'Colapso' | 'Atrapamiento' | 'Caída' | 'Quemadura' | 'Crisis' | 'Otro';
  conscious: boolean;
  breathing: boolean;
  respiratoryRate?: number;
  capillaryRefill?: number;
  pulse?: boolean;
  ambulatory: boolean;
  destination?: string;
  destinationType?: 'Hospital' | 'Puesto Médico Avanzado' | 'Morgue Temporal' | 'No Trasladado';
  transportedBy?: string;
  transportedAt?: number;
  notes?: string;
  reportedBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface TriageTeam {
  id: string;
  teamName: string;
  location: string;
  members: number;
  status: 'Desplegado' | 'Disponible' | 'Descanso';
  createdAt: number;
}

/** FASE 0 — Módulo 3: Cascading Disaster Timeline */
export interface CascadeEvent {
  id: string;
  eventType: 'Réplica' | 'Incendio' | 'Fuga de Gas' | 'Deslizamiento' | 'Inundación' | 'Tsunami'
    | 'Colapso Estructural' | 'Explosión' | 'Derrame Químico' | 'Ruptura de Presa'
    | 'Licuefacción' | 'Otro';
  parentEventId?: string;
  magnitude?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  severity: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  status: 'Activo' | 'Contenido' | 'Resuelto' | 'Monitoreando';
  affectedZones?: string[];
  description?: string;
  reportedBy: string;
  respondersDeployed?: number;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

/** FASE 1 — Módulo 4: Coordinación USAR */
export interface SearchSector {
  id: string;
  gridRef: string;
  boundaryCoords: { lat: number; lng: number }[];
  state: string;
  sectorName?: string;
  priority: 'Crítico' | 'Alto' | 'Medio' | 'Bajo';
  status: 'No Iniciado' | 'En Progreso' | 'Completado' | 'Verificado';
  estimatedStructures?: number;
  structuresSearched?: number;
  victimsFound?: number;
  victimsRescued?: number;
  victimsDeceased?: number;
  assignedTeam?: string;
  startedAt?: number;
  completedAt?: number;
  hazards?: string[];
  insaragMarking?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RescueTeam {
  id: string;
  teamName: string;
  type: 'K9' | 'Técnico' | 'Pesado' | 'Acuático' | 'AltaAngulo';
  members: number;
  equipment: string;
  status: 'Disponible' | 'Desplegado' | 'Descanso' | 'Reasignado';
  currentSector?: string;
  shiftEnd?: number;
  teamLeader: string;
  contact: string;
  createdAt: number;
}

/** FASE 1 — Módulo 5: Logística de Suministros */
export interface SupplyInventory {
  id: string;
  warehouseId: string;
  category: 'Agua' | 'Alimentos' | 'Medicamentos' | 'Carpas' | 'Mantas/Ropa' | 'Higiene'
    | 'Herramientas' | 'Combustible' | 'Comunicaciones' | 'Otro';
  itemName: string;
  unit: 'Unidades' | 'Litros' | 'Kilogramos' | 'Cajas' | 'Pallets';
  quantity: number;
  minThreshold?: number;
  lastRestockedAt?: number;
  lastRestockedBy?: string;
  expirationDate?: number;
  notes?: string;
  createdAt: number;
}

export interface SupplyRequest {
  id: string;
  fromWarehouse: string;
  toLocation: string;
  priority: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  items: { itemId: string; itemName: string; quantityRequested: number; quantityDelivered?: number }[];
  status: 'Pendiente' | 'En Tránsito' | 'Entregado' | 'Cancelado';
  transportMethod?: string;
  assignedDriver?: string;
  deliveredAt?: number;
  reportedBy: string;
  createdAt: number;
}

/** FASE 2 — Módulo 7: Agua y Saneamiento */
export interface WaterPoint {
  id: string;
  name: string;
  type: 'Punto de Agua' | 'Planta Potabilizadora' | 'Cisterna Móvil' | 'Pila Pública' | 'Manantial' | 'Pozo';
  latitude: number;
  longitude: number;
  waterStatus: 'Potable' | 'No Potable' | 'En Prueba' | 'Agotado';
  capacityLiters?: number;
  litersRemaining?: number;
  chlorineLevel?: number;
  lastTestedAt?: number;
  testedBy?: string;
  populationServed?: number;
  queueStatus?: 'Sin Cola' | 'Cola Moderada' | 'Cola Larga';
  openHours?: string;
  notes?: string;
  reportedBy: string;
  createdAt: number;
}

export interface SanitationPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'Letrina' | 'BañoPortátil' | 'Ducha' | 'Lavamanos';
  capacity: number;
  gender: 'Mixto' | 'Masculino' | 'Femenino';
  status: 'Operativo' | 'Fuera de Servicio';
  reportedBy: string;
  createdAt: number;
}

/** FASE 2 — Módulo 8: Gestión de Fallecidos */
export interface DeceasedPerson {
  id: string;
  caseId: string;
  fullName?: string;
  ci?: string;
  age?: number;
  gender?: 'M' | 'F' | 'D';
  recoveryLat: number;
  recoveryLng: number;
  recoveryAddress?: string;
  recoveryTime: number;
  causeOfDeath?: 'Trauma' | 'Asfixia' | 'Quemaduras' | 'Hipotermia' | 'Paro Cardíaco' | 'Desconocida' | 'Otra';
  identified: boolean;
  identificationMethod?: 'Documento' | 'Familiar' | 'Huella' | 'Odontograma' | 'ADN' | 'Ninguno';
  morgueLocation?: string;
  bodyTag?: string;
  personalEffects?: string;
  familyNotified: boolean;
  familyContact?: string;
  notifiedBy?: string;
  notifiedAt?: number;
  status: 'Recuperado' | 'En Morgue' | 'Identificado' | 'Entregado a Familiares' | 'Sepultado';
  reportedBy: string;
  createdAt: number;
  updatedAt: number;
}

/** FASE 2 — Módulo 9: Apoyo Psicosocial */
export interface PsychosocialCase {
  id: string;
  patientName?: string;
  age?: number;
  contact?: string;
  location?: string;
  crisisType: 'Pérdida Familiar' | 'Pérdida de Vivienda' | 'Estrés Agudo' | 'Crisis de Pánico'
    | 'Menor No Acompañado' | 'Violencia' | 'Intento Suicida' | 'Otro';
  triagePriority: 'Inmediato' | 'Alto' | 'Medio' | 'Bajo';
  interventionType?: 'Primeros Auxilios Psicológicos' | 'Contención' | 'Derivación a Especialista' | 'Seguimiento';
  assignedPsychologist?: string;
  sessionCount?: number;
  status: 'Abierto' | 'En Seguimiento' | 'Cerrado' | 'Derivado';
  reportedBy: string;
  createdAt: number;
}

/** FASE 2 — Módulo 10: Comunicaciones de Emergencia */
export interface EmergencyComm {
  id: string;
  type: 'Radioaficionado' | 'Repetidora' | 'Frecuencia VHF' | 'Frecuencia UHF' | 'HF'
    | 'Satélite' | 'Mesh WiFi' | 'Punto de Mensajería';
  callsign?: string;
  frequency?: number;
  mode?: 'FM' | 'USB' | 'LSB' | 'DMR' | 'Packet' | 'Winlink';
  location?: string;
  latitude?: number;
  longitude?: number;
  operatorName?: string;
  operatorContact?: string;
  coverage?: string;
  status: 'Activo' | 'Standby' | 'Fuera de Servicio';
  powerSource?: 'Red Eléctrica' | 'Panel Solar' | 'Generador' | 'Batería';
  batteryHours?: number;
  messageRelay: boolean;
  notes?: string;
  reportedBy: string;
  createdAt: number;
}

/** FASE 3 — Módulo 11: Voluntarios y Donaciones */
export interface VolunteerRegistry {
  id: string;
  fullName: string;
  ci: string;
  phone: string;
  profession?: string;
  skills?: string[];
  availability: 'Inmediata' | 'Próximas 24h' | 'Próximos 3 Días' | 'Indefinida';
  location?: string;
  assignedShift?: string;
  assignedTask?: string;
  status: 'Registrado' | 'Asignado' | 'En Campo' | 'Descanso' | 'Finalizado';
  registeredBy: string;
  createdAt: number;
}

export interface Donation {
  id: string;
  donorType: 'Persona' | 'Empresa' | 'ONG' | 'Gobierno';
  donorName: string;
  donationType: 'Efectivo' | 'Insumo' | 'Servicio';
  amount?: number;
  itemDescription?: string;
  quantity?: number;
  destination?: string;
  status: 'Registrado' | 'En Tránsito' | 'Recibido' | 'Distribuido';
  receivedBy?: string;
  createdAt: number;
}

/** FASE 3 — Módulo 12: Coordinación Interagencial */
export interface InteragencyTask {
  id: string;
  agencyName: string;
  contactName?: string;
  contactPhone?: string;
  cluster?: 'Salud' | 'WASH' | 'Alojamiento' | 'Logística' | 'Nutrición' | 'Educación'
    | 'Protección' | 'Recuperación Temprana' | 'Telecomunicaciones' | 'Coordinación General';
  task: string;
  assignedZone?: string;
  priority: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  status: 'Pendiente' | 'En Progreso' | 'Completada' | 'Bloqueada';
  dependencies?: string[];
  startedAt?: number;
  completedAt?: number;
  reportedBy: string;
  createdAt: number;
}

/** FASE 3 — Módulo 13: Drones y Apoyo Aéreo */
export interface AerialOperation {
  id: string;
  aircraftType: 'Dron' | 'Helicóptero' | 'Avión Ligero' | 'Comercial';
  registration?: string;
  operatorName?: string;
  missionType: 'Evaluación de Daños' | 'Búsqueda' | 'Entrega de Suministros'
    | 'Evacuación Aeromédica' | 'Reconocimiento' | 'Mapeo Térmico';
  assignedZone?: string;
  launchPoint?: string;
  launchLat?: number;
  launchLng?: number;
  status: 'Planificado' | 'En Vuelo' | 'Completado' | 'En Tierra';
  batteryFuelRemaining?: number;
  estimatedFlightTime?: number;
  noFlyZone: boolean;
  noFlyReason?: string;
  imageryCollected?: boolean;
  imageryUrl?: string;
  damageAssessment?: string;
  reportedBy: string;
  createdAt: number;
}

/** FASE 3 — Módulo 14: Combustible y Energía */
export interface FuelEnergyPoint {
  id: string;
  name: string;
  type: 'Gasolinera' | 'Generador' | 'Planta Eléctrica' | 'Panel Solar' | 'Estación de Carga';
  state: string;
  latitude: number;
  longitude: number;
  fuelType?: 'Gasolina 95' | 'Gasolina 91' | 'Diesel' | 'GLP' | 'Solar';
  capacityLiters?: number;
  litersRemaining?: number;
  generatorPowerKW?: number;
  operationalStatus: 'Operativo' | 'Parcial' | 'Fuera de Servicio' | 'Agotado';
  priorityAccess?: 'Emergencia' | 'Público General' | 'Restringido';
  queueStatus?: 'Sin Cola' | 'Cola < 1h' | 'Cola > 1h' | 'Cola > 3h';
  reportedBy: string;
  createdAt: number;
}

export interface WeatherAlert {
  id: string;
  title: string;
  type: 'Lluvia Fuerte' | 'Tormenta' | 'Viento Fuerte' | 'Inundación' | 'Deslizamiento' | 'Tsunami' | 'Réplica Significativa' | 'Otro';
  severity: 'Verde' | 'Amarillo' | 'Naranja' | 'Rojo';
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  description: string;
  source: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  active: boolean;
  expiresAt?: number;
  reportedBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface PublicAlert {
  id: string;
  title: string;
  message: string;
  type: 'Evacuación' | 'Refugio' | 'Ruta Segura' | 'Agua Segura' | 'Peligro' | 'Informativa';
  priority: 'Crítica' | 'Alta' | 'Media' | 'Baja';
  states: string[];
  latitude?: number;
  longitude?: number;
  active: boolean;
  broadcastCount: number;
  sentBy: string;
  createdAt: number;
  expiresAt?: number;
}

export interface FamilyRequest {
  id: string;
  seekerName: string;
  seekerPhone: string;
  seekerCI?: string;
  missingName: string;
  missingCI?: string;
  missingAge?: number;
  lastSeenLocation: string;
  lastSeenDate: number;
  description: string;
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  status: 'Buscando' | 'En Contacto' | 'Reunificado' | 'Cerrado';
  matchId?: string;
  notes?: string;
  reportedBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ChildCase {
  id: string;
  childName: string;
  childAge: number;
  childGender: 'M' | 'F' | 'Otro';
  parentName?: string;
  parentPhone?: string;
  parentCI?: string;
  status: 'No Acompañado' | 'En Protección' | 'Con Familia' | 'Derivado' | 'Resuelto';
  location: string;
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  shelterId?: string;
  assignedTo?: string;
  medicalNeeds?: string;
  notes?: string;
  reportedBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface LegalAidRequest {
  id: string;
  petitionerName: string;
  petitionerCI: string;
  petitionerPhone: string;
  requestType: 'Acta de Defunción' | 'Acta de Nacimiento' | 'Identificación' | 'Propiedad' | 'Seguro' | 'Otro';
  description: string;
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  status: 'Registrado' | 'En Trámite' | 'Resuelto' | 'Derivado';
  assignedTo?: string;
  institution?: string;
  documentsNeeded?: string[];
  notes?: string;
  reportedBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface PressRelease {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'Oficial' | 'Situación' | 'Operativo' | 'Salud' | 'Logística' | 'Otro';
  states: string[];
  author: string;
  source: string;
  published: boolean;
  viewCount: number;
  createdAt: number;
  updatedAt?: number;
}

export interface TrainingSession {
  id: string;
  title: string;
  type: 'Simulacro' | 'Capacitación' | 'Taller' | 'Entrenamiento SAR' | 'Prueba de Comunicaciones';
  description: string;
  date: number;
  duration: string;
  location: string;
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  instructor: string;
  maxParticipants: number;
  enrolledCount: number;
  status: 'Programado' | 'En Curso' | 'Completado' | 'Cancelado';
  participants: string[];
  evaluation?: string;
  reportedBy: string;
  createdAt: number;
}

export interface AfterActionReview {
  id: string;
  title: string;
  incidentDate: number;
  reviewDate: number;
  module: string;
  whatWorkedWell: string;
  whatNeedsImprovement: string;
  recommendations: string;
  priority: 'Alta' | 'Media' | 'Baja';
  status: 'Pendiente' | 'En Implementación' | 'Completado';
  assignedTo?: string;
  reportedBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface VolunteerShift {
  id: string;
  volunteerId: string;
  volunteerName: string;
  shiftType: 'Mañana' | 'Tarde' | 'Noche' | '24h';
  date: number;
  startTime: string;
  endTime: string;
  location: string;
  role: string;
  status: 'Programado' | 'En Curso' | 'Completado' | 'Cancelado' | 'No Asistió';
  shelterId?: string;
  notes?: string;
  reportedBy: string;
  createdAt: number;
}

export interface ResourceLocation {
  id: string;
  name: string;
  type: 'Almacén' | 'Punto de Distribución' | 'Centro Médico' | 'Punto de Agua' | 'Generador' | 'Base de Operaciones' | 'Otro';
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  latitude: number;
  longitude: number;
  capacity?: string;
  currentStock?: string;
  status: 'Activo' | 'Parcial' | 'Inactivo';
  contactPhone?: string;
  contactName?: string;
  operatingHours?: string;
  notes?: string;
  reportedBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface SchoolDamage {
  id: string;
  schoolName: string;
  schoolType: 'Urbana' | 'Rural' | 'Privada' | 'Bolivariana' | 'Liceo' | 'Universidad';
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  address: string;
  latitude?: number;
  longitude?: number;
  studentCount: number;
  structuralStatus: 'Operativo' | 'Parcial' | 'No Operativo' | 'Colapsado';
  damageLevel: 'Ninguno' | 'Leve' | 'Moderado' | 'Severo' | 'Colapso';
  needsAssessment?: string;
  temporaryShelter?: string;
  status: 'Registrado' | 'Evaluado' | 'En Reparación' | 'Operativo';
  reportedBy: string;
  createdAt: number;
  updatedAt?: number;
}

export interface TemporaryHousing {
  id: string;
  name: string;
  type: 'Casa Temporal' | 'Carpa' | 'Contenedor' | 'Casa de Familia' | 'Otro';
  state: 'Caracas' | 'La Guaira' | 'Aragua' | 'Carabobo' | 'Otros';
  latitude: number;
  longitude: number;
  capacity: number;
  currentOccupancy: number;
  status: 'Disponible' | 'Parcial' | 'Lleno' | 'Mantenimiento';
  contactName?: string;
  contactPhone?: string;
  services: string[];
  maxStayDays?: number;
  notes?: string;
  reportedBy: string;
  createdAt: number;
  updatedAt?: number;
}
