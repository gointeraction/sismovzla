# 🔴 SISMOVZLA — PLATAFORMA TÁCTICA DE CONTINGENCIA CIVIL
**Sistema de Gestión de Emergencias Sismológicas y Respuesta Humanitaria**
**Versión:** v3.4 (Estándar de Despliegue Resiliente)
**URL Oficial:** `ayudasismovzla.web.app`

---

## 📑 ÍNDICE DE PRESENTACIÓN
1. **Visión General y Propósito**
2. **Arquitectura Técnica y Resiliencia**
3. **Ecosistema de Módulos Tácticos (35 Módulos)**
   - Capa 1: Centro de Operaciones y Coordinación
   - Capa 2: Operaciones de Rescate y Salud
   - Capa 3: Logística, Suministros y Servicios Vitales
   - Capa 4: Apoyo Ciudadano, Legal y Social
4. **Consola de Reportes Ejecutivos (43 Reportes PDF)**
5. **Capa de APIs Tipadas y Seguridad Firestore**
6. **Sistema de Roles y Gobernanza Táctica**
7. **Métricas de Implementación y Calidad**

---

## 1. 🌐 VISIÓN GENERAL Y PROPÓSITO
SISMOVZLA es una **Progressive Web App (PWA)** diseñada para operar en condiciones extremas de degradación de infraestructura tecnológica tras un evento sísmico en Venezuela (Eje Central).

### Objetivos Estratégicos:
- **Descentralización de la Información:** Evitar el colapso de centros de datos únicos mediante persistencia local.
- **Interoperabilidad Táctica:** Unificar la comunicación entre Protección Civil, Bomberos, Voluntarios y Organismos Internacionales (ONU/OCHA).
- **Toma de Decisiones Basada en Datos:** Transformar reportes ciudadanos en manifiestos técnicos (COVENIN 1756) y operativos (SAR/USAR).

---

## 2. 🏗️ ARQUITECTURA TÉCNICA Y RESILIENCIA
La plataforma no es una web convencional, es una **herramienta de campo**.

### Pilares Tecnológicos:
- **Frontend:** React 19 + TypeScript 5.8 + Tailwind v4 (Optimizado para carga rápida).
- **Backend-as-a-Service:** Firebase Firestore (Sincronización en tiempo real).
- **Modo Offline-First:** 
  - Uso de **IndexedDB** para almacenamiento local persistente.
  - **Cola de Contingencia Local:** Los reportes se guardan en el dispositivo y se transmiten automáticamente al detectar red (2G/EDGE/WiFi).
- **Carga Diferida (Lazy Loading):** Implementación de `React.lazy` y `Suspense` para asegurar que la app sea usable incluso con memoria RAM limitada.
- **Renderizado de Reportes:** Motor de generación de PDF en cliente (Zero-Bundle-Bloat) utilizando `window.open` y plantillas HTML optimizadas para A4.

---

## 3. 🛠️ ECOSISTEMA DE MÓDULOS TÁCTICOS
La plataforma se organiza en **35 módulos especializados**, distribuidos en 4 capas operativas.

### 🔴 CAPA 1: COORDINACIÓN Y EOC (Centro de Operaciones de Emergencia)
*Enfoque: Mando, Control y Visibilidad Global.*

- **EOC Dashboard:** Tablero maestro con KPIs de incidentes activos, verificados y distribución regional.
- **Mapa de Incidentes (Táctico):** Visualización geoespacial de daños con filtros de gravedad y estado.
- **Cascade Timeline:** Registro cronológico de eventos secundarios (réplicas, incendios, fugas de gas).
- **Coordinación Interagencial:** Gestión de tareas entre agencias (Salud, WASH, Logística) y clusters de ONU.
- **Consola de Reportes:** Hub central de exportación de manifiestos oficiales.
- **Alertas Públicas:** Sistema de difusión de avisos críticos a la ciudadanía.
- **Centro de Prensa:** Gestión de boletines oficiales para evitar la desinformación.
- **Lecciones Aprendidas (AAR):** Registro de revisiones post-incidente para mejora de protocolos.
- **Capacitación:** Gestión de simulacros y entrenamiento de brigadas.

### 🟠 CAPA 2: OPERACIONES DE RESCATE Y SALUD
*Enfoque: Salvamento de Vidas y Triaje Médico.*

- **Triaje de Víctimas (START/JumpSTART):** Clasificación rápida de heridos (Rojo, Amarillo, Verde, Negro).
- **Búsqueda y Rescate (SAR/USAR):** Gestión de sectores de búsqueda, cuadrículas y equipos K9/Técnicos.
- **Registro Hospitalario:** Censo de pacientes ingresados con detección de duplicados (Doble Chequeo).
- **Banco de Sangre:** Directorio de donantes aptos según criterios OMS.
- **Gestión de Fallecidos:** Flujo completo desde la recuperación hasta la entrega a familiares (Identificación Forense).
- **Apoyo Psicosocial:** Registro de crisis y seguimiento de salud mental.
- **Protección Infantil:** Rastreo de menores no acompañados y asignación de tutores temporales.
- **Operaciones Aéreas:** Control de misiones de drones y helicópteros (Zonas de No Vuelo).

### 🟢 CAPA 3: LOGÍSTICA Y SERVICIOS VITALES
*Enfoque: Sostenibilidad de la Vida y Recursos.*

- **Logística de Suministros:** Control de inventario en almacenes y gestión de solicitudes con auto-descuento.
- **Agua y Saneamiento (WASH):** Mapeo de puntos de agua potable, plantas y letrinas.
- **Combustible y Energía:** Monitoreo de gasolineras operativas y plantas eléctricas.
- **Directorios de Refugios:** Gestión de plazas disponibles y necesidades críticas por centro.
- **Mapa Táctico de Refugios:** Visualización de capacidad y estado de centros de acopio.
- **Vivienda Temporal:** Registro de casas de familia y campamentos para desplazados.
- **Rutas de Evacuación:** Monitoreo de vías bloqueadas y rutas alternas.
- **Recursos Geográficos:** Mapa de activos críticos (maquinaria pesada, generadores).

### 🔵 CAPA 4: APOYO CIUDADANO Y SOCIAL
*Enfoque: Derechos, Familia y Educación.*

- **Búsqueda de Personas:** Portal de reporte de desaparecidos con cruce de datos.
- **Reunificación Familiar:** Gestión de solicitudes para reintegrar núcleos familiares.
- **Asistencia Legal:** Trámites de actas de defunción, propiedad y seguros.
- **Educación y Escuelas:** Censo de daños en infraestructura escolar y centros educativos.
- **Guías de Supervivencia:** Manuales de primeros auxilios y protocolos de emergencia offline.
- **Voluntariado y Donaciones:** Registro de habilidades de voluntarios y trazabilidad de donativos.
- **Turnos de Voluntarios:** Gestión de horarios y asignaciones en campo.
- **Reporte Ciudadano:** Formulario de entrada rápida para alertas de daños.
