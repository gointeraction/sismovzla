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
  referredBy?: string;
  createdAt: number;
}

