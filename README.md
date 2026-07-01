<div align="center">

# 🚨 SISMOVZLA — Plataforma Táctica Comunitaria de Emergencia
**Nodo Civil Descentralizado para Mapeo de Daños, Triaje de Riesgos y Respuesta Ante Catástrofes Sísmicas**

[![Plataforma Oficial](https://img.shields.io/badge/Plataforma-ayudasismovzla.web.app-FF9800?style=for-the-badge&logo=firebase&logoColor=black)](https://ayudasismovzla.web.app)
[![PWA Offline-First](https://img.shields.io/badge/Arquitectura-PWA_Resiliente-4CAF50?style=for-the-badge&logo=pwa&logoColor=white)](#-arquitectura-resiliente-offline-first)
[![Stack](https://img.shields.io/badge/Frontend-React_19_%2B_TypeScript-3178C6?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Versión](https://img.shields.io/badge/Versión-3.4-D32F2F?style=for-the-badge)](https://ayudasismovzla.web.app)
[![Tests](https://img.shields.io/badge/Tests-98_Passing-22C55E?style=for-the-badge&logo=vitest&logoColor=white)](https://ayudasismovzla.web.app)

<br />
</div>

---

## 📖 Descripción General

**🌐 URL Oficial de la Plataforma:** [https://ayudasismovzla.web.app/](https://ayudasismovzla.web.app/)

**SismoVZLA** es una Aplicación Web Progresiva (**PWA**) de código abierto diseñada para operar como una red de contingencia humanitaria en Venezuela tras eventos sísmicos de gran escala.

La plataforma cubre **35 módulos tácticos** organizados en **4 capas**: **Coordinación**, **Apoyo Táctico**, **Logística** y **Apoyo Ciudadano**, con **38 colecciones Firestore**, **43 reportes PDF**, **20+ APIs tipadas**, **98 tests unitarios** y un sistema de **12 roles tácticos** especializados.

Cuando ocurren terremotos severos, las infraestructuras de telecomunicaciones colapsan. SismoVZLA resuelve este problema mediante una arquitectura **Offline-First** que permite a los ciudadanos guardar reportes, consultar manuales de auxilio y buscar familiares **completamente sin internet**.

---

## 🗂️ Mapa de Módulos Tácticos (v3.1)

### Capa 1 — Coordinación

| # | Módulo | Descripción | Colección Firestore |
|---|--------|-------------|---------------------|
| 00 | 🏢 **Centro de Operaciones (EOC)** | Dashboard ejecutivo con KPIs en tiempo real: incidentes, triaje, rutas evacuación, refugios, búsqueda y rescate | `incidents`, `triage_patients`, `evacuation_routes`, `shelters`, `search_sectors`, `cascade_events` |
| 01 | 🗺️ **Mapa de Incidentes** | Mapa táctico georeferenciado con filtros por estado, gravedad y tipo | `incidents` |
| 02 | 📝 **Formulario de Reporte** | Registro ciudadano con GPS automático, notas de voz y fotos comprimidas | `incidents` |
| 03 | 🔎 **Búsqueda de Personas** | Directorio de ciudadanos buscados, localizados o hospitalizados | `person_searches` |
| 04 | 🏠 **Directorio de Refugios** | Semáforo de capacidad en tiempo real (🟢🟡🔴) | `shelters`, `shelter_occupants` |
| 05 | 🗺️ **Mapa Táctico de Refugios** | Marcadores SVG por tipo con popups y Google Maps | `shelters` |
| 06 | 🆘 **Auxilios y Directorio de Emergencia** | Manuales de supervivencia y contactos de emergencia | Estático |
| 09 | 📊 **Consola de Reportes** | 43 reportes PDF oficiales incluyendo suite ONU/OCHA | Multi-colección |

### Capa 2 — Apoyo Táctico

| # | Módulo | Descripción | Colección Firestore |
|---|--------|-------------|---------------------|
| 07 | 🩸 **Banco de Sangre** | Triaje clínico OMS, remisión hospitalaria, control de donantes | `blood_donors` |
| 08 | 🏥 **Registro Hospitalario** | Censo 9 centros asistenciales con OCR y doble chequeo | `hospital_patients` |
| 10 | 🛤️ **Vías y Rutas** | Estado de evacuación con bloqueos, barreras y rutas alternas | `evacuation_routes` |
| 11 | ❤️ **Triaje de Víctimas** | Triage masivo por colores (Rojo/Amarillo/Verde/Negro) con equipos | `triage_patients`, `triage_teams` |
| 12 | ⚡ **Eventos en Cascada** | Timeline de réplicas, incendios, fugas de gas, deslizamientos | `cascade_events` |
| 13 | 🔍 **Búsqueda y Rescate** | Sectores georrefenciados, equipos SAR, prioridades CRÍTICO-BAJO | `search_sectors`, `rescue_teams` |
| 16 | 💀 **Gestión de Fallecidos** | Casos forenses con caseId, cadena de custodia, notificación familiar | `deceased_persons` |
| 17 | 🧠 **Apoyo Psicosocial** | Triaje psicológico, derivación, seguimiento | `psychosocial_cases` |
| 18 | 📡 **Comunicaciones** | Radioaficionados, satelitales, repetidoras con estado de batería | `emergency_comms` |

### Capa 3 — Logística

| # | Módulo | Descripción | Colección Firestore |
|---|--------|-------------|---------------------|
| 14 | 📦 **Logística** | Inventario de suministros y solicitudes entre refugios | `supply_inventory`, `supply_requests` |
| 15 | 💧 **Agua y Saneamiento** | Puntos de agua potable y letrinas con cloración y capacidad | `water_points`, `sanitation_points` |
| 19 | 🙋 **Voluntarios y Donaciones** | Registro de voluntarios y donaciones con tracking | `volunteers`, `donations` |
| 20 | 🤝 **Coordinación Interagencial** | Tareas inter-agencia con asignación y seguimiento | `interagency_tasks` |
| 21 | 🚁 **Operaciones Aéreas** | Drones, helicópteros, zonas prohibidas, misiones | `aerial_operations` |
| 22 | ⛽ **Combustible y Energía** | Gasolineras, generadores, estado de combustible | `fuel_energy_points` |

### Capa 4 — Apoyo Ciudadano

| # | Módulo | Descripción | Colección Firestore |
|---|--------|-------------|---------------------|
| 23 | 🌦️ **Alertas Meteorológicas** | Alertas manuales con severidad (Verde/Amarillo/Naranja/Rojo), radio de afectación en km, mapa Leaflet | `weather_alerts` |
| 24 | 🚨 **Alertas Públicas** | Centro de alertas con prioridad (Crítica/Alta/Media/Baja), estados afectados, contador de vistas | `public_alerts` |
| 25 | 👨‍👩‍👧 **Reunificación Familiar** | Búsqueda bidireccional de familiares desaparecidos con fuzzy match por nombre | `family_requests` |
| 26 | 👶 **Protección Infantil** | Registro de menores no acompañados, asignación a refugios, flujo de estados | `child_protection_cases` |
| 27 | 📋 **Asistencia Legal** | Trámites documentales post-desastre: actas, identificación, propiedad | `legal_aid_requests` |
| 28 | 📢 **Centro de Prensa** | Comunicados oficiales con categoría, publicar/ocultar, contador de vistas | `press_releases` |
| 29 | 🎓 **Capacitación** | Simulacros, talleres, entrenamiento SAR con inscripción de voluntarios | `training_sessions` |
| 30 | 📊 **Lecciones Aprendidas** | Revisiones post-incidente: qué funcionó, qué mejorar, recomendaciones | `after_action_reviews` |
| 31 | 📅 **Turnos de Voluntarios** | Calendario de turnos con fecha, hora inicio/fin, ubicación, registro de asistencia | `volunteer_shifts` |
| 32 | 🗺️ **Mapa de Recursos** | Mapa consolidado de almacenes, centros médicos, bases con marcadores SVG por tipo | `resource_locations` |
| 33 | 🏫 **Educación y Escuelas** | Daños escolares, evaluación estructural, estadísticas de estudiantes afectados | `school_damage_reports` |
| 34 | 🏠 **Vivienda Temporal** | Registro de viviendas temporales con capacidad, ocupación, servicios y mapa | `temporary_housing` |

---

## 📄 Sistema de Reportes PDF (43 Reportes)

### Consola de Reportes — Módulo 09

La Consola de Reportes es el centro maestro de generación de documentos oficiales. Todos los reportes se generan en formato **A4** con template institucional, firmas y disclaimer legal.

### Suite de Reportes Principales (6 pestañas)

| # | Reporte | Descripción | Datos Fuente |
|---|---------|-------------|--------------|
| 1 | **Reporte de Daños** | Listado completo de incidentes con filtros por estado y gravedad | `incidents` |
| 2 | **Dictámenes COVENIN 1756** | Evaluaciones estructurales individuales con clasificación Verde/Amarillo/Rojo | `incidents.structuralEvaluation` |
| 3 | **Pacientes Asistenciales** | Censo clínico de heridos con OCR y doble chequeo hospitalario | `hospital_patients` |
| 4 | **Banco de Sangre** | Manifiesto de donantes aptos OMS por grupo sanguíneo | `blood_donors` |
| 5 | **Refugios y Acopio** | Balance de capacidad con semáforo y requerimientos urgentes | `shelters`, `shelter_occupants` |
| 6 | **Reportes Globales** | Suite de 6 reportes consolidados para organismos internacionales | Multi-colección |

### Suite de Reportes Globales (6 reportes ONU/OCHA)

| # | Reporte | Descripción | Norma |
|---|---------|-------------|-------|
| G1 | **Densidad Regional por Entidades** | Cuadro estadístico comparativo por Estado con % de colapsos e índice COVENIN | COVENIN 1756 |
| G2 | **Coordenadas GPS Rescate (SAR)** | Manifiesto militar satelital de objetivos críticos (Gravedad 4-5) para pilotos y brigadas K9 | SAR/INSARAG |
| G3 | **Catálogo Nacional Etiquetado** | Registro oficial dividido en perímetros Rojo/Amarillo/Verde | COVENIN 1756 |
| G4 | **Matriz de Patologías Sísmicas** | Estudio sismológico de frecuencia de fallas constructivas A-F | FUNVISIS/CIV |
| G5 | **Alerta Redes Vitales & Riesgos** | Hoja de despacho urgente para CORPOELEC, PDVSA Gas, Hidrocapital, Vialidad | Protección Civil |
| G6 | **Boletín Internacional SITREP** | Informe de Situación Humanitaria consolidado para organismos multilaterales | ONU/OCHA/FEMA |

### Reportes por Refugios (4 reportes adicionales)

| # | Reporte | Descripción |
|---|---------|-------------|
| R1 | **Ocupantes por Refugio** | Censo detallado por refugio con fechas de ingreso/egreso |
| R2 | **Consolidado de Refugios** | Directorio unificado de todas las personas albergadas |
| R3 | **Ingresos Cronológicos** | Desglose por fecha de ingreso a la red de refugios |
| R4 | **Albergados Activos** | Personas que permanecen actualmente (sin fecha de salida) |

### Reportes por Módulo (28 reportes nuevos)

| # | Reporte | Módulo | Colección Firestore | Descripción |
|---|---------|--------|---------------------|-------------|
| M1 | **Resumen Ejecutivo EOC** | Centro Operaciones | incidents + 5 colecciones | KPIs consolidados: total daños, críticos, evacuados, albergados, heridos, fallecidos. Vista de mando única. |
| M2 | **Manifiesto de Búsqueda de Personas** | Búsqueda | `person_searches` | Listado de personas buscadas con nombre, cédula, último lugar conocido, estado. Para brigadas. |
| M3 | **Mapa de Rutas de Evacuación** | Vías | `evacuation_routes` | Rutas con puntos de reunión, capacidad, estado (abierta/cerrada), alternativas. Para población civil. |
| M4 | **Manifiesto de Triaje por Zona** | Triaje | `triage_patients`, `triage_teams` | Pacientes por categoría (rojo/amarillo/verde/negro), ubicación, equipo asignado. |
| M5 | **Reporte de Rendimiento de Triaje** | Triaje | `triage_patients` | Pacientes atendidos por equipo, tiempo promedio, distribución por código. |
| M6 | **Línea de Tiempo de Eventos en Cascada** | Cascada | `cascade_events` | Cronología de réplicas, daños secundarios, alertas de tsunami, deslizamientos. |
| M7 | **Manifiesto de Sectores de Búsqueda** | SAR | `search_sectors` | Sectores asignados, equipos, estatus, coordenadas GPS, hallazgos. |
| M8 | **Reporte de Rendimiento SAR** | SAR | `rescue_teams` | Víctimas localizadas/rescatadas por equipo, horas invertidas. |
| M9 | **Inventario de Suministros** | Logística | `supply_inventory` | Stock actual por categoría, ubicación, nivel mínimo, fecha expiración. |
| M10 | **Manifiesto de Solicitudes** | Logística | `supply_requests` | Solicitudes pendientes, aprobadas, entregadas entre almacenes. |
| M11 | **Reporte de Calidad de Agua** | WASH | `water_points` | Puntos de agua analizados, estado (potable/no potable), cloración, población servida. |
| M12 | **Manifiesto de Saneamiento** | WASH | `sanitation_points` | Puntos sanitarios operativos, capacidad, estado, tipo. |
| M13 | **Censo de Fallecidos** | Fallecidos | `deceased_persons` | Listado con identificación, ubicación hallazgo, fecha, estado de identificación, morgue. |
| M14 | **Reporte para Fiscalía** | Fallecidos | `deceased_persons` | Documento formal para autoridades judiciales con cadena de custodia. |
| M15 | **Reporte de Casos Psicosocial** | Psicosocial | `psychosocial_cases` | Casos atendidos, categoría (TEAP, duelo, ansiedad), intervenciones, estado. |
| M16 | **Estadísticas de Atención Psicosocial** | Psicosocial | `psychosocial_cases` | Resumen por zona, edad, género, tipo de crisis. |
| M17 | **Estado de la Red de Comunicaciones** | Comunicaciones | `emergency_comms` | Canales activos, satélites, repetidoras, estado de cobertura por zona. |
| M18 | **Manifiesto de Voluntarios** | Voluntarios | `volunteers` | Listado completo con cédula, nombre, habilidades, estado, fecha de inscripción. |
| M19 | **Manifiesto de Donaciones** | Donaciones | `donations` | Donaciones por tipo (persona/empresa/ONG/gobierno), monto, estado de distribución. |
| M20 | **Cuadro de Tareas Interagenciales** | Interagencial | `interagency_tasks` | Tareas por agencia, clúster (Salud, WASH, Alojamiento, etc.), estado, prioridad. |
| M21 | **Manifiesto de Operaciones Aéreas** | Aéreo | `aerial_operations` | Vuelos programados/ejecutados, tipo aeronave, misión, estado, batería/combustible. |
| M22 | **Inventario de Combustible y Energía** | Combustible | `fuel_energy_points` | Puntos de distribución, stock, tipo de combustible, estado, acceso prioritario. |
| M23 | **Censo de Menores Vulnerables** | Protección Infantil | `child_protection_cases` | Menores separados/no acompañados, estado del caso, ubicación, necesidades médicas. |
| M24 | **Censo de Viviendas Temporales** | Vivienda | `temporary_housing` | Unidades disponibles, ocupadas, capacidad, servicios, contacto. |
| M25 | **Censo de Daños Educativos** | Educación | `school_damage_reports` | Escuelas dañadas, nivel de daño, estudiantes afectados, estado de rehabilitación. |
| M26 | **Boletín Meteorológico** | Alertas Meteo | `weather_alerts` | Alertas activas, zonas afectadas, pronóstico, recomendaciones. |
| M27 | **Boletín de Alertas Públicas** | Alertas Públicas | `public_alerts` | Alertas emitidas, alcance, nivel de prioridad, estado de difusión. |
| M28 | **Manifiesto de Búsquedas Familiares** | Reunificación | `family_requests` | Solicitudes activas, personas encontradas/no encontradas, coincidencias. |
| M29 | **Reporte de Asistencia Legal** | Legal | `legal_aid_requests` | Casos atendidos, tipo (propiedad, documentación, laboral), estado, institución. |
| M30 | **Boletín de Prensa** | Prensa | `press_releases` | Comunicados emitidos, fecha, contenido resumido, medio de difusión. |
| M31 | **Manifiesto de Capacitación** | Training | `training_sessions` | Sesiones realizadas, participantes, temas, certificados emitidos. |
| M32 | **Informe de Lecciones Aprendidas** | AAR | `after_action_reviews` | AAR completados, hallazgos, recomendaciones, responsables. |
| M33 | **Manifiesto de Turnos de Voluntarios** | Turnos | `volunteer_shifts` | Turnos programados, voluntarios asignados, horas trabajadas, asistencia. |
| M34 | **Inventario de Recursos por Ubicación** | Mapa Recursos | `resource_locations` | Recursos censados, tipo, capacidad, estado, coordenadas, horario. |

---

## ✨ Características de la Plataforma v3.4

### 🏗️ Arquitectura Técnica

| Característica | Detalle |
|---|---|
| **API Layer** | 13 archivos `src/api/` con factoría CRUD genérica, 20+ métodos tipados |
| **Code-Splitting** | 35 módulos lazy-loaded con `React.lazy` + `Suspense` |
| **Skeletons Contextuales** | 36 esqueletos visuales por módulo durante carga (tabla, mapa, dashboard, formulario) |
| **Error Boundary** | Captura de errores por módulo con botón de reintento |
| **Chunk Optimization** | Main: 222 kB \| lucide: 50 kB \| jspdf: 422 kB \| firebase-core: 0.7 kB \| firebase-auth: 111 kB \| firebase-firestore: 661 kB |
| **ReportsConsole Lazy Loading** | 0 colecciones en mount, carga on-demand por tab con cache — ~85% menos tiempo/memoria inicial |
| **Geolocalización Centralizada** | Hook `useGeolocation` compartido en 12+ módulos |
| **Exportación PDF** | 43 reportes PDF con template institucional A4, firmas y disclaimer legal |
| **Exportación CSV** | Módulos de logística y recursos con exportación CSV nativa |
| **Consola de Reportes** | Módulo 09 con interfaz de pestañas colapsables y 34 vistas de datos |

### 🛡️ Seguridad Firestore (v3.3)

- **38 colecciones** — reglas endurecidas: `allow update/delete: if request.auth != null`
- **12 colecciones sensibles** — requieren autenticación inclusive para lecturas (deceased, psychosocial, volunteers, hospital, child protection, legal aid, blood donors, etc.)
- **6 colecciones** — requieren autenticación para crear registros (psychosocial, hospital, child protection, legal aid, weather alerts, press releases, training sessions)
- **Helper `isShortStr(field, maxLen)`** — validación de longitudes de texto contra spam/abuso
- **Rangos numéricos** — maxCapacity ≤100000, occupantCount ≥0, childAge 0-18, quantity ≥0
- **Campo `type` protegido** — incidents update impide cambiar tipo de incidente

### ✅ Tests Unitarios (v3.3)

- **98 tests passing** — cobertura completa de 13 APIs con Vitest + jsdom
- **Firebase mocks** — `vi.mock('firebase/firestore')` + `vi.mock('../../firebase')` con overrides por test
- **13 archivos de test** — `crud.test.ts` (7), `triage.test.ts` (10), `incidents.test.ts` (5), `supply.test.ts` (4), `shelters.test.ts` (8), `family.test.ts` (7), `comms.test.ts` (5), `water.test.ts` (4), `deceased.test.ts` (6), `psychosocial.test.ts` (6), `eoc.test.ts` (16), `alerts.test.ts` (12), `volunteers.test.ts` (8)
- Scripts: `npm test` (run) / `npm run test:watch` (watch mode)

### 🗺️ Mapa Táctico Georeferenciado
- Marcadores de colores por gravedad (**Gravedad 1 a 5**)
- Marcadores SVG por tipo de recurso (Almacén, Centro Médico, Generador, etc.)
- Control de estado en memoria — no salta ni recentra ante actualizaciones masivas
- Popups persistentes con ventana emergente
- Filtros regionales: Caracas, La Guaira, Aragua, Carabobo, Otros

### 📡 Arquitectura Resiliente (Offline-First)
- **IndexedDB** con `persistentLocalCache` y `persistentMultipleTabManager`
- Cola de transmisión asincrónica — reportes offline se retransmiten al recuperar red
- Compatible con redes 2G degradadas

### 🆘 Reporte Ciudadano Multimodal
- GPS satelital automático o ingreso manual de coordenadas
- Notas de voz OPUS comprimidas (~4KB por nota)
- Evidencia visual con visor lightbox

### 🩸 Red Sanitaria
- Triaje clínico OMS con criterios de peso, tiempo y salud
- Remisión hospitalaria directa con seguimiento

### 🏢 Sistema de Refugios
- Semáforo de capacidad en tiempo real (🟢🟡🔴)
- Padrón de personas albergadas con registro nominal
- Solicitudes de ayuda con 5 categorías
- Mapa táctico con marcadores SVG por tipo
- Plantillas CSV para carga masiva

---

## 🛡️ Matriz de Roles y Seguridad

### Roles Base

| Rol | Token | Permisos |
|---|---|---|
| Ciudadano | — | Visualización pública |
| Voluntario | `VOLUNTARIO_VZLA` | Lectura + envío de reportes |
| Coordinador Refugio | `COORD_REFUGIO` | Control de ocupación del refugio |
| Operador Táctico | `TACTICO_2026` | Creación, actualización, eliminación |
| Admin | `SISMO_CRISIS_ADMIN` | Administración absoluta |

### Roles Tácticos

| Rol | Token | Especialidad | Módulos Asignados |
|---|---|---|---|
| 🏥 Triage Médico | `TRIAGE_MEDICO` | Triaje de víctimas, gestión de pacientes | Triage, Hospital, Sangre |
| 🚑 Coordinador Rescate | `RESCATE_COORD` | Búsqueda y rescate, sectores SAR | Búsqueda y Rescate, EOC |
| 📦 Logística Admin | `LOGISTICA_ADMIN` | Inventario, suministros, distribución | Logística, Combustible, Agua |
| 📡 Operador Radio | `RADIO_OP` | Comunicaciones de emergencia | Comunicaciones, EOC |
| 🔬 Forense | `FORENSE` | Gestión de fallecidos, cadena de custodia | Fallecidos, EOC |
| 🧠 Psicosocial | `PSICOSOCIAL` | Apoyo psicológico, derivación | Psicosocial, Protección Infantil |
| 🚁 Coordinador Aéreo | `AEREO_COORD` | Operaciones con drones y helicópteros | Operaciones Aéreas, EOC |

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Núcleo | React 19 + TypeScript 5.8 |
| Empaquetador | Vite 6.4 |
| UI | Tailwind CSS v4 + Lucide React |
| Mapas | Leaflet + react-leaflet |
| PDF | jsPDF + jspdf-autotable |
| API Layer | `createCrud()` genérico + 13 módulos tipados |
| Base de Datos | Firebase Firestore (38 colecciones) |
| Hosting | Firebase Hosting (2 nodos) |
| Admin SDK | Firebase Admin v14 |
| PWA | serviceWorker + localStorage + IndexedDB |

---

## 📊 Métricas de Rendimiento

| Métrica | v1.0 | v2.0 | v3.0 | v3.1 | v3.2 | v3.3 | v3.4 | Mejora Total |
|---------|------|------|------|------|------|------|------|--------------|
| Main bundle | 1,699 kB | 213 kB | 222 kB | 222 kB | 222 kB | 222 kB | 222 kB | **-87%** |
| Chunks lucide | 27 × 0.3kB | 1 × 45kB | 1 × 50kB | 1 × 50kB | 1 × 50kB | 1 × 50kB | 1 × 50kB | Consolidados |
| Firebase | En main | 1 chunk 772kB | 3 chunks | 3 chunks | 3 chunks | 3 chunks | 3 chunks | Mejor cache |
| Build time | ~7s | ~5s | ~6s | ~8s | ~6s | ~6s | ~6s | API optimizada |
| Módulos | 8 | 23 | 35 | 35 | 35 | 35 | 35 | +27 |
| Colecciones | 14 | 26 | 38 | 38 | 38 | 38 | 38 | +24 |
| Reportes PDF | 0 | 6 | 15 | 43 | **43** | **43** | **43** | +43 |
| APIs tipadas | 0 | 0 | 0 | 0 | **13** | **13** | **13** | +13 |
| Métodos API | 0 | 0 | 0 | 0 | **20+** | **20+** | **20+** | +20 |
| Roles | 4 | 11 | 12 | 12 | 12 | 12 | 12 | +8 |
| Capas | 2 | 3 | 4 | 4 | 4 | 4 | 4 | +2 |
| Tests unitarios | 0 | 0 | 0 | 0 | 0 | **98** | **98** | +98 |
| Firestore rules | Básicas | Básicas | 38 coll | 38 coll | 38 coll | **Endurecidas** | **Endurecidas** | Auth + validación |
| ReportsConsole mount | — | — | — | 31 coll | 31 coll | 31 coll | **0 coll** | **-85%** carga/mem |

---

## 🚀 Instalación y Desarrollo

```bash
# Clonar
git clone https://github.com/gointeraction/sismovzla.git
cd sismovzla

# Instalar
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Verificar tipos
npx tsc --noEmit

# Ejecutar tests (98 unitarios)
npm test

# Tests en modo watch
npm run test:watch

# Desplegar nodo principal
npx firebase deploy --only hosting --project sismovzla

# Desplegar nodo espejo
npx firebase deploy --only hosting --project ayudasismovzla

# Desplegar reglas Firestore
npx firebase deploy --only firestore:rules --project sismovzla
npx firebase deploy --only firestore:rules --project ayudasismovzla
```

---

## 📁 Estructura del Proyecto

```
sismovzla/
├── src/
│   ├── api/                              # Capa de APIs tipadas
│   │   ├── crud.ts                       # Factoría genérica CRUD + setStatus + setField
│   │   ├── incidents.ts                  # verify, resolve, queueOffline, syncOfflineQueue
│   │   ├── triage.ts                     # assignStartCode, bulkCreate (batch)
│   │   ├── supply.ts                     # deliver (batch con deducción automática)
│   │   ├── shelters.ts                   # updateOccupancy, checkIn, checkOut
│   │   ├── volunteers.ts                 # assignShift, startShift, completeShift
│   │   ├── family.ts                     # findMatches, markContacted, markReunified
│   │   ├── comms.ts                      # setOnline, setOffline, setStandby
│   │   ├── water.ts                      # setPotable, setNonPotable, setTesting
│   │   ├── deceased.ts                   # moveToMorgue, identify, deliverToFamily
│   │   ├── psychosocial.ts               # open, followUp, close, refer
│   │   ├── eoc.ts                        # cascadeEvents, searchSectors, interagencyTasks
│   │   ├── alerts.ts                     # weatherAlerts, publicAlerts, aerialOps
│   │   ├── __tests__/                    # 13 archivos de tests (98 tests)
│   │   └── index.ts                      # Barrel export
│   ├── components/
│   │   ├── ReportsConsoleModule.tsx      # Consola maestra: 43 reportes PDF (3,176 líneas)
│   │   ├── EOCDashboard.tsx              # Centro de Operaciones
│   │   ├── MapViewer.tsx                 # Mapa de incidentes
│   │   ├── ReportForm.tsx                # Formulario ciudadano
│   │   ├── PeopleSearch.tsx              # Búsqueda de personas
│   │   ├── SheltersModule.tsx            # Directorio de refugios
│   │   ├── ShelterTacticalMap.tsx        # Mapa táctico de refugios
│   │   ├── BloodDonorsModule.tsx         # Banco de sangre
│   │   ├── HospitalPatientsModule.tsx    # Registro hospitalario
│   │   ├── EvacuationRoutesPanel.tsx     # Vías y rutas
│   │   ├── TriageModule.tsx              # Triaje de víctimas
│   │   ├── CascadeTimeline.tsx           # Eventos en cascada
│   │   ├── SearchAndRescueModule.tsx     # Búsqueda y rescate
│   │   ├── SupplyLogisticsModule.tsx     # Logística
│   │   ├── WaterSanitationModule.tsx     # Agua y saneamiento
│   │   ├── DeceasedManagementModule.tsx  # Gestión de fallecidos
│   │   ├── PsychosocialModule.tsx        # Apoyo psicosocial
│   │   ├── EmergencyCommsModule.tsx      # Comunicaciones
│   │   ├── VolunteerDonationsModule.tsx  # Voluntarios y donaciones
│   │   ├── InteragencyModule.tsx         # Coordinación interagencial
│   │   ├── AerialOpsModule.tsx           # Operaciones aéreas
│   │   ├── FuelEnergyModule.tsx          # Combustible y energía
│   │   ├── WeatherAlertsModule.tsx       # Alertas meteorológicas
│   │   ├── PublicAlertsModule.tsx        # Alertas públicas
│   │   ├── FamilyReunificationModule.tsx # Reunificación familiar
│   │   ├── ChildProtectionModule.tsx     # Protección infantil
│   │   ├── LegalAidModule.tsx            # Asistencia legal
│   │   ├── PressCenterModule.tsx         # Centro de prensa
│   │   ├── TrainingModule.tsx            # Capacitación
│   │   ├── LessonsLearnedModule.tsx      # Lecciones aprendidas
│   │   ├── VolunteerShiftsModule.tsx     # Turnos de voluntarios
│   │   ├── ResourceMapModule.tsx         # Mapa de recursos
│   │   ├── EducationModule.tsx           # Educación y escuelas
│   │   ├── TemporaryHousingModule.tsx    # Vivienda temporal
│   │   ├── ModuleSkeleton.tsx            # 36 esqueletos contextuales
│   │   └── ErrorBoundary.tsx             # Captura de errores
│   ├── hooks/
│   │   └── useGeolocation.ts             # Hook centralizado
│   ├── test/
│   │   └── setup.ts                      # Firebase mocks para Vitest
│   ├── types.ts                          # 38 interfaces TypeScript
│   ├── firebase.ts                       # Configuración Firebase
│   └── App.tsx                           # Orquestador principal (35 tabs)
├── server/
│   └── firebaseAdmin.ts                  # Firebase Admin v14
├── firestore.rules                       # 38 colecciones — auth + validación numérica + isShortStr
├── vite.config.ts                        # Configuración Vite + chunks + Vitest
└── package.json                          # Dependencias + scripts (test, test:watch)
```

---

## 🔌 API Layer (src/api/)

Todas las operaciones CRUD de Firestore están centralizadas en **13 archivos API** con **20+ exports tipados**. Cada API extiende un CRUD genérico con lógica de negocio específica del módulo.

### CRUD Genérico (`crud.ts`)

```typescript
import { createCrud, currentUser } from '../api';

// Crear API para cualquier colección
const myApi = createCrud<MyType>('collection_name');

// Métodos disponibles:
myApi.subscribe(callback, opts?)  // Listener en tiempo real
myApi.create(data)                // Crear registro (auto-agrega reportedBy, createdAt)
myApi.update(id, data)            // Actualizar registro
myApi.remove(id)                  // Eliminar registro
myApi.getAll(opts?)               // Obtener todos (una vez)
myApi.getById(id)                 // Obtener por ID (usa getDoc, no query)
myApi.setStatus(id, status)       // Actualizar solo el campo status
myApi.setField(id, field, value)  // Actualizar cualquier campo

// Helper de usuario actual
const user = currentUser(); // 'admin@sismovzla.com'
```

### APIs por Módulo

| Archivo | API | Métodos Especializados |
|---------|-----|------------------------|
| `incidents.ts` | `incidentsApi` | `verify()`, `resolve()`, `queueOffline()`, `syncOfflineQueue()` → retorna `{ synced, failed }` |
| `triage.ts` | `triagePatientsApi` | `assignStartCode(vitals)` → retorna código START automático, `bulkCreate()` → batch de N pacientes |
| `supply.ts` | `supplyRequestsApi` | `deliver(requestId, items)` → batch con deducción automática de inventario |
| `shelters.ts` | `sheltersApi` | `updateOccupancy(id, delta)` → incrementa/decrementa ocupantes |
| `shelters.ts` | `shelterOccupantsApi` | `checkIn(data)` → registra + actualiza refugio, `checkOut(id, shelterId)` → salida + actualiza refugio |
| `volunteers.ts` | `volunteerShiftsApi` | `startShift()`, `completeShift()`, `cancelShift()` |
| `family.ts` | `familyRequestsApi` | `findMatches(name)` → cruza con `people_search`, `markContacted()`, `markReunified()` |
| `comms.ts` | `emergencyCommsApi` | `setOnline()`, `setOffline()`, `setStandby()` |
| `water.ts` | `waterPointsApi` | `setPotable()`, `setNonPotable()`, `setTesting()`, `setDepleted()` |
| `deceased.ts` | `deceasedPersonsApi` | `moveToMorgue()`, `identify()`, `deliverToFamily()`, `bury()` |
| `psychosocial.ts` | `psychosocialCasesApi` | `open()`, `followUp()`, `close()`, `refer()` |
| `eoc.ts` | `cascadeEventsApi` | `contain()`, `resolve()`, `monitor()` |
| `eoc.ts` | `searchSectorsApi` | `start()`, `complete()`, `verify()` |
| `eoc.ts` | `rescueTeamsApi` | `deploy()`, `standDown()`, `markFound()` |
| `eoc.ts` | `evacuationRoutesApi` | `open()`, `close()`, `block()` |
| `eoc.ts` | `interagencyTasksApi` | `assign()`, `start()`, `complete()` |
| `alerts.ts` | `weatherAlertsApi` | `activate()`, `deactivate()` |
| `alerts.ts` | `publicAlertsApi` | `publish()`, `unpublish()` |
| `alerts.ts` | `aerialOpsApi` | `start()`, `complete()`, `land()` |
| `alerts.ts` | `fuelEnergyApi` | `activate()`, `deactivate()` |

### Uso en Módulos React

```typescript
// Ejemplo: SupplyLogisticsModule
import { supplyInventoryApi, supplyRequestsApi } from '../api';

useEffect(() => {
  const unsub = supplyInventoryApi.subscribe(setInventory);
  return unsub;
}, []);

// Crear item
await supplyInventoryApi.create({ itemName: 'Agua', category: 'Agua', ... });

// Entregar solicitud (descuenta inventario automáticamente en batch)
await supplyRequestsApi.deliver(requestId, items);

// Ejemplo: EOC Dashboard
import { incidentsApi, searchSectorsApi } from '../api';
await incidentsApi.verify(incidentId);
await searchSectorsApi.complete(sectorId);

// Ejemplo: Reunificación Familiar
import { familyRequestsApi } from '../api';
const matches = await familyRequestsApi.findMatches('Juan Pérez');
```

---

## 📋 Changelog

| Versión | Commit | Mejoras |
|---------|--------|---------|
| **v3.4** | `b765566` | ReportsConsole lazy loading — 0 colecciones en mount, carga on-demand por tab con `loadedTabs` Set (~85% menos tiempo/memoria inicial) |
| **v3.3** | `036de48` | 98 tests unitarios Vitest + seguridad Firestore endurecida (auth reads, isShortStr, rangos numéricos) + docs usuario |
| **v3.2** | `7a28204` | API Layer tipada (13 archivos, 20+ métodos) + seguridad Firestore (auth updates/deletes) + mejoras funcionales |
| **v3.1** | `949d392` | 43 reportes PDF (28 nuevos) incluyendo suite ONU/OCHA |
| **v3.0** | `571cae6` | 35 módulos tácticos, 4 capas, 12 roles |
| **v2.0** | — | 23 módulos, code-splitting, chunk optimization |
| **v1.0** | — | 8 módulos base, PWA offline-first |

---

## 🙌 Agradecimientos

- **Dirección Nacional de Inteligencia Artificial — CAVECOM-E.ORG.VE** — Por su invaluable aporte técnico y estratégico en el desarrollo e implementación de esta plataforma.

## 🤝 Contribuciones

Las contribuciones ciudadanas para optimizar el rendimiento en redes degradadas, traducir manuales de supervivencia o ampliar el directorio hospitalario son bienvenidas.

<br />

<div align="center">
  <p>Desplegado bajo licencia abierta MIT — Desarrollado por y para la sociedad civil venezolana.</p>
  <p><strong><a href="https://ayudasismovzla.web.app">🌐 ayudasismovzla.web.app</a></strong></p>
</div>
