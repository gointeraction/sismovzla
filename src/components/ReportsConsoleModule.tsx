import React, { useState, useEffect } from 'react';
import { Incident, StructuralEvaluation, Shelter, BloodDonor, HospitalPatient, DamageLevel, ShelterOccupant, PersonSearch, EvacuationRoute, TriagePatient, TriageTeam, CascadeEvent, SearchSector, RescueTeam, SupplyInventory, SupplyRequest, WaterPoint, SanitationPoint, DeceasedPerson, PsychosocialCase, EmergencyComm, VolunteerRegistry, Donation, InteragencyTask, AerialOperation, FuelEnergyPoint, WeatherAlert, PublicAlert, FamilyRequest, ChildCase, LegalAidRequest, PressRelease, TrainingSession, AfterActionReview, VolunteerShift, ResourceLocation, SchoolDamage, TemporaryHousing } from '../types';
import { 
  FileText, Printer, Download, Search, Filter, CheckCircle2, AlertTriangle, 
  ShieldAlert, Activity, Droplet, Building2, MapPin, Calendar, ExternalLink, 
  ChevronRight, Eye, RefreshCw, SlidersHorizontal, Table, LayoutGrid, Building, Heart,
  Users, Clock, Radio, Plane, Fuel, Droplets, Skull, Brain, Megaphone, BookOpen,
  GraduationCap, Home, Cloud, Bell, Baby, Scale, Newspaper, Lightbulb, Route, Package,
  Zap, BarChart3, Navigation
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface Props {
  incidents: Incident[];
  isVerified: boolean;
  role: string;
}
type ReportTypeTab = 'incidents_damage' | 'covenin_structural' | 'hospital_patients' | 'blood_donors' | 'shelters_log' | 'global_suite'
  | 'eoc_dashboard' | 'person_search' | 'evacuation_routes' | 'triage_manifest' | 'cascade_events'
  | 'search_rescue' | 'supply_logistics' | 'water_sanitation' | 'deceased' | 'psychosocial'
  | 'comms_network' | 'volunteers' | 'interagency' | 'aerial_ops' | 'fuel_energy'
  | 'child_protection' | 'temporary_housing' | 'education' | 'weather_alerts_report'
  | 'public_alerts_report' | 'family_reunification' | 'legal_aid' | 'press_center'
  | 'training_sessions' | 'lessons_learned' | 'volunteer_shifts' | 'resource_map'
  | 'donations';

export const ReportsConsoleModule: React.FC<Props> = ({ incidents, isVerified, role }) => {
  const [activeTab, setActiveTab] = useState<ReportTypeTab>('incidents_damage');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('Todos');
  const [severityFilter, setSeverityFilter] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // External Firestore collections state - all lazy loaded on tab switch
  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [occupants, setOccupants] = useState<ShelterOccupant[]>([]);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);

  const [personSearches, setPersonSearches] = useState<PersonSearch[]>([]);
  const [evacRoutes, setEvacRoutes] = useState<EvacuationRoute[]>([]);
  const [triagePatients, setTriagePatients] = useState<TriagePatient[]>([]);
  const [triageTeams, setTriageTeams] = useState<TriageTeam[]>([]);
  const [cascadeEvents, setCascadeEvents] = useState<CascadeEvent[]>([]);
  const [searchSectors, setSearchSectors] = useState<SearchSector[]>([]);
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>([]);
  const [supplyInventory, setSupplyInventory] = useState<SupplyInventory[]>([]);
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([]);
  const [waterPoints, setWaterPoints] = useState<WaterPoint[]>([]);
  const [sanitationPoints, setSanitationPoints] = useState<SanitationPoint[]>([]);
  const [deceasedPersons, setDeceasedPersons] = useState<DeceasedPerson[]>([]);
  const [psychosocialCases, setPsychosocialCases] = useState<PsychosocialCase[]>([]);
  const [emergencyComms, setEmergencyComms] = useState<EmergencyComm[]>([]);
  const [volunteerRegs, setVolunteerRegs] = useState<VolunteerRegistry[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [interagencyTasks, setInteragencyTasks] = useState<InteragencyTask[]>([]);
  const [aerialOps, setAerialOps] = useState<AerialOperation[]>([]);
  const [fuelEnergyPoints, setFuelEnergyPoints] = useState<FuelEnergyPoint[]>([]);
  const [childCases, setChildCases] = useState<ChildCase[]>([]);
  const [tempHousing, setTempHousing] = useState<TemporaryHousing[]>([]);
  const [schoolDamages, setSchoolDamages] = useState<SchoolDamage[]>([]);
  const [weatherAlertsList, setWeatherAlertsList] = useState<WeatherAlert[]>([]);
  const [publicAlertsList, setPublicAlertsList] = useState<PublicAlert[]>([]);
  const [familyRequestsList, setFamilyRequestsList] = useState<FamilyRequest[]>([]);
  const [legalAidList, setLegalAidList] = useState<LegalAidRequest[]>([]);
  const [pressReleasesList, setPressReleasesList] = useState<PressRelease[]>([]);
  const [trainingSessionsList, setTrainingSessionsList] = useState<TrainingSession[]>([]);
  const [aarList, setAarList] = useState<AfterActionReview[]>([]);
  const [volunteerShiftsList, setVolunteerShiftsList] = useState<VolunteerShift[]>([]);
  const [resourceLocations, setResourceLocations] = useState<ResourceLocation[]>([]);
  const [dashboardStartDate, setDashboardStartDate] = useState<string>('');
  const [dashboardEndDate, setDashboardEndDate] = useState<string>('');
  const [showMoreTabs, setShowMoreTabs] = useState(false);

  // Track which tabs have been loaded to avoid re-fetching
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());

  const tabLabels: Record<ReportTypeTab, string> = {
    incidents_damage: '1. DAÑOS', covenin_structural: '2. COVENIN', hospital_patients: '3. PACIENTES',
    blood_donors: '4. SANGRE', shelters_log: '5. ALBERGUES', global_suite: '6. SUITE GLOBAL',
    eoc_dashboard: 'EOC', person_search: 'BUSQUEDAS', evacuation_routes: 'EVACUACION',
    triage_manifest: 'TRIAJE', cascade_events: 'CASCADA', search_rescue: 'SAR/USAR',
    supply_logistics: 'SUMINISTROS', water_sanitation: 'WASH', deceased: 'FALLECIDOS',
    psychosocial: 'PSICOSOCIAL', comms_network: 'COMMS', volunteers: 'VOLUNTARIOS',
    interagency: 'INTERAGENCIA', aerial_ops: 'AEREO', fuel_energy: 'ENERGIA',
    child_protection: 'MENORES', temporary_housing: 'VIVIENDA', education: 'EDUCACION',
    weather_alerts_report: 'METEO', public_alerts_report: 'ALERTAS', family_reunification: 'FAMILIAS',
    legal_aid: 'LEGAL', press_center: 'PRENSA', training_sessions: 'CAPACITACION',
    lessons_learned: 'LECCIONES', volunteer_shifts: 'TURNOS', resource_map: 'RECURSOS', donations: 'DONACIONES',
  };

// Lazy load collections on tab switch - ALL tabs now load on-demand
  useEffect(() => {
    const fetchTabData = async () => {
      // Don't re-fetch if already loaded
      if (loadedTabs.has(activeTab)) return;
      
      setIsLoadingExternal(true);
      try {
        // Legacy tabs (3)
        if (activeTab === 'hospital_patients') {
          const snap = await getDocs(collection(db, 'hospital_patients'));
          const list: HospitalPatient[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as HospitalPatient));
          setPatients(list);
        } else if (activeTab === 'blood_donors') {
          const snap = await getDocs(collection(db, 'blood_donors'));
          const list: BloodDonor[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as BloodDonor));
          setDonors(list);
        } else if (activeTab === 'shelters_log') {
          const snap = await getDocs(collection(db, 'shelters'));
          const list: Shelter[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Shelter));
          setShelters(list);
          const occSnap = await getDocs(collection(db, 'shelter_occupants'));
          const occList: ShelterOccupant[] = [];
          occSnap.forEach(doc => occList.push({ id: doc.id, ...doc.data() } as ShelterOccupant));
          setOccupants(occList);
        }
        // New tabs (28) - lazy load on first access
        else if (activeTab === 'person_search') {
          const snap = await getDocs(collection(db, 'person_searches'));
          const list: PersonSearch[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as PersonSearch));
          setPersonSearches(list);
        } else if (activeTab === 'evacuation_routes') {
          const snap = await getDocs(collection(db, 'evacuation_routes'));
          const list: EvacuationRoute[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as EvacuationRoute));
          setEvacRoutes(list);
        } else if (activeTab === 'triage_manifest') {
          const [patientsSnap, teamsSnap] = await Promise.all([
            getDocs(collection(db, 'triage_patients')),
            getDocs(collection(db, 'triage_teams'))
          ]);
          const pList: TriagePatient[] = [];
          patientsSnap.forEach(doc => pList.push({ id: doc.id, ...doc.data() } as TriagePatient));
          setTriagePatients(pList);
          const tList: TriageTeam[] = [];
          teamsSnap.forEach(doc => tList.push({ id: doc.id, ...doc.data() } as TriageTeam));
          setTriageTeams(tList);
        } else if (activeTab === 'cascade_events') {
          const snap = await getDocs(collection(db, 'cascade_events'));
          const list: CascadeEvent[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as CascadeEvent));
          setCascadeEvents(list);
        } else if (activeTab === 'search_rescue') {
          const [sectorsSnap, teamsSnap] = await Promise.all([
            getDocs(collection(db, 'search_sectors')),
            getDocs(collection(db, 'rescue_teams'))
          ]);
          const sList: SearchSector[] = [];
          sectorsSnap.forEach(doc => sList.push({ id: doc.id, ...doc.data() } as SearchSector));
          setSearchSectors(sList);
          const tList: RescueTeam[] = [];
          teamsSnap.forEach(doc => tList.push({ id: doc.id, ...doc.data() } as RescueTeam));
          setRescueTeams(tList);
        } else if (activeTab === 'supply_logistics') {
          const [invSnap, reqSnap] = await Promise.all([
            getDocs(collection(db, 'supply_inventory')),
            getDocs(collection(db, 'supply_requests'))
          ]);
          const iList: SupplyInventory[] = [];
          invSnap.forEach(doc => iList.push({ id: doc.id, ...doc.data() } as SupplyInventory));
          setSupplyInventory(iList);
          const rList: SupplyRequest[] = [];
          reqSnap.forEach(doc => rList.push({ id: doc.id, ...doc.data() } as SupplyRequest));
          setSupplyRequests(rList);
        } else if (activeTab === 'water_sanitation') {
          const [waterSnap, sanSnap] = await Promise.all([
            getDocs(collection(db, 'water_points')),
            getDocs(collection(db, 'sanitation_points'))
          ]);
          const wList: WaterPoint[] = [];
          waterSnap.forEach(doc => wList.push({ id: doc.id, ...doc.data() } as WaterPoint));
          setWaterPoints(wList);
          const sList: SanitationPoint[] = [];
          sanSnap.forEach(doc => sList.push({ id: doc.id, ...doc.data() } as SanitationPoint));
          setSanitationPoints(sList);
        } else if (activeTab === 'deceased') {
          const snap = await getDocs(collection(db, 'deceased_persons'));
          const list: DeceasedPerson[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as DeceasedPerson));
          setDeceasedPersons(list);
        } else if (activeTab === 'psychosocial') {
          const snap = await getDocs(collection(db, 'psychosocial_cases'));
          const list: PsychosocialCase[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as PsychosocialCase));
          setPsychosocialCases(list);
        } else if (activeTab === 'comms_network') {
          const snap = await getDocs(collection(db, 'emergency_comms'));
          const list: EmergencyComm[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as EmergencyComm));
          setEmergencyComms(list);
        } else if (activeTab === 'volunteers') {
          const [volSnap, donSnap] = await Promise.all([
            getDocs(collection(db, 'volunteers')),
            getDocs(collection(db, 'donations'))
          ]);
          const vList: VolunteerRegistry[] = [];
          volSnap.forEach(doc => vList.push({ id: doc.id, ...doc.data() } as VolunteerRegistry));
          setVolunteerRegs(vList);
          const dList: Donation[] = [];
          donSnap.forEach(doc => dList.push({ id: doc.id, ...doc.data() } as Donation));
          setDonations(dList);
        } else if (activeTab === 'interagency') {
          const snap = await getDocs(collection(db, 'interagency_tasks'));
          const list: InteragencyTask[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as InteragencyTask));
          setInteragencyTasks(list);
        } else if (activeTab === 'aerial_ops') {
          const snap = await getDocs(collection(db, 'aerial_operations'));
          const list: AerialOperation[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as AerialOperation));
          setAerialOps(list);
        } else if (activeTab === 'fuel_energy') {
          const snap = await getDocs(collection(db, 'fuel_energy_points'));
          const list: FuelEnergyPoint[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as FuelEnergyPoint));
          setFuelEnergyPoints(list);
        } else if (activeTab === 'child_protection') {
          const snap = await getDocs(collection(db, 'child_protection_cases'));
          const list: ChildCase[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as ChildCase));
          setChildCases(list);
        } else if (activeTab === 'temporary_housing') {
          const snap = await getDocs(collection(db, 'temporary_housing'));
          const list: TemporaryHousing[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as TemporaryHousing));
          setTempHousing(list);
        } else if (activeTab === 'education') {
          const snap = await getDocs(collection(db, 'school_damage_reports'));
          const list: SchoolDamage[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as SchoolDamage));
          setSchoolDamages(list);
        } else if (activeTab === 'weather_alerts_report') {
          const snap = await getDocs(collection(db, 'weather_alerts'));
          const list: WeatherAlert[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as WeatherAlert));
          setWeatherAlertsList(list);
        } else if (activeTab === 'public_alerts_report') {
          const snap = await getDocs(collection(db, 'public_alerts'));
          const list: PublicAlert[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as PublicAlert));
          setPublicAlertsList(list);
        } else if (activeTab === 'family_reunification') {
          const snap = await getDocs(collection(db, 'family_requests'));
          const list: FamilyRequest[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as FamilyRequest));
          setFamilyRequestsList(list);
        } else if (activeTab === 'legal_aid') {
          const snap = await getDocs(collection(db, 'legal_aid_requests'));
          const list: LegalAidRequest[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as LegalAidRequest));
          setLegalAidList(list);
        } else if (activeTab === 'press_center') {
          const snap = await getDocs(collection(db, 'press_releases'));
          const list: PressRelease[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as PressRelease));
          setPressReleasesList(list);
        } else if (activeTab === 'training_sessions') {
          const snap = await getDocs(collection(db, 'training_sessions'));
          const list: TrainingSession[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as TrainingSession));
          setTrainingSessionsList(list);
        } else if (activeTab === 'lessons_learned') {
          const snap = await getDocs(collection(db, 'after_action_reviews'));
          const list: AfterActionReview[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as AfterActionReview));
          setAarList(list);
        } else if (activeTab === 'volunteer_shifts') {
          const snap = await getDocs(collection(db, 'volunteer_shifts'));
          const list: VolunteerShift[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as VolunteerShift));
          setVolunteerShiftsList(list);
        } else if (activeTab === 'resource_map') {
          const snap = await getDocs(collection(db, 'resource_locations'));
          const list: ResourceLocation[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as ResourceLocation));
          setResourceLocations(list);
        } else if (activeTab === 'eoc_dashboard') {
          // EOC Dashboard uses incidents prop (already loaded) + cascade events
          const snap = await getDocs(collection(db, 'cascade_events'));
          const list: CascadeEvent[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as CascadeEvent));
          setCascadeEvents(list);
        }
        
        // Mark tab as loaded
        setLoadedTabs(prev => new Set(prev).add(activeTab));
      } catch (e) {
        console.error('Error fetching tab data:', e);
      } finally {
        setIsLoadingExternal(false);
      }
    };

    fetchTabData();
  }, [activeTab, loadedTabs]);

  // Filtered incidents
  const filteredIncidents = incidents.filter(inc => {
    const matchSearch = searchQuery === '' || 
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.address && inc.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inc.reportedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchState = stateFilter === 'Todos' || inc.state === stateFilter;
    const matchSev = severityFilter === 'Todos' || inc.severity.toString() === severityFilter;

    if (activeTab === 'covenin_structural') {
      return matchSearch && matchState && matchSev && inc.structuralEvaluation !== undefined;
    }

    return matchSearch && matchState && matchSev;
  });

  // Filtered Patients
  const filteredPatients = patients.filter(p => {
    return searchQuery === '' ||
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ci.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hospitalName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filtered Donors
  const filteredDonors = donors.filter(d => {
    return searchQuery === '' ||
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.bloodType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.state.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filtered Shelters
  const filteredShelters = shelters.filter(s => {
    return searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.state.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Zero-Bundle-Bloat PDF Printing Helper
  const printDocument = (title: string, htmlContent: string) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Por favor permita ventanas emergentes para generar el reporte PDF formal.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 30px; color: #111; line-height: 1.5; background: white; }
          .header { border-bottom: 3px solid #dc2626; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 22px; font-weight: 900; text-transform: uppercase; color: #dc2626; letter-spacing: -0.5px; margin: 0; }
          .subtitle { font-size: 13px; color: #4b5563; margin-top: 4px; }
          .stamp { border: 2px solid #dc2626; color: #dc2626; font-weight: bold; padding: 6px 14px; border-radius: 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; vertical-align: top; }
          th { background-color: #f3f4f6; font-weight: bold; text-transform: uppercase; color: #374151; font-size: 11px; letter-spacing: 0.5px; }
          .badge-green { background: #dcfce7; color: #166534; font-weight: bold; padding: 3px 8px; border-radius: 4px; display: inline-block; }
          .badge-yellow { background: #fef9c3; color: #854d0e; font-weight: bold; padding: 3px 8px; border-radius: 4px; display: inline-block; }
          .badge-red { background: #fee2e2; color: #991b1b; font-weight: bold; padding: 3px 8px; border-radius: 4px; display: inline-block; }
          .section-title { font-size: 15px; font-weight: bold; background: #e5e7eb; padding: 8px 12px; margin-top: 25px; margin-bottom: 10px; border-left: 4px solid #374151; text-transform: uppercase; color: #111; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 13px; background: #f9fafb; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; }
          .meta-item { display: flex; flex-direction: column; }
          .meta-label { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; }
          .meta-val { font-weight: bold; color: #111; font-size: 13px; margin-top: 2px; }
          .signatures { margin-top: 70px; display: flex; justify-content: space-around; }
          .sig-box { border-top: 2px solid #374151; width: 280px; text-align: center; padding-top: 10px; font-size: 12px; color: #374151; }
          .sig-title { font-weight: bold; text-transform: uppercase; color: #111; font-size: 13px; }
          .footer-note { margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-t: 1px dashed #d1d5db; padding-top: 15px; }
          @media print {
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { margin: 15px; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <div style="text-align: center; margin-top: 40px;" class="no-print">
          <button onclick="window.print()" style="padding: 14px 28px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: 900; cursor: pointer; font-size: 15px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);">
            🖨️ IMPRIMIR O GUARDAR COMO PDF (A4)
          </button>
        </div>
        <div class="footer-note">
          Documento generado asincrónicamente por la Plataforma Táctica Comunitaria de Emergencia SISMOVZLA.<br>
          Verificable contra base de datos descentralizada en terminales de contingencia civil y autoridades competentes.
        </div>
        <script>
          window.onload = () => { setTimeout(() => { window.print(); }, 600); };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- REPORT N° 1: DICTAMEN ESTRUCTURAL COVENIN 1756 COMPLETO ---
  const exportStructuralEvaluationPdf = (inc: Incident) => {
    const ev = inc.structuralEvaluation;
    if (!ev) {
      alert('Este incidente no posee una evaluación estructural COVENIN adjunta.');
      return;
    }
    const form = ev.formulario_evaluacion_post_sismo;
    const edif = form.datos_edificacion;
    const res = form.resumen_final;

    // Detect structural system string
    const sis = edif.sistema_estructural;
    let sisStr = [];
    if (sis.porticos_concreto) sisStr.push('Pórticos de Concreto');
    if (sis.muros_corte) sisStr.push('Muros de Corte');
    if (sis.acero) sisStr.push('Estructura de Acero');
    if (sis.mamposteria) sisStr.push('Mampostería');
    if (sis.mixto) sisStr.push('Mixto');
    if (sis.otro) sisStr.push(sis.otro);

    // Build qualifications rows
    let patologiasHtml = '';
    const mapLevelBadge = (lvl: DamageLevel) => {
      if (lvl === 'Ninguno') return '<span>Ninguno</span>';
      if (lvl === 'Leve') return '<span class="badge-green">Leve</span>';
      if (lvl === 'Moderado') return '<span class="badge-yellow">Moderado</span>';
      return `<span class="badge-red">${lvl}</span>`;
    };

    const seccs = [
      { titulo: 'A. Elementos Verticales (Columnas / Muros)', obj: form.secciones_evaluacion.A_elementos_verticales },
      { titulo: 'B. Elementos Horizontales (Vigas / Losas / Escaleras)', obj: form.secciones_evaluacion.B_elementos_horizontales },
      { titulo: 'C. Sistema Estructural Global (Derivas / Golpeteo)', obj: form.secciones_evaluacion.C_sistema_global },
      { titulo: 'D. Elementos No Estructurales (Fachadas / Tabiques)', obj: form.secciones_evaluacion.D_elementos_no_estructurales },
      { titulo: 'E. Geotecnia y Cimentación', obj: form.secciones_evaluacion.E_terreno_y_cimentacion },
      { titulo: 'F. Instalaciones y Riesgos Secundarios', obj: form.secciones_evaluacion.F_instalaciones_y_riesgo_secundario }
    ];

    seccs.forEach(s => {
      let filasSeccion = '';
      s.obj.items.forEach(item => {
        const cal = s.obj.calificaciones[item] || 'Ninguno';
        if (cal !== 'Ninguno') {
          filasSeccion += `
            <tr>
              <td><strong>${item}</strong></td>
              <td>${mapLevelBadge(cal)}</td>
            </tr>
          `;
        }
      });
      if (filasSeccion !== '') {
        patologiasHtml += `
          <tr><td colspan="2" style="background: #e5e7eb; font-weight: bold; text-transform: uppercase;">${s.titulo}</td></tr>
          ${filasSeccion}
        `;
      }
    });

    if (patologiasHtml === '') {
      patologiasHtml = '<tr><td colspan="2" style="text-align: center; color: #6b7280;">Sin patologías severas o moderadas registradas. Estructura aparentemente íntegra.</td></tr>';
    }

    // Immediate actions
    const accs = res.acciones_inmediatas;
    let accsList = [];
    if (accs.evacuar_acordonar) accsList.push('Evacuar edificación y acordonar perímetro exterior');
    if (accs.apuntalar) accsList.push('Apuntalar elementos críticos de urgencia');
    if (accs.cortar_servicios) accsList.push('Cortar suministro eléctrico, de gas y de agua');
    if (accs.notificar_proteccion_civil) accsList.push('Notificar de inmediato a Bomberos / Protección Civil');
    if (accs.no_usar_ascensores) accsList.push('Restringir uso de ascensores y escaleras comprometidas');
    if (accs.esperar_inspeccion_2do) accsList.push('Solicitar segunda evaluación técnica especializada');

    const badgeClasif = res.clasificacion.includes('Verde')
      ? '<span class="badge-green" style="font-size: 16px; padding: 6px 14px;">🟢 INSPECCIONADO (HABITABLE)</span>'
      : res.clasificacion.includes('Amarillo')
      ? '<span class="badge-yellow" style="font-size: 16px; padding: 6px 14px;">🟡 ACCESO RESTRINGIDO</span>'
      : '<span class="badge-red" style="font-size: 16px; padding: 6px 14px;">🔴 INSEGURO (NO HABITABLE)</span>';

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — DICTAMEN DE EVALUACIÓN ESTRUCTURAL</div>
          <div class="subtitle">Inspección Post-Sismo según Normas COVENIN 1756 / ATC-20 / FEMA 154 (Venezuela)</div>
        </div>
        <div class="stamp">CIV / OFICIAL</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">N° de Alerta / Incidente</span>
          <span class="meta-val">INC-${inc.id.toUpperCase()}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Fecha y Hora de Inspección</span>
          <span class="meta-val">${edif.fecha || new Date(inc.createdAt).toLocaleString('es-VE')}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Entidad Federal & Coordenadas GPS</span>
          <span class="meta-val">${inc.state} (${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)})</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Dirección / Referencia Física</span>
          <span class="meta-val">${edif.direccion || inc.address || inc.description}</span>
        </div>
      </div>

      <div class="section-title">1. Caracterización Técnica de la Edificación</div>
      <div class="meta-grid" style="grid-template-columns: 1fr 1fr 1fr;">
        <div class="meta-item"><span class="meta-label">Año Construcción</span><span class="meta-val">${edif.anio_construccion || 'N/R'}</span></div>
        <div class="meta-item"><span class="meta-label">N° de Pisos</span><span class="meta-val">${edif.no_pisos || '1'}</span></div>
        <div class="meta-item"><span class="meta-label">Uso Predominante</span><span class="meta-val">${edif.uso || 'Residencial'}</span></div>
        <div class="meta-item"><span class="meta-label">Zona Sísmica COVENIN</span><span class="meta-val">${edif.zona_sismica || 'Zona 5'}</span></div>
        <div class="meta-item" style="grid-column: span 2;"><span class="meta-label">Sistema Estructural</span><span class="meta-val">${sisStr.join(' • ') || 'Concreto Armado'}</span></div>
      </div>

      <div class="section-title">2. Matriz de Daños & Patologías Detectadas (Secciones A - F)</div>
      <table>
        <thead>
          <tr>
            <th style="width: 75%;">Ítem Estructural / Arquitectónico Evaluado</th>
            <th style="width: 25%;">Calificación Clínica</th>
          </tr>
        </thead>
        <tbody>
          ${patologiasHtml}
        </tbody>
      </table>

      <div class="section-title">3. Dictamen Vinculante de Habitabilidad</div>
      <div style="background: #f9fafb; border: 2px solid #d1d5db; padding: 20px; border-radius: 8px; text-align: center; margin: 15px 0;">
        <div style="margin-bottom: 10px;">${badgeClasif}</div>
        <div style="font-size: 13px; color: #374151; text-align: left; margin-top: 12px;">
          <strong>Justificación Clínica / Criterio Técnico:</strong><br>
          ${res.justificacion || 'Evaluación ocular en sitio conforme al protocolo estandarizado de respuesta civil ante desastres sísmicos.'}
        </div>
      </div>

      <div class="section-title">4. Medidas de Seguridad y Acciones Inmediatas Ordenadas</div>
      <ul style="font-size: 13px; color: #111; padding-left: 20px; margin-top: 10px;">
        ${accsList.map(a => `<li style="margin-bottom: 6px;"><strong>${a}</strong></li>`).join('') || '<li>Mantener monitoreo ciudadano rutinario.</li>'}
      </ul>

      <div class="signatures">
        <div class="sig-box">
          <div class="sig-title">${edif.ingeniero_evaluador.nombre || res.firma_evaluador.nombre_firma || 'Ingeniero Inspector'}</div>
          <div>Colegio de Ingenieros de Venezuela (CIV)</div>
          <div style="font-weight: bold; margin-top: 2px;">CIV / INCES N°: ${edif.ingeniero_evaluador.cod_inces_civ || res.firma_evaluador.civ_no || 'En trámite'}</div>
          <div style="margin-top: 25px; border-top: 1px dotted #ccc; font-size: 10px;">Firma Autógrafa y Sello Profesional</div>
        </div>

        <div class="sig-box">
          <div class="sig-title">Coordinación de Operaciones Tácticas</div>
          <div>Plataforma Civil SISMOVZLA</div>
          <div style="font-weight: bold; margin-top: 2px;">Acreditación: ${role || 'TACTICO_2026'}</div>
          <div style="margin-top: 25px; border-top: 1px dotted #ccc; font-size: 10px;">Sello de Recepción y Conformidad</div>
        </div>
      </div>
    `;

    printDocument(`Dictamen_Estructural_COVENIN_${inc.id}`, content);
  };

  // --- REPORT N° 2: BOLETÍN EJECUTIVO DE DAÑOS SÍSMICOS ---
  const exportDamageListPdf = () => {
    let rows = '';
    filteredIncidents.forEach(inc => {
      rows += `
        <tr>
          <td><strong>INC-${inc.id.toUpperCase()}</strong><br><span style="font-size: 10px; color: #666;">${new Date(inc.createdAt).toLocaleString('es-VE')}</span></td>
          <td>${inc.state}</td>
          <td><span class="badge-${inc.severity >= 4 ? 'red' : inc.severity === 3 ? 'yellow' : 'green'}">Grav. ${inc.severity}</span></td>
          <td><strong>${inc.type}</strong>: ${inc.description}${inc.buildingInfo ? `<br><strong style="color: #b45309;">🏢 Edificio: ${inc.buildingInfo.apartmentsCount} Apts | 👥 ${inc.buildingInfo.peopleCount} Personas</strong>` : ''}<br><em style="font-size: 11px; color: #444;">📍 ${inc.address || `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}</em></td>
          <td>${inc.structuralEvaluation ? '🟢 COVENIN Adjunto' : '⏳ Pendiente'}</td>
        </tr>
      `;
    });

    if (rows === '') rows = '<tr><td colspan="5" style="text-align: center;">No hay reportes que coincidan con los filtros seleccionados.</td></tr>';

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — BOLETÍN TÁCTICO DE DAÑOS E INCIDENTES</div>
          <div class="subtitle">Consolidado de Daños Civiles e Infraestructura Afectada • Filtro: ${stateFilter} (Gravedad: ${severityFilter})</div>
        </div>
        <div class="stamp">REPORTE EJECUTIVO</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Total Reportes Censados</span><span class="meta-val">${filteredIncidents.length} incidencias</span></div>
        <div class="meta-item"><span class="meta-label">Daños Críticos (Grav 4 y 5)</span><span class="meta-val">${filteredIncidents.filter(i => i.severity >= 4).length} estructuras severas</span></div>
        <div class="meta-item"><span class="meta-label">Evaluaciones COVENIN Emitidas</span><span class="meta-val">${filteredIncidents.filter(i => i.structuralEvaluation).length} dictámenes técnicos</span></div>
        <div class="meta-item"><span class="meta-label">Fecha de Emisión</span><span class="meta-val">${new Date().toLocaleString('es-VE')}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Código / Hora</th>
            <th style="width: 12%;">Estado</th>
            <th style="width: 12%;">Gravedad</th>
            <th style="width: 46%;">Descripción del Incidente & Ubicación</th>
            <th style="width: 15%;">Inspección</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    printDocument(`Boletin_Danos_Sismicos_${stateFilter}`, content);
  };

  // --- REPORT N° 3: CENSO ASISTENCIAL DE HERIDOS & DOBLE CHEQUEO ---
  const exportHospitalPatientsPdf = () => {
    let rows = '';
    filteredPatients.forEach(p => {
      const isDoble = p.isDuplicateCheck || false;
      rows += `
        <tr style="${isDoble ? 'background-color: #fef2f2; border-left: 4px solid #dc2626;' : ''}">
          <td><strong>${p.fullName}</strong><br><span style="font-size: 11px;">Edad: ${p.age || 'N/R'}</span></td>
          <td><strong style="font-mono">${p.ci}</strong></td>
          <td><strong>${p.hospitalName}</strong></td>
          <td>${p.status}</td>
          <td>
            ${isDoble 
              ? `<span class="badge-red">⚠️ DOBLE CHEQUEO (${p.duplicateOfHospital})</span>` 
              : '<span class="badge-green">Censado Único</span>'}
          </td>
        </tr>
      `;
    });

    if (rows === '') rows = '<tr><td colspan="5" style="text-align: center;">No hay pacientes censados en la base de datos externa.</td></tr>';

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — CENSO CLÍNICO ASISTENCIAL DE HERIDOS</div>
          <div class="subtitle">Directorio Unificado de Ingresos Médicos y Alertas de Traslados Cruzados (OCR + Doble Chequeo)</div>
        </div>
        <div class="stamp">RED SANITARIA</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Total Pacientes Ingresados</span><span class="meta-val">${filteredPatients.length} ciudadanos</span></div>
        <div class="meta-item"><span class="meta-label">Alertas de Doble Chequeo</span><span class="meta-val" style="color: #dc2626;">${filteredPatients.filter(p => p.isDuplicateCheck).length} conflictos de ubicación</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Nombre del Paciente</th>
            <th style="width: 18%;">Cédula CIV</th>
            <th style="width: 27%;">Centro Asistencial Recluido</th>
            <th style="width: 15%;">Estatus Clínico</th>
            <th style="width: 15%;">Auditoría</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    printDocument(`Censo_Pacientes_Hospitalarios`, content);
  };

  // --- REPORT N° 4: MANIFIESTO DE BANCO DE SANGRE ---
  const exportBloodDonorsPdf = () => {
    let rows = '';
    filteredDonors.forEach(d => {
      rows += `
        <tr>
          <td><strong>${d.fullName}</strong></td>
          <td><strong style="font-size: 14px; color: #dc2626;">${d.bloodType}</strong></td>
          <td>${d.state}</td>
          <td>${d.contactPhone}</td>
          <td>${d.isQualified ? '<span class="badge-green">Apto OMS</span>' : '<span class="badge-yellow">Triaje Pend.</span>'}</td>
          <td>${d.status}</td>
        </tr>
      `;
    });

    if (rows === '') rows = '<tr><td colspan="6" style="text-align: center;">No hay voluntarios inscritos en el banco de sangre.</td></tr>';

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — MANIFIESTO DE BANCO DE SANGRE</div>
          <div class="subtitle">Directorio de Voluntarios Donantes Aptos según Criterios de Calificación OMS</div>
        </div>
        <div class="stamp">EMERGENCIA QUIRÚRGICA</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nombre del Voluntario</th>
            <th>Grupo</th>
            <th>Estado</th>
            <th>Teléfono de Contacto</th>
            <th>Triaje OMS</th>
            <th>Estatus de Remisión</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    printDocument(`Manifiesto_Donantes_Sangre`, content);
  };

  // --- REPORT N° 5: BALANCE DE REFUGIOS ---
  const exportSheltersPdf = () => {
    let rows = '';
    filteredShelters.forEach(s => {
      rows += `
        <tr>
          <td><strong>${s.name}</strong><br><span style="font-size: 10px;">${s.type}</span></td>
          <td>${s.state}</td>
          <td>${s.address}</td>
          <td><span class="badge-${s.capacityStatus === 'Verde' ? 'green' : s.capacityStatus === 'Amarillo' ? 'yellow' : 'red'}">${s.capacityStatus}</span></td>
          <td>${s.needs || 'Sin requerimientos urgentes'}</td>
        </tr>
      `;
    });

    if (rows === '') rows = '<tr><td colspan="5" style="text-align: center;">No hay refugios o centros de acopio censados.</td></tr>';

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — BALANCE DE REFUGIOS & ACOPIO</div>
          <div class="subtitle">Monitoreo Táctico de Plazas Disponibles e Inventario de Requerimientos Críticos</div>
        </div>
        <div class="stamp">LOGÍSTICA CIVIL</div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 22%;">Nombre del Refugio</th>
            <th style="width: 12%;">Estado</th>
            <th style="width: 28%;">Dirección Física</th>
            <th style="width: 13%;">Capacidad</th>
            <th style="width: 25%;">Requerimientos Críticos</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    printDocument(`Balance_Logistico_Refugios`, content);
  };

  // --- REPORT N° 6: REPORTE DE OCUPANTES POR REFUGIO (INDIVIDUAL) ---
  const exportShelterOccupantsDetailPdf = () => {
    const sheltersWithOcc = shelters.filter(s => occupants.some(o => o.shelterId === s.id));

    if (sheltersWithOcc.length === 0) {
      alert('No hay ocupantes registrados en los refugios para generar este reporte.');
      return;
    }

    const fmtDate = (ts: number) => new Date(ts).toLocaleString('es-VE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
    const fmtDateShort = (ts: number) => new Date(ts).toLocaleDateString('es-VE', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    let shelterSections = '';
    sheltersWithOcc.forEach(s => {
      const occs = occupants
        .filter(o => o.shelterId === s.id)
        .sort((a, b) => b.createdAt - a.createdAt);

      if (occs.length === 0) return;

      let rows = '';
      occs.forEach((o, i) => {
        const ingreso = o.createdAt ? fmtDateShort(o.createdAt) : 'N/R';
        const salida = o.status === 'Salida' && o.exitDate ? fmtDateShort(o.exitDate) : (o.status === 'Salida' ? 'N/R' : '—');
        rows += `
          <tr>
            <td style="text-align: center;">${i + 1}</td>
            <td><strong>${o.fullName}</strong></td>
            <td style="font-family: monospace;">${o.ci}</td>
            <td>${o.age || '—'}</td>
            <td>${ingreso}</td>
            <td>${salida}</td>
            <td><span class="badge-${o.status === 'Salida' ? 'red' : 'green'}">${o.status || 'Albergado'}</span></td>
            <td>${o.physicalCondition}</td>
            <td>${o.medicalNeeds}</td>
            <td>${o.origen || '—'}</td>
          </tr>
        `;
      });

      shelterSections += `
        <div class="section-title">${s.name} (${s.state}) — ${occs.length} ocupantes</div>
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 18%;">Nombre Completo</th>
              <th style="width: 12%;">Cédula</th>
              <th style="width: 5%;">Edad</th>
              <th style="width: 11%;">Ingreso</th>
              <th style="width: 11%;">Salida</th>
              <th style="width: 10%;">Estatus</th>
              <th style="width: 12%;">Condición Física</th>
              <th style="width: 12%;">Necesidades Médicas</th>
              <th style="width: 11%;">Origen</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    });

    if (shelterSections === '') {
      shelterSections = '<p style="text-align: center; color: #6b7280;">No hay ocupantes registrados en ningún refugio.</p>';
    }

    const totalOcupantes = occupants.filter(o => o.status !== 'Salida').length;
    const totalSalidas = occupants.filter(o => o.status === 'Salida').length;

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — REPORTE DE OCUPANTES POR REFUGIO</div>
          <div class="subtitle">Censo detallado de personas albergadas con fechas de ingreso y egreso</div>
        </div>
        <div class="stamp">CENSO REFUGIOS</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Total Refugios con Ocupantes</span><span class="meta-val">${sheltersWithOcc.length} centros</span></div>
        <div class="meta-item"><span class="meta-label">Total Personas Registradas</span><span class="meta-val">${occupants.length} ciudadanos</span></div>
        <div class="meta-item"><span class="meta-label">Actualmente Albergados</span><span class="meta-val" style="color: #16a34a;">${totalOcupantes} personas</span></div>
        <div class="meta-item"><span class="meta-label">Salidas Registradas</span><span class="meta-val" style="color: #dc2626;">${totalSalidas} personas</span></div>
      </div>

      ${shelterSections}
    `;

    printDocument(`Reporte_Ocupantes_Por_Refugio`, content);
  };

  // --- REPORT N° 7: REPORTE CONSOLIDADO DE TODOS LOS REFUGIOS ---
  const exportAllSheltersOccupantsPdf = () => {
    if (occupants.length === 0) {
      alert('No hay ocupantes registrados en la base de datos.');
      return;
    }

    const fmtDateShort = (ts: number) => new Date(ts).toLocaleDateString('es-VE', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    const sorted = [...occupants].sort((a, b) => b.createdAt - a.createdAt);
    let rows = '';
    sorted.forEach((o, i) => {
      const shelter = shelters.find(s => s.id === o.shelterId);
      const ingreso = o.createdAt ? fmtDateShort(o.createdAt) : 'N/R';
      const salida = o.status === 'Salida' && o.exitDate ? fmtDateShort(o.exitDate) : (o.status === 'Salida' ? 'N/R' : '—');
      rows += `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${o.fullName}</strong></td>
          <td style="font-family: monospace;">${o.ci}</td>
          <td>${o.age || '—'}</td>
          <td><strong>${shelter?.name || 'Refugio eliminado'}</strong><br><span style="font-size: 10px; color: #666;">${shelter?.state || ''}</span></td>
          <td>${ingreso}</td>
          <td>${salida}</td>
          <td><span class="badge-${o.status === 'Salida' ? 'red' : 'green'}">${o.status || 'Albergado'}</span></td>
          <td>${o.physicalCondition}</td>
          <td>${o.medicalNeeds}</td>
          <td>${o.origen || '—'}</td>
        </tr>
      `;
    });

    const totalAlbergados = occupants.filter(o => o.status !== 'Salida').length;
    const totalSalidas = occupants.filter(o => o.status === 'Salida').length;
    const sheltersCount = new Set(occupants.map(o => o.shelterId)).size;

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — CENSO CONSOLIDADO DE REFUGIOS</div>
          <div class="subtitle">Directorio unificado de todas las personas albergadas en la red de refugios</div>
        </div>
        <div class="stamp">CONSOLIDADO NACIONAL</div>
      </div>

      <div class="meta-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr;">
        <div class="meta-item"><span class="meta-label">Total Personas</span><span class="meta-val">${occupants.length}</span></div>
        <div class="meta-item"><span class="meta-label">Albergados</span><span class="meta-val" style="color: #16a34a;">${totalAlbergados}</span></div>
        <div class="meta-item"><span class="meta-label">Salidas</span><span class="meta-val" style="color: #dc2626;">${totalSalidas}</span></div>
        <div class="meta-item"><span class="meta-label">Refugios Involucrados</span><span class="meta-val">${sheltersCount}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 3%;">#</th>
            <th style="width: 16%;">Nombre Completo</th>
            <th style="width: 10%;">Cédula</th>
            <th style="width: 4%;">Edad</th>
            <th style="width: 16%;">Refugio</th>
            <th style="width: 10%;">Ingreso</th>
            <th style="width: 10%;">Salida</th>
            <th style="width: 9%;">Estatus</th>
            <th style="width: 9%;">Condición Física</th>
            <th style="width: 9%;">Necesidades Médicas</th>
            <th style="width: 9%;">Origen</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    printDocument(`Censo_Consolidado_Refugios`, content);
  };

  // --- REPORT N° 8: REPORTE DE OCUPANTES AGRUPADOS POR FECHA DE INGRESO ---
  const exportOccupantsByEntryDatePdf = () => {
    if (occupants.length === 0) {
      alert('No hay ocupantes registrados en la base de datos.');
      return;
    }

    const fmtDateShort = (ts: number) => new Date(ts).toLocaleDateString('es-VE', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    const sorted = [...occupants].sort((a, b) => a.createdAt - b.createdAt); // Ascending
    const groupedByDate: { [date: string]: typeof occupants } = {};
    
    sorted.forEach(o => {
      const dateStr = o.createdAt ? fmtDateShort(o.createdAt) : 'N/R';
      if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
      groupedByDate[dateStr].push(o);
    });

    let sections = '';
    Object.keys(groupedByDate).forEach(dateStr => {
      const list = groupedByDate[dateStr];
      let rows = '';
      list.forEach((o, i) => {
        const shelter = shelters.find(s => s.id === o.shelterId);
        const salida = o.status === 'Salida' && o.exitDate ? fmtDateShort(o.exitDate) : (o.status === 'Salida' ? 'N/R' : '—');
        rows += `
          <tr>
            <td style="text-align: center;">${i + 1}</td>
            <td><strong>${o.fullName}</strong></td>
            <td style="font-family: monospace;">${o.ci}</td>
            <td>${o.age || '—'}</td>
            <td><strong>${shelter?.name || 'Refugio eliminado'}</strong></td>
            <td>${salida}</td>
            <td><span class="badge-${o.status === 'Salida' ? 'red' : 'green'}">${o.status || 'Albergado'}</span></td>
            <td>${o.origen || '—'}</td>
          </tr>
        `;
      });

      sections += `
        <div class="section-title">📅 INGRESOS DEL DÍA: ${dateStr} <span style="font-size: 12px; color: #6b7280; font-weight: normal;">(${list.length} personas)</span></div>
        <table>
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 25%;">Nombre Completo</th>
              <th style="width: 15%;">Cédula</th>
              <th style="width: 6%;">Edad</th>
              <th style="width: 25%;">Refugio Asignado</th>
              <th style="width: 12%;">Salida</th>
              <th style="width: 11%;">Estatus</th>
              <th style="width: 11%;">Origen</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    });

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — INGRESOS DIARIOS</div>
          <div class="subtitle">Desglose cronológico de ingreso de personas a la red de refugios</div>
        </div>
        <div class="stamp">LÍNEA DE TIEMPO</div>
      </div>
      <div class="meta-grid" style="grid-template-columns: 1fr 1fr;">
        <div class="meta-item"><span class="meta-label">Total Personas Registradas</span><span class="meta-val">${occupants.length} ciudadanos</span></div>
        <div class="meta-item"><span class="meta-label">Días de Operación Registrados</span><span class="meta-val">${Object.keys(groupedByDate).length} días distintos</span></div>
      </div>
      ${sections}
    `;

    printDocument(`Reporte_Ingresos_Cronologicos`, content);
  };

  // --- REPORT N° 9: REPORTE DE PERSONAS ACTIVAMENTE ALBERGADAS (SIN SALIDA) ---
  const exportActiveOccupantsPdf = () => {
    const activeOccupants = occupants.filter(o => o.status !== 'Salida');

    if (activeOccupants.length === 0) {
      alert('No hay personas albergadas activamente en este momento (todas tienen fecha de salida).');
      return;
    }

    const fmtDateShort = (ts: number) => new Date(ts).toLocaleDateString('es-VE', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    let rows = '';
    activeOccupants.forEach((o, i) => {
      const shelter = shelters.find(s => s.id === o.shelterId);
      const ingreso = o.createdAt ? fmtDateShort(o.createdAt) : 'N/R';
      rows += `
        <tr>
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${o.fullName}</strong></td>
          <td style="font-family: monospace;">${o.ci}</td>
          <td>${o.age || '—'}</td>
          <td><strong>${shelter?.name || 'Refugio eliminado'}</strong><br><span style="font-size: 10px; color: #666;">${shelter?.state || ''}</span></td>
          <td>${ingreso}</td>
          <td><span class="badge-green">Albergado</span></td>
          <td>${o.physicalCondition}</td>
          <td>${o.medicalNeeds}</td>
          <td>${o.origen || '—'}</td>
        </tr>
      `;
    });

    const sheltersCount = new Set(activeOccupants.map(o => o.shelterId)).size;

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — ALBERGADOS ACTIVOS</div>
          <div class="subtitle">Directorio de personas que permanecen actualmente en la red de refugios (sin fecha de salida)</div>
        </div>
        <div class="stamp" style="border-color: #16a34a; color: #16a34a;">ALBERGADOS ACTIVOS</div>
      </div>

      <div class="meta-grid" style="grid-template-columns: 1fr 1fr 1fr;">
        <div class="meta-item"><span class="meta-label">Total Personas Activas</span><span class="meta-val" style="color: #16a34a;">${activeOccupants.length}</span></div>
        <div class="meta-item"><span class="meta-label">Refugios Ocupados</span><span class="meta-val">${sheltersCount}</span></div>
        <div class="meta-item"><span class="meta-label">Porcentaje Activo</span><span class="meta-val">${Math.round((activeOccupants.length / occupants.length) * 100)}% de todos los ingresos</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 3%;">#</th>
            <th style="width: 17%;">Nombre Completo</th>
            <th style="width: 10%;">Cédula</th>
            <th style="width: 4%;">Edad</th>
            <th style="width: 18%;">Refugio Actual</th>
            <th style="width: 10%;">Fecha Ingreso</th>
            <th style="width: 10%;">Estatus</th>
            <th style="width: 11%;">Condición Física</th>
            <th style="width: 11%;">Necesidades Médicas</th>
            <th style="width: 10%;">Origen</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    printDocument(`Reporte_Albergados_Activos`, content);
  };

  // --- REPORT N° 10: ALBERGADOS ACTIVOS POR REFUGIO (SIN SALIDA, AGRUPADOS) ---
  const exportActiveOccupantsByRefugioPdf = () => {
    const activeOccupants = occupants.filter(o => o.status !== 'Salida');

    if (activeOccupants.length === 0) {
      alert('No hay personas albergadas activamente en este momento (todas tienen fecha de salida).');
      return;
    }

    const fmtDateShort = (ts: number) => new Date(ts).toLocaleDateString('es-VE', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    // Get shelters that have active occupants
    const shelterIdsWithActive = new Set(activeOccupants.map(o => o.shelterId));
    const sheltersWithActive = shelters.filter(s => shelterIdsWithActive.has(s.id));

    let shelterSections = '';
    sheltersWithActive.forEach(s => {
      const occs = activeOccupants
        .filter(o => o.shelterId === s.id)
        .sort((a, b) => b.createdAt - a.createdAt);

      if (occs.length === 0) return;

      let rows = '';
      occs.forEach((o, i) => {
        const ingreso = o.createdAt ? fmtDateShort(o.createdAt) : 'N/R';
        const diasAlbergado = o.createdAt ? Math.floor((Date.now() - o.createdAt) / (1000 * 60 * 60 * 24)) : 0;
        rows += `
          <tr>
            <td style="text-align: center;">${i + 1}</td>
            <td><strong>${o.fullName}</strong></td>
            <td style="font-family: monospace;">${o.ci}</td>
            <td>${o.age || '—'}</td>
            <td>${o.contactPhone || '—'}</td>
            <td>${ingreso}</td>
            <td style="text-align: center; font-weight: bold;">${diasAlbergado}d</td>
            <td>${o.physicalCondition}</td>
            <td>${o.medicalNeeds}</td>
            <td>${o.origen || '—'}</td>
          </tr>
        `;
      });

      const capacityInfo = s.maxCapacity
        ? `${occs.length} / ${s.maxCapacity} (${Math.round((occs.length / s.maxCapacity) * 100)}%)`
        : `${occs.length} personas`;
      const capacityBadge = s.capacityStatus === 'Verde'
        ? '<span class="badge-green">DISPONIBLE</span>'
        : s.capacityStatus === 'Amarillo'
        ? '<span class="badge-yellow">ALTO</span>'
        : '<span class="badge-red">LLENO</span>';

      shelterSections += `
        <div class="section-title">${s.name} (${s.state}) — ${occs.length} activos ${capacityBadge}</div>
        <div class="meta-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr; margin-bottom: 10px;">
          <div class="meta-item"><span class="meta-label">Dirección</span><span class="meta-val" style="font-size: 11px;">${s.address}</span></div>
          <div class="meta-item"><span class="meta-label">Tipo</span><span class="meta-val">${s.type}</span></div>
          <div class="meta-item"><span class="meta-label">Ocupación</span><span class="meta-val">${capacityInfo}</span></div>
          <div class="meta-item"><span class="meta-label">Contacto</span><span class="meta-val">${s.contact || 'Coordinación local'}</span></div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 3%;">#</th>
              <th style="width: 18%;">Nombre Completo</th>
              <th style="width: 10%;">Cédula</th>
              <th style="width: 4%;">Edad</th>
              <th style="width: 10%;">Teléfono</th>
              <th style="width: 10%;">Ingreso</th>
              <th style="width: 6%;">Días</th>
              <th style="width: 14%;">Condición Física</th>
              <th style="width: 15%;">Necesidades Médicas</th>
              <th style="width: 10%;">Origen</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    });

    const totalActivos = activeOccupants.length;
    const totalRefugios = sheltersWithActive.length;
    const conMedicas = activeOccupants.filter(o => o.medicalNeeds && o.medicalNeeds !== 'Ninguna').length;

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — ALBERGADOS ACTIVOS POR REFUGIO</div>
          <div class="subtitle">Censo vigente de personas actualmente albergadas, desglosado por centro de asistencia a la fecha ${new Date().toLocaleDateString('es-VE')}</div>
        </div>
        <div class="stamp" style="border-color: #16a34a; color: #16a34a;">ACTIVOS POR REFUGIO</div>
      </div>

      <div class="meta-grid" style="grid-template-columns: 1fr 1fr 1fr 1fr;">
        <div class="meta-item"><span class="meta-label">Total Personas Activas</span><span class="meta-val" style="color: #16a34a; font-size: 18px;">${totalActivos}</span></div>
        <div class="meta-item"><span class="meta-label">Refugios Operativos</span><span class="meta-val">${totalRefugios} centros</span></div>
        <div class="meta-item"><span class="meta-label">Promedio por Centro</span><span class="meta-val">${totalRefugios > 0 ? Math.round(totalActivos / totalRefugios) : 0} personas</span></div>
        <div class="meta-item"><span class="meta-label">Con Necesidades Médicas</span><span class="meta-val" style="color: #dc2626;">${conMedicas} personas</span></div>
      </div>

      ${shelterSections}

      <div class="signatures">
        <div class="sig-box">
          <div class="sig-title">Coordinador de Albergues</div>
          <div>Red de Refugios SISMOVZLA</div>
          <div style="margin-top: 25px; border-top: 1px dotted #ccc; font-size: 10px;">Firma y Sello</div>
        </div>
        <div class="sig-box">
          <div class="sig-title">Responsable de Censo Civil</div>
          <div>Protección Civil / Defensa Civil</div>
          <div style="margin-top: 25px; border-top: 1px dotted #ccc; font-size: 10px;">Firma y Sello</div>
        </div>
      </div>
    `;

    printDocument(`Albergados_Activos_Por_Refugio_${new Date().toISOString().slice(0,10)}`, content);
  };

  const exportOccupancyByShelterPerDayPdf = () => {
    if (occupants.length === 0) {
      alert('No hay registros de personas albergadas.');
      return;
    }

    const fmtDateShort = (ts: number) => new Date(ts).toLocaleDateString('es-VE', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    const minTs = occupants.reduce((min, o) => (o.createdAt && o.createdAt < min ? o.createdAt : min), Date.now());
    const days: number[] = [];
    for (let d = new Date(minTs).setHours(0,0,0,0); d <= new Date().setHours(23,59,59,999); d += 86400000) {
      days.push(d);
    }

    let shelterSections = '';
    shelters.forEach(s => {
      const shelterOccupants = occupants.filter(o => o.shelterId === s.id);
      if (shelterOccupants.length === 0) return;

      let rows = '';
      days.forEach(dayTs => {
        const dayStart = new Date(dayTs).setHours(0,0,0,0);
        const dayEnd = new Date(dayTs).setHours(23,59,59,999);
        
        const activeOnDay = shelterOccupants.filter(o => {
          const entered = o.createdAt && o.createdAt <= dayEnd;
          const isSalida = o.status === 'Salida';
          const notExitedYetProper = !isSalida || (isSalida && o.exitDate && o.exitDate > dayEnd);
          return entered && notExitedYetProper;
        });

        const entriesOnDay = shelterOccupants.filter(o => o.createdAt && o.createdAt >= dayStart && o.createdAt <= dayEnd).length;
        const exitsOnDay = shelterOccupants.filter(o => o.status === 'Salida' && o.exitDate && o.exitDate >= dayStart && o.exitDate <= dayEnd).length;

        if (activeOnDay.length > 0 || entriesOnDay > 0 || exitsOnDay > 0) {
          rows += `
            <tr>
              <td style="text-align: center;">${fmtDateShort(dayTs)}</td>
              <td style="text-align: center; color: #16a34a;">+${entriesOnDay}</td>
              <td style="text-align: center; color: #dc2626;">-${exitsOnDay}</td>
              <td style="text-align: center; font-weight: bold;">${activeOnDay.length}</td>
            </tr>
          `;
        }
      });

      if (rows) {
        shelterSections += `
          <div class="section-title" style="margin-top: 20px;">${s.name} (${s.state})</div>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Fecha</th>
                <th style="width: 25%;">Ingresos</th>
                <th style="width: 25%;">Salidas</th>
                <th style="width: 25%;">Ocupación al Cierre</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        `;
      }
    });

    if (!shelterSections) {
      shelterSections = '<p style="text-align: center; margin-top: 40px; color: #666;">No hay datos de ocupación histórica para generar este reporte.</p>';
    }

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — HISTÓRICO DE OCUPACIÓN POR REFUGIO</div>
          <div class="subtitle">Reporte diario de ocupación desde el primer registro hasta la fecha actual</div>
        </div>
        <div class="stamp" style="border-color: #2563eb; color: #2563eb;">HISTÓRICO DIARIO</div>
      </div>
      
      ${shelterSections}
      
      <div class="signatures">
        <div class="sig-box">
          <div class="sig-title">Coordinador de Albergues</div>
          <div>Red de Refugios SISMOVZLA</div>
          <div style="margin-top: 25px; border-top: 1px dotted #ccc; font-size: 10px;">Firma y Sello</div>
        </div>
        <div class="sig-box">
          <div class="sig-title">Responsable de Censo Civil</div>
          <div>Protección Civil / Defensa Civil</div>
          <div style="margin-top: 25px; border-top: 1px dotted #ccc; font-size: 10px;">Firma y Sello</div>
        </div>
      </div>
    `;

    printDocument(`Ocupacion_Historica_Por_Refugio_${new Date().toISOString().slice(0,10)}`, content);
  };

  // --- REPORT N° 11: DASHBOARD GRÁFICO ESTADÍSTICO DE ALBERGUES ---
  const exportGraphicalDashboardPdf = () => {
    const reportDate = Date.now();
    const start = dashboardStartDate ? new Date(dashboardStartDate + 'T00:00:00').getTime() : 0;
    const end = dashboardEndDate ? new Date(dashboardEndDate + 'T23:59:59.999').getTime() : reportDate;
    
    const periodEntries = occupants.filter(o => {
      const t = o.createdAt || 0;
      return t >= start && t <= end;
    });

    const periodExits = occupants.filter(o => {
      const t = o.exitDate || 0;
      return o.status === 'Salida' && t >= start && t <= end;
    });

    const activeOccupants = occupants.filter(o => {
      const tEntry = o.createdAt || 0;
      const tExit = o.exitDate;
      const enteredBeforeEnd = tEntry <= end;
      const notExitedBeforeEnd = o.status !== 'Salida' || !tExit || tExit > end;
      return enteredBeforeEnd && notExitedBeforeEnd;
    });
    
    // 1. KPIs
    const totalRefugios = shelters.length;

    // 2. Semáforo de Capacidad
    const estadoVerde = shelters.filter(s => s.capacityStatus === 'Verde').length;
    const estadoAmarillo = shelters.filter(s => s.capacityStatus === 'Amarillo').length;
    const estadoRojo = shelters.filter(s => s.capacityStatus === 'Rojo').length;

    // 3. Ocupación por Refugio (Barras Horizontales)
    let barrasRefugiosHtml = '';
    shelters.sort((a, b) => {
      const occA = activeOccupants.filter(o => o.shelterId === a.id).length;
      const occB = activeOccupants.filter(o => o.shelterId === b.id).length;
      return occB - occA; // Descending
    }).forEach(s => {
      const occ = activeOccupants.filter(o => o.shelterId === s.id).length;
      const pct = s.maxCapacity ? Math.min(100, Math.round((occ / s.maxCapacity) * 100)) : (occ > 0 ? 50 : 0); // Faux % if no max capacity
      const color = s.capacityStatus === 'Verde' ? '#16a34a' : s.capacityStatus === 'Amarillo' ? '#ca8a04' : '#dc2626';
      const maxCapStr = s.maxCapacity ? s.maxCapacity : 'N/D';
      
      barrasRefugiosHtml += `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 3px;">
            <span>${s.name} (${s.state})</span>
            <span>${occ} / ${maxCapStr} ${s.maxCapacity ? `(${pct}%)` : 'personas'}</span>
          </div>
          <div style="width: 100%; background: #e5e7eb; height: 16px; border-radius: 4px; overflow: hidden;">
            <div style="width: ${s.maxCapacity ? pct : (pct > 0 ? 100 : 0)}%; background: ${color}; height: 100%;"></div>
          </div>
        </div>
      `;
    });

    // 3.5 Ingresos Históricos por Refugio
    let ingresosHistoricosRefugiosHtml = '';
    const shelterHistorical: { id: string, name: string, state: string, count: number }[] = [];
    
    shelters.forEach(s => {
      const count = periodEntries.filter(o => o.shelterId === s.id).length;
      shelterHistorical.push({ id: s.id, name: s.name, state: s.state, count });
    });
    
    shelterHistorical.sort((a, b) => b.count - a.count);
    const maxHistEntries = Math.max(...shelterHistorical.map(s => s.count), 1);
    
    shelterHistorical.forEach(s => {
      const pct = Math.round((s.count / maxHistEntries) * 100);
      ingresosHistoricosRefugiosHtml += `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin-bottom: 3px;">
            <span>${s.name} (${s.state})</span>
            <span>${s.count} ingresos</span>
          </div>
          <div style="width: 100%; background: #e5e7eb; height: 16px; border-radius: 4px; overflow: hidden;">
            <div style="width: ${pct}%; background: #6366f1; height: 100%;"></div>
          </div>
        </div>
      `;
    });

    // 4. Ingresos Diarios (Barras Verticales SVG)
    const fmtDateShort = (ts: number) => new Date(ts).toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
    const ingresosPorDia: { [key: string]: number } = {};
    periodEntries.forEach(o => {
      if (o.createdAt) {
        const d = fmtDateShort(o.createdAt);
        ingresosPorDia[d] = (ingresosPorDia[d] || 0) + 1;
      }
    });
    
    const diasArray = Object.entries(ingresosPorDia);
    const maxIngresos = Math.max(...diasArray.map(d => d[1]), 1);
    
    let barrasVerticalesHtml = '';
    diasArray.forEach(([dia, count]) => {
      const heightPct = Math.round((count / maxIngresos) * 100);
      barrasVerticalesHtml += `
        <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; width: 40px; height: 120px;">
          <span style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">${count}</span>
          <div style="width: 20px; height: ${heightPct}%; background: #2563eb; border-radius: 2px 2px 0 0;"></div>
          <span style="font-size: 9px; margin-top: 4px; text-align: center; color: #4b5563; word-break: break-word;">${dia}</span>
        </div>
      `;
    });

    if (barrasVerticalesHtml === '') {
      barrasVerticalesHtml = '<div style="color: #6b7280; font-size: 12px; text-align: center; width: 100%; margin-top: 40px;">No hay datos de ingreso.</div>';
    }

    // 5. Ingresos Diarios por Refugio
    let tendenciaPorRefugioHtml = '';
    
    shelters.forEach(s => {
      const shelterOccupants = periodEntries.filter(o => o.shelterId === s.id);
      if (shelterOccupants.length === 0) return;
      
      const ingresosPorDiaLocal: { [key: string]: number } = {};
      shelterOccupants.forEach(o => {
        if (o.createdAt) {
          const d = fmtDateShort(o.createdAt);
          ingresosPorDiaLocal[d] = (ingresosPorDiaLocal[d] || 0) + 1;
        }
      });
      
      const diasArrayLocal = Object.entries(ingresosPorDiaLocal);
      if (diasArrayLocal.length === 0) return;
      
      const maxIngresosLocal = Math.max(...diasArrayLocal.map(d => d[1]), 1);
      
      let barrasHtml = '';
      diasArrayLocal.forEach(([dia, count]) => {
        const heightPct = Math.round((count / maxIngresosLocal) * 100);
        barrasHtml += `
          <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; width: 35px; height: 80px; flex-shrink: 0;">
            <span style="font-size: 9px; font-weight: bold; margin-bottom: 2px;">${count}</span>
            <div style="width: 15px; height: ${heightPct}%; background: #16a34a; border-radius: 2px 2px 0 0;"></div>
            <span style="font-size: 8px; margin-top: 2px; text-align: center; color: #4b5563;">${dia}</span>
          </div>
        `;
      });
      
      tendenciaPorRefugioHtml += `
        <div style="margin-bottom: 15px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px;">
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 10px; color: #374151; text-transform: uppercase;">${s.name} (${s.state})</div>
          <div style="display: flex; gap: 10px; overflow-x: auto; min-height: 90px;">
            ${barrasHtml}
          </div>
        </div>
      `;
    });

    // 6. Salidas Diarias por Refugio
    let tendenciaSalidaPorRefugioHtml = '';
    
    shelters.forEach(s => {
      const shelterOccupants = periodExits.filter(o => o.shelterId === s.id);
      if (shelterOccupants.length === 0) return;
      
      const salidasPorDiaLocal: { [key: string]: number } = {};
      shelterOccupants.forEach(o => {
        if (o.exitDate) {
          const d = fmtDateShort(o.exitDate);
          salidasPorDiaLocal[d] = (salidasPorDiaLocal[d] || 0) + 1;
        }
      });
      
      const diasArrayLocal = Object.entries(salidasPorDiaLocal);
      if (diasArrayLocal.length === 0) return;
      
      const maxSalidasLocal = Math.max(...diasArrayLocal.map(d => d[1]), 1);
      
      let barrasHtml = '';
      diasArrayLocal.forEach(([dia, count]) => {
        const heightPct = Math.round((count / maxSalidasLocal) * 100);
        barrasHtml += `
          <div style="display: flex; flex-direction: column; justify-content: flex-end; align-items: center; width: 35px; height: 80px; flex-shrink: 0;">
            <span style="font-size: 9px; font-weight: bold; margin-bottom: 2px;">${count}</span>
            <div style="width: 15px; height: ${heightPct}%; background: #dc2626; border-radius: 2px 2px 0 0;"></div>
            <span style="font-size: 8px; margin-top: 2px; text-align: center; color: #4b5563;">${dia}</span>
          </div>
        `;
      });
      
      tendenciaSalidaPorRefugioHtml += `
        <div style="margin-bottom: 15px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px;">
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 10px; color: #374151; text-transform: uppercase;">${s.name} (${s.state})</div>
          <div style="display: flex; gap: 10px; overflow-x: auto; min-height: 90px;">
            ${barrasHtml}
          </div>
        </div>
      `;
    });

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — DASHBOARD ANALÍTICO DE ALBERGUES</div>
          <div class="subtitle">Reporte Gráfico Estadístico de Ocupación y Tendencias</div>
          <div style="font-size: 11px; margin-top: 5px; color: #4b5563;">
            <strong>Período:</strong> ${dashboardStartDate ? new Date(dashboardStartDate + 'T00:00:00').toLocaleDateString('es-VE') : 'Inicio'} al ${dashboardEndDate ? new Date(dashboardEndDate + 'T00:00:00').toLocaleDateString('es-VE') : 'Actualidad'}
          </div>
        </div>
        <div class="stamp" style="border-color: #2563eb; color: #2563eb;">REPORTE VISUAL</div>
      </div>

      <!-- KPIs ROW -->
      <div style="display: flex; gap: 15px; margin-bottom: 25px;">
        <div style="flex: 1; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; text-align: center;">
          <div style="font-size: 11px; font-weight: bold; color: #6b7280; text-transform: uppercase;">Total Albergados Activos</div>
          <div style="font-size: 28px; font-weight: 900; color: #111; margin-top: 5px;">${activeOccupants.length}</div>
        </div>
        <div style="flex: 1; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; text-align: center;">
          <div style="font-size: 11px; font-weight: bold; color: #6b7280; text-transform: uppercase;">Total Refugios Activos</div>
          <div style="font-size: 28px; font-weight: 900; color: #111; margin-top: 5px;">${totalRefugios}</div>
        </div>
      </div>

      <div style="display: flex; gap: 20px;">
        
        <!-- LEFT COLUMN -->
        <div style="flex: 2;">
          <div class="section-title" style="margin-top: 0;">OCUPACIÓN POR REFUGIO</div>
          <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 15px;">
            ${barrasRefugiosHtml || '<p style="font-size: 12px; color: #6b7280;">No hay refugios registrados.</p>'}
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div style="flex: 1;">
          <div class="section-title" style="margin-top: 0;">ESTADO DE CAPACIDAD</div>
          <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; text-align: center;">
            <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 20px;">
              <!-- Simple donut approximation using conic-gradient (CSS3) -->
              <div style="width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(
                #16a34a 0% ${(estadoVerde / totalRefugios) * 100}%, 
                #ca8a04 ${(estadoVerde / totalRefugios) * 100}% ${((estadoVerde + estadoAmarillo) / totalRefugios) * 100}%, 
                #dc2626 ${((estadoVerde + estadoAmarillo) / totalRefugios) * 100}% 100%);
                display: flex; align-items: center; justify-content: center;
              ">
                <div style="width: 70px; height: 70px; background: white; border-radius: 50%;"></div>
              </div>
            </div>
            
            <div style="text-align: left; font-size: 12px; display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <span><span style="display: inline-block; width: 10px; height: 10px; background: #16a34a; border-radius: 50%; margin-right: 5px;"></span> Verde (Disponible)</span>
                <strong>${estadoVerde}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span><span style="display: inline-block; width: 10px; height: 10px; background: #ca8a04; border-radius: 50%; margin-right: 5px;"></span> Amarillo (Alto)</span>
                <strong>${estadoAmarillo}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span><span style="display: inline-block; width: 10px; height: 10px; background: #dc2626; border-radius: 50%; margin-right: 5px;"></span> Rojo (Lleno)</span>
                <strong>${estadoRojo}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-title">INGRESOS HISTÓRICOS POR REFUGIO (HASTA LA FECHA)</div>
      <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        ${ingresosHistoricosRefugiosHtml || '<p style="font-size: 12px; color: #6b7280;">No hay ingresos registrados.</p>'}
      </div>

      <div class="section-title">TENDENCIA DE INGRESOS (POR DÍA)</div>
      <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; display: flex; gap: 15px; justify-content: center; min-height: 140px; overflow-x: auto; margin-bottom: 20px;">
        ${barrasVerticalesHtml}
      </div>

      <div class="section-title">TENDENCIA DE INGRESOS (POR DÍA Y REFUGIO)</div>
            <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        ${tendenciaPorRefugioHtml || '<p style="font-size: 12px; color: #6b7280;">No hay ingresos registrados.</p>'}
      </div>

      <div class="section-title">TENDENCIA DE SALIDA (POR DÍA Y REFUGIO)</div>
      <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
        ${tendenciaSalidaPorRefugioHtml || '<p style="font-size: 12px; color: #6b7280;">No hay salidas registradas.</p>'}
      </div>

      <div class="footer-note" style="margin-top: 30px;">
        Dashboard generado con datos en tiempo real de la base de datos de SISMOVZLA.<br>
        Período del reporte: ${dashboardStartDate ? dashboardStartDate : 'Inicio'} al ${dashboardEndDate ? dashboardEndDate : 'Actualidad'}<br>
        Fecha de emisión: ${new Date().toLocaleString('es-VE')}
      </div>
    `;

    printDocument(`Dashboard_Grafico_Albergues_${new Date().toISOString().slice(0,10)}`, content);
  };

  // --- GLOBAL REPORT 1: DENSIDAD REGIONAL DE DAÑOS POR ESTADO ---
  const exportRegionalDensityPdf = () => {
    const statesMap: { [st: string]: { total: number; crit: number; covenin: number } } = {};
    incidents.forEach(inc => {
      const st = inc.state || 'Otros';
      if (!statesMap[st]) statesMap[st] = { total: 0, crit: 0, covenin: 0 };
      statesMap[st].total += 1;
      if (inc.severity >= 4) statesMap[st].crit += 1;
      if (inc.structuralEvaluation) statesMap[st].covenin += 1;
    });

    let rows = '';
    Object.keys(statesMap).forEach(st => {
      const d = statesMap[st];
      const pctCrit = d.total > 0 ? Math.round((d.crit / d.total) * 100) : 0;
      const pctCov = d.total > 0 ? Math.round((d.covenin / d.total) * 100) : 0;
      rows += `
        <tr>
          <td><strong>📍 ${st}</strong></td>
          <td style="text-align: center; font-weight: bold;">${d.total}</td>
          <td style="text-align: center; color: #dc2626; font-weight: bold;">${d.crit} (${pctCrit}%)</td>
          <td style="text-align: center; color: #16a34a; font-weight: bold;">${d.covenin} (${pctCov}%)</td>
          <td>
            <div style="background: #e5e7eb; width: 100%; height: 10px; border-radius: 5px; overflow: hidden;">
              <div style="background: #dc2626; width: ${pctCrit}%; height: 100%;"></div>
            </div>
          </td>
        </tr>
      `;
    });

    if (rows === '') rows = '<tr><td colspan="5" style="text-align: center;">Sin registros de incidencias por región.</td></tr>';

    const totalNat = incidents.length;
    const totalCritNat = incidents.filter(i => i.severity >= 4).length;
    const totalCovNat = incidents.filter(i => i.structuralEvaluation).length;

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — REPORTE EJECUTIVO REGIONAL POR ESTADOS</div>
          <div class="subtitle">Densidad Comparativa de Daños e Índice de Respuesta Técnica COVENIN 1756</div>
        </div>
        <div class="stamp">DENSIDAD REGIONAL</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Consolidado Nacional</span><span class="meta-val">${totalNat} incidentes registrados</span></div>
        <div class="meta-item"><span class="meta-label">Índice Crítico Nacional</span><span class="meta-val" style="color: #dc2626;">${totalCritNat} estructuras severas (${totalNat > 0 ? Math.round((totalCritNat/totalNat)*100) : 0}%)</span></div>
        <div class="meta-item"><span class="meta-label">Cobertura de Inspección</span><span class="meta-val" style="color: #16a34a;">${totalCovNat} dictámenes emitidos</span></div>
        <div class="meta-item"><span class="meta-label">Fecha de Auditoría</span><span class="meta-val">${new Date().toLocaleString('es-VE')}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Entidad Federal</th>
            <th style="width: 15%; text-align: center;">Total Censados</th>
            <th style="width: 20%; text-align: center;">Críticos (Grav 4-5)</th>
            <th style="width: 20%; text-align: center;">Inspección CIV</th>
            <th style="width: 20%;">Curva de Severidad</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr style="background: #f3f4f6; font-weight: bold; border-top: 2px solid #374151;">
            <td>TOTAL VENEZUELA</td>
            <td style="text-align: center;">${totalNat}</td>
            <td style="text-align: center; color: #dc2626;">${totalCritNat}</td>
            <td style="text-align: center; color: #16a34a;">${totalCovNat}</td>
            <td>Consolidado País</td>
          </tr>
        </tbody>
      </table>
    `;

    printDocument(`Reporte_Regional_Densidad_Daños`, content);
  };

  // --- GLOBAL REPORT 2: MANIFIESTO GPS OBJETIVOS SAR / USAR ---
  const exportSarTargetsPdf = () => {
    const sarList = incidents.filter(i => i.severity >= 4).sort((a,b) => b.severity - a.severity);
    let rows = '';
    sarList.forEach(inc => {
      rows += `
        <tr>
          <td><strong style="color: #dc2626;">INC-${inc.id.toUpperCase()}</strong><br><span style="font-size: 10px;">${new Date(inc.createdAt).toLocaleTimeString('es-VE')}</span></td>
          <td><strong style="font-size: 13px; font-family: monospace; background: #fee2e2; padding: 4px 8px; border-radius: 4px; display: inline-block; color: #991b1b;">${inc.latitude.toFixed(5)}° N<br>${inc.longitude.toFixed(5)}° O</strong></td>
          <td><span class="badge-red">Grav. ${inc.severity}</span><br><strong>${inc.type}</strong></td>
          <td>${inc.address || inc.description}</td>
          <td>${inc.structuralEvaluation ? 'Inspeccionado CIV' : '⏳ Búsqueda USAR Activa'}</td>
        </tr>
      `;
    });

    if (rows === '') rows = '<tr><td colspan="5" style="text-align: center;">No hay objetivos de rescate críticos (Gravedad 4 y 5) activos.</td></tr>';

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — MANIFIESTO GPS DE OBJETIVOS CRÍTICOS SAR</div>
          <div class="subtitle">Directorio Táctico de Coordenadas Satelitales para Helitransportes y Brigadas de Rescate Urbano USAR / K9</div>
        </div>
        <div class="stamp">RESCATE SAR</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Objetivos SAR Prioritarios</span><span class="meta-val" style="color: #dc2626;">${sarList.length} puntos de rescate</span></div>
        <div class="meta-item"><span class="meta-label">Protocolo Táctico</span><span class="meta-val">Despacho Aéreo / Terrestre Inmediato</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 14%;">Código / Hora</th>
            <th style="width: 22%;">Coordenadas GPS Exactas</th>
            <th style="width: 18%;">Siniestro</th>
            <th style="width: 32%;">Referencia Física Terrestre</th>
            <th style="width: 14%;">Estatus Operativo</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    printDocument(`Manifiesto_GPS_Objetivos_SAR`, content);
  };

  // --- GLOBAL REPORT 3: CATÁLOGO NACIONAL DE INMUEBLES ETIQUETADOS ---
  const exportTaggedBuildingsPdf = () => {
    const covList = incidents.filter(i => i.structuralEvaluation !== undefined);
    
    const reds = covList.filter(i => i.structuralEvaluation?.formulario_evaluacion_post_sismo.resumen_final.clasificacion.includes('Rojo'));
    const yellows = covList.filter(i => i.structuralEvaluation?.formulario_evaluacion_post_sismo.resumen_final.clasificacion.includes('Amarillo'));
    const greens = covList.filter(i => i.structuralEvaluation?.formulario_evaluacion_post_sismo.resumen_final.clasificacion.includes('Verde'));

    const renderGroupRows = (list: Incident[]) => {
      if (list.length === 0) return '<tr><td colspan="4" style="text-align: center; color: #9ca3af;">Sin edificaciones registradas en esta categoría.</td></tr>';
      return list.map(inc => {
        const ev = inc.structuralEvaluation!.formulario_evaluacion_post_sismo;
        return `
          <tr>
            <td><strong>INC-${inc.id.toUpperCase()}</strong><br><span style="font-size: 10px;">CIV: ${ev.datos_edificacion.ingeniero_evaluador.cod_inces_civ || 'Oficial'}</span></td>
            <td><strong>${ev.datos_edificacion.direccion || inc.address || inc.description}</strong><br><span style="font-size: 10px; color: #666;">${inc.state}</span></td>
            <td>${ev.datos_edificacion.uso || 'Residencial'} (${ev.datos_edificacion.no_pisos || 1} pisos)</td>
            <td>${ev.resumen_final.justificacion || 'Evaluación ocular estándar.'}</td>
          </tr>
        `;
      }).join('');
    };

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — CATÁLOGO MUNICIPAL DE INMUEBLES ETIQUETADOS</div>
          <div class="subtitle">Registro Oficial COVENIN 1756 de Demoliciones, Accesos Restringidos e Inmuebles Seguros</div>
        </div>
        <div class="stamp">CATASTRO SÍSMICO</div>
      </div>

      <div class="meta-grid" style="grid-template-columns: 1fr 1fr 1fr;">
        <div class="meta-item"><span class="meta-label">🔴 Etiqueta Roja (Inseguro)</span><span class="meta-val" style="color: #dc2626;">${reds.length} inmuebles</span></div>
        <div class="meta-item"><span class="meta-label">🟡 Etiqueta Amarilla (Restringido)</span><span class="meta-val" style="color: #d97706;">${yellows.length} inmuebles</span></div>
        <div class="meta-item"><span class="meta-label">🟢 Etiqueta Verde (Habitable)</span><span class="meta-val" style="color: #16a34a;">${greens.length} inmuebles</span></div>
      </div>

      <div class="section-title" style="background: #fee2e2; color: #991b1b; border-left-color: #dc2626;">🔴 1. PERÍMETROS PROHIBIDOS & ÓRDENES DE DEMOLICIÓN (NO HABITABLE)</div>
      <table>
        <thead><tr><th style="width:15%;">Expediente</th><th style="width:35%;">Dirección del Inmueble</th><th style="width:20%;">Caracterización</th><th style="width:30%;">Dictamen / Justificación</th></tr></thead>
        <tbody>${renderGroupRows(reds)}</tbody>
      </table>

      <div class="section-title" style="background: #fef9c3; color: #854d0e; border-left-color: #d97706;">🟡 2. INMUEBLES CON ACCESO RESTRINGIDO & APUNTALAMIENTO URGENTE</div>
      <table>
        <thead><tr><th style="width:15%;">Expediente</th><th style="width:35%;">Dirección del Inmueble</th><th style="width:20%;">Caracterización</th><th style="width:30%;">Dictamen / Justificación</th></tr></thead>
        <tbody>${renderGroupRows(yellows)}</tbody>
      </table>

      <div class="section-title" style="background: #dcfce7; color: #166534; border-left-color: #16a34a;">🟢 3. EDIFICACIONES ÍNTEGRAS / HABITABLES (REFUGIOS POTENCIALES)</div>
      <table>
        <thead><tr><th style="width:15%;">Expediente</th><th style="width:35%;">Dirección del Inmueble</th><th style="width:20%;">Caracterización</th><th style="width:30%;">Dictamen / Justificación</th></tr></thead>
        <tbody>${renderGroupRows(greens)}</tbody>
      </table>
    `;

    printDocument(`Catalogo_Inmuebles_Etiquetados`, content);
  };

  // --- GLOBAL REPORT 4: MATRIZ FRECUENCIAL DE PATOLOGÍAS ESTRUCTURALES ---
  const exportPathologyMatrixPdf = () => {
    const counts: { [item: string]: { leve: number; mod: number; sev: number; col: number } } = {};
    let totalEval = 0;

    incidents.forEach(inc => {
      if (inc.structuralEvaluation) {
        totalEval += 1;
        const form = inc.structuralEvaluation.formulario_evaluacion_post_sismo;
        const seccs = [
          form.secciones_evaluacion.A_elementos_verticales,
          form.secciones_evaluacion.B_elementos_horizontales,
          form.secciones_evaluacion.C_sistema_global,
          form.secciones_evaluacion.D_elementos_no_estructurales,
          form.secciones_evaluacion.E_terreno_y_cimentacion,
          form.secciones_evaluacion.F_instalaciones_y_riesgo_secundario
        ];
        seccs.forEach(s => {
          s.items.forEach(it => {
            const cal = s.calificaciones[it] || 'Ninguno';
            if (!counts[it]) counts[it] = { leve: 0, mod: 0, sev: 0, col: 0 };
            if (cal === 'Leve') counts[it].leve += 1;
            if (cal === 'Moderado') counts[it].mod += 1;
            if (cal === 'Severo') counts[it].sev += 1;
            if (cal === 'Colapso') counts[it].col += 1;
          });
        });
      }
    });

    let rows = '';
    Object.keys(counts).forEach(it => {
      const c = counts[it];
      const totalAfec = c.leve + c.mod + c.sev + c.col;
      if (totalAfec > 0) {
        rows += `
          <tr>
            <td><strong>${it}</strong></td>
            <td style="text-align: center;">${c.leve}</td>
            <td style="text-align: center; background: #fef9c3;">${c.mod}</td>
            <td style="text-align: center; background: #fee2e2; color: #991b1b; font-weight: bold;">${c.sev}</td>
            <td style="text-align: center; background: #991b1b; color: white; font-weight: bold;">${c.col}</td>
            <td style="text-align: center; font-weight: bold;">${totalAfec} (${totalEval > 0 ? Math.round((totalAfec/totalEval)*100) : 0}%)</td>
          </tr>
        `;
      }
    });

    if (rows === '') rows = '<tr><td colspan="6" style="text-align: center;">Sin patologías estructurales censadas en las inspecciones.</td></tr>';

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — MATRIZ ANALÍTICA DE PATOLOGÍAS SÍSMICAS</div>
          <div class="subtitle">Estudio Sismológico de Frecuencia de Fallas Estructurales A - F (Estándar FUNVISIS / CIV)</div>
        </div>
        <div class="stamp">ANALÍTICA CIV</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Base Muestral Evaluada</span><span class="meta-val">${totalEval} edificaciones inspeccionadas formalmente</span></div>
        <div class="meta-item"><span class="meta-label">Propósito Normativo</span><span class="meta-val">Ajuste de Código Sismorresistente COVENIN 1756</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40%;">Ítem Estructural / Arquitectónico Evaluado</th>
            <th style="width: 10%; text-align: center;">Leve</th>
            <th style="width: 10%; text-align: center;">Moderado</th>
            <th style="width: 10%; text-align: center;">Severo</th>
            <th style="width: 10%; text-align: center;">Colapso</th>
            <th style="width: 20%; text-align: center;">Frecuencia Acumulada</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    printDocument(`Matriz_Patologias_Estructurales`, content);
  };

  // --- GLOBAL REPORT 5: ALERTA TÁCTICA REDES VITALES & RIESGOS SECUNDARIOS ---
  const exportLifelineHazardsPdf = () => {
    const hazardsList = incidents.filter(inc => {
      const txt = `${inc.description} ${inc.type}`.toLowerCase();
      const matchKey = /gas|incendio|electr|cable|tuber|puente|autopist|agua|colaps|servici|derrumb|fuga|luz/i.test(txt);
      const matchCov = inc.structuralEvaluation?.formulario_evaluacion_post_sismo.resumen_final.acciones_inmediatas.cortar_servicios === true;
      return matchKey || matchCov;
    });

    let rows = '';
    hazardsList.forEach(inc => {
      const txt = `${inc.description} ${inc.type}`.toLowerCase();
      let emp = 'PC / Bomberos';
      if (/gas|pdvsa/i.test(txt)) emp = '🔥 PDVSA Gas';
      else if (/electr|luz|cable|corpoelec/i.test(txt)) emp = '⚡ CORPOELEC';
      else if (/agua|tuber|hidro/i.test(txt)) emp = '💧 Hidrocapital';
      else if (/puente|vial|autopist/i.test(txt)) emp = '🛣️ Min. Transporte';

      rows += `
        <tr>
          <td><strong>INC-${inc.id.toUpperCase()}</strong><br><span style="font-size: 10px;">${inc.state}</span></td>
          <td><strong style="font-size: 13px; color: #dc2626;">${emp}</strong></td>
          <td><strong>${inc.type}:</strong> ${inc.description}</td>
          <td style="font-family: monospace;">${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}<br><span style="font-size: 10px; color: #555;">${inc.address || ''}</span></td>
        </tr>
      `;
    });

    if (rows === '') rows = '<tr><td colspan="4" style="text-align: center;">Sin alertas inmediatas en servicios públicos o redes vitales.</td></tr>';

    const content = `
      <div class="header">
        <div>
          <div class="title">SISMOVZLA — BOLETÍN TÁCTICO DE REDES VITALES</div>
          <div class="subtitle">Despacho de Emergencia para Empresas Públicas (CORPOELEC, PDVSA Gas, Hidrocapital y Vialidad)</div>
        </div>
        <div class="stamp">REDES VITALES</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Alertas de Servicios Públicos</span><span class="meta-val" style="color: #dc2626;">${hazardsList.length} puntos con riesgo secundario</span></div>
        <div class="meta-item"><span class="meta-label">Orden de Despacho</span><span class="meta-val">Corte de Suministro y Reparación Urgente</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Código / Estado</th>
            <th style="width: 20%;">Agencia Competente</th>
            <th style="width: 40%;">Descripción del Riesgo Secundario</th>
            <th style="width: 25%;">Coordenadas & Ubicación</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;

    printDocument(`Boletin_Redes_Vitales_Servicios`, content);
  };

  // --- GLOBAL REPORT 6: BOLETÍN INTERNACIONAL SITREP ONU / OCHA ---
  const exportSitrepPdf = () => {
    const totalInc = incidents.length;
    const critInc = incidents.filter(i => i.severity >= 4).length;
    const covInc = incidents.filter(i => i.structuralEvaluation).length;
    const patInc = patients.length;
    const donInc = donors.filter(d => d.isQualified).length;
    const shlInc = shelters.length;

    const content = `
      <div class="header">
        <div>
          <div class="title">SITREP — REPORTE DE SITUACIÓN HUMANITARIA</div>
          <div class="subtitle">Estándar ONU / OCHA / FEMA • Desastre Sísmico República Bolivariana de Venezuela</div>
        </div>
        <div class="stamp">SITREP OFICIAL</div>
      </div>

      <div class="meta-grid" style="grid-template-columns: 1fr 1fr 1fr;">
        <div class="meta-item"><span class="meta-label">N° de SITREP</span><span class="meta-val">SITREP-VE-${new Date().toISOString().slice(0,10).replace(/-/g,'')}</span></div>
        <div class="meta-item"><span class="meta-label">Fecha de Emisión</span><span class="meta-val">${new Date().toLocaleString('es-VE')}</span></div>
        <div class="meta-item"><span class="meta-label">Centro Coordinador</span><span class="meta-val">SISMOVZLA Contingencia Civil</span></div>
      </div>

      <div class="section-title">1. Balance General de Impacto Civil</div>
      <table>
        <thead>
          <tr>
            <th>Indicador Humanitario Censado</th>
            <th style="text-align: right;">Cifra Consolidada</th>
            <th>Estatus Operativo</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Total de Alertas de Daños Registradas</td><td style="text-align: right; font-weight: bold;">${totalInc}</td><td>Mapeo Ciudadano Activo</td></tr>
          <tr><td>Estructuras Críticas / Colapsadas (Gravedad 4 y 5)</td><td style="text-align: right; font-weight: bold; color: #dc2626;">${critInc}</td><td>Objetivos de Búsqueda USAR</td></tr>
          <tr><td>Inspecciones Técnicas Estructurales CIV (COVENIN 1756)</td><td style="text-align: right; font-weight: bold; color: #16a34a;">${covInc}</td><td>Dictámenes Vinculantes Emitidos</td></tr>
          <tr><td>Censo Clínico en Red de Centros Asistenciales</td><td style="text-align: right; font-weight: bold;">${patInc || 'N/R'}</td><td>Monitoreo Hospitalario OCR</td></tr>
          <tr><td>Banco de Sangre — Donantes Aptos OMS</td><td style="text-align: right; font-weight: bold; color: #dc2626;">${donInc || 'N/R'}</td><td>Reserva Quirúrgica de Contingencia</td></tr>
          <tr><td>Refugios Civiles & Centros de Acopio Activos</td><td style="text-align: right; font-weight: bold;">${shlInc || 'N/R'}</td><td>Red Logística Abierta</td></tr>
        </tbody>
      </table>

      <div class="section-title">2. Resumen Táctico de Necesidades & Acciones de Coordinación</div>
      <div style="font-size: 13px; color: #374151; background: #f9fafb; padding: 15px; border: 1px solid #d1d5db; border-radius: 6px; line-height: 1.6;">
        <p><strong>A. Evaluación de Escena:</strong> Las redes de telecomunicaciones comerciales operan bajo degradación severa. El nodo de contingencia SISMOVZLA mantiene la sincronización PWA asincrónica activa en terminales locales mediante IndexedDB.</p>
        <p style="margin-top: 8px;"><strong>B. Prioridades Inmediatas de Auxilio:</strong></p>
        <ol style="padding-left: 20px; margin-top: 4px;">
          <li>Despliegue de maquinaria pesada y brigadas K9 hacia los ${critInc} objetivos críticos censados.</li>
          <li>Canalización de unidades sanguíneas desde donantes verificados hacia hospitales traumáticos.</li>
          <li>Abastecimiento continuo de plantas eléctricas y agua potable en los refugios comunitarios.</li>
        </ol>
      </div>

      <div class="signatures">
        <div class="sig-box">
          <div class="sig-title">Oficial Táctico de Enlace</div>
          <div>Comité de Respuesta Ante Desastres</div>
          <div style="font-weight: bold; margin-top: 2px;">ID: ${role || 'TACTICO_2026'}</div>
          <div style="margin-top: 25px; border-top: 1px dotted #ccc; font-size: 10px;">Firma y Sello de Certificación</div>
        </div>
      </div>
    `;

    printDocument(`Boletin_SITREP_Internacional_ONU`, content);
  };

  const exportEocDashboardPdf = () => {
    const totalInc = incidents.length;
    const critInc = incidents.filter(i => i.severity >= 4).length;
    const covInc = incidents.filter(i => i.structuralEvaluation).length;
    const triageRed = triagePatients.filter(t => t.triageCode === 'Rojo').length;
    const triageYellow = triagePatients.filter(t => t.triageCode === 'Amarillo').length;
    const triageGreen = triagePatients.filter(t => t.triageCode === 'Verde').length;
    const content = `<div class="header"><div><div class="title">SISMOVZLA - RESUMEN EJECUTIVO EOC</div><div class="subtitle">Centro de Operaciones de Emergencia - Tablero Nacional</div></div><div class="stamp">DASHBOARD EOC</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Incidentes</span><span class="meta-val">${totalInc}</span></div><div class="meta-item"><span class="meta-label">Criticos (Grav 4-5)</span><span class="meta-val" style="color:#dc2626;">${critInc}</span></div><div class="meta-item"><span class="meta-label">Dictamenes COVENIN</span><span class="meta-val" style="color:#16a34a;">${covInc}</span></div><div class="meta-item"><span class="meta-label">Pacientes</span><span class="meta-val">${patients.length}</span></div><div class="meta-item"><span class="meta-label">Donantes</span><span class="meta-val">${donors.length}</span></div><div class="meta-item"><span class="meta-label">Refugios</span><span class="meta-val">${shelters.length}</span></div></div>` +
      `<div class="section-title">Resumen de Impacto</div>` +
      `<table><thead><tr><th>Indicador</th><th>Cifra</th><th>Estatus</th></tr></thead><tbody>` +
      `<tr><td>Incidentes Totales</td><td>${totalInc}</td><td>Mapeo Ciudadano</td></tr>` +
      `<tr><td>Criticos</td><td style="color:#dc2626;font-weight:bold;">${critInc}</td><td>Respuesta USAR</td></tr>` +
      `<tr><td>Dictamenes Tecnicos</td><td style="color:#16a34a;font-weight:bold;">${covInc}</td><td>CIV Emitidos</td></tr>` +
      `<tr><td>Pacientes</td><td>${patients.length}</td><td>Red Sanitaria</td></tr>` +
      `<tr><td>Refugios</td><td>${shelters.length}</td><td>Logistica</td></tr>` +
      `<tr><td>Triaje R/A/V</td><td>${triageRed}/${triageYellow}/${triageGreen}</td><td>Triaje</td></tr>` +
      `<tr><td>Eventos Cascada</td><td>${cascadeEvents.length}</td><td>Monitoreo</td></tr>` +
      `</tbody></table>`;
    printDocument('EOC_Dashboard_Ejecutivo', content);
  };

  const exportPersonSearchPdf = () => {
    let rows = '';
    personSearches.forEach(p => { rows += `<tr><td><strong>${p.name}</strong></td><td>${p.id}</td><td>${p.last_known_loc}</td><td><span class="badge-${p.status==='Localizado'?'green':p.status==='Hospitalizado'?'yellow':'red'}">${p.status}</span></td><td>${p.contact_info}</td><td>${new Date(p.createdAt).toLocaleString('es-VE')}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - MANIFIESTO DE BUSQUEDA DE PERSONAS</div><div class="subtitle">Directorio de personas buscadas, localizadas o hospitalizadas</div></div><div class="stamp">BUSQUEDAS</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Registros</span><span class="meta-val">${personSearches.length}</span></div><div class="meta-item"><span class="meta-label">Fecha</span><span class="meta-val">${new Date().toLocaleString('es-VE')}</span></div></div>` +
      `<table><thead><tr><th>Nombre</th><th>CI</th><th>Ultima Ubicacion</th><th>Estado</th><th>Contacto</th><th>Fecha</th></tr></thead><tbody>${rows}</tbody></table>`;
    printDocument('Manifiesto_Busqueda_Personas', content);
  };

  const exportEvacuationRoutesPdf = () => {
    let rows = '';
    evacRoutes.forEach(r => { rows += `<tr><td><strong>${r.name}</strong></td><td>${r.state}</td><td>${r.segment}</td><td><span class="badge-${r.status==='Despejada'?'green':r.status==='Parcial'?'yellow':'red'}">${r.status}</span></td><td>${r.blockageType||'--'}</td><td>${r.alternativeRoute||'--'}</td><td>${r.estimatedClearTime||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - MAPA DE RUTAS DE EVACUACION</div><div class="subtitle">Estado de vias de evacuacion y rutas alternas</div></div><div class="stamp">EVACUACION</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Rutas</span><span class="meta-val">${evacRoutes.length}</span></div><div class="meta-item"><span class="meta-label">Despejadas</span><span class="meta-val" style="color:#16a34a;">${evacRoutes.filter(r=>r.status==='Despejada').length}</span></div><div class="meta-item"><span class="meta-label">Bloqueadas</span><span class="meta-val" style="color:#dc2626;">${evacRoutes.filter(r=>r.status==='Bloqueada').length}</span></div></div>` +
      `<table><thead><tr><th>Ruta</th><th>Estado</th><th>Segmento</th><th>Estado Via</th><th>Obstruccion</th><th>Alternativa</th><th>ETA</th></tr></thead><tbody>${rows}</tbody></table>`;
    printDocument('Mapa_Rutas_Evacuacion', content);
  };

  const exportTriageManifestPdf = () => {
    const redC = triagePatients.filter(t=>t.triageCode==='Rojo').length;
    const yelC = triagePatients.filter(t=>t.triageCode==='Amarillo').length;
    const grnC = triagePatients.filter(t=>t.triageCode==='Verde').length;
    const blkC = triagePatients.filter(t=>t.triageCode==='Negro').length;
    let rows = '';
    triagePatients.forEach(t => { rows += `<tr><td><span class="badge-${t.triageCode==='Rojo'?'red':t.triageCode==='Amarillo'?'yellow':t.triageCode==='Negro'?'red':'green'}">${t.triageCode}</span></td><td><strong>${t.fullName||'Sin nombre'}</strong></td><td>${t.age||'--'}</td><td>${t.isPediatric?'Si':'No'}</td><td>${t.mechanism||'--'}</td><td>${t.conscious?'Si':'No'}</td><td>${t.breathing?'Si':'No'}</td><td>${t.ambulatory?'Si':'No'}</td><td>${t.destination||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - MANIFIESTO DE TRIAJE POR ZONA</div><div class="subtitle">Pacientes clasificados segun protocolo START / JumpSTART</div></div><div class="stamp">TRIAJE</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr 1fr 1fr;"><div class="meta-item"><span class="meta-label">Rojo (Inmediato)</span><span class="meta-val" style="color:#dc2626;">${redC}</span></div><div class="meta-item"><span class="meta-label">Amarillo (Tardio)</span><span class="meta-val" style="color:#d97706;">${yelC}</span></div><div class="meta-item"><span class="meta-label">Verde (Leve)</span><span class="meta-val" style="color:#16a34a;">${grnC}</span></div><div class="meta-item"><span class="meta-label">Negro (Fallecido)</span><span class="meta-val">${blkC}</span></div></div>` +
      `<table><thead><tr><th>Codigo</th><th>Paciente</th><th>Edad</th><th>Pediatrico</th><th>Mecanismo</th><th>Consciente</th><th>Respira</th><th>Ambulatorio</th><th>Destino</th></tr></thead><tbody>${rows}</tbody></table>`;
    printDocument('Manifiesto_Triaje', content);
  };

  const exportCascadeEventsPdf = () => {
    let rows = '';
    cascadeEvents.forEach(e => { rows += `<tr><td><strong>${e.eventType}</strong></td><td>${e.magnitude||'--'}</td><td>${e.location||'--'}</td><td><span class="badge-${e.severity==='Crítico'||e.severity==='Alto'?'red':e.severity==='Medio'?'yellow':'green'}">${e.severity}</span></td><td><span class="badge-${e.status==='Activo'?'red':e.status==='Contenido'?'yellow':'green'}">${e.status}</span></td><td>${(e.affectedZones||[]).join(', ')||'--'}</td><td>${e.respondersDeployed||0}</td><td>${new Date(e.createdAt).toLocaleString('es-VE')}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - EVENTOS EN CASCADA</div><div class="subtitle">Registro cronologico de eventos secundarios</div></div><div class="stamp">CASCADA</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Eventos</span><span class="meta-val">${cascadeEvents.length}</span></div><div class="meta-item"><span class="meta-label">Activos</span><span class="meta-val" style="color:#dc2626;">${cascadeEvents.filter(e=>e.status==='Activo').length}</span></div></div>` +
      `<table><thead><tr><th>Tipo</th><th>Magnitud</th><th>Ubicacion</th><th>Severidad</th><th>Estado</th><th>Zonas</th><th>Responders</th><th>Fecha</th></tr></thead><tbody>${rows}</tbody></table>`;
    printDocument('Eventos_En_Cascada', content);
  };

  const exportSearchRescuePdf = () => {
    let sectorRows = '';
    searchSectors.forEach(s => { sectorRows += `<tr><td><strong>${s.sectorName||s.gridRef}</strong></td><td>${s.gridRef}</td><td><span class="badge-${s.priority==='Crítico'?'red':s.priority==='Alto'?'yellow':'green'}">${s.priority}</span></td><td><span class="badge-${s.status==='Completado'||s.status==='Verificado'?'green':s.status==='En Progreso'?'yellow':'red'}">${s.status}</span></td><td>${s.structuresSearched||0}/${s.estimatedStructures||'?'}</td><td>${s.victimsFound||0}</td><td>${s.victimsRescued||0}</td><td>${s.victimsDeceased||0}</td></tr>`; });
    let teamRows = '';
    rescueTeams.forEach(t => { teamRows += `<tr><td><strong>${t.teamName}</strong></td><td>${t.type}</td><td>${t.members}</td><td>${t.teamLeader}</td><td><span class="badge-${t.status==='Desplegado'?'green':t.status==='Disponible'?'yellow':'red'}">${t.status}</span></td><td>${t.currentSector||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - MANIFIESTO DE BUSQUEDA Y RESCATE</div><div class="subtitle">Coordinacion USAR / SAR</div></div><div class="stamp">SAR / USAR</div></div>` +
      `<div class="section-title">Sectores de Busqueda</div>` +
      `<table><thead><tr><th>Sector</th><th>Grid</th><th>Prioridad</th><th>Estado</th><th>Estructuras</th><th>Victimas</th><th>Rescatadas</th><th>Fallecidas</th></tr></thead><tbody>${sectorRows||'<tr><td colspan="8" style="text-align:center;">Sin sectores</td></tr>'}</tbody></table>` +
      `<div class="section-title">Equipos de Rescate</div>` +
      `<table><thead><tr><th>Equipo</th><th>Tipo</th><th>Miembros</th><th>Leader</th><th>Estado</th><th>Sector</th></tr></thead><tbody>${teamRows||'<tr><td colspan="6" style="text-align:center;">Sin equipos</td></tr>'}</tbody></table>`;
    printDocument('Manifiesto_Busqueda_Rescate', content);
  };

  const exportSupplyInventoryPdf = () => {
    let rows = '';
    supplyInventory.forEach(s => { const low = s.minThreshold && s.quantity < s.minThreshold; rows += `<tr><td>${s.category}</td><td><strong>${s.itemName}</strong></td><td>${s.unit}</td><td>${s.quantity}</td><td>${s.minThreshold||'--'}</td><td><span class="badge-${low?'red':'green'}">${low?'BAJO':'OK'}</span></td><td>${s.expirationDate ? new Date(s.expirationDate).toLocaleDateString('es-VE') : '--'}</td></tr>`; });
    let reqRows = '';
    supplyRequests.forEach(r => { reqRows += `<tr><td>${r.fromWarehouse}</td><td>${r.toLocation}</td><td><span class="badge-${r.priority==='Crítica'?'red':r.priority==='Alta'?'yellow':'green'}">${r.priority}</span></td><td>${r.items.map(i=>i.itemName).join(', ')}</td><td><span class="badge-${r.status==='Entregado'?'green':r.status==='En Tránsito'?'yellow':'red'}">${r.status}</span></td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - INVENTARIO DE SUMINISTROS</div><div class="subtitle">Control de existencias y solicitudes</div></div><div class="stamp">LOGISTICA</div></div>` +
      `<div class="section-title">Inventario Actual</div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Items</span><span class="meta-val">${supplyInventory.length}</span></div><div class="meta-item"><span class="meta-label">Bajo Minimo</span><span class="meta-val" style="color:#dc2626;">${supplyInventory.filter(s=>s.minThreshold&&s.quantity<s.minThreshold).length}</span></div></div>` +
      `<table><thead><tr><th>Categoria</th><th>Item</th><th>Unidad</th><th>Cantidad</th><th>Minimo</th><th>Estado</th><th>Vencimiento</th></tr></thead><tbody>${rows||'<tr><td colspan="7" style="text-align:center;">Sin inventario</td></tr>'}</tbody></table>` +
      (reqRows ? `<div class="section-title">Solicitudes de Suministros</div><table><thead><tr><th>Origen</th><th>Destino</th><th>Prioridad</th><th>Items</th><th>Estado</th></tr></thead><tbody>${reqRows}</tbody></table>` : '');
    printDocument('Inventario_Suministros', content);
  };

  const exportWaterSanitationPdf = () => {
    let wpRows = '';
    waterPoints.forEach(w => { wpRows += `<tr><td><strong>${w.name}</strong></td><td>${w.type}</td><td><span class="badge-${w.waterStatus==='Potable'?'green':w.waterStatus==='No Potable'?'red':'yellow'}">${w.waterStatus}</span></td><td>${w.capacityLiters||'--'} L</td><td>${w.chlorineLevel||'--'} mg/L</td><td>${w.populationServed||'--'}</td></tr>`; });
    let spRows = '';
    sanitationPoints.forEach(s => { spRows += `<tr><td><strong>${s.name}</strong></td><td>${s.type}</td><td>${s.capacity}</td><td>${s.gender}</td><td><span class="badge-${s.status==='Operativo'?'green':'red'}">${s.status}</span></td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - AGUA Y SANEAMIENTO</div><div class="subtitle">Monitoreo de puntos de agua y saneamiento</div></div><div class="stamp">WASH</div></div>` +
      `<div class="section-title">Puntos de Agua</div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Puntos</span><span class="meta-val">${waterPoints.length}</span></div><div class="meta-item"><span class="meta-label">Potables</span><span class="meta-val" style="color:#16a34a;">${waterPoints.filter(w=>w.waterStatus==='Potable').length}</span></div></div>` +
      `<table><thead><tr><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Capacidad</th><th>Cloro</th><th>Poblacion</th></tr></thead><tbody>${wpRows||'<tr><td colspan="6" style="text-align:center;">Sin puntos</td></tr>'}</tbody></table>` +
      `<div class="section-title">Saneamiento</div>` +
      `<table><thead><tr><th>Nombre</th><th>Tipo</th><th>Capacidad</th><th>Genero</th><th>Estado</th></tr></thead><tbody>${spRows||'<tr><td colspan="5" style="text-align:center;">Sin puntos</td></tr>'}</tbody></table>`;
    printDocument('Reporte_Agua_Saneamiento', content);
  };

  const exportDeceasedPdf = () => {
    let rows = '';
    deceasedPersons.forEach(d => { rows += `<tr><td>${d.caseId}</td><td><strong>${d.fullName||'Sin identificar'}</strong></td><td>${d.ci||'--'}</td><td>${d.age||'--'}</td><td>${d.gender||'--'}</td><td>${d.causeOfDeath||'--'}</td><td><span class="badge-${d.identified?'green':'red'}">${d.identified?'Si':'No'}</span></td><td>${d.identificationMethod||'--'}</td><td>${d.morgueLocation||'--'}</td><td><span class="badge-${d.status==='Identificado'||d.status==='Entregado a Familiares'?'green':'yellow'}">${d.status}</span></td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - CENSO DE FALLECIDOS</div><div class="subtitle">Registro de personas fallecidas</div></div><div class="stamp">FALLECIDOS</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total</span><span class="meta-val">${deceasedPersons.length}</span></div><div class="meta-item"><span class="meta-label">Identificados</span><span class="meta-val" style="color:#16a34a;">${deceasedPersons.filter(d=>d.identified).length}</span></div></div>` +
      `<table><thead><tr><th>Caso</th><th>Nombre</th><th>CI</th><th>Edad</th><th>Genero</th><th>Causa</th><th>Identificado</th><th>Metodo</th><th>Morgue</th><th>Estado</th></tr></thead><tbody>${rows||'<tr><td colspan="10" style="text-align:center;">Sin registros</td></tr>'}</tbody></table>`;
    printDocument('Censo_Fallecidos', content);
  };

  const exportPsychosocialPdf = () => {
    let rows = '';
    psychosocialCases.forEach(p => { rows += `<tr><td><strong>${p.patientName||'Anonimo'}</strong></td><td>${p.age||'--'}</td><td>${p.crisisType}</td><td><span class="badge-${p.triagePriority==='Inmediato'?'red':p.triagePriority==='Alto'?'yellow':'green'}">${p.triagePriority}</span></td><td>${p.status}</td><td>${p.sessionCount||0}</td><td>${p.assignedPsychologist||'--'}</td><td>${p.location||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - APOYO PSICOSOCIAL</div><div class="subtitle">Intervenciones de salud mental</div></div><div class="stamp">PSICOSOCIAL</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Casos</span><span class="meta-val">${psychosocialCases.length}</span></div><div class="meta-item"><span class="meta-label">Abiertos</span><span class="meta-val" style="color:#dc2626;">${psychosocialCases.filter(p=>p.status==='Abierto').length}</span></div></div>` +
      `<table><thead><tr><th>Paciente</th><th>Edad</th><th>Crisis</th><th>Prioridad</th><th>Estado</th><th>Sesiones</th><th>Psicologo</th><th>Ubicacion</th></tr></thead><tbody>${rows||'<tr><td colspan="8" style="text-align:center;">Sin casos</td></tr>'}</tbody></table>`;
    printDocument('Reporte_Apoyo_Psicosocial', content);
  };

  const exportCommsNetworkPdf = () => {
    let rows = '';
    emergencyComms.forEach(c => { rows += `<tr><td>${c.type}</td><td>${c.callsign||'--'}</td><td>${c.frequency||'--'}</td><td>${c.mode||'--'}</td><td>${c.operatorName||'--'}</td><td>${c.location||'--'}</td><td>${c.coverage||'--'}</td><td><span class="badge-${c.status==='Activo'?'green':c.status==='Standby'?'yellow':'red'}">${c.status}</span></td><td>${c.powerSource||'--'}</td><td>${c.batteryHours||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - RED DE COMUNICACIONES</div><div class="subtitle">Estaciones de radio y telecomunicaciones</div></div><div class="stamp">COMMS</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Estaciones</span><span class="meta-val">${emergencyComms.length}</span></div><div class="meta-item"><span class="meta-label">Activas</span><span class="meta-val" style="color:#16a34a;">${emergencyComms.filter(c=>c.status==='Activo').length}</span></div></div>` +
      `<table><thead><tr><th>Tipo</th><th>Indicativo</th><th>Frecuencia</th><th>Modo</th><th>Operador</th><th>Ubicacion</th><th>Cobertura</th><th>Estado</th><th>Alimentacion</th><th>Bateria(h)</th></tr></thead><tbody>${rows||'<tr><td colspan="10" style="text-align:center;">Sin estaciones</td></tr>'}</tbody></table>`;
    printDocument('Estado_Red_Comunicaciones', content);
  };

  const exportVolunteersPdf = () => {
    let rows = '';
    volunteerRegs.forEach(v => { rows += `<tr><td><strong>${v.fullName}</strong></td><td>${v.ci}</td><td>${v.phone}</td><td>${v.profession||'--'}</td><td>${(v.skills||[]).join(', ')}</td><td>${v.availability}</td><td><span class="badge-${v.status==='En Campo'?'green':v.status==='Asignado'?'yellow':'red'}">${v.status}</span></td><td>${v.location||'--'}</td><td>${v.assignedTask||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - MANIFIESTO DE VOLUNTARIOS</div><div class="subtitle">Directorio de voluntarios</div></div><div class="stamp">VOLUNTARIADO</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total</span><span class="meta-val">${volunteerRegs.length}</span></div><div class="meta-item"><span class="meta-label">En Campo</span><span class="meta-val" style="color:#16a34a;">${volunteerRegs.filter(v=>v.status==='En Campo').length}</span></div></div>` +
      `<table><thead><tr><th>Nombre</th><th>CI</th><th>Telefono</th><th>Profesion</th><th>Habilidades</th><th>Disponibilidad</th><th>Estado</th><th>Ubicacion</th><th>Tarea</th></tr></thead><tbody>${rows||'<tr><td colspan="9" style="text-align:center;">Sin voluntarios</td></tr>'}</tbody></table>`;
    printDocument('Manifiesto_Voluntarios', content);
  };

  const exportDonationsPdf = () => {
    let rows = '';
    donations.forEach(d => { rows += `<tr><td>${d.donorType}</td><td><strong>${d.donorName}</strong></td><td>${d.donationType}</td><td>${d.amount ? '$'+d.amount : '--'}</td><td>${d.itemDescription||'--'}</td><td>${d.quantity||'--'}</td><td>${d.destination||'--'}</td><td><span class="badge-${d.status==='Recibido'||d.status==='Distribuido'?'green':d.status==='En Tránsito'?'yellow':'red'}">${d.status}</span></td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - MANIFIESTO DE DONACIONES</div><div class="subtitle">Registro de donaciones</div></div><div class="stamp">DONACIONES</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Donaciones</span><span class="meta-val">${donations.length}</span></div><div class="meta-item"><span class="meta-label">Monto Total</span><span class="meta-val">$${donations.reduce((a,d)=>a+(d.amount||0),0)}</span></div></div>` +
      `<table><thead><tr><th>Tipo</th><th>Nombre</th><th>Donacion</th><th>Monto</th><th>Descripcion</th><th>Cantidad</th><th>Destino</th><th>Estado</th></tr></thead><tbody>${rows||'<tr><td colspan="8" style="text-align:center;">Sin donaciones</td></tr>'}</tbody></table>`;
    printDocument('Manifiesto_Donaciones', content);
  };

  const exportInteragencyPdf = () => {
    let rows = '';
    interagencyTasks.forEach(t => { rows += `<tr><td><strong>${t.agencyName}</strong></td><td>${t.cluster||'--'}</td><td>${t.task}</td><td>${t.assignedZone||'--'}</td><td><span class="badge-${t.priority==='Crítica'?'red':t.priority==='Alta'?'yellow':'green'}">${t.priority}</span></td><td><span class="badge-${t.status==='Completada'?'green':t.status==='En Progreso'?'yellow':'red'}">${t.status}</span></td><td>${t.contactPhone||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - TAREAS INTERAGENCIALES</div><div class="subtitle">Coordinacion entre agencias</div></div><div class="stamp">INTERAGENCIA</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Tareas</span><span class="meta-val">${interagencyTasks.length}</span></div><div class="meta-item"><span class="meta-label">Completadas</span><span class="meta-val" style="color:#16a34a;">${interagencyTasks.filter(t=>t.status==='Completada').length}</span></div></div>` +
      `<table><thead><tr><th>Agencia</th><th>Cluster</th><th>Tarea</th><th>Zona</th><th>Prioridad</th><th>Estado</th><th>Contacto</th></tr></thead><tbody>${rows||'<tr><td colspan="7" style="text-align:center;">Sin tareas</td></tr>'}</tbody></table>`;
    printDocument('Tareas_Interagenciales', content);
  };

  const exportAerialOpsPdf = () => {
    let rows = '';
    aerialOps.forEach(a => { rows += `<tr><td>${a.aircraftType}</td><td>${a.registration||'--'}</td><td>${a.missionType}</td><td>${a.operatorName||'--'}</td><td>${a.assignedZone||'--'}</td><td>${a.launchPoint||'--'}</td><td><span class="badge-${a.status==='En Vuelo'?'green':a.status==='Completado'?'yellow':'red'}">${a.status}</span></td><td>${a.batteryFuelRemaining||'--'}%</td><td><span class="badge-${a.noFlyZone?'red':'green'}">${a.noFlyZone?'Si':'No'}</span></td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - OPERACIONES AEREAS</div><div class="subtitle">Vuelos de drones, helicopteros y apoyo aereo</div></div><div class="stamp">AEREO</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Ops</span><span class="meta-val">${aerialOps.length}</span></div><div class="meta-item"><span class="meta-label">En Vuelo</span><span class="meta-val" style="color:#16a34a;">${aerialOps.filter(a=>a.status==='En Vuelo').length}</span></div></div>` +
      `<table><thead><tr><th>Aeronave</th><th>Matricula</th><th>Mision</th><th>Operador</th><th>Zona</th><th>Lanzamiento</th><th>Estado</th><th>Bateria</th><th>No-Fly</th></tr></thead><tbody>${rows||'<tr><td colspan="9" style="text-align:center;">Sin operaciones</td></tr>'}</tbody></table>`;
    printDocument('Manifiesto_Operaciones_Aereas', content);
  };

  const exportFuelEnergyPdf = () => {
    let rows = '';
    fuelEnergyPoints.forEach(f => { rows += `<tr><td><strong>${f.name}</strong></td><td>${f.type}</td><td>${f.state}</td><td>${f.fuelType||'--'}</td><td>${f.capacityLiters||f.generatorPowerKW||'--'}</td><td>${f.litersRemaining||'--'}</td><td><span class="badge-${f.operationalStatus==='Operativo'?'green':f.operationalStatus==='Parcial'?'yellow':'red'}">${f.operationalStatus}</span></td><td>${f.priorityAccess||'--'}</td><td>${f.queueStatus||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - COMBUSTIBLE Y ENERGIA</div><div class="subtitle">Gasolineras, generadores y puntos de energia</div></div><div class="stamp">ENERGIA</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Puntos</span><span class="meta-val">${fuelEnergyPoints.length}</span></div><div class="meta-item"><span class="meta-label">Operativos</span><span class="meta-val" style="color:#16a34a;">${fuelEnergyPoints.filter(f=>f.operationalStatus==='Operativo').length}</span></div></div>` +
      `<table><thead><tr><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Combustible</th><th>Capacidad</th><th>Restante</th><th>Op</th><th>Acceso</th><th>Cola</th></tr></thead><tbody>${rows||'<tr><td colspan="9" style="text-align:center;">Sin puntos</td></tr>'}</tbody></table>`;
    printDocument('Inventario_Combustible_Energia', content);
  };

  const exportChildProtectionPdf = () => {
    let rows = '';
    childCases.forEach(c => { rows += `<tr><td><strong>${c.childName}</strong></td><td>${c.childAge}</td><td>${c.childGender}</td><td>${c.parentName||'--'}</td><td>${c.parentPhone||'--'}</td><td>${c.location}</td><td>${c.state}</td><td>${c.medicalNeeds||'--'}</td><td><span class="badge-${c.status==='En Protección'?'yellow':c.status==='Resuelto'||c.status==='Con Familia'?'green':'red'}">${c.status}</span></td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - MENORES VULNERABLES</div><div class="subtitle">Menores no acompanados o en vulnerabilidad</div></div><div class="stamp">PROTECCION</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Casos</span><span class="meta-val">${childCases.length}</span></div><div class="meta-item"><span class="meta-label">En Protección</span><span class="meta-val" style="color:#d97706;">${childCases.filter(c=>c.status==='En Protección').length}</span></div></div>` +
      `<table><thead><tr><th>Nombre</th><th>Edad</th><th>Genero</th><th>Padre/Madre</th><th>Telefono</th><th>Ubicacion</th><th>Estado</th><th>Necesidades</th><th>Estatus</th></tr></thead><tbody>${rows||'<tr><td colspan="9" style="text-align:center;">Sin casos</td></tr>'}</tbody></table>`;
    printDocument('Censo_Menores_Vulnerables', content);
  };

  const exportTemporaryHousingPdf = () => {
    let rows = '';
    tempHousing.forEach(h => { rows += `<tr><td><strong>${h.name}</strong></td><td>${h.type}</td><td>${h.state}</td><td>${h.capacity}</td><td>${h.currentOccupancy}</td><td><span class="badge-${h.status==='Disponible'?'green':h.status==='Lleno'?'red':'yellow'}">${h.status}</span></td><td>${h.contactPhone||'--'}</td><td>${(h.services||[]).join(', ')}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - VIVIENDAS TEMPORALES</div><div class="subtitle">Viviendas para personas desplazadas</div></div><div class="stamp">VIVIENDA</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Viviendas</span><span class="meta-val">${tempHousing.length}</span></div><div class="meta-item"><span class="meta-label">Capacidad Total</span><span class="meta-val">${tempHousing.reduce((a,h)=>a+h.capacity,0)}</span></div></div>` +
      `<table><thead><tr><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Capacidad</th><th>Ocupacion</th><th>Op</th><th>Contacto</th><th>Servicios</th></tr></thead><tbody>${rows||'<tr><td colspan="8" style="text-align:center;">Sin viviendas</td></tr>'}</tbody></table>`;
    printDocument('Censo_Viviendas_Temporales', content);
  };

  const exportEducationPdf = () => {
    let rows = '';
    schoolDamages.forEach(s => { rows += `<tr><td><strong>${s.schoolName}</strong></td><td>${s.schoolType}</td><td>${s.state}</td><td>${s.studentCount}</td><td><span class="badge-${s.structuralStatus==='Operativo'?'green':s.structuralStatus==='Parcial'?'yellow':'red'}">${s.structuralStatus}</span></td><td><span class="badge-${s.damageLevel==='Ninguno'||s.damageLevel==='Leve'?'green':s.damageLevel==='Moderado'?'yellow':'red'}">${s.damageLevel}</span></td><td>${s.needsAssessment||'--'}</td><td><span class="badge-${s.status==='Operativo'?'green':'yellow'}">${s.status}</span></td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - DANOS EN INFRAESTRUCTURA EDUCATIVA</div><div class="subtitle">Estado de escuelas y centros educativos</div></div><div class="stamp">EDUCACION</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Centros</span><span class="meta-val">${schoolDamages.length}</span></div><div class="meta-item"><span class="meta-label">No Operativos</span><span class="meta-val" style="color:#dc2626;">${schoolDamages.filter(s=>s.structuralStatus==='No Operativo'||s.structuralStatus==='Colapsado').length}</span></div></div>` +
      `<table><thead><tr><th>Escuela</th><th>Tipo</th><th>Estado</th><th>Estudiantes</th><th>Estruc.</th><th>Dano</th><th>Necesidades</th><th>Estatus</th></tr></thead><tbody>${rows||'<tr><td colspan="8" style="text-align:center;">Sin reportes</td></tr>'}</tbody></table>`;
    printDocument('Censo_Infraestructura_Educativa', content);
  };

  const exportWeatherAlertsReportPdf = () => {
    let rows = '';
    weatherAlertsList.forEach(w => { rows += `<tr><td><strong>${w.title}</strong></td><td>${w.type}</td><td><span class="badge-${w.severity==='Rojo'||w.severity==='Naranja'?'red':w.severity==='Amarillo'?'yellow':'green'}">${w.severity}</span></td><td>${w.state}</td><td>${w.description}</td><td>${w.source}</td><td><span class="badge-${w.active?'red':'green'}">${w.active?'Si':'No'}</span></td><td>${w.expiresAt ? new Date(w.expiresAt).toLocaleString('es-VE') : '--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - BOLETIN METEOROLOGICO</div><div class="subtitle">Alertas meteorologicas y fenomenos naturales</div></div><div class="stamp">METEO</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Alertas</span><span class="meta-val">${weatherAlertsList.length}</span></div><div class="meta-item"><span class="meta-label">Activas</span><span class="meta-val" style="color:#dc2626;">${weatherAlertsList.filter(w=>w.active).length}</span></div></div>` +
      `<table><thead><tr><th>Titulo</th><th>Tipo</th><th>Severidad</th><th>Estado</th><th>Descripcion</th><th>Fuente</th><th>Activa</th><th>Expira</th></tr></thead><tbody>${rows||'<tr><td colspan="8" style="text-align:center;">Sin alertas</td></tr>'}</tbody></table>`;
    printDocument('Boletin_Meteorologico', content);
  };

  const exportPublicAlertsReportPdf = () => {
    let rows = '';
    publicAlertsList.forEach(a => { rows += `<tr><td><strong>${a.title}</strong></td><td>${a.type}</td><td><span class="badge-${a.priority==='Crítica'?'red':a.priority==='Alta'?'yellow':'green'}">${a.priority}</span></td><td>${(a.states||[]).join(', ')}</td><td><span class="badge-${a.active?'red':'green'}">${a.active?'Si':'No'}</span></td><td>${a.broadcastCount}</td><td>${a.sentBy}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - ALERTAS PUBLICAS</div><div class="subtitle">Boletin de alertas a la ciudadania</div></div><div class="stamp">ALERTAS</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Alertas</span><span class="meta-val">${publicAlertsList.length}</span></div><div class="meta-item"><span class="meta-label">Activas</span><span class="meta-val" style="color:#dc2626;">${publicAlertsList.filter(a=>a.active).length}</span></div></div>` +
      `<table><thead><tr><th>Titulo</th><th>Tipo</th><th>Prioridad</th><th>Estados</th><th>Activa</th><th>Emisiones</th><th>Enviado</th></tr></thead><tbody>${rows||'<tr><td colspan="7" style="text-align:center;">Sin alertas</td></tr>'}</tbody></table>`;
    printDocument('Boletin_Alertas_Publicas', content);
  };

  const exportFamilyReunificationPdf = () => {
    let rows = '';
    familyRequestsList.forEach(f => { rows += `<tr><td><strong>${f.seekerName}</strong></td><td>${f.missingName}</td><td>${f.missingCI||'--'}</td><td>${f.missingAge||'--'}</td><td>${f.lastSeenLocation}</td><td>${new Date(f.lastSeenDate).toLocaleString('es-VE')}</td><td><span class="badge-${f.status==='Reunificado'?'green':f.status==='En Contacto'?'yellow':'red'}">${f.status}</span></td><td>${f.state}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - BUSQUEDAS FAMILIARES</div><div class="subtitle">Manifiesto de busquedas de familiares</div></div><div class="stamp">FAMILIAS</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Busquedas</span><span class="meta-val">${familyRequestsList.length}</span></div><div class="meta-item"><span class="meta-label">Reunificados</span><span class="meta-val" style="color:#16a34a;">${familyRequestsList.filter(f=>f.status==='Reunificado').length}</span></div></div>` +
      `<table><thead><tr><th>Solicitante</th><th>Desaparecido</th><th>CI</th><th>Edad</th><th>Ultima Ubicacion</th><th>Ultima Vez</th><th>Estado</th><th>Entidad</th></tr></thead><tbody>${rows||'<tr><td colspan="8" style="text-align:center;">Sin busquedas</td></tr>'}</tbody></table>`;
    printDocument('Busquedas_Familiares', content);
  };

  const exportLegalAidPdf = () => {
    let rows = '';
    legalAidList.forEach(l => { rows += `<tr><td><strong>${l.petitionerName}</strong></td><td>${l.petitionerCI}</td><td>${l.requestType}</td><td>${l.description}</td><td>${l.state}</td><td><span class="badge-${l.status==='Resuelto'?'green':l.status==='En Trámite'?'yellow':'red'}">${l.status}</span></td><td>${l.assignedTo||'--'}</td><td>${l.institution||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - ASISTENCIA LEGAL</div><div class="subtitle">Solicitudes de asistencia legal</div></div><div class="stamp">LEGAL</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Solicitudes</span><span class="meta-val">${legalAidList.length}</span></div><div class="meta-item"><span class="meta-label">En Trámite</span><span class="meta-val" style="color:#d97706;">${legalAidList.filter(l=>l.status==='En Trámite').length}</span></div></div>` +
      `<table><thead><tr><th>Solicitante</th><th>CI</th><th>Tipo</th><th>Descripcion</th><th>Estado</th><th>Estatus</th><th>Asignado</th><th>Institucion</th></tr></thead><tbody>${rows||'<tr><td colspan="8" style="text-align:center;">Sin solicitudes</td></tr>'}</tbody></table>`;
    printDocument('Reporte_Asistencia_Legal', content);
  };

  const exportPressCenterPdf = () => {
    let rows = '';
    pressReleasesList.forEach(pr => { rows += `<tr><td><strong>${pr.title}</strong></td><td>${pr.category}</td><td>${pr.author}</td><td>${pr.source}</td><td><span class="badge-${pr.published?'green':'red'}">${pr.published?'Si':'No'}</span></td><td>${pr.viewCount}</td><td>${new Date(pr.createdAt).toLocaleString('es-VE')}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - CENTRO DE PRENSA</div><div class="subtitle">Boletines y comunicados oficiales</div></div><div class="stamp">PRENSA</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Boletines</span><span class="meta-val">${pressReleasesList.length}</span></div><div class="meta-item"><span class="meta-label">Publicados</span><span class="meta-val" style="color:#16a34a;">${pressReleasesList.filter(p=>p.published).length}</span></div></div>` +
      `<table><thead><tr><th>Titulo</th><th>Categoria</th><th>Autor</th><th>Fuente</th><th>Publicado</th><th>Vistas</th><th>Fecha</th></tr></thead><tbody>${rows||'<tr><td colspan="7" style="text-align:center;">Sin comunicados</td></tr>'}</tbody></table>`;
    printDocument('Centro_De_Prensa', content);
  };

  const exportTrainingPdf = () => {
    let rows = '';
    trainingSessionsList.forEach(t => { rows += `<tr><td><strong>${t.title}</strong></td><td>${t.type}</td><td>${new Date(t.date).toLocaleDateString('es-VE')}</td><td>${t.duration}</td><td>${t.location}</td><td>${t.instructor}</td><td>${t.enrolledCount}/${t.maxParticipants}</td><td><span class="badge-${t.status==='Completado'?'green':t.status==='En Curso'?'yellow':'red'}">${t.status}</span></td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - MANIFIESTO DE CAPACITACION</div><div class="subtitle">Sesiones de capacitacion y simulacros</div></div><div class="stamp">CAPACITACION</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Sesiones</span><span class="meta-val">${trainingSessionsList.length}</span></div><div class="meta-item"><span class="meta-label">Completadas</span><span class="meta-val" style="color:#16a34a;">${trainingSessionsList.filter(t=>t.status==='Completado').length}</span></div></div>` +
      `<table><thead><tr><th>Titulo</th><th>Tipo</th><th>Fecha</th><th>Duracion</th><th>Ubicacion</th><th>Instructor</th><th>Inscritos</th><th>Estado</th></tr></thead><tbody>${rows||'<tr><td colspan="8" style="text-align:center;">Sin sesiones</td></tr>'}</tbody></table>`;
    printDocument('Manifiesto_Capacitacion', content);
  };

  const exportLessonsLearnedPdf = () => {
    let rows = '';
    aarList.forEach(a => { rows += `<tr><td><strong>${a.title}</strong></td><td>${a.module}</td><td>${new Date(a.incidentDate).toLocaleDateString('es-VE')}</td><td>${new Date(a.reviewDate).toLocaleDateString('es-VE')}</td><td><span class="badge-${a.priority==='Alta'?'red':a.priority==='Media'?'yellow':'green'}">${a.priority}</span></td><td><span class="badge-${a.status==='Completado'?'green':a.status==='En Implementación'?'yellow':'red'}">${a.status}</span></td><td>${a.assignedTo||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - LECCIONES APRENDIDAS</div><div class="subtitle">Revision post-incidente y mejoras</div></div><div class="stamp">LECCIONES</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total AAR</span><span class="meta-val">${aarList.length}</span></div><div class="meta-item"><span class="meta-label">Completadas</span><span class="meta-val" style="color:#16a34a;">${aarList.filter(a=>a.status==='Completado').length}</span></div></div>` +
      `<table><thead><tr><th>Titulo</th><th>Modulo</th><th>Fecha Incidente</th><th>Fecha Revision</th><th>Prioridad</th><th>Estado</th><th>Asignado</th></tr></thead><tbody>${rows||'<tr><td colspan="7" style="text-align:center;">Sin lecciones</td></tr>'}</tbody></table>`;
    printDocument('Lecciones_Aprendidas', content);
  };

  const exportVolunteerShiftsPdf = () => {
    let rows = '';
    volunteerShiftsList.forEach(v => { rows += `<tr><td><strong>${v.volunteerName}</strong></td><td>${v.shiftType}</td><td>${new Date(v.date).toLocaleDateString('es-VE')}</td><td>${v.startTime}</td><td>${v.endTime}</td><td>${v.location}</td><td>${v.role}</td><td><span class="badge-${v.status==='Completado'?'green':v.status==='En Curso'?'yellow':'red'}">${v.status}</span></td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - TURNOS DE VOLUNTARIOS</div><div class="subtitle">Manifiesto de turnos asignados</div></div><div class="stamp">TURNOS</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Turnos</span><span class="meta-val">${volunteerShiftsList.length}</span></div><div class="meta-item"><span class="meta-label">Completados</span><span class="meta-val" style="color:#16a34a;">${volunteerShiftsList.filter(v=>v.status==='Completado').length}</span></div></div>` +
      `<table><thead><tr><th>Voluntario</th><th>Turno</th><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Ubicacion</th><th>Rol</th><th>Estado</th></tr></thead><tbody>${rows||'<tr><td colspan="8" style="text-align:center;">Sin turnos</td></tr>'}</tbody></table>`;
    printDocument('Manifiesto_Turnos_Voluntarios', content);
  };

  const exportResourceMapPdf = () => {
    let rows = '';
    resourceLocations.forEach(r => { rows += `<tr><td><strong>${r.name}</strong></td><td>${r.type}</td><td>${r.state}</td><td>${r.capacity||'--'}</td><td>${r.currentStock||'--'}</td><td><span class="badge-${r.status==='Activo'?'green':r.status==='Parcial'?'yellow':'red'}">${r.status}</span></td><td>${r.contactPhone||'--'}</td><td>${r.operatingHours||'--'}</td></tr>`; });
    const content = `<div class="header"><div><div class="title">SISMOVZLA - RECURSOS POR UBICACION</div><div class="subtitle">Inventario de recursos por punto geografico</div></div><div class="stamp">RECURSOS</div></div>` +
      `<div class="meta-grid" style="grid-template-columns:1fr 1fr;"><div class="meta-item"><span class="meta-label">Total Recursos</span><span class="meta-val">${resourceLocations.length}</span></div><div class="meta-item"><span class="meta-label">Activos</span><span class="meta-val" style="color:#16a34a;">${resourceLocations.filter(r=>r.status==='Activo').length}</span></div></div>` +
      `<table><thead><tr><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Capacidad</th><th>Stock</th><th>Op</th><th>Contacto</th><th>Horario</th></tr></thead><tbody>${rows||'<tr><td colspan="8" style="text-align:center;">Sin recursos</td></tr>'}</tbody></table>`;
    printDocument('Inventario_Recursos', content);
  };


  return (
    <div className="space-y-6 animate-fade-in" id="reports-console-module">
      
      {/* Top Banner Hub */}
      <div className="bg-gradient-to-r from-violet-950/80 via-zinc-900 to-zinc-950 border border-violet-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Printer className="w-48 h-48 text-violet-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-violet-400 font-mono font-bold text-xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping"></span>
              CENTRO MAESTRO EJECUTIVO [MÓDULO 08]
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight mt-1">
              CONSOLA DE BITÁCORAS & EXPORTACIÓN PDF
            </h1>
            <p className="text-xs md:text-sm text-white/60 mt-1 max-w-xl">
              Auditoría táctica unificada. Consulte, filtre y exporte dictámenes oficiales COVENIN 1756, censos clínicos de hospitales y manifiestos de contingencia listos para firma A4.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => {
                if (activeTab === 'incidents_damage' || activeTab === 'covenin_structural') exportDamageListPdf();
                else if (activeTab === 'hospital_patients') exportHospitalPatientsPdf();
                else if (activeTab === 'blood_donors') exportBloodDonorsPdf();
                else if (activeTab === 'shelters_log') exportSheltersPdf();
              }}
              className="py-3 px-5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] border border-violet-400 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-violet-200" />
              📄 EXPORTAR BOLETÍN ACTIVO (PDF A4)
            </button>
          </div>
        </div>

        {/* Executive KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="bg-black/40 border border-white/5 rounded-xl p-3">
            <span className="text-[10px] font-mono text-white/50 block uppercase">Total Daños Censados</span>
            <span className="text-xl font-mono font-black text-white">{incidents.length}</span>
          </div>
          <div className="bg-black/40 border border-red-500/20 rounded-xl p-3">
            <span className="text-[10px] font-mono text-red-300 block uppercase">Daños Críticos (Grav 4-5)</span>
            <span className="text-xl font-mono font-black text-red-400">{incidents.filter(i => i.severity >= 4).length}</span>
          </div>
          <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-3">
            <span className="text-[10px] font-mono text-emerald-300 block uppercase">Dictámenes COVENIN 1756</span>
            <span className="text-xl font-mono font-black text-emerald-400">{incidents.filter(i => i.structuralEvaluation).length}</span>
          </div>
          <div className="bg-black/40 border border-amber-500/20 rounded-xl p-3">
            <span className="text-[10px] font-mono text-amber-300 block uppercase">Pacientes Hospitalarios</span>
            <span className="text-xl font-mono font-black text-amber-400">{patients.length || '•••'}</span>
          </div>
        </div>
      </div>


        {/* Original 6 tabs */}
        {(['incidents_damage', 'covenin_structural', 'hospital_patients', 'blood_donors', 'shelters_log', 'global_suite'] as ReportTypeTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-mono rounded-lg border transition-all ${
              activeTab === tab
                ? 'bg-white/10 border-white/20 text-white shadow-lg'
                : 'bg-zinc-900 border-white/5 text-white/50 hover:text-white/70 hover:border-white/10'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
        {/* Collapsible more tabs */}
        <button
          onClick={() => setShowMoreTabs(!showMoreTabs)}
          className="px-3 py-2 text-xs font-mono rounded-lg border transition-all bg-zinc-900 border-white/5 text-white/50 hover:text-white/70 hover:border-white/10 flex items-center gap-1"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${showMoreTabs ? 'rotate-90' : ''}`} />
          MÁS REPORTES
        </button>
        {showMoreTabs && (
          <div className="flex flex-wrap gap-1 mt-1 col-span-full">
            {([
              'eoc_dashboard', 'person_search', 'evacuation_routes', 'triage_manifest', 'cascade_events',
              'search_rescue', 'supply_logistics', 'water_sanitation', 'deceased', 'psychosocial',
              'comms_network', 'volunteers', 'interagency', 'aerial_ops', 'fuel_energy',
              'child_protection', 'temporary_housing', 'education', 'weather_alerts_report',
              'public_alerts_report', 'family_reunification', 'legal_aid', 'press_center',
              'training_sessions', 'lessons_learned', 'volunteer_shifts', 'resource_map', 'donations'
            ] as ReportTypeTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs font-mono rounded-lg border transition-all ${
                  activeTab === tab
                    ? 'bg-white/10 border-white/20 text-white shadow-lg'
                    : 'bg-zinc-900 border-white/5 text-white/50 hover:text-white/70 hover:border-white/10'
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        )}


      {/* Filter HUD */}
      <div className="bg-zinc-900/90 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por descripción, cédula o lugar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 font-mono"
          />
        </div>

        {(activeTab === 'incidents_damage' || activeTab === 'covenin_structural') && (
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
            >
              <option value="Todos">🗺️ Todos los Estados</option>
              <option value="Caracas">Caracas</option>
              <option value="La Guaira">La Guaira</option>
              <option value="Aragua">Aragua</option>
              <option value="Carabobo">Carabobo</option>
              <option value="Otros">Otros</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
            >
              <option value="Todos">🚨 Toda Gravedad</option>
              <option value="5">Gravedad 5 (Crítico)</option>
              <option value="4">Gravedad 4 (Severo)</option>
              <option value="3">Gravedad 3 (Moderado)</option>
              <option value="2">Gravedad 2 (Leve)</option>
              <option value="1">Gravedad 1 (Menor)</option>
            </select>

            <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 ml-auto shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white'}`}
                title="Vista Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white'}`}
                title="Vista Tabla"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- CONTENT AREA N° 1 & 2: INCIDENTS OR COVENIN STRUCTURAL --- */}
      {(activeTab === 'incidents_damage' || activeTab === 'covenin_structural') && (
        viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIncidents.map(inc => {
              const hasCovenin = inc.structuralEvaluation !== undefined;
              const coveninClass = inc.structuralEvaluation?.formulario_evaluacion_post_sismo.resumen_final.clasificacion || '';
              const isVerde = coveninClass.includes('Verde');
              const isAmarillo = coveninClass.includes('Amarillo');
              const isRojo = coveninClass.includes('Rojo');

              return (
                <div 
                  key={inc.id}
                  className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-violet-500/50 shadow-lg ${
                    inc.severity >= 4 ? 'border-red-500/30 bg-gradient-to-b from-red-950/20 to-zinc-900' : 'border-white/10'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
                        inc.severity >= 4 ? 'bg-red-500 text-white' : inc.severity === 3 ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-white'
                      }`}>
                        Grav. {inc.severity} • {inc.type}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">
                        INC-{inc.id.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-3">
                      {inc.description}
                    </h3>

                    <div className="text-xs text-white/60 font-mono flex items-start gap-1.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{inc.address || `${inc.state} (${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)})`}</span>
                    </div>

                    {/* Covenin Badge if available */}
                    {hasCovenin ? (
                      <div className={`p-3 rounded-xl border flex items-center justify-between ${
                        isVerde ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                        isAmarillo ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' :
                        'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 shrink-0" />
                          <div className="text-xs font-mono font-bold">
                            {coveninClass}
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono text-white/40 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400/50" />
                        Sin evaluación COVENIN 1756 adjunta
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-white/40">
                      Por: {inc.reportedBy}
                    </span>

                    <div className="flex items-center gap-2">
                      {hasCovenin && (
                        <button
                          onClick={() => exportStructuralEvaluationPdf(inc)}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                          title="Generar Dictamen Oficial Completo COVENIN 1756 en PDF (A4)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          📄 DICTAMEN PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredIncidents.length === 0 && (
              <div className="col-span-full text-center py-16 bg-zinc-900/50 rounded-2xl border border-white/5">
                <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-sm font-mono text-white/50">No hay reportes que coincidan con la búsqueda táctica.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/50 font-mono text-[11px] text-white/50 uppercase">
                    <th className="p-3.5 pl-5">Código / Fecha</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5">Gravedad</th>
                    <th className="p-3.5">Suceso & Dirección</th>
                    <th className="p-3.5">Inspección COVENIN</th>
                    <th className="p-3.5 pr-5 text-right">Acción PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-mono">
                  {filteredIncidents.map(inc => {
                    const hasCov = inc.structuralEvaluation !== undefined;
                    return (
                      <tr key={inc.id} className="hover:bg-white/5 transition-all">
                        <td className="p-3.5 pl-5 font-bold text-violet-400">INC-{inc.id.toUpperCase()}</td>
                        <td className="p-3.5 text-white/80">{inc.state}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inc.severity >= 4 ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            Grav. {inc.severity}
                          </span>
                        </td>
                        <td className="p-3.5 text-white max-w-md truncate">{inc.type}: {inc.description}</td>
                        <td className="p-3.5">
                          {hasCov ? <span className="text-emerald-400 font-bold">🟢 Emitido</span> : <span className="text-white/30">⏳ Pendiente</span>}
                        </td>
                        <td className="p-3.5 pr-5 text-right">
                          {hasCov && (
                            <button
                              onClick={() => exportStructuralEvaluationPdf(inc)}
                              className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3 h-3" /> DICTAMEN PDF
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* --- CONTENT AREA N° 3: HOSPITAL PATIENTS CENSO --- */}
      {activeTab === 'hospital_patients' && (
        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase">Boletín Clínico Asistencial Nacional</span>
            <span className="text-[11px] font-mono text-white/50">{filteredPatients.length} pacientes censados</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-black/50 text-[11px] text-white/50 uppercase">
                  <th className="p-3.5 pl-5">Paciente</th>
                  <th className="p-3.5">Cédula CIV</th>
                  <th className="p-3.5">Centro Hospitalario</th>
                  <th className="p-3.5">Estatus Médico</th>
                  <th className="p-3.5 pr-5">Auditoría Doble Chequeo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPatients.map((p, idx) => {
                  const isD = p.isDuplicateCheck;
                  return (
                    <tr key={p.id || idx} className={isD ? 'bg-red-950/30 hover:bg-red-950/50' : 'hover:bg-white/5'}>
                      <td className="p-3.5 pl-5 font-bold text-white">{p.fullName} <span className="text-white/40 text-[10px]">({p.age || '?'} años)</span></td>
                      <td className="p-3.5 text-amber-300 font-bold">{p.ci}</td>
                      <td className="p-3.5 text-white/90">🏥 {p.hospitalName}</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-white/10 text-white">{p.status}</span></td>
                      <td className="p-3.5 pr-5">
                        {isD ? (
                          <span className="px-2.5 py-1 rounded bg-red-600 text-white font-bold text-[10px] animate-pulse inline-flex items-center gap-1">
                            ⚠️ CONFLICTO CON: {p.duplicateOfHospital}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px]">🟢 Censado Único</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA N° 4: BLOOD DONORS MANIFIESTO --- */}
      {activeTab === 'blood_donors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonors.map((d, i) => (
            <div key={d.id || i} className="bg-zinc-900 border border-red-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                  <span className="text-2xl font-display font-black text-red-500">{d.bloodType}</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    {d.isQualified ? '✓ APTO OMS' : 'TRIAJE PEND.'}
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">{d.fullName}</h4>
                <p className="font-mono text-xs text-white/60 mt-1">📞 {d.contactPhone}</p>
                <p className="font-mono text-[11px] text-white/40 mt-1">📍 Entidad: {d.state}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono text-white/40 flex justify-between items-center">
                <span>Estatus: <strong className="text-white/80">{d.status}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CONTENT AREA N° 5: SHELTERS LOG --- */}
      {activeTab === 'shelters_log' && (
        <div className="space-y-4">
          {/* Export Buttons Bar */}
          <div className="bg-teal-950/40 border border-teal-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-400" />
                REPORTES DE OCUPANTES
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                {occupants.length} personas registradas · {occupants.filter(o => o.status !== 'Salida').length} albergados actualmente
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportShelterOccupantsDetailPdf}
                className="py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                📄 POR REFUGIO
              </button>
              <button
                onClick={exportAllSheltersOccupantsPdf}
                className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                📄 CONSOLIDADO
              </button>
              <button
                onClick={exportOccupantsByEntryDatePdf}
                className="py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                📅 POR FECHA
              </button>
              <button
                onClick={exportActiveOccupantsPdf}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                🟢 ALBERGADOS
              </button>
              <button
                onClick={exportActiveOccupantsByRefugioPdf}
                className="py-2.5 px-4 bg-green-700 hover:bg-green-600 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                🏨 ACTIVOS X REFUGIO
              </button>
              <button
                onClick={exportOccupancyByShelterPerDayPdf}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Calendar className="w-4 h-4" />
                📅 OCUPACIÓN DIARIA
              </button>
              <div className="flex flex-wrap items-center gap-3 bg-zinc-900/80 p-2.5 rounded-xl border border-white/10 ml-auto shadow-inner mt-2 sm:mt-0 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-xs font-mono uppercase tracking-wider font-bold">Desde</span>
                  <input 
                    type="date" 
                    className="bg-black border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                    style={{ colorScheme: 'dark' }}
                    value={dashboardStartDate}
                    onChange={(e) => setDashboardStartDate(e.target.value)}
                    title="Fecha desde"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-xs font-mono uppercase tracking-wider font-bold">Hasta</span>
                  <input 
                    type="date" 
                    className="bg-black border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                    style={{ colorScheme: 'dark' }}
                    value={dashboardEndDate}
                    onChange={(e) => setDashboardEndDate(e.target.value)}
                    title="Fecha hasta"
                  />
                </div>
                <button
                  onClick={exportGraphicalDashboardPdf}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all ml-1 border border-blue-400/30"
                >
                  <BarChart3 className="w-4 h-4" />
                  DASHBOARD
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShelters.map((s, idx) => {
              const occCount = occupants.filter(o => o.shelterId === s.id).length;
              const activeOcc = occupants.filter(o => o.shelterId === s.id && o.status !== 'Salida').length;
              return (
                <div key={s.id || idx} className="bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-teal-400 font-bold uppercase">{s.type}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      s.capacityStatus === 'Verde' ? 'bg-emerald-500 text-white' : s.capacityStatus === 'Amarillo' ? 'bg-amber-500 text-black' : 'bg-red-500 text-white'
                    }`}>
                      Cupo {s.capacityStatus}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{s.name}</h4>
                  <p className="text-xs text-white/60 font-mono mt-1">📍 {s.address}</p>
                  {occCount > 0 && (
                    <div className="mt-3 p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs font-mono">
                      <span className="text-teal-300">👥 {occCount} ocupantes</span>
                      {activeOcc < occCount && (
                        <span className="text-white/50 ml-2">({activeOcc} activos)</span>
                      )}
                    </div>
                  )}
                  {s.needs && (
                    <div className="mt-3 p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs font-mono text-amber-300/90">
                      <strong className="block text-[10px] text-white/40 uppercase mb-0.5">Requerimientos:</strong>
                      {s.needs}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- CONTENT AREA N° 6: SUITE GLOBAL GUBERNAMENTAL DE DAÑOS --- */}
      {activeTab === 'global_suite' && (
        <div className="space-y-6">
          <div className="bg-violet-950/40 border border-violet-500/30 rounded-2xl p-5 flex items-center gap-3">
            <SlidersHorizontal className="w-8 h-8 text-violet-400 shrink-0 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-mono">SUITE OFICIAL DE 6 REPORTES GLOBALES DE DAÑOS (PDF A4)</h3>
              <p className="text-xs text-white/60">Generación instantánea en memoria del navegador según normas COVENIN 1756, SITREP ONU (OCHA) y protocolos SAR de Protección Civil.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Report 1 */}
            <div className="bg-zinc-900 border border-white/10 hover:border-violet-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">GERENCIA REGIONAL</span>
                <h4 className="text-base font-bold text-white leading-snug">🌐 1. Densidad Regional por Entidades</h4>
                <p className="text-xs text-white/60 leading-relaxed">Cuadro estadístico comparativo por Estado con % de estructuras colapsadas e índice de cobertura técnica COVENIN.</p>
              </div>
              <button
                onClick={exportRegionalDensityPdf}
                className="mt-6 w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> EXPORTAR PDF REGIONAL
              </button>
            </div>

            {/* Report 2 */}
            <div className="bg-zinc-900 border border-red-500/30 hover:border-red-500 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono text-[10px] font-bold">HELITRANSPORTES SAR</span>
                <h4 className="text-base font-bold text-white leading-snug">🚁 2. Coordenadas GPS Rescate (SAR)</h4>
                <p className="text-xs text-white/60 leading-relaxed">Manifiesto militar satelital de objetivos críticos (Gravedad 4 y 5) en gran formato para pilotos de helicóptero y brigadas K9.</p>
              </div>
              <button
                onClick={exportSarTargetsPdf}
                className="mt-6 w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> EXPORTAR MANIFIESTO SAR
              </button>
            </div>

            {/* Report 3 */}
            <div className="bg-zinc-900 border border-amber-500/30 hover:border-amber-500 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">CATASTRO URBANO</span>
                <h4 className="text-base font-bold text-white leading-snug">🏛️ 3. Catálogo Nacional Etiquetado</h4>
                <p className="text-xs text-white/60 leading-relaxed">Registro oficial COVENIN dividido en perímetros prohibidos (Rojo), restringidos (Amarillo) y estructuras aptas (Verde).</p>
              </div>
              <button
                onClick={exportTaggedBuildingsPdf}
                className="mt-6 w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> EXPORTAR CATÁLOGO CIV
              </button>
            </div>

            {/* Report 4 */}
            <div className="bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">ANALÍTICA FUNVISIS</span>
                <h4 className="text-base font-bold text-white leading-snug">📋 4. Matriz de Patologías Sísmicas</h4>
                <p className="text-xs text-white/60 leading-relaxed">Estudio sismológico de frecuencia de fallas constructivas A-F detectadas en las edificaciones inspeccionadas en Venezuela.</p>
              </div>
              <button
                onClick={exportPathologyMatrixPdf}
                className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> EXPORTAR MATRIZ FALLAS
              </button>
            </div>

            {/* Report 5 */}
            <div className="bg-zinc-900 border border-cyan-500/30 hover:border-cyan-500 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">SERVICIOS PÚBLICOS</span>
                <h4 className="text-base font-bold text-white leading-snug">⚡ 5. Alerta Redes Vitales & Riesgos</h4>
                <p className="text-xs text-white/60 leading-relaxed">Hoja de despacho urgente para empresas públicas (CORPOELEC, PDVSA Gas, Hidrocapital y Vialidad) por daños secundarios.</p>
              </div>
              <button
                onClick={exportLifelineHazardsPdf}
                className="mt-6 w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> EXPORTAR REDES VITALES
              </button>
            </div>

            {/* Report 6 */}
            <div className="bg-zinc-900 border border-purple-500/30 hover:border-purple-500 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">ESTÁNDAR ONU / OCHA</span>
                <h4 className="text-base font-bold text-white leading-snug">🕒 6. Boletín Internacional SITREP</h4>
                <p className="text-xs text-white/60 leading-relaxed">Informe de Situación Humanitaria consolidado para organismos multilaterales, cancillerías y agencias de cooperación.</p>
              </div>
              <button
                onClick={exportSitrepPdf}
                className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" /> EXPORTAR SITREP ONU
              </button>
            </div>
          </div>
        </div>
      )}


      {/* --- CONTENT AREA: EOC DASHBOARD --- */}
      {activeTab === 'eoc_dashboard' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">RESUMEN EJECUTIVO EOC</h3>
              <p className="text-xs text-white/60">Tablero consolidado del Centro de Operaciones de Emergencia</p>
            </div>
            <button onClick={exportEocDashboardPdf} className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Indicador</th><th className="p-3 text-left">Cifra</th><th className="p-3 text-left">Modulo</th>
              </tr></thead>
              <tbody>
                <tr className="border-b border-white/5"><td className="p-3 text-white">Incidentes Totales</td><td className="p-3 text-white font-bold">{incidents.length}</td><td className="p-3 text-white/50">Mapeo Ciudadano</td></tr>
                <tr className="border-b border-white/5"><td className="p-3 text-white">Criticos (Grav 4-5)</td><td className="p-3 text-red-400 font-bold">{incidents.filter(i => i.severity >= 4).length}</td><td className="p-3 text-white/50">Respuesta USAR</td></tr>
                <tr className="border-b border-white/5"><td className="p-3 text-white">Dictamenes COVENIN</td><td className="p-3 text-emerald-400 font-bold">{incidents.filter(i => i.structuralEvaluation).length}</td><td className="p-3 text-white/50">CIV Emitidos</td></tr>
                <tr className="border-b border-white/5"><td className="p-3 text-white">Pacientes</td><td className="p-3 text-white font-bold">{patients.length}</td><td className="p-3 text-white/50">Red Sanitaria</td></tr>
                <tr className="border-b border-white/5"><td className="p-3 text-white">Donantes</td><td className="p-3 text-white font-bold">{donors.length}</td><td className="p-3 text-white/50">Banco Sangre</td></tr>
                <tr className="border-b border-white/5"><td className="p-3 text-white">Refugios</td><td className="p-3 text-white font-bold">{shelters.length}</td><td className="p-3 text-white/50">Logistica</td></tr>
                <tr className="border-b border-white/5"><td className="p-3 text-white">Eventos Cascada</td><td className="p-3 text-white font-bold">{cascadeEvents.length}</td><td className="p-3 text-white/50">Monitoreo</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: PERSON SEARCH --- */}
      {activeTab === 'person_search' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Search className="w-8 h-8 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">BUSQUEDA DE PERSONAS</h3>
              <p className="text-xs text-white/60">Directorio de personas buscadas, localizadas o hospitalizadas</p>
            </div>
            <button onClick={exportPersonSearchPdf} className="py-2.5 px-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Nombre</th><th className="p-3 text-left">CI</th><th className="p-3 text-left">Ubicacion</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Contacto</th><th className="p-3 text-left">Fecha</th>
              </tr></thead>
              <tbody>
                {personSearches.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-white/30">Sin registros</td></tr> :
                personSearches.map((p, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{p.name}</td><td className="p-3 text-white/70">{p.id}</td><td className="p-3 text-white/70">{p.last_known_loc}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status==='Localizado'?'bg-emerald-500 text-white':p.status==='Hospitalizado'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{p.status}</span></td>
                    <td className="p-3 text-white/70">{p.contact_info}</td><td className="p-3 text-white/50">{new Date(p.createdAt).toLocaleString('es-VE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: EVACUATION ROUTES --- */}
      {activeTab === 'evacuation_routes' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Route className="w-8 h-8 text-orange-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">RUTAS DE EVACUACION</h3>
              <p className="text-xs text-white/60">Estado de vias de evacuacion y rutas alternas</p>
            </div>
            <button onClick={exportEvacuationRoutesPdf} className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Ruta</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Segmento</th><th className="p-3 text-left">Via</th><th className="p-3 text-left">Obstruccion</th><th className="p-3 text-left">Alternativa</th><th className="p-3 text-left">ETA</th>
              </tr></thead>
              <tbody>
                {evacRoutes.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin rutas</td></tr> :
                evacRoutes.map((r, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{r.name}</td><td className="p-3 text-white/70">{r.state}</td><td className="p-3 text-white/70">{r.segment}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status==='Despejada'?'bg-emerald-500 text-white':r.status==='Parcial'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{r.status}</span></td>
                    <td className="p-3 text-white/70">{r.blockageType||'--'}</td><td className="p-3 text-white/70">{r.alternativeRoute||'--'}</td><td className="p-3 text-white/50">{r.estimatedClearTime||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: TRIAGE MANIFEST --- */}
      {activeTab === 'triage_manifest' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Activity className="w-8 h-8 text-red-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">MANIFIESTO DE TRIAJE</h3>
              <p className="text-xs text-white/60">Pacientes clasificados segun protocolo START / JumpSTART</p>
            </div>
            <button onClick={exportTriageManifestPdf} className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Codigo</th><th className="p-3 text-left">Paciente</th><th className="p-3 text-left">Edad</th><th className="p-3 text-left">Pediatrico</th><th className="p-3 text-left">Mecanismo</th><th className="p-3 text-left">Consciente</th><th className="p-3 text-left">Respira</th><th className="p-3 text-left">Destino</th>
              </tr></thead>
              <tbody>
                {triagePatients.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-white/30">Sin pacientes</td></tr> :
                triagePatients.map((t, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.triageCode==='Rojo'?'bg-red-500 text-white':t.triageCode==='Amarillo'?'bg-amber-500 text-black':t.triageCode==='Negro'?'bg-gray-800 text-white':'bg-emerald-500 text-white'}`}>{t.triageCode}</span></td>
                    <td className="p-3 text-white font-bold">{t.fullName||'Sin nombre'}</td><td className="p-3 text-white/70">{t.age||'--'}</td><td className="p-3 text-white/70">{t.isPediatric?'Si':'No'}</td>
                    <td className="p-3 text-white/70">{t.mechanism||'--'}</td><td className="p-3 text-white/70">{t.conscious?'Si':'No'}</td><td className="p-3 text-white/70">{t.breathing?'Si':'No'}</td><td className="p-3 text-white/70">{t.destination||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: CASCADE EVENTS --- */}
      {activeTab === 'cascade_events' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">EVENTOS EN CASCADA</h3>
              <p className="text-xs text-white/60">Registro cronologico de eventos secundarios</p>
            </div>
            <button onClick={exportCascadeEventsPdf} className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Magnitud</th><th className="p-3 text-left">Ubicacion</th><th className="p-3 text-left">Severidad</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Zonas</th><th className="p-3 text-left">Fecha</th>
              </tr></thead>
              <tbody>
                {cascadeEvents.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin eventos</td></tr> :
                cascadeEvents.map((e, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{e.eventType}</td><td className="p-3 text-white/70">{e.magnitude||'--'}</td><td className="p-3 text-white/70">{e.location||'--'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.severity==='Crítico'||e.severity==='Alto'?'bg-red-500 text-white':e.severity==='Medio'?'bg-amber-500 text-black':'bg-emerald-500 text-white'}`}>{e.severity}</span></td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.status==='Activo'?'bg-red-500 text-white':e.status==='Contenido'?'bg-amber-500 text-black':'bg-emerald-500 text-white'}`}>{e.status}</span></td>
                    <td className="p-3 text-white/70">{(e.affectedZones||[]).join(', ')||'--'}</td><td className="p-3 text-white/50">{new Date(e.createdAt).toLocaleString('es-VE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: SEARCH & RESCATE --- */}
      {activeTab === 'search_rescue' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">BUSQUEDA Y RESCATE</h3>
              <p className="text-xs text-white/60">Coordinacion USAR / SAR - Sectores y equipos</p>
            </div>
            <button onClick={exportSearchRescuePdf} className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10"><span className="text-xs font-mono text-white/50 font-bold uppercase">Sectores de Busqueda ({searchSectors.length})</span></div>
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Sector</th><th className="p-3 text-left">Grid</th><th className="p-3 text-left">Prioridad</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Estructuras</th><th className="p-3 text-left">Victimas</th><th className="p-3 text-left">Rescatadas</th>
              </tr></thead>
              <tbody>
                {searchSectors.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin sectores</td></tr> :
                searchSectors.map((s, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{s.sectorName||s.gridRef}</td><td className="p-3 text-white/70">{s.gridRef}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.priority==='Crítico'?'bg-red-500 text-white':s.priority==='Alto'?'bg-amber-500 text-black':'bg-emerald-500 text-white'}`}>{s.priority}</span></td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status==='Completado'||s.status==='Verificado'?'bg-emerald-500 text-white':s.status==='En Progreso'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{s.status}</span></td>
                    <td className="p-3 text-white/70">{s.structuresSearched||0}/{s.estimatedStructures||'?'}</td><td className="p-3 text-white/70">{s.victimsFound||0}</td><td className="p-3 text-white/70">{s.victimsRescued||0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10"><span className="text-xs font-mono text-white/50 font-bold uppercase">Equipos de Rescate ({rescueTeams.length})</span></div>
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Equipo</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Miembros</th><th className="p-3 text-left">Leader</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Sector</th>
              </tr></thead>
              <tbody>
                {rescueTeams.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-white/30">Sin equipos</td></tr> :
                rescueTeams.map((t, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{t.teamName}</td><td className="p-3 text-white/70">{t.type}</td><td className="p-3 text-white/70">{t.members}</td><td className="p-3 text-white/70">{t.teamLeader}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status==='Desplegado'?'bg-emerald-500 text-white':t.status==='Disponible'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{t.status}</span></td>
                    <td className="p-3 text-white/70">{t.currentSector||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: SUPPLY LOGISTICS --- */}
      {activeTab === 'supply_logistics' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">INVENTARIO DE SUMINISTROS</h3>
              <p className="text-xs text-white/60">Control de existencias y solicitudes</p>
            </div>
            <button onClick={exportSupplyInventoryPdf} className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Categoria</th><th className="p-3 text-left">Item</th><th className="p-3 text-left">Unidad</th><th className="p-3 text-left">Cantidad</th><th className="p-3 text-left">Minimo</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Vencimiento</th>
              </tr></thead>
              <tbody>
                {supplyInventory.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin inventario</td></tr> :
                supplyInventory.map((s, i) => {
                  const low = s.minThreshold && s.quantity < s.minThreshold;
                  return (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white/70">{s.category}</td><td className="p-3 text-white font-bold">{s.itemName}</td><td className="p-3 text-white/70">{s.unit}</td><td className="p-3 text-white/70">{s.quantity}</td><td className="p-3 text-white/70">{s.minThreshold||'--'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${low?'bg-red-500 text-white':'bg-emerald-500 text-white'}`}>{low?'BAJO':'OK'}</span></td>
                    <td className="p-3 text-white/50">{s.expirationDate ? new Date(s.expirationDate).toLocaleDateString('es-VE') : '--'}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: WATER & SANITATION --- */}
      {activeTab === 'water_sanitation' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Droplets className="w-8 h-8 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">AGUA Y SANEAMIENTO</h3>
              <p className="text-xs text-white/60">Monitoreo de puntos de agua y saneamiento</p>
            </div>
            <button onClick={exportWaterSanitationPdf} className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-white/10"><span className="text-xs font-mono text-white/50 font-bold uppercase">Puntos de Agua ({waterPoints.length})</span></div>
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Capacidad</th><th className="p-3 text-left">Cloro</th><th className="p-3 text-left">Poblacion</th>
              </tr></thead>
              <tbody>
                {waterPoints.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-white/30">Sin puntos</td></tr> :
                waterPoints.map((w, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{w.name}</td><td className="p-3 text-white/70">{w.type}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${w.waterStatus==='Potable'?'bg-emerald-500 text-white':w.waterStatus==='No Potable'?'bg-red-500 text-white':'bg-amber-500 text-black'}`}>{w.waterStatus}</span></td>
                    <td className="p-3 text-white/70">{w.capacityLiters||'--'} L</td><td className="p-3 text-white/70">{w.chlorineLevel||'--'} mg/L</td><td className="p-3 text-white/70">{w.populationServed||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: DECEASED --- */}
      {activeTab === 'deceased' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Skull className="w-8 h-8 text-gray-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">CENSO DE FALLECIDOS</h3>
              <p className="text-xs text-white/60">Registro de personas fallecidas</p>
            </div>
            <button onClick={exportDeceasedPdf} className="py-2.5 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Caso</th><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">CI</th><th className="p-3 text-left">Edad</th><th className="p-3 text-left">Genero</th><th className="p-3 text-left">Causa</th><th className="p-3 text-left">Identificado</th><th className="p-3 text-left">Morgue</th><th className="p-3 text-left">Estado</th>
              </tr></thead>
              <tbody>
                {deceasedPersons.length === 0 ? <tr><td colSpan={9} className="p-4 text-center text-white/30">Sin registros</td></tr> :
                deceasedPersons.map((d, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white/70">{d.caseId}</td><td className="p-3 text-white font-bold">{d.fullName||'Sin identificar'}</td><td className="p-3 text-white/70">{d.ci||'--'}</td><td className="p-3 text-white/70">{d.age||'--'}</td><td className="p-3 text-white/70">{d.gender||'--'}</td>
                    <td className="p-3 text-white/70">{d.causeOfDeath||'--'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.identified?'bg-emerald-500 text-white':'bg-red-500 text-white'}`}>{d.identified?'Si':'No'}</span></td>
                    <td className="p-3 text-white/70">{d.morgueLocation||'--'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.status==='Identificado'||d.status==='Entregado a Familiares'?'bg-emerald-500 text-white':'bg-amber-500 text-black'}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: PSICOSOCIAL --- */}
      {activeTab === 'psychosocial' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">APOYO PSICOSOCIAL</h3>
              <p className="text-xs text-white/60">Intervenciones de salud mental</p>
            </div>
            <button onClick={exportPsychosocialPdf} className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Paciente</th><th className="p-3 text-left">Edad</th><th className="p-3 text-left">Crisis</th><th className="p-3 text-left">Prioridad</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Sesiones</th><th className="p-3 text-left">Psicologo</th>
              </tr></thead>
              <tbody>
                {psychosocialCases.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin casos</td></tr> :
                psychosocialCases.map((p, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{p.patientName||'Anonimo'}</td><td className="p-3 text-white/70">{p.age||'--'}</td><td className="p-3 text-white/70">{p.crisisType}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.triagePriority==='Inmediato'?'bg-red-500 text-white':p.triagePriority==='Alto'?'bg-amber-500 text-black':'bg-emerald-500 text-white'}`}>{p.triagePriority}</span></td>
                    <td className="p-3 text-white/70">{p.status}</td><td className="p-3 text-white/70">{p.sessionCount||0}</td><td className="p-3 text-white/70">{p.assignedPsychologist||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: COMMS NETWORK --- */}
      {activeTab === 'comms_network' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Radio className="w-8 h-8 text-green-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">RED DE COMUNICACIONES</h3>
              <p className="text-xs text-white/60">Estaciones de radio y telecomunicaciones</p>
            </div>
            <button onClick={exportCommsNetworkPdf} className="py-2.5 px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Indicativo</th><th className="p-3 text-left">Frecuencia</th><th className="p-3 text-left">Modo</th><th className="p-3 text-left">Operador</th><th className="p-3 text-left">Ubicacion</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Bateria(h)</th>
              </tr></thead>
              <tbody>
                {emergencyComms.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-white/30">Sin estaciones</td></tr> :
                emergencyComms.map((c, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white/70">{c.type}</td><td className="p-3 text-white font-bold">{c.callsign||'--'}</td><td className="p-3 text-white/70">{c.frequency||'--'}</td><td className="p-3 text-white/70">{c.mode||'--'}</td>
                    <td className="p-3 text-white/70">{c.operatorName||'--'}</td><td className="p-3 text-white/70">{c.location||'--'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status==='Activo'?'bg-emerald-500 text-white':c.status==='Standby'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{c.status}</span></td>
                    <td className="p-3 text-white/70">{c.batteryHours||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: VOLUNTEERS --- */}
      {activeTab === 'volunteers' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Users className="w-8 h-8 text-teal-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">MANIFIESTO DE VOLUNTARIOS</h3>
              <p className="text-xs text-white/60">Directorio de voluntarios</p>
            </div>
            <button onClick={exportVolunteersPdf} className="py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Nombre</th><th className="p-3 text-left">CI</th><th className="p-3 text-left">Telefono</th><th className="p-3 text-left">Profesion</th><th className="p-3 text-left">Habilidades</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Ubicacion</th>
              </tr></thead>
              <tbody>
                {volunteerRegs.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin voluntarios</td></tr> :
                volunteerRegs.map((v, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{v.fullName}</td><td className="p-3 text-white/70">{v.ci}</td><td className="p-3 text-white/70">{v.phone}</td><td className="p-3 text-white/70">{v.profession||'--'}</td>
                    <td className="p-3 text-white/70">{(v.skills||[]).join(', ')}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status==='En Campo'?'bg-emerald-500 text-white':v.status==='Asignado'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{v.status}</span></td>
                    <td className="p-3 text-white/70">{v.location||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: DONATIONS --- */}
      {activeTab === 'donations' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">MANIFIESTO DE DONACIONES</h3>
              <p className="text-xs text-white/60">Registro de donaciones</p>
            </div>
            <button onClick={exportDonationsPdf} className="py-2.5 px-4 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Donacion</th><th className="p-3 text-left">Monto</th><th className="p-3 text-left">Descripcion</th><th className="p-3 text-left">Destino</th><th className="p-3 text-left">Estado</th>
              </tr></thead>
              <tbody>
                {donations.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin donaciones</td></tr> :
                donations.map((d, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white/70">{d.donorType}</td><td className="p-3 text-white font-bold">{d.donorName}</td><td className="p-3 text-white/70">{d.donationType}</td><td className="p-3 text-white/70">{d.amount ? '$'+d.amount : '--'}</td>
                    <td className="p-3 text-white/70">{d.itemDescription||'--'}</td><td className="p-3 text-white/70">{d.destination||'--'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.status==='Recibido'||d.status==='Distribuido'?'bg-emerald-500 text-white':d.status==='En Tránsito'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: INTERAGENCY --- */}
      {activeTab === 'interagency' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Building className="w-8 h-8 text-indigo-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">TAREAS INTERAGENCIALES</h3>
              <p className="text-xs text-white/60">Coordinacion entre agencias</p>
            </div>
            <button onClick={exportInteragencyPdf} className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Agencia</th><th className="p-3 text-left">Cluster</th><th className="p-3 text-left">Tarea</th><th className="p-3 text-left">Zona</th><th className="p-3 text-left">Prioridad</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Contacto</th>
              </tr></thead>
              <tbody>
                {interagencyTasks.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin tareas</td></tr> :
                interagencyTasks.map((t, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{t.agencyName}</td><td className="p-3 text-white/70">{t.cluster||'--'}</td><td className="p-3 text-white/70">{t.task}</td><td className="p-3 text-white/70">{t.assignedZone||'--'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.priority==='Crítica'?'bg-red-500 text-white':t.priority==='Alta'?'bg-amber-500 text-black':'bg-emerald-500 text-white'}`}>{t.priority}</span></td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status==='Completada'?'bg-emerald-500 text-white':t.status==='En Progreso'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{t.status}</span></td>
                    <td className="p-3 text-white/70">{t.contactPhone||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: AERIAL OPS --- */}
      {activeTab === 'aerial_ops' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Plane className="w-8 h-8 text-sky-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">OPERACIONES AEREAS</h3>
              <p className="text-xs text-white/60">Vuelos de drones, helicopteros y apoyo aereo</p>
            </div>
            <button onClick={exportAerialOpsPdf} className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Aeronave</th><th className="p-3 text-left">Matricula</th><th className="p-3 text-left">Mision</th><th className="p-3 text-left">Operador</th><th className="p-3 text-left">Zona</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Bateria</th><th className="p-3 text-left">No-Fly</th>
              </tr></thead>
              <tbody>
                {aerialOps.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-white/30">Sin operaciones</td></tr> :
                aerialOps.map((a, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white/70">{a.aircraftType}</td><td className="p-3 text-white/70">{a.registration||'--'}</td><td className="p-3 text-white/70">{a.missionType}</td><td className="p-3 text-white/70">{a.operatorName||'--'}</td>
                    <td className="p-3 text-white/70">{a.assignedZone||'--'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.status==='En Vuelo'?'bg-emerald-500 text-white':a.status==='Completado'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{a.status}</span></td>
                    <td className="p-3 text-white/70">{a.batteryFuelRemaining||'--'}%</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.noFlyZone?'bg-red-500 text-white':'bg-emerald-500 text-white'}`}>{a.noFlyZone?'Si':'No'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: FUEL & ENERGY --- */}
      {activeTab === 'fuel_energy' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Fuel className="w-8 h-8 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">COMBUSTIBLE Y ENERGIA</h3>
              <p className="text-xs text-white/60">Gasolineras, generadores y puntos de energia</p>
            </div>
            <button onClick={exportFuelEnergyPdf} className="py-2.5 px-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Combustible</th><th className="p-3 text-left">Capacidad</th><th className="p-3 text-left">Restante</th><th className="p-3 text-left">Op</th><th className="p-3 text-left">Cola</th>
              </tr></thead>
              <tbody>
                {fuelEnergyPoints.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-white/30">Sin puntos</td></tr> :
                fuelEnergyPoints.map((f, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{f.name}</td><td className="p-3 text-white/70">{f.type}</td><td className="p-3 text-white/70">{f.state}</td><td className="p-3 text-white/70">{f.fuelType||'--'}</td>
                    <td className="p-3 text-white/70">{f.capacityLiters||f.generatorPowerKW||'--'}</td><td className="p-3 text-white/70">{f.litersRemaining||'--'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.operationalStatus==='Operativo'?'bg-emerald-500 text-white':f.operationalStatus==='Parcial'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{f.operationalStatus}</span></td>
                    <td className="p-3 text-white/70">{f.queueStatus||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: CHILD PROTECTION --- */}
      {activeTab === 'child_protection' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Baby className="w-8 h-8 text-rose-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">MENORES VULNERABLES</h3>
              <p className="text-xs text-white/60">Menores no acompanados o en vulnerabilidad</p>
            </div>
            <button onClick={exportChildProtectionPdf} className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Edad</th><th className="p-3 text-left">Genero</th><th className="p-3 text-left">Padre/Madre</th><th className="p-3 text-left">Telefono</th><th className="p-3 text-left">Ubicacion</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Estatus</th>
              </tr></thead>
              <tbody>
                {childCases.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-white/30">Sin casos</td></tr> :
                childCases.map((c, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{c.childName}</td><td className="p-3 text-white/70">{c.childAge}</td><td className="p-3 text-white/70">{c.childGender}</td><td className="p-3 text-white/70">{c.parentName||'--'}</td>
                    <td className="p-3 text-white/70">{c.parentPhone||'--'}</td><td className="p-3 text-white/70">{c.location}</td><td className="p-3 text-white/70">{c.state}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status==='En Protección'?'bg-amber-500 text-black':c.status==='Resuelto'||c.status==='Con Familia'?'bg-emerald-500 text-white':'bg-red-500 text-white'}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: TEMPORARY HOUSING --- */}
      {activeTab === 'temporary_housing' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Home className="w-8 h-8 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">VIVIENDAS TEMPORALES</h3>
              <p className="text-xs text-white/60">Viviendas para personas desplazadas</p>
            </div>
            <button onClick={exportTemporaryHousingPdf} className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Capacidad</th><th className="p-3 text-left">Ocupacion</th><th className="p-3 text-left">Op</th><th className="p-3 text-left">Servicios</th>
              </tr></thead>
              <tbody>
                {tempHousing.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin viviendas</td></tr> :
                tempHousing.map((h, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{h.name}</td><td className="p-3 text-white/70">{h.type}</td><td className="p-3 text-white/70">{h.state}</td><td className="p-3 text-white/70">{h.capacity}</td>
                    <td className="p-3 text-white/70">{h.currentOccupancy}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.status==='Disponible'?'bg-emerald-500 text-white':h.status==='Lleno'?'bg-red-500 text-white':'bg-amber-500 text-black'}`}>{h.status}</span></td>
                    <td className="p-3 text-white/70">{(h.services||[]).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: EDUCATION --- */}
      {activeTab === 'education' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-blue-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">INFRAESTRUCTURA EDUCATIVA</h3>
              <p className="text-xs text-white/60">Estado de escuelas y centros educativos</p>
            </div>
            <button onClick={exportEducationPdf} className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Escuela</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Estudiantes</th><th className="p-3 text-left">Estruc.</th><th className="p-3 text-left">Dano</th><th className="p-3 text-left">Estatus</th>
              </tr></thead>
              <tbody>
                {schoolDamages.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin reportes</td></tr> :
                schoolDamages.map((s, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{s.schoolName}</td><td className="p-3 text-white/70">{s.schoolType}</td><td className="p-3 text-white/70">{s.state}</td><td className="p-3 text-white/70">{s.studentCount}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.structuralStatus==='Operativo'?'bg-emerald-500 text-white':s.structuralStatus==='Parcial'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{s.structuralStatus}</span></td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.damageLevel==='Ninguno'||s.damageLevel==='Leve'?'bg-emerald-500 text-white':s.damageLevel==='Moderado'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{s.damageLevel}</span></td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status==='Operativo'?'bg-emerald-500 text-white':'bg-amber-500 text-black'}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: WEATHER ALERTS --- */}
      {activeTab === 'weather_alerts_report' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Cloud className="w-8 h-8 text-sky-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">BOLETIN METEOROLOGICO</h3>
              <p className="text-xs text-white/60">Alertas meteorologicas y fenomenos naturales</p>
            </div>
            <button onClick={exportWeatherAlertsReportPdf} className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Titulo</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Severidad</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Fuente</th><th className="p-3 text-left">Activa</th><th className="p-3 text-left">Expira</th>
              </tr></thead>
              <tbody>
                {weatherAlertsList.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin alertas</td></tr> :
                weatherAlertsList.map((w, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{w.title}</td><td className="p-3 text-white/70">{w.type}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${w.severity==='Rojo'||w.severity==='Naranja'?'bg-red-500 text-white':w.severity==='Amarillo'?'bg-amber-500 text-black':'bg-emerald-500 text-white'}`}>{w.severity}</span></td>
                    <td className="p-3 text-white/70">{w.state}</td><td className="p-3 text-white/70">{w.source}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${w.active?'bg-red-500 text-white':'bg-emerald-500 text-white'}`}>{w.active?'Si':'No'}</span></td>
                    <td className="p-3 text-white/50">{w.expiresAt ? new Date(w.expiresAt).toLocaleString('es-VE') : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: PUBLIC ALERTS --- */}
      {activeTab === 'public_alerts_report' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Bell className="w-8 h-8 text-amber-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">ALERTAS PUBLICAS</h3>
              <p className="text-xs text-white/60">Boletin de alertas a la ciudadania</p>
            </div>
            <button onClick={exportPublicAlertsReportPdf} className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Titulo</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Prioridad</th><th className="p-3 text-left">Estados</th><th className="p-3 text-left">Activa</th><th className="p-3 text-left">Emisiones</th><th className="p-3 text-left">Enviado</th>
              </tr></thead>
              <tbody>
                {publicAlertsList.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin alertas</td></tr> :
                publicAlertsList.map((a, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{a.title}</td><td className="p-3 text-white/70">{a.type}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.priority==='Crítica'?'bg-red-500 text-white':a.priority==='Alta'?'bg-amber-500 text-black':'bg-emerald-500 text-white'}`}>{a.priority}</span></td>
                    <td className="p-3 text-white/70">{(a.states||[]).join(', ')}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.active?'bg-red-500 text-white':'bg-emerald-500 text-white'}`}>{a.active?'Si':'No'}</span></td>
                    <td className="p-3 text-white/70">{a.broadcastCount}</td><td className="p-3 text-white/70">{a.sentBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: FAMILY REUNIFICATION --- */}
      {activeTab === 'family_reunification' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Users className="w-8 h-8 text-violet-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">BUSQUEDAS FAMILIARES</h3>
              <p className="text-xs text-white/60">Manifiesto de busquedas de familiares</p>
            </div>
            <button onClick={exportFamilyReunificationPdf} className="py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Solicitante</th><th className="p-3 text-left">Desaparecido</th><th className="p-3 text-left">CI</th><th className="p-3 text-left">Edad</th><th className="p-3 text-left">Ultima Ubicacion</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Entidad</th>
              </tr></thead>
              <tbody>
                {familyRequestsList.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin busquedas</td></tr> :
                familyRequestsList.map((f, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{f.seekerName}</td><td className="p-3 text-white/70">{f.missingName}</td><td className="p-3 text-white/70">{f.missingCI||'--'}</td><td className="p-3 text-white/70">{f.missingAge||'--'}</td>
                    <td className="p-3 text-white/70">{f.lastSeenLocation}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.status==='Reunificado'?'bg-emerald-500 text-white':f.status==='En Contacto'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{f.status}</span></td>
                    <td className="p-3 text-white/70">{f.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: LEGAL AID --- */}
      {activeTab === 'legal_aid' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Scale className="w-8 h-8 text-orange-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">ASISTENCIA LEGAL</h3>
              <p className="text-xs text-white/60">Solicitudes de asistencia legal</p>
            </div>
            <button onClick={exportLegalAidPdf} className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Solicitante</th><th className="p-3 text-left">CI</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Descripcion</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Asignado</th><th className="p-3 text-left">Institucion</th>
              </tr></thead>
              <tbody>
                {legalAidList.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin solicitudes</td></tr> :
                legalAidList.map((l, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{l.petitionerName}</td><td className="p-3 text-white/70">{l.petitionerCI}</td><td className="p-3 text-white/70">{l.requestType}</td><td className="p-3 text-white/70">{l.description}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.status==='Resuelto'?'bg-emerald-500 text-white':l.status==='En Trámite'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{l.status}</span></td>
                    <td className="p-3 text-white/70">{l.assignedTo||'--'}</td><td className="p-3 text-white/70">{l.institution||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: PRESS CENTER --- */}
      {activeTab === 'press_center' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">CENTRO DE PRENSA</h3>
              <p className="text-xs text-white/60">Boletines y comunicados oficiales</p>
            </div>
            <button onClick={exportPressCenterPdf} className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Titulo</th><th className="p-3 text-left">Categoria</th><th className="p-3 text-left">Autor</th><th className="p-3 text-left">Fuente</th><th className="p-3 text-left">Publicado</th><th className="p-3 text-left">Vistas</th><th className="p-3 text-left">Fecha</th>
              </tr></thead>
              <tbody>
                {pressReleasesList.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin comunicados</td></tr> :
                pressReleasesList.map((pr, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{pr.title}</td><td className="p-3 text-white/70">{pr.category}</td><td className="p-3 text-white/70">{pr.author}</td><td className="p-3 text-white/70">{pr.source}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pr.published?'bg-emerald-500 text-white':'bg-red-500 text-white'}`}>{pr.published?'Si':'No'}</span></td>
                    <td className="p-3 text-white/70">{pr.viewCount}</td><td className="p-3 text-white/50">{new Date(pr.createdAt).toLocaleString('es-VE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: TRAINING --- */}
      {activeTab === 'training_sessions' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-teal-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">MANIFIESTO DE CAPACITACION</h3>
              <p className="text-xs text-white/60">Sesiones de capacitacion y simulacros</p>
            </div>
            <button onClick={exportTrainingPdf} className="py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Titulo</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Duracion</th><th className="p-3 text-left">Ubicacion</th><th className="p-3 text-left">Instructor</th><th className="p-3 text-left">Inscritos</th><th className="p-3 text-left">Estado</th>
              </tr></thead>
              <tbody>
                {trainingSessionsList.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-white/30">Sin sesiones</td></tr> :
                trainingSessionsList.map((t, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{t.title}</td><td className="p-3 text-white/70">{t.type}</td><td className="p-3 text-white/70">{new Date(t.date).toLocaleDateString('es-VE')}</td><td className="p-3 text-white/70">{t.duration}</td>
                    <td className="p-3 text-white/70">{t.location}</td><td className="p-3 text-white/70">{t.instructor}</td><td className="p-3 text-white/70">{t.enrolledCount}/{t.maxParticipants}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status==='Completado'?'bg-emerald-500 text-white':t.status==='En Curso'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: LESSONS LEARNED --- */}
      {activeTab === 'lessons_learned' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-yellow-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">LECCIONES APRENDIDAS</h3>
              <p className="text-xs text-white/60">Revision post-incidente y mejoras</p>
            </div>
            <button onClick={exportLessonsLearnedPdf} className="py-2.5 px-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Titulo</th><th className="p-3 text-left">Modulo</th><th className="p-3 text-left">Fecha Incidente</th><th className="p-3 text-left">Fecha Revision</th><th className="p-3 text-left">Prioridad</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Asignado</th>
              </tr></thead>
              <tbody>
                {aarList.length === 0 ? <tr><td colSpan={7} className="p-4 text-center text-white/30">Sin lecciones</td></tr> :
                aarList.map((a, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{a.title}</td><td className="p-3 text-white/70">{a.module}</td><td className="p-3 text-white/70">{new Date(a.incidentDate).toLocaleDateString('es-VE')}</td><td className="p-3 text-white/70">{new Date(a.reviewDate).toLocaleDateString('es-VE')}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.priority==='Alta'?'bg-red-500 text-white':a.priority==='Media'?'bg-amber-500 text-black':'bg-emerald-500 text-white'}`}>{a.priority}</span></td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.status==='Completado'?'bg-emerald-500 text-white':a.status==='En Implementación'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{a.status}</span></td>
                    <td className="p-3 text-white/70">{a.assignedTo||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: VOLUNTEER SHIFTS --- */}
      {activeTab === 'volunteer_shifts' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Clock className="w-8 h-8 text-indigo-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">TURNOS DE VOLUNTARIOS</h3>
              <p className="text-xs text-white/60">Manifiesto de turnos asignados</p>
            </div>
            <button onClick={exportVolunteerShiftsPdf} className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Voluntario</th><th className="p-3 text-left">Turno</th><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Inicio</th><th className="p-3 text-left">Fin</th><th className="p-3 text-left">Ubicacion</th><th className="p-3 text-left">Rol</th><th className="p-3 text-left">Estado</th>
              </tr></thead>
              <tbody>
                {volunteerShiftsList.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-white/30">Sin turnos</td></tr> :
                volunteerShiftsList.map((v, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{v.volunteerName}</td><td className="p-3 text-white/70">{v.shiftType}</td><td className="p-3 text-white/70">{new Date(v.date).toLocaleDateString('es-VE')}</td><td className="p-3 text-white/70">{v.startTime}</td>
                    <td className="p-3 text-white/70">{v.endTime}</td><td className="p-3 text-white/70">{v.location}</td><td className="p-3 text-white/70">{v.role}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status==='Completado'?'bg-emerald-500 text-white':v.status==='En Curso'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{v.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA: RESOURCE MAP --- */}
      {activeTab === 'resource_map' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center gap-3">
            <Navigation className="w-8 h-8 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase font-mono">RECURSOS POR UBICACION</h3>
              <p className="text-xs text-white/60">Inventario de recursos por punto geografico</p>
            </div>
            <button onClick={exportResourceMapPdf} className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer transition-all">
              <Printer className="w-4 h-4" /> EXPORTAR PDF
            </button>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-white/10 text-white/50">
                <th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Capacidad</th><th className="p-3 text-left">Stock</th><th className="p-3 text-left">Op</th><th className="p-3 text-left">Contacto</th><th className="p-3 text-left">Horario</th>
              </tr></thead>
              <tbody>
                {resourceLocations.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-white/30">Sin recursos</td></tr> :
                resourceLocations.map((r, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-3 text-white font-bold">{r.name}</td><td className="p-3 text-white/70">{r.type}</td><td className="p-3 text-white/70">{r.state}</td><td className="p-3 text-white/70">{r.capacity||'--'}</td>
                    <td className="p-3 text-white/70">{r.currentStock||'--'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.status==='Activo'?'bg-emerald-500 text-white':r.status==='Parcial'?'bg-amber-500 text-black':'bg-red-500 text-white'}`}>{r.status}</span></td>
                    <td className="p-3 text-white/70">{r.contactPhone||'--'}</td><td className="p-3 text-white/70">{r.operatingHours||'--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


    </div>
  );
};
