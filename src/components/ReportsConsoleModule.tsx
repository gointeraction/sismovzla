import React, { useState, useEffect } from 'react';
import { Incident, StructuralEvaluation, Shelter, BloodDonor, HospitalPatient, DamageLevel, ShelterOccupant } from '../types';
import { 
  FileText, Printer, Download, Search, Filter, CheckCircle2, AlertTriangle, 
  ShieldAlert, Activity, Droplet, Building2, MapPin, Calendar, ExternalLink, 
  ChevronRight, Eye, RefreshCw, SlidersHorizontal, Table, LayoutGrid, Building, Heart
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

interface Props {
  incidents: Incident[];
  isVerified: boolean;
  role: string;
}

type ReportTypeTab = 'incidents_damage' | 'covenin_structural' | 'hospital_patients' | 'blood_donors' | 'shelters_log' | 'global_suite';

export const ReportsConsoleModule: React.FC<Props> = ({ incidents, isVerified, role }) => {
  const [activeTab, setActiveTab] = useState<ReportTypeTab>('incidents_damage');
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('Todos');
  const [severityFilter, setSeverityFilter] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // External Firestore collections state
  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [occupants, setOccupants] = useState<ShelterOccupant[]>([]);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);

  // Fetch external collections when tab switches
  useEffect(() => {
    const fetchExternalData = async () => {
      setIsLoadingExternal(true);
      try {
        if (activeTab === 'hospital_patients' && patients.length === 0) {
          const snap = await getDocs(collection(db, 'hospital_patients'));
          const list: HospitalPatient[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as HospitalPatient));
          setPatients(list);
        } else if (activeTab === 'blood_donors' && donors.length === 0) {
          const snap = await getDocs(collection(db, 'blood_donors'));
          const list: BloodDonor[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as BloodDonor));
          setDonors(list);
        } else if (activeTab === 'shelters_log' && shelters.length === 0) {
          const snap = await getDocs(collection(db, 'shelters'));
          const list: Shelter[] = [];
          snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Shelter));
          setShelters(list);

          const occSnap = await getDocs(collection(db, 'shelter_occupants'));
          const occList: ShelterOccupant[] = [];
          occSnap.forEach(doc => occList.push({ id: doc.id, ...doc.data() } as ShelterOccupant));
          setOccupants(occList);
        }
      } catch (e) {
        console.error('Error fetching external reports data:', e);
      } finally {
        setIsLoadingExternal(false);
      }
    };

    if (['hospital_patients', 'blood_donors', 'shelters_log'].includes(activeTab)) {
      fetchExternalData();
    }
  }, [activeTab]);

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
              <th style="width: 14%;">Condición Física</th>
              <th style="width: 15%;">Necesidades Médicas</th>
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
            <th style="width: 11%;">Condición Física</th>
            <th style="width: 11%;">Necesidades Médicas</th>
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
              <th style="width: 13%;">Estatus</th>
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

      {/* 6 Report Type Switcher Pills (Ergonomic Flex Wrap) */}
      <div className="flex flex-wrap items-center gap-2 pb-1 w-full">
        <button
          onClick={() => setActiveTab('incidents_damage')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-2 cursor-pointer grow sm:grow-0 justify-center ${
            activeTab === 'incidents_damage'
              ? 'bg-red-600 text-white shadow-lg border border-red-400 font-black'
              : 'bg-zinc-900 text-white/70 hover:text-white border border-white/10 hover:bg-zinc-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
          1. REPORTE DE DAÑOS ({incidents.length})
        </button>

        <button
          onClick={() => setActiveTab('covenin_structural')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-2 cursor-pointer grow sm:grow-0 justify-center ${
            activeTab === 'covenin_structural'
              ? 'bg-emerald-600 text-white shadow-lg border border-emerald-400 font-black'
              : 'bg-zinc-900 text-white/70 hover:text-white border border-white/10 hover:bg-zinc-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-300 shrink-0" />
          2. DICTÁMENES COVENIN ({incidents.filter(i => i.structuralEvaluation).length})
        </button>

        <button
          onClick={() => setActiveTab('hospital_patients')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-2 cursor-pointer grow sm:grow-0 justify-center ${
            activeTab === 'hospital_patients'
              ? 'bg-amber-600 text-white shadow-lg border border-amber-400 font-black'
              : 'bg-zinc-900 text-white/70 hover:text-white border border-white/10 hover:bg-zinc-800'
          }`}
        >
          <Activity className="w-4 h-4 text-amber-300 shrink-0" />
          3. PACIENTES ASISTENCIALES {isLoadingExternal ? '⏳' : `(${patients.length})`}
        </button>

        <button
          onClick={() => setActiveTab('blood_donors')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-2 cursor-pointer grow sm:grow-0 justify-center ${
            activeTab === 'blood_donors'
              ? 'bg-red-600 text-white shadow-lg border border-red-400 font-black'
              : 'bg-zinc-900 text-white/70 hover:text-white border border-white/10 hover:bg-zinc-800'
          }`}
        >
          <Droplet className="w-4 h-4 text-red-200 shrink-0" />
          4. BANCO DE SANGRE {isLoadingExternal ? '⏳' : `(${donors.length})`}
        </button>

        <button
          onClick={() => setActiveTab('shelters_log')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-2 cursor-pointer grow sm:grow-0 justify-center ${
            activeTab === 'shelters_log'
              ? 'bg-teal-600 text-white shadow-lg border border-teal-400 font-black'
              : 'bg-zinc-900 text-white/70 hover:text-white border border-white/10 hover:bg-zinc-800'
          }`}
        >
          <Building className="w-4 h-4 text-teal-300 shrink-0" />
          5. REFUGIOS & ACOPIO {isLoadingExternal ? '⏳' : `(${shelters.length})`}
        </button>

        <button
          onClick={() => setActiveTab('global_suite')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-2 cursor-pointer grow sm:grow-0 justify-center ${
            activeTab === 'global_suite'
              ? 'bg-violet-600 text-white shadow-lg border border-violet-400 font-black'
              : 'bg-zinc-900 text-white/70 hover:text-white border border-white/10 hover:bg-zinc-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-violet-300 shrink-0" />
          6. REPORTES GLOBALES (6)
        </button>
      </div>

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

    </div>
  );
};
