# SISMOVZLA - Documentación Oficial de la Plataforma

## 1. Visión General
**SISMOVZLA** es una Plataforma Integral de Gestión de Riesgos y Desastres diseñada para centralizar, coordinar y analizar la respuesta ante emergencias (terremotos, inundaciones, huracanes, etc.) en Venezuela. 

La plataforma facilita la toma de decisiones en tiempo real al consolidar información crítica proveniente de refugios, hospitales, centros de acopio, equipos de rescate y voluntarios, ofreciendo un entorno operativo unificado para el Centro de Operaciones de Emergencia (COE).

## 2. Tecnologías Core (Fase 1 - Actual)
Actualmente, la plataforma está construida bajo una arquitectura ágil y *Serverless*:
*   **Frontend:** React 18, TypeScript, Vite.
*   **Estilos y UI:** TailwindCSS, Lucide React (Iconos).
*   **Backend & Base de Datos:** Firebase (Firestore Database, Firebase Authentication, Firebase Hosting).
*   **Mapas y Geolocalización:** Leaflet (react-leaflet).
*   **Generación de Reportes:** jsPDF, html2canvas (Generación nativa de PDFs con gráficos y analíticas).

---

## 3. Módulos Operativos (Fase 1)
La plataforma cuenta con un ecosistema completo de módulos diseñados para abordar cada aspecto de una crisis humanitaria o desastre natural:

### 3.1. Gestión de Población y Refugios
*   **Módulo de Albergues:** Control de capacidad, censo de ocupantes, ingresos, salidas y alertas de sobrepoblación (Semáforo de Capacidad).
*   **Vivienda Temporal:** Asignación y gestión de alojamientos provisionales.
*   **Reunificación Familiar y Búsqueda de Personas:** Herramientas para registrar personas extraviadas y cruzar datos para reunificar familias separadas por el desastre.
*   **Protección Infantil:** Protocolos y seguimiento de menores no acompañados.

### 3.2. Salud y Asistencia Médica
*   **Triage y Gestión de Pacientes:** Clasificación de heridos por gravedad y derivación a centros de salud.
*   **Gestión de Hospitales:** Monitoreo de camas disponibles, quirófanos y suministros críticos en tiempo real.
*   **Apoyo Psicosocial:** Seguimiento de atención en salud mental para víctimas y rescatistas.
*   **Donantes de Sangre:** Registro de donantes y solicitudes urgentes de transfusión.
*   **Gestión de Fallecidos:** Protocolo de morgue, identificación y manejo digno de víctimas fatales.

### 3.3. Logística, Rescate y Operaciones
*   **Panel COE (Centro de Operaciones de Emergencia):** Dashboard central de mando para monitorear incidentes críticos.
*   **Búsqueda y Rescate (SAR):** Asignación de cuadrillas a zonas de desastre.
*   **Mapa Táctico y Rutas de Evacuación:** Visor geoespacial en tiempo real para visualizar incidentes, bloqueos viales y refugios seguros.
*   **Evaluación Estructural:** Registro de edificaciones colapsadas o en riesgo.
*   **Operaciones Aéreas:** Coordinación de vuelos de rescate, drones y entregas aéreas.
*   **Comunicaciones de Emergencia:** Estado de las redes de telecomunicaciones (antenas caídas, radios).
*   **Agua y Saneamiento (WASH):** Control de distribución de agua potable y letrinas en refugios.
*   **Combustible y Energía:** Monitoreo de plantas eléctricas y suministro de combustible para equipos de rescate.

### 3.4. Voluntariado, Donaciones y Sociedad Civil
*   **Logística de Suministros y Donaciones:** Control de inventario en centros de acopio (medicinas, alimentos, abrigo).
*   **Gestión de Voluntarios:** Registro, verificación de antecedentes, asignación de turnos y capacitaciones.
*   **Asistencia Legal:** Apoyo jurídico para pérdida de documentos y trámites de emergencia.
*   **Educación en Emergencias:** Continuidad educativa para niños en refugios.

### 3.5. Información Pública y Análisis
*   **Generador de Reportes PDF:** Motor avanzado que exporta Dashboards con gráficas comparativas (Ingresos vs Salidas) y demografía de edades para autoridades.
*   **Centro de Prensa y Alertas Públicas:** Emisión de comunicados oficiales para la ciudadanía.
*   **Alertas Meteorológicas:** Integración de datos del clima para prevenir crisis secundarias.
*   **Lecciones Aprendidas y Línea de Tiempo:** Registro histórico del desastre para auditorías y mejora continua.

---

## 4. Plan de Expansión a Nivel Nacional (Fase 2)
Para llevar a SISMOVZLA al siguiente nivel, la Fase 2 contempla una evolución arquitectónica diseñada para manejar datos a escala país, interoperar con otras instituciones gubernamentales/privadas y abrir la puerta a la Inteligencia Artificial.

### 4.1. Transición a Google Cloud Platform (GCP)
*   **BigQuery como Data Warehouse:** Los datos de Firestore se volcarán en BigQuery para permitir consultas analíticas masivas sobre millones de registros históricos sin degradar el rendimiento de la aplicación web.
*   **Cloud Run / Cloud Functions:** Creación de un backend robusto basado en microservicios para procesar cargas pesadas.

### 4.2. API de Ingesta e Interoperabilidad
*   Se desarrollará un **API Gateway** seguro (con API Keys y OAuth).
*   Permitirá que sistemas de terceros (Sistemas de Bomberos, Protección Civil, Red de Hospitales Privados) envíen información directamente a SISMOVZLA mediante **Webhooks** y formatos JSON estandarizados.

### 4.3. Servidor MCP (Model Context Protocol) e Inteligencia Artificial
*   Se construirá un **Servidor MCP** alojado en GCP.
*   **Propósito:** Exponer los datos de SISMOVZLA como *Herramientas* y *Recursos* para plataformas agenticas de IA (como Claude, Gemini o sistemas autónomos de gestión de crisis).
*   **Beneficio:** Las IAs podrán conectarse a la red nacional para responder preguntas complejas en tiempo real (ej. *"¿Cuál es la ruta más segura para enviar suero al Hospital Central considerando los colapsos viales actuales?"*) basándose en los datos vivos de SISMOVZLA.

### 4.4. Nuevos Módulos Administrativos
*   **Gestor de API y Webhooks:** Panel para emitir y revocar accesos a instituciones de terceros.
*   **Panel Agentico (Configuración MCP):** Interfaz para monitorear el consumo de los agentes de IA y definir límites de acceso a datos sensibles (Data Boundaries).
*   **Control de Acceso Granular (RBAC Regional):** Los usuarios administrativos tendrán roles limitados por estado o municipio para garantizar la privacidad y el orden jerárquico nacional.
