# SISMOVZLA - Documentación Oficial y Arquitectura de la Plataforma

## 1. Visión General y Propósito
**SISMOVZLA** (Sistema Integrado de Monitoreo y Operaciones de Venezuela) es una plataforma tecnológica integral diseñada para centralizar, coordinar y analizar la respuesta operativa ante emergencias a gran escala (terremotos, inundaciones, huracanes, y crisis humanitarias) en el territorio nacional.

Ante la fragmentación de la información durante un desastre, SISMOVZLA nace con el propósito de romper los silos informativos institucionales. Su objetivo principal es ofrecer un **Entorno Operativo Común (Common Operating Picture)** para el Centro de Operaciones de Emergencia (COE), permitiendo que autoridades, cuerpos de rescate, hospitales, ONGs y voluntarios compartan la misma realidad situacional en tiempo real, facilitando la toma de decisiones basada en datos concretos y acortando los tiempos de respuesta para salvar vidas.

---

## 2. Arquitectura Tecnológica (Fase 1 - Estado Actual)
En su fase operativa actual, la plataforma está diseñada para ser altamente reactiva, de rápida implementación y con costos de infraestructura variables. Está construida sobre una arquitectura *Serverless* (Sin Servidor) utilizando tecnologías web modernas:

### 2.1. Frontend (Capa de Presentación)
*   **React 18 & TypeScript:** Framework principal que garantiza una interfaz de usuario reactiva y un código fuertemente tipado para evitar errores en tiempo de ejecución, algo crítico en sistemas de emergencia.
*   **Vite:** Herramienta de construcción (build tool) de ultra alto rendimiento que permite tiempos de despliegue mínimos.
*   **TailwindCSS:** Framework de diseño utilitario que permite adaptar la interfaz a dispositivos móviles (Responsive Design) de forma ágil, permitiendo a los rescatistas usar la app desde el terreno con mala conexión.
*   **Lucide React:** Biblioteca de iconografía estandarizada.

### 2.2. Backend & Base de Datos (Capa de Datos)
*   **Firebase Firestore:** Base de datos NoSQL orientada a documentos en tiempo real. Permite que cuando un rescatista actualiza el estado de una vía o registra un herido, todos los monitores del COE se actualicen instantáneamente sin necesidad de recargar la página.
*   **Firebase Authentication:** Gestión centralizada de identidades (correo/contraseña, Google Auth), garantizando el acceso seguro al sistema.
*   **Firebase Hosting:** Red de distribución de contenido (CDN) global que asegura que la aplicación esté siempre disponible, incluso bajo picos masivos de tráfico.

### 2.3. Herramientas Especializadas
*   **Mapas y Geolocalización (Leaflet & react-leaflet):** Motor de renderizado geoespacial de código abierto que permite visualizar incidentes, albergues y rutas sobre mapas cartográficos interactivos.
*   **Motor de Generación de Reportes (jsPDF & html2canvas):** Sistema híbrido que renderiza complejos cuadros de mando (Dashboards HTML) y los convierte de manera nativa en documentos PDF de alta fidelidad. Estos documentos incluyen analíticas avanzadas, gráficas de barras comparativas agrupadas y segmentación demográfica para ser presentados a altos mandos gubernamentales.

---

## 3. Módulos Operativos (Fase 1 - Despliegue Actual)
SISMOVZLA está compuesto por más de 30 submódulos interconectados, agrupados en cinco grandes ejes de acción humanitaria:

