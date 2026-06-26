import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Incident, PersonSearch } from '../types';
import { 
  Building2, 
  Send, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Download, 
  Copy, 
  Check, 
  ShieldAlert, 
  Activity, 
  Eye, 
  Truck, 
  Printer, 
  RotateCcw,
  UserCheck,
  FileSpreadsheet,
  Filter,
  ArrowUpDown,
  Pencil,
  X,
  Save
} from 'lucide-react';
import { ImageLightbox } from './ImageLightbox';

import { VolunteerRole } from './VolunteerVerification';

interface AdminPanelProps {
  incidents: Incident[];
  isVerified: boolean;
  role?: VolunteerRole;
}

interface DispatchRecord {
  id: string;
  incidentId: string;
  incidentType: string;
  incidentState: string;
  incidentDesc: string;
  agency: string;
  priority: 'Alta' | 'Media' | 'Baja';
  resources: string;
  notes: string;
  dispatchedAt: number;
  status: 'Despachado' | 'En Ruta' | 'Atendiendo' | 'Completado';
}

const COMPETENT_AGENCIES = [
  { id: 'ven_911', name: 'VEN 911 (Emergencias Nacionales)', desc: 'Atención primaria y ambulancias' },
  { id: 'bomberos_ccs', name: 'Bomberos de Caracas', desc: 'Rescate urbano e incendios en Distrito Capital' },
  { id: 'pc_nacional', name: 'Protección Civil Nacional', desc: 'Coordinación de desastres y refugios' },
  { id: 'cruz_roja_ve', name: 'Cruz Roja Venezolana', desc: 'Atención médica humanitaria y heridos' },
  { id: 'bomberos_la_guaira', name: 'Bomberos de La Guaira', desc: 'Rescate en zonas costeras y laderas' },
  { id: 'bomberos_aragua', name: 'Bomberos de Aragua', desc: 'Emergencias y derrumbes en el estado Aragua' },
  { id: 'pc_carabobo', name: 'Protección Civil Carabobo', desc: 'Coordinación y logística en Valencia/Puerto Cabello' }
];

