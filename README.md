<div align="center">

# 🚨 SISMOVZLA — Plataforma Táctica Comunitaria de Emergencia
**Nodo Civil Descentralizado para Mapeo de Daños, Triaje de Riesgos y Respuesta Ante Catástrofes Sísmicas**

[![Plataforma Oficial](https://img.shields.io/badge/Plataforma-ayudasismovzla.web.app-FF9800?style=for-the-badge&logo=firebase&logoColor=black)](https://ayudasismovzla.web.app)
[![PWA Offline-First](https://img.shields.io/badge/Arquitectura-PWA_Resiliente-4CAF50?style=for-the-badge&logo=pwa&logoColor=white)](#-arquitectura-resiliente-offline-first)
[![Stack](https://img.shields.io/badge/Frontend-React_19_%2B_TypeScript-3178C6?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Versión](https://img.shields.io/badge/Versión-2.0-D32F2F?style=for-the-badge)](https://ayudasismovzla.web.app)

<br />
</div>

---

## 📖 Descripción General

**🌐 URL Oficial de la Plataforma:** [https://ayudasismovzla.web.app/](https://ayudasismovzla.web.app/)

**SismoVZLA** es una Aplicación Web Progresiva (**PWA**) de código abierto diseñada para operar como una red de contingencia humanitaria en Venezuela tras eventos sísmicos de gran escala.

La plataforma cubre **23 módulos tácticos** organizados en 3 capas: **Coordinación**, **Apoyo** y **Logística**, con **26 colecciones Firestore** y un sistema de **7 roles tácticos** especializados.

Cuando ocurren terremotos severos, las infraestructuras de telecomunicaciones colapsan. SismoVZLA resuelve este problema mediante una arquitectura **Offline-First** que permite a los ciudadanos guardar reportes, consultar manuales de auxilio y buscar familiares **completamente sin internet**.

---

## 🗂️ Mapa de Módulos Tácticos (v2.0)

### Capa 1 — Coordinación

| # | Módulo | Descripción | Colección Firestore |
|---|--------|-------------|---------------------|
| 00 | 🏢 **Centro de Operaciones (EOC)** | Dashboard ejecutivo con KPIs en tiempo real: incidentes, triaje, rutas evacuación, refugios, búsqueda y rescate | `incidents`, `triage_patients`, `evacuation_routes`, `shelters`, `search_sectors`, `cascade_events` |
| 01 | 🗺️ **Mapa de Incidentes** | Mapa táctico georeferenciado con filtros por estado, gravedad y tipo | `incidents` |
| 02 | 📝 **Formulario de Reporte** | Registro ciudadano con GPS automático, notas de voz y fotos comprimidas | `incidents` |
| 03 | 🔎 **Búsqueda de Personas** | Directorio de ciudadanos buscados, localizados o hospitalizados | `people_search` |
| 04 | 🏠 **Directorio de Refugios** | Semáforo de capacidad en tiempo real (🟢🟡🔴) | `shelters`, `shelter_occupants` |
| 05 | 🗺️ **Mapa Táctico de Refugios** | Marcadores SVG por tipo con popups y Google Maps | `shelters` |
| 06 | 🆘 **Auxilios y Directorio de Emergencia** | Manuales de supervivencia y contactos de emergencia | Estático |
| 09 | 📊 **Consola de Reportes** | 13 reportes PDF oficiales incluyendo suite ONU/OCHA | Multi-colección |

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
| 19 | 🙋 **Voluntarios y Donaciones** | Registro de voluntarios y donaciones con tracking | `volunteers_registry`, `donations` |
| 20 | 🤝 **Coordinación Interagencial** | Tareas inter-agencia con asignación y seguimiento | `interagency_tasks` |
| 21 | 🚁 **Operaciones Aéreas** | Drones, helicópteros, zonas prohibidas, misiones | `aerial_operations` |
| 22 | ⛽ **Combustible y Energía** | Gasolineras, generadores, estado de combustible | `fuel_energy_points` |

---

## ✨ Características de la Plataforma v2.0

### 🏗️ Arquitectura Técnica

| Característica | Detalle |
|---|---|
| **Code-Splitting** | 23 módulos lazy-loaded con `React.lazy` + `Suspense` |
| **Skeletons Contextuales** | Esqueleto visual por módulo durante carga (tabla, mapa, dashboard, formulario) |
| **Error Boundary** | Captura de errores por módulo con botón de reintento |
| **Chunk Optimization** | Main bundle: 213 kB (vs 1,699 kB v1) — **-87%** |
| **Firebase SDK Separado** | Chunk independiente de 772 kB con cache propia |
| **Geolocalización Centralizada** | Hook `useGeolocation` compartido en 9 módulos |
| **Exportación PDF** | `jsPDF` + `jspdf-autotable` en todos los módulos con theme rojo institucional |

### 🗺️ Mapa Táctico Georeferenciado
- Marcadores de colores por gravedad (**Gravedad 1 a 5**)
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

### Roles Tácticos Nuevos (v2.0)

| Rol | Token | Especialidad |
|---|---|---|
| 🏥 Triage Médico | `TRIAGE_MEDICO` | Triaje de víctimas, gestión de pacientes |
| 🚑 Coordinador Rescate | `RESCATE_COORD` | Búsqueda y rescate, sectores SAR |
| 📦 Logística Admin | `LOGISTICA_ADMIN` | Inventario, suministros, distribución |
| 📡 Operador Radio | `RADIO_OP` | Comunicaciones de emergencia |
| 🔬 Forense | `FORENSE` | Gestión de fallecidos, cadena de custodia |
| 🧠 Psicosocial | `PSICOSOCIAL` | Apoyo psicológico, derivación |
| 🚁 Coordinador Aéreo | `AEREO_COORD` | Operaciones con drones y helicópteros |

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Núcleo | React 19 + TypeScript 5.8 |
| Empaquetador | Vite 6.4 |
| UI | Tailwind CSS v4 + Lucide React |
| Mapas | Leaflet |
| PDF | jsPDF + jspdf-autotable |
| Base de Datos | Firebase Firestore (26 colecciones) |
| Hosting | Firebase Hosting (2 nodos) |
| Admin SDK | Firebase Admin v14 |
| PWA | serviceWorker + localStorage + IndexedDB |

---

## 📊 Métricas de Rendimiento

| Métrica | v1.0 | v2.0 | Mejora |
|---------|------|------|--------|
| Main bundle | 1,699 kB | 213 kB | **-87%** |
| Chunks lucide | 27 × 0.3kB | 1 × 45kB | Consolidados |
| Firebase | En main | Chunk separado | Cache independiente |
| Build time | ~7s | ~5s | -28% |
| Módulos | 8 | 23 | +15 |
| Colecciones | 14 | 26 | +12 |
| Roles | 4 | 11 | +7 |

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

# Desplegar nodo principal
npx firebase deploy --only hosting --project sismovzla

# Desplegar nodo espejo
npx firebase deploy --only hosting --project ayudasismovzla
```

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