### 3.1. Eje de Gestión de Población y Refugios
Este eje se encarga de monitorear el bienestar de los ciudadanos desplazados o afectados.
*   **Gestión de Albergues:** Módulo central que lleva el control estricto de la capacidad instalada frente a la ocupación real. Cuenta con un *Semáforo de Capacidad* (Verde, Amarillo, Rojo) que alerta al COE cuando un refugio está a punto de colapsar. Incluye censo detallado, gráficas dinámicas de Ingresos vs Salidas diarias y analítica demográfica (niños, adultos, ancianos).
*   **Vivienda Temporal:** Administra la transición de refugiados hacia viviendas provisionales, mapeando propiedades disponibles y asignaciones familiares.
*   **Búsqueda y Reunificación Familiar:** Una base de datos cruzada que permite registrar personas extraviadas ("Se Busca") y personas encontradas vivas/desorientadas, ejecutando algoritmos de coincidencia para reunir a las familias.
*   **Protección Infantil:** Herramienta dedicada a registrar menores de edad no acompañados, activando alertas a las autoridades competentes y a UNICEF para evitar redes de trata durante el caos.

### 3.2. Eje de Salud y Asistencia Médica
Monitorea la capacidad de respuesta del sistema sanitario para evitar el colapso de los centros de salud.
*   **Gestión de Hospitales:** Mapa en tiempo real del estado de los hospitales principales (camas UCI disponibles, operatividad de quirófanos, disponibilidad de energía de respaldo).
*   **Triage y Derivación de Pacientes:** Clasificación de víctimas en el sitio del desastre (Verde, Amarillo, Rojo, Negro) y su posterior derivación al centro de salud con capacidad, evitando el envío de pacientes graves a hospitales saturados.
*   **Apoyo Psicosocial:** Registro de intervenciones de salud mental tanto para víctimas que sufren estrés postraumático como para los propios rescatistas.
*   **Donantes de Sangre:** Base de datos activa que empareja solicitudes urgentes de transfusión con donantes registrados geográficamente cercanos.
*   **Gestión de Fallecidos:** Módulo forense para el registro de cadáveres recuperados, resguardo de pertenencias, identificación dactilar/fotográfica y traslado a morgues temporales.

### 3.3. Eje de Logística, Rescate y Operaciones (El COE)
El corazón táctico de la plataforma.
*   **Panel COE (Centro de Operaciones de Emergencia):** El cuadro de mando principal. Unifica las alertas rojas de todos los módulos en una sola pantalla para los tomadores de decisión.
*   **Mapa Táctico y Evaluaciones Estructurales:** Un sistema de información geográfica (SIG) que localiza edificios colapsados, vías bloqueadas y zonas de riesgo. Los ingenieros estructurales marcan edificios habitables o a demoler.
*   **Búsqueda y Rescate (SAR):** Coordinación de escuadrones de rescate, asignación de cuadrículas de búsqueda y rastreo canino.
*   **Operaciones Aéreas:** Control de vuelos de helicópteros de evacuación aeromédica y drones de reconocimiento, asegurando corredores aéreos.
*   **Agua, Saneamiento y Energía:** Mapeo de la infraestructura crítica. ¿Qué zonas no tienen luz? ¿Qué refugios necesitan camiones cisterna urgentes o mantenimiento de letrinas?

### 3.4. Eje de Sociedad Civil y Suministros
Maneja la ayuda humanitaria y el esfuerzo ciudadano.
*   **Logística de Suministros (Inventario):** Control de entradas y salidas en centros de acopio. Rastrea medicinas, kits de higiene, alimentos no perecederos y frazadas para evitar desabastecimiento en refugios.
*   **Gestión y Verificación de Voluntarios:** Base de datos de ciudadanos dispuestos a ayudar. Incluye verificación de habilidades (médicos, ingenieros, choferes), validación de identidad y asignación de turnos operativos para evitar fatiga extrema.
*   **Asistencia Legal y Lecciones Aprendidas:** Apoyo para reposición de documentos perdidos en el desastre. Registro formal de errores y aciertos operativos ("Post-Mortem") para mejorar futuras respuestas.

---

## 4. Plan de Expansión y Arquitectura a Nivel Nacional (Fase 2)
Dado el volumen masivo de datos que genera un desastre a nivel nacional y la necesidad de interoperar con múltiples agencias estatales (Protección Civil, Ministerios, ONGs Internacionales), SISMOVZLA evolucionará hacia una arquitectura híbrida GCP de escala corporativa.