export default function AdminPanel({ incidents, isVerified, role = 'admin' }: AdminPanelProps) {
  const [lightbox, setLightbox] = useState<{ urls: string[]; currentIndex: number } | null>(null);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [people, setPeople] = useState<PersonSearch[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'console' | 'reports' | 'logs'>('console');
  
  // Selection States
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [targetAgency, setTargetAgency] = useState('');
  const [dispatchPriority, setDispatchPriority] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [dispatchResources, setDispatchResources] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  
  // Reporting States
  const [reportType, setReportType] = useState<'damage' | 'coordination' | 'missing' | 'status_list'>('damage');
  const [reportNotes, setReportNotes] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Edit Incident States
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [editForm, setEditForm] = useState<{
    type: Incident['type'];
    state: string;
    address: string;
    severity: number;
    description: string;
    reporterContact: string;
  }>({
    type: 'Rescate',
    state: '',
    address: '',
    severity: 3,
    description: '',
    reporterContact: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Filtering and Sorting States
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterResolution, setFilterResolution] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('severityDesc');

  // Filtered and Sorted Incidents List
  const filteredAndSortedIncidents = React.useMemo(() => {
    let result = [...incidents];

    // Filter by severity
    if (filterSeverity !== 'all') {
      const sevNum = parseInt(filterSeverity, 10);
      result = result.filter(inc => inc.severity === sevNum);
    }

    // Filter by resolution status
    if (filterResolution !== 'all') {
      if (filterResolution === 'resolved') {
        result = result.filter(inc => inc.resolved);
      } else if (filterResolution === 'active') {
        result = result.filter(inc => !inc.resolved);
      } else if (filterResolution === 'pending') {
        result = result.filter(inc => !inc.verified && !inc.resolved);
      } else if (filterResolution === 'verified') {
        result = result.filter(inc => inc.verified && !inc.resolved);
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return b.createdAt - a.createdAt;
      } else if (sortBy === 'severityDesc') {
        if (b.severity !== a.severity) {
          return b.severity - a.severity;
        }
        return b.createdAt - a.createdAt; // tie-breaker
      } else if (sortBy === 'severityAsc') {
        if (a.severity !== b.severity) {
          return a.severity - b.severity;
        }
        return b.createdAt - a.createdAt; // tie-breaker
      }
      return 0;
    });

    return result;
  }, [incidents, filterSeverity, filterResolution, sortBy]);

  // Firestore subscription for dispatches and people search
  useEffect(() => {
    // Dispatches query
    const dq = query(
      collection(db, 'dispatches'),
      orderBy('dispatchedAt', 'desc'),
      limit(100)
    );
    const unsubscribeDispatches = onSnapshot(dq, (snapshot) => {
      const list: DispatchRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as DispatchRecord);
      });
      setDispatches(list);
    }, (error) => {
      console.warn("Dispatches subscription failed:", error);
    });

    // People search query
    const pq = query(
      collection(db, 'people_search'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const unsubscribePeople = onSnapshot(pq, (snapshot) => {
      const list: PersonSearch[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PersonSearch);
      });
      setPeople(list);
    }, (error) => {
      console.warn("People subscription failed:", error);
    });

    return () => {
      unsubscribeDispatches();
      unsubscribePeople();
    };
  }, []);

  // Set default selected incident if list has items and none is selected
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncident) {
      setSelectedIncident(incidents.find(i => !i.resolved) || incidents[0]);
    }
  }, [incidents, selectedIncident]);

  // Administration update handlers
  const toggleIncidentVerification = async (incidentId: string, currentVal: boolean) => {
    if (!isVerified) return;
    try {
      await updateDoc(doc(db, 'incidents', incidentId), {
        verified: !currentVal
      });
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(prev => prev ? { ...prev, verified: !currentVal } : null);
      }
    } catch (e) {
      console.error("Error updating incident verification:", e);
    }
  };

  const toggleIncidentResolution = async (incidentId: string, currentVal: boolean) => {
    if (!isVerified) return;
    try {
      await updateDoc(doc(db, 'incidents', incidentId), {
        resolved: !currentVal
      });
      if (selectedIncident?.id === incidentId) {
        setSelectedIncident(prev => prev ? { ...prev, resolved: !currentVal } : null);
      }
    } catch (e) {
      console.error("Error updating incident resolution:", e);
    }
  };

  const deleteIncidentReport = async (incidentId: string) => {
    if (!isVerified) return;
    if (window.confirm("¿Está seguro de eliminar este reporte permanentemente de la red táctica?")) {
      try {
        await deleteDoc(doc(db, 'incidents', incidentId));
        setSelectedIncident(null);
      } catch (e) {
        console.error("Error deleting incident:", e);
      }
    }
  };

  // Submit dispatch coordination
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !targetAgency) return;

    setIsSubmittingDispatch(true);
    const agencyObj = COMPETENT_AGENCIES.find(a => a.id === targetAgency);
    
    const newDispatch: Omit<DispatchRecord, 'id'> = {
      incidentId: selectedIncident.id,
      incidentType: selectedIncident.type,
      incidentState: selectedIncident.state,
      incidentDesc: selectedIncident.description,
      agency: agencyObj?.name || targetAgency,
      priority: dispatchPriority,
      resources: dispatchResources.trim() || 'No provistos',
      notes: dispatchNotes.trim() || 'Sin observaciones de ruta',
      dispatchedAt: Date.now(),
      status: 'Despachado'
    };

    try {
      await addDoc(collection(db, 'dispatches'), newDispatch);
      
      // Auto-verify the incident on dispatch if not already verified
      if (!selectedIncident.verified) {
        await updateDoc(doc(db, 'incidents', selectedIncident.id), {
          verified: true
        });
      }

      setTargetAgency('');
      setDispatchResources('');
      setDispatchNotes('');
      setActiveSubTab('logs');
    } catch (error) {
      console.error("Error creating dispatch record:", error);
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  // Update dispatch status
  const handleUpdateDispatchStatus = async (dispatchId: string, newStatus: DispatchRecord['status']) => {
    if (!isVerified) return;
    try {
      await updateDoc(doc(db, 'dispatches', dispatchId), {
        status: newStatus
      });
    } catch (e) {
      console.error("Error updating dispatch status:", e);
    }
  };

  // Edit incident logic
  const handleOpenEdit = (inc: Incident) => {
    setEditingIncident(inc);
    setEditForm({
      type: inc.type,
      state: inc.state,
      address: inc.address || '',
      severity: inc.severity,
      description: inc.description,
      reporterContact: inc.reporterContact || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident) return;
    setIsSavingEdit(true);
    try {
      const incRef = doc(db, 'incidents', editingIncident.id);
      await updateDoc(incRef, {
        type: editForm.type,
        state: editForm.state,
        address: editForm.address.trim() || null,
        severity: Number(editForm.severity),
        description: editForm.description,
        reporterContact: editForm.reporterContact
      });
      if (selectedIncident?.id === editingIncident.id) {
        setSelectedIncident({
          ...selectedIncident,
          type: editForm.type,
          state: editForm.state,
          address: editForm.address.trim() || undefined,
          severity: Number(editForm.severity),
          description: editForm.description,
          reporterContact: editForm.reporterContact
        });
      }
      setEditingIncident(null);
    } catch (err) {
      console.error('Error updating incident:', err);
      alert('Hubo un error al actualizar el incidente.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Generate plain-text report content
  const generateReportText = () => {
    const timestamp = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' });
    let text = `=================================================================\n`;
    text += `       SISMOVZLA - INFORME TÁCTICO DE CRISIS Y COORDINACIÓN\n`;
    text += `       EMITIDO: ${timestamp} VET | EJE CENTRAL SÍSMICO\n`;
    text += `=================================================================\n\n`;

    if (reportType === 'damage') {
      const active = incidents.filter(i => !i.resolved);
      const res = incidents.filter(i => i.resolved);
      const ver = incidents.filter(i => i.verified && !i.resolved);
      
      text += `[1] RESUMEN DE INCIDENTES ACTIVOS Y DAÑOS REGISTRADOS:\n`;
      text += `-----------------------------------------------------------------\n`;
      text += `  * Total de Reportes Activos: ${active.length}\n`;
      text += `  * Reportes Verificados por Coordinación: ${ver.length}\n`;
      text += `  * Reportes Solventados/Resueltos: ${res.length}\n\n`;

      text += `[2] DISTRIBUCIÓN POR ENTIDAD GEOGRÁFICA (ACTIVOS):\n`;
      text += `  - Caracas (Distrito Capital): ${active.filter(i => i.state === 'Caracas').length}\n`;
      text += `  - La Guaira (Vargas): ${active.filter(i => i.state === 'La Guaira').length}\n`;
      text += `  - Aragua (Maracay): ${active.filter(i => i.state === 'Aragua').length}\n`;
      text += `  - Carabobo (Valencia): ${active.filter(i => i.state === 'Carabobo').length}\n`;
      text += `  - Otros Sectores: ${active.filter(i => i.state === 'Otros').length}\n\n`;

      text += `[3] DESGLOSE POR TIPOLOGÍA DE EMERGENCIA (ACTIVOS):\n`;
      text += `  - Derrumbes / Estructuras Colapsadas: ${active.filter(i => i.type === 'Derrumbe').length}\n`;
      text += `  - Fugas de Gas / Amenaza Incendio: ${active.filter(i => i.type === 'Fuga de Gas').length}\n`;
      text += `  - Rescate / Atrapados: ${active.filter(i => i.type === 'Rescate').length}\n`;
      text += `  - Solicitudes Médicas de Emergencia: ${active.filter(i => i.type === 'Médico').length}\n`;
      text += `  - Otras eventualidades: ${active.filter(i => i.type === 'Otros').length}\n\n`;

      text += `[4] DETALLE DE INCIDENTES CRÍTICOS (SEVERIDAD >= 4):\n`;
      const critical = active.filter(i => i.severity >= 4);
      if (critical.length === 0) {
        text += `  No se registran incidentes activos de severidad crítica actual.\n`;
      } else {
        critical.forEach((inc, idx) => {
          text += `  ${idx + 1}. [SEV: ${inc.severity}] | ESTADO: ${inc.state.toUpperCase()} | TIPO: ${inc.type.toUpperCase()}\n`;
          text += `     COORDENADAS: Lat ${inc.latitude.toFixed(5)}, Lon ${inc.longitude.toFixed(5)}\n`;
          text += `     DESCRIPCIÓN: ${inc.description}\n`;
          text += `     REPORTE POR: ${inc.reportedBy} | VERIFICADO: ${inc.verified ? 'SI' : 'PENDIENTE'}\n`;
          text += `     ------------------------------------------------------------\n`;
        });
      }
    } else if (reportType === 'coordination') {
      text += `[1] MINUTA GENERAL DE DESPACHO Y COOPERACIÓN INTERINSTITUCIONAL:\n`;
      text += `-----------------------------------------------------------------\n`;
      text += `  * Despachos Activos en Tránsito: ${dispatches.filter(d => d.status !== 'Completated' as any).length}\n`;
      text += `  * Misiones de Rescate Completadas: ${dispatches.filter(d => d.status === 'Completated' as any || d.status === 'Completado').length}\n\n`;

      text += `[2] LOG DETALLADO DE DESPLIEGUE POR CUERPO COMPETENTE:\n`;
      if (dispatches.length === 0) {
        text += `  No se han registrado despachos activos en las últimas horas.\n`;
      } else {
        dispatches.forEach((disp, idx) => {
          const dateStr = new Date(disp.dispatchedAt).toLocaleTimeString('es-VE');
          text += `  ${idx + 1}. [HIL: ${dateStr}] | UNIDAD: ${disp.agency.toUpperCase()}\n`;
          text += `     ESTATUS DE COORDINACIÓN: [${disp.status.toUpperCase()}] | PRIORIDAD: [${disp.priority.toUpperCase()}]\n`;
          text += `     INCIDENTE ASOCIADO: ${disp.incidentType.toUpperCase()} (${disp.incidentState})\n`;
          text += `     RECURSOS SOLICITADOS: ${disp.resources}\n`;
          text += `     MINUTA DE LOGÍSTICA: ${disp.notes}\n`;
          text += `     ------------------------------------------------------------\n`;
        });
      }
    } else if (reportType === 'missing') {
      const buscados = people.filter(p => p.status === 'Buscado');
      const localizados = people.filter(p => p.status === 'Localizado');
      const hosp = people.filter(p => p.status === 'Hospitalizado');

      text += `[1] CENSO OFICIAL DE BÚSQUEDA DE PERSONAS SÍSMO (VZLA):\n`;
      text += `-----------------------------------------------------------------\n`;
      text += `  * Ciudadanos Reportados como BUSCADOS: ${buscados.length}\n`;
      text += `  * Ciudadanos LOCALIZADOS con vida: ${localizados.length}\n`;
      text += `  * Ciudadanos HOSPITALIZADOS en centros médicos: ${hosp.length}\n\n`;

      text += `[2] LISTADO COMPILADO DE SOLICITUDES DE LOCALIZACIÓN:\n`;
      if (people.length === 0) {
        text += `  No se registran solicitudes de personas desaparecidas en la base de datos.\n`;
      } else {
        people.forEach((p, idx) => {
          text += `  ${idx + 1}. NOMBRE: ${p.name.toUpperCase()} | ESTATUS: ${p.status.toUpperCase()}\n`;
          text += `     ÚLTIMA UBICACIÓN: ${p.last_known_loc}\n`;
          text += `     REGISTRO: ${new Date(p.createdAt).toLocaleDateString('es-VE')} | NOTAS: ${p.notes || 'Sin observaciones adicionales'}\n`;
          if (isVerified) {
            text += `     CONTACTO FAMILIAR (PROTEGIDO): ${p.contact_info}\n`;
          }
          text += `     ------------------------------------------------------------\n`;
        });
      }
    } else if (reportType === 'status_list') {
      const pendientes = incidents.filter(i => !i.verified && !i.resolved);
      const verificados = incidents.filter(i => i.verified && !i.resolved);
      const resueltos = incidents.filter(i => i.resolved);

      text += `[1] AUDITORÍA MAESTRA DE ESTATUS DE REPORTES E INCIDENTES:\n`;
      text += `-----------------------------------------------------------------\n`;
      text += `  * Total General Registrado en Base de Datos: ${incidents.length}\n`;
      text += `  * [ESTATUS: PENDIENTE] Sin Verificar: ${pendientes.length} (🔴 Requiere Inspección)\n`;
      text += `  * [ESTATUS: VERIFICADO] Oficializado en Curso: ${verificados.length} (🟡 En Despliegue)\n`;
      text += `  * [ESTATUS: SOLVENTADO] Resuelto / Terminado: ${resueltos.length} (🟢 Concluido)\n\n`;

      text += `[2] DETALLE COMPLETO DE PARAMETRIZACIÓN POR EVENTO:\n`;
      if (incidents.length === 0) {
        text += `  No existen reportes registrados actualmente.\n`;
      } else {
        incidents.forEach((inc, idx) => {
          const estStr = inc.resolved ? 'SOLVENTADO 🟢' : inc.verified ? 'VERIFICADO EN CURSO 🟡' : 'PENDIENTE POR VERIFICAR 🔴';
          text += `  ${idx + 1}. [ESTATUS: ${estStr}] | SEVERIDAD: Nivel ${inc.severity}\n`;
          text += `     ZONA: ${inc.state.toUpperCase()} | TIPOLOGÍA: ${inc.type.toUpperCase()}\n`;
          text += `     COORDENADAS: Lat ${inc.latitude.toFixed(5)}, Lon ${inc.longitude.toFixed(5)}\n`;
          if (inc.address) text += `     DIRECCIÓN MANUAL: ${inc.address}\n`;
          text += `     REPORTE: ${inc.description}\n`;
          text += `     FECHA/HORA: ${new Date(inc.createdAt).toLocaleString('es-VE')} | EMISOR: ${inc.reportedBy}\n`;
          text += `     ------------------------------------------------------------\n`;
        });
      }
    }

    if (reportNotes.trim()) {
      text += `\n[OBSERVACIONES GENERALES DEL PUESTO DE COORDINACIÓN CIVIL]:\n`;
      text += `-----------------------------------------------------------------\n`;
      text += `${reportNotes}\n`;
    }

    text += `\n=================================================================\n`;
    text += `      FIN DEL COMUNICADO OFICIAL TÁCTICO - CANALIZACIÓN CIVIL\n`;
    text += `=================================================================\n`;

    return text;
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error("Error copying report:", err);
    });
  };

  // Download raw TXT file
  const handleDownloadTxt = () => {
    const text = generateReportText();
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `sismovzla_informe_${reportType}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Trigger print dialog
  const handlePrint = () => {
    window.print();
  };

  // Export the active report type data to CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `sismovzla_reporte_${Date.now()}.csv`;

    if (reportType === 'damage') {
      filename = `sismovzla_incidentes_${Date.now()}.csv`;
      headers = [
        'ID',
        'Tipo de Incidente',
        'Severidad',
        'Estado (Geografico)',
        'Latitud',
        'Longitud',
        'Reportado Por',
        'Contacto Reportante',
        'Fecha de Registro',
        'Verificado',
        'Resuelto',
        'Descripcion'
      ];
      rows = incidents.map(inc => [
        inc.id,
        inc.type,
        inc.severity.toString(),
        inc.state,
        inc.latitude.toFixed(6),
        inc.longitude.toFixed(6),
        inc.reportedBy,
        inc.reporterContact || '',
        new Date(inc.createdAt).toLocaleString('es-VE'),
        inc.verified ? 'SI' : 'NO',
        inc.resolved ? 'SI' : 'NO',
        `"${inc.description.replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ]);
    } else if (reportType === 'coordination') {
      filename = `sismovzla_despachos_${Date.now()}.csv`;
      headers = [
        'ID Despacho',
        'ID Incidente',
        'Tipo Incidente',
        'Estado Incidente',
        'Cuerpo Respuesta',
        'Prioridad',
        'Recursos Despachados',
        'Fecha Despacho',
        'Estatus',
        'Notas'
      ];
      rows = dispatches.map(disp => [
        disp.id,
        disp.incidentId,
        disp.incidentType,
        disp.incidentState,
        disp.agency,
        disp.priority,
        `"${(disp.resources || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        new Date(disp.dispatchedAt).toLocaleString('es-VE'),
        disp.status,
        `"${(disp.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ]);
    } else if (reportType === 'missing') {
      filename = `sismovzla_personas_desaparecidas_${Date.now()}.csv`;
      headers = [
        'ID Persona',
        'Nombre Completo',
        'Estatus',
        'Ultima Ubicacion Conocida',
        'Registrado Por',
        'Fecha de Registro',
        'Contacto Familiar',
        'Notas'
      ];
      rows = people.map(p => [
        p.id,
        p.name,
        p.status,
        `"${p.last_known_loc.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        p.registeredBy,
        new Date(p.createdAt).toLocaleString('es-VE'),
        `"${(isVerified ? p.contact_info : '[PROTEGIDO]').replace(/"/g, '""')}"`,
        `"${(p.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ]);
    }

    const csvContent = "\ufeff" + [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open a clean print window with a formatted report and trigger print (Save as PDF)
  const handleExportPDF = () => {
    const reportText = generateReportText();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor, permita las ventanas emergentes en su navegador para poder exportar a PDF.");
      return;
    }

    const title = `SISMOVZLA - Informe de Emergencia [${reportType.toUpperCase()}]`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap');
            body {
              font-family: 'Fira Code', 'Courier New', Courier, monospace;
              padding: 40px;
              color: #111;
              background-color: #fff;
              line-height: 1.5;
              font-size: 13px;
            }
            .no-print {
              background-color: #f5f5f5;
              border: 1px solid #ddd;
              padding: 15px 25px;
              margin-bottom: 30px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .header-btn {
              background-color: #D32F2F;
              color: white;
              border: none;
              padding: 10px 20px;
              font-weight: bold;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              font-size: 13px;
            }
            .header-btn:hover {
              background-color: #b71c1c;
            }
            pre {
              white-space: pre-wrap;
              word-break: break-all;
              background: #fafafa;
              padding: 20px;
              border: 1px solid #eee;
              border-radius: 8px;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
              pre {
                border: none;
                background: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <div>
              <strong style="color: #D32F2F; font-size: 16px;">SISMOVZLA - Generador de PDF</strong>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Utilice la opción "Guardar como PDF" en la ventana de impresión del navegador.</div>
            </div>
            <button class="header-btn" onclick="window.print()">IMPRIMIR / EXPORTAR A PDF</button>
          </div>
          <pre>${reportText}</pre>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Metrics calculators
  const totalActiveIncidents = incidents.filter(i => !i.resolved).length;
  const pendingDispatchCount = incidents.filter(i => !i.resolved && !dispatches.some(d => d.incidentId === i.id)).length;
  const activeDispatchesCount = dispatches.filter(d => d.status !== 'Completado').length;
  const verifiedActiveCount = incidents.filter(i => i.verified && !i.resolved).length;

  return (
    <div className="space-y-6" id="admin-tactical-dashboard">
      {role === 'volunteer' && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-200 p-4 rounded-xl flex items-center gap-3 font-mono text-xs">
          <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
          <span><strong>ROL VOLUNTARIO CIVIL:</strong> Modo de consulta y reporte en tierra. Puede visualizar teléfonos protegidos. El despacho de unidades y verificación oficial de incidentes requiere credencial de Operador Táctico o Director.</span>
        </div>
      )}
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin-kpis">
        <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">TOTAL ACTIVOS</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-black text-white">{totalActiveIncidents}</span>
            <span className="text-[10px] font-mono text-red-500 animate-pulse font-bold">EVENTOS</span>
          </div>
          <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">Reportes sin solventar en el eje de crisis.</p>
        </div>

        <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">POR COOPERACIÓN</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-black text-[#FF9800]">{pendingDispatchCount}</span>
            <span className="text-[10px] font-mono text-white/30 font-bold">PENDIENTE</span>
          </div>
          <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">Incidentes que aún no tienen despacho asignado.</p>
        </div>

        <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">DESPACHOS EN CURSO</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-black text-[#3b82f6]">{activeDispatchesCount}</span>
            <span className="text-[10px] font-mono text-white/30 font-bold">CUERPOS</span>
          </div>
          <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">Operaciones activas con entes de respuesta.</p>
        </div>

        <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">REPORTES VERIFICADOS</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-black text-[#4CAF50]">{verifiedActiveCount}</span>
            <span className="text-[10px] font-mono text-white/30 font-bold">CONFIRMADOS</span>
          </div>
          <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">Filtrados y validados por rescatistas acreditados.</p>
        </div>
      </div>

      {/* Sub-navigation of Admin Area */}
      <div className="flex border-b border-white/10 bg-black/20 p-1.5 rounded-xl gap-1">
        <button
          onClick={() => setActiveSubTab('console')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-mono font-bold text-[11px] sm:text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'console'
              ? 'bg-[#D32F2F] text-white font-extrabold shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4" />
          DESPACHO & VERIFICACIÓN
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-mono font-bold text-[11px] sm:text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'reports'
              ? 'bg-[#D32F2F] text-white font-extrabold shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          CENTRO DE INFORMES
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-mono font-bold text-[11px] sm:text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-[#D32F2F] text-white font-extrabold shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          LOG DE DESPLIEGUE ({dispatches.length})
        </button>
      </div>

      {/* Tab 1: Dispatch & Verification Console */}
      {activeSubTab === 'console' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="admin-dispatch-console">
          {/* Incidents List (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>REPORTES DE EVENTOS EN CURSO</span>
              <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded text-[10px]">
                {filteredAndSortedIncidents.length !== incidents.length 
                  ? `${filteredAndSortedIncidents.length}/${incidents.length}` 
                  : incidents.length}
              </span>
            </h4>

            {/* Filter and Sort Panel */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-3 space-y-3 font-mono text-[11px]" id="incident-list-controls">
              <div className="grid grid-cols-2 gap-2">
                {/* Resolution filter */}
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 font-bold block uppercase flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-white/40" /> ESTATUS:
                  </label>
                  <select
                    value={filterResolution}
                    onChange={(e) => setFilterResolution(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1.5 text-[11px] text-white focus:border-[#D32F2F] focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todos los Reportes</option>
                    <option value="pending">🔴 Pendientes por Verificar</option>
                    <option value="verified">🟡 Verificados en Curso</option>
                    <option value="active">🔥 Activos (Sin Resolver)</option>
                    <option value="resolved">🟢 Solventados / Cerrados</option>
                  </select>
                </div>

                {/* Severity filter */}
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40 font-bold block uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-white/40" /> SEVERIDAD:
                  </label>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2 py-1.5 text-[11px] text-white focus:border-[#D32F2F] focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todas (1-5)</option>
                    <option value="5">Sev 5 - Catastrófico 🔥</option>
                    <option value="4">Sev 4 - Crítico 🚨</option>
                    <option value="3">Sev 3 - Moderado ⚠</option>
                    <option value="2">Sev 2 - Menor 📂</option>
                    <option value="1">Sev 1 - Mínimo ℹ</option>
                  </select>
                </div>
              </div>

              {/* Sorting and Reset Row */}
              <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                <div className="flex-1 flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-white/40" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 bg-transparent text-white/70 hover:text-white border-0 py-0.5 focus:outline-none cursor-pointer text-[11px]"
                  >
                    <option value="severityDesc" className="bg-[#121212]">Más urgente primero</option>
                    <option value="recent" className="bg-[#121212]">Más recientes</option>
                    <option value="severityAsc" className="bg-[#121212]">Menos urgente primero</option>
                  </select>
                </div>

                {(filterSeverity !== 'all' || filterResolution !== 'all' || sortBy !== 'severityDesc') && (
                  <button
                    onClick={() => {
                      setFilterSeverity('all');
                      setFilterResolution('all');
                      setSortBy('severityDesc');
                    }}
                    className="text-[#FF9800] hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1.5 scrollbar-thin">
              {incidents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <Activity className="w-8 h-8 text-white/25 mx-auto mb-2.5 animate-pulse" />
                  <p className="text-xs text-white/40 font-mono">NO HAY INCIDENTES ACTIVOS EN EL MAPA</p>
                </div>
              ) : filteredAndSortedIncidents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                  <Filter className="w-8 h-8 text-white/25 mx-auto mb-2.5" />
                  <p className="text-xs text-white/40 font-mono">SIN RESULTADOS PARA LOS FILTROS SELECCIONADOS</p>
                </div>
              ) : (
                filteredAndSortedIncidents.map((inc) => {
                  const isDispatched = dispatches.some(d => d.incidentId === inc.id);
                  const activeDisp = dispatches.find(d => d.incidentId === inc.id);
                  return (
                    <button
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 relative ${
                        selectedIncident?.id === inc.id
                          ? 'bg-[#D32F2F]/10 border-[#D32F2F] shadow-sm'
                          : 'bg-black/30 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${inc.resolved ? 'bg-[#4CAF50]' : 'bg-red-500 animate-pulse'}`}></span>
                          <span className="font-mono font-bold text-xs uppercase text-white">{inc.type}</span>
                          <span className="text-[9px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-mono uppercase">{inc.state}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded ${
                          inc.severity >= 4 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                            : 'bg-[#FF9800]/20 text-[#FF9800] border border-[#FF9800]/30'
                        }`}>
                          SEV: {inc.severity}
                        </span>
                      </div>

                      <p className="text-xs text-white/70 line-clamp-2 leading-relaxed font-sans">{inc.description}</p>
                      {inc.address && (
                        <p className="text-[10px] text-red-300 font-mono flex items-center gap-1 mt-1 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                          <MapPin className="w-3 h-3 text-red-400 shrink-0" /> {inc.address}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1 text-[10px] font-mono">
                        <span className="text-white/40">{new Date(inc.createdAt).toLocaleTimeString('es-VE', {hour:'2-digit', minute:'2-digit'})} VET</span>
                        
                        <div className="flex items-center gap-1.5">
                          {((inc.mediaUrls && inc.mediaUrls.length > 0) || inc.mediaUrl) && (
                            <span className="text-amber-400 flex items-center gap-0.5 font-bold" title={`${inc.mediaUrls ? inc.mediaUrls.length : 1} foto(s) adjunta(s)`}>
                              <Eye className="w-3.5 h-3.5" /> {inc.mediaUrls ? inc.mediaUrls.length : 1}
                            </span>
                          )}
                          {inc.verified && (
                            <span className="text-[#4CAF50] flex items-center gap-0.5" title="Verificado por Rescatista">
                              <CheckCircle2 className="w-3.5 h-3.5" /> VERIF
                            </span>
                          )}
                          {isDispatched && (
                            <span className="text-[#3b82f6] flex items-center gap-0.5" title={`Despachado a ${activeDisp?.agency}`}>
                              <Truck className="w-3.5 h-3.5" /> DESP
                            </span>
                          )}
                          {inc.resolved && (
                            <span className="text-[#4CAF50] font-bold uppercase text-[9px] bg-[#4CAF50]/10 px-1.5 py-0.5 rounded border border-[#4CAF50]/20">SOLVENTADO</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Interactive Coordination Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {selectedIncident ? (
              <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-5.5 space-y-5.5">
                {/* Header Information */}
                <div className="border-b border-white/10 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <span className="text-[10px] bg-[#D32F2F]/10 text-[#D32F2F] px-2.5 py-1 rounded border border-[#D32F2F]/20 font-mono font-bold uppercase tracking-wider">
                      INCIDENTE SELECCIONADO
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                      <span>ID: {selectedIncident.id}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-display font-black text-white uppercase tracking-wide flex items-center gap-2">
                    {selectedIncident.type.toUpperCase()} EN {selectedIncident.state.toUpperCase()}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2.5 mt-3 text-[11px] font-mono">
                    <span className="bg-black/40 text-white/70 px-2.5 py-1 rounded border border-white/10">
                      Coordenadas: Lat {selectedIncident.latitude.toFixed(5)}, Lon {selectedIncident.longitude.toFixed(5)}
                    </span>
                    <span className="bg-black/40 text-white/70 px-2.5 py-1 rounded border border-white/10">
                      Reportante: {selectedIncident.reportedBy}
                    </span>
                    {selectedIncident.reporterContact && isVerified && (
                      <a 
                        href={`tel:${selectedIncident.reporterContact}`} 
                        className="bg-blue-500/10 text-blue-400 hover:text-white px-2.5 py-1 rounded border border-blue-500/20 flex items-center gap-1.5 hover:bg-blue-500/20 transition-all cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" /> {selectedIncident.reporterContact}
                      </a>
                    )}
                  </div>
                </div>

                {/* Description and Image Preview */}
                <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-white/40 font-mono uppercase tracking-wider font-bold">Descripción Táctica:</p>
                  <p className="text-sm text-white/90 leading-relaxed font-sans">{selectedIncident.description}</p>
                  
                  {selectedIncident.address && (
                    <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 font-mono text-xs text-red-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-red-400 font-bold uppercase block">Dirección Manual Exacta:</span>
                        {selectedIncident.address}
                      </div>
                    </div>
                  )}

                  {((selectedIncident.mediaUrls && selectedIncident.mediaUrls.length > 0) || selectedIncident.mediaUrl) && (
                    <div className="mt-4 border border-white/10 rounded-lg overflow-hidden bg-black/50">
                      <p className="text-[10px] font-mono text-white/40 p-2 bg-black/60 border-b border-white/10 flex items-center gap-1.5 uppercase font-bold">
                        <Eye className="w-3.5 h-3.5 text-blue-400" /> Registro Fotográfico ({selectedIncident.mediaUrls ? selectedIncident.mediaUrls.length : 1})
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2 p-2 max-h-60 overflow-y-auto">
                        {(selectedIncident.mediaUrls && selectedIncident.mediaUrls.length > 0 ? selectedIncident.mediaUrls : [selectedIncident.mediaUrl!]).map((photoUrl, idxP) => (
                          <button
                            key={idxP}
                            type="button"
                            onClick={() => setLightbox({
                              urls: selectedIncident.mediaUrls && selectedIncident.mediaUrls.length > 0 ? selectedIncident.mediaUrls : [selectedIncident.mediaUrl!],
                              currentIndex: idxP
                            })}
                            className="block rounded border border-white/10 overflow-hidden hover:opacity-90 hover:scale-105 transition-all shadow aspect-square cursor-pointer p-0 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            title="Haga clic para ver imagen ampliada"
                          >
                            <img 
                              src={photoUrl} 
                              alt={`Foto ${idxP+1}`} 
                              className="w-full h-full object-cover object-center" 
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Panel */}
                <div className="space-y-3">
                  <p className="text-xs text-white/40 font-mono uppercase tracking-wider font-bold">Estado del Evento e Integridad Táctica:</p>
                  <div className="flex flex-wrap gap-2.5">
                    {/* Verification Action */}
                    <button
                      onClick={() => toggleIncidentVerification(selectedIncident.id, selectedIncident.verified)}
                      disabled={!isVerified || role === 'volunteer'}
                      className={`flex-1 min-w-[130px] px-4 py-3 rounded-lg font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all border ${
                        !isVerified || role === 'volunteer'
                          ? 'opacity-40 cursor-not-allowed bg-black/20 border-white/10 text-white/40' 
                          : selectedIncident.verified
                            ? 'bg-[#4CAF50]/10 hover:bg-[#4CAF50]/20 text-[#4CAF50] border-[#4CAF50]'
                            : 'bg-black/40 hover:bg-white/5 text-white/60 border-white/10 hover:border-white/20 cursor-pointer'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      {selectedIncident.verified ? 'REPORTE VERIFICADO' : 'VERIFICAR REPORTE'}
                    </button>

                    {/* Resolution Action */}
                    <button
                      onClick={() => toggleIncidentResolution(selectedIncident.id, selectedIncident.resolved)}
                      disabled={!isVerified || role === 'volunteer'}
                      className={`flex-1 min-w-[130px] px-4 py-3 rounded-lg font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all border ${
                        !isVerified || role === 'volunteer'
                          ? 'opacity-40 cursor-not-allowed bg-black/20 border-white/10 text-white/40' 
                          : selectedIncident.resolved
                            ? 'bg-[#4CAF50] hover:bg-[#45a049] text-white border-[#4CAF50] cursor-pointer'
                            : 'bg-black/40 hover:bg-white/5 text-white/60 border-white/10 hover:border-white/20 cursor-pointer'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {selectedIncident.resolved ? 'SOLVENTADO/TERMINADO' : 'MARCAR SOLVENTADO'}
                    </button>

                    {/* Edit Action */}
                    <button
                      onClick={() => handleOpenEdit(selectedIncident)}
                      disabled={!isVerified || role === 'volunteer'}
                      className={`px-4 py-3 rounded-lg font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all border ${
                        !isVerified || role === 'volunteer'
                          ? 'opacity-40 cursor-not-allowed bg-black/20 border-white/10 text-white/40' 
                          : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 hover:border-blue-400 cursor-pointer'
                      }`}
                      title="Editar Reporte (Operador / Admin)"
                    >
                      <Pencil className="w-4 h-4" />
                      EDITAR
                    </button>

                    {/* Delete Action */}
                    <button
                      onClick={() => deleteIncidentReport(selectedIncident.id)}
                      disabled={!isVerified || role !== 'admin'}
                      className={`px-4 py-3 rounded-lg font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all border ${
                        !isVerified || role !== 'admin'
                          ? 'opacity-40 cursor-not-allowed bg-black/20 border-white/10 text-white/40' 
                          : 'bg-[#D32F2F]/10 hover:bg-[#D32F2F]/20 text-[#D32F2F] border-[#D32F2F]/30 hover:border-[#D32F2F] cursor-pointer'
                      }`}
                      title="Eliminar Reporte (Solo Admin)"
                    >
                      ELIMINAR
                    </button>
                  </div>
                  {!isVerified && (
                    <p className="text-[10px] text-[#FF9800] font-mono leading-relaxed bg-[#FF9800]/10 border border-[#FF9800]/20 p-2.5 rounded">
                      ⚠ MODO CIUDADANO: Debe acreditar su terminal en la pestaña [ADM] COORDINADOR para activar los controles tácticos de edición directa en Firestore.
                    </p>
                  )}
                </div>

                {/* Dispatch Form Section */}
                <form onSubmit={handleDispatchSubmit} className="space-y-4 border-t border-white/10 pt-4">
                  <h5 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#D32F2F]" />
                    DESPACHAR CANALIZACIÓN Y CUERPO COMPETENTE
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Agency Select */}
                    <div className="space-y-1.5 font-mono">
                      <label className="text-[10px] text-white/40 font-bold block uppercase">CUERPO COMPETENTE DESTINATARIO:</label>
                      <select
                        value={targetAgency}
                        onChange={(e) => setTargetAgency(e.target.value)}
                        className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2.5 text-xs text-white focus:border-[#D32F2F] focus:outline-none"
                        required
                        disabled={selectedIncident.resolved}
                      >
                        <option value="">-- SELECCIONE ENTE DE RESPUESTA --</option>
                        {COMPETENT_AGENCIES.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Priority Select */}
                    <div className="space-y-1.5 font-mono">
                      <label className="text-[10px] text-white/40 font-bold block uppercase">PRIORIDAD DE DESPLIEGUE:</label>
                      <div className="flex bg-black/40 p-1 rounded-lg border border-white/15 gap-1">
                        {(['Baja', 'Media', 'Alta'] as const).map(p => (
                          <button
                            type="button"
                            key={p}
                            onClick={() => setDispatchPriority(p)}
                            disabled={selectedIncident.resolved}
                            className={`flex-1 py-1 text-[10px] font-bold rounded uppercase transition-all ${
                              dispatchPriority === p 
                                ? p === 'Alta' ? 'bg-red-500 text-white font-extrabold' : p === 'Media' ? 'bg-[#FF9800] text-black font-extrabold' : 'bg-blue-500 text-white font-extrabold'
                                : 'text-white/40 hover:text-white/70'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Resource Requirements */}
                  <div className="space-y-1.5 font-mono">
                    <label className="text-[10px] text-white/40 font-bold block uppercase">RECURSOS TÁCTICOS SOLICITADOS:</label>
                    <input
                      type="text"
                      value={dispatchResources}
                      onChange={(e) => setDispatchResources(e.target.value)}
                      placeholder="Ej. 1 ambulancia, equipo de trauma e inmovilización cervical, 2 médicos"
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none"
                      disabled={selectedIncident.resolved}
                    />
                  </div>

                  {/* Dispatch Notes */}
                  <div className="space-y-1.5 font-mono">
                    <label className="text-[10px] text-white/40 font-bold block uppercase">MINUTA DE COOPERACIÓN Y LOGÍSTICA:</label>
                    <textarea
                      value={dispatchNotes}
                      onChange={(e) => setDispatchNotes(e.target.value)}
                      rows={2}
                      placeholder="Ingrese indicaciones especiales para el cuerpo competente, detalles de vías obstaculizadas o puntos de reunión."
                      className="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none resize-none"
                      disabled={selectedIncident.resolved}
                    />
                  </div>

                  {/* Dispatch Submit */}
                  <button
                    type="submit"
                    disabled={isSubmittingDispatch || selectedIncident.resolved || role === 'volunteer'}
                    className="w-full py-3 bg-[#D32F2F] hover:bg-[#b71c1c] disabled:opacity-40 text-white font-mono font-bold text-xs rounded-xl uppercase border border-[#FF5252] shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4 animate-pulse" />
                    {isSubmittingDispatch ? 'TRANSMITIENDO ORDEN...' : role === 'volunteer' ? 'REQUIERE CREDENCIAL DE OPERADOR/ADMIN PARA DESPACHAR' : selectedIncident.resolved ? 'RESOLVIDO - DESPACHO DESACTIVADO' : 'TRANSMITIR ORDEN A ENTE DE RESPUESTA'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-16 text-center shadow-lg">
                <ShieldAlert className="w-12 h-12 text-[#D32F2F] animate-pulse mx-auto mb-4" />
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">CONSOLA CIVIL DE VERIFICACIÓN</h4>
                <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto leading-relaxed">
                  Seleccione un reporte de incidente del panel izquierdo para iniciar labores de verificación de daños y coordinación con cuerpos competentes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Reports Hub (Generador de Informes) */}
      {activeSubTab === 'reports' && (
        <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-5.5 shadow-lg space-y-6" id="admin-reports-hub">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h4 className="text-base font-display font-black text-white uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D32F2F]" />
                CENTRO CIVIL DE INFORMES Y MINUTAS DE EMERGENCIA
              </h4>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                Consolida la información táctica recopilada en Firestore para su transmisión en condiciones extremas o entrega formal.
              </p>
            </div>

            {/* Selector of Report Type */}
            <div className="flex flex-wrap bg-black/50 p-1 rounded-lg border border-white/10 gap-1 self-start font-mono text-[10px]">
              <button
                onClick={() => setReportType('damage')}
                className={`px-3 py-1.5 rounded uppercase font-bold transition-all cursor-pointer ${
                  reportType === 'damage' ? 'bg-[#D32F2F] text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Daños y Eventos
              </button>
              <button
                onClick={() => setReportType('coordination')}
                className={`px-3 py-1.5 rounded uppercase font-bold transition-all cursor-pointer ${
                  reportType === 'coordination' ? 'bg-[#D32F2F] text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Despliegue Ente
              </button>
              <button
                onClick={() => setReportType('missing')}
                className={`px-3 py-1.5 rounded uppercase font-bold transition-all cursor-pointer ${
                  reportType === 'missing' ? 'bg-[#D32F2F] text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Búsqueda Personas
              </button>
              <button
                onClick={() => setReportType('status_list')}
                className={`px-3 py-1.5 rounded uppercase font-bold transition-all cursor-pointer ${
                  reportType === 'status_list' ? 'bg-[#D32F2F] text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Auditoría Estatus
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Options Left (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-black/30 p-4.5 rounded-xl border border-white/5 space-y-4">
                <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider block">OPCIONES DE FORMATO:</span>
                
                <div className="space-y-3 text-xs leading-relaxed text-white/70">
                  <p>
                    <strong className="text-white">Formato VHF/HF Radial:</strong> Optimizado con códigos de formato compacto y encabezados claros, ideal para copiar y pegar en chats tácticos de baja velocidad o transmisión por voz de ondas cortas.
                  </p>
                  <p>
                    <strong className="text-white">Impresión en un toque:</strong> El reporte es estilizado con contraste puro, sin consumo de tinta innecesario, listo para entrega física a Protección Civil.
                  </p>
                </div>

                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] text-white/40 font-bold block uppercase">AGREGAR MINUTA DE COORDINACIÓN GENERAL:</label>
                  <textarea
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    rows={4}
                    placeholder="Ingrese comentarios estratégicos adicionales del puesto de mando móvil. Aparecerá en la sección de observaciones del informe."
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-white/20 focus:border-[#D32F2F] focus:outline-none resize-none font-sans"
                  />
                </div>
              </div>

              {/* Utility Export Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <button
                  onClick={handleCopyToClipboard}
                  className="px-4 py-3 bg-[#D32F2F]/10 hover:bg-[#D32F2F]/20 border border-[#D32F2F]/30 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {copySuccess ? <Check className="w-4 h-4 text-green-300 animate-bounce" /> : <Copy className="w-4 h-4" />}
                  {copySuccess ? 'COPIADO' : 'COPIAR (VHF)'}
                </button>

                <button
                  onClick={handleDownloadTxt}
                  className="px-4 py-3 bg-black/40 hover:bg-white/5 border border-white/10 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  DESCARGAR (.TXT)
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 hover:text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {reportType === 'damage' ? 'EXPORTAR CSV' : reportType === 'coordination' ? 'CSV DESPACHOS' : 'CSV BÚSQUEDA'}
                </button>

                <button
                  onClick={handleExportPDF}
                  className="px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  EXPORTAR PDF
                </button>
              </div>
            </div>

            {/* Live Preview Right (8 cols) */}
            <div className="lg:col-span-8 bg-black border border-white/10 rounded-xl p-5 shadow-inner overflow-hidden flex flex-col max-h-[500px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3.5">
                <span className="text-[9px] font-mono font-bold text-[#D32F2F] uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#D32F2F] rounded-full animate-pulse"></span>
                  VISTA PREVIA DE TEXTO PLANO
                </span>
                <span className="text-[10px] font-mono text-white/40">Total Líneas: ~{generateReportText().split('\n').length}</span>
              </div>

              <pre className="flex-1 overflow-y-auto text-left font-mono text-[11px] leading-relaxed text-[#4CAF50] bg-black/80 border border-[#4CAF50]/10 p-4.5 rounded-lg whitespace-pre-wrap select-text scrollbar-thin">
                {generateReportText()}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dispatch Logs (Logs de Coordinación) */}
      {activeSubTab === 'logs' && (
        <div className="bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10 rounded-xl p-5.5 shadow-lg space-y-5" id="admin-dispatch-logs">
          <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-display font-black text-white uppercase tracking-wide flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#D32F2F]" />
                LOG DE DESPLIEGUE CIVIL E INTERVENCIONES
              </h4>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                Bitácora de despacho coordinado con entes gubernamentales y civiles, almacenada y sincronizada de forma segura en Firestore.
              </p>
            </div>
            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] font-bold px-2.5 py-1 rounded shrink-0 self-start sm:self-auto uppercase">
              {dispatches.length} Órdenes de Cooperación emitidas
            </span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {dispatches.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-black/20">
                <Truck className="w-10 h-10 text-white/20 mx-auto mb-3 animate-bounce" />
                <p className="text-xs text-white/40 font-mono">NO SE REGISTRAN ÓRDENES DE DESPACHO TRANSMITIDAS</p>
                <p className="text-[11px] text-white/30 max-w-sm mx-auto mt-1 leading-relaxed font-sans">
                  Use la pestaña 'DESPACHO & VERIFICACIÓN' para asignar misiones tácticas y alertar a los cuerpos pertinentes.
                </p>
              </div>
            ) : (
              dispatches.map((disp) => {
                const dispatchDate = new Date(disp.dispatchedAt).toLocaleString('es-VE');
                return (
                  <div
                    key={disp.id}
                    className="p-4.5 rounded-xl border border-white/5 bg-black/30 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="space-y-2.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
                        <span className="text-white font-extrabold uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          {disp.agency}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          disp.priority === 'Alta' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : disp.priority === 'Media'
                              ? 'bg-[#FF9800]/10 text-[#FF9800] border border-[#FF9800]/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          PRIORIDAD: {disp.priority}
                        </span>
                        <span className="text-white/40 text-[10px]">Emitido: {dispatchDate} VET</span>
                      </div>

                      <div className="space-y-1.5 font-sans">
                        <p className="text-xs text-white/60 font-mono uppercase">
                          Incidente: <strong className="text-white">{disp.incidentType}</strong> ({disp.incidentState}) - Desc: <span className="italic">"{disp.incidentDesc}"</span>
                        </p>
                        <p className="text-xs text-white/90">
                          <strong className="font-mono text-white/40 uppercase tracking-wide mr-1.5">Recursos Despachados:</strong> 
                          {disp.resources}
                        </p>
                        <p className="text-xs text-white/70 italic bg-black/40 p-2.5 rounded border border-white/5 leading-relaxed">
                          <strong className="font-mono text-white/40 uppercase tracking-wide mr-1.5 block not-italic mb-1">Instrucciones Logísticas:</strong>
                          {disp.notes}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-2.5 shrink-0 min-w-[130px] font-mono">
                      <span className={`text-center py-1 rounded text-[10px] font-extrabold border ${
                        disp.status === 'Despachado'
                          ? 'bg-[#FF9800]/10 text-[#FF9800] border-[#FF9800]/20 animate-pulse'
                          : disp.status === 'En Ruta'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : disp.status === 'Atendiendo'
                              ? 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20'
                              : 'bg-white/10 text-white/50 border-white/15'
                      }`}>
                        {disp.status.toUpperCase()}
                      </span>

                      {/* Change Status Options */}
                      {isVerified ? (
                        <div className="space-y-1">
                          <p className="text-[9px] text-white/30 text-center uppercase font-bold">Cambiar Estado:</p>
                          <div className="grid grid-cols-3 gap-1">
                            {(['En Ruta', 'Atendiendo', 'Completado'] as const).map(st => (
                              <button
                                key={st}
                                onClick={() => handleUpdateDispatchStatus(disp.id, st as any)}
                                disabled={disp.status === st}
                                className={`py-1 text-[9px] font-bold rounded text-center transition-all cursor-pointer border ${
                                  disp.status === st
                                    ? 'bg-white/20 text-white border-white/20 font-extrabold'
                                    : 'bg-black/30 text-white/40 hover:text-white/70 border-white/5 hover:border-white/10'
                                }`}
                                title={st}
                              >
                                {st === 'En Ruta' ? 'RUTA' : st === 'Atendiendo' ? 'ATEND' : 'OK'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[8px] text-white/30 text-center italic leading-relaxed">Modificación restringida</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Edit Incident Modal */}
      {editingIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-display font-black text-white uppercase tracking-wide flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-400" />
                EDITAR INCIDENTE #{editingIncident.id}
              </h3>
              <button
                onClick={() => setEditingIncident(null)}
                className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/60 block font-bold uppercase">Tipo de Incidente:</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="Rescate">Rescate</option>
                    <option value="Médico">Médico</option>
                    <option value="Fuga de Gas">Fuga de Gas</option>
                    <option value="Derrumbe">Derrumbe</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/60 block font-bold uppercase">Gravedad (1-5):</label>
                  <select
                    value={editForm.severity}
                    onChange={(e) => setEditForm({ ...editForm, severity: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value={1}>1 - Leve</option>
                    <option value={2}>2 - Moderado</option>
                    <option value={3}>3 - Considerable</option>
                    <option value={4}>4 - Severo</option>
                    <option value={5}>5 - Crítico</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 block font-bold uppercase">Estado / Entidad Federal:</label>
                <input
                  type="text"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 block font-bold uppercase">Teléfono de Contacto:</label>
                <input
                  type="text"
                  value={editForm.reporterContact}
                  onChange={(e) => setEditForm({ ...editForm, reporterContact: e.target.value })}
                  placeholder="Ej: 0414-1234567"
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 block font-bold uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> Dirección Manual Exacta:
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Ej: Av. Principal, Edificio Santa Ana, Piso 3"
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 block font-bold uppercase">Descripción Táctica:</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full bg-black/60 border border-white/15 rounded-lg p-3 text-white focus:outline-none focus:border-blue-400 font-sans text-sm leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingIncident(null)}
                  className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer uppercase font-bold"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingEdit ? 'GUARDANDO...' : 'GUARDAR CORRECCIÓN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          urls={lightbox.urls}
          initialIndex={lightbox.currentIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
