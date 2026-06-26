import React, { useState, useEffect } from 'react';
import { Incident, StructuralEvaluation, Shelter, BloodDonor, HospitalPatient, DamageLevel } from '../types';
import { 
  FileText, Printer, Download, Search, Filter, CheckCircle2, AlertTriangle, 
  ShieldAlert, Activity, Droplet, Building2, MapPin, Calendar, ExternalLink, 
  ChevronRight, Eye, RefreshCw, SlidersHorizontal, Table, LayoutGrid, Building, Heart
} from 'lucide-react';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

interface Props {
  incidents: Incident[];
  isVerified: boolean;
  role: string;
}

type ReportTypeTab = 'incidents_damage' | 'covenin_structural' | 'hospital_patients' | 'blood_donors' | 'shelters_log';

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
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);

  // Fetch external collections when tab switches
  useEffect(() => {
    const fetchExternalData = async () => {
      setIsLoadingExternal(true);
      try {
        const db = getFirestore();
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
          <td><strong>${inc.type}</strong>: ${inc.description}<br><em style="font-size: 11px; color: #444;">📍 ${inc.address || `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}</em></td>
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

      {/* 5 Report Type Switcher Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('incidents_damage')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'incidents_damage'
              ? 'bg-red-600 text-white shadow-lg border border-red-400 font-black'
              : 'bg-zinc-900 text-white/60 hover:text-white border border-white/5'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-300" />
          1. 🚨 REPORTE DE DAÑOS ({incidents.length})
        </button>

        <button
          onClick={() => setActiveTab('covenin_structural')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'covenin_structural'
              ? 'bg-emerald-600 text-white shadow-lg border border-emerald-400 font-black'
              : 'bg-zinc-900 text-white/60 hover:text-white border border-white/5'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-300" />
          2. 🏛️ DICTÁMENES COVENIN 1756 ({incidents.filter(i => i.structuralEvaluation).length})
        </button>

        <button
          onClick={() => setActiveTab('hospital_patients')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'hospital_patients'
              ? 'bg-amber-600 text-white shadow-lg border border-amber-400 font-black'
              : 'bg-zinc-900 text-white/60 hover:text-white border border-white/5'
          }`}
        >
          <Activity className="w-4 h-4 text-amber-300" />
          3. 🏥 PACIENTES ASISTENCIALES {isLoadingExternal ? '⏳' : `(${patients.length})`}
        </button>

        <button
          onClick={() => setActiveTab('blood_donors')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'blood_donors'
              ? 'bg-red-600 text-white shadow-lg border border-red-400 font-black'
              : 'bg-zinc-900 text-white/60 hover:text-white border border-white/5'
          }`}
        >
          <Droplet className="w-4 h-4 text-red-200" />
          4. 🩸 BANCO DE SANGRE {isLoadingExternal ? '⏳' : `(${donors.length})`}
        </button>

        <button
          onClick={() => setActiveTab('shelters_log')}
          className={`py-2.5 px-4 rounded-xl font-mono font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'shelters_log'
              ? 'bg-teal-600 text-white shadow-lg border border-teal-400 font-black'
              : 'bg-zinc-900 text-white/60 hover:text-white border border-white/5'
          }`}
        >
          <Building className="w-4 h-4 text-teal-300" />
          5. 🏢 REFUGIOS & ACOPIO {isLoadingExternal ? '⏳' : `(${shelters.length})`}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShelters.map((s, idx) => (
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
              {s.needs && (
                <div className="mt-3 p-2.5 bg-black/40 rounded-xl border border-white/5 text-xs font-mono text-amber-300/90">
                  <strong className="block text-[10px] text-white/40 uppercase mb-0.5">Requerimientos:</strong>
                  {s.needs}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