### 4.1. Modernización de la Capa de Datos (Data Lake & Warehouse)
*   **De Firestore a BigQuery:** Firestore seguirá manejando el tiempo real (las operaciones tácticas), pero todos los datos se replicarán mediante tuberías automatizadas (*ETL Pipelines*) hacia **Google BigQuery**.
*   **Analítica Nacional:** BigQuery actuará como el Data Warehouse nacional, permitiendo ejecutar análisis sobre millones de registros históricos en milisegundos. Se creará un nuevo "Dashboard Nacional" alimentado por BigQuery para mostrar tendencias predictivas, mapas de calor agregados y reportes anuales sin consumir cuotas operativas de la base de datos principal.

### 4.2. Capa de Ingesta Interinstitucional (API Gateway)
Para que SISMOVZLA sea la fuente única de la verdad, debe poder recibir datos de sistemas que no controla.
*   **Arquitectura de Microservicios:** Se desplegarán contenedores en **Google Cloud Run** para manejar APIs REST y GraphQL de alto rendimiento.
*   **Webhooks y Endpoints de Terceros:** Se establecerán puertos de entrada seguros para que, por ejemplo, el sistema interno del Cuerpo de Bomberos envíe automáticamente un JSON a SISMOVZLA cada vez que despachan una unidad, reflejándose instantáneamente en el Mapa Táctico.
*   **Módulo de Gestión de API:** Un nuevo panel administrativo para emitir *API Keys* y *Tokens JWT* a instituciones aliadas, permitiendo revocar accesos y auditar quién envía qué dato.

### 4.3. Servidor MCP e Interoperabilidad Agentica (El Salto a la IA)
La evolución más radical será la implementación del **Model Context Protocol (MCP)**, convirtiendo a SISMOVZLA en una plataforma "AI-Ready" (Lista para Inteligencia Artificial).
*   **El Servidor MCP:** Un servicio dedicado (desarrollado en Node.js o Python) alojado en Google Cloud Run. Su función es traducir toda la base de datos de SISMOVZLA al protocolo estándar MCP.
*   **Exposición de Herramientas (Tools):** El servidor expondrá funciones ejecutables por IAs. Ejemplos: `get_active_shelters_by_state(state)`, `check_hospital_capacity(hospitalId)`, `dispatch_rescue_team(coordinates)`.
*   **Integración con LLMs:** Agentes autónomos o modelos fundacionales (como Claude de Anthropic o Gemini de Google) instalados en centros de mando podrán conectarse a este servidor.
*   **Casos de Uso Agentico:** Un comandante del COE podrá abrir un chat con una IA conectada al MCP y pedirle: *"Analiza todos los hospitales de Caracas y dime cuál tiene camas UCI disponibles y generador eléctrico funcionando, y luego redacta la orden de traslado para el paciente X"*. La IA usará el Servidor MCP de SISMOVZLA para consultar los datos reales y redactar la orden en segundos.

### 4.4. Control de Acceso Basado en Roles (RBAC Regional)
A escala nacional, la seguridad de la información es vital.
*   **Partición por Estados/Municipios:** Se refactorizará el sistema de autenticación para que un coordinador regional (ej. Mérida) solo tenga permisos de lectura/escritura sobre incidentes y refugios de su estado. 
*   **Homologación de Datos:** Se implementarán catálogos maestros para estandarizar los nombres de hospitales, tipos de insumos y jerarquías, evitando que datos sucios de plataformas de terceros corrompan la base de datos nacional.

## 5. Próximos Pasos Técnicos
El diseño fundacional ha sido completado y documentado. Para materializar la Fase 2, el equipo técnico deberá proceder con la configuración del proyecto en Google Cloud Platform, el levantamiento del ecosistema de Cloud Run y la redacción de los esquemas (Schemas) de validación para las APIs interinstitucionales.
