<div align="center">

# 🚨 SISMOVZLA — Plataforma Táctica Comunitaria de Emergencia
**Nodo Civil Descentralizado para Mapeo de Daños, Triaje de Riesgos y Respuesta Ante Catástrofes Sísmicas**

[![Plataforma Oficial](https://img.shields.io/badge/Plataforma-sismovzla.web.app-FF9800?style=for-the-badge&logo=firebase&logoColor=black)](https://sismovzla.web.app)
[![PWA Offline-First](https://img.shields.io/badge/Arquitectura-PWA_Resiliente-4CAF50?style=for-the-badge&logo=pwa&logoColor=white)](#-arquitectura-resiliente-offline-first)
[![Stack](https://img.shields.io/badge/Frontend-React_19_%2B_TypeScript-3178C6?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Estilos](https://img.shields.io/badge/UI-Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Versión](https://img.shields.io/badge/Versión-1.3-D32F2F?style=for-the-badge)](https://sismovzla.web.app)

<br />
</div>

---

## 📖 Descripción General

**🌐 URL Oficial de la Plataforma:** [https://sismovzla.web.app/](https://sismovzla.web.app/)

**SismoVZLA** es una Aplicación Web Progresiva (**PWA**) de código abierto diseñada para operar como una red de contingencia humanitaria en Venezuela tras eventos sísmicos de gran escala.

Cuando ocurren terremotos severos, las infraestructuras de telecomunicaciones colapsan o se degradan dramáticamente (operando en velocidades mínimas 2G/EDGE). SismoVZLA resuelve este problema mediante una arquitectura **Offline-First** que permite a los ciudadanos guardar reportes, consultar manuales de auxilio y buscar familiares **completamente sin internet**, almacenando los datos en el disco local y sincronizándose con la nube tan pronto se recupera cualquier rastro de señal móvil.

---

## ✨ Características Críticas de la Plataforma

### 1. 🗺️ Mapa Táctico Georeferenciado en Tiempo Real
- **Visualización de Crisis**: Marcadores de colores por gravedad del incidente (**Gravedad 1 a 5**).
- **Estabilidad Táctica**: Implementación optimizada sobre Leaflet con control de estado en memoria. El mapa no salta ni recentra la cámara ante actualizaciones masivas de Firestore.
- **Ventanas Emergentes Persistentes**: Los popups permanecen abiertos continuamente.
- **Filtros Regionales**: Segmentación por estados (Caracas, La Guaira, Aragua, Carabobo, Otros).

### 2. 📡 Arquitectura Resiliente (Offline-First)
- **Persistencia en Disco**: Base de datos almacenada en el terminal del usuario mediante **IndexedDB**.
- **Cola de Transmisión Asincrónica**: Reportes guardados offline se retransmiten automáticamente al recuperar red.
- **Optimización de Ancho de Banda**: Compatible con redes 2G degradadas.

### 3. 🆘 Reporte Ciudadano Multimodal
- **Geolocalización Flexible**: GPS satelital automático o ingreso manual de coordenadas.
- **Notas de Voz Comprimidas**: Formato OPUS base64 (~4KB por nota).
- **Evidencia Visual**: Registro fotográfico comprimido con visor lightbox.

### 4. 🔎 Búsqueda de Personas y Desaparecidos
- Directorio comunitario de ciudadanos buscados, localizados o hospitalizados.
- Indexación mediante fonética slug para búsquedas instantáneas.

### 5. 🩸 Red Sanitaria de Voluntarios Donantes de Sangre
- Triaje clínico con criterios OMS y remisión hospitalaria directa.

---

### 6. 🏢 Sistema Integral de Gestión de Refugios y Centros de Acopio ⭐ ACTUALIZADO v1.3

#### 6.1 Directorio con Semáforo de Capacidad en Tiempo Real
- 🟢 Verde (Disponible) · 🟡 Amarillo (Casi lleno) · 🔴 Rojo (Colapsado)
- Filtros por Estado y Tipo (Refugio, Hospital, Centro de Acopio, Punto de Agua)
- Contador de ocupantes actualizado atómicamente en Firestore

#### 6.2 📋 Registro de Personas Albergadas (Padrón de Ocupantes) ⭐ NUEVO
- Registro nominal: Nombre, CI, Edad, Teléfono, Condición física, Necesidades médicas
- Incremento/decremento atómico del contador de ocupantes via `increment()` de Firestore
- Listado en tiempo real con chips de condición médica coloreados
- Acceso: botón **👥 VER PERSONAS** en cada tarjeta de refugio

#### 6.3 🚨 Gestión de Solicitudes de Ayuda ⭐ NUEVO
- 5 categorías: Atención Médica, Insumos Médicos, Alimentos, Logística, Otros
- Estado Abierto/Atendido con trazabilidad de reportante
- Operadores pueden resolver solicitudes con un clic
- Acceso: botón **🚨 VER SOLICITUDES** en cada tarjeta

#### 6.4 🗺️ Mapa Táctico de Refugios (Vista Independiente) ⭐ NUEVO
- Marcadores SVG personalizados: color según semáforo, emoji según tipo (⛺🏥📦💧)
- Popups con nombre, dirección, capacidad, ocupantes y enlace a Google Maps
- Vista alternativa de Lista con panel de ocupantes expandible
- **Exportación CSV** del padrón completo de personas albergadas
- Leyenda de mapa persistente

#### 6.5 📥 Plantillas CSV para Carga Masiva ⭐ NUEVO

| Archivo | Descripción |
|---|---|
| `plantilla_centro_acopio.csv` | Refugios y centros de acopio |
| `plantilla_personas_albergue.csv` | Padrón de personas albergadas |

#### 6.6 🔒 Control de Acceso por Rol

| Rol | Permisos |
|---|---|
| Ciudadano | Visualización pública |
| Voluntario (`VOLUNTARIO_VZLA`) | Registro de personas + solicitudes |
| Operador Táctico (`TACTICO_2026`) | Creación, actualización, eliminación, resolución |

---

### 7. 🛡️ Matriz de Roles de Seguridad
- **Voluntario** (`VOLUNTARIO_VZLA`): Lectura general y envío de reportes.
- **Operador Táctico** (`TACTICO_2026`): Verificación, despacho y edición en Firestore.
- **Coordinador/Admin** (`SISMO_CRISIS_ADMIN`): Administración absoluta.

### 8. 🏛️ Evaluación Estructural Post-Sismo (COVENIN 1756 / ATC-20)
- Dictamen de habitabilidad: 🟢 Habitable · 🟡 Restringido · 🔴 No Habitable
- Inspección A-F según COVENIN 1756, ATC-20 y FEMA 154
- Flujo guiado 4 pasos optimizado para táctil en campo

### 9. 🏥 Censo Hospitalario (OCR + Doble Chequeo)
- 9 centros asistenciales de Caracas y La Guaira georeferenciados
- Carga masiva por foto/OCR con IA Vision
- Alerta automática `⚠️ DOBLE CHEQUEO REQUERIDO` ante cédulas duplicadas en hospitales distintos

### 10. 🎨 Menú de Navegación Rediseñado ⭐ ACTUALIZADO v1.3
- **`flex-wrap`**: Tabs en múltiples filas, sin desbordamiento horizontal
- Labels claros: sin etiquetas crípticas `[01]`, `[05b]`
- Diferenciación: `MAPA TÁCTICO` (incidentes) vs `MAPA REFUGIOS`
- Iconos `w-4` con mayor área táctil
- Feedback: `scale-[1.02]` + glow de color al tab activo
- Subtítulo de contexto de sección activa

### 11. 📄 Consola de Bitácoras y Exportación PDF (A4)
- 6 tipos de reportes oficiales incluyendo Suite Ejecutiva Gubernamental (ONU/OCHA)
- Generación PDF Zero-Bloat con `window.print()` y `@media print`

### 12. 🔌 API REST de Integración (Node.js)
- Métodos `GET`, `POST`, `PUT` — Entidades: `/incidents`, `/shelters`, `/people`, `/patients`, `/donors`, `/evaluations`
- Seguridad via `x-api-key` — Inicio: `npm run api`

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Núcleo | React 19 + TypeScript 5 |
| Empaquetador | Vite 6 |
| UI e Iconos | Tailwind CSS v4 + Lucide React |
| Mapas | Leaflet |
| Base de Datos | Firebase Firestore Realtime |
| Hosting | Firebase Hosting |
| PWA Engine | serviceWorker + localStorage + IndexedDB |

---

## 🚀 Instalación y Desarrollo Local

1. **Clonar**:
   ```bash
   git clone https://github.com/gointeraction/sismovzla.git
   cd sismovzla
   ```

2. **Instalar**:
   ```bash
   npm install
   ```

3. **Configurar `.env`** (basado en `.env.example`):
   ```env
   VITE_FIREBASE_API_KEY="tu-api-key"
   VITE_FIREBASE_PROJECT_ID=sismovzla
   ```

4. **Desarrollo**:
   ```bash
   npm run dev
   ```

5. **Build de producción**:
   ```bash
   npm run build
   ```

6. **Desplegar**:
   ```bash
   npx firebase deploy --only hosting --project sismovzla
   ```

---

## 🤝 Contribuciones y Coordinación Civil

Las contribuciones ciudadanas para optimizar el rendimiento en redes degradadas, traducir manuales de supervivencia o ampliar el directorio hospitalario son bienvenidas.

<br />

<div align="center">
  <p>Desplegado bajo licencia abierta MIT — Desarrollado por y para la sociedad civil venezolana.</p>
  <p><strong><a href="https://sismovzla.web.app">🌐 sismovzla.web.app</a></strong></p>
</div>
