# Escalamiento Nacional e Integración Agentica (MCP) de SISMOVZLA

El objetivo de este plan es diseñar la arquitectura y la hoja de ruta para escalar SISMOVZLA desde una herramienta local/regional a una **Plataforma Nacional de Gestión de Riesgos y Desastres**. Además, se busca la interoperabilidad total: la capacidad de recibir datos de otras plataformas institucionales y, lo más innovador, exponer un **Servidor MCP (Model Context Protocol)** para que sistemas de Inteligencia Artificial y agentes autónomos puedan consultar e interactuar con los datos de SISMOVZLA de forma estandarizada.

> [!IMPORTANT]
> **Revisión del Usuario Requerida**
> Este plan propone la introducción de nuevos componentes en la nube (como Google Cloud Run y BigQuery) para manejar la escala nacional y el servidor MCP. Por favor, revisa las fases propuestas y confirma si la dirección estratégica se alinea con el presupuesto y recursos disponibles.

## Arquitectura Propuesta

Actualmente, SISMOVZLA utiliza una arquitectura *Serverless* basada en Firebase (Hosting, Auth, Firestore). Para lograr los nuevos objetivos, evolucionaremos hacia una arquitectura híbrida en Google Cloud Platform (GCP).

### 1. Capa de Datos e Inteligencia (Data Layer)
*   **Firestore:** Se mantendrá como la base de datos transaccional y de tiempo real para la aplicación web y móvil (ingresos, albergues, emergencias vivas).
*   **Google BigQuery:** Se implementará como el *Data Warehouse* nacional. Los datos históricos y masivos se sincronizarán desde Firestore hacia BigQuery para permitir análisis a gran escala y generación de reportes nacionales sin afectar el rendimiento de la app.

### 2. Capa de Integración (Ingestion Layer)
*   **API Gateway + Cloud Run/Functions:** Se desarrollará una API REST/GraphQL robusta.
*   **Webhooks de Entrada:** Puntos de conexión seguros (mediante API Keys o JWT) para que plataformas de terceros (hospitales, bomberos, sistemas meteorológicos, ONGs) puedan enviar alertas, actualizar inventarios o registrar víctimas de forma automatizada.

### 3. Servidor MCP (Model Context Protocol)
*   **El componente estrella:** Un servicio dedicado construido en Node.js o Python y alojado en **Google Cloud Run** (para escalabilidad automática).
*   **Propósito:** Exponer los datos de SISMOVZLA (ej. "dame la lista de albergues en estado crítico", "¿cuántos insumos médicos hay en Caracas?") como *Herramientas (Tools)* y *Recursos (Resources)* estándar de MCP.
*   **Consumidores:** Otros agentes de IA (como Claude de Anthropic, Gemini, o plataformas agenticas corporativas) podrán conectarse a este servidor MCP para razonar sobre la situación nacional de desastres en tiempo real y tomar decisiones o sugerir planes de acción.

## Análisis de Módulos (Nuevos y Modificaciones)

Para soportar esta nueva arquitectura, se requerirá intervenir el frontend y backend mediante la creación de nuevos módulos y la adaptación de los existentes:

### Módulos Adicionales (Nuevos)
1.  **Módulo de Gestión de API y Webhooks:** Un panel para que los administradores generen, revoquen y auditen las *API Keys* y *Tokens* que usarán las plataformas de terceros (hospitales, bomberos) para conectarse a SISMOVZLA.
2.  **Módulo de Configuración de Servidor MCP (Panel Agentico):** Interfaz para monitorear qué agentes de Inteligencia Artificial están conectados al Servidor MCP, cuántas consultas realizan, y establecer límites de acceso a datos sensibles (Data Boundaries).
3.  **Dashboard Analítico Nacional (BigQuery):** Un nuevo módulo de reportes diseñado específicamente para leer desde BigQuery. A diferencia del `ReportsConsoleModule` actual (que es operativo y en tiempo real), este módulo mostrará tendencias históricas, predicciones y comparativas anuales/mensuales a nivel de país.
4.  **Módulo de Mapeo Interinstitucional:** Herramienta para homologar los catálogos de datos externos con los de SISMOVZLA (ej. mapear el ID de un insumo médico del Ministerio de Salud con el ID interno de nuestra plataforma).

### Módulos a Modificar (Existentes)
1.  **`ReportsConsoleModule` y Dashboards Actuales:** Deberán modificarse para soportar *Lazy Loading* (carga diferida) y paginación masiva. A nivel nacional, traer todos los documentos de Firestore a la vez colapsará la memoria del navegador.
2.  **`AdminPanel` (Gestión de Usuarios):** Se debe refactorizar para soportar **Control de Acceso Basado en Roles (RBAC) Granular y Regional**. Los administradores estatales solo deberían ver y gestionar datos de su propio estado, y no a nivel nacional.
3.  **`SheltersModule` y `ShelterRequestsDashboard` (Albergues):** Deberán incorporar filtros obligatorios por Estado/Municipio y soportar metadatos que indiquen si el albergue fue sincronizado desde una fuente externa (ej. Protección Civil).
4.  **Modelos de Datos (Tipados TS):** Entidades como `Incident`, `Shelter`, y `Occupant` deberán ser modificadas para incluir nuevos campos obligatorios como `sourceSystem` (para identificar de qué plataforma vino el dato), `externalId`, y un índice geográfico fuerte (`regionCode` / `stateCode`) para optimizar las consultas a nivel nacional.

## Fases de Implementación

### FASE 1: Preparación Backend y Seguridad (Semanas 1-2)
*   Creación de entorno en Google Cloud Platform vinculado al proyecto de Firebase actual.
*   Diseño de arquitectura de microservicios usando **Google Cloud Run** o **Firebase Cloud Functions (Gen 2)**.
*   Implementación de un sistema de Autenticación de Máquina a Máquina (M2M) mediante **API Keys** y **Tokens OAuth** para asegurar que solo sistemas autorizados interactúen con el backend.

### FASE 2: API de Ingesta para Múltiples Plataformas (Semanas 3-4)
*   Desarrollo de los endpoints de ingesta (`/api/v1/incidents/ingest`, `/api/v1/shelters/update`, etc.).
*   Creación de un estándar de datos JSON para que los sistemas de bomberos, defensa civil y hospitales envíen información de forma unificada.
*   Implementación de validación de esquemas (ej. con Zod o Joi) para evitar que datos corruptos entren a SISMOVZLA.

### FASE 3: Sincronización y BigQuery (Semanas 5-6)
*   Configuración de **Firebase Extensions (Export to BigQuery)** para replicar colecciones críticas (ocupantes, refugios, incidentes).
*   Creación de vistas y queries optimizadas en BigQuery para soportar los Dashboards Nacionales.

### FASE 4: Desarrollo del Servidor MCP (Semanas 7-8)
*   Desarrollo del servidor utilizando el **MCP SDK**.
*   Implementación de **Resources:** (ej. `sismovzla://shelters/all` para proveer un volcado de refugios).
*   Implementación de **Tools:** (ej. `get_critical_incidents(state, severity)`, `allocate_supplies(shelterId, itemId)`).
*   Despliegue del servidor MCP en contenedor Docker dentro de Google Cloud Run, expuesto a través de HTTPS.

## Cronograma y Recursos Estimados

Para asegurar el éxito del escalamiento, proponemos el siguiente esquema de recursos y tiempos, asumiendo un equipo ágil dedicado:

### Equipo Requerido
*   **1 Arquitecto Cloud / DevOps:** Configuración de GCP, Cloud Run, y Seguridad M2M.
*   **2 Desarrolladores Full-Stack (React/Node.js):** Modificaciones a la plataforma existente y desarrollo de la API de ingesta.
*   **1 Desarrollador Especialista en IA/Datos:** Desarrollo del Servidor MCP y queries de BigQuery.
*   **1 Ingeniero de Datos:** Pipeline de sincronización Firestore -> BigQuery.

### Costos Estimados en Nube (GCP)
Al migrar a escala nacional e integrar IA, la cuota gratuita de Firebase no será suficiente. Se estima un presupuesto operativo mensual enfocado en:
1.  **Google Cloud Run:** Pago por uso (según volumen de peticiones de las API y el Servidor MCP).
2.  **Google BigQuery:** Costo por almacenamiento de terabytes de datos históricos y por volumen de consultas procesadas.
3.  **Firebase (Firestore):** Incremento de cuota por alto volumen de lectura/escritura a nivel nacional.

## Métricas de Éxito (KPIs)

Para evaluar si el escalamiento ha sido efectivo, mediremos:
1.  **Latencia de Ingesta:** Tiempo desde que una plataforma externa envía un dato hasta que aparece en SISMOVZLA (Objetivo: < 2 segundos).
2.  **Disponibilidad del Servidor MCP:** *Uptime* del servidor para interacciones agenticas (Objetivo: 99.9%).
3.  **Tasa de Sincronización:** Fiabilidad del volcado de datos de Firestore a BigQuery sin discrepancias.
4.  **Adopción Institucional:** Cantidad de plataformas externas (hospitales, bomberos) que logran enviar datos exitosamente vía API en el primer mes.

## Preguntas Abiertas

> [!WARNING]
> **Definiciones necesarias antes de iniciar:**
1.  **Plataformas de Terceros:** ¿Tienes mapeado cuáles serán las primeras plataformas o instituciones que enviarán datos a SISMOVZLA? (Conocer esto ayuda a diseñar el formato de los datos).
2.  **Seguridad MCP:** ¿El servidor MCP será público (para cualquier plataforma agentica de investigación) o estará restringido solo a agentes de IA del gobierno/instituciones aliadas?
3.  **Lenguaje del Backend:** Para el servidor MCP y las APIs, ¿prefieres que utilicemos **Node.js (TypeScript)** para mantener consistencia con el código actual, o **Python** (muy popular en el ecosistema de IA)?

## Plan de Verificación
*   **Pruebas de Carga:** Simularemos miles de peticiones por segundo en los endpoints de integración para garantizar que el escalamiento nacional soporte un desastre a gran escala.
*   **Pruebas de Integración MCP:** Utilizaremos un cliente MCP local y un LLM para interactuar conversacionalmente con el servidor MCP y verificar que la IA entiende y extrae los datos correctamente.
